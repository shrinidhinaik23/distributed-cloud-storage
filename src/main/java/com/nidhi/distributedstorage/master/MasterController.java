package com.nidhi.distributedstorage.master;

import com.nidhi.distributedstorage.model.FileMetadata;
import com.nidhi.distributedstorage.repository.FileMetadataRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;

import java.util.*;

@RestController
@RequestMapping("/master")
@Profile("master")
@CrossOrigin(origins = "*")
public class MasterController {

    @Value("${storage.nodes}")
    private String storageNodesConfig;

    private String[] storageNodes;

    private int currentNodeIndex = 0;
    private String currentMode = "replication";
    private String getNodeUrl(int port) {
        return switch (port) {
            case 8080 -> "http://storage1:8080";
            case 8081 -> "http://storage2:8081";
            case 8082 -> "http://storage3:8082";
            default -> null;
        };
    }

    private final FileMetadataRepository fileMetadataRepository;

    public MasterController(FileMetadataRepository fileMetadataRepository) {
        this.fileMetadataRepository = fileMetadataRepository;
    }

    @PostConstruct
    public void init() {
        storageNodes = storageNodesConfig.split(",");
    }

    // ================= HEALTH =================
    @GetMapping("/test")
    public String test() {
        return "Master is running";
    }

    // ================= MODES =================
    @GetMapping("/modes")
    public ResponseEntity<List<String>> getModes() {
        return ResponseEntity.ok(List.of("replication", "load_balancing"));
    }

    @GetMapping("/mode")
    public ResponseEntity<String> getMode() {
        return ResponseEntity.ok(currentMode);
    }

    @PostMapping("/mode")
    public ResponseEntity<String> setMode(@RequestParam String mode) {
        if (!mode.equals("replication") && !mode.equals("load_balancing")) {
            return ResponseEntity.badRequest().body("Invalid mode");
        }

        currentMode = mode;
        return ResponseEntity.ok(currentMode);
    }

    // ================= UPLOAD =================
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
            return ResponseEntity.badRequest().body("File is empty");
        }

        String userEmail = authentication.getName();
        String normalizedMode = mode.trim().toLowerCase();

        if (normalizedMode.equals("replication")) {
            return uploadReplication(file, userEmail);
        } else {
            return uploadLoadBalancing(file, userEmail);
        }
    }

    // ================= REPLICATION =================
    private ResponseEntity<String> uploadReplication(MultipartFile file, String userEmail) {

        RestTemplate restTemplate = new RestTemplate();
        StringBuilder result = new StringBuilder();

        for (String node : storageNodes) {

            int port = Integer.parseInt(node.split(":")[2]);

            try {
                ResponseEntity<String> health =
                        restTemplate.getForEntity(node + "/storage/health", String.class);

                if (!"OK".equalsIgnoreCase(health.getBody())) {
                    fileMetadataRepository.save(
                            new FileMetadata(file.getOriginalFilename(), port, "NOT_HEALTHY", "replication", userEmail)
                    );
                    continue;
                }

                ByteArrayResource resource =
                    new ByteArrayResource(file.getBytes()) {
                        @Override
                        public String getFilename() {
                            return file.getOriginalFilename();
                        }
                    };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> request =
                    new HttpEntity<>(body, headers);

                ResponseEntity<String> response =
                        restTemplate.postForEntity(node + "/storage/upload", request, String.class);

                if (response.getStatusCode().is2xxSuccessful()) {
                    fileMetadataRepository.save(
                            new FileMetadata(file.getOriginalFilename(), port, "UPLOADED", "replication", userEmail)
                    );
                    result.append("Uploaded to ").append(port).append("\n");
                } else {
                    fileMetadataRepository.save(
                            new FileMetadata(file.getOriginalFilename(), port, "FAILED", "replication", userEmail)
                    );
                }

            } catch (Exception e) {
                    e.printStackTrace();

                    fileMetadataRepository.save(
                        new FileMetadata(
                            file.getOriginalFilename(),
                            port,
                            "FAILED",
                            "replication",
                            userEmail
                        )
                    );
                }
        }

        return ResponseEntity.ok(result.toString());
    }

    // ================= LOAD BALANCING =================
    private ResponseEntity<String> uploadLoadBalancing(MultipartFile file, String userEmail) {

        RestTemplate restTemplate = new RestTemplate();

        int attempts = 0;

        while (attempts < storageNodes.length) {

            String node = storageNodes[currentNodeIndex];
            int port = Integer.parseInt(node.split(":")[2]);

            currentNodeIndex = (currentNodeIndex + 1) % storageNodes.length;

            try {
                ResponseEntity<String> health =
                        restTemplate.getForEntity(node + "/storage/health", String.class);

                if (!"OK".equalsIgnoreCase(health.getBody())) {
                    attempts++;
                    continue;
                }

                ByteArrayResource resource =
                        new ByteArrayResource(file.getBytes()) {
                            @Override
                            public String getFilename() {
                                return file.getOriginalFilename();
                            }
                        };

                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("file", resource);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);

                HttpEntity<MultiValueMap<String, Object>> request =
                        new HttpEntity<>(body, headers);

                ResponseEntity<String> response =
                        restTemplate.postForEntity(node + "/storage/upload", request, String.class);

                if (response.getStatusCode().is2xxSuccessful()) {

                    fileMetadataRepository.save(
                            new FileMetadata(file.getOriginalFilename(), port, "UPLOADED", "load_balancing", userEmail)
                    );

                    return ResponseEntity.ok("Uploaded to node " + port);
                }

            } catch (Exception e) {
                e.printStackTrace();
            }

            attempts++;
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("All nodes failed");
    }

    // ================= FILE METADATA =================
    @GetMapping("/files/my")
    public ResponseEntity<List<FileMetadata>> getMyFiles(Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName();

        return ResponseEntity.ok(fileMetadataRepository.findByUserEmail(email));
    }

    // ================= DELETE =================
   @DeleteMapping("/delete/{filename}")
public ResponseEntity<String> deleteFile(
        @PathVariable String filename,
        Authentication authentication
) {

    if (authentication == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Not logged in");
    }

    String email = authentication.getName();
    RestTemplate restTemplate = new RestTemplate();

    List<FileMetadata> files =
            fileMetadataRepository.findByUserEmailAndFileName(
                    email,
                    filename
            );

    for (FileMetadata f : files) {

        if (!"UPLOADED".equals(f.getStatus())) {
            continue;
        }

        try {

            String node = getNodeUrl(f.getNodePort());

            if (node != null) {
                restTemplate.delete(
                        node + "/storage/delete/" + filename
                );
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        fileMetadataRepository.deleteById(f.getId());
    }

    return ResponseEntity.ok("Deleted: " + filename);
}

    // ================= DOWNLOAD =================
  @GetMapping("/download/{filename}")
public ResponseEntity<ByteArrayResource> download(
        @PathVariable String filename,
        Authentication authentication
) {

    if (authentication == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    String email = authentication.getName();
    RestTemplate rest = new RestTemplate();

    List<FileMetadata> list =
            fileMetadataRepository.findByUserEmailAndFileName(
                    email,
                    filename
            );

    for (FileMetadata f : list) {

        if (!"UPLOADED".equals(f.getStatus())) {
            continue;
        }

        try {

            String node = getNodeUrl(f.getNodePort());

            if (node == null) {
                continue;
            }

            ResponseEntity<byte[]> response =
                    rest.getForEntity(
                            node + "/storage/download/" + filename,
                            byte[].class
                    );

            if (response.getStatusCode().is2xxSuccessful()
                    && response.getBody() != null) {

                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(
                                HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=\"" + filename + "\""
                        )
                        .body(
                                new ByteArrayResource(
                                        response.getBody()
                                )
                        );
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    return ResponseEntity.status(
            HttpStatus.SERVICE_UNAVAILABLE
    ).build();
}

    // ================= PREVIEW =================
    @GetMapping("/preview/{filename}")
public ResponseEntity<ByteArrayResource> preview(
        @PathVariable String filename,
        Authentication authentication
) {

    if (authentication == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    String email = authentication.getName();
    RestTemplate rest = new RestTemplate();

    List<FileMetadata> list =
            fileMetadataRepository.findByUserEmailAndFileName(
                    email,
                    filename
            );

    for (FileMetadata f : list) {

        if (!"UPLOADED".equals(f.getStatus())) {
            continue;
        }

        try {

            String node = getNodeUrl(f.getNodePort());

            if (node == null) {
                continue;
            }

            ResponseEntity<byte[]> response =
                    rest.getForEntity(
                            node + "/storage/preview/" + filename,
                            byte[].class
                    );

            if (response.getStatusCode().is2xxSuccessful()
                    && response.getBody() != null) {

                MediaType mediaType =
                        response.getHeaders().getContentType();

                if (mediaType == null) {
                    mediaType =
                            MediaType.APPLICATION_OCTET_STREAM;
                }

                return ResponseEntity.ok()
                        .contentType(mediaType)
                        .header(
                                HttpHeaders.CONTENT_DISPOSITION,
                                "inline; filename=\"" + filename + "\""
                        )
                        .body(
                                new ByteArrayResource(
                                        response.getBody()
                                )
                        );
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    return ResponseEntity.status(
            HttpStatus.SERVICE_UNAVAILABLE
    ).build();
}
}