package com.nidhi.distributedstorage.auth;

public class SyncUserRequest {
    private String email;
    private String name;

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}