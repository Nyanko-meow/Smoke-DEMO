const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { auth, requireActivated } = require('../middleware/auth.middleware');

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
router.get('/', auth, requireActivated, checkPaymentConfirmationAccess, async (req, res) => {
    try {
        const userId = req.user.UserID;

        const query = `
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
            ORDER BY CreatedAt DESC
        `;

        const result = await pool.request()
            .input('UserID', userId)
            .query(query);

        // Lấy kế hoạch mẫu theo gói user đã đăng ký (bao gồm cả pending payments)
        const templateQuery = `
            SELECT 
                pt.TemplateID,
                pt.PhaseName,
                pt.PhaseDescription,
                pt.DurationDays,
                pt.SortOrder,
                mp.Name as PlanName,
                mp.Description as PlanDescription
            FROM PlanTemplates pt
            JOIN MembershipPlans mp ON pt.PlanID = mp.PlanID
            WHERE mp.PlanID IN (
                SELECT DISTINCT p.PlanID 
                FROM Payments p 
                WHERE p.UserID = @UserID 
                    AND p.Status IN ('confirmed', 'pending')
            )
            ORDER BY pt.SortOrder
        `;

        const templateResult = await pool.request()
            .input('UserID', userId)
            .query(templateQuery);

        res.json({
            success: true,
            data: result.recordset,
            paymentInfo: req.paymentConfirmation,
            planTemplate: templateResult.recordset // Thêm kế hoạch mẫu
        });
    } catch (error) {
        console.error('Error fetching quit plan:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy kế hoạch cai thuốc'
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
router.post('/', auth, requireActivated, checkPaymentConfirmationAccess, async (req, res) => {
    try {
        const userId = req.user.UserID;
        const { startDate, targetDate, reason, motivationLevel, detailedPlan } = req.body;

        console.log('📝 Creating quit plan for user:', userId);
        console.log('📋 Request body:', req.body);

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

        // Hủy kế hoạch active hiện tại (nếu có)
        const cancelResult = await pool.request()
            .input('UserID', userId)
            .query(`
                UPDATE QuitPlans 
                SET Status = 'cancelled' 
                WHERE UserID = @UserID AND Status = 'active'
            `);

        console.log('📋 Cancelled existing active plans:', cancelResult.rowsAffected);

        // Tạo kế hoạch mới
        const insertQuery = `
            INSERT INTO QuitPlans (UserID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status)
            OUTPUT INSERTED.PlanID
            VALUES (@UserID, @StartDate, @TargetDate, @Reason, @MotivationLevel, @DetailedPlan, 'active')
        `;

        const result = await pool.request()
            .input('UserID', userId)
            .input('StartDate', start)
            .input('TargetDate', target)
            .input('Reason', reason)
            .input('MotivationLevel', motivationLevel)
            .input('DetailedPlan', detailedPlan || null)
            .query(insertQuery);

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