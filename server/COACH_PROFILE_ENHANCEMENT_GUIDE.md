# 👨‍⚕️ Coach Profile Enhancement Guide

## 🌟 Tổng quan

Đây là hướng dẫn chi tiết về việc cải tiến thông tin cá nhân của coach với đầy đủ thông tin chuyên môn, bao gồm:

- **Thông tin học vấn và chứng chỉ**
- **Kinh nghiệm và thống kê nghề nghiệp**
- **Phương pháp làm việc và dịch vụ**
- **Đánh giá và phản hồi từ clients**
- **Thông tin liên hệ và mạng xã hội**

## 📊 Cấu trúc Database mới

### 1. Bảng CoachProfiles
```sql
CREATE TABLE CoachProfiles (
    ProfileID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    
    -- Professional Information
    Specialization NVARCHAR(255),      -- Chuyên môn
    YearsOfExperience INT DEFAULT 0,   -- Năm kinh nghiệm
    Education NVARCHAR(500),           -- Học vấn
    Certifications NVARCHAR(MAX),      -- Chứng chỉ
    License NVARCHAR(200),             -- Giấy phép hành nghề
    
    -- Professional Description
    Bio NVARCHAR(MAX),                 -- Giới thiệu
    Methodology NVARCHAR(MAX),         -- Phương pháp
    SuccessStory NVARCHAR(MAX),        -- Câu chuyện thành công
    
    -- Statistics & Performance
    TotalClientsServed INT DEFAULT 0,  -- Tổng clients
    SuccessRate DECIMAL(5,2),          -- Tỷ lệ thành công
    AverageRating DECIMAL(3,2),        -- Đánh giá TB
    TotalReviews INT DEFAULT 0,        -- Số reviews
    
    -- Languages & Communication
    Languages NVARCHAR(255),           -- Ngôn ngữ
    CommunicationStyle NVARCHAR(MAX),  -- Phong cách
    
    -- Availability & Working Hours
    WorkingHours NVARCHAR(500),        -- Giờ làm việc
    TimeZone NVARCHAR(50),             -- Múi giờ
    MaxClientsPerMonth INT DEFAULT 10, -- Max clients/tháng
    
    -- Contact & Social Media
    Website NVARCHAR(255),             -- Website
    LinkedIn NVARCHAR(255),            -- LinkedIn
    
    -- Pricing & Services
    HourlyRate DECIMAL(10,2),          -- Giá/giờ
    ConsultationFee DECIMAL(10,2),     -- Phí tư vấn
    ServicesOffered NVARCHAR(MAX),     -- Dịch vụ
    
    -- Metadata
    IsVerified BIT DEFAULT 0,          -- Đã xác minh
    ProfileCompleteness INT DEFAULT 0, -- % hoàn thiện
    
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
```

### 2. Bảng CoachReviews
```sql
CREATE TABLE CoachReviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    CoachUserID INT NOT NULL,
    ClientUserID INT,
    ClientName NVARCHAR(100),          -- Tên client
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    ReviewTitle NVARCHAR(255),         -- Tiêu đề đánh giá
    ReviewContent NVARCHAR(MAX),       -- Nội dung
    IsAnonymous BIT DEFAULT 0,         -- Ẩn danh
    IsVerified BIT DEFAULT 0,          -- Đã xác minh
    IsPublic BIT DEFAULT 1,            -- Công khai
    CreatedAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (CoachUserID) REFERENCES Users(UserID)
);
```

## 🚀 Cách sử dụng

### Bước 1: Chạy Enhancement Script

```bash
# Chạy script cập nhật database
server/enhance-coach-profile.bat

# Hoặc chạy trực tiếp
cd server
node create-coach-profile-enhancement.js
```

### Bước 2: Restart Frontend
```bash
cd client
npm start
```

### Bước 3: Đăng nhập và kiểm tra
- Đăng nhập với `coach@example.com` / `password`
- Vào Dashboard để xem thông tin cá nhân đã được cải tiến

## 📋 Thông tin mẫu được thêm

### Coach Smith - Professional Profile

**🎓 Học vấn:**
- Thạc sĩ Tâm lý học - Đại học Y Hà Nội (2016)
- Cử nhân Tâm lý học - ĐH Khoa học Xã hội và Nhân văn (2014)

**📜 Chứng chỉ:**
- Chứng chỉ Tư vấn Cai nghiện thuốc lá (WHO 2018)
- Chứng chỉ Liệu pháp Hành vi Nhận thức (CBT 2019)
- Chứng chỉ Mindfulness Coach (2020)
- Chứng chỉ Động lực Phỏng vấn (MI 2021)

**📊 Thống kê:**
- 8 năm kinh nghiệm
- 520 clients đã hỗ trợ
- 87.5% tỷ lệ thành công
- 4.8/5.0 đánh giá trung bình
- 156 reviews từ clients

**💼 Dịch vụ:**
- Tư vấn cai thuốc lá 1-1
- Liệu pháp nhóm
- Workshop về quản lý stress
- Chương trình cai thuốc 30/60/90 ngày
- Hỗ trợ sau cai thuốc

**💰 Giá cả:**
- Phí tư vấn: 200,000đ
- Giá theo giờ: 750,000đ

## 🎨 Giao diện Dashboard mới

### 1. Thông tin cơ bản
- Avatar chuyên nghiệp
- Tên và chuyên môn
- Thông tin liên hệ
- Kinh nghiệm và ngôn ngữ

### 2. Hồ sơ chuyên môn
- Thống kê clients và tỷ lệ thành công
- Học vấn và chứng chỉ
- Giới thiệu và phương pháp làm việc
- Dịch vụ và giá cả

### 3. Câu chuyện thành công
- Trường hợp thành công điển hình
- Minh chứng cho khả năng chuyên môn

### 4. Đánh giá từ clients
- 4 review mới nhất
- Rating với sao
- Tên client và ngày đánh giá

## 🔧 API Endpoints mới

### GET `/api/coaches/profile`
Trả về thông tin coach đầy đủ bao gồm:
```json
{
  "success": true,
  "data": {
    "UserID": 3,
    "Email": "coach@example.com",
    "FirstName": "Coach",
    "LastName": "Smith",
    "Avatar": "https://images.unsplash.com/...",
    "professionalProfile": {
      "Specialization": "Addiction Recovery & Behavioral Therapy",
      "YearsOfExperience": 8,
      "Education": "Thạc sĩ Tâm lý học...",
      "Certifications": "Chứng chỉ Tư vấn...",
      "TotalClientsServed": 520,
      "SuccessRate": 87.50,
      "AverageRating": 4.8,
      "Bio": "Tôi là Coach Smith với hơn 8 năm...",
      "Methodology": "Tôi áp dụng phương pháp...",
      "ServicesOffered": "Tư vấn cai thuốc lá 1-1...",
      "HourlyRate": 750000,
      "ConsultationFee": 200000
    },
    "reviews": [
      {
        "ReviewTitle": "Thay đổi cuộc đời tôi!",
        "ReviewContent": "Coach Smith đã giúp...",
        "Rating": 5,
        "ClientName": "Anh Minh N.",
        "CreatedAt": "2024-01-20"
      }
    ],
    "reviewsCount": 4,
    "averageRating": "4.8"
  }
}
```

## 📱 Responsive Design

Dashboard mới hoàn toàn responsive cho:
- 📱 Mobile (xs: <576px)
- 📲 Tablet (sm: 576px+)
- 💻 Desktop (md: 768px+)
- 🖥️ Large Desktop (lg: 992px+)

## 🎯 Các tính năng nổi bật

### ✨ Professional Statistics
- Real-time statistics về clients
- Visual progress indicators
- Color-coded success metrics

### 📋 Expandable Content
- Text với ellipsis và expand
- Hover effects và transitions
- Modern card layouts

### ⭐ Review System
- Star ratings display
- Anonymous review support
- Verified review badges

### 🔒 Security Features
- Role-based access control
- JWT authentication
- Input validation và sanitization

## 🐛 Troubleshooting

### Lỗi "Table already exists"
```bash
# Script tự động drop và recreate tables
# Không cần lo lắng về lỗi này
```

### Lỗi "Coach not found"
```bash
# Chạy fix-coach-password.js trước
cd server
node fix-coach-password.js
```

### Frontend không hiển thị dữ liệu mới
```bash
# Clear browser cache và restart
# Ctrl + F5 để hard refresh
```

## 🎉 Kết quả

Sau khi hoàn thành, bạn sẽ có:

1. **📊 Dashboard chuyên nghiệp** với đầy đủ thông tin coach
2. **🎓 Hồ sơ chuyên môn** chi tiết và ấn tượng
3. **⭐ Hệ thống review** từ clients
4. **📱 Giao diện responsive** trên mọi thiết bị
5. **🔐 Bảo mật cao** với JWT và role-based access

Coach profile giờ đây trông thực sự chuyên nghiệp và đáng tin cậy! 🚀 