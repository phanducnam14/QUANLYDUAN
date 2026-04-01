package com.projectmanagement.core_system.repository;

import com.projectmanagement.core_system.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    // Tìm user bằng email để đăng nhập
    Optional<User> findByEmail(String email);
    
    // Kiểm tra email trùng khi tạo mới
    boolean existsByEmail(String email);

    // Tìm kiếm theo keyword (Chỉ Tên và Email)
    java.util.List<User> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrGoogleEmailContainingIgnoreCase(
        String fullName, String email, String googleEmail, org.springframework.data.domain.Sort sort
    );

    // Tìm kiếm kết hợp Filter (Phòng ban + Chức vụ) - Sẽ được Service sử dụng kết hợp
    java.util.List<User> findByDepartment_IdAndRole(String departmentId, com.projectmanagement.core_system.enums.ERole role, org.springframework.data.domain.Sort sort);
    java.util.List<User> findByRole(com.projectmanagement.core_system.enums.ERole role, org.springframework.data.domain.Sort sort);
    java.util.List<User> findByDepartment_Id(String departmentId, org.springframework.data.domain.Sort sort);

    // MỚI: Tìm user bằng googleEmail (OAuth2)
    Optional<User> findByGoogleEmail(String googleEmail);
}