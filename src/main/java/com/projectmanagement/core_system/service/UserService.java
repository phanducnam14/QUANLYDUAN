package com.projectmanagement.core_system.service;

import com.projectmanagement.core_system.model.Department;
import com.projectmanagement.core_system.model.UpdateUserRequest;
import com.projectmanagement.core_system.model.User;
import com.projectmanagement.core_system.repository.DepartmentRepository;
import com.projectmanagement.core_system.repository.UserRepository;
import com.projectmanagement.core_system.utils.EmailGenerator;
import com.projectmanagement.core_system.config.GlobalExceptionHandler.EmployeeServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URL;
import java.net.URLConnection;
import java.util.Base64;
import java.util.List;

@Service
@Slf4j
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private EmailGenerator emailGenerator;

    @Autowired
    private EmailService emailService;

    // 1. Tạo User (Professional Module với Logging)
    public User createUser(User user, String deptId) {
        log.info("START: Processing worker creation for [Name: {}, Email: {}]", user.getFullName(), user.getEmail());
        
        long startTime = System.currentTimeMillis();
        boolean isUpdate = false;

        try {
            // STEP 1: Validation layer
            validateUserFields(user);

            String rawPassword = user.getPassword();
            if (!StringUtils.hasText(rawPassword)) {
                rawPassword = java.util.UUID.randomUUID().toString().substring(0, 8);
                user.setPassword(rawPassword);
                log.debug("No password provided. Generated temporary secure password.");
            }

            // STEP 2: Branching logic based on email status
            if (!StringUtils.hasText(user.getEmail())) {
                if (StringUtils.hasText(user.getGoogleEmail())) {
                    log.info("Google Email provided [{}]. Skipping internal email/password generation.", user.getGoogleEmail());
                    // We don't set an internal email or password if Google Email is present
                } else {
                    log.debug("No email provided. Initiating automated email generation...");
                    String generatedEmail = emailGenerator.generate(user.getFullName());
                    user.setEmail(generatedEmail);
                    log.info("Generated professional email: {}", generatedEmail);
                }
            }

            // Check for duplicate or choose creation path
            User existingProfile = null;
            if (StringUtils.hasText(user.getEmail())) {
                String email = user.getEmail().trim();
                if (email.isEmpty()) {
                    user.setEmail(null);
                } else {
                    user.setEmail(email);
                    existingProfile = userRepository.findByEmail(email).orElse(null);
                }
            } else {
                user.setEmail(null); // Ensure truly null if not present
            }
            
            if (existingProfile == null && StringUtils.hasText(user.getGoogleEmail())) {
                String gEmail = user.getGoogleEmail().trim();
                if (gEmail.isEmpty()) {
                    user.setGoogleEmail(null);
                } else {
                    user.setGoogleEmail(gEmail);
                    existingProfile = userRepository.findByGoogleEmail(gEmail).orElse(null);
                }
            } else if (!StringUtils.hasText(user.getGoogleEmail())) {
                user.setGoogleEmail(null); // Ensure truly null if not present
            }

            if (existingProfile != null) {
                log.info("Account profile exists [ID: {}]. Switching to 'Profile Update' logic.", existingProfile.getId());
                isUpdate = true;
                user = mergeWithExistingUser(existingProfile, user, deptId, user.getPassword());
            } else {
                log.info("Creating fresh system account for name-based user");
                user = setupNewUser(user, deptId, user.getPassword());
            }

            // Sync manager status if applicable
            user = syncDepartmentManager(user);

            log.info("FINALIZED: {} workflow for [ID: {}, Email: {}] in {}ms", 
                isUpdate ? "UPDATE" : "CREATE", user.getId(), user.getEmail(), System.currentTimeMillis() - startTime);
            
            return user;
        } catch (EmployeeServiceException e) {
            log.error("ABORTED: Handled error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("SYSTEM ERROR: Failed at worker creation workflow. Reason: {}", e.getMessage(), e);
            throw new EmployeeServiceException("Could not finalize employee creation: " + e.getMessage());
        } finally {
            log.debug("FINISHED: Creation attempt for {} ended.", user.getFullName());
        }
    }

    private void validateUserFields(User user) {
        if (!StringUtils.hasText(user.getFullName())) {
            throw new EmployeeServiceException("Full name is physically required for record creation.");
        }
    }

    private User mergeWithExistingUser(User existingUser, User newUser, String deptId, String rawPassword) {
        // Chỉ cập nhật mật khẩu nếu quản trị viên nhập mật khẩu mới
        if (StringUtils.hasText(newUser.getPassword())) {
            existingUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
            log.info("MERGE: Password updated for user {}", existingUser.getEmail() != null ? existingUser.getEmail() : existingUser.getId());
        } else {
            log.info("MERGE: Password kept unchanged for user {}", existingUser.getEmail() != null ? existingUser.getEmail() : existingUser.getId());
        }
        
        if (newUser.getFullName() != null) {
            existingUser.setFullName(newUser.getFullName());
        }
        
        if (newUser.getRole() != null) {
            existingUser.setRole(newUser.getRole());
        }
        
        if (newUser.getAvatarUrl() != null) {
            existingUser.setAvatarUrl(newUser.getAvatarUrl());
        }

        if (newUser.getGoogleEmail() != null) {
            existingUser.setGoogleEmail(newUser.getGoogleEmail());
        }

        if (deptId != null && !deptId.isEmpty()) {
            Department dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new EmployeeServiceException("Selected department ID not found."));
            existingUser.setDepartment(dept);
        }

        User savedUser = userRepository.save(existingUser);
        log.info("MERGE SUCCESS: Updated existing user [ID: {}, Email: {}]", savedUser.getId(), savedUser.getEmail());
        
        // Notify about update (optional, but good for security)
        try {
            String recipientEmail = savedUser.getEmail() != null ? savedUser.getEmail() : savedUser.getGoogleEmail();
            if (recipientEmail != null) {
                emailService.sendPasswordChangeNotification(recipientEmail, savedUser.getFullName());
            }
        } catch (Exception e) {
            log.warn("NOTIFY FAILED: Could not send update notification to {}, but continuing. Error: {}", savedUser.getEmail(), e.getMessage());
        }
        
        return savedUser;
    }

    private User setupNewUser(User user, String deptId, String rawPassword) {
        if (deptId != null && !deptId.isEmpty()) {
            Department dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new EmployeeServiceException("Department reference missing."));
            user.setDepartment(dept);
        }

        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setActive(true);
        User savedUser = userRepository.save(user);

        // Send Email with credentials (internal email or google email as fallback)
        String recipientEmail = savedUser.getEmail() != null ? savedUser.getEmail() : savedUser.getGoogleEmail();
        if (recipientEmail != null) {
            emailService.sendCredentialsEmail(recipientEmail, savedUser.getFullName(), rawPassword);
        } else {
            log.warn("SKIP EMAIL: No email or Google Email available for user {}", savedUser.getFullName());
        }
        
        return savedUser;
    }

    private User syncDepartmentManager(User user) {
        if (user.getRole() == com.projectmanagement.core_system.enums.ERole.MANAGER && user.getDepartment() != null) {
            Department dept = user.getDepartment();
            if (dept.getManager() == null) {
                log.info("Auto-assigning {} as Manager for [Department: {}]", user.getFullName(), dept.getName());
                dept.setManager(user);
                departmentRepository.save(dept);
            }
        }
        return user;
    }

    // 2. Lấy tất cả (Có Sort)
    public List<User> getAllUsers(String sortBy, String order) { 
        org.springframework.data.domain.Sort sort = createSort(sortBy, order);
        return userRepository.findAll(sort); 
    }

    private org.springframework.data.domain.Sort createSort(String sortBy, String order) {
        if (sortBy == null || sortBy.isEmpty()) {
            sortBy = "fullName"; // Default
        }
        
        // Map frontend fields to backend fields
        String sortField = sortBy;
        if ("department".equals(sortBy)) {
            sortField = "department.name";
        }
        
        org.springframework.data.domain.Sort.Direction direction = 
            "desc".equalsIgnoreCase(order) ? org.springframework.data.domain.Sort.Direction.DESC : org.springframework.data.domain.Sort.Direction.ASC;
            
        return org.springframework.data.domain.Sort.by(direction, sortField);
    }

    // 3. Xóa User
    public void deleteUser(String userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User không tồn tại!"));
        if (user.getRole() == com.projectmanagement.core_system.enums.ERole.ADMIN) {
            throw new RuntimeException("Không được phép xóa tài khoản Quản trị viên (ADMIN)!");
        }
        // Logic xử lý khi xóa Trưởng phòng: Tự động gán người dự phòng nếu có
        Department dept = user.getDepartment();
        if (user.getRole() == com.projectmanagement.core_system.enums.ERole.MANAGER && dept != null) {
            if (dept.getManager() != null && dept.getManager().getId().equals(user.getId())) {
                dept.setManager(null);
                departmentRepository.save(dept);
                autoAssignFallbackManager(dept);
            }
        }

        userRepository.deleteById(userId);
    }

    // 4. Lấy theo ID
    public User getUserById(String id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy User: " + id));
    }

    // 5. 🔥 MỚI: Tìm kiếm User kết hợp Bộ lọc (Server-side)
    public java.util.List<User> searchUsers(String keyword, String deptId, com.projectmanagement.core_system.enums.ERole role, String sortBy, String order) {
        org.springframework.data.domain.Sort sort = createSort(sortBy, order);
        
        Query query = new Query();
        java.util.List<Criteria> criteriaList = new java.util.ArrayList<>();

        // 1. Tìm kiếm theo keyword (Tên, Email, Google Email)
        if (keyword != null && !keyword.trim().isEmpty()) {
            String k = keyword.trim();
            criteriaList.add(new Criteria().orOperator(
                Criteria.where("fullName").regex(k, "i"),
                Criteria.where("email").regex(k, "i"),
                Criteria.where("googleEmail").regex(k, "i")
            ));
        }

        // 2. Lọc theo Phòng ban (deptId)
        if (deptId != null && !deptId.isEmpty()) {
            criteriaList.add(Criteria.where("department.$id").is(new org.bson.types.ObjectId(deptId)));
        }

        // 3. Lọc theo Chức vụ (role)
        if (role != null) {
            criteriaList.add(Criteria.where("role").is(role));
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        query.with(sort);
        return mongoTemplate.find(query, User.class);
    }

    // 6. 🔥 MỚI: Đổi mật khẩu
    public User changePassword(String userId, String oldPassword, String newPassword) {
        User user = getUserById(userId);

        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác!");
        }

        // Validate new password
        if (!StringUtils.hasText(newPassword) || newPassword.length() < 6) {
            throw new RuntimeException("Mật khẩu mới phải có ít nhất 6 ký tự!");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        User savedUser = userRepository.save(user);

        // Send notification email
        String recipientEmail = savedUser.getEmail() != null ? savedUser.getEmail() : savedUser.getGoogleEmail();
        if (recipientEmail != null) {
            emailService.sendPasswordChangeNotification(recipientEmail, savedUser.getFullName());
        }
        
        return savedUser;
    }

    // 7. 🔥 MỚI: Upload Avatar
    public User uploadAvatar(String userId, MultipartFile avatarFile) throws IOException {
        if (avatarFile == null || avatarFile.isEmpty()) {
            throw new IllegalArgumentException("File ảnh không được để trống!");
        }

        String contentType = avatarFile.getContentType();
        if (contentType == null || !contentType.matches("image/(png|jpeg|jpg)")) {
            throw new IllegalArgumentException("Chỉ chấp nhận file ảnh PNG hoặc JPG!");
        }

        if (avatarFile.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Kích thước ảnh không được vượt quá 5MB!");
        }

        User user = getUserById(userId);
        String base64Avatar = convertFileToBase64(avatarFile);
        user.setAvatarUrl(base64Avatar);

        return userRepository.save(user);
    }

    // 8. 🔥 MỚI: Convert File to Base64
    public String convertFileToBase64(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        byte[] fileBytes = file.getBytes();
        String base64 = Base64.getEncoder().encodeToString(fileBytes);
        String contentType = file.getContentType();
        
        // Return data URL format
        return "data:" + contentType + ";base64," + base64;
    }

    // 9. 🔥 MỚI: Upload Avatar from URL
    public User uploadAvatarFromUrl(String userId, String imageUrl) throws IOException {
        if (imageUrl == null || imageUrl.isEmpty()) {
            throw new IllegalArgumentException("URL ảnh không được để trống!");
        }

        User user = getUserById(userId);
        String base64Avatar = downloadImageFromUrl(imageUrl);
        user.setAvatarUrl(base64Avatar);

        return userRepository.save(user);
    }

    // 10. 🔥 MỚI: Download Image from URL and convert to Base64
    public String downloadImageFromUrl(String imageUrl) throws IOException {
        if (imageUrl == null || imageUrl.isEmpty()) {
            throw new IllegalArgumentException("URL ảnh không được để trống!");
        }

        try {
            URL url = new URL(imageUrl);
            URLConnection connection = url.openConnection();
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            connection.setRequestProperty("User-Agent", "Mozilla/5.0");

            String contentType = connection.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("URL không chỉ tới một file ảnh!");
            }

            byte[] imageBytes = connection.getInputStream().readAllBytes();

            if (imageBytes.length > 5 * 1024 * 1024) {
                throw new IllegalArgumentException("Kích thước ảnh từ URL không được vượt quá 5MB!");
            }

            String base64 = Base64.getEncoder().encodeToString(imageBytes);
            return "data:" + contentType + ";base64," + base64;
        } catch (java.net.MalformedURLException e) {
            throw new IllegalArgumentException("URL không hợp lệ!");
        } catch (java.net.SocketTimeoutException e) {
            throw new IllegalArgumentException("Timeout khi tải ảnh từ URL!");
        } catch (IOException e) {
            throw new IOException("Lỗi khi tải ảnh từ URL: " + e.getMessage());
        }
    }

    // 11. Admin update employee info (email, department, role)
    public User updateEmployee(String userId, UpdateUserRequest request, String adminEmail) {
        User user = getUserById(userId);

        if (user.getRole() == com.projectmanagement.core_system.enums.ERole.ADMIN) {
            throw new RuntimeException("Không được phép chỉnh sửa thông tin của Quản trị viên (ADMIN)!");
        }

        // Optional fields only
        if (request.getFullName() != null && !request.getFullName().isEmpty()) {
            user.setFullName(request.getFullName());
        }

        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            if (userRepository.existsByEmail(request.getEmail()) && !user.getEmail().equals(request.getEmail())) {
                throw new RuntimeException("Email '" + request.getEmail() + "' đã được sử dụng bởi tài khoản khác!");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getGoogleEmail() != null) {
            user.setGoogleEmail(request.getGoogleEmail());
        }

        Department oldDepartment = user.getDepartment();
        com.projectmanagement.core_system.enums.ERole oldRole = user.getRole();

        if (request.getDeptId() != null && !request.getDeptId().isEmpty()) {
            Department dept = departmentRepository.findById(request.getDeptId())
                    .orElseThrow(() -> new RuntimeException("Phòng ban không tồn tại!"));
            user.setDepartment(dept);
        }

        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }

        user = userRepository.save(user);

        // Bidirectional Manager Sync
        boolean roleChanged = request.getRole() != null && oldRole != request.getRole();
        boolean deptChanged = request.getDeptId() != null && !request.getDeptId().isEmpty() && 
                              (oldDepartment == null || !oldDepartment.getId().equals(request.getDeptId()));

        // 1. If user was a MANAGER and either their role changed OR they moved to a different department,
        // we must remove them as manager from their OLD department.
        if (oldRole == com.projectmanagement.core_system.enums.ERole.MANAGER && (roleChanged || deptChanged)) {
            if (oldDepartment != null && oldDepartment.getManager() != null 
                && oldDepartment.getManager().getId().equals(user.getId())) {
                oldDepartment.setManager(null);
                departmentRepository.save(oldDepartment);
                // Tìm người dự phòng cho phòng cũ
                autoAssignFallbackManager(oldDepartment);
            }
        }

        // 2. If user is NOW a MANAGER and their role changed OR they moved to a new department,
        // we must assign them as manager to their NEW department.
        if (user.getRole() == com.projectmanagement.core_system.enums.ERole.MANAGER && (roleChanged || deptChanged)) {
            if (user.getDepartment() != null) {
                Department currentDept = user.getDepartment();
                currentDept.setManager(user);
                departmentRepository.save(currentDept);
            }
        }

        return user;
    }
    // Helper: Tự động gán Trưởng phòng dự phòng từ danh sách Manager trong phòng
    private void autoAssignFallbackManager(Department dept) {
        if (dept == null) return;
        
        java.util.List<User> managers = userRepository.findByDepartment_IdAndRole(
            dept.getId(), com.projectmanagement.core_system.enums.ERole.MANAGER, org.springframework.data.domain.Sort.unsorted());
        
        // Lọc bỏ người hiện tại (nếu vẫn còn trong list) và tìm người đầu tiên
        User fallbackManager = managers.stream()
            .filter(u -> dept.getManager() == null || !u.getId().equals(dept.getManager().getId()))
            .findFirst()
            .orElse(null);
            
        if (fallbackManager != null) {
            dept.setManager(fallbackManager);
            departmentRepository.save(dept);
        }
    }

    public User updateAvatar(String userId, String avatarUrl) {
        User user = getUserById(userId); // Validate tồn tại
        if (!user.isActive()) {
            throw new RuntimeException("Không thể cập nhật avatar cho tài khoản đã bị khóa!");
        }
        user.setAvatarUrl(avatarUrl.trim());
        return userRepository.save(user);
    }
}
