# 📝 Member Coach Feedback Feature

## Tổng quan

Chức năng đánh giá Coach cho phép member đánh giá và gửi feedback về coach sau khi hoàn thành buổi tư vấn. Đây là một phần quan trọng giúp cải thiện chất lượng dịch vụ và giúp các member khác chọn coach phù hợp.

## 🚀 Cài đặt

### 1. Cập nhật Database Schema

Chạy script để tạo bảng feedback:

```bash
cd server
node update-feedback-schema.js
# hoặc chạy file batch
update-feedback-schema.bat
```

### 2. Khởi động Server

```bash
cd server
npm start
```

### 3. Khởi động Client

```bash
cd client
npm start
```

## 🎯 Chức năng chính

### 1. **Đánh giá Coach sau buổi tư vấn**
- Member có thể đánh giá coach sau khi appointment có status `completed`
- Đánh giá bao gồm:
  - Số sao tổng thể (1-5)
  - Đánh giá chi tiết theo 4 tiêu chí:
    - Tính chuyên nghiệp
    - Tính hữu ích
    - Kỹ năng giao tiếp
    - Kiến thức chuyên môn
  - Nhận xét bằng văn bản (tùy chọn)
  - Đánh giá ẩn danh (tùy chọn)

### 2. **Kiểm tra đánh giá đã có**
- Hệ thống tự động kiểm tra và hiển thị đánh giá đã có
- Member không thể đánh giá trùng lặp
- Hiển thị thông tin đánh giá trước đó

### 3. **Xem đánh giá công khai**
- Member có thể xem đánh giá của coach từ các member khác
- Thống kê đánh giá tổng hợp
- Phân bố điểm rating

## 🛠️ API Endpoints

### Member APIs

#### 1. Gửi đánh giá Coach
```http
POST /api/coach/feedback
Authorization: Bearer {token}
Content-Type: application/json

{
    "coachId": 3,
    "appointmentId": 1, // optional
    "rating": 5,
    "comment": "Coach rất tận tâm và chuyên nghiệp",
    "categories": {
        "professionalism": 5,
        "helpfulness": 5,
        "communication": 4,
        "knowledge": 5
    },
    "isAnonymous": false
}
```

#### 2. Xem đánh giá công khai của coach
```http
GET /api/coach/{coachId}/feedback?page=1&limit=10
```

### Coach APIs

#### 3. Xem đánh giá của bản thân
```http
GET /api/coach/feedback?page=1&limit=10&status=active
Authorization: Bearer {coach_token}
```

#### 4. Ẩn/hiện đánh giá
```http
PATCH /api/coach/feedback/{feedbackId}
Authorization: Bearer {coach_token}
Content-Type: application/json

{
    "status": "hidden" // or "active"
}
```

## 🎨 Giao diện UI

### 1. **Modal đánh giá Coach**
- Thiết kế modern với animations
- Star rating interactive
- Category ratings chi tiết
- Text area cho nhận xét
- Checkbox cho đánh giá ẩn danh

### 2. **Button đánh giá trong Appointments**
- Chỉ hiển thị khi appointment status = `completed`
- Icon star màu vàng
- Tooltip "Đánh giá coach"

### 3. **Hiển thị đánh giá đã có**
- Layout khác biệt khi đã đánh giá
- Hiển thị thông tin đánh giá trước đó
- Không cho phép chỉnh sửa

## 💾 Database Schema

### CoachFeedback Table
```sql
CREATE TABLE CoachFeedback (
    FeedbackID INT IDENTITY(1,1) PRIMARY KEY,
    CoachID INT NOT NULL,
    MemberID INT NOT NULL,
    AppointmentID INT NULL,
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(MAX),
    Categories NVARCHAR(MAX), -- JSON string
    IsAnonymous BIT DEFAULT 0,
    Status NVARCHAR(20) DEFAULT 'active',
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (CoachID) REFERENCES Users(UserID),
    FOREIGN KEY (MemberID) REFERENCES Users(UserID),
    FOREIGN KEY (AppointmentID) REFERENCES ConsultationAppointments(AppointmentID),
    UNIQUE(MemberID, CoachID, AppointmentID)
);
```

### CoachRatingStats View
```sql
CREATE VIEW CoachRatingStats AS
SELECT 
    c.UserID as CoachID,
    c.FirstName + ' ' + c.LastName as CoachName,
    COUNT(cf.FeedbackID) as TotalReviews,
    AVG(CAST(cf.Rating as FLOAT)) as AverageRating,
    COUNT(CASE WHEN cf.Rating = 5 THEN 1 END) as FiveStarCount,
    COUNT(CASE WHEN cf.Rating = 4 THEN 1 END) as FourStarCount,
    COUNT(CASE WHEN cf.Rating = 3 THEN 1 END) as ThreeStarCount,
    COUNT(CASE WHEN cf.Rating = 2 THEN 1 END) as TwoStarCount,
    COUNT(CASE WHEN cf.Rating = 1 THEN 1 END) as OneStarCount
FROM Users c
LEFT JOIN CoachFeedback cf ON c.UserID = cf.CoachID AND cf.Status = 'active'
WHERE c.Role = 'coach'
GROUP BY c.UserID, c.FirstName, c.LastName;
```

## 🧪 Testing Guide

### 1. Tạo test data

1. **Đăng nhập như member**:
   ```
   Email: member@example.com
   Password: H12345678
   ```

2. **Tạo appointment với coach**:
   - Đặt lịch hẹn với coach
   - Chuyển status thành `completed` trong database:
   ```sql
   UPDATE ConsultationAppointments 
   SET Status = 'completed' 
   WHERE AppointmentID = [appointment_id];
   ```

3. **Test đánh giá**:
   - Vào trang Appointments
   - Nhấn nút "Đánh giá" màu vàng
   - Điền form đánh giá
   - Submit và kiểm tra kết quả

### 2. Kiểm tra các scenario

1. **Đánh giá mới**: Điền form và submit
2. **Đánh giá đã có**: Xem modal hiển thị đánh giá trước đó
3. **Đánh giá ẩn danh**: Check/uncheck checkbox
4. **Validation**: Thử submit không có rating
5. **Coach view**: Đăng nhập coach và xem feedback

## 🔧 Troubleshooting

### 1. Database Connection Error
```bash
# Kiểm tra SQL Server đã chạy
# Kiểm tra connection string trong config
```

### 2. Token Authentication Error
```bash
# Kiểm tra JWT_SECRET trong .env
# Kiểm tra token hợp lệ trong localStorage
```

### 3. API 404 Error
```bash
# Kiểm tra server đã khởi động
# Kiểm tra routes đã được register
```

### 4. Frontend Component Error
```bash
# Kiểm tra import paths
# Kiểm tra component dependencies (lucide-react)
```

## 📱 Mobile Responsive

- Modal tự động responsive trên mobile
- Star rating touch-friendly
- Form layout stack vertical trên màn hình nhỏ
- Button full-width trên mobile

## 🔐 Security Features

1. **Authentication**: Chỉ member đã đăng nhập mới đánh giá được
2. **Authorization**: Member chỉ đánh giá được coach mình từng tư vấn
3. **Unique constraint**: Mỗi member chỉ đánh giá 1 lần cho 1 coach trong 1 appointment
4. **Data validation**: Server-side validation cho rating, coachId, etc.
5. **XSS prevention**: HTML escape cho comments

## 🎉 Kết luận

Chức năng feedback đã hoàn thành với đầy đủ tính năng:
- ✅ API endpoints đầy đủ
- ✅ UI/UX hiện đại và responsive
- ✅ Database schema tối ưu
- ✅ Security measures
- ✅ Error handling
- ✅ Sample data để test

Member giờ đây có thể đánh giá coach một cách dễ dàng và coach có thể xem feedback để cải thiện dịch vụ! 