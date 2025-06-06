const sql = require('mssql');

// Database configuration
const config = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

async function checkAndSetupTemplates() {
    let pool = null;
    try {
        console.log('🚀 Starting PlanTemplates setup...');

        // Connect to database
        console.log('🔗 Connecting to database...');
        pool = await sql.connect(config);
        console.log('✅ Database connected');

        // 1. Check existing MembershipPlans first
        console.log('🔍 Checking existing MembershipPlans...');
        const existingPlans = await pool.request().query(`
            SELECT PlanID, Name, Description, Price, Duration
            FROM MembershipPlans
            ORDER BY PlanID
        `);

        console.log(`📋 Found ${existingPlans.recordset.length} existing plans:`);
        existingPlans.recordset.forEach(plan => {
            console.log(`  - ID: ${plan.PlanID}, Name: ${plan.Name}, Price: $${plan.Price}`);
        });

        if (existingPlans.recordset.length === 0) {
            console.log('❌ No MembershipPlans found! Cannot create templates.');
            console.log('💡 Please run membership data setup first.');
            return false;
        }

        // 2. Create PlanTemplates table if not exists
        console.log('📋 Creating PlanTemplates table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PlanTemplates' AND xtype='U')
            BEGIN
                CREATE TABLE PlanTemplates (
                    TemplateID INT IDENTITY(1,1) PRIMARY KEY,
                    PlanID INT FOREIGN KEY REFERENCES MembershipPlans(PlanID),
                    PhaseName NVARCHAR(255) NOT NULL,
                    PhaseDescription NVARCHAR(MAX) NOT NULL,
                    DurationDays INT NOT NULL,
                    SortOrder INT NOT NULL,
                    CreatedAt DATETIME DEFAULT GETDATE()
                );
                PRINT 'Created PlanTemplates table successfully';
            END
            ELSE
            BEGIN
                PRINT 'PlanTemplates table already exists';
            END
        `);

        // 3. Clear existing templates
        console.log('🧹 Clearing existing template data...');
        await pool.request().query(`DELETE FROM PlanTemplates`);

        // 4. Map plan names to IDs dynamically
        const planMap = {};
        existingPlans.recordset.forEach(plan => {
            if (plan.Name.includes('Basic')) planMap.basic = plan.PlanID;
            if (plan.Name.includes('Premium')) planMap.premium = plan.PlanID;
            if (plan.Name.includes('Pro')) planMap.pro = plan.PlanID;
        });

        console.log('🗺️ Plan mapping:', planMap);

        // 5. Insert templates based on existing plans
        if (planMap.basic) {
            console.log('📝 Inserting Basic Plan templates...');
            await pool.request().query(`
                INSERT INTO PlanTemplates (PlanID, PhaseName, PhaseDescription, DurationDays, SortOrder) VALUES
                (${planMap.basic}, N'Tuần 1: Chuẩn bị tinh thần', N'• Xác định lý do cai thuốc rõ ràng
• Loại bỏ tất cả thuốc lá và dụng cụ hút thuốc
• Thông báo cho gia đình, bạn bè về quyết định
• Bắt đầu ghi nhật ký cảm xúc hàng ngày
• Tập thở sâu khi cảm thấy thèm thuốc', 7, 1),

                (${planMap.basic}, N'Tuần 2: Thay đổi thói quen', N'• Thay đổi lịch trình hàng ngày để tránh trigger
• Uống nhiều nước, ăn kẹo không đường khi thèm
• Tập thể dục nhẹ 15-20 phút/ngày
• Tìm hoạt động thay thế: đọc sách, nghe nhạc
• Tính toán số tiền tiết kiệm được', 7, 2),

                (${planMap.basic}, N'Tuần 3-4: Củng cố ý chí', N'• Tiếp tục duy trì thói quen tốt
• Tham gia cộng đồng hỗ trợ cai thuốc
• Thưởng cho bản thân khi đạt milestone
• Xử lý stress bằng cách tích cực
• Chuẩn bị cho những thử thách dài hạn', 14, 3)
            `);
        }

        if (planMap.premium) {
            console.log('💎 Inserting Premium Plan templates...');
            await pool.request().query(`
                INSERT INTO PlanTemplates (PlanID, PhaseName, PhaseDescription, DurationDays, SortOrder) VALUES
                (${planMap.premium}, N'Tuần 1-2: Detox và chuẩn bị', N'• Thực hiện detox cơ thể với chế độ ăn uống lành mạnh
• Bắt đầu chương trình tập luyện thể chất
• Thiết lập hệ thống hỗ trợ từ gia đình và bạn bè
• Học các kỹ thuật thư giãn: thiền, yoga
• Ghi chép chi tiết về triggers và cách đối phó', 14, 1),

                (${planMap.premium}, N'Tuần 3-4: Xây dựng thói quen mới', N'• Phát triển hobby mới để thay thế thời gian hút thuốc
• Tham gia các nhóm hỗ trợ trực tuyến/offline
• Áp dụng kỹ thuật CBT (Cognitive Behavioral Therapy)
• Theo dõi cải thiện sức khỏe: huyết áp, nhịp tim
• Lập kế hoạch tài chính từ tiền tiết kiệm', 14, 2),

                (${planMap.premium}, N'Tuần 5-6: Đối phó với khó khăn', N'• Nhận diện và xử lý các tình huống nguy hiểm
• Phát triển kỹ năng quản lý stress nâng cao
• Tạo động lực dài hạn với mục tiêu cụ thể
• Đánh giá tiến bộ và điều chỉnh kế hoạch
• Chuẩn bị tâm lý cho giai đoạn duy trì', 14, 3),

                (${planMap.premium}, N'Tuần 7-8: Duy trì và phát triển', N'• Ổn định lối sống không thuốc lá
• Mở rộng mạng lưới hỗ trợ xã hội
• Theo dõi và cải thiện sức khỏe tinh thần
• Lập kế hoạch phòng ngừa tái phát
• Chia sẻ kinh nghiệm để giúp người khác', 14, 4)
            `);
        }

        if (planMap.pro) {
            console.log('🏆 Inserting Pro Plan templates...');
            await pool.request().query(`
                INSERT INTO PlanTemplates (PlanID, PhaseName, PhaseDescription, DurationDays, SortOrder) VALUES
                (${planMap.pro}, N'Tuần 1-2: Đánh giá và chuẩn bị chuyên sâu', N'• Đánh giá mức độ nghiện nicotine và sức khỏe tổng thể
• Thiết kế chương trình cai thuốc cá nhân hóa
• Bắt đầu liệu pháp thay thế nicotine (nếu cần)
• Xây dựng kế hoạch dinh dưỡng và tập luyện chuyên nghiệp
• Thiết lập hệ thống theo dõi sức khỏe 24/7', 14, 1),

                (${planMap.pro}, N'Tuần 3-4: Can thiệp chuyên nghiệp', N'• Tham vấn tâm lý với chuyên gia hàng tuần
• Áp dụng liệu pháp hành vi nhận thức CBT
• Sử dụng ứng dụng AI theo dõi mood và trigger
• Tham gia nhóm trị liệu với coach chuyên nghiệp
• Đo lường và theo dõi biomarkers sức khỏe', 14, 2),

                (${planMap.pro}, N'Tuần 5-6: Tối ưu hóa lối sống', N'• Personalized coaching 1-on-1 với chuyên gia
• Liệu pháp thể chất: massage, acupuncture
• Chương trình dinh dưỡng được tùy chỉnh
• Kỹ thuật mindfulness và thiền định nâng cao
• Theo dõi tiến bộ với công nghệ wearable', 14, 3),

                (${planMap.pro}, N'Tuần 7-9: Củng cố và phát triển bền vững', N'• Phát triển kỹ năng leadership và self-advocacy
• Xây dựng kế hoạch career và personal growth
• Tham gia các hoạt động cộng đồng ý nghĩa
• Thiết lập hệ thống accountability dài hạn
• Chuẩn bị trở thành mentor cho người khác', 21, 4),

                (${planMap.pro}, N'Tuần 10-12: Trở thành champion', N'• Chia sẻ câu chuyện thành công với cộng đồng
• Phát triển kỹ năng coaching để giúp người khác
• Thiết lập lifestyle và career goals dài hạn
• Duy trì sức khỏe tối ưu với check-up định kỳ
• Xây dựng legacy và impact tích cực', 21, 5)
            `);
        }

        // 6. Verify results
        console.log('🔍 Checking final results...');
        const result = await pool.request().query(`
            SELECT 
                pt.TemplateID,
                mp.Name as PlanName,
                pt.PhaseName,
                pt.DurationDays,
                pt.SortOrder
            FROM PlanTemplates pt
            JOIN MembershipPlans mp ON pt.PlanID = mp.PlanID
            ORDER BY pt.PlanID, pt.SortOrder
        `);

        console.log(`✅ Setup completed! Created ${result.recordset.length} templates:`);

        // Group by plan
        const groupedByPlan = result.recordset.reduce((acc, item) => {
            if (!acc[item.PlanName]) {
                acc[item.PlanName] = [];
            }
            acc[item.PlanName].push(item.PhaseName);
            return acc;
        }, {});

        Object.keys(groupedByPlan).forEach(planName => {
            console.log(`📋 ${planName}: ${groupedByPlan[planName].length} phases`);
            groupedByPlan[planName].forEach((phase, index) => {
                console.log(`    ${index + 1}. ${phase}`);
            });
        });

        console.log('🎉 PlanTemplates setup completed successfully!');
        return true;

    } catch (error) {
        console.error('❌ Error setting up PlanTemplates:', error);
        throw error;
    } finally {
        if (pool) {
            await pool.close();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run script
checkAndSetupTemplates()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }); 