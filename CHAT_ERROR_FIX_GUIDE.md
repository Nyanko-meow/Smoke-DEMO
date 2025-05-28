# Chat Error Fix Guide

## Vấn đề hiện tại
Khi click nút "Chat với Coach", giao diện hiển thị "Không thể tải chat" với lỗi 500 (Internal Server Error).

## Nguyên nhân có thể
1. **Server không chạy** hoặc chạy sai port
2. **Database connection lỗi**
3. **Thiếu dữ liệu test** (member, coach, quit plan)
4. **Authentication token không hợp lệ**
5. **API endpoint lỗi**

## Cách fix từng bước

### Bước 1: Fix Database và Test Data
```bash
cd server
node fix-chat-error.js
```

Script này sẽ:
- Kiểm tra và tạo member test (UserID=2, email: member@example.com)
- Kiểm tra và tạo coach test (UserID=3, email: coach@example.com)
- Tạo QuitPlan active với coach assigned
- Tạo Conversation giữa member và coach
- Tạo test messages

### Bước 2: Khởi động Server
```bash
cd server
npm start
```

Server phải chạy trên port 4000. Kiểm tra console log:
- ✅ "Server running on port 4000"
- ✅ "Database connected successfully"

### Bước 3: Test API Endpoints
```bash
cd server
node test-chat-fix.js
```

Script này sẽ test:
- Server connection
- Login API
- Debug user API
- Member conversation API
- Member messages API
- Send message API

### Bước 4: Test Frontend
1. Mở browser và vào `http://localhost:3000`
2. Login với: `member@example.com` / `12345678@`
3. Click nút "Chat với Coach"
4. Chat interface sẽ hiển thị với tin nhắn test

## Troubleshooting

### Lỗi "ECONNREFUSED"
- Server không chạy
- **Fix**: `cd server && npm start`

### Lỗi 401 (Unauthorized)
- Token không hợp lệ hoặc hết hạn
- **Fix**: Logout và login lại

### Lỗi 404 (Not Found)
- Member chưa có QuitPlan với coach
- **Fix**: Chạy `node fix-chat-error.js`

### Lỗi 500 (Internal Server Error)
- Database connection lỗi
- **Fix**: 
  1. Kiểm tra SQL Server đang chạy
  2. Kiểm tra connection string trong `server/src/config/database.js`
  3. Restart server

### Database Connection Issues
Kiểm tra file `server/src/config/database.js`:
```javascript
const config = {
    user: 'sa',
    password: 'Anhquan123@',  // Đảm bảo password đúng
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};
```

## Quick Fix Script
Chạy script tự động fix tất cả:
```bash
cd server
fix-and-test-chat.bat
```

## Kiểm tra cuối cùng

### 1. Database có đủ data
```sql
-- Kiểm tra users
SELECT UserID, Email, Role FROM Users WHERE UserID IN (2, 3);

-- Kiểm tra quit plan
SELECT * FROM QuitPlans WHERE UserID = 2 AND Status = 'active';

-- Kiểm tra conversation
SELECT * FROM Conversations WHERE CoachID = 3 AND MemberID = 2;

-- Kiểm tra messages
SELECT COUNT(*) FROM Messages WHERE (SenderID = 2 AND ReceiverID = 3) OR (SenderID = 3 AND ReceiverID = 2);
```

### 2. API hoạt động
Test các endpoint:
- GET `/api/chat/debug-user` (với token)
- GET `/api/chat/member/conversation` (với token)
- GET `/api/chat/member/messages` (với token)
- POST `/api/chat/coach/chat/send` (với token + content)

### 3. Frontend hoạt động
- Login thành công
- Chat button hiển thị
- Chat interface load được
- Có thể gửi tin nhắn

## Nếu vẫn lỗi

### Check Server Logs
Xem console log của server để tìm lỗi chi tiết:
```bash
cd server
npm start
# Xem log khi click chat button
```

### Check Browser Console
Mở Developer Tools > Console để xem lỗi JavaScript:
- Network tab: kiểm tra API calls
- Console tab: kiểm tra JavaScript errors

### Check Database
Kết nối SQL Server Management Studio và kiểm tra:
- Database SMOKEKING tồn tại
- Tables: Users, QuitPlans, Conversations, Messages
- Data có đủ không

## Contact Support
Nếu vẫn không fix được, cung cấp:
1. Server console log
2. Browser console log
3. Database connection test result
4. API test result từ `test-chat-fix.js` 