package com.projectmanagement.core_system.controller;

import com.projectmanagement.core_system.model.AdminActivityLog;
import com.projectmanagement.core_system.service.ActivityLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/activity-logs")
@RequiredArgsConstructor
@Tag(name = "Admin Activity Logs", description = "Endpoints for tracking and viewing administrative activities")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminActivityController {

    private final ActivityLogService logService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Search activity logs", description = "Retrieve a paginated list of activity logs with filters for admin, action type, and date range.")
    public ResponseEntity<Page<AdminActivityLog>> getAllLogs(
            @RequestParam(required = false) String adminId,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(logService.searchLogs(adminId, actionType, startDate, endDate, page, size));
    }

    @GetMapping("/latest")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<AdminActivityLog> getLatestLog(@RequestParam String adminId) {
        return ResponseEntity.ok(logService.getLatestLogByAdmin(adminId));
    }
}
