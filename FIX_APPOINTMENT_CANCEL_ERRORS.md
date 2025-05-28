# Fix Appointment Cancellation Errors

## 🔍 Tóm tắt lỗi từ Console Log

Dựa trên lỗi hiển thị trong ảnh:

1. **CORS Error**: `Access to XMLHttpRequest at 'http://localhost:4000/api/chat/appointments/7/cancel' from origin 'http://localhost:3000' has been blocked by CORS policy: Method PATCH is not allowed by Access-Control-Allow-Methods in preflight response.`

2. **Network Error**: `AxiosError` với message `Network Error`

## ✅ Các fix đã áp dụng

### 1. **Fix CORS Configuration** 
**File**: `server/src/index.js`

```javascript
// OLD - Thiếu PATCH method
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // ❌ Thiếu PATCH
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// NEW - Thêm PATCH method và cải thiện config
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', '*'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // ✅ Đã thêm PATCH
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 200
}));
```

### 2. **Thêm Explicit OPTIONS Handler**
```javascript
// Handle preflight requests for all routes
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.sendStatus(200);
});
```

### 3. **Cải thiện Frontend Error Handling**
**File**: `client/src/components/member/MemberAppointments.jsx`

```javascript
const cancelAppointment = async (appointmentId) => {
    try {
        const token = localStorage.getItem('memberToken') || localStorage.getItem('token');

        console.log('🚫 Cancelling appointment:', { appointmentId, token: token ? 'present' : 'missing' });

        const response = await axios.patch(
            `http://localhost:4000/api/chat/appointments/${appointmentId}/cancel`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'  // ✅ Thêm Content-Type
                },
                timeout: 10000  // ✅ Thêm timeout
            }
        );

        // ... success handling
    } catch (error) {
        // ✅ Chi tiết error handling với specific error types
        if (error.response?.status === 401) {
            message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (error.response?.status === 404) {
            message.error('Không tìm thấy lịch hẹn hoặc bạn không có quyền hủy.');
        } else if (error.code === 'ECONNABORTED') {
            message.error('Kết nối timeout. Vui lòng thử lại.');
        } else if (error.code === 'ERR_NETWORK') {
            message.error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.');
        } else {
            message.error(error.response?.data?.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại.');
        }
    }
};
```

### 4. **Thêm Debug Logging**
Thêm console.log để debug:
- Loading appointments
- Cancelling appointments  
- Error details

## 🧪 Test Script

**File**: `test-appointment-cancel.js`

Chạy script test để kiểm tra:
```bash
cd server
node ../test-appointment-cancel.js
```

Script sẽ test:
1. ✅ Server connectivity
2. ✅ Authentication 
3. ✅ Cancel API endpoint
4. ✅ CORS preflight
5. ✅ Authorization validation

## 🔧 Cách fix thực hiện

### Bước 1: Restart Server
```bash
cd server
npm start
```

### Bước 2: Clear Browser Cache
- Mở DevTools (F12)
- Right-click refresh button → "Empty Cache and Hard Reload"
- Hoặc Ctrl+Shift+R

### Bước 3: Kiểm tra Network Tab
1. Mở browser DevTools
2. Vào tab Network
3. Thực hiện hủy lịch hẹn
4. Kiểm tra:
   - **OPTIONS request**: Phải return 200
   - **PATCH request**: Phải return 200 hoặc error khác CORS

### Bước 4: Kiểm tra Console Log
Với debug logging mới, bạn sẽ thấy:
```
🚫 Cancelling appointment: {appointmentId: 7, token: 'present'}
✅ Cancel response: {success: true, message: 'Hủy lịch hẹn thành công', ...}
```

## 🚨 Troubleshooting

### Nếu vẫn gặp CORS error:

1. **Kiểm tra server restart**:
   ```bash
   # Stop server (Ctrl+C)
   # Start lại
   npm start
   ```

2. **Kiểm tra port conflict**:
   ```bash
   netstat -ano | findstr :4000
   # Nếu có process khác sử dụng port 4000, kill nó
   ```

3. **Test API trực tiếp với Postman/curl**:
   ```bash
   curl -X PATCH \
     http://localhost:4000/api/chat/appointments/7/cancel \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json"
   ```

### Nếu vẫn gặp Network Error:

1. **Kiểm tra server logs** - xem có error nào trong server console
2. **Kiểm tra firewall/antivirus** - có thể block request
3. **Thử với localhost:4000 thay vì 127.0.0.1:4000**

### Nếu gặp 401 Unauthorized:

1. **Kiểm tra token trong localStorage**:
   ```javascript
   console.log(localStorage.getItem('memberToken'));
   console.log(localStorage.getItem('token'));
   ```

2. **Đăng nhập lại** để lấy token mới

3. **Kiểm tra token expiry** trong JWT payload

## 🎯 Expected Result

Sau khi fix:
1. ✅ Không còn CORS error trong console
2. ✅ OPTIONS request trả về 200 OK
3. ✅ PATCH request thành công hoặc trả về error business logic
4. ✅ UI hiển thị message success/error phù hợp
5. ✅ Danh sách appointment refresh sau khi hủy

## 📋 Checklist

- [x] ✅ Thêm PATCH method vào CORS config
- [x] ✅ Thêm explicit OPTIONS handler  
- [x] ✅ Cải thiện error handling frontend
- [x] ✅ Thêm debug logging
- [x] ✅ Tạo test script
- [ ] 🔄 Restart server
- [ ] 🔄 Clear browser cache  
- [ ] 🔄 Test cancellation functionality
- [ ] 🔄 Verify no CORS errors in console

## 💡 Tips

1. **Luôn kiểm tra Network tab** trong DevTools khi debug API issues
2. **Console logging** giúp track request/response flow
3. **CORS errors** thường xuất hiện trong browser console, không phải network tab
4. **Restart server** sau khi thay đổi CORS config
5. **Clear cache** để đảm bảo sử dụng code mới nhất 