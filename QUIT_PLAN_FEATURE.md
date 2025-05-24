# Tính năng Lập Kế Hoạch Cai Thuốc (Quit Plan)

## Tổng quan
Tính năng này cho phép người dùng tạo và quản lý kế hoạch cai thuốc. Chỉ những người dùng có quyền truy cập (member hoặc có membership active) mới có thể sử dụng.

## Quyền truy cập
- **Member**: Người dùng có role `member`
- **Membership Active**: Người dùng đã đăng ký và thanh toán gói dịch vụ (status = 'active')
- **Coach/Admin**: Có thể xem và chỉnh sửa tất cả kế hoạch

## Cấu trúc Database

### Bảng QuitPlans
```sql
CREATE TABLE QuitPlans (
    PlanID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    StartDate DATETIME NOT NULL,
    TargetDate DATETIME NOT NULL,
    Reason NVARCHAR(MAX),
    MotivationLevel INT CHECK (MotivationLevel BETWEEN 1 AND 10),
    DetailedPlan NVARCHAR(MAX),
    Status NVARCHAR(20) CHECK (Status IN ('active', 'completed', 'cancelled')),
    CreatedAt DATETIME DEFAULT GETDATE()
);
```

## API Endpoints

### GET /api/quit-plan
- **Mô tả**: Lấy danh sách kế hoạch cai thuốc của user hiện tại
- **Quyền**: Member hoặc có membership active
- **Response**: Array các quit plan

### POST /api/quit-plan
- **Mô tả**: Tạo kế hoạch cai thuốc mới
- **Quyền**: Member hoặc có membership active
- **Body**:
  ```json
  {
    "startDate": "2024-01-01",
    "targetDate": "2024-03-01", 
    "reason": "Vì sức khỏe",
    "motivationLevel": 8,
    "detailedPlan": "Chi tiết kế hoạch..." // Tùy chọn
  }
  ```

### PUT /api/quit-plan/:planId
- **Mô tả**: Cập nhật kế hoạch cai thuốc
- **Quyền**: 
  - User: Chỉ sửa kế hoạch của mình
  - Coach/Admin: Sửa tất cả kế hoạch
- **Body**: Tương tự POST, chỉ truyền các field muốn cập nhật

### GET /api/quit-plan/all
- **Mô tả**: Lấy tất cả kế hoạch (cho coach/admin)
- **Quyền**: Coach hoặc Admin
- **Response**: Array tất cả quit plan với thông tin user

## Cấu trúc Frontend

### Pages
- **QuitPlanPage** (`/quit-plan`): Trang chính để tạo và quản lý kế hoạch

### Components chính
- Form tạo kế hoạch mới
- Danh sách kế hoạch hiện có
- Kiểm tra quyền truy cập
- Thông báo lỗi và hướng dẫn

## Tính năng chính

### 1. Tạo kế hoạch cai thuốc
- Chọn ngày bắt đầu và ngày mục tiêu
- Nhập lý do cai thuốc
- Đánh giá mức độ động lực (1-10)
- Kế hoạch chi tiết (tùy chọn)

### 2. Quản lý kế hoạch
- Xem danh sách kế hoạch hiện có
- Hiển thị trạng thái: active, completed, cancelled
- Tính toán số ngày còn lại đến mục tiêu

### 3. Kiểm tra quyền truy cập
- Middleware kiểm tra role member hoặc membership active
- Hiển thị thông báo lỗi khi không có quyền
- Hướng dẫn user cách có quyền truy cập

### 4. Tính năng cho Coach (tương lai)
- Coach có thể xem tất cả kế hoạch
- Chỉnh sửa và bổ sung kế hoạch chi tiết
- Thay đổi status kế hoạch

## Cách test

### 1. Chuẩn bị dữ liệu test
Chạy script SQL `test-quit-plan.sql`:
```sql
-- Cập nhật user ID = 2 thành member
UPDATE Users SET Role = 'member', IsActive = 1, EmailVerified = 1 WHERE UserID = 2;
```

### 2. Đăng nhập và test
1. Truy cập `/test` để xem trang test
2. Đăng nhập với tài khoản member (member@example.com / H12345678@)
3. Truy cập `/quit-plan` 
4. Tạo kế hoạch mới và kiểm tra tính năng

### 3. Test cases
- [x] User không đăng nhập → Redirect login
- [x] User không có quyền → Hiển thị thông báo lỗi
- [x] User có role member → Truy cập được
- [x] User có membership active → Truy cập được
- [x] Tạo kế hoạch mới thành công
- [x] Validation form (ngày, mức động lực)
- [x] Hiển thị danh sách kế hoạch
- [x] Tính toán ngày còn lại

## Files được tạo/sửa

### Server
- `server/src/routes/quitPlan.routes.js` - API routes
- `server/src/index.js` - Thêm route registration

### Client  
- `client/src/pages/QuitPlanPage.jsx` - Trang chính
- `client/src/pages/TestPage.jsx` - Trang test
- `client/src/App.js` - Thêm routes
- `client/src/components/layout/Navbar.js` - Thêm menu link

### Database
- `server/test-quit-plan.sql` - Script test data

## Lưu ý quan trọng

1. **Bảo mật**: Middleware kiểm tra quyền truy cập nghiêm ngặt
2. **Validation**: Server-side validation cho tất cả input
3. **UX**: Thông báo lỗi rõ ràng và hướng dẫn user
4. **Mở rộng**: Chuẩn bị sẵn cho tính năng Coach intervention
5. **Database**: Sử dụng bảng QuitPlans có sẵn trong schema

## Tương lai mở rộng

1. **Coach Dashboard**: Trang quản lý cho coach
2. **Progress Tracking**: Liên kết với bảng ProgressTracking
3. **Notifications**: Thông báo nhắc nhở theo kế hoạch
4. **Analytics**: Thống kê tỉ lệ thành công
5. **Templates**: Mẫu kế hoạch có sẵn 