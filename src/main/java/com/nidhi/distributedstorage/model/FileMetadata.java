package com.nidhi.distributedstorage.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "file_metadata")
public class FileMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private int nodePort;
    private String status;
    private String mode;
    private String userEmail;
    private LocalDateTime uploadTime;

    public FileMetadata() {}

    public FileMetadata(String fileName, int nodePort, String status, String mode, String userEmail) {
        this.fileName = fileName;
        this.nodePort = nodePort;
        this.status = status;
        this.mode = mode;
        this.userEmail = userEmail;
        this.uploadTime = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public int getNodePort() { return nodePort; }
    public void setNodePort(int nodePort) { this.nodePort = nodePort; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public LocalDateTime getUploadTime() { return uploadTime; }
    public void setUploadTime(LocalDateTime uploadTime) { this.uploadTime = uploadTime; }
}