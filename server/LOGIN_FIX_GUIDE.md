# 🔧 Hướng dẫn khắc phục vấn đề đăng nhập Coach

## ❌ Vấn đề hiện tại
- Không thể đăng nhập với tài khoản `coach@example.com`
- Lỗi CORS từ frontend 
- Password không được hash đúng cách trong database

## ✅ Giải pháp

### Bước 1: Khắc phục Password và Database
1. Mở PowerShell/Command Prompt
2. Di chuyển vào thư mục server:
   ```bash
   cd server
   ```
3. Chạy script fix login:
   ```bash
   node fix-login-issues.js
   ```
   Hoặc double-click file `fix-login.bat`

### Bước 2: Khởi động Server
1. Trong thư mục server, chạy:
   ```bash
   npm start
   ```
   Hoặc double-click file `start-server.bat`

2. Server sẽ chạy trên: http://localhost:4000

### Bước 3: Kiểm tra kết nối
1. Mở browser và truy cập: http://localhost:4000/api
2. Bạn sẽ thấy thông tin API endpoints

## 🔑 Thông tin đăng nhập Coach

**Email:** `coach@example.com`  
**Password:** `H12345678@`

## 🌐 API Endpoints cho Login

### 1. Coach Login (Chuyên biệt cho Coach)
```
POST http://localhost:4000/api/coaches/login
Content-Type: application/json

{
  "email": "coach@example.com",
  "password": "H12345678@"
}
```

### 2. General Auth Login (Cho tất cả roles)
```
POST http://localhost:4000/api/auth/login
Content-Type: application/json

{
  "email": "coach@example.com",
  "password": "H12345678@"
}
```

## 🛠 Troubleshooting

### Nếu vẫn không login được:

1. **Kiểm tra server có chạy không:**
   - Mở http://localhost:4000
   - Phải thấy thông báo "Smoking Cessation API Server is running"

2. **Kiểm tra database:**
   - Chạy lại script: `node fix-login-issues.js`

3. **Kiểm tra CORS:**
   - File `src/index.js` đã được cập nhật CORS config
   - Restart server sau khi chỉnh sửa

4. **Kiểm tra Network tab trong Developer Tools:**
   - Xem có lỗi 404, 500, hoặc CORS không
   - URL đúng phải là: `http://localhost:4000/api/coaches/login`

## 📝 Log để Debug

Khi chạy `fix-login-issues.js`, bạn sẽ thấy:
- ✅ Database connected successfully
- ✅ Password hashed and updated  
- ✅ Account activated and verified
- ✅ Password verification test: PASSED
- ✅ Login test PASSED

## 🎯 Kết quả mong đợi

Sau khi hoàn thành các bước trên:
1. Tài khoản coach sẽ hoạt động bình thường
2. Password được hash đúng cách
3. CORS được cấu hình đúng
4. Server chạy ổn định trên port 4000
5. Frontend có thể kết nối thành công

---

**Lưu ý:** Nếu vẫn gặp vấn đề, hãy kiểm tra console log của server để xem thông báo lỗi chi tiết. 