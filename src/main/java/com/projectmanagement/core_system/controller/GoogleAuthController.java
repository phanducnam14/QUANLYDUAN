package com.projectmanagement.core_system.controller;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.projectmanagement.core_system.config.JwtUtil;
import com.projectmanagement.core_system.enums.ERole;
import com.projectmanagement.core_system.model.User;
import com.projectmanagement.core_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class GoogleAuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Actual Google Client ID from Google Cloud Console
    private static final String CLIENT_ID = "783872789411-oq743h237h6gl9na7p7tinb4qlkflmsa.apps.googleusercontent.com";

    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        try {
            String idTokenString = request.get("idToken");
            if (idTokenString == null) return ResponseEntity.badRequest().body("ID Token is missing");

            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(CLIENT_ID))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();

                String email = payload.getEmail();
                String name = (String) payload.get("name");
                String pictureUrl = (String) payload.get("picture");

                // Lookup: 1. Primary Email, 2. Linked Google Email
                Optional<User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isEmpty()) {
                    userOpt = userRepository.findByGoogleEmail(email);
                    if (userOpt.isPresent()) {
                        System.out.println(">>> Found linked user by Google Email: " + email);
                    }
                }

                User user;
                if (userOpt.isPresent()) {
                    user = userOpt.get();
                    // Update avatar if provided by Google
                    if (pictureUrl != null && (user.getAvatarUrl() == null || user.getAvatarUrl().startsWith("https://lh3.googleusercontent.com"))) {
                        user.setAvatarUrl(pictureUrl);
                    }
                    userRepository.save(user);
                } else {
                    // Create new user for first-time Google login
                    user = new User();
                    user.setEmail(email);
                    user.setFullName(name != null ? name : email.split("@")[0]);
                    user.setRole(ERole.EMPLOYEE);
                    user.setActive(true);
                    user.setAvatarUrl(pictureUrl);
                    // Set random password since it's required for local login security
                    user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                    userRepository.save(user);
                }

                String identifier = user.getEmail() != null ? user.getEmail() : user.getGoogleEmail();
                String token = jwtUtil.generateToken(identifier, user.getRole().name());
                return ResponseEntity.ok(Map.of(
                        "token", token,
                        "user", user
                ));
            } else {
                return ResponseEntity.status(401).body("Invalid ID token.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error during Google authentication: " + e.getMessage());
        }
    }
}
