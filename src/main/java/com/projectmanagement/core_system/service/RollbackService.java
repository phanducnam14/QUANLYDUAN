package com.projectmanagement.core_system.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectmanagement.core_system.model.*;
import com.projectmanagement.core_system.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RollbackService {
    private final ActivityLogService logService;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final DepartmentRepository departmentRepository;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    public void rollback(String logId, String adminEmail) throws Exception {
        AdminActivityLog log = logService.getLogById(logId);
        if (log == null) throw new RuntimeException("Không tìm thấy nhật ký thao tác!");
        // 1. Chỉ khôi phục những mục chưa được khôi phục trước đó
        if (log.isRollbacked()) throw new RuntimeException("Hành động này đã được khôi phục trước đó!");

        String resourceType = log.getResourceType();
        String actionType = log.getActionType();
        String previousState = log.getPreviousState();
        String resourceId = log.getResourceId();

        // 2. Thực hiện khôi phục dựa trên loại hành động
        switch (actionType) {
            case "CREATE":
                // Hoàn tác tạo mới = Xóa bản ghi đã tạo
                deleteResource(resourceType, resourceId);
                break;
            case "UPDATE":
            case "DELETE":
                // Hoàn tác cập nhật/Xóa = Khôi phục trạng thái trước đó
                if (previousState == null) throw new RuntimeException("Không tìm thấy dữ liệu trạng thái trước đó để khôi phục!");
                restoreResource(resourceType, previousState);
                break;
            default:
                throw new RuntimeException("Hệ thống không hỗ trợ khôi phục cho loại hành động này: " + actionType);
        }

        // 3. Đánh dấu đã khôi phục
        log.setRollbacked(true);
        logService.saveLog(log);

        // 4. Ghi nhật ký hành động khôi phục mới vào hệ thống (Yêu cầu: "khôi phục vẫn hiện trong nhật ký")
        userRepository.findByEmail(adminEmail).ifPresent(performer -> {
            AdminActivityLog rollbackLog = AdminActivityLog.builder()
                .adminId(performer.getId())
                .adminName(performer.getFullName())
                .adminEmail(performer.getEmail())
                .actionType("RESTORE")
                .resourceType(log.getResourceType())
                .resourceId(log.getResourceId())
                .description("Khôi phục hành động: " + log.getDescription())
                .timestamp(LocalDateTime.now())
                .status("SUCCESS")
                .build();
            logService.logActivity(rollbackLog);
        });

        // 5. Bắn thông báo real-time qua WebSocket cho các admin khác
        notificationService.sendRealTimeUpdate("/topic/admin/rollback", 
            new RollbackNotification(adminEmail, log.getDescription(), LocalDateTime.now()));
    }

    private void deleteResource(String type, String id) {
        switch (type) {
            case "USER": userRepository.deleteById(id); break;
            case "PROJECT": projectRepository.deleteById(id); break;
            case "DEPARTMENT": departmentRepository.deleteById(id); break;
        }
    }

    private void restoreResource(String type, String json) throws Exception {
        switch (type) {
            case "USER": userRepository.save(objectMapper.readValue(json, User.class)); break;
            case "PROJECT": projectRepository.save(objectMapper.readValue(json, Project.class)); break;
            case "DEPARTMENT": departmentRepository.save(objectMapper.readValue(json, Department.class)); break;
        }
    }

    // Lớp DTO đơn giản cho thông báo
    public record RollbackNotification(String admin, String action, LocalDateTime time) {}
}
