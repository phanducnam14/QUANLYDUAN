package com.projectmanagement.core_system.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "admin_activity_logs")
public class AdminActivityLog {

    @Id
    private String id;

    private String adminId;    // ID of the admin who performed the action
    private String adminName;  // Name of the admin
    private String adminEmail; // Email of the admin

    private String actionType;  // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, CONFIG_CHANGE
    private String resourceType; // USER, PROJECT, DEPARTMENT, TASK, SETTING
    private String resourceId;   // ID of the affected resource

    private String description;  // Human-readable description (e.g., "Updated user email")
    private String details;      // Detailed changes (JSON or serialized diff)

    private String previousState; // JSON snapshot BEFORE the action (for Rollback)
    private String newState;      // JSON snapshot AFTER the action (for Rollback)
    private boolean isRollbacked; // Flag if this action has been undone

    private String ipAddress;
    private String userAgent;    // Device/browser info

    private LocalDateTime timestamp;

    // Optional: for performance on large datasets
    private String status;       // SUCCESS, FAILURE
}
