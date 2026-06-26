package com.nidhi.distributedstorage.auth;

import com.nidhi.distributedstorage.model.User;
import com.nidhi.distributedstorage.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/sync-user")
    public ResponseEntity<?> syncFirebaseUser(@RequestBody SyncUserRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email field cannot be null or blank");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(request.getEmail());
                    newUser.setPassword("FIREBASE_EXTERNAL_AUTH");
                    return newUser;
                });

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            user.setName(request.getName());
        } else if (user.getName() == null) {
            user.setName(request.getEmail().split("@")[0]);
        }

        userRepository.save(user);
        return ResponseEntity.ok("User metadata synchronized successfully");
    }
}