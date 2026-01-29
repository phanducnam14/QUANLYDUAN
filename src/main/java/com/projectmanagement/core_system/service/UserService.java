package com.projectmanagement.core_system.service;

import com.projectmanagement.core_system.model.Department;
import com.projectmanagement.core_system.model.User;
import com.projectmanagement.core_system.repository.DepartmentRepository;
import com.projectmanagement.core_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SequenceGeneratorService sequenceGeneratorService;

    // 1. Tạo User (Thêm Validate kỹ càng hơn)
    public User createUser(User user, Long deptId) {
        // 🔥 Validate dữ liệu đầu vào
        if (!StringUtils.hasText(user.getFullName())) {
            throw new RuntimeException("Họ tên không được để trống!");
        }
        if (!StringUtils.hasText(user.getEmail())) {
            throw new RuntimeException("Email không được để trống!");
        }
        if (!StringUtils.hasText(user.getPassword())) {
            throw new RuntimeException("Mật khẩu không được để trống!");
        }

        // Check trùng email
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email '" + user.getEmail() + "' đã tồn tại trong hệ thống!");
        }

        // Logic gắn phòng ban
        if (deptId != null && deptId > 0) {
            Department dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new RuntimeException("Phòng ban không tồn tại!"));
            user.setDepartment(dept);
        }

        // Sinh ID & Mã hóa pass
        user.setId(sequenceGeneratorService.generateSequence(User.SEQUENCE_NAME));
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        return userRepository.save(user);
    }

    // 2. Lấy tất cả
    public List<User> getAllUsers() { 
        return userRepository.findAll(); 
    }

    // 3. Xóa User
    public void deleteUser(long userId) {
        if (!userRepository.existsById(userId)) throw new RuntimeException("User không tồn tại!");
        userRepository.deleteById(userId);
    }

    // 4. Lấy theo ID
    public User getUserById(long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy User: " + id));
    }

    // 5. 🔥 MỚI: Tìm kiếm User
    public List<User> searchUsers(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllUsers(); // Nếu từ khóa rỗng thì trả về tất cả
        }
        return userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(keyword, keyword);
    }
}