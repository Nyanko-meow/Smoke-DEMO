# Hướng dẫn Chức năng Hủy Lịch Hẹn và Quản lý Appointment

## Tổng quan
Hệ thống đã được cập nhật với chức năng đầy đủ để quản lý và hủy lịch hẹn tư vấn cho cả **Member** và **Coach**.

## 🔧 Backend APIs đã có sẵn

### 1. API lấy danh sách lịch hẹn
- **Endpoint**: `GET /api/chat/appointments` (cho Member)
- **Endpoint**: `GET /api/coach/appointments` (cho Coach)
- **Chức năng**: Lấy danh sách lịch hẹn với phân trang và lọc

### 2. API hủy lịch hẹn
- **Endpoint**: `PATCH /api/chat/appointments/:appointmentId/cancel`
- **Chức năng**: 
  - Hủy lịch hẹn (cả Member và Coach đều có thể hủy)
  - Kiểm tra thời gian hủy (không được hủy trong vòng 1 giờ trước cuộc hẹn)
  - Gửi thông báo đến đối phương khi hủy
  - Cập nhật trạng thái thành 'cancelled'

### 3. API quản lý lịch hẹn Coach
- **Endpoint**: `PATCH /api/coach/appointments/:id` (cập nhật trạng thái)
- **Endpoint**: `DELETE /api/coach/appointments/:id` (xóa vĩnh viễn)

## 🎨 Frontend Components đã implement

### 1. MemberAppointments Component
**File**: `client/src/components/member/MemberAppointments.jsx`

**Chức năng**:
- ✅ Hiển thị danh sách lịch hẹn của member
- ✅ Phân loại: Lịch sắp tới và Lịch sử
- ✅ **Nút hủy lịch hẹn** với confirm dialog
- ✅ Hiển thị thông tin chi tiết appointment
- ✅ Nút tham gia cuộc hẹn (cho video/audio call)
- ✅ Responsive design
- ✅ Animations và hover effects

**Styling**: `client/src/components/member/MemberAppointments.css`

### 2. AppointmentCalendar Component (Updated)
**File**: `client/src/components/coach/AppointmentCalendar.jsx`

**Cập nhật**:
- ✅ **Nút "Hủy lịch hẹn"** với styling đặc biệt (gradient đỏ)
- ✅ Confirm dialog với thông tin chi tiết
- ✅ Kiểm tra thời gian hủy (không được hủy trong vòng 1 giờ)
- ✅ Phân biệt rõ giữa "Hủy lịch hẹn" và "Xóa vĩnh viễn"
- ✅ Icons và animations

### 3. MemberDashboard Page
**File**: `client/src/pages/MemberDashboard.jsx`

**Chức năng**:
- ✅ Sidebar navigation với menu
- ✅ Thống kê cai thuốc (ngày không hút, tiền tiết kiệm, v.v.)
- ✅ Tích hợp MemberAppointments component
- ✅ Header với thông tin member và nút đăng xuất

## 🎯 Tính năng nổi bật

### Nút Hủy Lịch Hẹn cho Member
```jsx
// Trong list appointment item
{canCancelAppointment(appointment) && (
    <Button
        danger
        size="small"
        onClick={(e) => {
            e.stopPropagation();
            handleCancelAppointment(appointment);
        }}
        icon={<CloseCircleOutlined />}
    >
        Hủy lịch
    </Button>
)}
```

### Nút Hủy Lịch Hẹn cho Coach
```jsx
// Trong appointment detail modal
{(selectedAppointment.status === 'scheduled' || selectedAppointment.status === 'confirmed') && (
    <Button
        danger
        icon={<CloseCircleOutlined />}
        onClick={() => cancelAppointment(selectedAppointment)}
        className="cancel-appointment-btn"  // Styling đặc biệt
    >
        Hủy lịch hẹn
    </Button>
)}
```

### Confirm Dialog khi hủy
```jsx
Modal.confirm({
    title: 'Xác nhận hủy lịch hẹn',
    icon: <ExclamationCircleOutlined />,
    content: (
        <div>
            <p>Bạn có chắc chắn muốn hủy lịch hẹn tư vấn với:</p>
            <p><strong>Coach/Member:</strong> {name}</p>
            <p><strong>Thời gian:</strong> {date}</p>
            <p className="text-orange-600 mt-3">
                <InfoCircleOutlined /> Việc hủy lịch sẽ gửi thông báo đến đối phương.
            </p>
        </div>
    ),
    okText: 'Hủy lịch hẹn',
    okType: 'danger',
    cancelText: 'Không',
    onOk: () => cancelAppointment(appointmentId)
});
```

## 📱 UI/UX Features

### 1. Visual Indicators
- **Trạng thái lịch hẹn**: Màu tags khác nhau (scheduled, confirmed, completed, cancelled)
- **Cards**: Hover effects, shadows, border colors theo trạng thái
- **Icons**: Phân biệt loại cuộc hẹn (video, audio, chat)

### 2. Responsive Design
- Mobile-friendly layout
- Adaptive button sizing
- Stackable columns on small screens

### 3. Animations
- Fade in effects cho appointment items
- Hover animations cho cards và buttons
- Smooth transitions

## 🔒 Business Logic

### 1. Thời gian hủy lịch
```jsx
const hoursUntil = appointmentDate.diff(now, 'hour');
if (hoursUntil < 1 && hoursUntil > 0) {
    // Không cho phép hủy
    Modal.warning({
        title: 'Không thể hủy lịch hẹn',
        content: 'Không thể hủy lịch hẹn cách thời gian hẹn dưới 1 giờ.'
    });
}
```

### 2. Phân quyền hủy lịch
- Member: Chỉ hủy được lịch hẹn của mình
- Coach: Hủy được lịch hẹn mà mình là coach
- Trạng thái: Chỉ hủy được khi `scheduled` hoặc `confirmed`

### 3. Thông báo tự động
- Khi hủy lịch hẹn → Gửi message thông báo đến đối phương
- Lưu vào bảng Messages với nội dung mô tả

## 🚀 Cách sử dụng

### Cho Member:
1. Đăng nhập vào Member Dashboard
2. Vào tab "Lịch hẹn tư vấn"
3. Xem danh sách lịch hẹn sắp tới và lịch sử
4. Click "Hủy lịch" trên appointment muốn hủy
5. Xác nhận trong dialog

### Cho Coach:
1. Đăng nhập vào Coach Dashboard
2. Vào tab "Lịch hẹn"
3. Click vào appointment trong calendar
4. Trong modal chi tiết, click "Hủy lịch hẹn"
5. Xác nhận trong dialog

## 📋 Checklist hoàn thành

- ✅ Backend API hủy lịch hẹn
- ✅ Frontend MemberAppointments component
- ✅ Nút hủy lịch cho Member với confirm dialog
- ✅ Cập nhật nút hủy lịch cho Coach
- ✅ Styling đặc biệt cho nút hủy (gradient đỏ)
- ✅ Kiểm tra thời gian hủy (1 giờ rule)
- ✅ Responsive design
- ✅ Animations và hover effects
- ✅ Integration vào Member Dashboard
- ✅ Error handling và loading states

## 🎨 CSS Highlights

### Nút hủy lịch hẹn đặc biệt:
```css
.cancel-appointment-btn {
    background: linear-gradient(135deg, #ff7875 0%, #ff4d4f 100%) !important;
    border: none !important;
    box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3) !important;
    transition: all 0.3s ease !important;
}

.cancel-appointment-btn:hover {
    background: linear-gradient(135deg, #ff4d4f 0%, #f5222d 100%) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4) !important;
}
```

## 📞 Kết luận

Hệ thống appointment cancellation đã được implement đầy đủ với:
- **User Experience** tốt với confirm dialogs và visual feedback
- **Business Logic** chặt chẽ với kiểm tra thời gian và phân quyền  
- **UI Design** đẹp mắt với animations và responsive
- **Code Quality** cao với error handling và type safety

Cả Member và Coach đều có thể dễ dàng hủy lịch hẹn thông qua các nút được thiết kế nổi bật và dễ thao tác. 