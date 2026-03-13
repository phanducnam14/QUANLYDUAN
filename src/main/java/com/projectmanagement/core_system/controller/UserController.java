package com.projectmanagement.core_system.controller;

import com.projectmanagement.core_system.model.User;
import com.projectmanagement.core_system.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserService userService;

    // 1. Lấy danh sách tất cả (Mặc định)
    @GetMapping
    public ResponseEntity<?> getAll() { 
        try {
            return ResponseEntity.ok(userService.getAllUsers());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Lỗi: " + e.getMessage());
        }
    }

    // 2. 🔥 API MỚI: Tìm kiếm nhân viên
    // Cách gọi: GET http://localhost:8080/api/users/search?keyword=abc
    @GetMapping("/search")
    public List<User> search(@RequestParam String keyword) {
        return userService.searchUsers(keyword);
    }

    // 3. Tạo nhân viên mới
    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody User user,
            @RequestParam(required = false) String deptId 
    ) {
        try {
            return ResponseEntity.ok(userService.createUser(user, deptId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 4. Xóa nhân viên
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok("Đã xóa nhân viên thành công!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}