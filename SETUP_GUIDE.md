# 🚀 Hướng dẫn Setup & Chạy Dự án (Cho Đồng đội)

## 📋 Yêu cầu trước khi bắt đầu

### 1. **Java 17+** (Backend Spring Boot)
```bash
# Kiểm tra phiên bản Java
java -version
```

Nếu chưa có, tải tại: https://www.oracle.com/java/technologies/downloads/#java17

### 2. **Node.js & npm** (Frontend React/Vite)
```bash
# Kiểm tra phiên bản
node -v
npm -v
```

Nếu chưa có, tải tại: https://nodejs.org/ (LTS)

### 3. **MongoDB** (Database)
```bash
# Kiểm tra MongoDB đang chạy
mongo --version
```

Nếu chưa có:
- **Windows**: https://www.mongodb.com/try/download/community
- **Linux**: `sudo apt-get install mongodb`
- **macOS**: `brew install mongodb-community`

**Đảm bảo MongoDB Server đang chạy:**
```bash
# Windows - Kiểm tra service đang chạy
net start MongoDB

# Linux/macOS
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### 4. **Git** (Clone dự án)
```bash
git --version
```

---

## 📥 Bước 1: Clone dự án

```bash
git clone <repository-url>
cd QUANLYDUAN
```

---

## ⚙️ Bước 2: Cấu hình Backend (Spring Boot)

### 2.1. Kiểm tra file cấu hình
**File:** `src/main/resources/application.properties`

```properties
# 1. Cấu hình Server
server.port=8080

# 2. Kết nối MongoDB
spring.data.mongodb.uri=mongodb://localhost:27017/project_management_db
spring.data.mongodb.auto-index-creation=true

# 3. Cấu hình hiển thị log
logging.level.org.springframework.data.mongodb.core.MongoTemplate=DEBUG

# 4. Cấu hình Mail (nếu có)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.jackson.serialization.write-dates-as-timestamps=false
```

**⚠️ Nếu MongoDB ở server khác:**
```properties
# Ví dụ: MongoDB trên server 192.168.1.100
spring.data.mongodb.uri=mongodb://192.168.1.100:27017/project_management_db

# Với authentication
spring.data.mongodb.uri=mongodb://username:password@localhost:27017/project_management_db?authSource=admin
```

### 2.2. Build Backend
```bash
# Cách 1: Dùng Maven Wrapper (khuyên dùng - không cần cài Maven)
./mvnw clean install

# Cách 2: Dùng Maven (nếu đã cài)
mvn clean install
```

**Ngồi chờ ~ 3-5 phút** cho Maven download dependencies.

### 2.3. Kiểm tra Build thành công
```bash
# Nếu thấy [INFO] BUILD SUCCESS → OK!
```

---

## ⚙️ Bước 3: Cấu hình Frontend (React/Vite)

### 3.1. Cài dependencies
```bash
cd client-app
npm install
```

**Ngồi chờ ~ 1-2 phút** cho npm download packages.

### 3.2. Kiểm tra cấu hình API Backend
**File:** `client-app/src/main.jsx` hoặc `.env`

Tìm xem có `axios` config hay không:
```javascript
// Ví dụ
axios.defaults.baseURL = 'http://localhost:8080/api';
```

Nếu không có, thêm vào hoặc tạo `.env`:
```
VITE_API_URL=http://localhost:8080/api
```

### 3.3. Kiểm tra vite.config.js
**File:** `client-app/vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
```

---

## 🚀 Bước 4: Chạy toàn bộ dự án

### **Terminal 1 - Backend (Spring Boot)**
```bash
# Từ thư mục gốc QUANLYDUAN
./mvnw spring-boot:run

# Hoặc
mvn spring-boot:run
```

**Kỳ vọng:**
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.5.10)

⏳ Đang khởi tạo dữ liệu mẫu...
✓ Khởi tạo dữ liệu thành công!
  📊 Dữ liệu khởi tạo:
     - 3 Phòng ban (Departments)
     - 7 Người dùng (Users)
     - 3 Dự án (Projects)
     - 5 Công việc (Tasks)
     - 1 Collection database_sequences (tự động)

2025-03-12 10:30:45.123  INFO 12345 --- [main] c.p.c.CoreSystemApplication : Started CoreSystemApplication in 8.234 seconds
```

**Backend chạy tại:** `http://localhost:8080`

---

### **Terminal 2 - Frontend (React/Vite)**
```bash
cd client-app
npm run dev
```

**Kỳ vọng:**
```
  VITE v7.2.4  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

**Frontend chạy tại:** `http://localhost:5173` (hoặc `http://localhost:3000`)

---

## 🌐 Truy cập ứng dụng

1. **Mở trình duyệt:**
   ```
   http://localhost:5173
   ```

2. **Đăng nhập với tài khoản mẫu:**
   | Vai trò | Email | Mật khẩu |
   |---------|-------|---------|
   | Admin | `admin@example.com` | `admin123` |
   | Manager | `manager.it@example.com` | `manager123` |
   | Employee | `employee.it.1@example.com` | `employee123` |

---

## ✅ Kiểm tra dữ liệu MongoDB

### Dùng MongoDB Compass (GUI):
1. Mở MongoDB Compass
2. Kết nối: `mongodb://localhost:27017`
3. Tìm database `project_management_db`
4. Kiểm tra 5 collections:
   - ✅ users
   - ✅ departments
   - ✅ projects
   - ✅ tasks
   - ✅ database_sequences

### Dùng MongoDB Shell:
```bash
mongo
use project_management_db
show collections
db.users.count()
db.departments.count()
db.projects.count()
db.tasks.count()
```

---

## 🔄 Quy trình hàng ngày

### Để chạy dự án sau khi checkout:

```bash
# Terminal 1 - Backend
cd QUANLYDUAN
./mvnw spring-boot:run

# Terminal 2 - Frontend
cd QUANLYDUAN/client-app
npm run dev
```

**Lưu ý:**
- ✅ MongoDB server phải chạy trước
- ✅ Backend chạy trên port 8080
- ✅ Frontend chạy trên port 5173 (hoặc 3000)
- ✅ Nếu thay đổi code → Tự động reload (hot reload)

---

## 🆘 Troubleshooting

### ❌ Lỗi: "MongoDB Connection Refused"
```
ERROR - Failed to connect to localhost:27017
```

**Giải pháp:**
```bash
# Kiểm tra MongoDB đang chạy không
mongo --version

# Khởi động MongoDB server
net start MongoDB  # Windows
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux
```

### ❌ Lỗi: "Port 8080 already in use"
```
Address already in use: bind
```

**Giải pháp:**
```bash
# Đổi port trong application.properties
server.port=8081

# Hoặc kill process đang chiếm port
netstat -ano | findstr :8080  # Windows
lsof -i :8080  # macOS/Linux
```

### ❌ Lỗi: "Java version not found"
```
Unsupported Java version
```

**Giải pháp:**
```bash
java -version  # Phải là 17+
# Nếu không, cài Java 17
```

### ❌ Lỗi: npm install chậm
```bash
# Xóa node_modules và package-lock.json
cd client-app
rm -rf node_modules package-lock.json
npm install
```

### ❌ Lỗi: CORS Error
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Kiểm tra SecurityConfig.java:**
- CORS có được cấu hình cho `http://localhost:5173` không
- Hoặc dùng proxy trong `vite.config.js`

---

## 📦 Build & Deploy

### Build Frontend cho Production:
```bash
cd client-app
npm run build
# Output: dist/
```

### Build Backend cho Production:
```bash
./mvnw clean package -DskipTests
# Output: target/core-system-0.0.1-SNAPSHOT.jar
```

---

## 📝 Lưu ý quan trọng

1. **Dữ liệu khởi tạo:** Chỉ chạy 1 lần khi database trống
   - Lần tiếp theo khởi động → Bỏ qua (dữ liệu đã có)
   - Để tạo lại → Xóa database → Restart app

2. **Cấu hình Mail:** Nếu không dùng, có thể bỏ qua

3. **Port conflicts:**
   - Backend: 8080
   - Frontend: 5173 hoặc 3000
   - MongoDB: 27017

4. **Commit `.env` hay `application.properties`?**
   - ✅ Commit `.example` file
   - ❌ Không commit file có chứa password thật

---

## ✨ Xong! Dự án sẵn sàng phát triển! 🎉
