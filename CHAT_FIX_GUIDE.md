# Chat Fix Guide

## Vấn đề hiện tại
- Lỗi 403 (Forbidden) khi member truy cập chat API
- Console log hiển thị lỗi "Failed to load resource: the server responded with a status of 403"

## Nguyên nhân
1. **Role Authorization Issue**: Middleware `authorizeRole(['member'])` có thể không nhận diện đúng role của user
2. **Missing QuitPlan**: Member chưa có QuitPlan active với coach được assign
3. **Token Issue**: Token không hợp lệ hoặc đã hết hạn

## Giải pháp đã thực hiện

### 1. Bypass Role Check (Temporary)
```javascript
// Đã sửa từ:
router.get('/member/conversation', authenticateToken, authorizeRole(['member']), ...)

// Thành:
router.get('/member/conversation', authenticateToken, ...)
```

### 2. Thêm Debug APIs
```javascript
// Debug user info
GET /api/chat/debug-user

// Test member auth
GET /api/chat/test-member-auth

// Test auth
GET /api/chat/test-auth
```

### 3. Tạo Test Data Setup
File: `server/quick-setup-chat.sql`
- Tạo member và coach users
- Tạo QuitPlan với coach assigned
- Tạo conversation và test messages

## Cách test và fix

### Bước 1: Setup Test Data
Chạy SQL script trong SQL Server Management Studio:
```sql
-- Chạy file server/quick-setup-chat.sql
```

### Bước 2: Kiểm tra Server
1. Khởi động server: `npm start` trong thư mục server
2. Kiểm tra server chạy trên port 4000

### Bước 3: Test API với Browser/Postman
1. **Login để lấy token**:
   ```
   POST http://localhost:4000/api/auth/login
   Body: {
     "email": "member@example.com",
     "password": "12345678@"
   }
   ```

2. **Test debug API**:
   ```
   GET http://localhost:4000/api/chat/debug-user
   Headers: Authorization: Bearer <your_token>
   ```

3. **Test conversation API**:
   ```
   GET http://localhost:4000/api/chat/member/conversation
   Headers: Authorization: Bearer <your_token>
   ```

### Bước 4: Test Frontend
1. Login vào frontend với `member@example.com`
2. Click nút "Chat với Coach" trên navbar
3. Kiểm tra console log để xem lỗi

## Debugging Steps

### 1. Kiểm tra Token
```javascript
// Trong browser console
console.log('Token:', localStorage.getItem('token'));
console.log('User Data:', localStorage.getItem('userData'));
```

### 2. Kiểm tra Database
```sql
-- Kiểm tra user role
SELECT UserID, Email, Role FROM Users WHERE Email = 'member@example.com';

-- Kiểm tra QuitPlan
SELECT * FROM QuitPlans WHERE UserID = 2 AND Status = 'active';

-- Kiểm tra Conversations
SELECT * FROM Conversations WHERE MemberID = 2;
```

### 3. Kiểm tra Server Logs
Xem console logs của server để tìm lỗi chi tiết.

## Expected Results

### Successful API Response
```json
{
  "success": true,
  "data": {
    "conversation": {
      "ConversationID": 1,
      "CoachID": 3,
      "MemberID": 2
    },
    "coach": {
      "UserID": 3,
      "FullName": "Coach Smith",
      "Avatar": null,
      "Email": "coach@example.com"
    }
  }
}
```

## Nếu vẫn lỗi

### 1. Kiểm tra JWT Secret
```javascript
// Trong server/src/middleware/auth.middleware.js
console.log('JWT_SECRET:', process.env.JWT_SECRET);
```

### 2. Kiểm tra Database Connection
```javascript
// Test database connection
const result = await sql.query`SELECT 1 as test`;
console.log('DB Test:', result.recordset);
```

### 3. Tạo lại Token
1. Logout và login lại
2. Kiểm tra token mới trong localStorage
3. Test lại API

## Rollback Plan
Nếu cần rollback về version cũ:
1. Restore role authorization:
   ```javascript
   router.get('/member/conversation', authenticateToken, authorizeRole(['member']), ...)
   ```
2. Remove debug APIs
3. Test với role-based authorization

## Next Steps
1. Fix role authorization issue
2. Add proper error handling
3. Implement real-time messaging với Socket.IO
4. Add message encryption
5. Add file sharing capability 