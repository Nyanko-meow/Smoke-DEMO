# 🚬 SmokeKing Admin System Documentation

## 📋 Tổng Quan Hệ Thống

SmokeKing là hệ thống hỗ trợ cai thuốc lá với giao diện admin toàn diện, quản lý tất cả khía cạnh của nền tảng từ người dùng, coach, gói dịch vụ đến báo cáo thống kê.

## 🏗️ Kiến Trúc Hệ Thống

### Backend
- **Framework:** Node.js + Express.js
- **Database:** SQL Server
- **Authentication:** JWT (JSON Web Tokens)
- **File:** `server/src/routes/admin.routes.js`

### Frontend
- **Framework:** React.js
- **UI Library:** Ant Design
- **File:** `client/src/pages/AdminDashboard.jsx`

## 🔐 Xác Thực & Phân Quyền

### Middleware
```javascript
// Bảo vệ route
protect: Kiểm tra JWT token

// Phân quyền admin
authorize('admin'): Chỉ admin mới có quyền truy cập
```

### Database Configuration
```javascript
// Cấu hình kết nối
server: 'NYANKO'
database: 'SMOKEKING'
password: 'AkoTamaki2002'
```

## 📊 Các Chức Năng Chính

### 1. 🏠 Tổng Quan (Dashboard)
**Endpoint:** `/api/admin/dashboard-stats`

**Chức năng:**
- Thống kê tổng quan hệ thống
- Số lượng người dùng, coach, gói dịch vụ
- Doanh thu, thanh toán, phản hồi
- Biểu đồ xu hướng

**SQL Query:**
```sql
SELECT 
    (SELECT COUNT(*) FROM Users WHERE Role = 'member') as TotalMembers,
    (SELECT COUNT(*) FROM Users WHERE Role = 'coach') as TotalCoaches,
    (SELECT COUNT(*) FROM MembershipPlans) as TotalPlans,
    (SELECT SUM(Amount) FROM Payments WHERE Status = 'confirmed') as TotalRevenue
```

### 2. 📈 Theo Dõi Hoạt Động (Activity Tracking)
**Endpoint:** `/api/admin/user-activity`

**Chức năng:**
- Theo dõi hoạt động người dùng
- Phân tích tiến độ cai thuốc
- Xác định người dùng cần hỗ trợ
- Thống kê huy hiệu và thành tích

**Key Features:**
- **Cần hỗ trợ:** Phát hiện người dùng có xu hướng xấu
- **Coach Performance:** Đánh giá hiệu suất coach
- **Achievement Stats:** Thống kê huy hiệu

**Business Logic:**
```javascript
// Phát hiện người dùng cần hỗ trợ
const needsSupport = users.filter(user => {
    const recentTrend = calculateRecentTrend(user.progressData);
    return recentTrend < -0.5; // Xu hướng xấu
});
```

### 3. 📊 Báo Cáo Thống Kê (Reports)
**Endpoint:** `/api/admin/reports`

**Chức năng:**
- Báo cáo doanh thu chi tiết
- Thống kê đăng ký gói dịch vụ
- Báo cáo phiên coaching
- Xuất dữ liệu Excel

**Metrics:**
- **Revenue:** Doanh thu theo tháng/quý/năm
- **Registrations:** Số lượng đăng ký mới
- **Coaching Sessions:** Phiên coaching
- **Growth Rate:** Tỷ lệ tăng trưởng

**Export Feature:**
```javascript
// Xuất Excel
const exportToExcel = async () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, "SmokeKing_Reports.xlsx");
};
```

### 4. 👨‍🏫 Quản Lý Coach (Coach Management)
**Endpoint:** `/api/admin/coaches`

**Chức năng:**
- Quản lý danh sách coach
- Phân công coach cho member
- Theo dõi hiệu suất coach
- Bật/tắt trạng thái coach

**Key Operations:**
- **View Coaches:** Xem danh sách tất cả coach
- **Coach Details:** Chi tiết coach và thành tích
- **Assign Members:** Phân công member cho coach
- **Performance Tracking:** Theo dõi hiệu suất

**Assignment Logic:**
```sql
-- Phân công coach
INSERT INTO QuitPlans (UserID, CoachID, StartDate, TargetDate, Status)
VALUES (@UserID, @CoachID, @StartDate, @TargetDate, 'active')

-- Tạo conversation
INSERT INTO Conversations (CoachID, MemberID, IsActive)
VALUES (@CoachID, @MemberID, 1)
```

### 5. 📋 Quản Lý Plans (Plans Management)
**Endpoint:** `/api/admin/plans`

**Chức năng:**
- Tạo, chỉnh sửa, xóa gói dịch vụ
- Quản lý giá cả và thời hạn
- Theo dõi số lượng đăng ký
- Phân tích hiệu quả gói

**Plan Structure:**
```javascript
{
    PlanID: 1,
    Name: "Gói Premium",
    Description: "Gói cao cấp với hỗ trợ 24/7",
    Price: 1000000,
    Duration: 30,
    Features: ["Coaching 1-1", "Support 24/7", "Progress Tracking"],
    IsActive: true
}
```

### 6. 📝 Quản Lý Blog (Blog Management)
**Endpoint:** `/api/admin/blog`

**Chức năng:**
- Tạo và chỉnh sửa bài viết blog
- Quản lý bình luận
- Kiểm duyệt nội dung
- Phân tích tương tác

**Features:**
- **Rich Text Editor:** Soạn thảo nội dung
- **Image Upload:** Tải lên hình ảnh
- **Comment Moderation:** Kiểm duyệt bình luận
- **SEO Optimization:** Tối ưu SEO

### 7. ❌ Quản Lý Yêu Cầu Hủy Gói (Cancellation Management)
**Endpoint:** `/api/admin/pending-membership-cancellations`

**Chức năng:**
- Xem danh sách yêu cầu hủy gói
- Chấp nhận/từ chối yêu cầu
- Quản lý hoàn tiền
- Thông báo cho khách hàng

**Workflow:**
```
1. User gửi yêu cầu hủy gói
2. Admin xem và đánh giá
3. Admin chấp nhận/từ chối
4. Hệ thống cập nhật trạng thái
5. Gửi thông báo cho user
6. Xử lý hoàn tiền (nếu có)
```

**SQL Operations:**
```sql
-- Chấp nhận hủy gói
UPDATE CancellationRequests
SET Status = 'approved', ProcessedAt = GETDATE()
WHERE CancellationRequestID = @ID

-- Hủy membership
UPDATE UserMemberships
SET Status = 'cancelled'
WHERE MembershipID = @MembershipID
```

## 🔄 Business Logic

### 1. User Activity Analysis
```javascript
// Tính xu hướng gần đây
function calculateRecentTrend(progressData) {
    const recentData = progressData.slice(-7); // 7 ngày gần nhất
    const trend = recentData.reduce((sum, day) => sum + day.smokeFreeDays, 0) / recentData.length;
    return trend;
}
```

### 2. Coach Performance Metrics
```sql
SELECT 
    c.UserID as CoachID,
    c.FirstName + ' ' + c.LastName as CoachName,
    COUNT(qp.PlanID) as TotalPlans,
    COUNT(CASE WHEN qp.Status = 'active' THEN 1 END) as ActivePlans,
    COUNT(CASE WHEN qp.Status = 'completed' THEN 1 END) as CompletedPlans,
    AVG(CAST(Rating as FLOAT)) as AverageRating
FROM Users c
LEFT JOIN QuitPlans qp ON c.UserID = qp.CoachID
WHERE c.Role = 'coach' AND c.IsActive = 1
GROUP BY c.UserID, c.FirstName, c.LastName
```

### 3. Revenue Calculation
```sql
SELECT 
    YEAR(CreatedAt) as Year,
    MONTH(CreatedAt) as Month,
    SUM(Amount) as Revenue,
    COUNT(*) as TransactionCount
FROM Payments
WHERE Status = 'confirmed'
GROUP BY YEAR(CreatedAt), MONTH(CreatedAt)
ORDER BY Year DESC, Month DESC
```

## 🛡️ Security Features

### 1. Authentication
- JWT token validation
- Role-based access control
- Session management

### 2. Data Protection
- Input validation
- SQL injection prevention
- XSS protection

### 3. Error Handling
```javascript
try {
    // Database operations
} catch (error) {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
}
```

## 📱 UI Components

### 1. Dashboard Layout
```javascript
const AdminDashboard = () => {
    const [selectedMenu, setSelectedMenu] = useState('dashboard');
    const [stats, setStats] = useState({});
    
    return (
        <Layout>
            <Sider>
                <Menu items={sidebarMenuItems} />
            </Sider>
            <Layout>
                <Header />
                <Content>
                    {renderContent()}
                </Content>
            </Layout>
        </Layout>
    );
};
```

### 2. Data Tables
```javascript
<Table
    dataSource={data}
    columns={columns}
    loading={loading}
    pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true
    }}
/>
```

### 3. Modal Forms
```javascript
<Modal
    title="Form Title"
    visible={modalVisible}
    onCancel={() => setModalVisible(false)}
    footer={null}
>
    <Form form={form} onFinish={handleSubmit}>
        {/* Form fields */}
    </Form>
</Modal>
```

## 🔧 Technical Implementation

### 1. Database Schema
```sql
-- Users table
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Email NVARCHAR(255) UNIQUE NOT NULL,
    FirstName NVARCHAR(100),
    LastName NVARCHAR(100),
    Role NVARCHAR(20) DEFAULT 'member',
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- UserMemberships table
CREATE TABLE UserMemberships (
    MembershipID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    PlanID INT FOREIGN KEY REFERENCES MembershipPlans(PlanID),
    Status NVARCHAR(20) DEFAULT 'active',
    StartDate DATETIME,
    EndDate DATETIME
);

-- CancellationRequests table
CREATE TABLE CancellationRequests (
    CancellationRequestID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    MembershipID INT FOREIGN KEY REFERENCES UserMemberships(MembershipID),
    CancellationReason NVARCHAR(MAX),
    Status NVARCHAR(20) DEFAULT 'pending',
    RequestedAt DATETIME DEFAULT GETDATE()
);
```

### 2. API Response Format
```javascript
// Success response
{
    success: true,
    data: [...],
    message: "Operation completed successfully"
}

// Error response
{
    success: false,
    message: "Error description",
    error: "Detailed error (development only)"
}
```

### 3. State Management
```javascript
// React hooks for state management
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// Custom hooks for data fetching
const useDataFetching = (endpoint) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(endpoint);
            setData(response.data.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }, [endpoint]);
    
    return { data, loading, fetchData };
};
```

## 📈 Performance Optimization

### 1. Database Optimization
- Indexed queries for faster retrieval
- Connection pooling
- Query optimization

### 2. Frontend Optimization
- React.memo for component memoization
- useMemo for expensive calculations
- useCallback for function memoization

### 3. Caching Strategy
- API response caching
- Database query caching
- Static asset caching

## 🚀 Deployment

### 1. Environment Setup
```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Start development server
npm run dev
```

### 2. Production Deployment
```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 📞 Support & Maintenance

### 1. Monitoring
- Error logging
- Performance monitoring
- User activity tracking

### 2. Backup Strategy
- Database backup
- File backup
- Configuration backup

### 3. Update Process
- Version control
- Database migrations
- Rollback procedures

---

## 📝 Changelog

### Version 1.0.0
- Initial release
- Complete admin dashboard
- All core functionalities implemented

### Version 1.1.0
- Enhanced reporting features
- Improved UI/UX
- Bug fixes and performance improvements

---

**© 2024 SmokeKing Admin System. All rights reserved.**
