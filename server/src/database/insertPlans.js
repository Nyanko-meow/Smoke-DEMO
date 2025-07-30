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
    password: process.env.DB_PASSWORD || 'AkoTamaki2002',
    server: process.env.DB_SERVER || 'NYANKO',
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
            (N'Basic Plan', N'Gói cơ bản để bắt đầu hành trình cai thuốc của bạn.', 99000, 15, N'Theo dõi tiến trình
Phân tích nâng cao  
Chiến lược bỏ thuốc cao cấp
Truy cập cộng đồng
Động lực hàng tuần
Được coach tư vấn qua chat và có thể đặt lịch'),
            
            (N'Premium Plan', N'Hỗ trợ nâng cao cho hành trình cai thuốc của bạn.', 199000, 60, N'Theo dõi tiến trình chi tiết
Phân tích và báo cáo chuyên sâu
Kế hoạch cai thuốc cá nhân hóa
Tư vấn 1-1 với chuyên gia
Hỗ trợ 24/7 qua chat và hotline
Video hướng dẫn độc quyền
Cộng đồng VIP và mentor
Nhắc nhở thông minh theo thói quen
Phân tích tâm lý và cảm xúc
Chương trình thưởng đặc biệt
Báo cáo tiến độ hàng tuần
Truy cập không giới hạn tất cả tính năng')
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