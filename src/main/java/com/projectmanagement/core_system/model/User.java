package com.projectmanagement.core_system.model;

import com.projectmanagement.core_system.enums.ERole;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Transient
    public static final String SEQUENCE_NAME = "users_sequence";

    @Id
    private String id;

    private String fullName;

    @Indexed(unique = true, sparse = true)
    private String email;

    private String password;

    private ERole role;

    @DBRef
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties({"manager"})
    private Department department;

    private boolean isActive = true; 
    private Long createdAt = System.currentTimeMillis();
    
    private String avatarUrl;
    private String googleEmail; // Field for linking Google account if different from primary email
}