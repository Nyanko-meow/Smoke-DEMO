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

async function ensurePlanTemplates() {
    let pool = null;
    try {
        console.log('🚀 Ensuring PlanTemplates are properly set up...\n');

        // Connect to database
        console.log('🔗 Connecting to database...');
        pool = await sql.connect(config);
        console.log('✅ Database connected\n');

        // 1. Check if PlanTemplates table exists
        console.log('📋 Checking if PlanTemplates table exists...');
        const tableExists = await pool.request().query(`
            SELECT COUNT(*) as tableExists 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'PlanTemplates'
        `);

        if (tableExists.recordset[0].tableExists === 0) {
            console.log('❌ PlanTemplates table does not exist. Creating...');
            await pool.request().query(`
                CREATE TABLE PlanTemplates (
                    TemplateID INT IDENTITY(1,1) PRIMARY KEY,
                    PlanID INT FOREIGN KEY REFERENCES MembershipPlans(PlanID),
                    PhaseName NVARCHAR(255) NOT NULL,
                    PhaseDescription NVARCHAR(MAX) NOT NULL,
                    DurationDays INT NOT NULL,
                    SortOrder INT NOT NULL,
                    CreatedAt DATETIME DEFAULT GETDATE()
                );
            `);
            console.log('✅ PlanTemplates table created');
        } else {
            console.log('✅ PlanTemplates table exists');
        }

        // 2. Check current template count
        const currentCount = await pool.request().query(`
            SELECT COUNT(*) as count FROM PlanTemplates
        `);
        console.log(`📊 Current templates count: ${currentCount.recordset[0].count}`);

        // 3. Check available membership plans
        const membershipPlans = await pool.request().query(`
            SELECT PlanID, Name FROM MembershipPlans ORDER BY PlanID
        `);
        console.log('📋 Available membership plans:');
        membershipPlans.recordset.forEach(plan => {
            console.log(`   ${plan.PlanID}: ${plan.Name}`);
        });

        if (membershipPlans.recordset.length === 0) {
            console.log('❌ No membership plans found! Please insert membership plans first.');
            return false;
        }

        // 4. Clear existing templates and recreate
        console.log('\n🧹 Clearing existing templates...');
        await pool.request().query(`DELETE FROM PlanTemplates`);

        // 5. Create template data for each plan
        console.log('📝 Creating template data...\n');

        for (const plan of membershipPlans.recordset) {
            const planId = plan.PlanID;
            const planName = plan.Name;

            console.log(`Creating templates for ${planName} (ID: ${planId})...`);

            if (planName.includes('Basic')) {
                await pool.request().query(`
                    INSERT INTO PlanTemplates (PlanID, PhaseName, PhaseDescription, DurationDays, SortOrder) VALUES
                    (${planId}, N'Tuần 1: Chuẩn bị tinh thần', N'• Xác định lý do cai thuốc rõ ràng
• Loại bỏ tất cả thuốc lá và dụng cụ hút thuốc
• Thông báo cho gia đình, bạn bè về quyết định
• Bắt đầu ghi nhật ký cảm xúc hàng ngày
• Tập thở sâu khi cảm thấy thèm thuốc', 7, 1),

                    (${planId}, N'Tuần 2: Thay đổi thói quen', N'• Thay đổi lịch trình hàng ngày để tránh trigger
• Uống nhiều nước, ăn kẹo không đường khi thèm
• Tập thể dục nhẹ 15-20 phút/ngày
• Tìm hoạt động thay thế: đọc sách, nghe nhạc
• Tính toán số tiền tiết kiệm được', 7, 2),

                    (${planId}, N'Tuần 3-4: Củng cố ý chí', N'• Tiếp tục duy trì thói quen tốt
• Tham gia cộng đồng hỗ trợ cai thuốc
• Thưởng cho bản thân khi đạt milestone
• Xử lý stress bằng cách tích cực
• Chuẩn bị cho những thử thách dài hạn', 14, 3)
                `);
                console.log(`   ✅ Added 3 phases for ${planName}`);
            }
            else if (planName.includes('Premium')) {
                await pool.request().query(`
                    INSERT INTO PlanTemplates (PlanID, PhaseName, PhaseDescription, DurationDays, SortOrder) VALUES
                    (${planId}, N'Tuần 1-2: Detox và chuẩn bị', N'• Thực hiện detox cơ thể với chế độ ăn uống lành mạnh
• Bắt đầu chương trình tập luyện thể chất
• Thiết lập hệ thống hỗ trợ từ gia đình và bạn bè
• Học các kỹ thuật thư giãn: thiền, yoga
• Ghi chép chi tiết về triggers và cách đối phó', 14, 1),

                    (${planId}, N'Tuần 3-4: Xây dựng thói quen mới', N'• Phát triển hobby mới để thay thế thời gian hút thuốc
• Tham gia các nhóm hỗ trợ trực tuyến/offline
• Áp dụng kỹ thuật CBT (Cognitive Behavioral Therapy)
• Theo dõi cải thiện sức khỏe: huyết áp, nhịp tim
• Lập kế hoạch tài chính từ tiền tiết kiệm', 14, 2),

                    (${planId}, N'Tuần 5-6: Đối phó với khó khăn', N'• Nhận diện và xử lý các tình huống nguy hiểm
• Phát triển kỹ năng quản lý stress nâng cao
• Tạo động lực dài hạn với mục tiêu cụ thể
• Đánh giá tiến bộ và điều chỉnh kế hoạch
• Chuẩn bị tâm lý cho giai đoạn duy trì', 14, 3),

                    (${planId}, N'Tuần 7-8: Duy trì và phát triển', N'• Ổn định lối sống không thuốc lá
• Mở rộng mạng lưới hỗ trợ xã hội
• Theo dõi và cải thiện sức khỏe tinh thần
• Lập kế hoạch phòng ngừa tái phát
• Chia sẻ kinh nghiệm để giúp người khác', 14, 4)
                `);
                console.log(`   ✅ Added 4 phases for ${planName}`);
            }
            else if (planName.includes('Pro')) {
                await pool.request().query(`
                    INSERT INTO PlanTemplates (PlanID, PhaseName, PhaseDescription, DurationDays, SortOrder) VALUES
                    (${planId}, N'Tuần 1-2: Đánh giá và chuẩn bị chuyên sâu', N'• Đánh giá mức độ nghiện nicotine và sức khỏe tổng thể
• Thiết kế chương trình cai thuốc cá nhân hóa
• Bắt đầu liệu pháp thay thế nicotine (nếu cần)
• Xây dựng kế hoạch dinh dưỡng và tập luyện chuyên nghiệp
• Thiết lập hệ thống theo dõi sức khỏe 24/7', 14, 1),

                    (${planId}, N'Tuần 3-4: Can thiệp chuyên nghiệp', N'• Tham vấn tâm lý với chuyên gia hàng tuần
• Áp dụng liệu pháp hành vi nhận thức CBT
• Sử dụng ứng dụng AI theo dõi mood và trigger
• Tham gia nhóm trị liệu với coach chuyên nghiệp
• Đo lường và theo dõi biomarkers sức khỏe', 14, 2),

                    (${planId}, N'Tuần 5-6: Tối ưa hóa lối sống', N'• Personalized coaching 1-on-1 với chuyên gia
• Liệu pháp thể chất: massage, acupuncture
• Chương trình dinh dưỡng được tùy chỉnh
• Kỹ thuật mindfulness và thiền định nâng cao
• Theo dõi tiến bộ với công nghệ wearable', 14, 3),

                    (${planId}, N'Tuần 7-9: Củng cố và phát triển bền vững', N'• Phát triển kỹ năng leadership và self-advocacy
• Xây dựng kế hoạch career và personal growth
• Tham gia các hoạt động cộng đồng ý nghĩa
• Thiết lập hệ thống accountability dài hạn
• Chuẩn bị trở thành mentor cho người khác', 21, 4),

                    (${planId}, N'Tuần 10-12: Trở thành champion', N'• Chia sẻ câu chuyện thành công với cộng đồng
• Phát triển kỹ năng coaching để giúp người khác
• Thiết lập lifestyle và career goals dài hạn
• Duy trì sức khỏe tối ưu với check-up định kỳ
• Xây dựng legacy và impact tích cực', 21, 5)
                `);
                console.log(`   ✅ Added 5 phases for ${planName}`);
            } else {
                // Default template for any other plan
                await pool.request().query(`
                    INSERT INTO PlanTemplates (PlanID, PhaseName, PhaseDescription, DurationDays, SortOrder) VALUES
                    (${planId}, N'Giai đoạn 1: Bắt đầu', N'• Thiết lập mục tiêu cai thuốc rõ ràng
• Chuẩn bị tinh thần và môi trường phù hợp
• Tìm hiểu về tác hại của thuốc lá', 7, 1),

                    (${planId}, N'Giai đoạn 2: Thực hiện', N'• Thay đổi thói quen hàng ngày
• Áp dụng các kỹ thuật đối phó với cơn thèm
• Theo dõi tiến trình hàng ngày', 14, 2),

                    (${planId}, N'Giai đoạn 3: Duy trì', N'• Củng cố thành quả đã đạt được
• Xây dựng lối sống lành mạnh
• Chuẩn bị cho việc duy trì lâu dài', 14, 3)
                `);
                console.log(`   ✅ Added 3 default phases for ${planName}`);
            }
        }

        // 6. Verify results
        console.log('\n🔍 Verifying results...');
        const finalCount = await pool.request().query(`
            SELECT COUNT(*) as count FROM PlanTemplates
        `);

        const templatesByPlan = await pool.request().query(`
            SELECT 
                mp.Name as PlanName,
                COUNT(pt.TemplateID) as TemplateCount
            FROM MembershipPlans mp
            LEFT JOIN PlanTemplates pt ON mp.PlanID = pt.PlanID
            GROUP BY mp.PlanID, mp.Name
            ORDER BY mp.PlanID
        `);

        console.log(`📊 Total templates created: ${finalCount.recordset[0].count}`);
        console.log('📋 Templates by plan:');
        templatesByPlan.recordset.forEach(row => {
            console.log(`   ${row.PlanName}: ${row.TemplateCount} templates`);
        });

        // 7. Test QuitPlans with DetailedPlan
        console.log('\n🔍 Checking QuitPlans with DetailedPlan...');
        const quitPlansWithDetailedPlan = await pool.request().query(`
            SELECT 
                COUNT(*) as totalCount,
                SUM(CASE WHEN DetailedPlan IS NOT NULL AND DetailedPlan != '' THEN 1 ELSE 0 END) as withDetailedPlan
            FROM QuitPlans
        `);

        console.log(`📊 QuitPlans total: ${quitPlansWithDetailedPlan.recordset[0].totalCount}`);
        console.log(`📊 QuitPlans with DetailedPlan: ${quitPlansWithDetailedPlan.recordset[0].withDetailedPlan}`);

        console.log('\n🎉 Setup completed successfully!');
        console.log('\n📝 What this means:');
        console.log('   • PlanTemplates: Contains template plans for each membership package');
        console.log('   • QuitPlans.DetailedPlan: Contains user\'s custom detailed plan text');
        console.log('   • User creates their plan using templates as reference');
        console.log('   • The "detailed plan" they write gets saved in QuitPlans.DetailedPlan');

        return true;
    } catch (error) {
        console.error('❌ Error ensuring PlanTemplates:', error);
        throw error;
    } finally {
        if (pool) {
            await pool.close();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the setup
if (require.main === module) {
    ensurePlanTemplates()
        .then(() => {
            console.log('\n✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { ensurePlanTemplates }; 