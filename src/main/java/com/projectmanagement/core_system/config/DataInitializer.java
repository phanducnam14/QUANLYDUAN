package com.projectmanagement.core_system.config;

import com.projectmanagement.core_system.enums.ERole;
import com.projectmanagement.core_system.enums.Priority;
import com.projectmanagement.core_system.enums.ProjectStatus;
import com.projectmanagement.core_system.enums.TaskStatus;
import com.projectmanagement.core_system.model.Department;
import com.projectmanagement.core_system.model.User;
import com.projectmanagement.core_system.model.Project;
import com.projectmanagement.core_system.model.Task;
import com.projectmanagement.core_system.repository.DepartmentRepository;
import com.projectmanagement.core_system.repository.UserRepository;
import com.projectmanagement.core_system.repository.ProjectRepository;
import com.projectmanagement.core_system.repository.TaskRepository;
import com.projectmanagement.core_system.service.SequenceGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;

@Component
public class DataInitializer implements ApplicationRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private SequenceGeneratorService sequenceGeneratorService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // Kiểm tra xem đã có dữ liệu chưa - nếu có rồi thì không insert nữa
        if (userRepository.count() > 0) {
            System.out.println("✓ Database đã có dữ liệu, bỏ qua khởi tạo.");
            return;
        }

        System.out.println("⏳ Đang khởi tạo dữ liệu mẫu...");

        // ========== KHỞI TẠO DEPARTMENT ==========
        Department itDept = new Department();
        itDept.setName("IT");
        itDept.setDescription("Phòng Công nghệ Thông tin");
        itDept = departmentRepository.save(itDept);

        Department hrDept = new Department();
        hrDept.setName("HR");
        hrDept.setDescription("Phòng Nhân sự");
        hrDept = departmentRepository.save(hrDept);

        Department salesDept = new Department();
        salesDept.setName("Sales");
        salesDept.setDescription("Phòng Bán hàng");
        salesDept = departmentRepository.save(salesDept);

        // ========== KHỞI TẠO USER ==========
        // Admin
        User admin = new User();
        admin.setFullName("Administrator");
        admin.setEmail("admin@example.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole(ERole.ADMIN);
        admin.setDepartment(itDept);
        admin.setActive(true);
        admin = userRepository.save(admin);

        // Manager IT
        User itManager = new User();
        itManager.setFullName("Nguyễn Văn A (IT Manager)");
        itManager.setEmail("manager.it@example.com");
        itManager.setPassword(passwordEncoder.encode("manager123"));
        itManager.setRole(ERole.MANAGER);
        itManager.setDepartment(itDept);
        itManager.setActive(true);
        itManager = userRepository.save(itManager);

        // Manager HR
        User hrManager = new User();
        hrManager.setFullName("Trần Thị B (HR Manager)");
        hrManager.setEmail("manager.hr@example.com");
        hrManager.setPassword(passwordEncoder.encode("manager123"));
        hrManager.setRole(ERole.MANAGER);
        hrManager.setDepartment(hrDept);
        hrManager.setActive(true);
        hrManager = userRepository.save(hrManager);

        // Employee IT
        User itEmployee1 = new User();
        itEmployee1.setFullName("Phạm Minh C (Developer)");
        itEmployee1.setEmail("employee.it.1@example.com");
        itEmployee1.setPassword(passwordEncoder.encode("employee123"));
        itEmployee1.setRole(ERole.EMPLOYEE);
        itEmployee1.setDepartment(itDept);
        itEmployee1.setActive(true);
        itEmployee1 = userRepository.save(itEmployee1);

        User itEmployee2 = new User();
        itEmployee2.setFullName("Lê Văn D (QA)");
        itEmployee2.setEmail("employee.it.2@example.com");
        itEmployee2.setPassword(passwordEncoder.encode("employee123"));
        itEmployee2.setRole(ERole.QA);
        itEmployee2.setDepartment(itDept);
        itEmployee2.setActive(true);
        itEmployee2 = userRepository.save(itEmployee2);

        // Employee HR
        User hrEmployee = new User();
        hrEmployee.setFullName("Vũ Thị E (HR Staff)");
        hrEmployee.setEmail("employee.hr@example.com");
        hrEmployee.setPassword(passwordEncoder.encode("employee123"));
        hrEmployee.setRole(ERole.EMPLOYEE);
        hrEmployee.setDepartment(hrDept);
        hrEmployee.setActive(true);
        hrEmployee = userRepository.save(hrEmployee);

        // Employee Sales
        User salesEmployee = new User();
        salesEmployee.setFullName("Đỗ Văn F (Sales)");
        salesEmployee.setEmail("employee.sales@example.com");
        salesEmployee.setPassword(passwordEncoder.encode("employee123"));
        salesEmployee.setRole(ERole.EMPLOYEE);
        salesEmployee.setDepartment(salesDept);
        salesEmployee.setActive(true);
        salesEmployee = userRepository.save(salesEmployee);

        // ========== KHỞI TẠO PROJECT ==========
        Project project1 = new Project();
        project1.setId(sequenceGeneratorService.generateSequence("projects_sequence"));
        project1.setName("Build Mobile App");
        project1.setDescription("Phát triển ứng dụng di động cho iOS và Android");
        project1.setDepartment(itDept);
        project1.setPriority(Priority.HIGH);
        project1.setStatus(ProjectStatus.OPEN);
        project1.setDeadline(LocalDate.now().plusMonths(3));
        project1.setMembers(Arrays.asList(itManager, itEmployee1, itEmployee2));
        project1.setCreatedBy("admin@example.com");
        project1 = projectRepository.save(project1);

        Project project2 = new Project();
        project2.setId(sequenceGeneratorService.generateSequence("projects_sequence"));
        project2.setName("Website Redesign");
        project2.setDescription("Thiết kế lại giao diện website công ty");
        project2.setDepartment(itDept);
        project2.setPriority(Priority.MEDIUM);
        project2.setStatus(ProjectStatus.OPEN);
        project2.setDeadline(LocalDate.now().plusMonths(2));
        project2.setMembers(Arrays.asList(itEmployee1));
        project2.setCreatedBy("admin@example.com");
        project2 = projectRepository.save(project2);

        Project project3 = new Project();
        project3.setId(sequenceGeneratorService.generateSequence("projects_sequence"));
        project3.setName("HR System");
        project3.setDescription("Hệ thống quản lý nhân sự toàn diện");
        project3.setDepartment(hrDept);
        project3.setPriority(Priority.HIGH);
        project3.setStatus(ProjectStatus.OPEN);
        project3.setDeadline(LocalDate.now().plusMonths(4));
        project3.setMembers(Arrays.asList(hrManager, hrEmployee));
        project3.setCreatedBy("admin@example.com");
        project3 = projectRepository.save(project3);

        // ========== KHỞI TẠO TASK ==========
        Task task1 = new Task();
        task1.setId(sequenceGeneratorService.generateSequence("tasks_sequence"));
        task1.setTitle("Thiết kế UI/UX");
        task1.setDescription("Tạo wireframe và mockup cho ứng dụng di động");
        task1.setProject(project1);
        task1.setAssignee(itEmployee1);
        task1.setPriority(Priority.HIGH);
        task1.setStatus(TaskStatus.IN_PROGRESS);
        task1.setCompletionPercentage(60);
        task1.setDeadline(LocalDate.now().plusDays(10));
        taskRepository.save(task1);

        Task task2 = new Task();
        task2.setId(sequenceGeneratorService.generateSequence("tasks_sequence"));
        task2.setTitle("Phát triển Backend API");
        task2.setDescription("Xây dựng REST API cho ứng dụng di động");
        task2.setProject(project1);
        task2.setAssignee(itEmployee2);
        task2.setPriority(Priority.HIGH);
        task2.setStatus(TaskStatus.TO_DO);
        task2.setCompletionPercentage(0);
        task2.setDeadline(LocalDate.now().plusDays(20));
        taskRepository.save(task2);

        Task task3 = new Task();
        task3.setId(sequenceGeneratorService.generateSequence("tasks_sequence"));
        task3.setTitle("Responsive Design");
        task3.setDescription("Đảm bảo website hoạt động tốt trên mobile");
        task3.setProject(project2);
        task3.setAssignee(itEmployee1);
        task3.setPriority(Priority.MEDIUM);
        task3.setStatus(TaskStatus.TO_DO);
        task3.setCompletionPercentage(30);
        task3.setDeadline(LocalDate.now().plusDays(15));
        taskRepository.save(task3);

        Task task4 = new Task();
        task4.setId(sequenceGeneratorService.generateSequence("tasks_sequence"));
        task4.setTitle("Database Design");
        task4.setDescription("Thiết kế schema database cho HR System");
        task4.setProject(project3);
        task4.setAssignee(hrEmployee);
        task4.setPriority(Priority.HIGH);
        task4.setStatus(TaskStatus.IN_PROGRESS);
        task4.setCompletionPercentage(50);
        task4.setDeadline(LocalDate.now().plusDays(8));
        taskRepository.save(task4);

        Task task5 = new Task();
        task5.setId(sequenceGeneratorService.generateSequence("tasks_sequence"));
        task5.setTitle("Testing & QA");
        task5.setDescription("Kiểm tra và đảm bảo chất lượng HR System");
        task5.setProject(project3);
        task5.setAssignee(itEmployee2);
        task5.setPriority(Priority.MEDIUM);
        task5.setStatus(TaskStatus.DONE);
        task5.setCompletionPercentage(100);
        task5.setDeadline(LocalDate.now().plusDays(25));
        taskRepository.save(task5);

        System.out.println("✓ Khởi tạo dữ liệu thành công!");
        System.out.println("  📊 Dữ liệu khởi tạo:");
        System.out.println("     - 3 Phòng ban (Departments)");
        System.out.println("     - 7 Người dùng (Users)");
        System.out.println("     - 3 Dự án (Projects)");
        System.out.println("     - 5 Công việc (Tasks)");
        System.out.println("     - 1 Collection database_sequences (tự động)");
        System.out.println("\n📝 Tài khoản test:");
        System.out.println("   Admin: admin@example.com / admin123");
        System.out.println("   Manager: manager.it@example.com / manager123");
        System.out.println("   Employee: employee.it.1@example.com / employee123");
        System.out.println("\n✨ Tất cả 5 Collections đã được tạo!");
    }
}
