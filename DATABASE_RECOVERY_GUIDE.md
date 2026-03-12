# 📚 Hướng dẫn khôi phục Database MongoDB

## 🎯 Tình huống: Xóa nhầm MongoDB Database

Nếu bạn vô tình xóa database `project_management_db`, đây là cách để khôi phục dữ liệu:

---

## ✅ CÁCH 1: Khôi phục Tự động (⭐ Khuyên dùng)

### Bước 1: Xóa database hiện tại
```bash
# Mở MongoDB shell hoặc MongoDB Compass
mongo
```

```javascript
use project_management_db
db.dropDatabase()
```

**Hoặc dùng MongoDB Compass:**
- Kết nối đến MongoDB Server
- Chọn database `project_management_db`
- Nhấn nút "Delete Database"

### Bước 2: Restart ứng dụng Spring Boot
```bash
# Trong project folder
mvn spring-boot:run
```

**Kết quả:**
- Ứng dụng sẽ **tự động tạo 5 collections** với dữ liệu mẫu:
  - ✅ **users** (7 users)
  - ✅ **departments** (3 departments)
  - ✅ **projects** (3 projects)
  - ✅ **tasks** (5 tasks)
  - ✅ **database_sequences** (auto-increment counter)

Console sẽ hiển thị:
```
⏳ Đang khởi tạo dữ liệu mẫu...
✓ Khởi tạo dữ liệu thành công!
  📊 Dữ liệu khởi tạo:
     - 3 Phòng ban (Departments)
     - 7 Người dùng (Users)
     - 3 Dự án (Projects)
     - 5 Công việc (Tasks)
     - 1 Collection database_sequences (tự động)
```

---

## 📋 5 Collections được tạo:

### 1️⃣ **users** Collection
- Admin (admin@example.com / admin123)
- 1 IT Manager
- 1 HR Manager
- 2 IT Employees (Developer + QA)
- 1 HR Employee
- 1 Sales Employee

### 2️⃣ **departments** Collection
- IT (Phòng Công nghệ Thông tin)
- HR (Phòng Nhân sự)
- Sales (Phòng Bán hàng)

### 3️⃣ **projects** Collection
- Build Mobile App (HIGH priority, IN_PROGRESS)
- Website Redesign (MEDIUM priority, OPEN)
- HR System (HIGH priority, IN_PROGRESS)

### 4️⃣ **tasks** Collection
- Thiết kế UI/UX (60% hoàn thành)
- Phát triển Backend API (0% hoàn thành)
- Responsive Design (30% hoàn thành)
- Database Design (50% hoàn thành)
- Testing & QA (100% hoàn thành)

### 5️⃣ **database_sequences** Collection
- Lưu trữ ID counter cho projects
- Lưu trữ ID counter cho tasks
- **Tạo tự động** khi cần

---

## 🔐 Tài khoản Test mặc định:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin123` |
| Manager | `manager.it@example.com` | `manager123` |
| Employee | `employee.it.1@example.com` | `employee123` |

---

## 🛠️ CÁCH 2: Kiểm tra & Khôi phục Manual (nếu cần)

### Kiểm tra dữ liệu đã được tạo chưa:

#### Dùng MongoDB Shell:
```javascript
use project_management_db

// Kiểm tra collections
show collections

// Kiểm tra số lượng documents
db.users.count()           // Kỳ vọng: 7
db.departments.count()     // Kỳ vọng: 3
db.projects.count()        // Kỳ vọng: 3
db.tasks.count()           // Kỳ vọng: 5
db.database_sequences.count() // Kỳ vọng: 2
```

#### Dùng MongoDB Compass:
1. Kết nối đến MongoDB
2. Chọn database `project_management_db`
3. Xem danh sách collections ở thanh bên trái
4. Nhấn vào từng collection để xem dữ liệu

---

## ⚙️ Cấu hình MongoDB:

**File:** `application.properties`

```properties
# MongoDB Connection
spring.data.mongodb.uri=mongodb://localhost:27017/project_management_db
spring.data.mongodb.auto-index-creation=true
```

**Đảm bảo:**
- ✅ MongoDB Server đang chạy (localhost:27017)
- ✅ Database name: `project_management_db`
- ✅ Không có authentication (hoặc config đúng nếu có)

---

## 🔄 Quy trình Initialization:

```
Spring Boot Start
    ↓
DataInitializer.run() được gọi
    ↓
Kiểm tra: userRepository.count() > 0?
    ├─ YES → Bỏ qua (dữ liệu đã có)
    └─ NO → Tạo dữ liệu mẫu
         ├─ Create Departments
         ├─ Create Users
         ├─ Create Projects
         ├─ Create Tasks
         └─ Create database_sequences
    ↓
App sẵn sàng! ✓
```

---

## 🔍 Troubleshooting:

### ❌ Database không tự động tạo dữ liệu?

1. **Kiểm tra MongoDB đang chạy:**
   ```bash
   # Windows - kiểm tra serviceMongoDB chạy không
   net start MongoDB
   ```

2. **Xem logs:**
   ```
   ✓ Database đã có dữ liệu, bỏ qua khởi tạo.
   ```
   → Nếu thấy này = dữ liệu đã tồn tại

3. **Xóa sạch database:**
   ```javascript
   use project_management_db
   db.dropDatabase()
   ```
   Rồi restart Spring Boot

4. **Kiểm tra DataInitializer được load:**
   - File: `src/main/java/com/projectmanagement/core_system/config/DataInitializer.java`
   - Phải có `@Component` annotation
   - Phải implement `ApplicationRunner`

---

## 📌 Ghi chú quan trọng:

1. **DataInitializer chỉ chạy 1 lần** - nếu database có dữ liệu rồi thì sẽ bỏ qua
2. **Để chạy lại** → Xóa database → Restart app
3. **Dữ liệu sample** được định nghĩa trong file `DataInitializer.java`
4. **Nếu muốn thêm dữ liệu mới** → Sửa file `DataInitializer.java` → Xóa DB → Restart app

---

## 🎓 Để chỉnh sửa dữ liệu khởi tạo:

**File:** `src/main/java/com/projectmanagement/core_system/config/DataInitializer.java`

Bạn có thể:
- ✏️ Thêm/xóa users
- ✏️ Thêm/xóa departments  
- ✏️ Thêm/xóa projects
- ✏️ Thêm/xóa tasks
- ✏️ Thay đổi passwords, mô tả, deadlines, v.v.

Ví dụ thêm user mới:
```java
User newEmployee = new User();
newEmployee.setFullName("Bùi Văn G (Intern)");
newEmployee.setEmail("intern@example.com");
newEmployee.setPassword(passwordEncoder.encode("intern123"));
newEmployee.setRole(ERole.EMPLOYEE);
newEmployee.setDepartment(itDept);
newEmployee.setActive(true);
newEmployee = userRepository.save(newEmployee);
```

---

✅ **Hiện tại DataInitializer.java đã được cập nhật để tạo đủ 5 collections với dữ liệu sample!**
