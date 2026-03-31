package com.projectmanagement.core_system.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import java.util.Optional;

import com.projectmanagement.core_system.enums.ERole;
import com.projectmanagement.core_system.model.Department;
import com.projectmanagement.core_system.model.User;
import com.projectmanagement.core_system.repository.DepartmentRepository;
import com.projectmanagement.core_system.repository.UserRepository;
import com.projectmanagement.core_system.utils.EmailGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.projectmanagement.core_system.model.UpdateUserRequest;
import java.util.List;
import java.util.Collections;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailGenerator emailGenerator;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private Department testDept;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user123");
        testUser.setFullName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setPassword("password123");
        testUser.setRole(ERole.EMPLOYEE);

        testDept = new Department();
        testDept.setId("dept123");
        testDept.setName("Software");
    }

    @Test
    void createUser_WithExistingEmail_ShouldUpdate() {
        // Arrange
        when(userRepository.existsByEmail(anyString())).thenReturn(true);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPass");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.createUser(testUser, null);

        // Assert
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
        verify(emailService).sendPasswordChangeNotification(anyString(), anyString());
    }

    @Test
    void createUser_WithNoEmail_ShouldGenerateAndCreate() {
        // Arrange
        testUser.setEmail(null);
        String generatedEmail = "test.user.123@quanlyduan.com";
        
        when(emailGenerator.generate(anyString())).thenReturn(generatedEmail);
        when(userRepository.existsByEmail(generatedEmail)).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPass");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        User result = userService.createUser(testUser, null);

        // Assert
        assertNotNull(result);
        assertEquals(generatedEmail, result.getEmail());
        verify(emailService).sendCredentialsEmail(eq(generatedEmail), anyString(), anyString());
    }

    @Test
    void deleteUser_Manager_ShouldTriggerFallback() {
        // Arrange
        testUser.setRole(ERole.MANAGER);
        testUser.setDepartment(testDept);
        testDept.setManager(testUser);
        
        when(userRepository.findById("user123")).thenReturn(Optional.of(testUser));
        when(userRepository.findByDepartment_IdAndRole(anyString(), eq(ERole.MANAGER), any(org.springframework.data.domain.Sort.class)))
            .thenReturn(Collections.emptyList());

        // Act
        userService.deleteUser("user123");

        // Assert
        verify(userRepository).deleteById("user123");
        assertNull(testDept.getManager());
    }

    @Test
    void changePassword_ValidInput_ShouldSucceed() {
        // Arrange
        when(userRepository.findById("user123")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(passwordEncoder.encode(anyString())).thenReturn("newEncodedPass");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        User result = userService.changePassword("user123", "password123", "newPassword123");

        // Assert
        assertEquals("newEncodedPass", result.getPassword());
        verify(emailService).sendPasswordChangeNotification(anyString(), anyString());
    }

    @Test
    void updateEmployee_ValidRequest_ShouldUpdateFields() {
        // Arrange
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFullName("Updated Name");
        request.setRole(ERole.MANAGER);
        
        when(userRepository.findById("user123")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        User result = userService.updateEmployee("user123", request, "admin@test.com");

        // Assert
        assertEquals("Updated Name", result.getFullName()); 
        assertEquals(ERole.MANAGER, result.getRole());
    }

    @Test
    void searchUsers_ValidKeyword_ShouldReturnList() {
        // Arrange
        when(userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrGoogleEmailContainingIgnoreCase(
            anyString(), anyString(), anyString(), any(org.springframework.data.domain.Sort.class)))
            .thenReturn(List.of(testUser));

        // Act
        List<User> results = userService.searchUsers("test", null, null, null, null);

        // Assert
        assertEquals(1, results.size());
        assertEquals("test@example.com", results.get(0).getEmail());
    }
}
