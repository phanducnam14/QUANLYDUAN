package com.projectmanagement.core_system.repository;

import com.projectmanagement.core_system.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends MongoRepository<User, Long> {
    
    // Tìm user bằng email để đăng nhập
    Optional<User> findByEmail(String email);
    
    // Kiểm tra email trùng khi tạo mới
    boolean existsByEmail(String email);

    // Tìm tất cả nhân viên thuộc 1 phòng ban
    List<User> findByDepartmentId(long departmentId);

    // 🔥 MỚI: Tìm kiếm theo Tên HOẶC Email (Không phân biệt hoa thường)
    // Ví dụ: Nhập "nam" sẽ ra "Phan Đức Nam" và "nam@gmail.com"
    List<User> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(String fullName, String email);
}