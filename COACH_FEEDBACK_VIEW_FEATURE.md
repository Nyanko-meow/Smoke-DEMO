# 🌟 Coach Feedback View Feature

## 📋 Tổng quan
Tính năng **Coach Feedback View** cho phép các huấn luyện viên (coach) xem và quản lý tất cả đánh giá từ các thành viên đã tư vấn. Đây là một công cụ quan trọng giúp coach theo dõi chất lượng dịch vụ và cải thiện kỹ năng tư vấn.

## ✨ Tính năng chính

### 📊 Thống kê tổng quan
- **Tổng số đánh giá**: Hiển thị tổng số feedback nhận được
- **Điểm trung bình**: Tính toán điểm đánh giá trung bình (1-5 sao)
- **Đánh giá 5 sao**: Số lượng đánh giá xuất sắc
- **Tỷ lệ hài lòng**: Phần trăm đánh giá 4-5 sao

### 📈 Phân bố đánh giá
- Biểu đồ thanh hiển thị phân bố đánh giá từ 1-5 sao
- Tỷ lệ phần trăm cho mỗi mức đánh giá
- Màu sắc trực quan để dễ nhận biết

### 📝 Danh sách feedback chi tiết
- **Thông tin member**: Tên, avatar (hoặc ẩn danh nếu được chọn)
- **Đánh giá tổng thể**: Số sao và nhận xét
- **Đánh giá chi tiết**: Theo 4 tiêu chí:
  - Tính chuyên nghiệp
  - Tính hữu ích  
  - Kỹ năng giao tiếp
  - Kiến thức chuyên môn
- **Thông tin buổi tư vấn**: Ngày tư vấn, loại hình (nếu có)
- **Ngày đánh giá**: Thời gian member gửi feedback

### 🔍 Tính năng lọc và tìm kiếm
- **Lọc theo trạng thái**: 
  - Đang hiển thị (active)
  - Đã ẩn (hidden)
  - Đã xóa (deleted)
- **Phân trang**: Hỗ trợ phân trang với tùy chọn số lượng hiển thị
- **Xem chi tiết**: Modal popup hiển thị thông tin đầy đủ

## 🛠️ Cấu trúc kỹ thuật

### Frontend Components
```
client/src/components/coach/
├── CoachFeedbackView.jsx      # Component chính
├── CoachFeedbackView.css      # Styling
```

### Backend API Endpoints
```
GET /api/coach/feedback        # Lấy danh sách feedback cho coach
```

### Database Tables
```sql
CoachFeedback                  # Bảng lưu feedback
CoachRatingStats              # View thống kê đánh giá
```

## 🚀 Cách sử dụng

### Cho Coach:
1. **Đăng nhập** vào hệ thống với tài khoản coach
2. **Truy cập Dashboard** và chọn tab "Đánh giá" 
3. **Xem thống kê** tổng quan về chất lượng dịch vụ
4. **Duyệt danh sách** feedback từ các member
5. **Xem chi tiết** bằng cách click "Xem chi tiết"
6. **Lọc feedback** theo trạng thái nếu cần

### Giao diện chính:
- **Header**: Tiêu đề và bộ lọc
- **Statistics Cards**: 4 thẻ thống kê quan trọng
- **Rating Distribution**: Biểu đồ phân bố đánh giá
- **Feedback List**: Danh sách feedback với pagination

## 📱 Responsive Design
- **Desktop**: Layout 2 cột (phân bố + danh sách)
- **Tablet**: Layout responsive với grid system
- **Mobile**: Layout 1 cột, tối ưu cho màn hình nhỏ

## 🎨 UI/UX Features
- **Modern Design**: Sử dụng Ant Design components
- **Smooth Animations**: Hiệu ứng hover và transition
- **Color Coding**: Màu sắc phân biệt mức độ đánh giá
- **Interactive Elements**: Buttons, modals, tooltips

## 🔐 Bảo mật
- **Authentication**: Yêu cầu đăng nhập với role 'coach'
- **Authorization**: Chỉ coach mới xem được feedback của mình
- **Data Privacy**: Hỗ trợ feedback ẩn danh

## 📊 Thống kê và Metrics
- **Average Rating**: Điểm trung bình tự động tính toán
- **Rating Distribution**: Phân bố theo từng mức sao
- **Satisfaction Rate**: Tỷ lệ hài lòng (4-5 sao)
- **Total Reviews**: Tổng số đánh giá nhận được

## 🧪 Testing

### API Testing
```bash
# Chạy test API
cd server
node test-coach-feedback-api.js
```

### Test Cases Covered:
- ✅ Authentication và authorization
- ✅ Pagination và filtering
- ✅ Data validation
- ✅ Error handling
- ✅ Statistics calculation

## 🔧 Configuration

### Environment Variables
```env
JWT_SECRET=your_jwt_secret_key
```

### Database Setup
```sql
-- Đảm bảo có bảng CoachFeedback và view CoachRatingStats
-- Xem file schema.sql để biết chi tiết
```

## 📈 Performance
- **Lazy Loading**: Chỉ tải dữ liệu khi cần
- **Pagination**: Giảm tải server với phân trang
- **Caching**: Sử dụng React state để cache dữ liệu
- **Optimized Queries**: SQL queries được tối ưu

## 🐛 Troubleshooting

### Lỗi thường gặp:
1. **403 Forbidden**: Kiểm tra role và token
2. **Empty Data**: Đảm bảo có feedback trong database
3. **Loading Issues**: Kiểm tra kết nối API

### Debug Commands:
```bash
# Test API
node test-coach-feedback-api.js

# Check database
node debug-feedback-issue.js
```

## 🔄 Future Enhancements
- [ ] Export feedback to PDF/Excel
- [ ] Advanced filtering (by date, rating range)
- [ ] Feedback analytics dashboard
- [ ] Email notifications for new feedback
- [ ] Bulk actions (hide/delete multiple)
- [ ] Feedback response feature

## 📞 Support
Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console logs
2. Chạy test scripts
3. Xem file debug logs
4. Liên hệ team phát triển

---

## 🎯 Demo Data
Để test tính năng, hệ thống đã có sẵn:
- **Coach**: coach@example.com (password: H12345678@)
- **Sample Feedback**: 3 feedback mẫu với rating 4-5 sao
- **Test Scripts**: Các script test API và database

**Chúc bạn sử dụng tính năng hiệu quả! 🚀** 