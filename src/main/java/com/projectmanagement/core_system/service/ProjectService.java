package com.projectmanagement.core_system.service;

import com.projectmanagement.core_system.enums.ProjectStatus;
import com.projectmanagement.core_system.model.Department;
import com.projectmanagement.core_system.model.Project;
import com.projectmanagement.core_system.model.User;
import com.projectmanagement.core_system.repository.DepartmentRepository;
import com.projectmanagement.core_system.repository.ProjectRepository;
import com.projectmanagement.core_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils; // Nhớ import cái này để check rỗng

import java.util.List;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SequenceGeneratorService sequenceGeneratorService;

    // 1. Tạo dự án mới
    public Project createProject(Project project, long departmentId, String creatorEmail) {
        // 🔥 Validate: Tên dự án không được để trống
        if (!StringUtils.hasText(project.getName())) {
            throw new RuntimeException("Tên dự án không được để trống!");
        }

        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Phòng ban không tồn tại!"));

        // Sinh ID tự tăng
        project.setId(sequenceGeneratorService.generateSequence(Project.SEQUENCE_NAME));

        project.setDepartment(dept);
        project.setCreatedBy(creatorEmail);
        
        // Nếu chưa có status thì set mặc định OPEN
        if (project.getStatus() == null) {
            project.setStatus(ProjectStatus.OPEN); 
        }

        return projectRepository.save(project);
    }

    // 2. Thêm thành viên vào dự án
    public Project addMember(long projectId, long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Dự án không tìm thấy!"));

        // Check trạng thái trước khi thêm
        if (project.getStatus() == ProjectStatus.CLOSED) {
            throw new RuntimeException("Dự án đã đóng, không thể thêm thành viên!");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Nhân viên không tìm thấy!"));

        // Check cùng phòng ban
        long projectDeptId = project.getDepartment().getId();
        long userDeptId = (user.getDepartment() != null) ? user.getDepartment().getId() : -1;

        if (projectDeptId != userDeptId) {
            throw new RuntimeException("LỖI: Nhân viên này thuộc phòng ban khác!");
        }

        // Check trùng lặp: Nếu user đã có trong list rồi thì thôi
        boolean exists = project.getMembers().stream().anyMatch(m -> m.getId() == userId);
        if (exists) {
            throw new RuntimeException("Nhân viên này đã tham gia dự án rồi!");
        }

        project.getMembers().add(user);
        return projectRepository.save(project);
    }

    // 3. Lấy tất cả
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    // 4. 🔥 MỚI: Tìm kiếm dự án
    public List<Project> searchProjects(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllProjects(); // Trả về tất cả nếu từ khóa rỗng
        }
        return projectRepository.findByNameContainingIgnoreCase(keyword);
    }
}