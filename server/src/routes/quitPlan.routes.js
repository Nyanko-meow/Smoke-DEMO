const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { auth, requireActivated } = require('../middleware/auth.middleware');
const { checkMembershipAccess, filterByCurrentMembership } = require('../middleware/membershipAccess.middleware');

// Import setup function
const { setupPlanTemplates } = require('../../setup-templates');

// Middleware để kiểm tra quyền truy cập (sử dụng UserMemberships)
const checkUserMembershipAccess = async (req, res, next) => {
    try {
        const userId = req.user.UserID;
        const userRole = req.user.Role;

        // Coach và Admin luôn có quyền truy cập
        if (['coach', 'admin'].includes(userRole)) {
            return next();
        }

        // Kiểm tra user có membership active không
        const membershipQuery = `
            SELECT TOP 1 
                um.MembershipID,
                um.UserID,
                um.PlanID,
                um.StartDate,
                um.EndDate,
                um.Status,
                mp.Name as PlanName,
                mp.Description as PlanDescription,
                mp.Price,
                mp.Duration as PlanDuration
            FROM UserMemberships um
            JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            WHERE um.UserID = @UserID 
            AND um.Status IN ('active', 'confirmed', 'pending_cancellation')
            AND um.EndDate > GETDATE()
            ORDER BY um.EndDate DESC
        `;

        const membershipResult = await pool.request()
            .input('UserID', userId)
            .query(membershipQuery);

        if (membershipResult.recordset.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Bạn cần có gói membership đang hoạt động để truy cập tính năng này'
            });
        }

        // Thêm thông tin membership vào request
        req.userMembership = membershipResult.recordset[0];

        console.log(`User ${userId} has membership access:`, req.userMembership);

        next();
    } catch (error) {
        console.error('Error checking membership access:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi kiểm tra quyền truy cập'
        });
    }
};

// Test endpoint to verify auth
router.post('/test', auth, requireActivated, async (req, res) => {
    try {
        console.log('🧪 Test endpoint - Request received!');
        console.log('🧪 User:', req.user);
        console.log('🧪 Body:', req.body);
        
        res.json({
            success: true,
            message: 'Test endpoint working',
            user: req.user,
            body: req.body
        });
    } catch (error) {
        console.error('❌ Test endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Test endpoint failed',
            error: error.message
        });
    }
});

// Helper function để đảm bảo PlanTemplates table tồn tại
const ensurePlanTemplatesExists = async () => {
    try {
        // Check if table exists
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) as tableExists 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'PlanTemplates'
        `);

        if (tableCheck.recordset[0].tableExists === 0) {
            console.log('PlanTemplates table not found, creating...');
            await setupPlanTemplates();
            return true;
        }

        // Check if table has data
        const dataCheck = await pool.request().query(`SELECT COUNT(*) as dataCount FROM PlanTemplates`);
        if (dataCheck.recordset[0].dataCount === 0) {
            console.log('PlanTemplates table is empty, inserting data...');
            await setupPlanTemplates();
            return true;
        }

        return true;
    } catch (error) {
        console.error('Error ensuring PlanTemplates exists:', error);
        throw error;
    }
};

// Templates hard-coded (di chuyển ra ngoài để dùng chung)
const templates = {
    'premium': {
        name: 'Kế hoạch Premium - 8 tuần',
        phases: [
            {
                phaseName: "Tuần 1-2: Detox và chuẩn bị",
                phaseDescription: "• Thực hiện detox cơ thể với chế độ ăn uống lành mạnh\n• Bắt đầu chương trình tập luyện thể chất\n• Thiết lập hệ thống hỗ trợ từ gia đình và bạn bè\n• Học các kỹ thuật thư giãn: thiền, yoga\n• Ghi chép chi tiết về triggers và cách đối phó",
                durationDays: 14
            },
            {
                phaseName: "Tuần 3-4: Xây dựng thói quen mới",
                phaseDescription: "• Phát triển hobby mới để thay thế thời gian hút thuốc\n• Tham gia các nhóm hỗ trợ trực tuyến/offline\n• Áp dụng kỹ thuật CBT (Cognitive Behavioral Therapy)\n• Theo dõi cải thiện sức khỏe: huyết áp, nhịp tim\n• Lập kế hoạch tài chính từ tiền tiết kiệm",
                durationDays: 14
            },
            {
                phaseName: "Tuần 5-6: Đối phó với khó khăn",
                phaseDescription: "• Nhận diện và xử lý các tình huống nguy hiểm\n• Phát triển kỹ năng quản lý stress nâng cao\n• Tạo động lực dài hạn với mục tiêu cụ thể\n• Đánh giá tiến bộ và điều chỉnh kế hoạch\n• Chuẩn bị tâm lý cho giai đoạn duy trì",
                durationDays: 14
            },
            {
                phaseName: "Tuần 7-8: Duy trì và phát triển",
                phaseDescription: "• Ổn định lối sống không thuốc lá\n• Mở rộng mạng lưới hỗ trợ xã hội\n• Theo dõi và cải thiện sức khỏe tinh thần\n• Lập kế hoạch phòng ngừa tái phát\n• Chia sẻ kinh nghiệm để giúp người khác",
                durationDays: 14
            }
        ]
    },
    'premium-intensive': {
        phases: [
            {
                phaseName: "Tuần 1-2: Cắt bỏ hoàn toàn và detox mạnh",
                phaseDescription: "• Ngừng thuốc lá ngay lập tức, không giảm dần\n• Chế độ detox nghiêm ngặt: nước chanh, trà xanh, rau xanh\n• Tập thể dục cường độ cao 2 lần/ngày\n• Thiền và yoga mỗi sáng tối\n• Ghi nhật ký chi tiết mọi cảm xúc và triệu chứng\n• Loại bỏ hoàn toàn caffeine và đồ ngọt"
            },
            {
                phaseName: "Tuần 3-4: Tái cấu trúc lối sống hoàn toàn",
                phaseDescription: "• Thay đổi toàn bộ thói quen hàng ngày\n• Học 2 kỹ năng mới: nhạc cụ, ngoại ngữ, nghề thủ công\n• Tham gia cộng đồng thể thao/câu lạc bộ sức khỏe\n• Áp dụng cold therapy và breathing exercises\n• Đọc 1 cuốn sách về tâm lý học mỗi tuần\n• Lập kế hoạch kinh doanh từ tiền tiết kiệm"
            },
            {
                phaseName: "Tuần 5-6: Thử thách bản thân và vượt giới hạn",
                phaseDescription: "• Tham gia các thử thách thể chất: chạy marathon mini, leo núi\n• Học các kỹ thuật quản lý stress của doanh nhân\n• Trở thành mentor cho người mới bắt đầu cai thuốc\n• Thực hành mindfulness meditation 30 phút/ngày\n• Tạo ra sản phẩm sáng tạo: blog, video, podcast về hành trình\n• Xây dựng network với cộng đồng healthy lifestyle"
            },
            {
                phaseName: "Tuần 7-8: Trở thành champion và lan tỏa",
                phaseDescription: "• Hoàn thiện bản thân với lối sống hoàn toàn mới\n• Tổ chức events/workshop chia sẻ kinh nghiệm\n• Xây dựng kế hoạch dài hạn 5-10 năm tới\n• Trở thành inspiration cho cộng đồng\n• Phát triển dự án kinh doanh/charity liên quan đến sức khỏe\n• Lập kế hoạch maintenance và continuous improvement"
            }
        ]
    },
    'basic': {
        name: 'Kế hoạch Cơ bản - 2 tuần',
        phases: [
            {
                phaseName: "Tuần 1 (Ngày 1-7): Chuẩn bị và bắt đầu",
                phaseDescription: "• Đặt ngày quit smoking cụ thể\n• Loại bỏ thuốc lá và dụng cụ hút thuốc\n• Thông báo với gia đình và bạn bè\n• Chuẩn bị tinh thần cho thử thách\n• Tìm hiểu về tác hại của thuốc lá",
                durationDays: 7
            },
            {
                phaseName: "Tuần 2 (Ngày 8-15): Vượt qua và duy trì",
                phaseDescription: "• Sử dụng kỹ thuật thở sâu khi thèm thuốc\n• Uống nhiều nước và ăn trái cây\n• Tránh xa những nơi thường hút thuốc\n• Tập thể dục nhẹ nhàng\n• Tìm hoạt động thay thế\n• Củng cố thói quen tích cực\n• Đánh giá tiến bộ ban đầu",
                durationDays: 8
            }
        ]
    },
    'basic-gentle': {
        phases: [
            {
                phaseName: "Tuần 1 (Ngày 1-7): Làm quen và giảm dần",
                phaseDescription: "• Ghi chép thói quen hút thuốc hiện tại\n• Giảm 50% lượng thuốc hút mỗi ngày\n• Uống nước khi muốn hút thuốc\n• Nhai kẹo cao su không đường\n• Tập thở sâu 5 phút mỗi ngày\n• Đi bộ nhẹ nhàng 15 phút sau bữa ăn"
            },
            {
                phaseName: "Tuần 2 (Ngày 8-15): Ngừng hoàn toàn và thay thế",
                phaseDescription: "• Ngừng hút thuốc hoàn toàn\n• Thay thế bằng trà thảo mộc\n• Nghe nhạc thư giãn khi căng thẳng\n• Gặp gỡ bạn bè không hút thuốc\n• Ăn hoa quả khi thèm thuốc\n• Tự thưởng bản thân khi hoàn thành mục tiêu\n• Chia sẻ với người thân về tiến bộ"
            }
        ]
    }
};

// GET /api/quit-plan - Lấy kế hoạch cai thuốc hiện tại của user
router.get('/', auth, requireActivated, async (req, res) => {
    try {
        const userId = req.user.UserID;
        const userRole = req.user.Role;

        console.log('📋 GET /api/quit-plan - userId:', userId);

        // Check UserMembership thay vì PaymentConfirmations
        let userMembership = null;
        try {
            const membershipQuery = `
                SELECT TOP 1 
                    um.MembershipID,
                    um.UserID,
                    um.PlanID,
                    um.StartDate,
                    um.EndDate,
                    um.Status,
                    mp.Name as PlanName,
                    mp.Description as PlanDescription,
                    mp.Price,
                    mp.Duration as PlanDuration
                FROM UserMemberships um
                JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                WHERE um.UserID = @UserID 
                AND um.Status IN ('active', 'confirmed')
                ORDER BY um.EndDate DESC
            `;

            const membershipResult = await pool.request()
                .input('UserID', userId)
                .query(membershipQuery);

            if (membershipResult.recordset.length > 0) {
                userMembership = membershipResult.recordset[0];
                console.log('📋 User membership found:', userMembership);
            } else {
                console.log('📋 No active membership found for user');
            }
        } catch (err) {
            console.log('📋 Error checking user membership:', err.message);
        }

        // Lấy QuitPlans của user (không filter theo membership nữa để lấy hết data)
        let query = `
            SELECT 
                PlanID,
                UserID,
                StartDate,
                TargetDate,
                Reason,
                MotivationLevel,
                DetailedPlan,
                Status,
                CreatedAt,
                MembershipID
            FROM QuitPlans 
            WHERE UserID = @UserID
            AND Status = 'active'
            ORDER BY CreatedAt DESC
        `;

        const result = await pool.request()
            .input('UserID', userId)
            .query(query);

        console.log('📋 Quit plans found:', result.recordset.length);

        // Lấy kế hoạch mẫu theo membership của user
        let templateQuery = '';
        let templateResult = { recordset: [] };

        if (userMembership) {
            // User có membership - lấy template của gói đã đăng ký
            templateQuery = `
                SELECT 
                    pt.TemplateID,
                    pt.PhaseName,
                    pt.PhaseDescription,
                    pt.DurationDays,
                    pt.SortOrder,
                    mp.Name as PlanName,
                    mp.Description as PlanDescription,
                    mp.PlanID,
                    mp.Duration as PlanDuration
                FROM PlanTemplates pt
                JOIN MembershipPlans mp ON pt.PlanID = mp.PlanID
                WHERE mp.PlanID = @PlanID
                ORDER BY pt.SortOrder
            `;

            templateResult = await pool.request()
                .input('PlanID', userMembership.PlanID)
                .query(templateQuery);

            console.log('📋 User has active membership - showing specific plan templates');
        } else {
            console.log('📋 User has no active membership - no plan templates available');
        }

        console.log('📋 Plan templates found:', templateResult.recordset.length);

        // Return data với userMembership thay vì paymentInfo
        const responseData = {
            success: true,
            data: result.recordset || [],
            paymentInfo: userMembership, // Đổi tên để tương thích với frontend
            planTemplate: templateResult.recordset || []
        };

        console.log('📋 Sending response:', JSON.stringify(responseData, null, 2));

        // Force fresh response
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.status(200).json(responseData);
    } catch (error) {
        console.error('❌ Error fetching quit plan:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy kế hoạch cai thuốc',
            error: error.message
        });
    }
});

// GET /api/quit-plan/template/:planId - Lấy kế hoạch mẫu theo gói cụ thể
router.get('/template/:planId', async (req, res) => {
    try {
        const planId = req.params.planId;

        const templateQuery = `
            SELECT 
                pt.TemplateID,
                pt.PhaseName,
                pt.PhaseDescription,
                pt.DurationDays,
                pt.SortOrder,
                mp.Name as PlanName,
                mp.Description as PlanDescription,
                mp.Price,
                mp.Duration as PlanDuration
            FROM PlanTemplates pt
            JOIN MembershipPlans mp ON pt.PlanID = mp.PlanID
            WHERE pt.PlanID = @PlanID
            ORDER BY pt.SortOrder
        `;

        const result = await pool.request()
            .input('PlanID', planId)
            .query(templateQuery);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy kế hoạch mẫu cho gói này'
            });
        }

        res.json({
            success: true,
            data: result.recordset,
            planInfo: {
                planId: planId,
                planName: result.recordset[0].PlanName,
                planDescription: result.recordset[0].PlanDescription,
                price: result.recordset[0].Price,
                duration: result.recordset[0].PlanDuration
            }
        });
    } catch (error) {
        console.error('Error fetching plan template:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy kế hoạch mẫu'
        });
    }
});

// GET /api/quit-plan/templates/all - Lấy tất cả kế hoạch mẫu cho tất cả gói
router.get('/templates/all', async (req, res) => {
    try {
        console.log('📋 Getting all plan templates...');

        const query = `
            SELECT 
                pt.TemplateID,
                pt.PlanID,
                pt.PhaseName,
                pt.PhaseDescription,
                pt.DurationDays,
                pt.SortOrder,
                mp.Name as PlanName,
                mp.Description as PlanDescription,
                mp.Price,
                mp.Duration as PlanDuration
            FROM PlanTemplates pt
            JOIN MembershipPlans mp ON pt.PlanID = mp.PlanID
            ORDER BY pt.PlanID, pt.SortOrder
        `;

        const result = await pool.request().query(query);
        console.log(`✅ Found ${result.recordset.length} templates`);

        if (result.recordset.length === 0) {
            return res.json({
                success: true,
                data: [],
                totalTemplates: 0,
                message: 'Chưa có kế hoạch mẫu nào'
            });
        }

        // Group by plan
        const groupedByPlan = result.recordset.reduce((acc, item) => {
            const planKey = item.PlanID;
            if (!acc[planKey]) {
                acc[planKey] = {
                    planInfo: {
                        planId: item.PlanID,
                        planName: item.PlanName,
                        planDescription: item.PlanDescription,
                        price: item.Price,
                        duration: item.PlanDuration
                    },
                    phases: []
                };
            }
            acc[planKey].phases.push({
                templateId: item.TemplateID,
                phaseName: item.PhaseName,
                phaseDescription: item.PhaseDescription,
                durationDays: item.DurationDays,
                sortOrder: item.SortOrder
            });
            return acc;
        }, {});

        res.json({
            success: true,
            data: Object.values(groupedByPlan),
            totalTemplates: result.recordset.length,
            message: 'Lấy kế hoạch mẫu thành công'
        });
    } catch (error) {
        console.error('❌ Error fetching all templates:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy tất cả kế hoạch mẫu',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// POST /api/quit-plan - Tạo kế hoạch cai thuốc mới
router.post('/', auth, requireActivated, async (req, res) => {
    try {
        console.log('🔥 POST /api/quit-plan - Request received!');
        console.log('🔥 Headers:', req.headers);
        console.log('🔥 User:', req.user);
        console.log('🔥 Body:', req.body);

        const userId = req.user.UserID;
        const userRole = req.user.Role;
        const { 
            startDate, 
            targetDate, 
            reason, 
            motivationLevel, 
            detailedPlan,
            templateId // Thêm templateId
        } = req.body;

        console.log('📝 Creating quit plan for user:', userId, 'role:', userRole);
        console.log('📋 Request body:', req.body);

        // Check UserMembership access (but don't block for coaches/admins)
        let hasMembershipAccess = false;
        if (['coach', 'admin'].includes(userRole)) {
            hasMembershipAccess = true;
            console.log('📋 Coach/Admin bypassing membership check');
        } else {
            try {
                const membershipQuery = `
                    SELECT TOP 1 um.MembershipID
                    FROM UserMemberships um
                    WHERE um.UserID = @UserID 
                    AND um.Status IN ('active', 'confirmed', 'pending_cancellation')
                    AND um.EndDate > GETDATE()
                    ORDER BY um.EndDate DESC
                `;

                const membershipResult = await pool.request()
                    .input('UserID', userId)
                    .query(membershipQuery);

                hasMembershipAccess = membershipResult.recordset.length > 0;
                console.log('📋 Membership access check result:', hasMembershipAccess);
            } catch (membershipError) {
                console.log('📋 Membership check error (proceeding anyway):', membershipError.message);
                hasMembershipAccess = false;
            }
        }

        // Allow creation even without membership (with limited features)
        if (!hasMembershipAccess) {
            console.log('📋 User has no active membership - allowing basic plan creation');
        }

        // Validation
        if (!startDate || !targetDate || !reason || motivationLevel === undefined || motivationLevel === null) {
            console.log('❌ Validation failed - missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc (ngày bắt đầu, ngày mục tiêu, lý do, mức độ động lực)'
            });
        }

        if (motivationLevel < 1 || motivationLevel > 10) {
            console.log('❌ Validation failed - invalid motivation level:', motivationLevel);
            return res.status(400).json({
                success: false,
                message: 'Mức độ động lực phải từ 1 đến 10'
            });
        }

        // Kiểm tra ngày hợp lệ
        const start = new Date(startDate);
        const target = new Date(targetDate);

        if (isNaN(start.getTime()) || isNaN(target.getTime())) {
            console.log('❌ Validation failed - invalid dates:', { startDate, targetDate });
            return res.status(400).json({
                success: false,
                message: 'Ngày không hợp lệ'
            });
        }

        if (target <= start) {
            console.log('❌ Validation failed - target date before start date');
            return res.status(400).json({
                success: false,
                message: 'Ngày mục tiêu phải sau ngày bắt đầu'
            });
        }

        console.log('✅ All validations passed');

        // Tìm membership ID và plan name
        let currentMembershipID = null;
        let userPlanName = null;
        
        const membershipQuery = `
            SELECT TOP 1 
                um.MembershipID,
                um.UserID,
                um.PlanID,
                um.StartDate,
                um.EndDate,
                um.Status,
                mp.Name as PlanName
            FROM UserMemberships um
            INNER JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            WHERE um.UserID = @UserID 
            AND um.Status IN ('active', 'confirmed')
            ORDER BY um.EndDate DESC
        `;

        const membershipResult = await pool.request()
            .input('UserID', userId)
            .query(membershipQuery);

        if (membershipResult.recordset.length > 0) {
            currentMembershipID = membershipResult.recordset[0].MembershipID;
            userPlanName = membershipResult.recordset[0].PlanName;
            console.log('📋 Found membership:', membershipResult.recordset[0]);
        } else {
            console.log('📋 No active membership found');
        }

        // Tự động chọn template dựa trên templateId trước
        let selectedTemplate = templates.basic; // Default
        let templateName = 'basic';

        // BƯỚC 1: Ưu tiên templateId từ frontend
        if (templateId && templates[templateId]) {
            selectedTemplate = templates[templateId];
            templateName = templateId;
            console.log('🎯 Using template from frontend:', templateId);
        } 
        // BƯỚC 2: Fallback detect từ Reason field
        else if (reason && typeof reason === 'string') {
            const reasonLower = reason.toLowerCase();
            
            if (reasonLower.includes('premium chuyên sâu') || reasonLower.includes('premium intensive')) {
                selectedTemplate = templates['premium-intensive'];
                templateName = 'premium-intensive';
                console.log('🎯 Detected template from Reason: premium-intensive');
            } else if (reasonLower.includes('premium')) {
                selectedTemplate = templates.premium;
                templateName = 'premium';
                console.log('🎯 Detected template from Reason: premium');
            } else if (reasonLower.includes('basic nhẹ nhàng') || reasonLower.includes('basic gentle')) {
                selectedTemplate = templates['basic-gentle'];
                templateName = 'basic-gentle';
                console.log('🎯 Detected template from Reason: basic-gentle');
            } else if (reasonLower.includes('basic') || reasonLower.includes('cơ bản')) {
                selectedTemplate = templates.basic;
                templateName = 'basic';
                console.log('🎯 Detected template from Reason: basic');
            }
        } 
        // BƯỚC 3: Fallback dựa vào membership (chỉ khi không detect được)
        else if (userPlanName) {
            const planNameLower = userPlanName.toLowerCase();
            if (planNameLower.includes('premium') || planNameLower.includes('cao cấp')) {
                selectedTemplate = templates.premium;
                templateName = 'premium';
                console.log('🎯 Using Premium template from membership:', userPlanName);
            } else if (planNameLower.includes('basic') || planNameLower.includes('cơ bản')) {
                selectedTemplate = templates.basic;
                templateName = 'basic';
                console.log('🎯 Using Basic template from membership:', userPlanName);
            }
        }

        console.log('🎯 Final selected template:', templateName);

        // Generate DetailedPlan từ template
        let autoGeneratedDetailedPlan = '';
        
        if (selectedTemplate && selectedTemplate.phases) {
            // Thêm template ID vào đầu DetailedPlan
            const templateHeader = `[TEMPLATE_ID:${templateName}]\n\n`;
            autoGeneratedDetailedPlan = templateHeader + selectedTemplate.phases.map((phase, index) => 
                `${phase.phaseName}:\n${phase.phaseDescription}\n`
            ).join('\n');
            
            console.log(`🎯 Auto-generated DetailedPlan with template ID: ${templateName}`);
        }

        // Sử dụng DetailedPlan từ request hoặc auto-generated
        const finalDetailedPlan = detailedPlan || autoGeneratedDetailedPlan;

        // Hủy kế hoạch active hiện tại (nếu có)
        const cancelResult = await pool.request()
            .input('UserID', userId)
            .query(`
                UPDATE QuitPlans 
                SET Status = 'cancelled' 
                WHERE UserID = @UserID AND Status = 'active'
            `);

        console.log('📋 Cancelled existing active plans:', cancelResult.rowsAffected);

        // Tạo kế hoạch mới với MembershipID (hoặc null nếu không có)
        let insertQuery;
        const request = pool.request()
            .input('UserID', userId)
            .input('StartDate', start)
            .input('TargetDate', target)
            .input('Reason', reason)
            .input('MotivationLevel', motivationLevel)
            .input('DetailedPlan', finalDetailedPlan);

        if (currentMembershipID) {
            insertQuery = `
                INSERT INTO QuitPlans (UserID, MembershipID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.PlanID
                VALUES (@UserID, @MembershipID, @StartDate, @TargetDate, @Reason, @MotivationLevel, @DetailedPlan, 'active', GETDATE(), GETDATE())
            `;
            request.input('MembershipID', currentMembershipID);
            console.log('✅ Creating quit plan with membership ID:', currentMembershipID);
        } else {
            insertQuery = `
                INSERT INTO QuitPlans (UserID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.PlanID
                VALUES (@UserID, @StartDate, @TargetDate, @Reason, @MotivationLevel, @DetailedPlan, 'active', GETDATE(), GETDATE())
            `;
            console.log('⚠️ Creating quit plan without membership ID');
        }

        console.log('🔍 About to execute query with DetailedPlan length:', finalDetailedPlan.length);

        let result;
        try {
            result = await request.query(insertQuery);
            console.log('✅ Query executed successfully');
        } catch (dbError) {
            console.error('❌ Database query failed:', dbError);
            throw dbError;
        }

        const newPlanId = result.recordset[0].PlanID;
        console.log('✅ Created new quit plan with ID:', newPlanId);

        // Lấy thông tin kế hoạch vừa tạo
        const selectQuery = `
            SELECT 
                PlanID,
                UserID,
                StartDate,
                TargetDate,
                Reason,
                MotivationLevel,
                DetailedPlan,
                Status,
                CreatedAt,
                MembershipID
            FROM QuitPlans 
            WHERE PlanID = @PlanID
        `;

        const newPlanResult = await pool.request()
            .input('PlanID', newPlanId)
            .query(selectQuery);

        console.log('✅ Successfully created quit plan with auto-generated DetailedPlan');

        res.status(201).json({
            success: true,
            message: 'Kế hoạch cai thuốc đã được tạo thành công',
            data: newPlanResult.recordset[0],
            templateUsed: templateName // Thêm thông tin template đã sử dụng
        });
    } catch (error) {
        console.error('❌ Error creating quit plan:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo kế hoạch cai thuốc: ' + error.message
        });
    }
});

// PUT /api/quit-plan/:planId - Cập nhật kế hoạch cai thuốc (cho user hoặc coach)
router.put('/:planId', auth, requireActivated, async (req, res) => {
    try {
        const userId = req.user.UserID;
        const userRole = req.user.Role;
        const planId = req.params.planId;
        const { startDate, targetDate, reason, motivationLevel, detailedPlan, status } = req.body;

        // Kiểm tra kế hoạch tồn tại
        const existingPlanQuery = `
            SELECT * FROM QuitPlans WHERE PlanID = @PlanID
        `;

        const existingPlan = await pool.request()
            .input('PlanID', planId)
            .query(existingPlanQuery);

        if (existingPlan.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy kế hoạch cai thuốc'
            });
        }

        const plan = existingPlan.recordset[0];

        // Kiểm tra quyền: user chỉ được sửa kế hoạch của mình, coach có thể sửa tất cả
        if (userRole !== 'coach' && userRole !== 'admin' && plan.UserID !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền sửa kế hoạch này'
            });
        }

        // Validation cho user thường (không phải coach)
        if (userRole !== 'coach' && userRole !== 'admin') {
            // Kiểm tra membership access
            const membershipQuery = `
                SELECT TOP 1 um.MembershipID
                FROM UserMemberships um
                WHERE um.UserID = @UserID 
                AND um.Status IN ('active', 'confirmed')
                AND um.EndDate > GETDATE()
                ORDER BY um.EndDate DESC
            `;

            const membershipResult = await pool.request()
                .input('UserID', userId)
                .query(membershipQuery);

            if (membershipResult.recordset.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn cần có membership active để sửa kế hoạch'
                });
            }
        }

        // Chuẩn bị câu lệnh UPDATE
        let updateFields = [];
        let inputs = { PlanID: planId };

        if (startDate) {
            updateFields.push('StartDate = @StartDate');
            inputs.StartDate = new Date(startDate);
        }

        if (targetDate) {
            updateFields.push('TargetDate = @TargetDate');
            inputs.TargetDate = new Date(targetDate);

            // Kiểm tra ngày hợp lệ
            if (startDate && new Date(targetDate) <= new Date(startDate)) {
                return res.status(400).json({
                    success: false,
                    message: 'Ngày mục tiêu phải sau ngày bắt đầu'
                });
            }

            // Kiểm tra ngày mục tiêu phải nằm trong thời hạn membership (chỉ cho user thường)
            if (userRole !== 'coach' && userRole !== 'admin') {
                const membershipQuery = `
                    SELECT um.EndDate 
                    FROM UserMemberships um
                    WHERE um.UserID = @UserID 
                    AND um.Status IN ('active', 'confirmed') 
                    AND um.EndDate > GETDATE()
                    ORDER BY um.EndDate DESC
                `;
                const membershipResult = await pool.request()
                    .input('UserID', plan.UserID)
                    .query(membershipQuery);

                if (membershipResult.recordset.length > 0) {
                    const membershipEndDate = new Date(membershipResult.recordset[0].EndDate);
                    if (new Date(targetDate) > membershipEndDate) {
                        return res.status(400).json({
                            success: false,
                            message: `Ngày mục tiêu không được vượt quá thời hạn gói dịch vụ (${membershipEndDate.toLocaleDateString('vi-VN')})`
                        });
                    }
                }
            }
        }

        if (reason) {
            updateFields.push('Reason = @Reason');
            inputs.Reason = reason;
        }

        if (motivationLevel) {
            if (motivationLevel < 1 || motivationLevel > 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Mức độ động lực phải từ 1 đến 10'
                });
            }
            updateFields.push('MotivationLevel = @MotivationLevel');
            inputs.MotivationLevel = motivationLevel;
        }

        if (detailedPlan !== undefined) {
            updateFields.push('DetailedPlan = @DetailedPlan');
            inputs.DetailedPlan = detailedPlan;
        }

        // Coach có thể thay đổi status
        if (status && (userRole === 'coach' || userRole === 'admin')) {
            if (!['active', 'completed', 'cancelled'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Trạng thái không hợp lệ'
                });
            }
            updateFields.push('Status = @Status');
            inputs.Status = status;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có thông tin nào để cập nhật'
            });
        }

        // Thêm UpdatedAt
        updateFields.push('UpdatedAt = GETDATE()');

        // Thực hiện UPDATE
        const updateQuery = `
            UPDATE QuitPlans 
            SET ${updateFields.join(', ')}
            WHERE PlanID = @PlanID
        `;

        const request = pool.request();
        Object.keys(inputs).forEach(key => {
            request.input(key, inputs[key]);
        });

        await request.query(updateQuery);

        // Lấy thông tin kế hoạch đã cập nhật
        const updatedPlanResult = await pool.request()
            .input('PlanID', planId)
            .query(`
                SELECT 
                    PlanID,
                    UserID,
                    StartDate,
                    TargetDate,
                    Reason,
                    MotivationLevel,
                    DetailedPlan,
                    Status,
                    CreatedAt,
                    MembershipID,
                    UpdatedAt
                FROM QuitPlans 
                WHERE PlanID = @PlanID
            `);

        res.json({
            success: true,
            message: 'Kế hoạch cai thuốc đã được cập nhật thành công',
            data: updatedPlanResult.recordset[0]
        });
    } catch (error) {
        console.error('Error updating quit plan:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật kế hoạch cai thuốc'
        });
    }
});

// GET /api/quit-plan/all - Lấy tất cả kế hoạch (chỉ cho coach/admin)
router.get('/all', auth, requireActivated, async (req, res) => {
    try {
        const userRole = req.user.Role;

        if (!['coach', 'admin'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập tính năng này'
            });
        }

        const query = `
            SELECT 
                qp.PlanID,
                qp.UserID,
                qp.StartDate,
                qp.TargetDate,
                qp.Reason,
                qp.MotivationLevel,
                qp.DetailedPlan,
                qp.Status,
                qp.CreatedAt,
                qp.MembershipID,
                u.FirstName + ' ' + u.LastName as UserName,
                u.Email as UserEmail
            FROM QuitPlans qp
            JOIN Users u ON qp.UserID = u.UserID
            ORDER BY qp.CreatedAt DESC
        `;

        const result = await pool.request().query(query);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error fetching all quit plans:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách kế hoạch'
        });
    }
});

// POST /api/quit-plan/populate-templates - Populate DetailedPlan cho các kế hoạch đang trống
router.post('/populate-templates', auth, requireActivated, async (req, res) => {
    try {
        const userRole = req.user.Role;

        // Chỉ admin mới được sử dụng chức năng này
        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có thể sử dụng chức năng này'
            });
        }

        console.log('🔧 Starting template population for empty DetailedPlan...');

        // Lấy tất cả kế hoạch có DetailedPlan trống
        const emptyPlansQuery = `
            SELECT 
                qp.PlanID,
                qp.UserID,
                qp.MembershipID,
                qp.StartDate,
                qp.TargetDate,
                qp.Reason,
                qp.MotivationLevel,
                qp.Status,
                um.PlanID as UserPlanID,
                mp.Name as PlanName
            FROM QuitPlans qp
            LEFT JOIN UserMemberships um ON qp.MembershipID = um.MembershipID
            LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            WHERE (qp.DetailedPlan IS NULL OR qp.DetailedPlan = '')
            AND qp.Status = 'active'
        `;

        const emptyPlansResult = await pool.request().query(emptyPlansQuery);
        const emptyPlans = emptyPlansResult.recordset;

        console.log(`📋 Found ${emptyPlans.length} plans with empty DetailedPlan`);

        if (emptyPlans.length === 0) {
            return res.json({
                success: true,
                message: 'Không có kế hoạch nào cần cập nhật DetailedPlan',
                data: { updated: 0 }
            });
        }

        let updatedCount = 0;

        // Xử lý từng kế hoạch
        for (const plan of emptyPlans) {
            try {
                let selectedTemplate = null;
                let templateKey = 'basic'; // Default template

                // Xác định template dựa vào PlanName
                if (plan.PlanName) {
                    const planName = plan.PlanName.toLowerCase();
                    if (planName.includes('premium') || planName.includes('cao cấp')) {
                        templateKey = 'premium';
                    } else if (planName.includes('basic') || planName.includes('cơ bản')) {
                        templateKey = 'basic';
                    }
                }

                selectedTemplate = templates[templateKey];

                if (!selectedTemplate) {
                    console.log(`⚠️ No template found for plan ${plan.PlanID}, using basic template`);
                    selectedTemplate = templates['basic'];
                }

                // Tạo DetailedPlan từ template
                const detailedPlanText = selectedTemplate.phases.map((phase, index) => 
                    `${phase.phaseName}:\n${phase.phaseDescription}\n`
                ).join('\n');

                // Update DetailedPlan
                await pool.request()
                    .input('PlanID', plan.PlanID)
                    .input('DetailedPlan', detailedPlanText)
                    .query(`
                        UPDATE QuitPlans 
                        SET DetailedPlan = @DetailedPlan, UpdatedAt = GETDATE()
                        WHERE PlanID = @PlanID
                    `);

                updatedCount++;
                console.log(`✅ Updated plan ${plan.PlanID} with ${templateKey} template`);

            } catch (error) {
                console.error(`❌ Error updating plan ${plan.PlanID}:`, error);
            }
        }

        console.log(`🎉 Template population completed. Updated ${updatedCount}/${emptyPlans.length} plans`);

        res.json({
            success: true,
            message: `Đã cập nhật DetailedPlan cho ${updatedCount} kế hoạch`,
            data: { 
                updated: updatedCount, 
                total: emptyPlans.length 
            }
        });

    } catch (error) {
        console.error('❌ Error populating templates:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi populate templates: ' + error.message
        });
    }
});

module.exports = router; 