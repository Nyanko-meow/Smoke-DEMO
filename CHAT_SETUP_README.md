# Chat System Setup Guide

## Tổng quan
Hệ thống chat cho phép member chat với coach được assign cho họ. Hệ thống bao gồm:

- **Backend API**: Các endpoint để gửi/nhận tin nhắn
- **Frontend Components**: ChatBox và MemberChat components
- **Database**: Bảng Messages và Conversations

## API Endpoints

### 1. Gửi tin nhắn (Member/Coach)
```
POST /api/chat/coach/chat/send
```

**Headers:**
```
Authorization: Bearer <token>
```

**Body (Member):**
```json
{
  "content": "Tin nhắn của member"
}
```

**Body (Coach):**
```json
{
  "content": "Tin nhắn của coach",
  "memberId": 2
}
```

### 2. Lấy lịch sử chat (Member)
```
GET /api/chat/member/messages
```

### 3. Lấy conversation (Member)
```
GET /api/chat/member/conversation
```

### 4. Lấy danh sách conversations (Coach)
```
GET /api/chat/coach/conversations
```

## Frontend Components

### 1. MemberChat Component
- Tự động load conversation với coach
- Hiển thị lịch sử chat
- Form gửi tin nhắn

### 2. ChatBox Component
- Component tái sử dụng cho cả member và coach
- Hỗ trợ real-time messaging
- Tích hợp đặt lịch tư vấn

## Cách sử dụng

### Cho Member:
1. Member đăng nhập vào hệ thống
2. Click vào nút "Chat với Coach" trên navbar
3. Drawer sẽ mở ra hiển thị chat interface
4. Member có thể gửi tin nhắn cho coach được assign

### Cho Coach:
1. Coach đăng nhập vào coach dashboard
2. Xem danh sách conversations với members
3. Click vào conversation để chat với member cụ thể

## Database Schema

### Messages Table
```sql
CREATE TABLE Messages (
    MessageID INT IDENTITY(1,1) PRIMARY KEY,
    SenderID INT NOT NULL,
    ReceiverID INT NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    MessageType NVARCHAR(20) DEFAULT 'text',
    IsRead BIT DEFAULT 0,
    RelatedPlanID INT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (SenderID) REFERENCES Users(UserID),
    FOREIGN KEY (ReceiverID) REFERENCES Users(UserID),
    FOREIGN KEY (RelatedPlanID) REFERENCES QuitPlans(PlanID)
);
```

### Conversations Table
```sql
CREATE TABLE Conversations (
    ConversationID INT IDENTITY(1,1) PRIMARY KEY,
    CoachID INT NOT NULL,
    MemberID INT NOT NULL,
    LastMessageID INT NULL,
    LastMessageAt DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    
    UNIQUE(CoachID, MemberID),
    FOREIGN KEY (CoachID) REFERENCES Users(UserID),
    FOREIGN KEY (MemberID) REFERENCES Users(UserID),
    FOREIGN KEY (LastMessageID) REFERENCES Messages(MessageID)
);
```

## Yêu cầu hệ thống

### Backend:
- Node.js với Express
- SQL Server database
- JWT authentication middleware

### Frontend:
- React với Ant Design
- Redux cho state management
- Axios cho API calls

## Troubleshooting

### Lỗi "Bạn chưa được assign coach"
- Đảm bảo member có QuitPlan active với CoachID được set
- Kiểm tra bảng QuitPlans trong database

### Lỗi authentication
- Kiểm tra token trong localStorage
- Đảm bảo middleware auth hoạt động đúng

### Tin nhắn không hiển thị
- Kiểm tra API endpoint `/api/chat/member/messages`
- Verify database connection
- Check console logs cho errors

## Testing

Chạy test script:
```bash
node server/test-chat-api-simple.js
```

Lưu ý: Cần update token trong test script với token thực tế.

## Tính năng mở rộng

1. **Real-time messaging**: Tích hợp Socket.IO
2. **File sharing**: Upload và chia sẻ files
3. **Voice messages**: Ghi âm và gửi tin nhắn voice
4. **Group chat**: Chat nhóm với nhiều members
5. **Message reactions**: React với emoji
6. **Message search**: Tìm kiếm trong lịch sử chat 