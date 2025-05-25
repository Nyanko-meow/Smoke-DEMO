# Tính năng Xem Chi tiết Thành viên (Member Details)

## Tổng quan
Tính năng này cho phép coach xem thông tin chi tiết của từng thành viên, bao gồm:
- **Thông tin cơ bản**: Tên, email
- **Gói dịch vụ**: Gói đang sử dụng, thời hạn, tính năng
- **Trạng thái cai thuốc**: Phân tích thông minh dựa trên dữ liệu tiến trình

## API Endpoint

### GET `/api/coach/members/:id/details`
Lấy thông tin chi tiết của một thành viên.

**Headers:**
```
Authorization: Bearer <coach_token>
Content-Type: application/json
```

**Parameters:**
- `id` (path): ID của thành viên cần xem chi tiết

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "member@example.com",
    "firstName": "Member",
    "lastName": "User",
    "fullName": "Member User",
    "role": "member",
    
    "membership": {
      "id": 1,
      "planName": "Basic Plan",
      "planPrice": 99.00,
      "planDuration": 30,
      "daysRemaining": 25,
      "planFeatures": ["Progress tracking", "Basic quitting tips"]
    },
    
    "quitSmokingStatus": {
      "status": "đang tiến triển",
      "description": "Tiến trình tốt! Trung bình 0.0 điếu/ngày trong tuần qua.",
      "statusCode": "progressing",
      "recommendation": "Tiếp tục duy trì và có thể tăng cường các hoạt động tích cực khác.",
      "metrics": {
        "recentAvgCigarettes": "0.0",
        "recentAvgCraving": "1.3",
        "daysSmokeFree": 16,
        "totalProgressDays": 28
      }
    },
    
    "quitPlan": {
      "startDate": "2024-01-15T00:00:00.000Z",
      "targetDate": "2024-03-15T00:00:00.000Z",
      "reason": "Muốn có sức khỏe tốt hơn cho gia đình và tiết kiệm tiền",
      "motivationLevel": 8,
      "daysInPlan": 28
    },
    
    "statistics": {
      "totalDaysTracked": 28,
      "averageCigarettesPerDay": 2.1,
      "averageCravingLevel": 3.2,
      "totalMoneySaved": 1215000,
      "bestDaysSmokeFree": 16,
      "progressTrend": "improving"
    }
  }
}
```

## Trạng thái Cai thuốc (Quit Smoking Status)

Hệ thống tự động phân tích và xác định trạng thái cai thuốc dựa trên:

### 🟢 "đang tiến triển" (Progressing)
- Số điếu hút giảm hoặc duy trì ở mức thấp (≤ 2 điếu/ngày)
- Mức độ thèm thuốc thấp (≤ 4/10)
- Có xu hướng cải thiện theo thời gian

### 🟡 "chững lại" (Stagnating)  
- Không có cải thiện đáng kể trong 2 tuần
- Vẫn hút > 2 điếu/ngày
- Mức độ thèm thuốc trung bình

### 🔴 "cần hỗ trợ" (Need Support)
- Số điếu hút tăng lên
- Mức độ thèm thuốc cao (> 6/10)
- Xu hướng xấu đi hoặc không có dữ liệu

## Logic Phân tích

### Dữ liệu sử dụng:
- **ProgressTracking**: 30 ngày gần nhất
- **QuitPlans**: Kế hoạch cai thuốc hiện tại
- **SmokingStatus**: Thói quen hút thuốc ban đầu

### Thuật toán:
1. **Lấy dữ liệu gần đây**: 7 ngày cuối vs 7 ngày trước đó
2. **Tính trung bình**: Số điếu/ngày, mức độ thèm
3. **So sánh xu hướng**: Cải thiện, ổn định, hoặc xấu đi
4. **Xác định trạng thái**: Dựa trên các ngưỡng đã định

## Cách sử dụng

### 1. Từ giao diện Coach Dashboard:
```javascript
// Get member details
const response = await fetch(`/api/coach/members/${memberId}/details`, {
  headers: {
    'Authorization': `Bearer ${coachToken}`,
    'Content-Type': 'application/json'
  }
});

const memberDetails = await response.json();
```

### 2. Hiển thị trạng thái:
```javascript
const statusColors = {
  'progressing': 'green',
  'stagnating': 'yellow', 
  'need_support': 'red'
};

const statusText = memberDetails.quitSmokingStatus.status;
const statusColor = statusColors[memberDetails.quitSmokingStatus.statusCode];
```

## Test và Demo

### Chạy test:
```bash
# Windows
cd server
test-member-details.bat

# Linux/Mac  
cd server
node add-sample-progress-data.js
node test-member-details.js
```

### Dữ liệu mẫu:
- **Member User (ID: 2)**: Trạng thái "đang tiến triển"
- **Guest User**: Trạng thái "chững lại"

## Database Schema

### Bảng liên quan:
- `Users`: Thông tin cơ bản
- `UserMemberships` + `MembershipPlans`: Gói dịch vụ
- `QuitPlans`: Kế hoạch cai thuốc
- `ProgressTracking`: Tiến trình hàng ngày
- `SmokingStatus`: Thói quen ban đầu
- `UserAchievements` + `Achievements`: Thành tích

### Index cần thiết:
```sql
CREATE INDEX IX_ProgressTracking_UserDate ON ProgressTracking(UserID, Date DESC);
CREATE INDEX IX_UserMemberships_Active ON UserMemberships(UserID, Status, EndDate);
```

## Tính năng mở rộng

### Có thể thêm:
1. **Dự đoán xu hướng**: ML prediction
2. **Cảnh báo tự động**: Alert khi cần hỗ trợ
3. **So sánh với nhóm**: Benchmark với members khác
4. **Đề xuất can thiệp**: Personalized interventions
5. **Báo cáo chi tiết**: PDF export

## Performance

### Tối ưu hóa:
- Cache kết quả phân tích 15 phút
- Pagination cho lịch sử progress
- Lazy loading cho achievements
- Index database phù hợp

### Monitoring:
- Response time < 500ms
- Cache hit rate > 80%
- Error rate < 1% 