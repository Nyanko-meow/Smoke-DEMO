const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { auth, requireActivated } = require('../middleware/auth.middleware');
const { checkMembershipAccess, filterByCurrentMembership } = require('../middleware/membershipAccess.middleware');

// Import setup function
const { setupPlanTemplates } = require('../../setup-templates');

// Middleware để kiểm tra quyền truy cập (chỉ dựa vào PaymentConfirmations)
const checkPaymentConfirmationAccess = async (req, res, next) => {
    try {
        const userId = req.user.UserID;
        const userRole = req.user.Role;

        // Coach và Admin luôn có quyền truy cập
        if (['coach', 'admin'].includes(userRole)) {
            return next();
        }

        // Kiểm tra user có payment được confirm không
        const paymentConfirmationQuery = `
            SELECT TOP 1 
                pc.ConfirmationID,
                pc.ConfirmationDate,
                p.PaymentID,
                p.Amount,
                p.Status as PaymentStatus,
                mp.Name as PlanName,
                p.StartDate,
                p.EndDate
            FROM PaymentConfirmations pc
            JOIN Payments p ON pc.PaymentID = p.PaymentID
            JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
            WHERE p.UserID = @UserID 
            AND p.Status = 'confirmed'
            ORDER BY pc.ConfirmationDate DESC
        `;

        const confirmationResult = await pool.request()
            .input('UserID', userId)
            .query(paymentConfirmationQuery);

        if (confirmationResult.recordset.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Bạn cần đăng ký và thanh toán gói dịch vụ được xác nhận để truy cập tính năng này'
            });
        }

        // Thêm thông tin payment confirmation vào request
        req.paymentConfirmation = confirmationResult.recordset[0];

        console.log(`User ${userId} has payment confirmation access:`, req.paymentConfirmation);

        next();
    } catch (error) {
        console.error('Error checking payment confirmation access:', error);
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

// GET /api/quit-plan - Lấy kế hoạch cai thuốc hiện tại của user
router.get('/', auth, requireActivated, filterByCurrentMembership, async (req, res) => {
    try {
        const userId = req.user.UserID;

        console.log('📋 GET /api/quit-plan - userId:', userId);

        // Check payment confirmation manually (without blocking)
        let paymentConfirmation = null;
        try {
            const paymentConfirmationQuery = `
                SELECT TOP 1 
                    pc.ConfirmationID,
                    pc.ConfirmationDate,
                    p.PaymentID,
                    p.Amount,
                    p.Status as PaymentStatus,
                    mp.Name as PlanName,
                    p.StartDate,
                    p.EndDate
                FROM PaymentConfirmations pc
                JOIN Payments p ON pc.PaymentID = p.PaymentID
                JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
                WHERE p.UserID = @UserID 
                AND p.Status = 'confirmed'
                ORDER BY pc.ConfirmationDate DESC
            `;

            const confirmationResult = await pool.request()
                .input('UserID', userId)
                .query(paymentConfirmationQuery);

            if (confirmationResult.recordset.length > 0) {
                paymentConfirmation = confirmationResult.recordset[0];
                console.log('📋 Payment confirmation found:', paymentConfirmation);
            } else {
                console.log('📋 No payment confirmation found for user');
            }
        } catch (err) {
            console.log('📋 Error checking payment confirmation:', err.message);
        }

        // Nếu không có active membership, return empty
        if (req.noActiveMembership) {
            return res.json({
                success: true,
                data: [],
                paymentInfo: null,
                planTemplate: [],
                message: 'No active membership found'
            });
        }

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
                CreatedAt
            FROM QuitPlans 
            WHERE UserID = @UserID
        `;

        const request = pool.request()
            .input('UserID', userId);

        // Nếu có MembershipID từ middleware, filter theo đó
        if (req.currentMembershipID) {
            query += ` AND MembershipID = @MembershipID`;
            request.input('MembershipID', req.currentMembershipID);
        }

        query += ` ORDER BY CreatedAt DESC`;

        const result = await request.query(query);

        console.log('📋 Quit plans found:', result.recordset.length);

        // Lấy kế hoạch mẫu CHÍNH XÁC theo gói user đã đăng ký và được confirm
        let templateQuery = '';
        let templateResult = { recordset: [] };

        if (paymentConfirmation) {
            // User có payment confirmed - chỉ lấy template của gói đã mua
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
                WHERE mp.PlanID = (
                    SELECT TOP 1 p.PlanID 
                    FROM Payments p 
                    WHERE p.UserID = @UserID 
                        AND p.Status = 'confirmed'
                    ORDER BY p.PaymentDate DESC
                )
                ORDER BY pt.SortOrder
            `;

            templateResult = await pool.request()
                .input('UserID', userId)
                .query(templateQuery);

            console.log('📋 User has confirmed payment - showing specific plan templates only');
        } else {
            // User chưa có payment confirmed - không hiện template gì cả hoặc chỉ custom
            console.log('📋 User has no confirmed payment - no plan templates available');
        }

        console.log('📋 Plan templates found:', templateResult.recordset.length);

        // Always return 200 with proper data structure
        const responseData = {
            success: true,
            data: result.recordset || [],
            paymentInfo: paymentConfirmation,
            planTemplate: templateResult.recordset || []
        };

        console.log('📋 Sending response:', JSON.stringify(responseData, null, 2));

        // Force fresh response (prevent 304)
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

        // Direct query without ensurePlanTemplatesExists which might be causing issues
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
        const { startDate, targetDate, reason, motivationLevel, detailedPlan } = req.body;

        console.log('📝 Creating quit plan for user:', userId, 'role:', userRole);
        console.log('📋 Request body:', req.body);

        // Check payment confirmation (but don't block for coaches/admins)
        let hasPaymentAccess = false;
        if (['coach', 'admin'].includes(userRole)) {
            hasPaymentAccess = true;
            console.log('📋 Coach/Admin bypassing payment check');
        } else {
            try {
                const paymentConfirmationQuery = `
                    SELECT TOP 1 pc.ConfirmationID
                    FROM PaymentConfirmations pc
                    JOIN Payments p ON pc.PaymentID = p.PaymentID
                    WHERE p.UserID = @UserID AND p.Status = 'confirmed'
                    ORDER BY pc.ConfirmationDate DESC
                `;

                const confirmationResult = await pool.request()
                    .input('UserID', userId)
                    .query(paymentConfirmationQuery);

                hasPaymentAccess = confirmationResult.recordset.length > 0;
                console.log('📋 Payment access check result:', hasPaymentAccess);
            } catch (paymentError) {
                console.log('📋 Payment check error (proceeding anyway):', paymentError.message);
                hasPaymentAccess = false;
            }
        }

        // For now, allow creation even without payment (with limited features)
        if (!hasPaymentAccess) {
            console.log('📋 User has no payment confirmation - allowing basic plan creation');
            // Could add limitations here in the future
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

        // Skip membership end date validation for now to allow plan creation

        console.log('✅ All validations passed');

        // Tìm membership ID linh hoạt hơn
        let currentMembershipID = null;
        
        // Kiểm tra membership active trước
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
            console.log('📋 Found membership:', membershipResult.recordset[0]);
        } else {
            // Fallback: Tìm membership gần đây nhất
            const fallbackQuery = `
                SELECT TOP 1 MembershipID
                FROM UserMemberships
                WHERE UserID = @UserID
                ORDER BY CreatedAt DESC
            `;
            
            const fallbackResult = await pool.request()
                .input('UserID', userId)
                .query(fallbackQuery);
                
            if (fallbackResult.recordset.length > 0) {
                currentMembershipID = fallbackResult.recordset[0].MembershipID;
                console.log('📋 Using fallback membership:', currentMembershipID);
            }
        }

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
        if (currentMembershipID) {
            insertQuery = `
                INSERT INTO QuitPlans (UserID, MembershipID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.PlanID
                VALUES (@UserID, @MembershipID, @StartDate, @TargetDate, @Reason, @MotivationLevel, @DetailedPlan, 'active', GETDATE(), GETDATE())
            `;
        } else {
            insertQuery = `
                INSERT INTO QuitPlans (UserID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.PlanID
                VALUES (@UserID, @StartDate, @TargetDate, @Reason, @MotivationLevel, @DetailedPlan, 'active', GETDATE(), GETDATE())
            `;
        }

        const request = pool.request()
            .input('UserID', userId)
            .input('StartDate', start)
            .input('TargetDate', target)
            .input('Reason', reason)
            .input('MotivationLevel', motivationLevel)
            .input('DetailedPlan', detailedPlan || '');

        // Thêm MembershipID nếu có
        if (currentMembershipID) {
            request.input('MembershipID', currentMembershipID);
            console.log('✅ Creating quit plan with membership ID:', currentMembershipID);
        } else {
            console.log('⚠️ Creating quit plan without membership ID');
        }

        console.log('🔍 About to execute query:', insertQuery);
        console.log('🔍 With parameters:', {
            UserID: userId,
            MembershipID: currentMembershipID,
            StartDate: start,
            TargetDate: target,
            Reason: reason,
            MotivationLevel: motivationLevel,
            DetailedPlan: detailedPlan || ''
        });

        let result;
        try {
            result = await request.query(insertQuery);
            console.log('✅ Query executed successfully');
        } catch (dbError) {
            console.error('❌ Database query failed:', dbError);
            console.error('❌ Query was:', insertQuery);
            console.error('❌ Parameters were:', {
                UserID: userId,
                MembershipID: currentMembershipID,
                StartDate: start,
                TargetDate: target,
                Reason: reason,
                MotivationLevel: motivationLevel,
                DetailedPlan: detailedPlan || ''
            });
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
                CreatedAt
            FROM QuitPlans 
            WHERE PlanID = @PlanID
        `;

        const newPlanResult = await pool.request()
            .input('PlanID', newPlanId)
            .query(selectQuery);

        console.log('✅ Successfully created quit plan');

        res.status(201).json({
            success: true,
            message: 'Kế hoạch cai thuốc đã được tạo thành công',
            data: newPlanResult.recordset[0]
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
            // Kiểm tra payment confirmation access
            const paymentConfirmationQuery = `
                SELECT TOP 1 pc.ConfirmationID
                FROM PaymentConfirmations pc
                JOIN Payments p ON pc.PaymentID = p.PaymentID
                WHERE p.UserID = @UserID AND p.Status = 'confirmed'
                ORDER BY pc.ConfirmationDate DESC
            `;

            const confirmationResult = await pool.request()
                .input('UserID', userId)
                .query(paymentConfirmationQuery);

            if (confirmationResult.recordset.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn cần có payment được confirm để sửa kế hoạch'
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
                // Lấy thông tin membership của user
                const membershipQuery = `
                    SELECT EndDate FROM UserMemberships 
                    WHERE UserID = @UserID AND Status = 'active' AND EndDate > GETDATE()
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
                    CreatedAt
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

module.exports = router; 