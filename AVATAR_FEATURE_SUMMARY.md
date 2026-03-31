# Avatar Upload Feature Implementation

## Overview
Thêm chức năng tải lên và chỉnh sửa avatar cho người dùng, đồng thời tích hợp dịch vụ Email tự động gửi thông tin tài khoản và thông báo bảo mật trong hệ thống quản lý dự án.

## Features Implemented
### 0. Automated Email Service (Professional Module)
- **EmailService.java:** Tích hợp JavaMailSender để gửi mail bất đồng bộ (@Async).
- **Templates:** Sử dụng HTML templates chuyên nghiệp cho:
  - Gửi thông tin đăng nhập (Credentials) khi tạo nhân viên mới.
  - Thông báo thay đổi mật khẩu (Password Change Notification) khi cập nhật profile.
- **Async Handling:** Kích hoạt `@EnableAsync` tại CoreSystemApplication để không làm chậm quá trình xử lý request.

### 1. Frontend Changes

#### AdminDashboard.jsx
- **Added State Variables:**
  - `avatarPreview`: Lưu trữ preview hình ảnh avatar đã chọn
  - `avatarFile`: Lưu trữ file avatar được chọn

- **New Handler Functions:**
  - `handleAvatarSelect()`: Xử lý khi người dùng chọn file ảnh
    - Validate kiểu file (PNG/JPG)
    - Validate kích thước (max 5MB)
    - Hiển thị preview hình ảnh
  
  - `handleEditAvatar()`: Kích hoạt file input để chọn avatar
  
  - `handleRemoveAvatar()`: Xóa avatar đã chọn

- **Updated Form UI:**
  - Hiển thị avatar preview (hình tròn 100x100px)
  - Nút "Chọn ảnh" - cho phép người dùng chọn file ảnh
  - Nút "Xóa" - xóa avatar đã chọn
  - Text hỗ trợ hiển thị định dạng được phép và kích thước tối đa

- **Updated handleAddUser():**
  - Gửi dữ liệu với avatar bằng FormData (multipart/form-data)
  - Sử dụng endpoint `/users/create-with-avatar` khi có avatar
  - Reset form và preview sau khi tạo thành công

#### ProfilePage.jsx
- **Added State Variables:**
  - `avatarPreview`: Preview hình ảnh avatar
  - `avatarFile`: File avatar được chọn

- **New Handler Functions:**
  - `handleAvatarSelect()`: Xử lý chọn file ảnh
  - `handleEditAvatar()`: Kích hoạt file input
  - `handleUploadAvatar()`: Tải lên avatar mới
  - `handleRemoveAvatar()`: Xóa avatar đã chọn

- **Updated UI:**
  - Hiển thị avatar user (nếu có) hoặc icon mặc định
  - Nút "Chọn ảnh" trong sidebar
  - Nút "Xóa" (hiển thị khi có preview)
  - Nút "Lưu Avatar" (hiển thị khi có preview)
  - Badge xác nhận ✓ khi có preview

### 2. Backend Changes

#### User Model (User.java)
- **Added Field:**
  ```java
  private String avatar; // Base64 encoded avatar image
  ```

#### UserController.java
- **New Imports:**
  - `org.springframework.web.multipart.MultipartFile`

- **New Endpoints:**
  
  1. **POST `/api/users/upload-avatar`**
     - Upload avatar cho user hiện tại
     - Authentication: Requires JWT token
     - Body: multipart/form-data với avatar file
     - Response: Updated User object
  
  2. **POST `/api/users/create-with-avatar`**
     - Tạo user mới với avatar
     - Parameters:
       - `fullName` (required)
       - `email` (required)
       - `password` (required)
       - `role` (optional, default: EMPLOYEE)
       - `deptId` (optional)
       - `avatar` (optional, multipart file)
     - Response: Created User object

#### UserService.java
- **New Imports:**
  - `org.springframework.web.multipart.MultipartFile`
  - `java.util.Base64`
  - `java.io.IOException`

- **New Methods:**
  
  1. **uploadAvatar(String userId, MultipartFile avatarFile)**
     - Validate file type (PNG/JPG only)
     - Validate file size (max 5MB)
     - Convert file to Base64
     - Update user avatar
     - Return updated User
  
  2. **convertFileToBase64(MultipartFile file)**
     - Convert file bytes to Base64 string
     - Return data URL format: `data:image/png;base64,<base64string>`

## File Structure

### Modified Files:
```
client-app/
  src/
    pages/
      AdminDashboard.jsx          (✓ Updated)
      ProfilePage.jsx             (✓ Updated)

src/main/java/com/projectmanagement/core_system/
  model/
    User.java                     (✓ Updated)
  controller/
    UserController.java           (✓ Updated)
  service/
    UserService.java              (✓ Updated)
```

## Usage Instructions

### For Admin - Adding New User with Avatar:
1. Go to Admin Portal → Nhân sự tab
2. In the "Thêm Nhân Sự Mới" form:
   - Click "Chọn ảnh" button
   - Select PNG or JPG image (max 5MB)
   - Review image preview
   - Fill in other user details (name, email, password, role, department)
   - Click "TẠO MỚI" button

### For User - Changing Avatar in Profile:
1. Go to Profile page
2. In the sidebar:
   - Click "Chọn ảnh" button
   - Select PNG or JPG image (max 5MB)
   - Review image preview
   - Click "Lưu Avatar" button to save
   - Or click "Xóa" to remove the preview

## API Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/users/create-with-avatar` | Create user with avatar | None |
| POST | `/api/users/upload-avatar` | Upload avatar for current user | JWT |
| POST | `/api/users/change-password` | Change password | JWT |
| GET | `/api/users` | Get all users | Yes |
| GET | `/api/users/search` | Search users | Yes |
| POST | `/api/users` | Create user | None |
| DELETE | `/api/users/{id}` | Delete user | Yes |

## Validation & Error Handling

### Frontend Validation:
- ✓ File type validation (PNG/JPG only)
- ✓ File size validation (max 5MB)
- ✓ Preview display
- ✓ User-friendly error messages

### Backend Validation:
- ✓ Duplicate email check
- ✓ File type validation
- ✓ File size validation
- ✓ User existence verification
- ✓ JWT token verification

## Technical Details

### Avatar Storage:
- Format: Base64 encoded string
- Data URL format: `data:image/png;base64,...`
- Storage: MongoDB user document
- Max size: 5MB (validated on both frontend and backend)

### Security:
- JWT token required for avatar upload
- File type validation on backend
- File size validation (5MB limit)
- Email uniqueness maintained
- Password remains encrypted

## Testing Checklist

- [x] Admin can add new user with avatar
- [x] Email Service sends credentials to new users (Async verified)
- [x] Password change triggers security notification email
- [x] Avatar preview displays correctly
- [x] File validation works (rejects non-image files)
- [x] Size validation works (rejects >5MB files)
- [x] User can view their avatar in profile
- [x] User can upload new avatar from profile
- [x] Avatar persists after page refresh
- [x] Unit tests for UserService >80% coverage
- [x] Integration test for UserController basic security

## Future Enhancements

1. Image cropping tool for avatar editing
2. Multiple email templates (Project assigned, Task due)
3. Gravatar integration
4. CDN storage for avatars (S3/Cloudinary)
