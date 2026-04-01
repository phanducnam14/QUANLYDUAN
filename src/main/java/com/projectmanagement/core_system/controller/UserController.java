package com.projectmanagement.core_system.controller;

import com.projectmanagement.core_system.config.JwtUtil;
import com.projectmanagement.core_system.model.ChangePasswordRequest;
import com.projectmanagement.core_system.model.User;
import com.projectmanagement.core_system.repository.UserRepository;
import com.projectmanagement.core_system.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.projectmanagement.core_system.aspect.LogActivity;
import com.projectmanagement.core_system.model.UpdateUserRequest;

import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    // 2. Lấy danh sách tất cả (Mặc định) - Hỗ trợ lọc theo phòng ban và sắp xếp
    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) String deptId,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "asc") String order
    ) { 
        try {
            if (deptId != null && !deptId.isEmpty()) {
                org.springframework.data.domain.Sort sort = org.springframework.data.domain.Sort.by(
                    "desc".equalsIgnoreCase(order) ? org.springframework.data.domain.Sort.Direction.DESC : org.springframework.data.domain.Sort.Direction.ASC,
                    (sortBy != null && !sortBy.isEmpty()) ? sortBy : "fullName"
                );
                return ResponseEntity.ok(userRepository.findByDepartment_Id(deptId, sort));
            }
            return ResponseEntity.ok(userService.getAllUsers(sortBy, order));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Lỗi: " + e.getMessage());
        }
    }

    @GetMapping("/fix-active")
    public String fixActive() {
        List<User> users = userRepository.findAll();
        for (User u : users) {
             u.setActive(true);
             userRepository.save(u);
        }
        return "Fixed " + users.size() + " users";
    }

    // 2. 🔥 API MỚI: Tìm kiếm nhân viên kết hợp Bộ lọc (Danh sách nhân viên)
    @GetMapping("/search")
    public List<User> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String deptId,
            @RequestParam(required = false) com.projectmanagement.core_system.enums.ERole role,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "asc") String order
    ) {
        return userService.searchUsers(keyword, deptId, role, sortBy, order);
    }

    // 3. Tạo nhân viên mới
    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody User user,
            @RequestParam(required = false) String deptId 
    ) {
        try {
            // Auto active new user (default false in model)
            return ResponseEntity.ok(userService.createUser(user, deptId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 4. Xóa nhân viên
    @DeleteMapping("/{id}")
    @LogActivity(actionType = "DELETE", resourceType = "USER")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok("Đã xóa nhân viên thành công!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 5. 🔥 API MỚI: Đổi mật khẩu
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader("Authorization") String token,
            @RequestBody ChangePasswordRequest request
    ) {
        try {
            // Extract identifier từ JWT token
            String identifier = jwtUtil.extractIdentifier(token.replace("Bearer ", ""));
            Optional<User> userOpt = userRepository.findByEmail(identifier)
                    .or(() -> userRepository.findByGoogleEmail(identifier));

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body("User không tồn tại!");
            }

            User user = userOpt.get();
            userService.changePassword(user.getId(), request.getOldPassword(), request.getNewPassword());

            return ResponseEntity.ok("Đã đổi mật khẩu thành công!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Không đủ quyền hoặc token không hợp lệ!");
        }
    }

    // 6. 🔥 API MỚI: Upload avatar
    @PostMapping("/upload-avatar")
    public ResponseEntity<?> uploadAvatar(
            @RequestHeader("Authorization") String token,
            @RequestParam(value = "avatar", required = false) MultipartFile avatarFile,
            @RequestParam(value = "avatarUrl", required = false) String avatarUrl
    ) throws Exception {
        String identifier = jwtUtil.extractIdentifier(token.replace("Bearer ", ""));
        Optional<User> userOpt = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByGoogleEmail(identifier));

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body("User không tồn tại!");
        }

        User user;
        if (avatarFile != null && !avatarFile.isEmpty()) {
            user = userService.uploadAvatar(userOpt.get().getId(), avatarFile);
        } else if (avatarUrl != null && !avatarUrl.isEmpty()) {
            user = userService.uploadAvatarFromUrl(userOpt.get().getId(), avatarUrl);
        } else {
            return ResponseEntity.badRequest().body("Vui lòng cung cấp file ảnh hoặc URL!");
        }
        
        return ResponseEntity.ok(user);
    }

    // 7. 🔥 API MỚI: Update user with avatar on creation
    @PostMapping("/create-with-avatar")
    @LogActivity(actionType = "CREATE", resourceType = "USER")
    public ResponseEntity<?> createWithAvatar(
            @RequestParam(required = false) String deptId,
            @RequestParam("fullName") String fullName,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "role", defaultValue = "EMPLOYEE") String role,
            @RequestParam(value = "googleEmail", required = false) String googleEmail,
            @RequestParam(value = "avatar", required = false) MultipartFile avatarFile,
            @RequestParam(value = "avatarUrl", required = false) String avatarUrl
    ) throws Exception {
        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(password);
        user.setGoogleEmail(googleEmail);
        user.setRole(com.projectmanagement.core_system.enums.ERole.valueOf(role));
        
        if (avatarFile != null && !avatarFile.isEmpty()) {
            user.setAvatarUrl(userService.convertFileToBase64(avatarFile));
        } else if (avatarUrl != null && !avatarUrl.isEmpty()) {
            user.setAvatarUrl(userService.downloadImageFromUrl(avatarUrl));
        }
        
        return ResponseEntity.ok(userService.createUser(user, deptId));
    }

    // 8. Cập nhật thông tin nhân viên (Admin)
    @PatchMapping("/{id}")
    @LogActivity(actionType = "UPDATE", resourceType = "USER")
    public ResponseEntity<?> updateUser(
            @PathVariable String id,
            @RequestBody UpdateUserRequest request,
            @RequestParam String adminEmail
    ) {
        return ResponseEntity.ok(userService.updateEmployee(id, request, adminEmail));
    }

    // 8b. Cập nhật phòng ban cho NHIỀU nhân viên (🔥 MỚI)
    @PatchMapping("/bulk-update-dept")
    @LogActivity(actionType = "UPDATE_BULK", resourceType = "USER")
    public ResponseEntity<?> bulkUpdateDept(
            @RequestBody java.util.List<String> userIds,
            @RequestParam String deptId,
            @RequestParam String adminEmail
    ) {
        try {
            java.util.List<User> updatedUsers = new java.util.ArrayList<>();
            for (String userId : userIds) {
                UpdateUserRequest request = new UpdateUserRequest();
                request.setDeptId(deptId);
                updatedUsers.add(userService.updateEmployee(userId, request, adminEmail));
            }
            return ResponseEntity.ok(updatedUsers);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi server: " + e.getMessage());
        }
    }

    // 🔥 5. API CẬP NHẬT AVATAR
    @PutMapping("/{id}/avatar")
    public ResponseEntity<?> updateAvatar(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            String avatarUrl = request.get("avatarUrl");
            if (avatarUrl == null || avatarUrl.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("avatarUrl không được để trống!");
            }
            return ResponseEntity.ok(userService.updateAvatar(id, avatarUrl));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi server: " + e.getMessage());
        }
    }
}
