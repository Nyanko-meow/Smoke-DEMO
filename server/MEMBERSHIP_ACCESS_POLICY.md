# Membership Access Control Policy

## Membership Status và Access Rights

### 1. **Active Status** (`active`)
- **Quyền truy cập**: ✅ Full access to all membership features
- **Mô tả**: Gói membership đang hoạt động bình thường
- **Điều kiện**: `Status = 'active'` AND `EndDate > GETDATE()`

### 2. **Pending Cancellation Status** (`pending_cancellation`)
- **Quyền truy cập**: ✅ Full access to all membership features
- **Mô tả**: User đã request hủy gói nhưng admin chưa duyệt
- **Điều kiện**: `Status = 'pending_cancellation'` AND `EndDate > GETDATE()`
- **Lý do cho phép access**:
  - User vẫn trong thời gian sử dụng gói (chưa hết hạn)
  - Admin chưa approve việc hủy gói
  - Đảm bảo user experience tốt trong thời gian chờ duyệt

### 3. **Cancelled Status** (`cancelled`)
- **Quyền truy cập**: ❌ No access
- **Mô tả**: Gói đã được admin approve để hủy
- **Điều kiện**: `Status = 'cancelled'`

### 4. **Expired Status** (`expired`)
- **Quyền truy cập**: ❌ No access
- **Mô tả**: Gói đã hết hạn sử dụng
- **Điều kiện**: `EndDate <= GETDATE()`

## Implementation Details

### Server-side Middleware
```javascript
// File: server/src/middleware/membershipAccess.middleware.js
WHERE um.Status IN ('active', 'pending_cancellation')
AND um.EndDate > GETDATE()
```

### Client-side Hook
```javascript
// File: client/src/hooks/useMembershipAccess.js
// Không filter ra pending_cancellation vì user vẫn có thể sử dụng gói
const activePayments = paymentHistory.filter(payment => {
    if (payment.MembershipStatus === 'cancelled' ||
        payment.PaymentStatus === 'cancelled' ||
        payment.Status === 'cancelled') {
        return false;
    }
    return true; // pending_cancellation được coi là active
});
```

## Business Logic Rationale

### Tại sao cho phép `pending_cancellation` tiếp tục sử dụng?

1. **User Experience**: User đã trả tiền và vẫn trong thời gian sử dụng
2. **Fair Usage**: Admin có thể từ chối request hủy, user vẫn có thể sử dụng
3. **Business Continuity**: Tránh gián đoạn dịch vụ trong thời gian xử lý request
4. **Flexibility**: Admin có thể review và quyết định cuối cùng

### Flow xử lý Cancellation Request:

```
User Active Membership
    ↓ [User request cancel]
Pending Cancellation (✅ Still has access)
    ↓ [Admin review]
    ├─ [Admin Approve] → Cancelled (❌ No access)
    └─ [Admin Reject] → Active (✅ Full access)
```

## Routes sử dụng Membership Access Control

- `/api/quit-plan/*` - Quit plan management
- `/api/progress/*` - Progress tracking  
- `/api/survey/*` - Survey features
- `/api/smoking-addiction-survey/*` - Addiction surveys
- Các routes khác có `checkMembershipAccess` middleware

## Lưu ý khi Development

1. **Luôn sử dụng middleware chung** thay vì tự custom logic
2. **Test cả hai trường hợp**: `active` và `pending_cancellation`
3. **Log rõ ràng status** để debug dễ dàng
4. **Cập nhật documentation** khi có thay đổi logic