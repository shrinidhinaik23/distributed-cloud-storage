package com.nidhi.distributedstorage.master;

import com.nidhi.distributedstorage.model.FileMetadata;
import com.nidhi.distributedstorage.repository.FileMetadataRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/master")
@Profile("master")
@CrossOrigin(origins = "*")
public class MasterController {

    private final String[] storageNodes = {
            "http://localhost:8080",
            "http://localhost:8081",
            "http://localhost:8082"
    };

    private int currentNodeIndex = 0;

    private final FileMetadataRepository fileMetadataRepository;

    public MasterController(FileMetadataRepository fileMetadataRepository) {
        this.fileMetadataRepository = fileMetadataRepository;
    }

    @GetMapping("/test")
    public String test() {
        return "Master is running";
    }

    @GetMapping("/modes")
    public String getModes() {
        return "Available modes: replication, load_balancing";
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mode", defaultValue = "replication") String mode,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("Upload failed: file is empty");
        }

        String normalizedMode = mode.trim().toLowerCase();
        if (!normalizedMode.equals("replication") && !normalizedMode.equals("load_balancing")) {
            return ResponseEntity.badRequest()
                    .body("Invalid mode. Use 'replication' or 'load_balancing'");
        }

        String userEmail = authentication.getName();

        if (normalizedMode.equals("replication")) {
            return uploadWithReplication(file, userEmail);
        } else {
            return uploadWithLoadBalancing(file, userEmail);
        }
    }

    private ResponseEntity<String> uploadWithReplication(MultipartFile file, String userEmail) {
        RestTemplate restTemplate = new RestTemplate();
        StringBuilder result = new StringBuilder();

        for (String nodeBase : storageNodes) {
            int port = Integer.parseInt(nodeBase.split(":")[2]);

            try {
                String healthUrl = nodeBase + "/storage/health";
                ResponseEntity<String> healthResponse =
                        restTemplate.getForEntity(healthUrl, String.class);

                if (!"OK".equals(healthResponse.getBody())) {
                    fileMetadataRepository.save(
                            new FileMetadata(file.getOriginalFilename(), port, "NOT_HEALTHY", "replication", userEmail)
                    );
                    result.append("Node ").append(port).append(" not healthy\n");
                    continue;
                }

                String uploadUrl = nodeBase + "/storage/upload";

                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("file", file.getResource());

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);

                HttpEntity<MultiValueMap<String, Object>> request =
                        new HttpEntity<>(body, headers);

                ResponseEntity<String> uploadResponse =
                        restTemplate.postForEntity(uploadUrl, request, String.class);

                String responseBody = uploadResponse.getBody() != null ? uploadResponse.getBody() : "";

                if (uploadResponse.getStatusCode().is2xxSuccessful()
                        && responseBody.startsWith("Uploaded:")) {

                    fileMetadataRepository.save(
                            new FileMetadata(file.getOriginalFilename(), port, "UPLOADED", "replication", userEmail)
                    );

                    result.append("Replicated to node ").append(port).append("\n");
                } else {
                    fileMetadataRepository.save(
                            new FileMetadata(file.getOriginalFilename(), port, "FAILED", "replication", userEmail)
                    );
                    result.append("Upload failed on node ").append(port)
                            .append(": ").append(responseBody).append("\n");
                }

            } catch (Exception e) {
                fileMetadataRepository.save(
                        new FileMetadata(file.getOriginalFilename(), port, "FAILED", "replication", userEmail)
                );
                result.append("Upload exception on node ").append(port)
                        .append(": ").append(e.getMessage()).append("\n");
            }
        }

        return ResponseEntity.ok(result.toString());
    }

    private ResponseEntity<String> uploadWithLoadBalancing(MultipartFile file, String userEmail) {
        RestTemplate restTemplate = new RestTemplate();

        int attempts = 0;
        int totalNodes = storageNodes.length;

        while (attempts < totalNodes) {
            String nodeBase = storageNodes[currentNodeIndex];
            int port = Integer.parseInt(nodeBase.split(":")[2]);

            currentNodeIndex = (currentNodeIndex + 1) % totalNodes;

            try {
                String healthUrl = nodeBase + "/storage/health";
                ResponseEntity<String> healthResponse =
                        restTemplate.getForEntity(healthUrl, String.class);

                if (!"OK".equals(healthResponse.getBody())) {
                    fileMetadataRepository.save(
                            new FileMetadata(file.getOriginalFilename(), port, "NOT_HEALTHY", "load_balancing", userEmail)
                    );
                    attempts++;
                    continue;
                }

                String uploadUrl = nodeBase + "/storage/upload";

                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("file", file.getResource());

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);

                HttpEntity<MultiValueMap<String, Object>> request =
                        new HttpEntity<>(body, headers);

                ResponseEntity<String> uploadResponse =
                        restTemplate.postForEntity(uploadUrl, request, String.class);

                String responseBody = uploadResponse.getBody() != null ? uploadResponse.getBody() : "";

                if (uploadResponse.getStatusCode().is2xxSuccessful()
                        && responseBody.startsWith("Uploaded:")) {

                    fileMetadataRepository.save(
                            new FileMetadata(file.getOriginalFilename(), port, "UPLOADED", "load_balancing", userEmail)
                    );

                    return ResponseEntity.ok("Load-balanced upload to node " + port);
                } else {
                    fileMetadataRepository.save(
                            new FileMetadata(file.getOriginalFilename(), port, "FAILED", "load_balancing", userEmail)
                    );
                }

            } catch (Exception e) {
                fileMetadataRepository.save(
                        new FileMetadata(file.getOriginalFilename(), port, "FAILED", "load_balancing", userEmail)
                );
            }

            attempts++;
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("All storage nodes are unavailable");
    }

    @GetMapping("/metadata")
    public List<FileMetadata> getMetadata() {
        return fileMetadataRepository.findAll();
    }

    @GetMapping("/files/my")
    public ResponseEntity<List<FileMetadata>> getMyFiles(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String userEmail = authentication.getName();
        return ResponseEntity.ok(fileMetadataRepository.findByUserEmail(userEmail));
    }

    @DeleteMapping("/delete/{filename}")
    public ResponseEntity<String> deleteFromAllNodes(@PathVariable String filename, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        RestTemplate restTemplate = new RestTemplate();
        StringBuilder result = new StringBuilder();

        try {
            String userEmail = authentication.getName();

            List<FileMetadata> matchingFiles = fileMetadataRepository.findByUserEmail(userEmail).stream()
                    .filter(f -> filename.equals(f.getFileName()) && "UPLOADED".equals(f.getStatus()))
                    .toList();

            if (matchingFiles.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("No uploaded metadata found for file: " + filename);
            }

            List<Integer> deletedPorts = new ArrayList<>();

            for (FileMetadata metadata : matchingFiles) {
                int port = metadata.getNodePort();

                if (deletedPorts.contains(port)) {
                    continue;
                }

                try {
                    String deleteUrl = "http://localhost:" + port + "/storage/delete/" + filename;

                    ResponseEntity<String> response = restTemplate.exchange(
                            deleteUrl,
                            HttpMethod.DELETE,
                            null,
                            String.class
                    );

                    if (response.getStatusCode().is2xxSuccessful()) {
                        result.append("Deleted from node ").append(port).append("\n");
                        deletedPorts.add(port);
                    } else {
                        result.append("Failed on node ").append(port).append("\n");
                    }

                } catch (Exception e) {
                    result.append("Delete exception on node ")
                            .append(port)
                            .append(": ")
                            .append(e.getMessage())
                            .append("\n");
                }
            }

            List<FileMetadata> allUserFiles = fileMetadataRepository.findByUserEmail(userEmail);
            for (FileMetadata fileMetadata : allUserFiles) {
                if (filename.equals(fileMetadata.getFileName())) {
                    fileMetadataRepository.deleteById(fileMetadata.getId());
                }
            }

            result.append("Deleted metadata from database for file: ").append(filename);
            return ResponseEntity.ok(result.toString());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Master delete failed: " + e.getMessage());
        }
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<ByteArrayResource> downloadFromAvailableNode(
            @PathVariable String filename,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        RestTemplate restTemplate = new RestTemplate();
        String userEmail = authentication.getName();

        List<FileMetadata> metadataList = fileMetadataRepository.findByUserEmail(userEmail).stream()
                .filter(f -> filename.equals(f.getFileName()) && "UPLOADED".equals(f.getStatus()))
                .toList();

        if (metadataList.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Set<Integer> candidatePorts = new LinkedHashSet<>();
        for (FileMetadata metadata : metadataList) {
            candidatePorts.add(metadata.getNodePort());
        }

        for (Integer port : candidatePorts) {
            try {
                String downloadUrl = "http://localhost:" + port + "/storage/download/" + filename;

                ResponseEntity<byte[]> response = restTemplate.exchange(
                        downloadUrl,
                        HttpMethod.GET,
                        null,
                        byte[].class
                );

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    ByteArrayResource resource = new ByteArrayResource(response.getBody());

                    return ResponseEntity.ok()
                            .contentType(MediaType.APPLICATION_OCTET_STREAM)
                            .header(HttpHeaders.CONTENT_DISPOSITION,
                                    "attachment; filename=\"" + filename + "\"")
                            .contentLength(response.getBody().length)
                            .body(resource);
                }

            } catch (Exception e) {
                System.out.println("Node " + port + " download failed: " + e.getMessage());
            }
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }
    @GetMapping("/preview/{filename}")
    public ResponseEntity<ByteArrayResource> previewFromAvailableNode(
            @PathVariable String filename,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        RestTemplate restTemplate = new RestTemplate();
        String userEmail = authentication.getName();

        List<FileMetadata> metadataList = fileMetadataRepository.findByUserEmail(userEmail).stream()
                .filter(f -> filename.equals(f.getFileName()) && "UPLOADED".equals(f.getStatus()))
                .toList();

        if (metadataList.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Set<Integer> candidatePorts = new LinkedHashSet<>();
        for (FileMetadata metadata : metadataList) {
            candidatePorts.add(metadata.getNodePort());
        }

        for (Integer port : candidatePorts) {
            try {
                String previewUrl = "http://localhost:" + port + "/storage/preview/" + filename;

                ResponseEntity<byte[]> response = restTemplate.exchange(
                        previewUrl,
                        HttpMethod.GET,
                        null,
                        byte[].class
                );

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    ByteArrayResource resource = new ByteArrayResource(response.getBody());

                    MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
                    List<String> contentTypes = response.getHeaders().get(HttpHeaders.CONTENT_TYPE);

                    if (contentTypes != null && !contentTypes.isEmpty()) {
                        try {
                            mediaType = MediaType.parseMediaType(contentTypes.get(0));
                        } catch (Exception ignored) {
                        }
                    }

                    return ResponseEntity.ok()
                            .contentType(mediaType)
                            .header(HttpHeaders.CONTENT_DISPOSITION,
                                    "inline; filename=\"" + filename + "\"")
                            .contentLength(response.getBody().length)
                            .body(resource);
                }

            } catch (Exception e) {
                System.out.println("Node " + port + " preview failed: " + e.getMessage());
            }
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }
}