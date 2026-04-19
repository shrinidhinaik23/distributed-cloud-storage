package com.nidhi.distributedstorage.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;

@RestController
@RequestMapping("/storage")
@Profile("storage")
@CrossOrigin(origins = "*")
public class StorageController {

    @Value("${server.port}")
    private String serverPort;

    private String getStorageDir() {
        return System.getProperty("user.dir") + File.separator + "storage-" + serverPort;
    }

    @GetMapping("/test")
    public String test() {
        return "Storage Node Running on port " + serverPort;
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body("Upload failed: file is empty");
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isBlank()) {
                return ResponseEntity.badRequest().body("Upload failed: invalid file name");
            }

            File dir = new File(getStorageDir());
            if (!dir.exists() && !dir.mkdirs()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Upload failed: could not create storage directory");
            }

            File dest = new File(dir, originalFilename);
            file.transferTo(dest);

            return ResponseEntity.ok("Uploaded: " + originalFilename + " to " + getStorageDir());

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        try {
            File file = new File(getStorageDir(), filename);

            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }

            Path path = file.toPath();
            Resource resource = new UrlResource(path.toUri());

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/files")
    public String[] listFiles() {
        File dir = new File(getStorageDir());
        if (!dir.exists()) {
            return new String[0];
        }

        String[] files = dir.list();
        return files != null ? files : new String[0];
    }

    @DeleteMapping("/delete/{filename}")
    public ResponseEntity<String> deleteFile(@PathVariable String filename) {
        File file = new File(getStorageDir(), filename);

        if (!file.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("File not found: " + filename);
        }

        if (file.delete()) {
            return ResponseEntity.ok("Deleted: " + filename);
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Delete failed: " + filename);
    }
    @GetMapping("/preview/{filename}")
    public ResponseEntity<Resource> previewFile(@PathVariable String filename) {
        try {
            File file = new File(getStorageDir(), filename);

            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }

            Path path = file.toPath();
            Resource resource = new UrlResource(path.toUri());

            String contentType = java.nio.file.Files.probeContentType(path);
            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;

            if (contentType != null) {
                try {
                    mediaType = MediaType.parseMediaType(contentType);
                } catch (Exception ignored) {
                }
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.internalServerError().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}