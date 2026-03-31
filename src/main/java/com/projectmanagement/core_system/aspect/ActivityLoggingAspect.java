package com.projectmanagement.core_system.aspect;

import com.projectmanagement.core_system.model.AdminActivityLog;
import com.projectmanagement.core_system.model.User;
import com.projectmanagement.core_system.model.Project;
import com.projectmanagement.core_system.model.Department;
import com.projectmanagement.core_system.service.ActivityLogService;
import com.projectmanagement.core_system.repository.DepartmentRepository;
import com.projectmanagement.core_system.repository.ProjectRepository;
import com.projectmanagement.core_system.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

@Aspect
@Component
@RequiredArgsConstructor
public class ActivityLoggingAspect {

    private final ActivityLogService logService;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final DepartmentRepository departmentRepository;
    private final ObjectMapper objectMapper;

    @Around("@annotation(logActivity)")
    public Object logAround(ProceedingJoinPoint joinPoint, LogActivity logActivity) throws Throwable {
        String previousState = null;
        Object[] args = joinPoint.getArgs();
        String resourceId = null;

        // 1. Capture Previous State (for UPDATE and DELETE)
        if ("UPDATE".equals(logActivity.actionType()) || "DELETE".equals(logActivity.actionType())) {
            if (args.length > 0 && args[0] instanceof String) {
                resourceId = (String) args[0];
                previousState = captureState(logActivity.resourceType(), resourceId);
            }
        }

        // 2. Execute the Method
        Object result = joinPoint.proceed();

        // 3. Post-execution Logging Logic
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null && authentication.isAuthenticated()) {
                Object principal = authentication.getPrincipal();
                User actor = null;

                if (principal instanceof User) {
                    actor = (User) principal;
                } else if (principal instanceof UserDetails userDetails) {
                    actor = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
                }

                if (actor != null && (actor.getRole() == com.projectmanagement.core_system.enums.ERole.ADMIN || actor.getRole() == com.projectmanagement.core_system.enums.ERole.SUPER_ADMIN)) {
                    
                    Object actualResult = (result instanceof ResponseEntity) ? ((ResponseEntity<?>) result).getBody() : result;
                    String resourceName = "";
                    String newState = null;

                    // Capture Resource ID and Name if it wasn't captured before (for CREATE)
                    if (actualResult instanceof User resUser) {
                        if (resourceId == null) resourceId = resUser.getId();
                        resourceName = resUser.getFullName();
                        newState = objectMapper.writeValueAsString(resUser);
                    } else if (actualResult instanceof Project project) {
                        if (resourceId == null) resourceId = project.getId();
                        resourceName = project.getName();
                        newState = objectMapper.writeValueAsString(project);
                    } else if (actualResult instanceof Department dept) {
                        if (resourceId == null) resourceId = dept.getId();
                        resourceName = dept.getName();
                        newState = objectMapper.writeValueAsString(dept);
                    }

                    String actionVn = switch (logActivity.actionType()) {
                        case "CREATE" -> "thêm mới";
                        case "UPDATE" -> "cập nhật";
                        case "DELETE" -> "xóa";
                        case "LOGIN" -> "đăng nhập";
                        case "RESTORE" -> "khôi phục";
                        default -> logActivity.actionType().toLowerCase();
                    };

                    String resourceVn = switch (logActivity.resourceType()) {
                        case "USER" -> "nhân sự";
                        case "PROJECT" -> "dự án";
                        case "DEPARTMENT" -> "phòng ban";
                        case "TASK" -> "công việc";
                        case "AUTH" -> "hệ thống";
                        default -> logActivity.resourceType().toLowerCase();
                    };

                    // 3.5 🔥 ENHANCEMENT: If resourceName is still empty (common for DELETE), extract from previousState
                    if ((resourceName == null || resourceName.isEmpty()) && previousState != null) {
                        try {
                            com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(previousState);
                            if (node.has("fullName")) {
                                resourceName = node.get("fullName").asText();
                            } else if (node.has("name")) {
                                resourceName = node.get("name").asText();
                            }
                        } catch (Exception e) {
                            // Ignore parsing errors
                        }
                    }

                    String finalDescription = "Admin " + actor.getFullName() + " đã " + actionVn + " " + resourceVn;
                    if (resourceName != null && !resourceName.isEmpty()) {
                        finalDescription += " \"" + resourceName + "\"";
                    }

                    AdminActivityLog logEntry = AdminActivityLog.builder()
                            .adminId(actor.getId())
                            .adminName(actor.getFullName())
                            .adminEmail(actor.getEmail())
                            .actionType(logActivity.actionType())
                            .resourceType(logActivity.resourceType())
                            .resourceId(resourceId)
                            .description(finalDescription)
                            .previousState(previousState)
                            .newState(newState)
                            .ipAddress(getClientIp(request))
                            .userAgent(request.getHeader("User-Agent"))
                            .timestamp(LocalDateTime.now())
                            .status("SUCCESS")
                            .build();

                    logService.logActivity(logEntry);
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error logging activity: " + e.getMessage());
        }

        return result;
    }

    private String captureState(String resourceType, String resourceId) {
        try {
            Object entity = switch (resourceType) {
                case "USER" -> userRepository.findById(resourceId).orElse(null);
                case "PROJECT" -> projectRepository.findById(resourceId).orElse(null);
                case "DEPARTMENT" -> departmentRepository.findById(resourceId).orElse(null);
                default -> null;
            };
            return entity != null ? objectMapper.writeValueAsString(entity) : null;
        } catch (Exception e) {
            return null;
        }
    }
    
    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = "";
        if (request != null) {
            remoteAddr = request.getHeader("X-FORWARDED-FOR");
            if (remoteAddr == null || remoteAddr.isEmpty()) {
                remoteAddr = request.getRemoteAddr();
            }
        }
        return remoteAddr;
    }
}
