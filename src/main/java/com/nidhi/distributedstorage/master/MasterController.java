package com.nidhi.distributedstorage.master;

import com.nidhi.distributedstorage.model.FileMetadata;
import com.nidhi.distributedstorage.repository.FileMetadataRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

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
        return "Master Node Running!";
    }

    @GetMapping("/modes")
    public String getModes() {
        return "Available modes: replication, load_balancing";
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mode", defaultValue = "replication") String mode
    ) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("Upload failed: file is empty");
        }

        String normalizedMode = mode.trim().toLowerCase();

        if (!normalizedMode.equals("replication") && !normalizedMode.equals("load_balancing")) {
            return ResponseEntity.badRequest()
                    .body("Invalid mode. Use 'replication' or 'load_balancing'");
        }

        if (normalizedMode.equals("replication")) {
            return uploadWithReplication(file);
        } else {
            return uploadWithLoadBalancing(file);
        }
    }

    private ResponseEntity<String> uploadWithReplication(MultipartFile file) {
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
                            new FileMetadata(file.getOriginalFilename(), port, "NOT_HEALTHY", "replication")
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
                            new FileMetadata(file.getOriginalFilename(), port, "UPLOADED", "replication")
                    );

                    result.append("Replicated to node ").append(port).append("\n");
                } else {
                    fileMetadataRepository.save(
                            new FileMetadata(file.getOriginalFilename(), port, "FAILED", "replication")
                    );
                    result.append("Upload failed on node ").append(port)
                            .append(": ").append(responseBody).append("\n");
                }

            } catch (Exception e) {
                fileMetadataRepository.save(
                        new FileMetadata(file.getOriginalFilename(), port, "FAILED", "replication")
                );
                result.append("Upload exception on node ").append(port)
                        .append(": ").append(e.getMessage()).append("\n");
            }
        }

        return ResponseEntity.ok(result.toString());
    }

    private ResponseEntity<String> uploadWithLoadBalancing(MultipartFile file) {
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
                            new FileMetadata(file.getOriginalFilename(), port, "NOT_HEALTHY", "load_balancing")
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
                            new FileMetadata(file.getOriginalFilename(), port, "UPLOADED", "load_balancing")
                    );

                    return ResponseEntity.ok("Load-balanced upload to node " + port);
                } else {
                    fileMetadataRepository.save(
                            new FileMetadata(file.getOriginalFilename(), port, "FAILED", "load_balancing")
                    );
                }

            } catch (Exception e) {
                fileMetadataRepository.save(
                        new FileMetadata(file.getOriginalFilename(), port, "FAILED", "load_balancing")
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

    @DeleteMapping("/delete/{filename}")
    public ResponseEntity<String> deleteFromAllNodes(@PathVariable String filename) {
        RestTemplate restTemplate = new RestTemplate();
        StringBuilder result = new StringBuilder();

        try {
            List<FileMetadata> metadataList =
                    fileMetadataRepository.findByFileNameAndStatus(filename, "UPLOADED");

            if (metadataList.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("No uploaded metadata found for file: " + filename);
            }

            List<Integer> deletedPorts = new ArrayList<>();

            for (FileMetadata metadata : metadataList) {
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

            fileMetadataRepository.deleteByFileName(filename);

            result.append("Deleted metadata from database for file: ").append(filename);
            return ResponseEntity.ok(result.toString());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Master delete failed: " + e.getMessage());
        }
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<ByteArrayResource> downloadFromAvailableNode(@PathVariable String filename) {
        RestTemplate restTemplate = new RestTemplate();

        List<FileMetadata> metadataList =
                fileMetadataRepository.findByFileNameAndStatus(filename, "UPLOADED");

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
}