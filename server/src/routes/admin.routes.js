const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { protect, authorize } = require('../middleware/auth.middleware');

// Admin login endpoint - only for role 'admin'
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ email và mật khẩu'
            });
        }

        // Check if user exists and has admin role
        const result = await pool.request()
            .input('Email', email)
            .query(`
                SELECT UserID, Email, Password, FirstName, LastName, Role, IsActive, EmailVerified
                FROM Users 
                WHERE Email = @Email AND Role = 'admin'
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email không tồn tại hoặc không có quyền admin'
            });
        }

        const user = result.recordset[0];

        // Check if account is active
        if (!user.IsActive) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản chưa được kích hoạt'
            });
        }

        // Verify password (no hash - plain text comparison)
        if (password !== user.Password) {
            return res.status(401).json({
                success: false,
                message: 'Mật khẩu không chính xác'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.UserID,
                email: user.Email,
                role: user.Role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '8h' }
        );

        // Update last login
        await pool.request()
            .input('UserID', user.UserID)
            .query(`
                UPDATE Users 
                SET LastLoginAt = GETDATE() 
                WHERE UserID = @UserID
            `);

        // Record login history
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        await pool.request()
            .input('UserID', user.UserID)
            .input('IPAddress', ipAddress)
            .input('UserAgent', userAgent)
            .query(`
                INSERT INTO LoginHistory (UserID, IPAddress, UserAgent, Status)
                VALUES (@UserID, @IPAddress, @UserAgent, 'success')
            `);

        // Set cookie
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60 * 1000 // 8 hours
        };

        res.cookie('token', token, cookieOptions);

        res.json({
            success: true,
            token,
            user: {
                id: user.UserID,
                email: user.Email,
                firstName: user.FirstName,
                lastName: user.LastName,
                role: user.Role
            },
            message: 'Đăng nhập thành công'
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Admin logout
router.post('/logout', protect, authorize('admin'), async (req, res) => {
    try {
        res.clearCookie('token');
        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    } catch (error) {
        console.error('Admin logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng xuất'
        });
    }
});

// Get dashboard statistics
router.get('/dashboard-stats', protect, authorize('admin'), async (req, res) => {
    try {
        // Get total users
        const totalUsersResult = await pool.request().query(`
            SELECT COUNT(*) as totalUsers FROM Users
        `);

        // Get total plans sold
        const totalPlansResult = await pool.request().query(`
            SELECT COUNT(*) as totalPlans FROM UserMemberships WHERE Status = 'active'
        `);

        // Get successful quitters (people with completed quit plans)
        const successfulQuittersResult = await pool.request().query(`
            SELECT COUNT(DISTINCT UserID) as successfulQuitters 
            FROM QuitPlans 
            WHERE Status = 'completed'
        `);

        // Get total revenue (tất cả payments confirmed)
        const totalRevenueResult = await pool.request().query(`
            SELECT SUM(Amount) as totalRevenue
            FROM Payments 
            WHERE Status = 'confirmed'
        `);

        // Get total refunds (tổng tiền hoàn trả)
        const totalRefundsResult = await pool.request().query(`
            SELECT ISNULL(SUM(RefundAmount), 0) as totalRefunds
            FROM CancellationRequests 
            WHERE Status = 'approved' AND RefundApproved = 1
        `);

        // Get average rating and total feedback
        const feedbackStatsResult = await pool.request().query(`
            SELECT 
                ROUND(AVG(CAST(Rating as FLOAT)), 1) as averageRating,
                COUNT(*) as totalFeedback
            FROM CoachFeedback 
            WHERE Status = 'active'
        `);

        // Get recent users (last 10)
        const recentUsersResult = await pool.request().query(`
            SELECT TOP 10 
                UserID, FirstName, LastName, Email, Role, Avatar, CreatedAt
            FROM Users 
            ORDER BY CreatedAt DESC
        `);

        // Get recent payments (last 10)
        const recentPaymentsResult = await pool.request().query(`
            SELECT TOP 10 
                p.PaymentID, p.Amount, p.Status, p.PaymentDate,
                u.FirstName, u.LastName,
                mp.Name as PlanName
            FROM Payments p
            JOIN Users u ON p.UserID = u.UserID
            JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
            ORDER BY p.PaymentDate DESC
        `);

        // Get top rated coaches
        const topRatedCoachesResult = await pool.request().query(`
            SELECT TOP 5
                c.UserID as CoachID,
                c.FirstName + ' ' + c.LastName as CoachName,
                c.Avatar,
                ROUND(AVG(CAST(cf.Rating as FLOAT)), 1) as AverageRating,
                COUNT(cf.FeedbackID) as TotalReviews
            FROM Users c
            LEFT JOIN CoachFeedback cf ON c.UserID = cf.CoachID AND cf.Status = 'active'
            WHERE c.Role = 'coach'
            GROUP BY c.UserID, c.FirstName, c.LastName, c.Avatar
            HAVING COUNT(cf.FeedbackID) > 0
            ORDER BY AverageRating DESC, TotalReviews DESC
        `);

        const totalRevenue = totalRevenueResult.recordset[0].totalRevenue || 0;
        const totalRefunds = totalRefundsResult.recordset[0].totalRefunds || 0;
        const netRevenue = totalRevenue - totalRefunds;

        const stats = {
            totalUsers: totalUsersResult.recordset[0].totalUsers,
            totalPlans: totalPlansResult.recordset[0].totalPlans,
            successfulQuitters: successfulQuittersResult.recordset[0].successfulQuitters,
            totalRevenue: totalRevenue,
            totalRefunds: totalRefunds,
            netRevenue: netRevenue,
            averageRating: feedbackStatsResult.recordset[0].averageRating || 0,
            totalFeedback: feedbackStatsResult.recordset[0].totalFeedback || 0
        };

        const recentData = {
            recentUsers: recentUsersResult.recordset,
            recentPayments: recentPaymentsResult.recordset,
            topRatedCoaches: topRatedCoachesResult.recordset
        };

        res.json({
            success: true,
            stats,
            recentData,
            message: 'Thống kê dashboard được tải thành công'
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thống kê dashboard',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get detailed user statistics
router.get('/user-stats', protect, authorize('admin'), async (req, res) => {
    try {
        const userStatsResult = await pool.request().query(`
            SELECT 
                Role,
                COUNT(*) as Count,
                COUNT(CASE WHEN IsActive = 1 THEN 1 END) as ActiveCount,
                COUNT(CASE WHEN EmailVerified = 1 THEN 1 END) as VerifiedCount
            FROM Users
            GROUP BY Role
        `);

        res.json({
            success: true,
            data: userStatsResult.recordset,
            message: 'Thống kê người dùng được tải thành công'
        });

    } catch (error) {
        console.error('User stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thống kê người dùng',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get refund statistics
router.get('/refund-stats', protect, authorize('admin'), async (req, res) => {
    try {
        const refundStatsResult = await pool.request().query(`
            SELECT 
                COUNT(*) as TotalRefundRequests,
                COUNT(CASE WHEN Status = 'approved' AND RefundApproved = 1 THEN 1 END) as ApprovedRefunds,
                COUNT(CASE WHEN Status = 'pending' THEN 1 END) as PendingRefunds,
                COUNT(CASE WHEN Status = 'rejected' THEN 1 END) as RejectedRefunds,
                ISNULL(SUM(CASE WHEN Status = 'approved' AND RefundApproved = 1 THEN RefundAmount ELSE 0 END), 0) as TotalRefunded,
                ISNULL(AVG(CASE WHEN Status = 'approved' AND RefundApproved = 1 THEN RefundAmount ELSE NULL END), 0) as AverageRefundAmount
            FROM CancellationRequests
        `);

        const monthlyRefundResult = await pool.request().query(`
            SELECT 
                YEAR(ProcessedAt) as Year,
                MONTH(ProcessedAt) as Month,
                COUNT(*) as RefundCount,
                SUM(RefundAmount) as TotalRefunded
            FROM CancellationRequests
            WHERE Status = 'approved' AND RefundApproved = 1 AND ProcessedAt IS NOT NULL
            GROUP BY YEAR(ProcessedAt), MONTH(ProcessedAt)
            ORDER BY Year DESC, Month DESC
        `);

        res.json({
            success: true,
            data: {
                refundStats: refundStatsResult.recordset[0],
                monthlyRefunds: monthlyRefundResult.recordset
            },
            message: 'Thống kê hoàn tiền được tải thành công'
        });

    } catch (error) {
        console.error('Refund stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thống kê hoàn tiền',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get payment statistics
router.get('/payment-stats', protect, authorize('admin'), async (req, res) => {
    try {
        const paymentStatsResult = await pool.request().query(`
            SELECT 
                p.Status,
                COUNT(*) as Count,
                SUM(CASE 
                    WHEN p.Status = 'confirmed' THEN p.Amount
                    WHEN p.Status = 'rejected' THEN p.Amount - ISNULL(cr.RefundAmount, 0)
                    ELSE p.Amount
                END) as TotalAmount,
                AVG(CASE 
                    WHEN p.Status = 'confirmed' THEN p.Amount
                    WHEN p.Status = 'rejected' THEN p.Amount - ISNULL(cr.RefundAmount, 0)
                    ELSE p.Amount
                END) as AverageAmount
            FROM Payments p
            LEFT JOIN CancellationRequests cr ON p.PaymentID = cr.PaymentID AND cr.Status = 'approved' AND cr.RefundApproved = 1
            GROUP BY p.Status
        `);

        const monthlyRevenueResult = await pool.request().query(`
            SELECT 
                YEAR(p.PaymentDate) as Year,
                MONTH(p.PaymentDate) as Month,
                SUM(CASE 
                    WHEN p.Status = 'confirmed' THEN p.Amount
                    WHEN p.Status = 'rejected' THEN p.Amount - ISNULL(cr.RefundAmount, 0)
                    ELSE 0
                END) as Revenue,
                COUNT(*) as TransactionCount
            FROM Payments p
            LEFT JOIN CancellationRequests cr ON p.PaymentID = cr.PaymentID AND cr.Status = 'approved' AND cr.RefundApproved = 1
            WHERE p.Status IN ('confirmed', 'rejected')
            GROUP BY YEAR(p.PaymentDate), MONTH(p.PaymentDate)
            ORDER BY Year DESC, Month DESC
        `);

        res.json({
            success: true,
            data: {
                paymentStats: paymentStatsResult.recordset,
                monthlyRevenue: monthlyRevenueResult.recordset
            },
            message: 'Thống kê thanh toán được tải thành công'
        });

    } catch (error) {
        console.error('Payment stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thống kê thanh toán',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==================== PLANS MANAGEMENT ====================

// Get all membership plans
router.get('/plans', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                PlanID,
                Name,
                Description,
                Price,
                Duration,
                Features,
                CreatedAt
            FROM MembershipPlans
            ORDER BY CreatedAt DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
            message: 'Danh sách plans được tải thành công'
        });

    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách plans',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Create new membership plan
router.post('/plans', protect, authorize('admin'), async (req, res) => {
    try {
        const { Name, Description, Price, Duration, Features } = req.body;

        // Validate input
        if (!Name || !Description || !Price || !Duration || !Features) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin plan'
            });
        }

        // Check if plan name already exists
        const existingPlan = await pool.request()
            .input('Name', Name)
            .query(`
                SELECT PlanID FROM MembershipPlans WHERE Name = @Name
            `);

        if (existingPlan.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Tên plan đã tồn tại'
            });
        }

        // Insert new plan
        const result = await pool.request()
            .input('Name', Name)
            .input('Description', Description)
            .input('Price', Price)
            .input('Duration', Duration)
            .input('Features', Features)
            .query(`
                INSERT INTO MembershipPlans (Name, Description, Price, Duration, Features)
                OUTPUT INSERTED.PlanID, INSERTED.Name, INSERTED.Description, INSERTED.Price, 
                       INSERTED.Duration, INSERTED.Features, INSERTED.CreatedAt
                VALUES (@Name, @Description, @Price, @Duration, @Features)
            `);

        res.status(201).json({
            success: true,
            data: result.recordset[0],
            message: 'Tạo plan thành công'
        });

    } catch (error) {
        console.error('Create plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo plan',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update membership plan
router.put('/plans/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { Name, Description, Price, Duration, Features } = req.body;

        // Validate input
        if (!Name || !Description || !Price || !Duration || !Features) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin plan'
            });
        }

        // Check if plan exists
        const existingPlan = await pool.request()
            .input('PlanID', id)
            .query(`
                SELECT PlanID FROM MembershipPlans WHERE PlanID = @PlanID
            `);

        if (existingPlan.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plan không tồn tại'
            });
        }

        // Check if new name conflicts with other plans
        const nameConflict = await pool.request()
            .input('Name', Name)
            .input('PlanID', id)
            .query(`
                SELECT PlanID FROM MembershipPlans 
                WHERE Name = @Name AND PlanID != @PlanID
            `);

        if (nameConflict.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Tên plan đã tồn tại'
            });
        }

        // Update plan
        const result = await pool.request()
            .input('PlanID', id)
            .input('Name', Name)
            .input('Description', Description)
            .input('Price', Price)
            .input('Duration', Duration)
            .input('Features', Features)
            .query(`
                UPDATE MembershipPlans 
                SET Name = @Name, 
                    Description = @Description, 
                    Price = @Price, 
                    Duration = @Duration, 
                    Features = @Features
                OUTPUT INSERTED.PlanID, INSERTED.Name, INSERTED.Description, INSERTED.Price, 
                       INSERTED.Duration, INSERTED.Features, INSERTED.CreatedAt
                WHERE PlanID = @PlanID
            `);

        res.json({
            success: true,
            data: result.recordset[0],
            message: 'Cập nhật plan thành công'
        });

    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật plan',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete membership plan
router.delete('/plans/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if plan exists
        const existingPlan = await pool.request()
            .input('PlanID', id)
            .query(`
                SELECT PlanID, Name FROM MembershipPlans WHERE PlanID = @PlanID
            `);

        if (existingPlan.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plan không tồn tại'
            });
        }

        const planName = existingPlan.recordset[0].Name;

        // Start transaction for safe deletion
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // 1. Delete PlanTemplates referencing this plan
            console.log(`Deleting PlanTemplates for plan ${id}...`);
            await transaction.request()
                .input('PlanID', id)
                .query(`DELETE FROM PlanTemplates WHERE PlanID = @PlanID`);

            // 2. Cancel active memberships
            const activeMemberships = await transaction.request()
                .input('PlanID', id)
                .query(`
                    SELECT COUNT(*) as count FROM UserMemberships 
                    WHERE PlanID = @PlanID AND Status = 'active'
                `);

            if (activeMemberships.recordset[0].count > 0) {
                await transaction.request()
                    .input('PlanID', id)
                    .query(`
                        UPDATE UserMemberships 
                        SET Status = 'cancelled' 
                        WHERE PlanID = @PlanID AND Status = 'active'
                    `);
                console.log(`Cancelled ${activeMemberships.recordset[0].count} active memberships`);
            }

            // 3. Reject pending payments
            const pendingPayments = await transaction.request()
                .input('PlanID', id)
                .query(`
                    SELECT COUNT(*) as count FROM Payments 
                    WHERE PlanID = @PlanID AND Status = 'pending'
                `);

            if (pendingPayments.recordset[0].count > 0) {
                await transaction.request()
                    .input('PlanID', id)
                    .query(`
                        UPDATE Payments 
                        SET Status = 'rejected', Note = 'Plan discontinued - Plan deleted by admin' 
                        WHERE PlanID = @PlanID AND Status = 'pending'
                    `);
                console.log(`Rejected ${pendingPayments.recordset[0].count} pending payments`);
            }

            // 4. Handle cancellation requests
            const cancellationRequests = await transaction.request()
                .input('PlanID', id)
                .query(`
                    SELECT COUNT(*) as count FROM CancellationRequests cr
                    INNER JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
                    WHERE um.PlanID = @PlanID AND cr.Status = 'pending'
                `);

            if (cancellationRequests.recordset[0].count > 0) {
                await transaction.request()
                    .input('PlanID', id)
                    .query(`
                        UPDATE CancellationRequests 
                        SET Status = 'approved', 
                            ProcessedAt = GETDATE(), 
                            AdminNotes = 'Auto-approved due to plan discontinuation'
                        WHERE CancellationRequestID IN (
                            SELECT cr.CancellationRequestID 
                            FROM CancellationRequests cr
                            INNER JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
                            WHERE um.PlanID = @PlanID AND cr.Status = 'pending'
                        )
                    `);
                console.log(`Approved ${cancellationRequests.recordset[0].count} cancellation requests`);
            }

            // 5. Update user roles for affected users who don't have other active memberships
            await transaction.request()
                .input('PlanID', id)
                .query(`
                    UPDATE Users 
                    SET Role = 'guest' 
                    WHERE UserID IN (
                        SELECT DISTINCT um.UserID 
                        FROM UserMemberships um
                        WHERE um.PlanID = @PlanID
                        AND NOT EXISTS (
                            SELECT 1 FROM UserMemberships um2 
                            WHERE um2.UserID = um.UserID 
                            AND um2.Status = 'active' 
                            AND um2.PlanID != @PlanID
                        )
                        AND Users.Role = 'member'
                    )
                `);

            // 6. Finally delete the plan
            const deleteResult = await transaction.request()
                .input('PlanID', id)
                .query(`DELETE FROM MembershipPlans WHERE PlanID = @PlanID`);

            // Commit transaction
            await transaction.commit();

            console.log(`Successfully deleted plan: ${planName} (ID: ${id})`);

            res.json({
                success: true,
                message: `Xóa plan "${planName}" thành công`,
                details: {
                    planName: planName,
                    planId: id,
                    rowsAffected: deleteResult.rowsAffected[0]
                }
            });

        } catch (transactionError) {
            await transaction.rollback();
            console.error('Transaction failed during plan deletion:', transactionError);
            throw transactionError;
        }

    } catch (error) {
        console.error('Delete plan error:', error);

        // Check if it's a foreign key constraint error
        if (error.number === 547) {
            res.status(400).json({
                success: false,
                message: 'Không thể xóa plan do có dữ liệu liên quan. Vui lòng liên hệ quản trị viên.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa plan',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
});

// ==================== COACH MANAGEMENT ====================

// Get all coaches with their profiles and stats
router.get('/coaches', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                u.UserID,
                u.Email,
                u.FirstName,
                u.LastName,
                u.Avatar,
                u.PhoneNumber,
                u.Address,
                u.IsActive,
                u.CreatedAt,
                cp.Bio,
                cp.Specialization,
                cp.Experience,
                cp.HourlyRate,
                cp.IsAvailable,
                cp.YearsOfExperience,
                cp.Education,
                cp.Certifications,
                cp.Languages,
                cp.WorkingHours,
                cp.SuccessRate,
                cp.TotalClients,
                (SELECT COUNT(*) FROM QuitPlans WHERE CoachID = u.UserID) as TotalPlans,
                (SELECT AVG(CAST(Rating as FLOAT)) FROM CoachFeedback WHERE CoachID = u.UserID AND Status = 'active') as AverageRating,
                (SELECT COUNT(*) FROM CoachFeedback WHERE CoachID = u.UserID AND Status = 'active') as TotalReviews
            FROM Users u
            LEFT JOIN CoachProfiles cp ON u.UserID = cp.UserID
            WHERE u.Role = 'coach'
            ORDER BY u.CreatedAt DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
            message: 'Danh sách coaches được tải thành công'
        });

    } catch (error) {
        console.error('Get coaches error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách coaches',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get detailed coach information
router.get('/coaches/:id/details', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.request()
            .input('UserID', id)
            .query(`
                SELECT 
                    u.UserID,
                    u.Email,
                    u.FirstName,
                    u.LastName,
                    u.Avatar,
                    u.PhoneNumber,
                    u.Address,
                    u.IsActive,
                    u.CreatedAt,
                    u.UpdatedAt,
                    u.LastLoginAt,
                    
                    -- Coach Profile Details
                    cp.Bio,
                    cp.Specialization,
                    cp.Experience,
                    cp.HourlyRate,
                    cp.IsAvailable,
                    cp.YearsOfExperience,
                    cp.Education,
                    cp.Certifications,
                    cp.Languages,
                    cp.WorkingHours,
                    cp.ConsultationTypes,
                    cp.SuccessRate,
                    cp.TotalClients,
                    cp.CreatedAt as ProfileCreatedAt,
                    cp.UpdatedAt as ProfileUpdatedAt,
                    
                    -- Statistics
                    (SELECT COUNT(*) FROM QuitPlans WHERE CoachID = u.UserID) as TotalPlans,
                    (SELECT COUNT(*) FROM QuitPlans WHERE CoachID = u.UserID AND Status = 'active') as ActivePlans,
                    (SELECT COUNT(*) FROM QuitPlans WHERE CoachID = u.UserID AND Status = 'completed') as CompletedPlans,
                    (SELECT COUNT(*) FROM ConsultationAppointments WHERE CoachID = u.UserID) as TotalAppointments,
                    (SELECT COUNT(*) FROM ConsultationAppointments WHERE CoachID = u.UserID AND Status = 'completed') as CompletedAppointments,
                    (SELECT AVG(CAST(Rating as FLOAT)) FROM CoachFeedback WHERE CoachID = u.UserID AND Status = 'active') as AverageRating,
                    (SELECT COUNT(*) FROM CoachFeedback WHERE CoachID = u.UserID AND Status = 'active') as TotalReviews
                    
                FROM Users u
                LEFT JOIN CoachProfiles cp ON u.UserID = cp.UserID
                WHERE u.UserID = @UserID AND u.Role = 'coach'
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Coach không tồn tại'
            });
        }

        // Get recent feedback for the coach
        const feedbackResult = await pool.request()
            .input('UserID', id)
            .query(`
                SELECT TOP 5
                    cf.Rating,
                    cf.Comment,
                    cf.Categories,
                    cf.CreatedAt,
                    cf.IsAnonymous,
                    m.FirstName as MemberFirstName,
                    m.LastName as MemberLastName,
                    m.Avatar as MemberAvatar
                FROM CoachFeedback cf
                INNER JOIN Users m ON cf.MemberID = m.UserID
                WHERE cf.CoachID = @UserID AND cf.Status = 'active'
                ORDER BY cf.CreatedAt DESC
            `);

        // Get assigned members (DISTINCT to avoid duplicates from multiple QuitPlans)
        const membersResult = await pool.request()
            .input('UserID', id)
            .query(`
                SELECT DISTINCT
                    m.UserID,
                    m.FirstName,
                    m.LastName,
                    m.Email,
                    m.Avatar,
                    qp_latest.Status as PlanStatus,
                    qp_latest.StartDate,
                    qp_latest.CreatedAt as AssignedAt
                FROM (
                    -- Get latest QuitPlan for each user assigned to this coach
                    SELECT qp.*,
                           ROW_NUMBER() OVER (PARTITION BY qp.UserID ORDER BY qp.CreatedAt DESC) as rn
                    FROM QuitPlans qp
                    WHERE qp.CoachID = @UserID
                        AND qp.Status = 'active'
                ) qp_latest
                INNER JOIN Users m ON qp_latest.UserID = m.UserID
                WHERE qp_latest.rn = 1
                ORDER BY qp_latest.CreatedAt DESC
            `);

        const coachData = result.recordset[0];

        res.json({
            success: true,
            data: {
                ...coachData,
                recentFeedback: feedbackResult.recordset,
                assignedMembers: membersResult.recordset
            },
            message: 'Thông tin chi tiết coach được tải thành công'
        });

    } catch (error) {
        console.error('Get coach details error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thông tin chi tiết coach',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all assignable members
router.get('/members', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                u.UserID,
                u.Email,
                u.FirstName,
                u.LastName,
                u.Avatar,
                u.PhoneNumber,
                u.IsActive,
                u.CreatedAt,
                -- Get current active coach assignment
                (SELECT TOP 1 qp.CoachID 
                 FROM QuitPlans qp 
                 WHERE qp.UserID = u.UserID 
                   AND qp.Status = 'active' 
                   AND qp.CoachID IS NOT NULL
                 ORDER BY qp.CreatedAt DESC) as CoachID,
                -- Get coach name
                (SELECT TOP 1 coach.FirstName + ' ' + coach.LastName 
                 FROM QuitPlans qp 
                 INNER JOIN Users coach ON qp.CoachID = coach.UserID
                 WHERE qp.UserID = u.UserID 
                   AND qp.Status = 'active' 
                   AND qp.CoachID IS NOT NULL
                 ORDER BY qp.CreatedAt DESC) as CoachName
            FROM Users u
            WHERE u.Role = 'member' AND u.IsActive = 1
            ORDER BY u.CreatedAt DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
            message: 'Danh sách members được tải thành công'
        });

    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách members',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Assign member to coach
router.post('/assign-coach', protect, authorize('admin'), async (req, res) => {
    try {
        const { memberID, coachID, reason } = req.body;

        console.log('🎯 Assign coach request:', { memberID, coachID, reason });

        // Validate input
        if (!memberID || !coachID) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn member và coach'
            });
        }

        // Check if member exists and is active
        const memberCheck = await pool.request()
            .input('UserID', memberID)
            .query(`
                SELECT UserID, FirstName, LastName, Email FROM Users 
                WHERE UserID = @UserID AND Role = 'member' AND IsActive = 1
            `);

        if (memberCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Member không tồn tại hoặc không hoạt động'
            });
        }

        // Check if coach exists and is active
        const coachCheck = await pool.request()
            .input('UserID', coachID)
            .query(`
                SELECT UserID, FirstName, LastName, Email FROM Users 
                WHERE UserID = @UserID AND Role = 'coach' AND IsActive = 1
            `);

        if (coachCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Coach không tồn tại hoặc không hoạt động'
            });
        }

        const member = memberCheck.recordset[0];
        const coach = coachCheck.recordset[0];

        console.log('✅ Member found:', member);
        console.log('✅ Coach found:', coach);

        // Begin transaction to ensure data consistency
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // First, deactivate any existing active quit plans for this member
            const deactivateResult = await transaction.request()
                .input('UserID', memberID)
                .query(`
                    UPDATE QuitPlans 
                    SET Status = 'cancelled'
                    OUTPUT DELETED.PlanID, DELETED.CoachID
                    WHERE UserID = @UserID AND Status = 'active'
                `);

            console.log('🔄 Deactivated old plans:', deactivateResult.recordset);

            // Create new quit plan with coach assignment
            const createPlanResult = await transaction.request()
                .input('UserID', memberID)
                .input('CoachID', coachID)
                .input('StartDate', new Date())
                .input('TargetDate', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) // 90 days later
                .input('Reason', reason || 'Phân công bởi admin')
                .input('DetailedPlan', 'Kế hoạch cai thuốc được tạo bởi admin')
                .query(`
                    INSERT INTO QuitPlans (UserID, CoachID, StartDate, TargetDate, Reason, DetailedPlan, Status, MotivationLevel)
                    OUTPUT INSERTED.PlanID, INSERTED.UserID, INSERTED.CoachID, INSERTED.Status
                    VALUES (@UserID, @CoachID, @StartDate, @TargetDate, @Reason, @DetailedPlan, 'active', 7)
                `);

            const newPlan = createPlanResult.recordset[0];
            console.log('✅ Created new quit plan:', newPlan);

            // Verify the plan was created correctly
            const verifyPlan = await transaction.request()
                .input('PlanID', newPlan.PlanID)
                .query(`
                    SELECT qp.*, u.FirstName + ' ' + u.LastName as MemberName, 
                           c.FirstName + ' ' + c.LastName as CoachName
                    FROM QuitPlans qp
                    INNER JOIN Users u ON qp.UserID = u.UserID
                    INNER JOIN Users c ON qp.CoachID = c.UserID
                    WHERE qp.PlanID = @PlanID
                `);

            console.log('✅ Plan verification:', verifyPlan.recordset[0]);

            // Create or update conversation between coach and member
            const conversationCheck = await transaction.request()
                .input('CoachID', coachID)
                .input('MemberID', memberID)
                .query(`
                    SELECT ConversationID FROM Conversations 
                    WHERE CoachID = @CoachID AND MemberID = @MemberID
                `);

            if (conversationCheck.recordset.length === 0) {
                const conversationResult = await transaction.request()
                    .input('CoachID', coachID)
                    .input('MemberID', memberID)
                    .query(`
                        INSERT INTO Conversations (CoachID, MemberID, LastMessageAt, IsActive)
                        OUTPUT INSERTED.ConversationID
                        VALUES (@CoachID, @MemberID, GETDATE(), 1)
                    `);
                console.log('✅ Created new conversation:', conversationResult.recordset[0]);
            } else {
                // Reactivate existing conversation
                await transaction.request()
                    .input('CoachID', coachID)
                    .input('MemberID', memberID)
                    .query(`
                        UPDATE Conversations 
                        SET IsActive = 1, LastMessageAt = GETDATE()
                        WHERE CoachID = @CoachID AND MemberID = @MemberID
                    `);
                console.log('✅ Reactivated existing conversation');
            }

            // Commit transaction
            await transaction.commit();
            console.log('✅ Transaction committed successfully');

            // Final verification - test assigned coach query
            const finalCheck = await pool.request()
                .input('UserID', memberID)
                .query(`
                    SELECT 
                        c.UserID as CoachID,
                        c.Email as CoachEmail,
                        c.FirstName as CoachFirstName,
                        c.LastName as CoachLastName,
                        qp.PlanID as QuitPlanID,
                        qp.Status as QuitPlanStatus
                    FROM QuitPlans qp
                    INNER JOIN Users c ON qp.CoachID = c.UserID
                    WHERE qp.UserID = @UserID 
                        AND qp.Status = 'active'
                        AND qp.CoachID IS NOT NULL
                        AND c.Role = 'coach'
                        AND c.IsActive = 1
                `);

            console.log('🔍 Final assignment verification:', finalCheck.recordset);

            res.json({
                success: true,
                data: {
                    planID: newPlan.PlanID,
                    memberID: memberID,
                    coachID: coachID,
                    memberName: `${member.FirstName} ${member.LastName}`,
                    coachName: `${coach.FirstName} ${coach.LastName}`,
                    assignmentVerified: finalCheck.recordset.length > 0
                },
                message: `Đã phân công ${member.FirstName} ${member.LastName} cho coach ${coach.FirstName} ${coach.LastName}`
            });

        } catch (transactionError) {
            await transaction.rollback();
            console.error('❌ Transaction failed:', transactionError);
            throw transactionError;
        }

    } catch (error) {
        console.error('❌ Assign coach error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi phân công coach',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Remove coach assignment
router.delete('/assign-coach/:memberID', protect, authorize('admin'), async (req, res) => {
    try {
        const { memberID } = req.params;

        // Check if member has an active quit plan
        const existingPlan = await pool.request()
            .input('UserID', memberID)
            .query(`
                SELECT PlanID, CoachID FROM QuitPlans 
                WHERE UserID = @UserID AND Status = 'active' AND CoachID IS NOT NULL
            `);

        if (existingPlan.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Member không có coach được phân công'
            });
        }

        // Update quit plan status to cancelled
        await pool.request()
            .input('PlanID', existingPlan.recordset[0].PlanID)
            .query(`
                UPDATE QuitPlans 
                SET Status = 'cancelled', CoachID = NULL
                WHERE PlanID = @PlanID
            `);

        res.json({
            success: true,
            message: 'Đã hủy phân công coach thành công'
        });

    } catch (error) {
        console.error('Remove coach assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi hủy phân công coach',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Toggle coach active status
router.patch('/coaches/:id/toggle-status', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if coach exists
        const coachCheck = await pool.request()
            .input('UserID', id)
            .query(`
                SELECT UserID, IsActive, FirstName, LastName FROM Users 
                WHERE UserID = @UserID AND Role = 'coach'
            `);

        if (coachCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Coach không tồn tại'
            });
        }

        const coach = coachCheck.recordset[0];
        const newStatus = !coach.IsActive;

        // Update coach status
        await pool.request()
            .input('UserID', id)
            .input('IsActive', newStatus)
            .query(`
                UPDATE Users 
                SET IsActive = @IsActive 
                WHERE UserID = @UserID
            `);

        res.json({
            success: true,
            data: {
                coachID: id,
                isActive: newStatus,
                coachName: `${coach.FirstName} ${coach.LastName}`
            },
            message: `Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} coach thành công`
        });

    } catch (error) {
        console.error('Toggle coach status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thay đổi trạng thái coach',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==================== BLOG MANAGEMENT ====================

// Get all blog posts for admin
router.get('/blog-posts', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                p.*,
                u.FirstName as AuthorFirstName,
                u.LastName as AuthorLastName,
                (SELECT COUNT(*) FROM Comments c WHERE c.PostID = p.PostID AND c.Status = 'approved') as CommentCount
            FROM BlogPosts p
            JOIN Users u ON p.AuthorID = u.UserID
            ORDER BY p.CreatedAt DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
            message: 'Danh sách blog posts được tải thành công'
        });

    } catch (error) {
        console.error('Get blog posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách blog posts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update blog post status (approve/reject)
router.patch('/blog-posts/:postId/status', protect, authorize('admin'), async (req, res) => {
    try {
        const { postId } = req.params;
        const { status } = req.body;

        if (!['published', 'Pending', 'draft', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        // Get the blog post info first to know the author
        const postInfo = await pool.request()
            .input('PostID', postId)
            .query(`
                SELECT p.AuthorID, p.Title, u.FirstName, u.LastName 
                FROM BlogPosts p
                JOIN Users u ON p.AuthorID = u.UserID
                WHERE p.PostID = @PostID
            `);

        if (postInfo.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        const post = postInfo.recordset[0];

        const result = await pool.request()
            .input('PostID', postId)
            .input('Status', status)
            .query(`
                UPDATE BlogPosts
                SET Status = @Status,
                    PublishedAt = CASE WHEN @Status = 'published' THEN GETDATE() ELSE PublishedAt END
                OUTPUT INSERTED.*
                WHERE PostID = @PostID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        // Create notification for the author (if not admin themselves)
        if (post.AuthorID !== req.user.id) {
            let notificationMessage = '';
            let notificationType = '';

            if (status === 'published') {
                notificationMessage = `Bài viết "${post.Title}" của bạn đã được phê duyệt và xuất bản thành công!`;
                notificationType = 'blog_approved';
            } else if (status === 'rejected') {
                notificationMessage = `Bài viết "${post.Title}" của bạn đã bị từ chối. Vui lòng chỉnh sửa và gửi lại.`;
                notificationType = 'blog_rejected';
            }

            if (notificationMessage) {
                try {
                    // Try to create notification - create table if it doesn't exist
                    await pool.request()
                        .input('UserID', post.AuthorID)
                        .input('Type', notificationType)
                        .input('Title', status === 'published' ? 'Bài viết đã được phê duyệt' : 'Bài viết bị từ chối')
                        .input('Message', notificationMessage)
                        .input('RelatedID', postId)
                        .query(`
                            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Notifications' AND xtype='U')
                            BEGIN
                                CREATE TABLE Notifications (
                                    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
                                    UserID INT NOT NULL,
                                    Type NVARCHAR(50) NOT NULL,
                                    Title NVARCHAR(255) NOT NULL,
                                    Message NVARCHAR(MAX) NOT NULL,
                                    RelatedID INT NULL,
                                    IsRead BIT DEFAULT 0,
                                    CreatedAt DATETIME DEFAULT GETDATE(),
                                    FOREIGN KEY (UserID) REFERENCES Users(UserID)
                                )
                            END
                            
                            INSERT INTO Notifications (UserID, Type, Title, Message, RelatedID, IsRead, CreatedAt)
                            VALUES (@UserID, @Type, @Title, @Message, @RelatedID, 0, GETDATE())
                        `);
                } catch (notificationError) {
                    console.error('Error creating notification:', notificationError);
                    // Don't fail the main operation if notification fails
                }
            }
        }

        res.json({
            success: true,
            data: result.recordset[0],
            message: `Bài viết đã được ${status === 'published' ? 'phê duyệt' : status === 'rejected' ? 'từ chối' : 'cập nhật trạng thái'}`
        });

    } catch (error) {
        console.error('Update blog post status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái bài viết',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Admin create blog post
router.post('/blog-posts', protect, authorize('admin'), async (req, res) => {
    try {
        const { title, content, metaDescription, thumbnailURL, status = 'published' } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu đề và nội dung là bắt buộc'
            });
        }

        const result = await pool.request()
            .input('Title', title)
            .input('Content', content)
            .input('MetaDescription', metaDescription || '')
            .input('ThumbnailURL', thumbnailURL || '')
            .input('AuthorID', req.user.id)
            .input('Status', status)
            .query(`
                INSERT INTO BlogPosts (Title, Content, MetaDescription, ThumbnailURL, AuthorID, Status, PublishedAt)
                OUTPUT INSERTED.*
                VALUES (@Title, @Content, @MetaDescription, @ThumbnailURL, @AuthorID, @Status, 
                        CASE WHEN @Status = 'published' THEN GETDATE() ELSE NULL END)
            `);

        res.status(201).json({
            success: true,
            data: result.recordset[0],
            message: 'Bài viết được tạo thành công'
        });

    } catch (error) {
        console.error('Create blog post error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo bài viết',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Admin update blog post
router.put('/blog-posts/:postId', protect, authorize('admin'), async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content, metaDescription, thumbnailURL, status } = req.body;

        const result = await pool.request()
            .input('PostID', postId)
            .input('Title', title)
            .input('Content', content)
            .input('MetaDescription', metaDescription || '')
            .input('ThumbnailURL', thumbnailURL || '')
            .input('Status', status)
            .query(`
                UPDATE BlogPosts
                SET Title = @Title,
                    Content = @Content,
                    MetaDescription = @MetaDescription,
                    ThumbnailURL = @ThumbnailURL,
                    Status = @Status,
                    PublishedAt = CASE WHEN @Status = 'published' AND PublishedAt IS NULL THEN GETDATE() ELSE PublishedAt END
                OUTPUT INSERTED.*
                WHERE PostID = @PostID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
            message: 'Bài viết được cập nhật thành công'
        });

    } catch (error) {
        console.error('Update blog post error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật bài viết',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Admin delete blog post
router.delete('/blog-posts/:postId', protect, authorize('admin'), async (req, res) => {
    try {
        const { postId } = req.params;

        // First delete related comments
        await pool.request()
            .input('PostID', postId)
            .query('DELETE FROM Comments WHERE PostID = @PostID');

        // Then delete the blog post
        const result = await pool.request()
            .input('PostID', postId)
            .query('DELETE FROM BlogPosts WHERE PostID = @PostID');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        res.json({
            success: true,
            message: 'Bài viết đã được xóa thành công'
        });

    } catch (error) {
        console.error('Delete blog post error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa bài viết',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get blog comments for moderation
router.get('/blog-comments', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                c.*,
                u.FirstName,
                u.LastName,
                u.Email,
                p.Title as PostTitle
            FROM Comments c
            JOIN Users u ON c.UserID = u.UserID
            JOIN BlogPosts p ON c.PostID = p.PostID
            ORDER BY c.CreatedAt DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
            message: 'Danh sách comments được tải thành công'
        });

    } catch (error) {
        console.error('Get blog comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách comments',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Moderate comment
router.patch('/blog-comments/:commentId/status', protect, authorize('admin'), async (req, res) => {
    try {
        const { commentId } = req.params;
        const { status } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái comment không hợp lệ'
            });
        }

        const result = await pool.request()
            .input('CommentID', commentId)
            .input('Status', status)
            .query(`
                UPDATE Comments
                SET Status = @Status
                OUTPUT INSERTED.*
                WHERE CommentID = @CommentID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy comment'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
            message: `Comment đã được ${status === 'approved' ? 'phê duyệt' : status === 'rejected' ? 'từ chối' : 'cập nhật trạng thái'}`
        });

    } catch (error) {
        console.error('Moderate comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm duyệt comment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all community posts for moderation
router.get('/community-posts', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                p.*,
                u.FirstName,
                u.LastName,
                u.Email,
                a.Name as AchievementName,
                a.Description as AchievementDescription,
                (SELECT COUNT(*) FROM CommunityComments c WHERE c.PostID = p.PostID) as CommentCount,
                (SELECT COUNT(*) FROM PostLikes pl WHERE pl.PostID = p.PostID) as LikesCount
            FROM CommunityPosts p
            JOIN Users u ON p.UserID = u.UserID
            LEFT JOIN Achievements a ON p.AchievementID = a.AchievementID
            ORDER BY p.CreatedAt DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
            message: 'Danh sách bài viết community được tải thành công'
        });

    } catch (error) {
        console.error('Get community posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách bài viết community',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all community comments for moderation
router.get('/community-comments', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                c.*,
                u.FirstName,
                u.LastName,
                u.Email,
                p.Title as PostTitle
            FROM CommunityComments c
            JOIN Users u ON c.UserID = u.UserID
            JOIN CommunityPosts p ON c.PostID = p.PostID
            ORDER BY c.CreatedAt DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
            message: 'Danh sách comments community được tải thành công'
        });

    } catch (error) {
        console.error('Get community comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách comments community',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete community post (admin)
router.delete('/community-posts/:postId', protect, authorize('admin'), async (req, res) => {
    try {
        const { postId } = req.params;

        // First delete related comments and likes
        await pool.request()
            .input('PostID', postId)
            .query(`
                DELETE FROM CommunityComments WHERE PostID = @PostID;
                DELETE FROM PostLikes WHERE PostID = @PostID;
            `);

        // Then delete the community post
        const result = await pool.request()
            .input('PostID', postId)
            .query(`
                DELETE FROM CommunityPosts 
                OUTPUT DELETED.*
                WHERE PostID = @PostID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
            message: 'Bài viết community đã được xóa thành công'
        });

    } catch (error) {
        console.error('Delete community post error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa bài viết community',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete community comment (admin)
router.delete('/community-comments/:commentId', protect, authorize('admin'), async (req, res) => {
    try {
        const { commentId } = req.params;

        const result = await pool.request()
            .input('CommentID', commentId)
            .query(`
                DELETE FROM CommunityComments 
                OUTPUT DELETED.*
                WHERE CommentID = @CommentID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy comment'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
            message: 'Comment community đã được xóa thành công'
        });

    } catch (error) {
        console.error('Delete community comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa comment community',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get pending payments for admin approval
router.get('/pending-payments', protect, authorize('admin'), async (req, res) => {
    try {
        console.log('🔍 Admin pending-payments endpoint called');

        // Get ONLY pending payments (not cancellation requests)
        const paymentsResult = await pool.request().query(`
            SELECT DISTINCT
                p.PaymentID,
                p.UserID,
                p.PlanID,
                p.Amount,
                p.PaymentMethod,
                p.Status,
                p.TransactionID,
                p.PaymentDate,
                u.FirstName,
                u.LastName,
                u.Email,
                u.PhoneNumber,
                mp.Name as PlanName,
                mp.Description as PlanDescription,
                mp.Duration,
                um.StartDate,
                um.EndDate,
                um.Status as MembershipStatus,
                'payment' as RequestType,
                'pending_payment' as ActionType
            FROM Payments p
            JOIN Users u ON p.UserID = u.UserID
            JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
            LEFT JOIN (
                SELECT um1.*, 
                       ROW_NUMBER() OVER (PARTITION BY um1.UserID, um1.PlanID ORDER BY um1.CreatedAt DESC) as rn
                FROM UserMemberships um1
            ) um ON p.UserID = um.UserID AND p.PlanID = um.PlanID AND um.rn = 1
            WHERE p.Status = 'pending'
        `);

        // Sort by date (most recent first)
        const results = paymentsResult.recordset.sort((a, b) => new Date(b.PaymentDate) - new Date(a.PaymentDate));

        console.log(`📊 Found ${results.length} pending payments (cancellations excluded)`);

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('❌ Error getting pending payments:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách thanh toán chờ xác nhận'
        });
    }
});

// Confirm payment by admin
router.post('/confirm-payment/:paymentId', protect, authorize('admin'), async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { notes } = req.body;

        // Start transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Check if payment exists and is pending
            const paymentResult = await transaction.request()
                .input('PaymentID', paymentId)
                .query(`
                    SELECT p.*, mp.Duration, mp.Name as PlanName
                    FROM Payments p
                    JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
                    WHERE p.PaymentID = @PaymentID AND p.Status = 'pending'
                `);

            if (paymentResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thanh toán hoặc thanh toán đã được xử lý'
                });
            }

            const payment = paymentResult.recordset[0];

            // Update payment status to confirmed
            await transaction.request()
                .input('PaymentID', paymentId)
                .query(`
                    UPDATE Payments
                    SET Status = 'confirmed'
                    WHERE PaymentID = @PaymentID
                `);

            // Create payment confirmation record
            const confirmationResult = await transaction.request()
                .input('PaymentID', paymentId)
                .input('ConfirmedByUserID', req.user.id)
                .input('ConfirmationCode', `ADMIN-${Date.now()}`)
                .input('Notes', notes || 'Thanh toán được xác nhận bởi admin')
                .query(`
                    INSERT INTO PaymentConfirmations (PaymentID, ConfirmedByUserID, ConfirmationCode, Notes)
                    OUTPUT INSERTED.*
                    VALUES (@PaymentID, @ConfirmedByUserID, @ConfirmationCode, @Notes)
                `);

            // Calculate membership dates
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + payment.Duration);

            // Set any existing active or cancelled memberships to expired for this user
            await transaction.request()
                .input('UserID', payment.UserID)
                .query(`
                    UPDATE UserMemberships
                    SET Status = 'expired'
                    WHERE UserID = @UserID AND Status IN ('active', 'cancelled')
                `);

            // Check if there's a pending membership to update
            const existingMembershipResult = await transaction.request()
                .input('UserID', payment.UserID)
                .input('PlanID', payment.PlanID)
                .query(`
                    SELECT MembershipID FROM UserMemberships
                    WHERE UserID = @UserID AND PlanID = @PlanID AND Status = 'pending'
                `);

            if (existingMembershipResult.recordset.length > 0) {
                // Update existing pending membership to active
                await transaction.request()
                    .input('UserID', payment.UserID)
                    .input('PlanID', payment.PlanID)
                    .input('StartDate', startDate)
                    .input('EndDate', endDate)
                    .query(`
                        UPDATE UserMemberships
                        SET Status = 'active',
                            StartDate = @StartDate,
                            EndDate = @EndDate
                        WHERE UserID = @UserID AND PlanID = @PlanID AND Status = 'pending'
                    `);
            } else {
                // Create new active membership if no pending membership exists
                await transaction.request()
                    .input('UserID', payment.UserID)
                    .input('PlanID', payment.PlanID)
                    .input('StartDate', startDate)
                    .input('EndDate', endDate)
                    .query(`
                        INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status, CreatedAt)
                        VALUES (@UserID, @PlanID, @StartDate, @EndDate, 'active', GETDATE())
                    `);
            }

            // Update user role to member if they're currently a guest
            await transaction.request()
                .input('UserID', payment.UserID)
                .query(`
                    UPDATE Users
                    SET Role = 'member'
                    WHERE UserID = @UserID AND Role = 'guest'
                `);

            // Create notification for user
            await transaction.request()
                .input('UserID', payment.UserID)
                .input('Title', 'Thanh toán đã được xác nhận')
                .input('Message', `Thanh toán cho gói ${payment.PlanName} đã được admin xác nhận. Chào mừng bạn đến với dịch vụ của chúng tôi!`)
                .input('Type', 'payment')
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type)
                    VALUES (@UserID, @Title, @Message, @Type)
                `);

            // Auto-create QuitPlan when membership is confirmed
            const targetDate = new Date(startDate);
            targetDate.setDate(targetDate.getDate() + 90); // 90 days plan by default

            await transaction.request()
                .input('UserID', payment.UserID)
                .input('StartDate', startDate)
                .input('TargetDate', targetDate)
                .input('Reason', `Kế hoạch cai thuốc cho gói ${payment.PlanName}`)
                .input('DetailedPlan', 'Kế hoạch cai thuốc được tạo tự động khi kích hoạt membership. Hãy cập nhật tiến trình hàng ngày để theo dõi quá trình cai thuốc.')
                .query(`
                    INSERT INTO QuitPlans (UserID, StartDate, TargetDate, Reason, DetailedPlan, Status, MotivationLevel)
                    VALUES (@UserID, @StartDate, @TargetDate, @Reason, @DetailedPlan, 'active', 7)
                `);

            await transaction.commit();

            res.json({
                success: true,
                message: 'Xác nhận thanh toán thành công',
                data: {
                    payment: payment,
                    confirmation: confirmationResult.recordset[0]
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xác nhận thanh toán'
        });
    }
});

// Reject payment by admin
router.post('/reject-payment/:paymentId', protect, authorize('admin'), async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { notes } = req.body;

        // Start transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Check if payment exists and is pending
            const paymentResult = await transaction.request()
                .input('PaymentID', paymentId)
                .query(`
                    SELECT p.*, mp.Name as PlanName
                    FROM Payments p
                    JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
                    WHERE p.PaymentID = @PaymentID AND p.Status = 'pending'
                `);

            if (paymentResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thanh toán hoặc thanh toán đã được xử lý'
                });
            }

            const payment = paymentResult.recordset[0];

            // Update payment status to rejected
            await transaction.request()
                .input('PaymentID', paymentId)
                .query(`
                    UPDATE Payments
                    SET Status = 'rejected'
                    WHERE PaymentID = @PaymentID
                `);

            // Remove or update pending membership
            await transaction.request()
                .input('UserID', payment.UserID)
                .query(`
                    UPDATE UserMemberships
                    SET Status = 'cancelled'
                    WHERE UserID = @UserID AND Status = 'pending'
                `);

            // Create notification for user
            await transaction.request()
                .input('UserID', payment.UserID)
                .input('Title', 'Thanh toán bị từ chối')
                .input('Message', `Thanh toán cho gói ${payment.PlanName} đã bị từ chối. Lý do: ${notes || 'Không có lý do cụ thể'}. Vui lòng liên hệ admin để biết thêm chi tiết.`)
                .input('Type', 'payment')
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type)
                    VALUES (@UserID, @Title, @Message, @Type)
                `);

            await transaction.commit();

            res.json({
                success: true,
                message: 'Đã từ chối thanh toán',
                data: payment
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error rejecting payment:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi từ chối thanh toán'
        });
    }
});

// Get payment confirmations history
router.get('/payment-confirmations', protect, authorize('admin'), async (req, res) => {
    try {
        console.log('🔍 Admin fetching payment confirmations...');

        // Get regular payment confirmations
        const confirmedPayments = await pool.request().query(`
            SELECT 
                pc.*,
                p.Amount,
                p.PaymentMethod,
                p.TransactionID,
                p.PaymentDate,
                p.Status as PaymentStatus,
                u1.FirstName + ' ' + u1.LastName as CustomerName,
                u1.Email as CustomerEmail,
                u2.FirstName + ' ' + u2.LastName as AdminName,
                mp.Name as PlanName,
                COALESCE(um.Status, 'confirmed') as MembershipStatus,
                um.StartDate as MembershipStartDate,
                um.EndDate as MembershipEndDate
            FROM PaymentConfirmations pc
            JOIN Payments p ON pc.PaymentID = p.PaymentID
            JOIN Users u1 ON p.UserID = u1.UserID
            JOIN Users u2 ON pc.ConfirmedByUserID = u2.UserID
            JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
            LEFT JOIN UserMemberships um ON p.UserID = um.UserID AND p.PlanID = um.PlanID
        `);

        // Get cancelled memberships (treated as confirmations for history)
        const cancelledMemberships = await pool.request().query(`
            SELECT 
                NULL as ConfirmationID,
                NULL as ConfirmationCode,
                cr.ProcessedAt as ConfirmationDate,
                NULL as ConfirmedByUserID,
                NULL as Notes,
                COALESCE(p.PaymentID, cr.CancellationRequestID) as PaymentID,
                COALESCE(p.Amount, mp.Price, 0) as Amount,
                COALESCE(p.PaymentMethod, 'Unknown') as PaymentMethod,
                COALESCE(p.TransactionID, 'CANCELLED') as TransactionID,
                COALESCE(p.PaymentDate, cr.RequestedAt) as PaymentDate,
                'cancelled' as PaymentStatus,
                u1.FirstName + ' ' + u1.LastName as CustomerName,
                u1.Email as CustomerEmail,
                COALESCE(u2.FirstName + ' ' + u2.LastName, 'System') as AdminName,
                mp.Name as PlanName,
                'cancelled' as MembershipStatus,
                um.StartDate as MembershipStartDate,
                um.EndDate as MembershipEndDate
            FROM CancellationRequests cr
            INNER JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
            INNER JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            INNER JOIN Users u1 ON cr.UserID = u1.UserID
            LEFT JOIN Users u2 ON cr.ProcessedByUserID = u2.UserID
            LEFT JOIN Payments p ON cr.PaymentID = p.PaymentID
            WHERE cr.Status = 'approved'
        `);

        // Combine and sort by date
        const allRecords = [
            ...confirmedPayments.recordset,
            ...cancelledMemberships.recordset
        ].sort((a, b) => new Date(b.ConfirmationDate) - new Date(a.ConfirmationDate));

        console.log('📊 Payment history result:', {
            confirmedPayments: confirmedPayments.recordset.length,
            cancelledMemberships: cancelledMemberships.recordset.length,
            totalRecords: allRecords.length
        });

        if (allRecords.length > 0) {
            console.log('📋 Sample payment record:', allRecords[0]);
        }

        res.json({
            success: true,
            data: allRecords
        });
    } catch (error) {
        console.error('❌ Error getting payment confirmations:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử xác nhận thanh toán'
        });
    }
});

// Get pending cancellation requests for admin approval
router.get('/pending-cancellations', protect, authorize('admin'), async (req, res) => {
    try {
        console.log('🔍 Admin pending-cancellations endpoint called');

        // Get pending cancellation requests ONLY
        const cancellationsResult = await pool.request().query(`
            SELECT 
                cr.CancellationRequestID as RequestID,
                cr.UserID,
                um.PlanID,
                cr.RequestedRefundAmount,
                cr.Status,
                cr.RequestedAt,
                cr.CancellationReason,
                cr.BankAccountNumber,
                cr.BankName,
                cr.AccountHolderName,
                u.FirstName,
                u.LastName,
                u.Email,
                u.PhoneNumber,
                mp.Name as PlanName,
                mp.Description as PlanDescription,
                mp.Price as PlanPrice,
                mp.Duration,
                um.StartDate as MembershipStartDate,
                um.EndDate as MembershipEndDate,
                um.Status as MembershipStatus,
                'cancellation' as RequestType
            FROM CancellationRequests cr
            JOIN Users u ON cr.UserID = u.UserID
            JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
            JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            WHERE cr.Status = 'pending'
            ORDER BY cr.RequestedAt DESC
        `);

        console.log(`📊 Found ${cancellationsResult.recordset.length} pending cancellation requests`);

        res.json({
            success: true,
            data: cancellationsResult.recordset
        });
    } catch (error) {
        console.error('❌ Error getting pending cancellations:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách yêu cầu hủy gói chờ xác nhận'
        });
    }
});

// Approve cancellation request
router.post('/approve-cancellation/:cancellationId', protect, authorize('admin'), async (req, res) => {
    try {
        const { cancellationId } = req.params;
        const { approveRefund, refundAmount, adminNotes } = req.body;

        console.log('🔍 Approving cancellation:', {
            cancellationId,
            approveRefund,
            refundAmount,
            adminNotes,
            adminId: req.user.id
        });

        // Start transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Check if cancellation request exists and is pending
            const cancellationResult = await transaction.request()
                .input('CancellationRequestID', cancellationId)
                .query(`
                    SELECT cr.*, um.*, mp.Name as PlanName, u.FirstName, u.LastName, u.Email,
                           p.PaymentID, pc.ConfirmationID
                    FROM CancellationRequests cr
                    JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
                    JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                    JOIN Users u ON cr.UserID = u.UserID
                    LEFT JOIN Payments p ON cr.PaymentID = p.PaymentID
                    LEFT JOIN PaymentConfirmations pc ON p.PaymentID = pc.PaymentID
                    WHERE cr.CancellationRequestID = @CancellationRequestID AND cr.Status = 'pending'
                `);

            if (cancellationResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy yêu cầu hủy gói hoặc yêu cầu đã được xử lý'
                });
            }

            const cancellation = cancellationResult.recordset[0];

            // 1. Update cancellation request status 
            await transaction.request()
                .input('CancellationRequestID', cancellationId)
                .input('AdminNotes', adminNotes || 'Yêu cầu hủy gói được chấp nhận')
                .input('RefundApproved', approveRefund ? 1 : 0)
                .input('RefundAmount', approveRefund ? refundAmount : 0)
                .query(`
                    UPDATE CancellationRequests
                    SET Status = 'approved',
                        ProcessedAt = GETDATE(),
                        AdminNotes = @AdminNotes,
                        RefundApproved = @RefundApproved,
                        RefundAmount = @RefundAmount
                    WHERE CancellationRequestID = @CancellationRequestID
                `);

            // 2. XÓA HOÀN TOÀN - Delete PaymentConfirmation first (foreign key constraint)
            // if (cancellation.ConfirmationID) {
            //     await transaction.request()
            //         .input('ConfirmationID', cancellation.ConfirmationID)
            //         .query(`DELETE FROM PaymentConfirmations WHERE ConfirmationID = @ConfirmationID`);
            // }

            // 3. Delete Payment record
            // if (cancellation.PaymentID) {
            //     await transaction.request()
            //         .input('PaymentID', cancellation.PaymentID)
            //         .query(`DELETE FROM Payments WHERE PaymentID = @PaymentID`);
            // }

            // 4. Delete UserMembership
            // await transaction.request()
            //     .input('MembershipID', cancellation.MembershipID)
            //     .query(`DELETE FROM UserMemberships WHERE MembershipID = @MembershipID`);

            // 2. GIỮ NGUYÊN Payment status là 'confirmed' vì đã thanh toán thành công
            // Chỉ cập nhật UserMembership và theo dõi hoàn tiền qua CancellationRequests

            // 3. UPDATE UserMembership status to cancelled (để vẫn hiển thị được)
            await transaction.request()
                .input('MembershipID', cancellation.MembershipID)
                .query(`
                    UPDATE UserMemberships
                    SET Status = 'cancelled'
                    WHERE MembershipID = @MembershipID
                `);

            // 4. Update user role to guest (since membership is cancelled)
            await transaction.request()
                .input('UserID', cancellation.UserID)
                .query(`
                    UPDATE Users
                    SET Role = 'guest'
                    WHERE UserID = @UserID
                `);

            // 5. Create notification for user
            await transaction.request()
                .input('UserID', cancellation.UserID)
                .input('Title', 'Gói dịch vụ đã được hủy')
                .input('Message', approveRefund ?
                    `Gói ${cancellation.PlanName} đã được hủy thành công. Số tiền hoàn lại: ${refundAmount?.toLocaleString('vi-VN')} VNĐ. Admin sẽ chuyển tiền vào tài khoản của bạn trong 3-5 ngày làm việc.` :
                    `Gói ${cancellation.PlanName} đã được hủy thành công. Không có hoàn tiền.`)
                .input('Type', 'cancellation_approved')
                .input('RelatedID', cancellationId)
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type, RelatedID)
                    VALUES (@UserID, @Title, @Message, @Type, @RelatedID)
                `);

            await transaction.commit();

            console.log('✅ Cancellation approved and membership status updated to cancelled');

            res.json({
                success: true,
                message: 'Đã chấp nhận yêu cầu hủy gói. Trạng thái gói đã được cập nhật.',
                data: {
                    cancellationId: cancellationId,
                    approvedRefund: approveRefund,
                    refundAmount: refundAmount,
                    membershipStatus: 'cancelled'
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('❌ Error approving cancellation:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi chấp nhận yêu cầu hủy gói',
            error: error.message
        });
    }
});

// Reject cancellation request
router.post('/reject-cancellation/:cancellationId', protect, authorize('admin'), async (req, res) => {
    try {
        const { cancellationId } = req.params;
        const { adminNotes } = req.body;

        console.log('🔍 Admin rejecting cancellation request:', cancellationId);

        // Start transaction to ensure data consistency
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // First, get the cancellation request details
            const cancellationResult = await transaction.request()
                .input('CancellationRequestID', cancellationId)
                .query(`
                    SELECT cr.*, um.MembershipID, um.UserID, mp.Name as PlanName
                    FROM CancellationRequests cr
                    JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
                    JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                    WHERE cr.CancellationRequestID = @CancellationRequestID
                `);

            if (cancellationResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy yêu cầu hủy gói'
                });
            }

            const cancellation = cancellationResult.recordset[0];

            // Update cancellation request status to rejected
            await transaction.request()
                .input('RequestId', cancellationId)
                .input('AdminNotes', adminNotes || '')
                .input('ProcessedByUserID', req.user.UserID || req.user.id)
                .query(`
                    UPDATE CancellationRequests 
                    SET Status = 'rejected',
                        AdminNotes = @AdminNotes,
                        ProcessedByUserID = @ProcessedByUserID,
                        ProcessedAt = GETDATE()
                    WHERE CancellationRequestID = @RequestId
                `);

            // Restore membership status to active
            await transaction.request()
                .input('MembershipID', cancellation.MembershipID)
                .query(`
                    UPDATE UserMemberships 
                    SET Status = 'active'
                    WHERE MembershipID = @MembershipID
                `);

            // Ensure user role is member (in case it was changed)
            await transaction.request()
                .input('UserID', cancellation.UserID)
                .query(`
                    UPDATE Users 
                    SET Role = 'member'
                    WHERE UserID = @UserID
                `);

            // Create notification for user about rejection
            await transaction.request()
                .input('UserID', cancellation.UserID)
                .input('Title', 'Yêu cầu hủy gói dịch vụ bị từ chối')
                .input('Message', `Yêu cầu hủy gói ${cancellation.PlanName} của bạn đã bị từ chối. Lý do: ${adminNotes || 'Không có lý do cụ thể'}. Gói dịch vụ của bạn sẽ tiếp tục hoạt động bình thường.`)
                .input('Type', 'cancellation_rejected')
                .input('RelatedID', cancellationId)
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type, RelatedID)
                    VALUES (@UserID, @Title, @Message, @Type, @RelatedID)
                `);

            await transaction.commit();

            console.log('✅ Cancellation rejected and membership restored to active');

            res.json({
                success: true,
                message: 'Đã từ chối yêu cầu hủy gói. Gói dịch vụ đã được khôi phục.',
                data: {
                    cancellationId: cancellationId,
                    membershipStatus: 'active',
                    userRole: 'member'
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('❌ Error rejecting cancellation:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi từ chối yêu cầu hủy gói'
        });
    }
});

// Get cancellation history
router.get('/cancellation-history', protect, authorize('admin'), async (req, res) => {
    try {
        console.log('🔍 Admin cancellation-history endpoint called');

        const historyResult = await pool.request().query(`
            SELECT 
                cr.CancellationRequestID as RequestID,
                cr.UserID,
                um.PlanID,
                COALESCE(cr.ApprovedRefundAmount, cr.RequestedRefundAmount, 0) as RefundAmount,
                cr.ApprovedRefundAmount,
                cr.RefundApproved,
                cr.Status,
                cr.RequestedAt,
                cr.ProcessedAt,
                cr.CancellationReason,
                cr.AdminNotes,
                cr.BankAccountNumber,
                cr.BankName,
                cr.AccountHolderName,
                u.FirstName,
                u.LastName,
                u.Email,
                u.PhoneNumber,
                mp.Name as PlanName,
                mp.Description as PlanDescription,
                mp.Duration,
                mp.Price as PlanPrice,
                um.StartDate as MembershipStartDate,
                um.EndDate as MembershipEndDate,
                um.Status as MembershipStatus,
                COALESCE(au.FirstName + ' ' + au.LastName, 'System') as AdminName,
                'cancellation' as RequestType
            FROM CancellationRequests cr
            INNER JOIN Users u ON cr.UserID = u.UserID
            INNER JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
            INNER JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            LEFT JOIN Users au ON cr.ProcessedByUserID = au.UserID
            WHERE cr.Status IN ('approved', 'rejected')
            ORDER BY COALESCE(cr.ProcessedAt, cr.RequestedAt) DESC
        `);

        console.log(`📊 Found ${historyResult.recordset.length} processed cancellation requests`);

        if (historyResult.recordset.length > 0) {
            console.log('📋 Sample cancellation record:', historyResult.recordset[0]);
        }

        res.json({
            success: true,
            data: historyResult.recordset
        });
    } catch (error) {
        console.error('❌ Error getting cancellation history:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử yêu cầu hủy gói'
        });
    }
});

// ==================== USER ACTIVITY TRACKING ====================

// Get comprehensive user activity tracking
router.get('/user-activity', protect, authorize('admin'), async (req, res) => {
    try {
        console.log('🔍 Starting user-activity endpoint...');

        // Get users in quit process - RELAXED CONSTRAINTS (tạm thời nới lỏng để hiển thị)  
        const usersInQuitProcessResult = await pool.request().query(`
            SELECT 
                u.UserID,
                u.Email,
                u.FirstName,
                u.LastName,
                u.Avatar,
                u.CreatedAt,
                u.LastLoginAt,
                qp.PlanID,
                qp.StartDate as QuitStartDate,
                qp.TargetDate as QuitTargetDate,
                qp.Status as QuitStatus,
                qp.MotivationLevel,
                qp.CoachID,
                ISNULL(coach.FirstName + ' ' + coach.LastName, 'Chưa có coach') as CoachName,
                ISNULL(DATEDIFF(day, qp.StartDate, GETDATE()), 0) as DaysIntoQuit,
                ISNULL(DATEDIFF(day, GETDATE(), qp.TargetDate), 0) as DaysToTarget,
                -- Add progress tracking data (không cần ràng buộc membership)
                pt.Date as LastProgressDate,
                pt.CigarettesSmoked as LastCigarettesSmoked,
                pt.CravingLevel as LastCravingLevel,
                pt.DaysSmokeFree as CurrentDaysSmokeFree,
                pt.MoneySaved as TotalMoneySaved,
                ISNULL(um.StartDate, u.CreatedAt) as MembershipStartDate,
                um.EndDate as MembershipEndDate,
                ISNULL(mp.Name, 'Chưa có gói') as MembershipPlanName,
                'Stable' as SupportStatus
            FROM Users u
            LEFT JOIN UserMemberships um ON u.UserID = um.UserID AND um.Status = 'active'  -- Changed to LEFT JOIN
            LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            LEFT JOIN QuitPlans qp ON u.UserID = qp.UserID AND qp.Status = 'active'  -- Changed to LEFT JOIN
            LEFT JOIN Users coach ON qp.CoachID = coach.UserID
            LEFT JOIN (
                SELECT UserID, Date, CigarettesSmoked, CravingLevel, DaysSmokeFree, MoneySaved,
                       ROW_NUMBER() OVER (PARTITION BY UserID ORDER BY Date DESC) as rn
                FROM ProgressTracking
                -- Removed membership constraints
            ) pt ON u.UserID = pt.UserID AND pt.rn = 1
            WHERE u.Role = 'member'  -- Chỉ lấy member đã mua gói, không lấy guest
                -- Keep users who have either membership OR quitplan OR progress tracking
                AND (um.UserID IS NOT NULL OR qp.UserID IS NOT NULL OR pt.UserID IS NOT NULL)
            ORDER BY ISNULL(qp.StartDate, u.CreatedAt) DESC
        `);

        console.log(`✅ Found ${usersInQuitProcessResult.recordset.length} users in quit process`);

        // Get users needing support - RELAXED CONSTRAINTS (tạm thời nới lỏng để hiển thị)
        const usersNeedingSupportResult = await pool.request().query(`
            SELECT 
                u.UserID,
                u.Email,
                u.FirstName + ' ' + u.LastName as FullName,
                u.Avatar,
                u.LastLoginAt,
                qp.StartDate as QuitStartDate,
                qp.MotivationLevel,
                qp.CoachID,
                ISNULL(coach.FirstName + ' ' + coach.LastName, 'Chưa có coach') as CoachName,
                pt.Date as LastProgressDate,
                pt.CigarettesSmoked,
                pt.CravingLevel,
                pt.EmotionNotes,
                ISNULL(um.StartDate, u.CreatedAt) as MembershipStartDate,
                -- Support reasons - COMPREHENSIVE (hiển thị tất cả vấn đề)
                CASE 
                    WHEN u.LastLoginAt IS NULL AND pt.Date IS NULL THEN 'Chưa đăng nhập bao giờ và chưa điền tiến trình'
                    WHEN u.LastLoginAt IS NULL THEN 'Chưa đăng nhập bao giờ'
                    WHEN pt.Date IS NULL THEN 'Chưa điền tiến trình nào'
                    WHEN u.LastLoginAt < DATEADD(day, -30, GETDATE()) AND pt.Date < DATEADD(day, -7, GETDATE()) THEN 'Không login thường xuyên (' + CAST(DATEDIFF(day, u.LastLoginAt, GETDATE()) as NVARCHAR) + ' ngày) và không cập nhật tiến trình (' + CAST(DATEDIFF(day, pt.Date, GETDATE()) as NVARCHAR) + ' ngày)'
                    WHEN u.LastLoginAt < DATEADD(day, -30, GETDATE()) AND ISNULL(qp.MotivationLevel, 5) <= 3 THEN 'Không login thường xuyên (' + CAST(DATEDIFF(day, u.LastLoginAt, GETDATE()) as NVARCHAR) + ' ngày) và động lực thấp (' + CAST(ISNULL(qp.MotivationLevel, 5) as NVARCHAR) + '/10)'
                    WHEN pt.Date < DATEADD(day, -7, GETDATE()) AND ISNULL(qp.MotivationLevel, 5) <= 3 THEN 'Không cập nhật tiến trình (' + CAST(DATEDIFF(day, pt.Date, GETDATE()) as NVARCHAR) + ' ngày) và động lực thấp (' + CAST(ISNULL(qp.MotivationLevel, 5) as NVARCHAR) + '/10)'
                    WHEN u.LastLoginAt < DATEADD(day, -30, GETDATE()) THEN 'Không login thường xuyên (' + CAST(DATEDIFF(day, u.LastLoginAt, GETDATE()) as NVARCHAR) + ' ngày)'
                    WHEN u.LastLoginAt < DATEADD(day, -14, GETDATE()) THEN 'Không đăng nhập ' + CAST(DATEDIFF(day, u.LastLoginAt, GETDATE()) as NVARCHAR) + ' ngày'
                    WHEN pt.Date < DATEADD(day, -7, GETDATE()) THEN 'Không cập nhật tiến trình ' + CAST(DATEDIFF(day, pt.Date, GETDATE()) as NVARCHAR) + ' ngày'
                    WHEN pt.CravingLevel >= 8 THEN 'Mức thèm thuốc cao (' + CAST(pt.CravingLevel as NVARCHAR) + '/10)'
                    WHEN pt.CigarettesSmoked > 0 AND pt.Date >= DATEADD(day, -3, GETDATE()) THEN 'Đã hút thuốc gần đây (' + CAST(pt.CigarettesSmoked as NVARCHAR) + ' điếu)'
                    WHEN ISNULL(qp.MotivationLevel, 5) <= 3 THEN 'Động lực thấp (' + CAST(ISNULL(qp.MotivationLevel, 5) as NVARCHAR) + '/10)'
                    ELSE 'Cần theo dõi thêm'
                END as SupportReason,
                CASE 
                    WHEN u.LastLoginAt IS NULL THEN 'Critical'
                    WHEN pt.Date IS NULL THEN 'Critical'
                    WHEN u.LastLoginAt < DATEADD(day, -30, GETDATE()) THEN 'Critical'
                    WHEN u.LastLoginAt < DATEADD(day, -14, GETDATE()) THEN 'High'
                    WHEN ISNULL(qp.MotivationLevel, 5) <= 3 THEN 'Medium'
                    ELSE 'Low'
                END as Priority
            FROM Users u
            LEFT JOIN UserMemberships um ON u.UserID = um.UserID AND um.Status = 'active'  -- Changed to LEFT JOIN
            LEFT JOIN QuitPlans qp ON u.UserID = qp.UserID AND qp.Status = 'active'  -- Changed to LEFT JOIN
            LEFT JOIN Users coach ON qp.CoachID = coach.UserID
            LEFT JOIN (
                SELECT UserID, Date, CigarettesSmoked, CravingLevel, EmotionNotes,
                       ROW_NUMBER() OVER (PARTITION BY UserID ORDER BY Date DESC) as rn
                FROM ProgressTracking pt2
                -- Removed strict membership constraints for now
            ) pt ON u.UserID = pt.UserID AND pt.rn = 1
            WHERE u.Role = 'member'  -- Chỉ lấy member đã mua gói
                -- Simplified filter conditions
                AND (
                    u.LastLoginAt IS NULL OR
                    pt.Date IS NULL OR
                    u.LastLoginAt < DATEADD(day, -7, GETDATE()) OR
                    ISNULL(qp.MotivationLevel, 5) <= 5 OR
                    pt.CravingLevel >= 7 OR
                    (pt.CigarettesSmoked > 0 AND pt.Date >= DATEADD(day, -3, GETDATE()))
                )
            ORDER BY 
                CASE 
                    WHEN u.LastLoginAt IS NULL THEN 1
                    WHEN pt.Date IS NULL THEN 1
                    WHEN u.LastLoginAt < DATEADD(day, -30, GETDATE()) THEN 1
                    WHEN u.LastLoginAt < DATEADD(day, -14, GETDATE()) THEN 2
                    WHEN ISNULL(qp.MotivationLevel, 5) <= 3 THEN 3
                    ELSE 4
                END
        `);

        console.log(`✅ Found ${usersNeedingSupportResult.recordset.length} users needing support`);

        // Get achievement statistics - SIMPLE QUERY
        const achievementStatsResult = await pool.request().query(`
            SELECT 
                a.AchievementID,
                a.Name as AchievementName,
                a.Description,
                a.IconURL,
                a.MilestoneDays,
                a.SavedMoney,
                COUNT(ua.UserAchievementID) as TimesEarned,
                100 as TotalEligibleUsers,
                CAST(COUNT(ua.UserAchievementID) * 100.0 / 100.0 as DECIMAL(5,2)) as EarnPercentage
            FROM Achievements a
            LEFT JOIN UserAchievements ua ON a.AchievementID = ua.AchievementID
            GROUP BY a.AchievementID, a.Name, a.Description, a.IconURL, a.MilestoneDays, a.SavedMoney
            ORDER BY TimesEarned DESC
        `);

        console.log(`✅ Found ${achievementStatsResult.recordset.length} achievements`);

        // Get coach performance - SIMPLE QUERY
        const coachPerformanceResult = await pool.request().query(`
            SELECT 
                c.UserID as CoachID,
                c.FirstName + ' ' + c.LastName as CoachName,
                c.Avatar,
                COUNT(qp.PlanID) as TotalAssignedPlans,
                COUNT(CASE WHEN qp.Status = 'active' THEN 1 END) as ActivePlans,
                COUNT(CASE WHEN qp.Status = 'completed' THEN 1 END) as CompletedPlans,
                5.0 as AverageRating,
                10 as TotalReviews,
                COUNT(CASE WHEN qp.CreatedAt >= DATEADD(day, -30, GETDATE()) THEN 1 END) as NewPlansLast30Days
            FROM Users c
            LEFT JOIN QuitPlans qp ON c.UserID = qp.CoachID
            WHERE c.Role = 'coach' AND c.IsActive = 1
            GROUP BY c.UserID, c.FirstName, c.LastName, c.Avatar
            HAVING COUNT(qp.PlanID) > 0
            ORDER BY TotalAssignedPlans DESC
        `);

        console.log(`✅ Found ${coachPerformanceResult.recordset.length} coaches`);

        res.json({
            success: true,
            data: {
                usersInQuitProcess: removeDuplicateUsers(usersInQuitProcessResult.recordset),
                usersNeedingSupport: removeDuplicateUsers(usersNeedingSupportResult.recordset),
                achievementStats: achievementStatsResult.recordset,
                coachPerformance: coachPerformanceResult.recordset
            },
            message: 'Dữ liệu theo dõi hoạt động người dùng được tải thành công'
        });

        console.log('✅ User activity endpoint completed successfully');

    } catch (error) {
        console.error('❌ User activity tracking error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải dữ liệu theo dõi hoạt động',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Helper function to remove duplicate users
function removeDuplicateUsers(users) {
    const seen = new Set();
    return users.filter(user => {
        if (seen.has(user.UserID)) {
            return false;
        }
        seen.add(user.UserID);
        return true;
    });
}

// Get detailed user progress analysis
router.get('/user-progress-analysis/:userId', protect, authorize('admin'), async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user basic info
        const userInfoResult = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    u.UserID, u.Email, u.FirstName, u.LastName, u.Avatar,
                    u.CreatedAt, u.LastLoginAt, u.IsActive,
                    um.Status as MembershipStatus, um.StartDate as MembershipStart, um.EndDate as MembershipEnd,
                    mp.Name as PlanName, mp.Price
                FROM Users u
                LEFT JOIN UserMemberships um ON u.UserID = um.UserID AND um.Status = 'active'
                LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                WHERE u.UserID = @UserID
            `);

        if (userInfoResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Get quit plans
        const quitPlansResult = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    qp.*,
                    c.FirstName + ' ' + c.LastName as CoachName,
                    DATEDIFF(day, qp.StartDate, GETDATE()) as DaysElapsed,
                    DATEDIFF(day, qp.StartDate, qp.TargetDate) as PlannedDuration,
                    CASE 
                        WHEN qp.Status = 'completed' THEN DATEDIFF(day, qp.StartDate, qp.TargetDate)
                        ELSE DATEDIFF(day, qp.StartDate, GETDATE())
                    END as ActualDuration
                FROM QuitPlans qp
                LEFT JOIN Users c ON qp.CoachID = c.UserID
                WHERE qp.UserID = @UserID
                ORDER BY qp.CreatedAt DESC
            `);

        // Get progress tracking data - ONLY AFTER MEMBERSHIP START
        const progressDataResult = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    Date, CigarettesSmoked, CravingLevel, EmotionNotes,
                    MoneySaved, DaysSmokeFree, HealthNotes, CreatedAt
                FROM ProgressTracking pt
                WHERE pt.UserID = @UserID
                    AND EXISTS (
                        SELECT 1 FROM UserMemberships um 
                        WHERE um.UserID = pt.UserID 
                            AND um.Status = 'active'
                            AND pt.Date >= um.StartDate  -- Chỉ lấy progress sau khi mua gói
                            AND pt.Date <= ISNULL(um.EndDate, '9999-12-31')
                    )
                ORDER BY Date DESC
            `);

        // Get achievements
        const achievementsResult = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    a.Name, a.Description, a.IconURL, a.MilestoneDays, a.SavedMoney,
                    ua.EarnedAt
                FROM UserAchievements ua
                JOIN Achievements a ON ua.AchievementID = a.AchievementID
                WHERE ua.UserID = @UserID
                ORDER BY ua.EarnedAt DESC
            `);

        // Calculate analytics
        const progressData = progressDataResult.recordset;
        const analytics = {
            totalDaysTracked: progressData.length,
            smokeFreeDays: progressData.filter(p => p.CigarettesSmoked === 0).length,
            totalCigarettesSmoked: progressData.reduce((sum, p) => sum + (p.CigarettesSmoked || 0), 0),
            totalMoneySaved: progressData.reduce((sum, p) => sum + (p.MoneySaved || 0), 0),
            averageCravingLevel: progressData.length > 0 ?
                progressData.reduce((sum, p) => sum + (p.CravingLevel || 0), 0) / progressData.length : 0,
            longestSmokeFreePeriod: calculateLongestSmokeFreePeriod(progressData),
            recentTrend: calculateRecentTrend(progressData)
        };

        res.json({
            success: true,
            data: {
                userInfo: userInfoResult.recordset[0],
                quitPlans: quitPlansResult.recordset,
                progressData: progressData,
                achievements: achievementsResult.recordset,
                analytics: analytics
            },
            message: 'Phân tích tiến trình người dùng được tải thành công'
        });

    } catch (error) {
        console.error('User progress analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi phân tích tiến trình người dùng',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Helper functions for analytics
function calculateLongestSmokeFreePeriod(progressData) {
    let maxPeriod = 0;
    let currentPeriod = 0;

    // Sort by date ascending
    const sortedData = progressData.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    for (const entry of sortedData) {
        if (entry.CigarettesSmoked === 0) {
            currentPeriod++;
            maxPeriod = Math.max(maxPeriod, currentPeriod);
        } else {
            currentPeriod = 0;
        }
    }

    return maxPeriod;
}

function calculateRecentTrend(progressData) {
    if (progressData.length < 7) return 'insufficient_data';

    // Get last 7 days
    const recent = progressData.slice(0, 7);
    const recentCigarettes = recent.reduce((sum, p) => sum + (p.CigarettesSmoked || 0), 0);
    const recentCravings = recent.reduce((sum, p) => sum + (p.CravingLevel || 0), 0) / recent.length;

    // Get previous 7 days for comparison
    const previous = progressData.slice(7, 14);
    if (previous.length === 0) return 'improving';

    const previousCigarettes = previous.reduce((sum, p) => sum + (p.CigarettesSmoked || 0), 0);
    const previousCravings = previous.reduce((sum, p) => sum + (p.CravingLevel || 0), 0) / previous.length;

    if (recentCigarettes < previousCigarettes && recentCravings < previousCravings) {
        return 'improving';
    } else if (recentCigarettes > previousCigarettes || recentCravings > previousCravings) {
        return 'declining';
    } else {
        return 'stable';
    }
}

// Get system-wide activity overview
router.get('/system-overview', protect, authorize('admin'), async (req, res) => {
    try {
        const overviewResult = await pool.request().query(`
            SELECT 
                -- User activity
                (SELECT COUNT(*) FROM Users WHERE Role IN ('guest', 'member')) as TotalMembers,
                (SELECT COUNT(*) FROM Users WHERE Role IN ('guest', 'member') AND IsActive = 1) as ActiveMembers,
                (SELECT COUNT(*) FROM Users WHERE Role IN ('guest', 'member') AND LastLoginAt >= DATEADD(day, -7, GETDATE())) as RecentlyActiveMembers,
                (SELECT COUNT(*) FROM Users WHERE Role IN ('guest', 'member') AND CreatedAt >= DATEADD(day, -30, GETDATE())) as NewMembersLast30Days,
                
                -- Quit plans activity
                (SELECT COUNT(*) FROM QuitPlans WHERE Status = 'active') as ActiveQuitPlans,
                (SELECT COUNT(*) FROM QuitPlans WHERE CreatedAt >= DATEADD(day, -7, GETDATE())) as NewQuitPlansLast7Days,
                (SELECT COUNT(*) FROM QuitPlans WHERE Status = 'completed') as TotalCompletedPlans,
                
                -- Progress tracking activity
                (SELECT COUNT(DISTINCT UserID) FROM ProgressTracking WHERE Date >= DATEADD(day, -7, GETDATE())) as UsersTrackingLast7Days,
                (SELECT COUNT(*) FROM ProgressTracking WHERE Date >= DATEADD(day, -1, GETDATE())) as ProgressEntriesYesterday,
                (SELECT COUNT(*) FROM ProgressTracking WHERE Date >= DATEADD(day, -7, GETDATE())) as ProgressEntriesLast7Days,
                
                -- Support metrics
                (SELECT COUNT(DISTINCT UserID) FROM ProgressTracking WHERE CravingLevel >= 8 AND Date >= DATEADD(day, -3, GETDATE())) as HighCravingUsers,
                (SELECT COUNT(DISTINCT UserID) FROM ProgressTracking WHERE CigarettesSmoked > 0 AND Date >= DATEADD(day, -3, GETDATE())) as RecentSmokingUsers,
                
                -- Achievement activity
                (SELECT COUNT(*) FROM UserAchievements WHERE EarnedAt >= DATEADD(day, -7, GETDATE())) as AchievementsEarnedLast7Days,
                (SELECT COUNT(DISTINCT UserID) FROM UserAchievements WHERE EarnedAt >= DATEADD(day, -7, GETDATE())) as UsersEarningAchievementsLast7Days,
                
                -- Revenue metrics
                (SELECT COUNT(*) FROM Payments WHERE Status = 'confirmed' AND PaymentDate >= DATEADD(day, -30, GETDATE())) as PaymentsLast30Days,
                (SELECT SUM(Amount) FROM Payments WHERE Status = 'confirmed' AND PaymentDate >= DATEADD(day, -30, GETDATE())) as RevenueLast30Days
        `);

        res.json({
            success: true,
            data: overviewResult.recordset[0],
            message: 'Tổng quan hệ thống được tải thành công'
        });

    } catch (error) {
        console.error('System overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải tổng quan hệ thống',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get admin profile information
router.get('/profile', protect, authorize('admin'), async (req, res) => {
    try {
        const adminId = req.user.id;

        const result = await pool.request()
            .input('UserID', adminId)
            .query(`
                SELECT 
                    UserID,
                    Email,
                    FirstName,
                    LastName,
                    Avatar,
                    PhoneNumber,
                    Address,
                    Role,
                    IsActive,
                    EmailVerified,
                    CreatedAt,
                    UpdatedAt,
                    LastLoginAt
                FROM Users 
                WHERE UserID = @UserID AND Role = 'admin'
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin admin'
            });
        }

        const adminData = result.recordset[0];

        // Get admin statistics
        const statsResult = await pool.request()
            .input('UserID', adminId)
            .query(`
                SELECT 
                    (SELECT COUNT(*) FROM Users WHERE Role IN ('guest', 'member')) as TotalMembersManaged,
                    (SELECT COUNT(*) FROM Users WHERE Role = 'coach') as TotalCoachesManaged,
                    (SELECT COUNT(*) FROM BlogPosts) as TotalBlogPostsManaged,
                    (SELECT COUNT(*) FROM Payments WHERE Status = 'confirmed') as TotalPaymentsProcessed,
                    (SELECT ISNULL(SUM(CASE 
                        WHEN p.Status = 'confirmed' THEN p.Amount
                        WHEN p.Status = 'rejected' THEN p.Amount - ISNULL(cr.RefundAmount, 0)
                        ELSE 0
                    END), 0) 
                    FROM Payments p
                    LEFT JOIN CancellationRequests cr ON p.PaymentID = cr.PaymentID AND cr.Status = 'approved' AND cr.RefundApproved = 1
                    WHERE p.Status IN ('confirmed', 'rejected')) as TotalRevenueManaged,
                    0 as TotalLogins  -- Tạm thời set về 0 vì có thể bảng LoginHistory chưa có
            `);

        res.json({
            success: true,
            data: {
                ...adminData,
                statistics: statsResult.recordset[0]
            },
            message: 'Thông tin admin được tải thành công'
        });

    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thông tin admin',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update admin profile information
router.put('/profile', protect, authorize('admin'), async (req, res) => {
    try {
        const adminId = req.user.id;
        const { firstName, lastName, phoneNumber, address, avatar } = req.body;

        // Validate input
        if (!firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Họ và tên là bắt buộc'
            });
        }

        // Update admin profile
        const result = await pool.request()
            .input('UserID', adminId)
            .input('FirstName', firstName.trim())
            .input('LastName', lastName.trim())
            .input('PhoneNumber', phoneNumber ? phoneNumber.trim() : null)
            .input('Address', address ? address.trim() : null)
            .input('Avatar', avatar ? avatar.trim() : null)
            .query(`
                UPDATE Users 
                SET FirstName = @FirstName,
                    LastName = @LastName,
                    PhoneNumber = @PhoneNumber,
                    Address = @Address,
                    Avatar = @Avatar,
                    UpdatedAt = GETDATE()
                OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.FirstName, INSERTED.LastName, 
                       INSERTED.Avatar, INSERTED.PhoneNumber, INSERTED.Address, INSERTED.Role,
                       INSERTED.UpdatedAt
                WHERE UserID = @UserID AND Role = 'admin'
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin admin hoặc không có quyền cập nhật'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
            message: 'Cập nhật thông tin cá nhân thành công'
        });

    } catch (error) {
        console.error('Update admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thông tin admin',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Change admin password
router.put('/change-password', protect, authorize('admin'), async (req, res) => {
    try {
        const adminId = req.user.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới và xác nhận mật khẩu không khớp'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
            });
        }

        // Get current admin info
        const adminResult = await pool.request()
            .input('UserID', adminId)
            .query(`
                SELECT UserID, Password, FirstName, LastName 
                FROM Users 
                WHERE UserID = @UserID AND Role = 'admin'
            `);

        if (adminResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin admin'
            });
        }

        const admin = adminResult.recordset[0];

        // Verify current password (plain text comparison)
        if (currentPassword !== admin.Password) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không chính xác'
            });
        }

        // Update password (store as plain text for now)
        await pool.request()
            .input('UserID', adminId)
            .input('NewPassword', newPassword)
            .query(`
                UPDATE Users 
                SET Password = @NewPassword,
                    UpdatedAt = GETDATE()
                WHERE UserID = @UserID AND Role = 'admin'
            `);

        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });

    } catch (error) {
        console.error('Change admin password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đổi mật khẩu',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==================== FEEDBACK MANAGEMENT ENDPOINTS ====================

// Get all feedbacks for admin management
router.get('/feedbacks', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                cf.FeedbackID,
                cf.MemberID,
                cf.CoachID,
                cf.Rating,
                cf.Comment,
                cf.Status,
                cf.CreatedAt,
                cf.UpdatedAt,
                -- Member information
                um.FirstName + ' ' + um.LastName as MemberName,
                um.Email as MemberEmail,
                um.Avatar as MemberAvatar,
                -- Coach information
                uc.FirstName + ' ' + uc.LastName as CoachName,
                uc.Email as CoachEmail,
                uc.Avatar as CoachAvatar
            FROM CoachFeedback cf
            LEFT JOIN Users um ON cf.MemberID = um.UserID
            LEFT JOIN Users uc ON cf.CoachID = uc.UserID
            ORDER BY cf.CreatedAt DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
            message: 'Tải danh sách phản hồi thành công'
        });

    } catch (error) {
        console.error('Get feedbacks error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách phản hồi',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get feedback statistics for admin dashboard
router.get('/feedback-stats', protect, authorize('admin'), async (req, res) => {
    try {
        // Get basic stats
        const statsResult = await pool.request().query(`
            SELECT 
                COUNT(*) as totalFeedbacks,
                ROUND(AVG(CAST(Rating as FLOAT)), 1) as averageRating,
                COUNT(CASE WHEN CreatedAt >= DATEADD(day, -7, GETDATE()) THEN 1 END) as recentFeedbacks
            FROM CoachFeedback
            WHERE Status = 'active'
        `);

        // Get rating distribution
        const distributionResult = await pool.request().query(`
            SELECT 
                Rating,
                COUNT(*) as count
            FROM CoachFeedback
            WHERE Status = 'active'
            GROUP BY Rating
            ORDER BY Rating DESC
        `);

        // Get top rated coaches
        const topCoachesResult = await pool.request().query(`
            SELECT TOP 5
                cf.CoachID,
                u.FirstName + ' ' + u.LastName as CoachName,
                u.Avatar as CoachAvatar,
                ROUND(AVG(CAST(cf.Rating as FLOAT)), 1) as AverageRating,
                COUNT(*) as TotalReviews
            FROM CoachFeedback cf
            LEFT JOIN Users u ON cf.CoachID = u.UserID
            WHERE cf.Status = 'active'
            GROUP BY cf.CoachID, u.FirstName, u.LastName, u.Avatar
            HAVING COUNT(*) >= 3  -- At least 3 reviews
            ORDER BY AVG(CAST(cf.Rating as FLOAT)) DESC, COUNT(*) DESC
        `);

        // Process rating distribution
        const ratingDistribution = {};
        distributionResult.recordset.forEach(item => {
            ratingDistribution[item.Rating] = item.count;
        });

        const stats = statsResult.recordset[0];

        res.json({
            success: true,
            data: {
                totalFeedbacks: stats.totalFeedbacks || 0,
                averageRating: stats.averageRating || 0,
                recentFeedbacks: stats.recentFeedbacks || 0,
                ratingDistribution,
                topRatedCoaches: topCoachesResult.recordset
            },
            message: 'Tải thống kê phản hồi thành công'
        });

    } catch (error) {
        console.error('Get feedback stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thống kê phản hồi',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete a feedback (admin only)
router.delete('/feedbacks/:feedbackId', protect, authorize('admin'), async (req, res) => {
    try {
        const { feedbackId } = req.params;

        // Validate feedbackId
        if (!feedbackId || isNaN(feedbackId)) {
            return res.status(400).json({
                success: false,
                message: 'ID phản hồi không hợp lệ'
            });
        }

        // Check if feedback exists
        const checkResult = await pool.request()
            .input('FeedbackID', feedbackId)
            .query(`
                SELECT FeedbackID, MemberID, CoachID 
                FROM CoachFeedback 
                WHERE FeedbackID = @FeedbackID
            `);

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phản hồi'
            });
        }

        // Delete the feedback (hard delete for admin)
        await pool.request()
            .input('FeedbackID', feedbackId)
            .query(`
                DELETE FROM CoachFeedback 
                WHERE FeedbackID = @FeedbackID
            `);

        res.json({
            success: true,
            message: 'Xóa phản hồi thành công'
        });

    } catch (error) {
        console.error('Delete feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa phản hồi',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get coaches list for filter dropdown
router.get('/coaches', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                UserID as CoachID,
                FirstName + ' ' + LastName as CoachName,
                Email,
                Avatar
            FROM Users 
            WHERE Role = 'coach' AND IsActive = 1
            ORDER BY FirstName, LastName
        `);

        res.json({
            success: true,
            data: result.recordset,
            message: 'Tải danh sách coach thành công'
        });

    } catch (error) {
        console.error('Get coaches error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách coach',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==================== REPORTS AND ANALYTICS ENDPOINTS ====================

// Get comprehensive reports data for admin dashboard
router.get('/reports', protect, authorize('admin'), async (req, res) => {
    try {
        const { range = 'month', month, year } = req.query;
        const currentDate = new Date();
        const currentMonth = month || (currentDate.getMonth() + 1);
        const currentYear = year || currentDate.getFullYear();

        console.log('📊 Reports API called with params:', { range, month: currentMonth, year: currentYear });

        // Khởi tạo response data với giá trị mặc định
        let responseData = {
            revenue: {
                total: 0,
                monthly: [],
                dailyAverage: 0,
                growth: 0
            },
            registrations: {
                total: 0,
                monthly: [],
                dailyAverage: 0,
                growth: 0
            },
            coachingSessions: {
                total: 0,
                completed: 0,
                scheduled: 0,
                monthly: [],
                growth: 0
            }
        };

        // ==== 1. DOANH THU (Revenue) từ bảng Payments ====
        try {
            console.log('💰 Fetching revenue data from Payments table...');

            // Doanh thu hiện tại
            let currentRevenueQuery = '';
            let previousRevenueQuery = '';

            if (range === 'month') {
                currentRevenueQuery = `
                    SELECT 
                        ISNULL(SUM(CASE 
                            WHEN p.Status = 'confirmed' THEN p.Amount
                            WHEN p.Status = 'rejected' THEN p.Amount - ISNULL(cr.RefundAmount, 0)
                            ELSE 0
                        END), 0) as totalRevenue,
                        COUNT(*) as totalTransactions
                    FROM Payments p
                    LEFT JOIN CancellationRequests cr ON p.PaymentID = cr.PaymentID AND cr.Status = 'approved' AND cr.RefundApproved = 1
                    WHERE p.Status IN ('confirmed', 'rejected') 
                    AND YEAR(p.PaymentDate) = ${currentYear} 
                    AND MONTH(p.PaymentDate) = ${currentMonth}
                `;

                previousRevenueQuery = `
                    SELECT ISNULL(SUM(CASE 
                        WHEN p.Status = 'confirmed' THEN p.Amount
                        WHEN p.Status = 'rejected' THEN p.Amount - ISNULL(cr.RefundAmount, 0)
                        ELSE 0
                    END), 0) as previousRevenue
                    FROM Payments p
                    LEFT JOIN CancellationRequests cr ON p.PaymentID = cr.PaymentID AND cr.Status = 'approved' AND cr.RefundApproved = 1
                    WHERE p.Status IN ('confirmed', 'rejected') 
                    AND YEAR(p.PaymentDate) = ${currentMonth > 1 ? currentYear : currentYear - 1}
                    AND MONTH(p.PaymentDate) = ${currentMonth > 1 ? currentMonth - 1 : 12}
                `;
            } else if (range === 'year') {
                currentRevenueQuery = `
                    SELECT 
                        ISNULL(SUM(CASE 
                            WHEN p.Status = 'confirmed' THEN p.Amount
                            WHEN p.Status = 'rejected' THEN p.Amount - ISNULL(cr.RefundAmount, 0)
                            ELSE 0
                        END), 0) as totalRevenue,
                        COUNT(*) as totalTransactions
                    FROM Payments p
                    LEFT JOIN CancellationRequests cr ON p.PaymentID = cr.PaymentID AND cr.Status = 'approved' AND cr.RefundApproved = 1
                    WHERE p.Status IN ('confirmed', 'rejected') 
                    AND YEAR(p.PaymentDate) = ${currentYear}
                `;

                previousRevenueQuery = `
                    SELECT ISNULL(SUM(CASE 
                        WHEN p.Status = 'confirmed' THEN p.Amount
                        WHEN p.Status = 'rejected' THEN p.Amount - ISNULL(cr.RefundAmount, 0)
                        ELSE 0
                    END), 0) as previousRevenue
                    FROM Payments p
                    LEFT JOIN CancellationRequests cr ON p.PaymentID = cr.PaymentID AND cr.Status = 'approved' AND cr.RefundApproved = 1
                    WHERE p.Status IN ('confirmed', 'rejected') 
                    AND YEAR(p.PaymentDate) = ${currentYear - 1}
                `;
            }

            const [revenueResult, previousRevenueResult] = await Promise.all([
                pool.request().query(currentRevenueQuery),
                pool.request().query(previousRevenueQuery)
            ]);

            // Doanh thu theo từng tháng trong năm (đã trừ hoàn tiền)
            const monthlyRevenueResult = await pool.request().query(`
                SELECT 
                    MONTH(p.PaymentDate) as month,
                    ISNULL(SUM(CASE 
                        WHEN p.Status = 'confirmed' THEN p.Amount
                        WHEN p.Status = 'rejected' THEN p.Amount - ISNULL(cr.RefundAmount, 0)
                        ELSE 0
                    END), 0) as amount,
                    'T' + CAST(MONTH(p.PaymentDate) as VARCHAR) as period
                FROM Payments p
                LEFT JOIN CancellationRequests cr ON p.PaymentID = cr.PaymentID AND cr.Status = 'approved' AND cr.RefundApproved = 1
                WHERE p.Status IN ('confirmed', 'rejected') 
                AND YEAR(p.PaymentDate) = ${currentYear}
                GROUP BY MONTH(p.PaymentDate)
                ORDER BY MONTH(p.PaymentDate)
            `);

            const currentRevenue = revenueResult.recordset[0]?.totalRevenue || 0;
            const previousRevenue = previousRevenueResult.recordset[0]?.previousRevenue || 0;
            const revenueGrowth = previousRevenue > 0
                ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
                : 0;

            responseData.revenue = {
                total: currentRevenue,
                monthly: monthlyRevenueResult.recordset || [],
                dailyAverage: Math.round(currentRevenue / 30),
                growth: Math.round(revenueGrowth * 100) / 100
            };

            console.log('✅ Revenue data:', responseData.revenue);
        } catch (revenueError) {
            console.warn('⚠️ Error fetching revenue data:', revenueError.message);
        }

        // ==== 2. ĐĂNG KÝ MỚI (New Registrations) từ bảng Users ====
        try {
            console.log('👥 Fetching user registrations data...');

            let currentRegistrationsQuery = '';
            let previousRegistrationsQuery = '';

            if (range === 'month') {
                currentRegistrationsQuery = `
                    SELECT 
                        COUNT(*) as totalRegistrations
                    FROM Users 
                    WHERE YEAR(CreatedAt) = ${currentYear} 
                    AND MONTH(CreatedAt) = ${currentMonth}
                `;

                previousRegistrationsQuery = `
                    SELECT COUNT(*) as previousRegistrations
                    FROM Users 
                    WHERE YEAR(CreatedAt) = ${currentMonth > 1 ? currentYear : currentYear - 1}
                    AND MONTH(CreatedAt) = ${currentMonth > 1 ? currentMonth - 1 : 12}
                `;
            } else if (range === 'year') {
                currentRegistrationsQuery = `
                    SELECT COUNT(*) as totalRegistrations
                    FROM Users 
                    WHERE YEAR(CreatedAt) = ${currentYear}
                `;

                previousRegistrationsQuery = `
                    SELECT COUNT(*) as previousRegistrations
                    FROM Users 
                    WHERE YEAR(CreatedAt) = ${currentYear - 1}
                `;
            }

            const [registrationsResult, previousRegistrationsResult] = await Promise.all([
                pool.request().query(currentRegistrationsQuery),
                pool.request().query(previousRegistrationsQuery)
            ]);

            // Đăng ký theo từng tháng trong năm
            const monthlyRegistrationsResult = await pool.request().query(`
                SELECT 
                    MONTH(CreatedAt) as month,
                    COUNT(*) as count,
                    'T' + CAST(MONTH(CreatedAt) as VARCHAR) as period
                FROM Users 
                WHERE YEAR(CreatedAt) = ${currentYear}
                GROUP BY MONTH(CreatedAt)
                ORDER BY MONTH(CreatedAt)
            `);

            const currentRegistrations = registrationsResult.recordset[0]?.totalRegistrations || 0;
            const previousRegistrations = previousRegistrationsResult.recordset[0]?.previousRegistrations || 0;
            const registrationsGrowth = previousRegistrations > 0
                ? ((currentRegistrations - previousRegistrations) / previousRegistrations) * 100
                : 0;

            responseData.registrations = {
                total: currentRegistrations,
                monthly: monthlyRegistrationsResult.recordset || [],
                dailyAverage: Math.round((currentRegistrations / 30) * 100) / 100,
                growth: Math.round(registrationsGrowth * 100) / 100
            };

            console.log('✅ Registrations data:', responseData.registrations);
        } catch (registrationsError) {
            console.warn('⚠️ Error fetching registrations data:', registrationsError.message);
        }

        // ==== 3. BUỔI COACHING từ bảng ConsultationAppointments hoặc UserMemberships ====
        try {
            console.log('💬 Fetching coaching sessions data...');

            // Kiểm tra xem bảng ConsultationAppointments có tồn tại không
            const checkAppointmentsTable = await pool.request().query(`
                SELECT COUNT(*) as tableExists 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'ConsultationAppointments'
            `);

            let currentSessions = 0;
            let completedSessions = 0;
            let scheduledSessions = 0;
            let previousSessions = 0;
            let monthlySessions = [];

            if (checkAppointmentsTable.recordset[0]?.tableExists > 0) {
                console.log('📅 Using ConsultationAppointments table...');

                // Lấy dữ liệu từ bảng ConsultationAppointments
                let currentSessionsQuery = '';
                let previousSessionsQuery = '';

                if (range === 'month') {
                    currentSessionsQuery = `
                        SELECT 
                            COUNT(*) as totalSessions,
                            COUNT(CASE WHEN Status = 'completed' THEN 1 END) as completedSessions,
                            COUNT(CASE WHEN Status IN ('scheduled', 'confirmed') THEN 1 END) as scheduledSessions
                        FROM ConsultationAppointments 
                        WHERE YEAR(AppointmentDate) = ${currentYear} 
                        AND MONTH(AppointmentDate) = ${currentMonth}
                    `;

                    previousSessionsQuery = `
                        SELECT COUNT(*) as previousSessions
                        FROM ConsultationAppointments 
                        WHERE YEAR(AppointmentDate) = ${currentMonth > 1 ? currentYear : currentYear - 1}
                        AND MONTH(AppointmentDate) = ${currentMonth > 1 ? currentMonth - 1 : 12}
                    `;
                } else if (range === 'year') {
                    currentSessionsQuery = `
                        SELECT 
                            COUNT(*) as totalSessions,
                            COUNT(CASE WHEN Status = 'completed' THEN 1 END) as completedSessions,
                            COUNT(CASE WHEN Status IN ('scheduled', 'confirmed') THEN 1 END) as scheduledSessions
                        FROM ConsultationAppointments 
                        WHERE YEAR(AppointmentDate) = ${currentYear}
                    `;

                    previousSessionsQuery = `
                        SELECT COUNT(*) as previousSessions
                        FROM ConsultationAppointments 
                        WHERE YEAR(AppointmentDate) = ${currentYear - 1}
                    `;
                }

                const [sessionsResult, previousSessionsResult] = await Promise.all([
                    pool.request().query(currentSessionsQuery),
                    pool.request().query(previousSessionsQuery)
                ]);

                // Sessions theo từng tháng
                const monthlySessionsResult = await pool.request().query(`
                    SELECT 
                        MONTH(AppointmentDate) as month,
                        COUNT(*) as sessions,
                        'T' + CAST(MONTH(AppointmentDate) as VARCHAR) as period
                    FROM ConsultationAppointments 
                    WHERE YEAR(AppointmentDate) = ${currentYear}
                    GROUP BY MONTH(AppointmentDate)
                    ORDER BY MONTH(AppointmentDate)
                `);

                currentSessions = sessionsResult.recordset[0]?.totalSessions || 0;
                completedSessions = sessionsResult.recordset[0]?.completedSessions || 0;
                scheduledSessions = sessionsResult.recordset[0]?.scheduledSessions || 0;
                previousSessions = previousSessionsResult.recordset[0]?.previousSessions || 0;
                monthlySessions = monthlySessionsResult.recordset || [];
            } else {
                console.log('📋 ConsultationAppointments table not found, using UserMemberships as fallback...');

                // Sử dụng UserMemberships làm fallback
                let currentMembershipsQuery = '';
                let previousMembershipsQuery = '';

                if (range === 'month') {
                    currentMembershipsQuery = `
                        SELECT 
                            COUNT(*) as totalMemberships,
                            COUNT(CASE WHEN Status = 'active' THEN 1 END) as activeMemberships,
                            COUNT(CASE WHEN Status = 'expired' THEN 1 END) as expiredMemberships
                        FROM UserMemberships 
                        WHERE YEAR(CreatedAt) = ${currentYear} 
                        AND MONTH(CreatedAt) = ${currentMonth}
                    `;

                    previousMembershipsQuery = `
                        SELECT COUNT(*) as previousMemberships
                        FROM UserMemberships 
                        WHERE YEAR(CreatedAt) = ${currentMonth > 1 ? currentYear : currentYear - 1}
                        AND MONTH(CreatedAt) = ${currentMonth > 1 ? currentMonth - 1 : 12}
                    `;
                } else if (range === 'year') {
                    currentMembershipsQuery = `
                        SELECT 
                            COUNT(*) as totalMemberships,
                            COUNT(CASE WHEN Status = 'active' THEN 1 END) as activeMemberships,
                            COUNT(CASE WHEN Status = 'expired' THEN 1 END) as expiredMemberships
                        FROM UserMemberships 
                        WHERE YEAR(CreatedAt) = ${currentYear}
                    `;

                    previousMembershipsQuery = `
                        SELECT COUNT(*) as previousMemberships
                        FROM UserMemberships 
                        WHERE YEAR(CreatedAt) = ${currentYear - 1}
                    `;
                }

                const [membershipsResult, previousMembershipsResult] = await Promise.all([
                    pool.request().query(currentMembershipsQuery),
                    pool.request().query(previousMembershipsQuery)
                ]);

                // Memberships theo từng tháng
                const monthlyMembershipsResult = await pool.request().query(`
                    SELECT 
                        MONTH(CreatedAt) as month,
                        COUNT(*) as sessions,
                        'T' + CAST(MONTH(CreatedAt) as VARCHAR) as period
                    FROM UserMemberships 
                    WHERE YEAR(CreatedAt) = ${currentYear}
                    GROUP BY MONTH(CreatedAt)
                    ORDER BY MONTH(CreatedAt)
                `);

                currentSessions = membershipsResult.recordset[0]?.totalMemberships || 0;
                completedSessions = membershipsResult.recordset[0]?.expiredMemberships || 0;
                scheduledSessions = membershipsResult.recordset[0]?.activeMemberships || 0;
                previousSessions = previousMembershipsResult.recordset[0]?.previousMemberships || 0;
                monthlySessions = monthlyMembershipsResult.recordset || [];
            }

            const sessionsGrowth = previousSessions > 0
                ? ((currentSessions - previousSessions) / previousSessions) * 100
                : 0;

            responseData.coachingSessions = {
                total: currentSessions,
                completed: completedSessions,
                scheduled: scheduledSessions,
                monthly: monthlySessions,
                growth: Math.round(sessionsGrowth * 100) / 100
            };

            console.log('✅ Coaching sessions data:', responseData.coachingSessions);
        } catch (coachingError) {
            console.warn('⚠️ Error fetching coaching sessions data:', coachingError.message);
        }

        console.log('🎉 Final response data:', responseData);

        res.json({
            success: true,
            data: responseData,
            message: 'Tải dữ liệu báo cáo thành công',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Get reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải dữ liệu báo cáo: ' + error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Export reports data to Excel
router.get('/reports/export', protect, authorize('admin'), async (req, res) => {
    try {
        const XLSX = require('xlsx');
        const { range = 'month', month, year } = req.query;

        console.log('📊 Exporting reports to Excel...', { range, month, year });

        // Reuse the same logic from the reports endpoint to get data
        const pool = await getDbPool();
        const currentYear = parseInt(year) || new Date().getFullYear();
        const currentMonth = parseInt(month) || new Date().getMonth() + 1;

        let responseData = {
            revenue: { total: 0, monthly: [], dailyAverage: 0, growth: 0 },
            registrations: { total: 0, monthly: [], dailyAverage: 0, growth: 0 },
            coachingSessions: { total: 0, completed: 0, scheduled: 0, monthly: [], growth: 0 }
        };

        // Get revenue data
        try {
            let revenueQuery = '';
            let previousRevenueQuery = '';

            if (range === 'month') {
                revenueQuery = `
                    SELECT 
                        COALESCE(SUM(Amount), 0) as totalRevenue,
                        COUNT(*) as totalPayments
                    FROM PaymentConfirmations pc
                    INNER JOIN Payments p ON pc.PaymentID = p.PaymentID
                    WHERE YEAR(pc.ConfirmationDate) = ${currentYear} 
                    AND MONTH(pc.ConfirmationDate) = ${currentMonth}
                    AND pc.Status = 'confirmed'
                `;

                previousRevenueQuery = `
                    SELECT COALESCE(SUM(Amount), 0) as previousRevenue
                    FROM PaymentConfirmations pc
                    INNER JOIN Payments p ON pc.PaymentID = p.PaymentID
                    WHERE YEAR(pc.ConfirmationDate) = ${currentMonth > 1 ? currentYear : currentYear - 1}
                    AND MONTH(pc.ConfirmationDate) = ${currentMonth > 1 ? currentMonth - 1 : 12}
                    AND pc.Status = 'confirmed'
                `;
            } else if (range === 'year') {
                revenueQuery = `
                    SELECT 
                        COALESCE(SUM(Amount), 0) as totalRevenue,
                        COUNT(*) as totalPayments
                    FROM PaymentConfirmations pc
                    INNER JOIN Payments p ON pc.PaymentID = p.PaymentID
                    WHERE YEAR(pc.ConfirmationDate) = ${currentYear}
                    AND pc.Status = 'confirmed'
                `;

                previousRevenueQuery = `
                    SELECT COALESCE(SUM(Amount), 0) as previousRevenue
                    FROM PaymentConfirmations pc
                    INNER JOIN Payments p ON pc.PaymentID = p.PaymentID
                    WHERE YEAR(pc.ConfirmationDate) = ${currentYear - 1}
                    AND pc.Status = 'confirmed'
                `;
            }

            const [revenueResult, previousRevenueResult] = await Promise.all([
                pool.request().query(revenueQuery),
                pool.request().query(previousRevenueQuery)
            ]);

            const monthlyRevenueResult = await pool.request().query(`
                SELECT 
                    MONTH(pc.ConfirmationDate) as month,
                    COALESCE(SUM(Amount), 0) as amount,
                    'T' + CAST(MONTH(pc.ConfirmationDate) as VARCHAR) as period
                FROM PaymentConfirmations pc
                INNER JOIN Payments p ON pc.PaymentID = p.PaymentID
                WHERE YEAR(pc.ConfirmationDate) = ${currentYear}
                AND pc.Status = 'confirmed'
                GROUP BY MONTH(pc.ConfirmationDate)
                ORDER BY MONTH(pc.ConfirmationDate)
            `);

            const currentRevenue = revenueResult.recordset[0]?.totalRevenue || 0;
            const previousRevenue = previousRevenueResult.recordset[0]?.previousRevenue || 0;
            const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

            const daysInPeriod = range === 'month' ? new Date(currentYear, currentMonth, 0).getDate() : 365;

            responseData.revenue = {
                total: currentRevenue,
                monthly: monthlyRevenueResult.recordset || [],
                dailyAverage: currentRevenue / daysInPeriod,
                growth: Math.round(revenueGrowth * 100) / 100
            };
        } catch (revenueError) {
            console.warn('⚠️ Error fetching revenue data:', revenueError.message);
        }

        // Get registrations data
        try {
            let registrationsQuery = '';
            let previousRegistrationsQuery = '';

            if (range === 'month') {
                registrationsQuery = `
                    SELECT COUNT(*) as totalRegistrations
                    FROM Users 
                    WHERE YEAR(CreatedAt) = ${currentYear} 
                    AND MONTH(CreatedAt) = ${currentMonth}
                    AND Role = 'member'
                `;

                previousRegistrationsQuery = `
                    SELECT COUNT(*) as previousRegistrations
                    FROM Users 
                    WHERE YEAR(CreatedAt) = ${currentMonth > 1 ? currentYear : currentYear - 1}
                    AND MONTH(CreatedAt) = ${currentMonth > 1 ? currentMonth - 1 : 12}
                    AND Role = 'member'
                `;
            } else if (range === 'year') {
                registrationsQuery = `
                    SELECT COUNT(*) as totalRegistrations
                    FROM Users 
                    WHERE YEAR(CreatedAt) = ${currentYear}
                    AND Role = 'member'
                `;

                previousRegistrationsQuery = `
                    SELECT COUNT(*) as previousRegistrations
                    FROM Users 
                    WHERE YEAR(CreatedAt) = ${currentYear - 1}
                    AND Role = 'member'
                `;
            }

            const [registrationsResult, previousRegistrationsResult] = await Promise.all([
                pool.request().query(registrationsQuery),
                pool.request().query(previousRegistrationsQuery)
            ]);

            const monthlyRegistrationsResult = await pool.request().query(`
                SELECT 
                    MONTH(CreatedAt) as month,
                    COUNT(*) as count,
                    'T' + CAST(MONTH(CreatedAt) as VARCHAR) as period
                FROM Users 
                WHERE YEAR(CreatedAt) = ${currentYear}
                AND Role = 'member'
                GROUP BY MONTH(CreatedAt)
                ORDER BY MONTH(CreatedAt)
            `);

            const currentRegistrations = registrationsResult.recordset[0]?.totalRegistrations || 0;
            const previousRegistrations = previousRegistrationsResult.recordset[0]?.previousRegistrations || 0;
            const registrationsGrowth = previousRegistrations > 0
                ? ((currentRegistrations - previousRegistrations) / previousRegistrations) * 100
                : 0;

            const daysInPeriod = range === 'month' ? new Date(currentYear, currentMonth, 0).getDate() : 365;

            responseData.registrations = {
                total: currentRegistrations,
                monthly: monthlyRegistrationsResult.recordset || [],
                dailyAverage: currentRegistrations / daysInPeriod,
                growth: Math.round(registrationsGrowth * 100) / 100
            };
        } catch (registrationsError) {
            console.warn('⚠️ Error fetching registrations data:', registrationsError.message);
        }

        // Get coaching sessions data (simplified for export)
        try {
            const checkAppointmentsTable = await pool.request().query(`
                SELECT COUNT(*) as tableExists 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'ConsultationAppointments'
            `);

            let currentSessions = 0;
            let completedSessions = 0;
            let scheduledSessions = 0;
            let previousSessions = 0;
            let monthlySessions = [];

            if (checkAppointmentsTable.recordset[0]?.tableExists > 0) {
                let currentSessionsQuery = '';
                let previousSessionsQuery = '';

                if (range === 'month') {
                    currentSessionsQuery = `
                        SELECT 
                            COUNT(*) as totalSessions,
                            COUNT(CASE WHEN Status = 'completed' THEN 1 END) as completedSessions,
                            COUNT(CASE WHEN Status IN ('scheduled', 'confirmed') THEN 1 END) as scheduledSessions
                        FROM ConsultationAppointments 
                        WHERE YEAR(AppointmentDate) = ${currentYear} 
                        AND MONTH(AppointmentDate) = ${currentMonth}
                    `;

                    previousSessionsQuery = `
                        SELECT COUNT(*) as previousSessions
                        FROM ConsultationAppointments 
                        WHERE YEAR(AppointmentDate) = ${currentMonth > 1 ? currentYear : currentYear - 1}
                        AND MONTH(AppointmentDate) = ${currentMonth > 1 ? currentMonth - 1 : 12}
                    `;
                } else if (range === 'year') {
                    currentSessionsQuery = `
                        SELECT 
                            COUNT(*) as totalSessions,
                            COUNT(CASE WHEN Status = 'completed' THEN 1 END) as completedSessions,
                            COUNT(CASE WHEN Status IN ('scheduled', 'confirmed') THEN 1 END) as scheduledSessions
                        FROM ConsultationAppointments 
                        WHERE YEAR(AppointmentDate) = ${currentYear}
                    `;

                    previousSessionsQuery = `
                        SELECT COUNT(*) as previousSessions
                        FROM ConsultationAppointments 
                        WHERE YEAR(AppointmentDate) = ${currentYear - 1}
                    `;
                }

                const [sessionsResult, previousSessionsResult] = await Promise.all([
                    pool.request().query(currentSessionsQuery),
                    pool.request().query(previousSessionsQuery)
                ]);

                const monthlySessionsResult = await pool.request().query(`
                    SELECT 
                        MONTH(AppointmentDate) as month,
                        COUNT(*) as sessions,
                        'T' + CAST(MONTH(AppointmentDate) as VARCHAR) as period
                    FROM ConsultationAppointments 
                    WHERE YEAR(AppointmentDate) = ${currentYear}
                    GROUP BY MONTH(AppointmentDate)
                    ORDER BY MONTH(AppointmentDate)
                `);

                currentSessions = sessionsResult.recordset[0]?.totalSessions || 0;
                completedSessions = sessionsResult.recordset[0]?.completedSessions || 0;
                scheduledSessions = sessionsResult.recordset[0]?.scheduledSessions || 0;
                previousSessions = previousSessionsResult.recordset[0]?.previousSessions || 0;
                monthlySessions = monthlySessionsResult.recordset || [];
            }

            const sessionsGrowth = previousSessions > 0
                ? ((currentSessions - previousSessions) / previousSessions) * 100
                : 0;

            responseData.coachingSessions = {
                total: currentSessions,
                completed: completedSessions,
                scheduled: scheduledSessions,
                monthly: monthlySessions,
                growth: Math.round(sessionsGrowth * 100) / 100
            };
        } catch (coachingError) {
            console.warn('⚠️ Error fetching coaching sessions data:', coachingError.message);
        }

        // Create Excel workbook
        const workbook = XLSX.utils.book_new();

        // Summary Sheet
        const summaryData = [
            ['BÁO CÁO THỐNG KÊ SMOKINGKING'],
            [`Thời gian: ${range === 'month' ? `Tháng ${currentMonth}/${currentYear}` : `Năm ${currentYear}`}`],
            [`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`],
            [''],
            ['CHỈ SỐ TỔNG QUAN'],
            ['Chỉ số', 'Giá trị hiện tại', 'Tăng trưởng (%)', 'Ghi chú'],
            ['Tổng doanh thu', responseData.revenue.total.toLocaleString('vi-VN') + ' VNĐ', responseData.revenue.growth, 'So với kỳ trước'],
            ['Đăng ký mới', responseData.registrations.total, responseData.registrations.growth, 'Thành viên mới'],
            ['Buổi coaching', responseData.coachingSessions.total, responseData.coachingSessions.growth, 'Tổng số buổi'],
            ['Buổi hoàn thành', responseData.coachingSessions.completed, '', 'Coaching đã hoàn thành'],
            ['Buổi đã lên lịch', responseData.coachingSessions.scheduled, '', 'Coaching sắp diễn ra'],
            [''],
            ['THÔNG TIN CHI TIẾT'],
            ['Doanh thu trung bình/ngày', Math.round(responseData.revenue.dailyAverage).toLocaleString('vi-VN') + ' VNĐ'],
            ['Đăng ký trung bình/ngày', Math.round(responseData.registrations.dailyAverage) + ' người'],
            ['Tỷ lệ hoàn thành coaching', responseData.coachingSessions.total > 0 ? Math.round((responseData.coachingSessions.completed / responseData.coachingSessions.total) * 100) + '%' : '0%']
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan');

        // Revenue Sheet
        const revenueData = [
            ['DOANH THU THEO THỜI GIAN'],
            [''],
            ['Tháng', 'Doanh thu (VNĐ)', 'Ghi chú'],
            ...responseData.revenue.monthly.map(item => [
                `Tháng ${item.month}`,
                item.amount.toLocaleString('vi-VN'),
                ''
            ])
        ];

        const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
        XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Doanh thu');

        // Registrations Sheet
        const registrationsData = [
            ['ĐĂNG KÝ MỚI THEO THỜI GIAN'],
            [''],
            ['Tháng', 'Số lượng đăng ký', 'Ghi chú'],
            ...responseData.registrations.monthly.map(item => [
                `Tháng ${item.month}`,
                item.count,
                ''
            ])
        ];

        const registrationsSheet = XLSX.utils.aoa_to_sheet(registrationsData);
        XLSX.utils.book_append_sheet(workbook, registrationsSheet, 'Đăng ký');

        // Coaching Sessions Sheet
        const coachingData = [
            ['BUỔI COACHING THEO THỜI GIAN'],
            [''],
            ['Tháng', 'Số buổi', 'Ghi chú'],
            ...responseData.coachingSessions.monthly.map(item => [
                `Tháng ${item.month}`,
                item.sessions,
                ''
            ])
        ];

        const coachingSheet = XLSX.utils.aoa_to_sheet(coachingData);
        XLSX.utils.book_append_sheet(workbook, coachingSheet, 'Coaching');

        // Generate Excel buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set response headers
        const fileName = `BaoCao_SmokeKing_${range}_${currentYear}${range === 'month' ? `_${currentMonth}` : ''}_${Date.now()}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', excelBuffer.length);

        console.log('✅ Excel file generated successfully:', fileName);

        // Send the Excel file
        res.send(excelBuffer);

    } catch (error) {
        console.error('❌ Export reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xuất báo cáo Excel: ' + error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ==================== USER MANAGEMENT ====================

// Get all users for admin
router.get('/users', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                u.UserID, 
                u.Email, 
                u.FirstName, 
                u.LastName, 
                CONCAT(u.FirstName, ' ', u.LastName) as FullName,
                u.Role, 
                u.IsActive, 
                u.CreatedAt,
                u.LastLoginAt,
                u.Avatar,
                u.PhoneNumber,
                COUNT(ua.AchievementID) as AchievementCount
            FROM Users u
            LEFT JOIN UserAchievements ua ON u.UserID = ua.UserID
            WHERE u.Role IN ('guest', 'member', 'coach')
            GROUP BY u.UserID, u.Email, u.FirstName, u.LastName, u.Role, u.IsActive, u.CreatedAt, u.LastLoginAt, u.Avatar, u.PhoneNumber
            ORDER BY u.CreatedAt DESC
        `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách người dùng'
        });
    }
});

// ==================== ACHIEVEMENT MANAGEMENT ====================

// Reset user achievements (admin only)
router.post('/reset-user-achievements', protect, authorize('admin'), async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Get user info first
        const userResult = await pool.request()
            .input('UserID', userId)
            .query('SELECT FirstName, LastName, Email FROM Users WHERE UserID = @UserID');

        if (userResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.recordset[0];

        // Delete user's achievements
        const deleteResult = await pool.request()
            .input('UserID', userId)
            .query('DELETE FROM UserAchievements WHERE UserID = @UserID');

        // Check and re-award eligible achievements using achievement service
        const AchievementService = require('../services/achievementService');
        const recheckResult = await AchievementService.checkAndAwardAchievements(userId);

        res.json({
            success: true,
            message: `Đã reset và kiểm tra lại thành tích cho ${user.FirstName} ${user.LastName}`,
            data: {
                removedCount: deleteResult.rowsAffected[0],
                newAchievements: recheckResult.newAchievements || [],
                user: user
            }
        });
    } catch (error) {
        console.error('Error resetting user achievements:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi reset thành tích người dùng'
        });
    }
});

// Reset all achievements (admin only) 
router.post('/reset-all-achievements', protect, authorize('admin'), async (req, res) => {
    try {
        console.log('🔄 ADMIN: Resetting ALL user achievements...');

        // Delete all user achievements
        const deleteResult = await pool.request()
            .query('DELETE FROM UserAchievements');

        console.log(`✅ Cleared ${deleteResult.rowsAffected[0]} user achievements`);

        // Get all active users to re-check achievements
        const usersResult = await pool.request()
            .query(`
                SELECT UserID, FirstName, LastName, Email 
                FROM Users 
                WHERE Role IN ('member', 'guest') AND IsActive = 1
            `);

        const users = usersResult.recordset;
        console.log(`🔍 Re-checking achievements for ${users.length} users...`);

        // Re-check achievements for all users
        const AchievementService = require('../services/achievementService');
        let totalNewAchievements = 0;

        for (const user of users) {
            try {
                const result = await AchievementService.checkAndAwardAchievements(user.UserID);
                if (result.newAchievements) {
                    totalNewAchievements += result.newAchievements.length;
                    console.log(`👤 ${user.FirstName} ${user.LastName}: ${result.newAchievements.length} achievements re-awarded`);
                }
            } catch (error) {
                console.error(`❌ Error checking achievements for user ${user.UserID}:`, error.message);
            }
        }

        console.log(`🏆 Total achievements re-awarded: ${totalNewAchievements}`);

        res.json({
            success: true,
            message: `Đã reset tất cả thành tích và kiểm tra lại cho ${users.length} người dùng`,
            data: {
                totalUsersProcessed: users.length,
                totalAchievementsRemoved: deleteResult.rowsAffected[0],
                totalAchievementsReAwarded: totalNewAchievements
            }
        });
    } catch (error) {
        console.error('Error resetting all achievements:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi reset tất cả thành tích'
        });
    }
});

// Get user achievements (admin only)
router.get('/user-achievements/:userId', protect, authorize('admin'), async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    a.AchievementID,
                    a.Name,
                    a.Description,
                    a.IconURL,
                    a.Category,
                    a.MilestoneDays,
                    a.SavedMoney,
                    a.Difficulty,
                    a.Points,
                    ua.EarnedAt
                FROM UserAchievements ua
                JOIN Achievements a ON ua.AchievementID = a.AchievementID
                WHERE ua.UserID = @UserID
                ORDER BY ua.EarnedAt DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error getting user achievements:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thành tích người dùng'
        });
    }
});

// Get admin notifications
router.get('/notifications', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT 
                    NotificationID,
                    Type,
                    Title,
                    Message,
                    RelatedID,
                    IsRead,
                    CreatedAt
                FROM Notifications
                WHERE UserID = @UserID
                ORDER BY CreatedAt DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error getting admin notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông báo'
        });
    }
});

// Mark admin notification as read
router.put('/notifications/:notificationId/read', protect, authorize('admin'), async (req, res) => {
    try {
        const { notificationId } = req.params;

        const result = await pool.request()
            .input('NotificationID', notificationId)
            .input('UserID', req.user.UserID)
            .query(`
                UPDATE Notifications
                SET IsRead = 1
                OUTPUT INSERTED.*
                WHERE NotificationID = @NotificationID AND UserID = @UserID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Thông báo không tồn tại'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Error marking admin notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đánh dấu thông báo đã đọc'
        });
    }
});

// Get unread admin notifications count
router.get('/notifications/unread-count', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT COUNT(*) as UnreadCount
                FROM Notifications
                WHERE UserID = @UserID AND IsRead = 0
            `);

        res.json({
            success: true,
            data: {
                unreadCount: result.recordset[0].UnreadCount || 0
            }
        });
    } catch (error) {
        console.error('Error getting admin unread notification count:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy số thông báo chưa đọc'
        });
    }
});

// Mark all admin notifications as read
router.put('/notifications/read-all', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                UPDATE Notifications
                SET IsRead = 1
                OUTPUT INSERTED.*
                WHERE UserID = @UserID AND IsRead = 0
            `);

        res.json({
            success: true,
            message: `Đã đánh dấu ${result.recordset.length} thông báo đã đọc`,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error marking all admin notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đánh dấu tất cả thông báo đã đọc'
        });
    }
});

// Helper function to notify all admins
async function notifyAllAdmins(title, message, type, relatedID = null) {
    try {
        // Get all admin users
        const adminResult = await pool.request().query(`
            SELECT UserID FROM Users WHERE Role = 'admin'
        `);

        // Create notifications for all admins
        for (const admin of adminResult.recordset) {
            await pool.request()
                .input('UserID', admin.UserID)
                .input('Title', title)
                .input('Message', message)
                .input('Type', type)
                .input('RelatedID', relatedID)
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type, RelatedID)
                    VALUES (@UserID, @Title, @Message, @Type, @RelatedID)
                `);
        }

        console.log(`📢 Notified ${adminResult.recordset.length} admins: ${title}`);
    } catch (error) {
        console.error('Error notifying admins:', error);
    }
}

// Confirm transfer sent by admin
router.post('/confirm-transfer/:cancellationId', protect, authorize('admin'), async (req, res) => {
    try {
        const { cancellationId } = req.params;
        const { adminNotes } = req.body;

        console.log('🔄 Admin confirming transfer for cancellation:', cancellationId);

        // Start transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Check if cancellation request exists and is approved
            const cancellationResult = await transaction.request()
                .input('CancellationRequestID', cancellationId)
                .query(`
                    SELECT cr.*, um.*, mp.Name as PlanName, u.FirstName, u.LastName, u.Email
                    FROM CancellationRequests cr
                    JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
                    JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                    JOIN Users u ON cr.UserID = u.UserID
                    WHERE cr.CancellationRequestID = @CancellationRequestID 
                    AND cr.Status = 'approved' 
                    AND cr.RefundApproved = 1
                    AND cr.TransferConfirmed = 0
                `);

            if (cancellationResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy yêu cầu hủy gói phù hợp hoặc chuyển khoản đã được xác nhận'
                });
            }

            const cancellation = cancellationResult.recordset[0];

            // Update cancellation request - mark transfer as confirmed
            await transaction.request()
                .input('CancellationRequestID', cancellationId)
                .input('AdminNotes', (cancellation.AdminNotes || '') + `\n[${new Date().toLocaleString('vi-VN')}] Admin xác nhận đã chuyển tiền. ${adminNotes || ''}`)
                .query(`
                    UPDATE CancellationRequests
                    SET TransferConfirmed = 1,
                        TransferDate = GETDATE(),
                        Status = 'transfer_confirmed'
                    WHERE CancellationRequestID = @CancellationRequestID
                `);

            // Create notification for user
            await transaction.request()
                .input('UserID', cancellation.UserID)
                .input('Title', 'Admin đã xác nhận chuyển tiền')
                .input('Message', `Admin đã xác nhận chuyển tiền hoàn trả ${cancellation.RefundAmount?.toLocaleString('vi-VN')} VNĐ cho gói ${cancellation.PlanName} vào tài khoản ${cancellation.BankName} - ${cancellation.BankAccountNumber}. Vui lòng kiểm tra và xác nhận khi nhận được tiền.`)
                .input('Type', 'transfer_confirmed')
                .input('RelatedID', cancellationId)
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type, RelatedID)
                    VALUES (@UserID, @Title, @Message, @Type, @RelatedID)
                `);

            await transaction.commit();

            console.log('✅ Transfer confirmed successfully');

            res.json({
                success: true,
                message: 'Đã xác nhận chuyển tiền thành công',
                data: {
                    cancellationId: cancellationId,
                    transferDate: new Date(),
                    refundAmount: cancellation.RefundAmount,
                    bankInfo: {
                        bankName: cancellation.BankName,
                        accountNumber: cancellation.BankAccountNumber,
                        accountHolder: cancellation.AccountHolderName
                    }
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error confirming transfer:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xác nhận chuyển tiền'
        });
    }
});



// Survey Management Routes

/**
 * @route   GET /api/admin/surveys
 * @desc    Get all user surveys with pagination
 * @access  Private/Admin
 */
router.get('/surveys', protect, authorize('admin'), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            orderBy = 'SubmittedAt',
            order = 'desc'
        } = req.query;

        const offset = (page - 1) * limit;

        // Build search condition
        let searchCondition = '';
        if (search) {
            searchCondition = `
                AND (u.FirstName LIKE @search 
                OR u.LastName LIKE @search 
                OR u.Email LIKE @search)
            `;
        }

        // Get total count
        const countResult = await pool.request()
            .input('search', `%${search}%`)
            .query(`
                SELECT COUNT(DISTINCT usa.UserID) as total
                FROM UserSurveyAnswers usa
                INNER JOIN Users u ON usa.UserID = u.UserID
                WHERE 1=1 ${searchCondition}
            `);

        const total = countResult.recordset[0].total;

        // Get survey data with user information
        const result = await pool.request()
            .input('search', `%${search}%`)
            .input('offset', offset)
            .input('limit', parseInt(limit))
            .query(`
                SELECT 
                    u.UserID,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.Role,
                    u.CreatedAt as UserCreatedAt,
                    MAX(usa.SubmittedAt) as LastSurveyUpdate,
                    COUNT(usa.QuestionID) as TotalAnswers
                FROM UserSurveyAnswers usa
                INNER JOIN Users u ON usa.UserID = u.UserID
                WHERE 1=1 ${searchCondition}
                GROUP BY u.UserID, u.FirstName, u.LastName, u.Email, u.Role, u.CreatedAt
                ORDER BY LastSurveyUpdate ${order}
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

        res.json({
            surveys: result.recordset,
            pagination: {
                current: parseInt(page),
                pageSize: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting surveys:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/admin/surveys/:userId
 * @desc    Get specific user's survey answers
 * @access  Private/Admin
 */
router.get('/surveys/:userId', protect, authorize('admin'), async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user information
        const userResult = await pool.request()
            .input('userId', userId)
            .query(`
                SELECT UserID, FirstName, LastName, Email, Role, CreatedAt
                FROM Users
                WHERE UserID = @userId
            `);

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult.recordset[0];

        // Get user's survey answers
        const answersResult = await pool.request()
            .input('userId', userId)
            .query(`
                SELECT 
                    sq.QuestionID,
                    sq.QuestionText,
                    'text' as QuestionType,
                    'General' as Category,
                    usa.Answer as AnswerText,
                    usa.SubmittedAt,
                    usa.SubmittedAt as UpdatedAt
                FROM SurveyQuestions sq
                LEFT JOIN UserSurveyAnswers usa ON sq.QuestionID = usa.QuestionID AND usa.UserID = @userId
                ORDER BY sq.QuestionID
            `);

        res.json({
            user: user,
            answers: answersResult.recordset
        });
    } catch (error) {
        console.error('Error getting user survey:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/admin/survey-statistics
 * @desc    Get survey statistics for admin dashboard
 * @access  Private/Admin
 */
router.get('/survey-statistics', protect, authorize('admin'), async (req, res) => {
    try {
        // Get overall survey statistics
        const statsResult = await pool.request()
            .query(`
                SELECT 
                    COUNT(DISTINCT usa.UserID) as TotalRespondents,
                    COUNT(sq.QuestionID) as TotalQuestions,
                    COUNT(usa.AnswerID) as TotalAnswers,
                    AVG(CAST(answered_questions.AnswerCount as FLOAT)) as AvgAnswersPerUser
                FROM SurveyQuestions sq
                CROSS JOIN (SELECT DISTINCT UserID FROM UserSurveyAnswers) users
                LEFT JOIN UserSurveyAnswers usa ON sq.QuestionID = usa.QuestionID AND users.UserID = usa.UserID
                CROSS JOIN (
                    SELECT UserID, COUNT(QuestionID) as AnswerCount
                    FROM UserSurveyAnswers
                    GROUP BY UserID
                ) answered_questions
            `);

        // Get completion rate by question
        const questionStatsResult = await pool.request()
            .query(`
                SELECT 
                    sq.QuestionID,
                    sq.QuestionText,
                    sq.Category,
                    COUNT(usa.AnswerID) as ResponseCount,
                    (COUNT(usa.AnswerID) * 100.0 / (SELECT COUNT(DISTINCT UserID) FROM UserSurveyAnswers)) as ResponseRate
                FROM SurveyQuestions sq
                LEFT JOIN UserSurveyAnswers usa ON sq.QuestionID = usa.QuestionID
                GROUP BY sq.QuestionID, sq.QuestionText, sq.Category
                ORDER BY sq.QuestionID
            `);

        // Get recent survey activities
        const recentActivitiesResult = await pool.request()
            .query(`
                SELECT TOP 10
                    u.FirstName + ' ' + u.LastName as UserName,
                    u.Email,
                    sq.QuestionText,
                    usa.Answer as AnswerText,
                    usa.SubmittedAt
                FROM UserSurveyAnswers usa
                INNER JOIN Users u ON usa.UserID = u.UserID
                INNER JOIN SurveyQuestions sq ON usa.QuestionID = sq.QuestionID
                ORDER BY usa.SubmittedAt DESC
            `);

        res.json({
            statistics: statsResult.recordset[0],
            questionStats: questionStatsResult.recordset,
            recentActivities: recentActivitiesResult.recordset
        });
    } catch (error) {
        console.error('Error getting survey statistics:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Confirm cancellation by admin
router.post('/confirm-cancellation/:cancellationId', protect, authorize('admin'), async (req, res) => {
    try {
        const { cancellationId } = req.params;

        console.log('🔍 Processing cancellation confirmation for ID:', cancellationId);

        // Start transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Get cancellation request details
            const cancellationResult = await transaction.request()
                .input('CancellationRequestID', cancellationId)
                .query(`
                    SELECT 
                        cr.*,
                        um.UserID,
                        um.PlanID,
                        um.MembershipID,
                        mp.Name as PlanName,
                        p.Amount as OriginalAmount,
                        p.PaymentID
                    FROM CancellationRequests cr
                    JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
                    JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                    LEFT JOIN Payments p ON cr.PaymentID = p.PaymentID
                    WHERE cr.CancellationRequestID = @CancellationRequestID AND cr.Status = 'pending'
                `);

            if (cancellationResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy yêu cầu hủy gói hoặc yêu cầu đã được xử lý'
                });
            }

            const cancellation = cancellationResult.recordset[0];
            console.log('📋 Cancellation details:', cancellation);

            // Update cancellation request status
            await transaction.request()
                .input('CancellationRequestID', cancellationId)
                .input('ProcessedByUserID', req.user.id)
                .query(`
                    UPDATE CancellationRequests
                    SET Status = 'approved',
                        ProcessedByUserID = @ProcessedByUserID,
                        ProcessedAt = GETDATE(),
                        AdminNotes = 'Yêu cầu hủy gói được admin xác nhận'
                    WHERE CancellationRequestID = @CancellationRequestID
                `);

            // Update membership status to cancelled
            await transaction.request()
                .input('MembershipID', cancellation.MembershipID)
                .query(`
                    UPDATE UserMemberships
                    SET Status = 'cancelled',
                        EndDate = GETDATE()
                    WHERE MembershipID = @MembershipID
                `);

            // Update payment status to cancelled if exists
            if (cancellation.PaymentID) {
                await transaction.request()
                    .input('PaymentID', cancellation.PaymentID)
                    .query(`
                        UPDATE Payments
                        SET Status = 'cancelled' 
                        WHERE PaymentID = @PaymentID
                    `);
            }

            // Update user role back to guest
            await transaction.request()
                .input('UserID', cancellation.UserID)
                .query(`
                    UPDATE Users
                    SET Role = 'guest'
                    WHERE UserID = @UserID
                `);

            // Create notification for user
            await transaction.request()
                .input('UserID', cancellation.UserID)
                .input('Title', 'Yêu cầu hủy gói đã được xác nhận')
                .input('Message', `Yêu cầu hủy gói ${cancellation.PlanName} của bạn đã được admin xác nhận. Số tiền hoàn lại: ${cancellation.RefundAmount?.toLocaleString() || 0} VNĐ sẽ được chuyển vào tài khoản ngân hàng của bạn trong 3-5 ngày làm việc.`)
                .input('Type', 'cancellation')
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type)
                    VALUES (@UserID, @Title, @Message, @Type)
                `);

            await transaction.commit();

            console.log('✅ Cancellation confirmed successfully');

            res.json({
                success: true,
                message: 'Xác nhận hủy gói thành công',
                data: {
                    cancellationId: cancellationId,
                    refundAmount: cancellation.RefundAmount,
                    planName: cancellation.PlanName
                }
            });

        } catch (transactionError) {
            await transaction.rollback();
            throw transactionError;
        }

    } catch (error) {
        console.error('❌ Error confirming cancellation:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xác nhận hủy gói',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Approve a cancellation request
router.post('/approve-cancellation/:requestId', protect, authorize('admin'), async (req, res) => {
    try {
        const { requestId } = req.params;
        const { approveRefund, refundAmount, adminNotes } = req.body;

        console.log('🔍 Admin approving cancellation request:', requestId);

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Update cancellation request status
            await transaction.request()
                .input('RequestId', requestId)
                .input('AdminNotes', adminNotes || '')
                .input('ApprovedRefundAmount', approveRefund ? (refundAmount || 0) : 0)
                .input('RefundApproved', approveRefund ? 1 : 0)
                .input('ProcessedBy', req.user.UserID || req.user.id)
                .query(`
                    UPDATE CancellationRequests 
                    SET Status = 'approved',
                        AdminNotes = @AdminNotes,
                        ApprovedRefundAmount = @ApprovedRefundAmount,
                        RefundApproved = @RefundApproved,
                        ProcessedBy = @ProcessedBy,
                        ProcessedAt = GETDATE()
                    WHERE CancellationRequestID = @RequestId
                `);

            // Get cancellation request details
            const cancelResult = await transaction.request()
                .input('RequestId', requestId)
                .query(`
                    SELECT cr.*, um.UserID, um.PlanID, um.MembershipID
                    FROM CancellationRequests cr
                    JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
                    WHERE cr.CancellationRequestID = @RequestId
                `);

            if (cancelResult.recordset.length === 0) {
                throw new Error('Không tìm thấy yêu cầu hủy gói');
            }

            const cancellation = cancelResult.recordset[0];

            // Update membership status to cancelled
            await transaction.request()
                .input('MembershipId', cancellation.MembershipID)
                .query(`
                    UPDATE UserMemberships 
                    SET Status = 'cancelled',
                        CancellationDate = GETDATE(),
                        CancellationReason = 'Admin approved cancellation request'
                    WHERE MembershipID = @MembershipId
                `);

            await transaction.commit();

            res.json({
                success: true,
                message: 'Đã chấp nhận yêu cầu hủy gói thành công'
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('❌ Error approving cancellation:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi chấp nhận yêu cầu hủy gói'
        });
    }
});

// Reject a cancellation request
router.post('/reject-cancellation/:requestId', protect, authorize('admin'), async (req, res) => {
    try {
        const { requestId } = req.params;
        const { adminNotes } = req.body;

        console.log('🔍 Admin rejecting cancellation request:', requestId);

        await pool.request()
            .input('RequestId', requestId)
            .input('AdminNotes', adminNotes || '')
            .input('ProcessedByUserID', req.user.UserID || req.user.id)
            .query(`
                UPDATE CancellationRequests 
                SET Status = 'rejected',
                    AdminNotes = @AdminNotes,
                    ProcessedByUserID = @ProcessedByUserID,
                    ProcessedAt = GETDATE()
                WHERE CancellationRequestID = @RequestId
            `);

        res.json({
            success: true,
            message: 'Đã từ chối yêu cầu hủy gói'
        });

    } catch (error) {
        console.error('❌ Error rejecting cancellation:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi từ chối yêu cầu hủy gói'
        });
    }
});

// Test approve cancellation endpoint  
router.post('/test-approve-cancellation/:cancellationId', protect, authorize('admin'), async (req, res) => {
    try {
        const { cancellationId } = req.params;
        const { approveRefund, refundAmount, adminNotes } = req.body;

        console.log('🔍 Testing approve cancellation:', {
            cancellationId,
            approveRefund,
            refundAmount,
            adminNotes,
            userId: req.user.id
        });

        // Simple query to check if request exists
        const result = await pool.request()
            .input('CancellationRequestID', cancellationId)
            .query(`
                SELECT * FROM CancellationRequests
                WHERE CancellationRequestID = @CancellationRequestID
            `);

        console.log('🔍 Found cancellation request:', result.recordset[0]);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu hủy gói'
            });
        }

        res.json({
            success: true,
            message: 'Test successful',
            data: {
                cancellationId,
                found: result.recordset[0],
                requestData: { approveRefund, refundAmount, adminNotes }
            }
        });

    } catch (error) {
        console.error('❌ Test approve cancellation error:', error);
        res.status(500).json({
            success: false,
            message: 'Test error',
            error: error.message
        });
    }
});

// Simple debug endpoint to test cancellation update
router.post('/debug-approve/:cancellationId', protect, authorize('admin'), async (req, res) => {
    try {
        const { cancellationId } = req.params;
        const { approveRefund, refundAmount, adminNotes } = req.body;

        console.log('🔍 Debug approve:', { cancellationId, approveRefund, refundAmount, adminNotes });

        // Step 1: Check if request exists
        const checkResult = await pool.request()
            .input('CancellationRequestID', cancellationId)
            .query(`
                SELECT * FROM CancellationRequests
                WHERE CancellationRequestID = @CancellationRequestID
            `);

        console.log('🔍 Found request:', checkResult.recordset[0]);

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu hủy gói'
            });
        }

        // Step 2: Simple status update only
        await pool.request()
            .input('CancellationRequestID', cancellationId)
            .input('AdminNotes', adminNotes || 'Debug test')
            .query(`
                UPDATE CancellationRequests
                SET Status = 'approved',
                    ProcessedAt = GETDATE(),
                    AdminNotes = @AdminNotes
                WHERE CancellationRequestID = @CancellationRequestID
            `);

        console.log('✅ Status updated successfully');

        res.json({
            success: true,
            message: 'Debug approve successful - only status updated',
            data: { cancellationId, step: 'status_only' }
        });

    } catch (error) {
        console.error('❌ Debug approve error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug error',
            error: error.message
        });
    }
});

module.exports = router; 