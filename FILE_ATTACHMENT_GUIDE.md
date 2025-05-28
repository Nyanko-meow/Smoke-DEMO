# 📎 Hướng dẫn chức năng đính kèm file trong Chat

## Tổng quan
Hệ thống chat giữa member và coach đã được tích hợp chức năng đính kèm file, cho phép:
- Member gửi file báo cáo, hình ảnh tiến trình cho coach
- Coach gửi tài liệu hỗ trợ, kế hoạch chi tiết cho member
- Lưu trữ và quản lý file đính kèm an toàn

## 🚀 Các API Endpoints

### 1. Gửi tin nhắn với file đính kèm (Auto-detect receiver)
```
POST /api/chat/send-with-file
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- file: File to upload
- content: Message content (optional)
- messageType: 'file' (default)
- relatedPlanId: ID of related quit plan (optional)
- receiverId: Specific receiver ID (optional for member)
```

### 2. Gửi file đến conversation cụ thể
```
POST /api/chat/conversation/:conversationId/send-with-file
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- file: File to upload
- content: Message content (optional)
- messageType: 'file' (default)
- relatedPlanId: ID of related quit plan (optional)
```

### 3. Lấy danh sách file đính kèm của tin nhắn
```
GET /api/chat/message/:messageId/attachments
Authorization: Bearer <token>
```

### 4. Tải file đính kèm
```
GET /api/chat/files/:filename
```

## 📋 Cấu trúc Database

### Bảng MessageAttachments
```sql
CREATE TABLE MessageAttachments (
    AttachmentID INT IDENTITY(1,1) PRIMARY KEY,
    MessageID INT NOT NULL,
    FileName NVARCHAR(255) NOT NULL,
    FileURL NVARCHAR(500) NOT NULL,
    FileSize BIGINT,
    MimeType NVARCHAR(100),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (MessageID) REFERENCES Messages(MessageID)
);
```

## 🔧 Cấu hình File Upload

### Giới hạn file
- **Kích thước tối đa**: 10MB
- **Loại file được phép**: 
  - Hình ảnh: jpeg, jpg, png, gif
  - Tài liệu: pdf, doc, docx, txt
  - Media: mp3, mp4, avi, mov

### Thư mục lưu trữ
- **Đường dẫn**: `server/uploads/chat/`
- **Cấu trúc tên file**: `originalname-timestamp-random.ext`

## 💻 Cách sử dụng

### Cho Member

#### 1. Gửi file báo cáo tiến trình
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('content', 'Báo cáo tiến trình tuần này của em');

fetch('/api/chat/send-with-file', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
})
.then(response => response.json())
.then(data => {
    console.log('File sent:', data);
});
```

#### 2. Gửi hình ảnh chứng minh
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('content', 'Hình ảnh chứng minh em đã không hút thuốc 7 ngày!');
formData.append('messageType', 'file');

// Gửi đến conversation hiện tại
fetch(`/api/chat/conversation/${conversationId}/send-with-file`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});
```

### Cho Coach

#### 1. Gửi tài liệu hỗ trợ
```javascript
const formData = new FormData();
formData.append('file', documentFile);
formData.append('content', 'Tài liệu hỗ trợ cai thuốc cho bạn');

fetch(`/api/chat/conversation/${conversationId}/send-with-file`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});
```

#### 2. Gửi kế hoạch chi tiết
```javascript
const formData = new FormData();
formData.append('file', planFile);
formData.append('content', 'Kế hoạch cai thuốc chi tiết cho bạn');
formData.append('relatedPlanId', quitPlanId);

fetch(`/api/chat/conversation/${conversationId}/send-with-file`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});
```

## 🎨 Frontend Integration

### HTML Structure
```html
<!-- File upload input -->
<input type="file" id="fileInput" accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.mp3,.mp4">
<textarea id="messageContent" placeholder="Thêm mô tả cho file..."></textarea>
<button onclick="sendFile()">Gửi file</button>

<!-- Display file attachments -->
<div class="message-attachments">
    <div class="attachment-item">
        <span class="file-icon">📎</span>
        <span class="file-name">report.pdf</span>
        <span class="file-size">(2.5 MB)</span>
        <a href="/api/chat/files/report-123456.pdf" download>Tải xuống</a>
    </div>
</div>
```

### JavaScript Functions
```javascript
async function sendFile() {
    const fileInput = document.getElementById('fileInput');
    const messageContent = document.getElementById('messageContent');
    
    if (!fileInput.files[0]) {
        alert('Vui lòng chọn file');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('content', messageContent.value);
    
    try {
        const response = await fetch('/api/chat/send-with-file', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('File sent successfully:', result.data);
            // Refresh chat messages
            loadMessages();
            // Clear form
            fileInput.value = '';
            messageContent.value = '';
        }
    } catch (error) {
        console.error('Error sending file:', error);
    }
}

function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.SenderRole}`;
    
    let content = `
        <div class="message-header">
            <span class="sender">${message.SenderName}</span>
            <span class="time">${new Date(message.CreatedAt).toLocaleString()}</span>
        </div>
        <div class="message-content">${message.Content}</div>
    `;
    
    // Add attachment if exists
    if (message.FileName) {
        content += `
            <div class="message-attachment">
                <span class="file-icon">📎</span>
                <span class="file-name">${message.FileName}</span>
                <span class="file-size">(${formatFileSize(message.FileSize)})</span>
                <a href="${message.FileURL}" download="${message.FileName}">Tải xuống</a>
            </div>
        `;
    }
    
    messageDiv.innerHTML = content;
    return messageDiv;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
```

## 🔒 Bảo mật

### Kiểm tra quyền truy cập
- Chỉ người gửi và người nhận mới có thể xem file đính kèm
- Xác thực token trước khi upload/download
- Kiểm tra quyền truy cập conversation

### Validation
- Kiểm tra loại file được phép
- Giới hạn kích thước file
- Scan virus (có thể thêm sau)

## 🧪 Testing

### Chạy test tự động
```bash
cd server
node test-file-attachment.js
```

### Test thủ công với Postman
1. **Login** để lấy token
2. **POST** `/api/chat/send-with-file` với form-data
3. **GET** `/api/chat/message/{messageId}/attachments`
4. **GET** `/api/chat/files/{filename}`

## 📝 Response Format

### Successful file upload
```json
{
    "success": true,
    "message": "Tin nhắn với file đính kèm đã được gửi",
    "data": {
        "MessageID": 123,
        "SenderID": 2,
        "ReceiverID": 3,
        "Content": "📎 report.pdf",
        "MessageType": "file",
        "CreatedAt": "2024-01-15T10:30:00.000Z",
        "SenderName": "Member User",
        "SenderRole": "member",
        "AttachmentID": 45,
        "FileName": "report.pdf",
        "FileURL": "/uploads/chat/report-1705312200000-123456789.pdf",
        "FileSize": 2621440,
        "MimeType": "application/pdf"
    }
}
```

### Error responses
```json
{
    "success": false,
    "message": "Không có file được upload"
}

{
    "success": false,
    "message": "Chỉ cho phép upload các file: hình ảnh, PDF, tài liệu, âm thanh, video"
}
```

## 🔄 Workflow

### Member gửi file
1. Member chọn file và nhập mô tả
2. Frontend gửi POST request với form-data
3. Server validate file và lưu vào thư mục
4. Tạo record trong Messages và MessageAttachments
5. Cập nhật conversation
6. Trả về thông tin tin nhắn với file

### Coach nhận và phản hồi
1. Coach xem danh sách conversations
2. Lấy messages của conversation (bao gồm attachments)
3. Download file nếu cần
4. Gửi file phản hồi nếu cần

## 🚀 Triển khai

### 1. Đảm bảo thư mục uploads tồn tại
```bash
mkdir -p server/uploads/chat
```

### 2. Cấu hình nginx (production)
```nginx
location /uploads/ {
    alias /path/to/server/uploads/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Backup files định kỳ
```bash
# Cron job backup files
0 2 * * * tar -czf /backup/chat-files-$(date +%Y%m%d).tar.gz /path/to/server/uploads/chat/
```

## 📞 Support

Nếu có vấn đề với chức năng file attachment:
1. Kiểm tra log server
2. Verify file permissions
3. Check disk space
4. Validate file types và sizes

---

**Lưu ý**: Chức năng này đã được test và sẵn sàng sử dụng. Hãy đảm bảo frontend được cập nhật để hiển thị file attachments một cách thân thiện với người dùng. 