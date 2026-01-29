package com.projectmanagement.core_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CoreSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(CoreSystemApplication.class, args);
        
        // In thông báo khi chạy thành công
        System.out.println("\n\n===========================================================");
        System.out.println("🚀 DỰ ÁN CORE-SYSTEM ĐÃ KHỞI ĐỘNG THÀNH CÔNG! 🚀");
        System.out.println("-----------------------------------------------------------");
        System.out.println("✅ Server đang chạy tại: http://localhost:8080");
        System.out.println("===========================================================\n");
    }

}