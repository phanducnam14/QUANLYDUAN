package com.projectmanagement.core_system.repository;

import com.projectmanagement.core_system.model.Project;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProjectRepository extends MongoRepository<Project, Long> {
    
    // Tìm danh sách dự án thuộc về một phòng ban cụ thể
    List<Project> findByDepartmentId(long departmentId);
    
    // Kiểm tra xem phòng ban này có dự án nào không (Để chặn xóa phòng ban)
    boolean existsByDepartmentId(long departmentId);

    // 🔥 MỚI: Tìm kiếm dự án theo tên (Không phân biệt hoa thường)
    // Ví dụ: Gõ "java" ra "Dự án Java Web", "JAVA Core"
    List<Project> findByNameContainingIgnoreCase(String name);
}