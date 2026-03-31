package com.projectmanagement.core_system.utils;

import java.text.Normalizer;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

@Component
public class EmailGenerator {

    private static final String DEFAULT_DOMAIN = "quanlyduan.com";

    public String generate(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            throw new IllegalArgumentException("Full name cannot be empty for email generation.");
        }

        // Normalize name: "Nguyễn Văn A" -> "nguyen van a"
        String normalized = Normalizer.normalize(fullName.toLowerCase(), Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String nameWithoutAccent = pattern.matcher(normalized).replaceAll("");
        
        // Remove spaces and special characters
        String cleanName = nameWithoutAccent.replaceAll("[^a-z0-9]", ".");
        
        // Add a short unique identifier to avoid collisions
        String uniqueId = UUID.randomUUID().toString().substring(0, 5);
        
        return String.format("%s.%s@%s", cleanName, uniqueId, DEFAULT_DOMAIN);
    }
}
