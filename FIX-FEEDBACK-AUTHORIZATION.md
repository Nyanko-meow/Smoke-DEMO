# 🔧 Fix: Coach Feedback Authorization Issue

## 📋 Vấn đề
Khi member submit feedback cho coach, gặp lỗi **403 Forbidden** với thông báo:
```
"Bạn không có quyền gửi đánh giá này. Vui lòng đăng nhập với tài khoản member."
```

## 🔍 Nguyên nhân
Trong file `server/src/routes/coach.routes.js`, dòng 2186:
```javascript
// ❌ SAI - Truyền array thay vì spread parameters
router.post('/feedback', protect, authorize(['member', 'guest']), async (req, res) => {
```

Middleware `authorize` mong đợi spread parameters:
```javascript
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.Role)) {
            // Authorization fails
        }
    }
}
```

Khi truyền `['member', 'guest']` (array), middleware nhận được:
- `roles[0] = ['member', 'guest']` (array)
- `req.user.Role = 'member'` (string)
- `['member', 'guest'].includes('member')` → `false` ❌

## ✅ Giải pháp
Thay đổi cách gọi middleware từ array sang spread parameters:

```javascript
// ✅ ĐÚNG - Sử dụng spread parameters
router.post('/feedback', protect, authorize('member', 'guest'), async (req, res) => {
```

## 📁 Files đã được sửa
- `server/src/routes/coach.routes.js` - Dòng 2186

## 🧪 Cách test
1. **Restart server** để áp dụng thay đổi:
   ```bash
   cd server
   npm start
   ```

2. **Test bằng script**:
   ```bash
   cd server
   node final-test-feedback.js
   ```

3. **Test bằng HTML page**:
   - Mở `client/test-feedback.html` trong browser
   - Click "Setup Test Token"
   - Click "Test Feedback API"

4. **Test trong frontend**:
   - Mở browser console
   - Chạy commands từ `client/setup-test-token.js`
   - Thử submit feedback trong component `CoachFeedback`

## 🔑 Test Token Setup
Nếu cần test manual, sử dụng token này trong localStorage:
```javascript
// Set trong browser console
localStorage.setItem('token', 'YOUR_GENERATED_TOKEN');
localStorage.setItem('user', JSON.stringify({
    UserID: 2,
    Email: 'member@example.com',
    Role: 'member'
}));
```

## 📊 Kết quả mong đợi
- ✅ Member có thể submit feedback thành công
- ✅ Coach không thể submit feedback (403 - đúng behavior)
- ✅ Guest có thể submit feedback thành công
- ✅ Admin không thể submit feedback (403 - đúng behavior)

## 🚀 Deployment
Sau khi fix:
1. Restart server
2. Test thoroughly
3. Deploy to production
4. Monitor for any issues

## 📝 Notes
- Fix này chỉ ảnh hưởng đến authorization logic
- Không thay đổi database schema
- Không ảnh hưởng đến các API khác
- Backward compatible với existing data

---
**Status**: ✅ FIXED
**Date**: December 2024
**Impact**: Critical - Feedback feature không hoạt động
**Priority**: High 