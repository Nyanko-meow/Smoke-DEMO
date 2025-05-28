const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { createUser } = require('../database/db.utils');
const { profileUpdateValidation } = require('../middleware/validator.middleware');

// Get current user's role
router.get('/role', auth, async (req, res) => {
    try {
        res.json({
            success: true,
            role: req.user.Role,
            isActivated: req.user.IsActive === 1
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin vai trò người dùng'
        });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        // Get user basic info
        const userResult = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT 
                    u.UserID, 
                    u.Email, 
                    u.FirstName, 
                    u.LastName, 
                    u.Role, 
                    u.PhoneNumber, 
                    u.Address, 
                    u.Avatar, 
                    u.IsActive,
                    u.EmailVerified,
                    u.CreatedAt,
                    u.LastLoginAt,
                    m.MembershipID, 
                    m.PlanID, 
                    m.StartDate, 
                    m.EndDate, 
                    m.Status as MembershipStatus,
                    mp.Name as PlanName, 
                    mp.Description as PlanDescription, 
                    mp.Price as PlanPrice, 
                    mp.Duration as PlanDuration,
                    DATEDIFF(day, GETDATE(), m.EndDate) as DaysRemaining
                FROM Users u
                LEFT JOIN UserMemberships m ON u.UserID = m.UserID AND m.Status = 'active' AND m.EndDate > GETDATE()
                LEFT JOIN MembershipPlans mp ON m.PlanID = mp.PlanID
                WHERE u.UserID = @UserID
            `);

        const user = userResult.recordset[0];

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        // Log address field for debugging
        console.log('User profile - Address field:', {
            userId: user.UserID,
            address: user.Address,
            type: typeof user.Address
        });

        // Get smoking status
        const smokingStatusQuery = await pool.request()
            .input('UserID', req.user.UserID)
            .query('SELECT * FROM SmokingStatus WHERE UserID = @UserID');

        const smokingStatus = smokingStatusQuery.recordset[0] || null;

        // Get active quit plan
        const quitPlanQuery = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT * FROM QuitPlans 
                WHERE UserID = @UserID 
                AND Status = 'active'
                ORDER BY CreatedAt DESC
            `);

        const activePlan = quitPlanQuery.recordset[0] || null;

        // Get recent progress
        const progressQuery = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT TOP 7 * FROM ProgressTracking
                WHERE UserID = @UserID
                ORDER BY Date DESC
            `);

        const recentProgress = progressQuery.recordset || [];

        // Get achievement count
        const achievementQuery = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT COUNT(*) as AchievementCount
                FROM UserAchievements
                WHERE UserID = @UserID
            `);

        const achievementCount = achievementQuery.recordset[0].AchievementCount || 0;

        // Get latest health metrics
        const healthMetricsQuery = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT TOP 1 *
                FROM HealthMetrics
                WHERE UserID = @UserID
                ORDER BY RecordedDate DESC
            `);

        const latestHealthMetrics = healthMetricsQuery.recordset[0] || null;

        // Format the response
        const userData = {
            userInfo: {
                id: user.UserID,
                email: user.Email,
                firstName: user.FirstName,
                lastName: user.LastName,
                fullName: `${user.FirstName} ${user.LastName}`,
                role: user.Role,
                avatar: user.Avatar,
                phoneNumber: user.PhoneNumber,
                address: user.Address || null, // Ensure address is properly included
                isActive: user.IsActive === 1,
                emailVerified: user.EmailVerified === 1,
                createdAt: user.CreatedAt ? user.CreatedAt.toISOString() : null, // Format as ISO string for consistent handling
                lastLoginAt: user.LastLoginAt ? user.LastLoginAt.toISOString() : null
            },
            membership: user.MembershipID ? {
                id: user.MembershipID,
                planId: user.PlanID,
                planName: user.PlanName,
                planDescription: user.PlanDescription,
                planPrice: user.PlanPrice,
                planDuration: user.PlanDuration,
                startDate: user.StartDate,
                endDate: user.EndDate,
                daysRemaining: user.DaysRemaining,
                status: user.MembershipStatus
            } : null,
            smokingStatus: smokingStatus,
            activePlan: activePlan,
            recentProgress: recentProgress,
            achievementCount: achievementCount,
            healthMetrics: latestHealthMetrics,
            isSubscribed: user.MembershipID !== null
        };

        res.json({
            success: true,
            data: userData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin người dùng',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update user profile
router.put('/profile', auth, profileUpdateValidation, async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, address } = req.body;

        console.log('Profile update request from user:', req.user.UserID);
        console.log('Update data:', { firstName, lastName, phoneNumber, address });

        // Validate required fields
        if (!firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Tên và họ không được để trống'
            });
        }

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('FirstName', firstName)
            .input('LastName', lastName)
            .input('PhoneNumber', phoneNumber || null)
            .input('Address', address || null)
            .query(`
        UPDATE Users
        SET FirstName = @FirstName,
            LastName = @LastName,
            PhoneNumber = @PhoneNumber,
            Address = @Address,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.FirstName, INSERTED.LastName, 
               INSERTED.Role, INSERTED.PhoneNumber, INSERTED.Address, INSERTED.Avatar
        WHERE UserID = @UserID
      `);

        if (result.recordset.length === 0) {
            console.error('Profile update failed: No rows were updated');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng hoặc không thể cập nhật thông tin'
            });
        }

        console.log('Profile update successful:', result.recordset[0]);

        res.json({
            success: true,
            message: 'Thông tin đã được cập nhật thành công',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thông tin người dùng',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update avatar
router.put('/avatar', auth, async (req, res) => {
    try {
        const { avatar } = req.body;

        if (!avatar) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đường dẫn ảnh đại diện'
            });
        }

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('Avatar', avatar)
            .query(`
        UPDATE Users
        SET Avatar = @Avatar,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.UserID, INSERTED.Avatar
        WHERE UserID = @UserID
      `);

        res.json({
            success: true,
            message: 'Ảnh đại diện đã được cập nhật',
            data: {
                avatar: result.recordset[0].Avatar
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật ảnh đại diện'
        });
    }
});

// Get user's smoking status
router.get('/smoking-status', auth, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query('SELECT * FROM SmokingStatus WHERE UserID = @UserID');

        res.json({
            success: true,
            data: result.recordset[0] || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting smoking status'
        });
    }
});

// Update smoking status
router.put('/smoking-status', auth, async (req, res) => {
    try {
        const { cigarettesPerDay, cigarettePrice, smokingFrequency } = req.body;

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('CigarettesPerDay', cigarettesPerDay)
            .input('CigarettePrice', cigarettePrice)
            .input('SmokingFrequency', smokingFrequency)
            .query(`
        MERGE INTO SmokingStatus AS target
        USING (SELECT @UserID AS UserID) AS source
        ON target.UserID = source.UserID
        WHEN MATCHED THEN
          UPDATE SET
            CigarettesPerDay = @CigarettesPerDay,
            CigarettePrice = @CigarettePrice,
            SmokingFrequency = @SmokingFrequency,
            LastUpdated = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (UserID, CigarettesPerDay, CigarettePrice, SmokingFrequency)
          VALUES (@UserID, @CigarettesPerDay, @CigarettePrice, @SmokingFrequency)
        OUTPUT INSERTED.*;
      `);

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error updating smoking status'
        });
    }
});

// Get user's achievements
router.get('/achievements', auth, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT a.*, ua.EarnedDate
        FROM UserAchievements ua
        JOIN Achievements a ON ua.AchievementID = a.AchievementID
        WHERE ua.UserID = @UserID
        ORDER BY ua.EarnedDate DESC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting achievements'
        });
    }
});

// Get user's progress
router.get('/progress', auth, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT *
        FROM ProgressTracking
        WHERE UserID = @UserID
        ORDER BY Date DESC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting progress'
        });
    }
});

// Add progress entry
router.post('/progress', auth, async (req, res) => {
    try {
        const { date, cigarettesSmoked, cravingLevel, emotionNotes, healthNotes } = req.body;

        // Validate input
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Ngày là bắt buộc'
            });
        }

        if (cigarettesSmoked === null || cigarettesSmoked === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Số điếu hút là bắt buộc'
            });
        }

        if (!cravingLevel || cravingLevel < 1 || cravingLevel > 10) {
            return res.status(400).json({
                success: false,
                message: 'Mức độ thèm thuốc phải từ 1-10'
            });
        }

        // Get user's smoking info for calculations
        const smokingInfo = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT TOP 1 CigarettesPerDay, CigarettePrice 
                FROM SmokingStatus 
                WHERE UserID = @UserID 
                ORDER BY LastUpdated DESC
            `);

        let moneySaved = 0;
        let daysSmokeFree = 0;

        if (smokingInfo.recordset.length > 0) {
            const { CigarettesPerDay, CigarettePrice } = smokingInfo.recordset[0];

            // Calculate money saved for this day
            const cigarettesNotSmoked = Math.max(0, CigarettesPerDay - cigarettesSmoked);
            moneySaved = cigarettesNotSmoked * CigarettePrice;

            // Calculate total smoke-free days
            const smokeFreeQuery = await pool.request()
                .input('UserID', req.user.UserID)
                .query(`
                    SELECT COUNT(*) as SmokeFreeDays
                    FROM ProgressTracking 
                    WHERE UserID = @UserID AND CigarettesSmoked = 0
                `);

            daysSmokeFree = smokeFreeQuery.recordset[0].SmokeFreeDays;
            if (cigarettesSmoked === 0) {
                daysSmokeFree += 1; // Add current day if smoke-free
            }
        }

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('Date', date)
            .input('CigarettesSmoked', cigarettesSmoked)
            .input('CravingLevel', cravingLevel)
            .input('EmotionNotes', emotionNotes || '')
            .input('HealthNotes', healthNotes || '')
            .input('MoneySaved', moneySaved)
            .input('DaysSmokeFree', daysSmokeFree)
            .query(`
                MERGE INTO ProgressTracking AS target
                USING (SELECT @UserID AS UserID, @Date AS Date) AS source
                ON target.UserID = source.UserID AND target.Date = source.Date
                WHEN MATCHED THEN
                    UPDATE SET
                        CigarettesSmoked = @CigarettesSmoked,
                        CravingLevel = @CravingLevel,
                        EmotionNotes = @EmotionNotes,
                        HealthNotes = @HealthNotes,
                        MoneySaved = @MoneySaved,
                        DaysSmokeFree = @DaysSmokeFree,
                        CreatedAt = GETDATE()
                WHEN NOT MATCHED THEN
                    INSERT (UserID, Date, CigarettesSmoked, CravingLevel, EmotionNotes, HealthNotes, MoneySaved, DaysSmokeFree, CreatedAt)
                    VALUES (@UserID, @Date, @CigarettesSmoked, @CravingLevel, @EmotionNotes, @HealthNotes, @MoneySaved, @DaysSmokeFree, GETDATE())
                OUTPUT INSERTED.*;
            `);

        res.status(201).json({
            success: true,
            data: result.recordset[0],
            message: 'Đã ghi nhận tiến trình thành công'
        });
    } catch (error) {
        console.error('Error adding progress:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi ghi nhận tiến trình. Vui lòng thử lại.'
        });
    }
});

// Admin only routes
router.get('/', auth, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.request()
            .query(`
        SELECT UserID, Email, FirstName, LastName, Role, CreatedAt
        FROM Users
        ORDER BY CreatedAt DESC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting users'
        });
    }
});

// Add new user (Admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
    try {
        const { email, password, firstName, lastName, role = 'member', phoneNumber, address, avatar } = req.body;

        const user = await createUser({
            email,
            password,
            firstName,
            lastName,
            role,
            phoneNumber,
            address,
            avatar
        });

        res.status(201).json({
            success: true,
            message: 'User added successfully',
            data: user
        });
    } catch (error) {
        console.error(error);
        if (error.message === 'User already exists') {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error adding user'
        });
    }
});

/**
 * @route GET /api/users/status
 * @desc Get user's role and membership status
 * @access Private
 */
router.get('/status', auth, async (req, res) => {
    try {
        // Get user details with role
        const userResult = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT 
                    UserID, 
                    Email, 
                    FirstName, 
                    LastName, 
                    Role, 
                    IsActive,
                    LastLoginAt
                FROM Users
                WHERE UserID = @UserID
            `);

        if (userResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.recordset[0];

        // Get active membership if exists
        const membershipResult = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT 
                    um.MembershipID,
                    um.PlanID,
                    um.StartDate,
                    um.EndDate,
                    um.Status as MembershipStatus,
                    mp.Name as PlanName,
                    mp.Price as PlanPrice,
                    mp.Duration as PlanDuration,
                    DATEDIFF(day, GETDATE(), um.EndDate) as DaysRemaining
                FROM UserMemberships um
                JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                WHERE um.UserID = @UserID
                AND um.Status = 'active'
                AND um.EndDate > GETDATE()
            `);

        const membership = membershipResult.recordset[0] || null;

        // Return combined user status information
        res.json({
            success: true,
            data: {
                user: {
                    id: user.UserID,
                    email: user.Email,
                    firstName: user.FirstName,
                    lastName: user.LastName,
                    role: user.Role,
                    isActive: user.IsActive === 1,
                    lastLogin: user.LastLoginAt
                },
                membership: membership ? {
                    id: membership.MembershipID,
                    planId: membership.PlanID,
                    planName: membership.PlanName,
                    startDate: membership.StartDate,
                    endDate: membership.EndDate,
                    daysRemaining: membership.DaysRemaining,
                    status: membership.MembershipStatus
                } : null,
                accountType: user.Role,
                isSubscribed: membership !== null
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user status',
            error: error.message
        });
    }
});

// Get user's health metrics
router.get('/health-metrics', auth, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT *
        FROM HealthMetrics
        WHERE UserID = @UserID
        ORDER BY Date DESC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin sức khỏe',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Debug endpoint - Get user profile with address specifically
router.get('/profile-debug', auth, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT UserID, Email, FirstName, LastName, Role, 
                       PhoneNumber, Address, Avatar, IsActive,
                       EmailVerified, CreatedAt, LastLoginAt 
                FROM Users 
                WHERE UserID = @UserID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = result.recordset[0];

        // Log the raw address value for debugging
        console.log('Raw address value from database:', {
            address: user.Address,
            addressType: typeof user.Address,
            isNull: user.Address === null,
            isUndefined: user.Address === undefined,
            isEmptyString: user.Address === ''
        });

        res.json({
            success: true,
            data: {
                userInfo: {
                    id: user.UserID,
                    email: user.Email,
                    firstName: user.FirstName,
                    lastName: user.LastName,
                    role: user.Role,
                    phoneNumber: user.PhoneNumber,
                    address: user.Address,
                    avatar: user.Avatar,
                    isActive: user.IsActive === 1,
                    emailVerified: user.EmailVerified === 1,
                    createdAt: user.CreatedAt,
                    lastLoginAt: user.LastLoginAt
                }
            }
        });
    } catch (error) {
        console.error('Error in profile-debug endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving user profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Debug endpoint to check raw address value
router.get('/debug-address', auth, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT 
                    UserID, 
                    Email, 
                    FirstName, 
                    LastName, 
                    Role, 
                    PhoneNumber, 
                    Address,
                    CASE 
                        WHEN Address IS NULL THEN 'NULL'
                        WHEN Address = '' THEN 'EMPTY_STRING'
                        ELSE 'HAS_VALUE: ' + Address
                    END as AddressStatus
                FROM Users 
                WHERE UserID = @UserID
            `);

        const user = result.recordset[0];

        res.json({
            success: true,
            message: 'Debug information for address field',
            data: {
                rawAddress: user.Address,
                addressType: typeof user.Address,
                addressStatus: user.AddressStatus,
                isNull: user.Address === null,
                isEmptyString: user.Address === '',
                userObject: user
            }
        });
    } catch (error) {
        console.error('Error in debug endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving debug information'
        });
    }
});

/**
 * @route GET /api/users/debug-fields
 * @desc Debug endpoint to check address and createdAt fields
 * @access Private
 */
router.get('/debug-fields', auth, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT 
                    UserID,
                    Email,
                    FirstName,
                    LastName,
                    Address,
                    CreatedAt,
                    CASE WHEN Address IS NULL THEN 'Address is NULL' 
                         WHEN Address = '' THEN 'Address is empty string' 
                         ELSE CONCAT('Address length: ', LEN(Address)) 
                    END as AddressStatus,
                    CASE WHEN CreatedAt IS NULL THEN 'CreatedAt is NULL' 
                         ELSE CONCAT('CreatedAt: ', CONVERT(VARCHAR, CreatedAt, 120))
                    END as CreatedAtStatus
                FROM Users
                WHERE UserID = @UserID
            `);

        res.json({
            success: true,
            debug: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error debugging fields'
        });
    }
});

module.exports = router; 