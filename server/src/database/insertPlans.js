try {
    // Load environment variables
    require('dotenv').config({ path: '../../.env' });
} catch (error) {
    console.log('No .env file found, using default configuration');
}

const sql = require('mssql');

// Database configuration with fallbacks
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '12345',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'SMOKEKING',
    options: {
        trustServerCertificate: true,
        enableArithAbort: true,
        encrypt: false
    }
};

async function insertMembershipPlans() {
    try {
        // Connect to the database
        await sql.connect(config);

        // Clear existing plans if any
        await sql.query`DELETE FROM MembershipPlans`;

        // Reset identity column
        await sql.query`DBCC CHECKIDENT ('MembershipPlans', RESEED, 0)`;

        // Insert membership plans
        await sql.query`
            INSERT INTO MembershipPlans (Name, Description, Price, Duration, Features)
            VALUES 
            ('Khách (Miễn phí)', 'Gói dịch vụ miễn phí cho khách', 0, 36500, N'✅ Đăng ký tài khoản
✅ Xem blog và bảng xếp hạng
✅ Ghi nhận tình trạng hút thuốc
🚫 Không được tư vấn Coach'),
            
            ('Gói 30 Ngày', 'Gói dịch vụ cơ bản 30 ngày', 99000, 30, N'✅ Lập kế hoạch cai thuốc
✅ Ghi nhật ký hằng ngày
✅ Nhận thông báo, huy hiệu
✅ 1 lần nhắn tin với Coach'),
            
            ('Gói 3 Tháng', 'Gói dịch vụ 90 ngày', 170000, 90, N'✅ Toàn bộ tính năng gói 30 ngày
✅ Ưu tiên tư vấn Coach 2 lần
✅ Thống kê nâng cao, phân tích tiến trình'),
            
            ('Gói 6 Tháng', 'Gói dịch vụ 180 ngày', 320000, 180, N'✅ Coach call định kỳ 1 lần/tháng
✅ Động viên cá nhân hóa
✅ Nhận phần thưởng nếu đạt cột mốc cai thuốc'),
            
            ('Gói 1 Năm', 'Gói dịch vụ 365 ngày', 550000, 365, N'✅ Gói đầy đủ
✅ Tư vấn Coach 1 lần/tuần
✅ Gợi ý kế hoạch theo từng giai đoạn
✅ Ưu tiên hỗ trợ 24/7')
        `;

        // Verify plans were inserted
        const result = await sql.query`SELECT * FROM MembershipPlans`;
        console.log('Membership plans inserted:');
        console.table(result.recordset);

        // Close the connection
        await sql.close();

        console.log('Membership plans inserted successfully!');
    } catch (err) {
        console.error('Database error:', err);
        // Ensure the connection is closed in case of error
        if (sql.connected) await sql.close();
    }
}

// Run the function
insertMembershipPlans(); 