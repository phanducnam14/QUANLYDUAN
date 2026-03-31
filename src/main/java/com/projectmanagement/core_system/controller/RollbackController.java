package com.projectmanagement.core_system.controller;

import com.projectmanagement.core_system.service.RollbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/admin/rollback")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class RollbackController {

    private final RollbackService rollbackService;

    @PostMapping("/{logId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> rollback(@PathVariable String logId, Principal principal) {
        try {
            if (principal == null) return ResponseEntity.status(401).body("Yêu cầu đăng nhập!");
            
            String adminEmail = principal.getName();
            rollbackService.rollback(logId, adminEmail);
            
            return ResponseEntity.ok("Đã khôi phục hành động thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi khôi phục: " + e.getMessage());
        }
    }
}
