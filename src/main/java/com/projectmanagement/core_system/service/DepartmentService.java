package com.projectmanagement.core_system.service;

import com.projectmanagement.core_system.model.Department;
import com.projectmanagement.core_system.repository.DepartmentRepository;
import com.projectmanagement.core_system.repository.ProjectRepository;
import com.projectmanagement.core_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private SequenceGeneratorService sequenceGeneratorService;

    // 1. Lấy danh sách
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    // 2. Tạo phòng ban mới (Nâng cấp)
    public Department createDepartment(Department department) {
        // 🔥 Validate: Tên không được rỗng
        if (!StringUtils.hasText(department.getName())) {
            throw new RuntimeException("Tên phòng ban không được để trống!");
        }

        // 🔥 Validate: Check trùng tên (Không phân biệt hoa thường)
        if (departmentRepository.existsByNameIgnoreCase(department.getName())) {
            throw new RuntimeException("Phòng ban '" + department.getName() + "' đã tồn tại!");
        }

        department.setId(sequenceGeneratorService.generateSequence(Department.SEQUENCE_NAME));

        return departmentRepository.save(department);
    }

    // 3. Xóa phòng ban an toàn
    public void deleteDepartment(long id) {
        // Kiểm tra xem phòng ban có tồn tại không
        if (!departmentRepository.existsById(id)) {
            throw new RuntimeException("Phòng ban không tồn tại!");
        }

        // 🛑 Chặn xóa nếu còn Nhân viên
        if (!userRepository.findByDepartmentId(id).isEmpty()) {
            throw new RuntimeException("Không thể xóa: Vẫn còn nhân viên thuộc phòng ban này!");
        }

        // 🛑 Chặn xóa nếu còn Dự án
        if (projectRepository.existsByDepartmentId(id)) {
            throw new RuntimeException("Không thể xóa: Phòng ban đang phụ trách dự án!");
        }

        departmentRepository.deleteById(id);
    }
}