package com.projectmanagement.core_system.config;

import com.projectmanagement.core_system.enums.ERole;
import com.projectmanagement.core_system.model.Department;
import com.projectmanagement.core_system.model.User;
import com.projectmanagement.core_system.repository.DepartmentRepository;
import com.projectmanagement.core_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

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
        userRepository.save(admin);

        // Manager IT
        User itManager = new User();
        itManager.setFullName("Nguyễn Văn A (IT Manager)");
        itManager.setEmail("manager.it@example.com");
        itManager.setPassword(passwordEncoder.encode("manager123"));
        itManager.setRole(ERole.MANAGER);
        itManager.setDepartment(itDept);
        itManager.setActive(true);
        userRepository.save(itManager);

        // Manager HR
        User hrManager = new User();
        hrManager.setFullName("Trần Thị B (HR Manager)");
        hrManager.setEmail("manager.hr@example.com");
        hrManager.setPassword(passwordEncoder.encode("manager123"));
        hrManager.setRole(ERole.MANAGER);
        hrManager.setDepartment(hrDept);
        hrManager.setActive(true);
        userRepository.save(hrManager);

        // Employee IT
        User itEmployee1 = new User();
        itEmployee1.setFullName("Phạm Minh C (Developer)");
        itEmployee1.setEmail("employee.it.1@example.com");
        itEmployee1.setPassword(passwordEncoder.encode("employee123"));
        itEmployee1.setRole(ERole.EMPLOYEE);
        itEmployee1.setDepartment(itDept);
        itEmployee1.setActive(true);
        userRepository.save(itEmployee1);

        User itEmployee2 = new User();
        itEmployee2.setFullName("Lê Văn D (QA)");
        itEmployee2.setEmail("employee.it.2@example.com");
        itEmployee2.setPassword(passwordEncoder.encode("employee123"));
        itEmployee2.setRole(ERole.QA);
        itEmployee2.setDepartment(itDept);
        itEmployee2.setActive(true);
        userRepository.save(itEmployee2);

        // Employee HR
        User hrEmployee = new User();
        hrEmployee.setFullName("Vũ Thị E (HR Staff)");
        hrEmployee.setEmail("employee.hr@example.com");
        hrEmployee.setPassword(passwordEncoder.encode("employee123"));
        hrEmployee.setRole(ERole.EMPLOYEE);
        hrEmployee.setDepartment(hrDept);
        hrEmployee.setActive(true);
        userRepository.save(hrEmployee);

        // Employee Sales
        User salesEmployee = new User();
        salesEmployee.setFullName("Đỗ Văn F (Sales)");
        salesEmployee.setEmail("employee.sales@example.com");
        salesEmployee.setPassword(passwordEncoder.encode("employee123"));
        salesEmployee.setRole(ERole.EMPLOYEE);
        salesEmployee.setDepartment(salesDept);
        salesEmployee.setActive(true);
        userRepository.save(salesEmployee);

        System.out.println("✓ Khởi tạo dữ liệu thành công!");
        System.out.println("  - 3 Departments: IT, HR, Sales");
        System.out.println("  - 7 Users từ Admin đến Employee");
        System.out.println("\n📝 Tài khoản test:");
        System.out.println("  Admin: admin@example.com / admin123");
        System.out.println("  Manager: manager.it@example.com / manager123");
        System.out.println("  Employee: employee.it.1@example.com / employee123");
    }
}
