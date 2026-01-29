package com.projectmanagement.core_system.controller;

import com.projectmanagement.core_system.enums.ProjectStatus;
import com.projectmanagement.core_system.model.Project;
import com.projectmanagement.core_system.repository.ProjectRepository;
import com.projectmanagement.core_system.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ProjectRepository projectRepository;

    // 1. Tạo dự án
    @PostMapping("/create")
    public ResponseEntity<?> createProject(
            @RequestBody Project project,
            @RequestParam long deptId,
            @RequestParam String email) {
        try {
            project.setStatus(ProjectStatus.OPEN);
            return ResponseEntity.ok(projectService.createProject(project, deptId, email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 2. Thêm thành viên
    @PostMapping("/{projectId}/add-member/{userId}")
    public ResponseEntity<?> addMember(@PathVariable long projectId, @PathVariable long userId) {
        try {
            return ResponseEntity.ok(projectService.addMember(projectId, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 3. Lấy tất cả
    @GetMapping
    public List<Project> getAll() {
        return projectService.getAllProjects();
    }

    // 4. 🔥 API MỚI: Tìm kiếm dự án
    // GET /api/projects/search?keyword=abc
    @GetMapping("/search")
    public List<Project> search(@RequestParam String keyword) {
        return projectService.searchProjects(keyword);
    }

    // 5. Đóng dự án
    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeProject(@PathVariable long id) {
        try {
            Project project = projectRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Dự án không tồn tại!"));

            project.setStatus(ProjectStatus.CLOSED);
            
            projectRepository.save(project);
            return ResponseEntity.ok("Dự án đã được đóng thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}