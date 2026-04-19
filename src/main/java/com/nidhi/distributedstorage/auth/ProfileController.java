package com.nidhi.distributedstorage.auth;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "*")
public class ProfileController {

    @GetMapping("/me")
    public String me(Authentication authentication) {
        return "Logged in as: " + authentication.getName();
    }
}