package com.projectmanagement.core_system.model;

import com.projectmanagement.core_system.enums.ERole;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient; // Import cái này để không lưu field SEQUENCE_NAME vào DB
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    // Khai báo tên bộ đếm cho bảng User
    @Transient
    public static final String SEQUENCE_NAME = "users_sequence";

    @Id
    private long id; // Đổi từ String sang long

    private String fullName;

    @Indexed(unique = true)
    private String email;

    private String password;

    private ERole role;

    @DBRef
    private Department department;

    private boolean isActive = false; 
    private Long createdAt = System.currentTimeMillis();
}