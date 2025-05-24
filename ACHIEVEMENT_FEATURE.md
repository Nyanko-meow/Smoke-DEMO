# 🏆 Tính năng Huy hiệu và Cộng đồng - Giai đoạn 6

## Tổng quan
Giai đoạn 6 bổ sung hệ thống huy hiệu thành tích và cộng đồng chia sẻ để tạo động lực cho người dùng trong hành trình cai thuốc.

## Tính năng chính

### 1. Hệ thống Huy hiệu (Achievements)
- **Huy hiệu theo ngày**: Tự động trao khi đạt milestone (1 ngày, 7 ngày, 30 ngày, 90 ngày không hút thuốc)
- **Huy hiệu tiết kiệm**: Tự động trao khi tiết kiệm được số tiền nhất định (100K, 500K, 1 triệu VNĐ)
- **Theo dõi tiến trình**: Hiển thị progress bar cho từng huy hiệu
- **Chia sẻ thành tích**: Chia sẻ huy hiệu lên cộng đồng

### 2. Cộng đồng nâng cao (Community)
- **Hiển thị huy hiệu**: Posts có thể kèm theo huy hiệu đã đạt được
- **Like/Unlike**: Người dùng có thể like/unlike posts
- **Chia sẻ achievements**: Tự động tạo post khi chia sẻ huy hiệu
- **Thống kê tương tác**: Hiển thị số likes và comments

### 3. Thông báo động lực
- **Thông báo huy hiệu mới**: Popup khi đạt được huy hiệu
- **Thông điệp động lực**: Tin nhắn khuyến khích dựa trên tiến trình
- **Tự động kiểm tra**: Kiểm tra huy hiệu mỗi khi cập nhật tiến trình

## Cấu trúc Database

### Bảng Achievements
```sql
CREATE TABLE Achievements (
    AchievementID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    IconURL NVARCHAR(255),
    MilestoneDays INT NULL,      -- Số ngày không hút thuốc
    SavedMoney INT NULL,         -- Số tiền tiết kiệm
    CreatedAt DATETIME DEFAULT GETDATE()
);
```

### Bảng UserAchievements
```sql
CREATE TABLE UserAchievements (
    UserAchievementID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    AchievementID INT NOT NULL,
    EarnedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (AchievementID) REFERENCES Achievements(AchievementID)
);
```

### Bảng CommunityPosts (cập nhật)
```sql
CREATE TABLE CommunityPosts (
    PostID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    Title NVARCHAR(255),
    Content NVARCHAR(MAX),
    AchievementID INT NULL,      -- Liên kết huy hiệu (nếu có)
    CreatedAt DATETIME DEFAULT GETDATE(),
    Likes INT DEFAULT 0,
    IsPublic BIT DEFAULT 1,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (AchievementID) REFERENCES Achievements(AchievementID)
);
```

### Bảng PostLikes
```sql
CREATE TABLE PostLikes (
    LikeID INT PRIMARY KEY IDENTITY(1,1),
    PostID INT NOT NULL,
    UserID INT NOT NULL,
    LikedAt DATETIME DEFAULT GETDATE(),
    UNIQUE(PostID, UserID),
    FOREIGN KEY (PostID) REFERENCES CommunityPosts(PostID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
```

## API Endpoints

### Achievement APIs
- `GET /api/achievements/` - Lấy tất cả huy hiệu với trạng thái đã đạt
- `GET /api/achievements/earned` - Lấy huy hiệu đã đạt được
- `POST /api/achievements/check` - Kiểm tra và trao huy hiệu mới

### Community APIs
- `GET /api/community/posts` - Lấy danh sách posts với achievements và likes
- `POST /api/community/posts/:postId/like` - Like/unlike post
- `GET /api/community/posts/:postId/like-status` - Kiểm tra trạng thái like
- `POST /api/community/share-achievement` - Chia sẻ huy hiệu lên cộng đồng

### Progress APIs (cập nhật)
- `POST /api/progress/` - Ghi nhận tiến trình (tự động kiểm tra achievements)

## Frontend Components

### 1. AchievementPage
- Hiển thị tất cả huy hiệu với progress
- Phân biệt huy hiệu đã đạt/chưa đạt
- Nút chia sẻ cho huy hiệu đã đạt

### 2. CommunityList (cập nhật)
- Hiển thị huy hiệu của người dùng
- Like/unlike functionality
- Modal chia sẻ achievement

### 3. AchievementNotification
- Component hiển thị thông báo huy hiệu mới
- Thông điệp động lực

## Cách sử dụng

### 1. Xem huy hiệu
```javascript
// Truy cập trang /achievement để xem tất cả huy hiệu
// Màu xanh: đã đạt được
// Màu xám: chưa đạt được
```

### 2. Chia sẻ huy hiệu
```javascript
// Từ trang Achievement hoặc Community
// Click nút "Chia sẻ" trên huy hiệu đã đạt
// Nhập thông điệp và chia sẻ lên cộng đồng
```

### 3. Tương tác cộng đồng
```javascript
// Like/unlike posts
// Xem posts có kèm huy hiệu
// Comment và tương tác
```

## Luồng hoạt động

### 1. Ghi nhận tiến trình
```
User ghi nhận tiến trình → 
Tính toán ngày không hút thuốc & tiền tiết kiệm → 
Kiểm tra điều kiện huy hiệu → 
Trao huy hiệu mới (nếu có) → 
Hiển thị thông báo
```

### 2. Chia sẻ thành tích
```
User click "Chia sẻ" → 
Chọn huy hiệu → 
Nhập thông điệp → 
Tạo post với AchievementID → 
Hiển thị trên cộng đồng
```

## Test Script
Chạy script test để kiểm tra API:
```bash
cd server
node test-achievements.js
```

## Lưu ý kỹ thuật

### 1. Performance
- Sử dụng MERGE statement để tránh duplicate achievements
- Index trên UserID, AchievementID
- Lazy loading cho danh sách posts

### 2. Security
- Kiểm tra quyền sở hữu huy hiệu trước khi chia sẻ
- Validate input cho posts và comments
- Rate limiting cho API calls

### 3. UX/UI
- Smooth animations cho notifications
- Progressive loading cho achievements
- Responsive design cho mobile

## Tương lai mở rộng
- Push notifications cho achievements mới
- Leaderboard cộng đồng
- Huy hiệu đặc biệt theo sự kiện
- Integration với social media
- Gamification nâng cao 