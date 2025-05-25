# Hướng dẫn Tính năng Theo dõi Tiến trình Member

## Tổng quan
Tính năng "Theo dõi tiến trình Member" cho phép Coach xem chi tiết tiến trình cai thuốc của các thành viên với biểu đồ và phân tích thông minh.

## Tính năng chính

### 1. API Backend: `/api/coach/members/:id/progress`
- **Method**: GET
- **Auth**: Yêu cầu token coach
- **Query Parameters**:
  - `days`: Số ngày theo dõi (1-365, mặc định 30)

### 2. Dữ liệu trả về
```json
{
  "success": true,
  "data": {
    "member": {
      "id": 2,
      "firstName": "Member",
      "lastName": "User", 
      "fullName": "Member User",
      "email": "member@example.com",
      "avatar": "avatar.jpg",
      "phoneNumber": "0987654321",
      "membershipPlan": "Premium Plan"
    },
    "progressData": [
      {
        "date": "2024-01-15",
        "cigarettesSmoked": 5,
        "cravingLevel": 6,
        "moneySaved": 150000,
        "daysSmokeFree": 3,
        "emotionNotes": "Cảm thấy khó khăn hôm nay",
        "healthNotes": "Hơi thở tươi hơn"
      }
    ],
    "analytics": {
      "summary": {
        "totalDaysTracked": 15,
        "averageCigarettesPerDay": 3.2,
        "averageCravingLevel": 4.5,
        "currentMoneySaved": 450000,
        "bestDaysSmokeFree": 7,
        "progressStatus": "good",
        "currentSmokeFreeStreak": 2
      },
      "trends": {
        "cigarettesTrend": "improving",
        "cravingTrend": "stable", 
        "moneySavingTrend": "improving"
      },
      "improvements": [
        "Số lượng thuốc hút giảm dần qua các tuần",
        "Đã 2 ngày không hút thuốc liên tiếp"
      ],
      "concerns": [
        "Mức độ thèm thuốc vẫn cao ở một số ngày"
      ],
      "chartData": {
        "daily": [...],
        "weekly": [...]
      }
    },
    "quitPlan": {
      "startDate": "2024-01-01",
      "targetDate": "2024-04-01", 
      "reason": "Vì sức khỏe gia đình",
      "motivationLevel": 8,
      "daysInPlan": 15,
      "daysToTarget": 75
    },
    "smokingStatus": {
      "cigarettesPerDay": 20,
      "cigarettePrice": 5000,
      "smokingFrequency": "Thường xuyên"
    },
    "achievements": [...]
  }
}
```

### 3. Phân tích thông minh
Hệ thống tự động phân tích và đưa ra:
- **Trạng thái tiến trình**: excellent, good, stable, needs_attention
- **Xu hướng**: improving, declining, stable
- **Điểm tích cực**: Những cải thiện đáng kể
- **Điểm cần cải thiện**: Những vấn đề cần chú ý

## Cách sử dụng

### Từ Coach Dashboard:
1. Đăng nhập với tài khoản Coach
2. Chọn tab "Theo dõi tiến trình" 
3. Chọn member cần xem từ danh sách
4. Hệ thống sẽ hiển thị:
   - **Tổng quan**: Thống kê tổng hợp và xu hướng
   - **Biểu đồ**: Biểu đồ Line charts cho các chỉ số theo thời gian
   - **Nhật ký tiến trình**: Bảng dữ liệu chi tiết từng ngày
   - **Thành tích**: Danh sách achievements đã đạt và chưa đạt
   - **Kế hoạch cai thuốc**: Thông tin kế hoạch và tình trạng hút thuốc

### Tính năng nâng cao:
- **Lọc theo thời gian**: 7, 14, 30, 60, 90 ngày
- **Biểu đồ tương tác**: Sử dụng Chart.js cho trải nghiệm mượt mà
- **Phân tích xu hướng**: Tự động so sánh với tuần trước
- **Cảnh báo thông minh**: Đề xuất hành động dựa trên dữ liệu

## Kiểm tra API

### Sử dụng script test:
```bash
# Chạy test tự động
node test-member-progress.js

# Hoặc sử dụng batch file (Windows)
test-member-progress.bat
```

### Test thủ công:
```bash
# 1. Đăng nhập coach để lấy token
curl -X POST http://localhost:4000/api/coaches/login \
  -H "Content-Type: application/json" \
  -d '{"email":"coach@example.com","password":"password"}'

# 2. Gọi API progress (thay <token> và <memberID>)
curl -X GET "http://localhost:4000/api/coach/members/2/progress?days=30" \
  -H "Authorization: Bearer <token>"
```

## Cấu trúc Component Frontend

### MemberProgressTracking.jsx
- **Props**: `memberId`, `onBack`
- **Features**:
  - Responsive design với Ant Design
  - Charts sử dụng Chart.js/react-chartjs-2
  - Tabs để tổ chức nội dung
  - Loading states và error handling
  - Real-time data filtering

### CoachDashboard.jsx  
- Tích hợp tab "Theo dõi tiến trình"
- Danh sách member có thể click để xem chi tiết
- Navigation mượt mà giữa các views

## Lưu ý kỹ thuật

### Dependencies:
- **Backend**: Sử dụng các helper functions có sẵn
- **Frontend**: Chart.js, dayjs (đã có sẵn trong project)

### Performance:
- API có pagination và giới hạn dữ liệu
- Frontend cache dữ liệu để tránh reload không cần thiết
- Charts responsive và optimize

### Security:
- API yêu cầu authenticate coach
- Validate input parameters
- Chỉ coach mới xem được data của members

## Troubleshooting

### Lỗi thường gặp:
1. **401 Unauthorized**: Kiểm tra token coach
2. **404 Not Found**: Member ID không tồn tại
3. **400 Bad Request**: Tham số days không hợp lệ
4. **Chart không hiển thị**: Kiểm tra Chart.js đã register components

### Debug:
- Kiểm tra console logs trong browser
- Xem network tab để debug API calls
- Sử dụng test script để verify backend

## Tương lai

### Kế hoạch phát triển:
- [ ] Export PDF reports
- [ ] Email notifications cho coach
- [ ] So sánh nhiều members
- [ ] Predictions dựa trên AI/ML
- [ ] Mobile responsive improvements

---

*Tài liệu này được tạo cho hệ thống Smoking Cessation Platform.* 