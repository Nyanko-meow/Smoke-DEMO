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
                startDate: user.StartDate ? user.StartDate.toISOString() : null,
                endDate: user.EndDate ? user.EndDate.toISOString() : null,
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

        // Validate user exists and is authenticated
        if (!req.user || !req.user.UserID) {
            return res.status(401).json({
                success: false,
                message: 'Không xác định được người dùng. Vui lòng đăng nhập lại.'
            });
        }

        console.log('Attempting to update profile for UserID:', req.user.UserID);

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('FirstName', firstName.trim())
            .input('LastName', lastName.trim())
            .input('PhoneNumber', phoneNumber ? phoneNumber.trim() : null)
            .input('Address', address ? address.trim() : null)
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
            console.error('Profile update failed: No rows were updated for UserID:', req.user.UserID);

            // Check if user actually exists
            const checkUserResult = await pool.request()
                .input('UserID', req.user.UserID)
                .query('SELECT UserID, Email FROM Users WHERE UserID = @UserID');

            if (checkUserResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Người dùng không tồn tại trong hệ thống'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Không thể cập nhật thông tin. Vui lòng thử lại sau.'
                });
            }
        }

        console.log('Profile update successful:', result.recordset[0]);

        res.json({
            success: true,
            message: 'Thông tin đã được cập nhật thành công',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            number: error.number,
            severity: error.severity,
            state: error.state,
            procedure: error.procedure,
            lineNumber: error.lineNumber
        });

        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thông tin người dùng: ' + (error.message || 'Unknown error'),
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
        let baselineCigarettesPerDay = 10; // Default half pack per day
        let cigarettePrice = 1500; // Default 1500 VNĐ per cigarette

        // Try to get baseline from existing smoking status
        if (smokingInfo.recordset.length > 0) {
            const { CigarettesPerDay, CigarettePrice } = smokingInfo.recordset[0];
            baselineCigarettesPerDay = CigarettesPerDay || 10;
            cigarettePrice = CigarettePrice || 1500;
        } else {
            // Try to get baseline from survey data if smoking status doesn't exist
            const surveyInfo = await pool.request()
                .input('UserID', req.user.UserID)
                .query(`
                    SELECT ua.AnswerText
                    FROM UserSurveyAnswers ua
                    INNER JOIN SurveyQuestions sq ON ua.QuestionID = sq.QuestionID
                    WHERE ua.UserID = @UserID 
                    AND sq.QuestionText LIKE N'%bao nhiêu điếu%'
                    AND sq.DisplayOrder = 2
                `);

            if (surveyInfo.recordset.length > 0) {
                const surveyAnswer = parseInt(surveyInfo.recordset[0].AnswerText);
                if (!isNaN(surveyAnswer) && surveyAnswer > 0) {
                    baselineCigarettesPerDay = surveyAnswer;

                    // Auto-create smoking status from survey data
                    await pool.request()
                        .input('UserID', req.user.UserID)
                        .input('CigarettesPerDay', baselineCigarettesPerDay)
                        .input('CigarettePrice', cigarettePrice)
                        .query(`
                            INSERT INTO SmokingStatus (UserID, CigarettesPerDay, CigarettePrice, SmokingFrequency)
                            VALUES (@UserID, @CigarettesPerDay, @CigarettePrice, N'Từ dữ liệu khảo sát')
                        `);
                }
            }

            // Also try from UserSurvey table
            const userSurveyInfo = await pool.request()
                .input('UserID', req.user.UserID)
                .query(`
                    SELECT CigarettesPerDay
                    FROM UserSurvey 
                    WHERE UserID = @UserID
                `);

            if (userSurveyInfo.recordset.length > 0 && userSurveyInfo.recordset[0].CigarettesPerDay) {
                baselineCigarettesPerDay = userSurveyInfo.recordset[0].CigarettesPerDay;

                // Auto-create smoking status from user survey
                if (smokingInfo.recordset.length === 0) {
                    await pool.request()
                        .input('UserID', req.user.UserID)
                        .input('CigarettesPerDay', baselineCigarettesPerDay)
                        .input('CigarettePrice', cigarettePrice)
                        .query(`
                            INSERT INTO SmokingStatus (UserID, CigarettesPerDay, CigarettePrice, SmokingFrequency)
                            VALUES (@UserID, @CigarettesPerDay, @CigarettePrice, N'Từ dữ liệu survey')
                        `);
                }
            }
        }

        // Calculate money saved with improved formula
        const cigarettesNotSmoked = Math.max(0, baselineCigarettesPerDay - cigarettesSmoked);
        moneySaved = cigarettesNotSmoked * cigarettePrice;

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
                    startDate: membership.StartDate ? membership.StartDate.toISOString() : null,
                    endDate: membership.EndDate ? membership.EndDate.toISOString() : null,
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

// DEBUG: Temporary endpoint to check coach assignment data
router.get('/debug-assignment', auth, async (req, res) => {
    try {
        const userId = req.user.UserID;

        console.log('🔍 === DEBUG COACH ASSIGNMENT ===');
        console.log('   UserID:', userId);

        // Check all QuitPlans for this user
        const allPlans = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    qp.PlanID,
                    qp.UserID,
                    qp.CoachID,
                    qp.Status,
                    qp.StartDate,
                    qp.CreatedAt,
                    c.UserID as CoachUserID,
                    c.Email as CoachEmail,
                    c.FirstName as CoachFirstName,
                    c.LastName as CoachLastName,
                    c.IsActive as CoachIsActive,
                    c.Role as CoachRole
                FROM QuitPlans qp
                LEFT JOIN Users c ON qp.CoachID = c.UserID
                WHERE qp.UserID = @UserID
                ORDER BY qp.CreatedAt DESC
            `);

        // Check active QuitPlans specifically
        const activePlans = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    qp.PlanID,
                    qp.CoachID,
                    qp.Status,
                    c.FirstName + ' ' + c.LastName as CoachName,
                    c.IsActive as CoachIsActive,
                    c.Role as CoachRole
                FROM QuitPlans qp
                LEFT JOIN Users c ON qp.CoachID = c.UserID
                WHERE qp.UserID = @UserID AND qp.Status = 'active'
            `);

        // Check the exact query from assigned-coach
        const assignedCoachQuery = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    c.UserID as CoachID,
                    c.Email as CoachEmail,
                    c.FirstName as CoachFirstName,
                    c.LastName as CoachLastName
                FROM QuitPlans qp
                INNER JOIN Users c ON qp.CoachID = c.UserID
                WHERE qp.UserID = @UserID 
                    AND qp.Status = 'active'
                    AND qp.CoachID IS NOT NULL
                    AND c.Role = 'coach'
                    AND c.IsActive = 1
            `);

        res.json({
            success: true,
            debug: {
                userId: userId,
                allQuitPlans: allPlans.recordset,
                activeQuitPlans: activePlans.recordset,
                assignedCoachQuery: assignedCoachQuery.recordset,
                hasActiveQuitPlan: activePlans.recordset.length > 0,
                hasAssignedCoach: assignedCoachQuery.recordset.length > 0,
                issues: {
                    noActivePlan: activePlans.recordset.length === 0,
                    nullCoachId: activePlans.recordset.some(p => p.CoachID === null),
                    inactiveCoach: activePlans.recordset.some(p => p.CoachIsActive === 0),
                    wrongCoachRole: activePlans.recordset.some(p => p.CoachRole !== 'coach')
                }
            }
        });

    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get assigned coach for current member
router.get('/assigned-coach', auth, async (req, res) => {
    try {
        const userId = req.user.UserID;
        const userRole = req.user.Role;

        console.log('🔍 === ASSIGNED COACH API START ===');
        console.log('   UserID:', userId);
        console.log('   UserRole:', userRole);
        console.log('   User object:', req.user);

        // Check if user is member or guest
        if (userRole !== 'member' && userRole !== 'guest') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ member và guest mới có thể xem coach được phân công'
            });
        }

        // First check what QuitPlans this user has
        const quitPlansCheck = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    qp.PlanID,
                    qp.UserID,
                    qp.CoachID,
                    qp.Status,
                    qp.StartDate,
                    u.Email as UserEmail,
                    c.Email as CoachEmail,
                    c.FirstName as CoachFirstName,
                    c.LastName as CoachLastName
                FROM QuitPlans qp
                LEFT JOIN Users u ON qp.UserID = u.UserID
                LEFT JOIN Users c ON qp.CoachID = c.UserID
                WHERE qp.UserID = @UserID
                ORDER BY qp.CreatedAt DESC
            `);

        console.log('   All QuitPlans for this user:', quitPlansCheck.recordset);

        // Get assigned coach through QuitPlans
        const result = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    c.UserID as CoachID,
                    c.Email as CoachEmail,
                    c.FirstName as CoachFirstName,
                    c.LastName as CoachLastName,
                    c.Avatar as CoachAvatar,
                    c.PhoneNumber as CoachPhoneNumber,
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
                    qp.PlanID as QuitPlanID,
                    qp.StartDate as AssignmentDate,
                    qp.Status as QuitPlanStatus,
                    (SELECT AVG(CAST(Rating AS FLOAT)) FROM CoachFeedback WHERE CoachID = c.UserID AND Status = 'active') as AverageRating,
                    (SELECT COUNT(*) FROM CoachFeedback WHERE CoachID = c.UserID AND Status = 'active') as ReviewCount
                FROM QuitPlans qp
                INNER JOIN Users c ON qp.CoachID = c.UserID
                LEFT JOIN CoachProfiles cp ON c.UserID = cp.UserID
                WHERE qp.UserID = @UserID 
                    AND qp.Status = 'active'
                    AND qp.CoachID IS NOT NULL
                    AND c.Role = 'coach'
                    AND c.IsActive = 1
            `);

        console.log('   Assigned coach query result count:', result.recordset.length);
        console.log('   Assigned coach query result:', result.recordset);

        if (result.recordset.length === 0) {
            console.log('❌ No assigned coach found for member:', userId);
            console.log('❌ Possible reasons:');
            console.log('   - No QuitPlan with status = "active"');
            console.log('   - QuitPlan.CoachID is NULL');
            console.log('   - Coach user not found or not active');
            console.log('   - Coach role is not "coach"');

            // Additional debug: Check what QuitPlans exist for this user
            const debugPlans = await pool.request()
                .input('UserID', userId)
                .query(`
                    SELECT 
                        qp.PlanID,
                        qp.Status,
                        qp.CoachID,
                        qp.StartDate,
                        c.Email as CoachEmail,
                        c.IsActive as CoachIsActive,
                        c.Role as CoachRole
                    FROM QuitPlans qp
                    LEFT JOIN Users c ON qp.CoachID = c.UserID
                    WHERE qp.UserID = @UserID
                    ORDER BY qp.CreatedAt DESC
                `);

            console.log('🔍 Debug - All QuitPlans for this user:', debugPlans.recordset);

            return res.json({
                success: true,
                data: null,
                debug: {
                    userId: userId,
                    allQuitPlans: debugPlans.recordset,
                    queryConditions: {
                        hasActiveQuitPlan: debugPlans.recordset.some(p => p.Status === 'active'),
                        hasCoachAssigned: debugPlans.recordset.some(p => p.CoachID !== null),
                        coachDetails: debugPlans.recordset.map(p => ({
                            coachId: p.CoachID,
                            coachEmail: p.CoachEmail,
                            coachActive: p.CoachIsActive,
                            coachRole: p.CoachRole
                        }))
                    }
                },
                message: 'Bạn chưa được phân công coach nào. Vui lòng liên hệ admin để được hỗ trợ.'
            });
        }

        const coach = result.recordset[0];

        const assignedCoach = {
            id: coach.CoachID,
            email: coach.CoachEmail,
            firstName: coach.CoachFirstName,
            lastName: coach.CoachLastName,
            fullName: `${coach.CoachFirstName} ${coach.CoachLastName}`,
            avatar: coach.CoachAvatar,
            phoneNumber: coach.CoachPhoneNumber,
            bio: coach.Bio,
            specialization: coach.Specialization,
            experience: coach.Experience,
            hourlyRate: coach.HourlyRate,
            isAvailable: coach.IsAvailable === true || coach.IsAvailable === 1,
            yearsOfExperience: coach.YearsOfExperience,
            education: coach.Education,
            certifications: coach.Certifications,
            languages: coach.Languages,
            workingHours: coach.WorkingHours,
            consultationTypes: coach.ConsultationTypes,
            averageRating: coach.AverageRating ? parseFloat(coach.AverageRating).toFixed(1) : 0,
            reviewCount: coach.ReviewCount || 0,
            assignment: {
                quitPlanId: coach.QuitPlanID,
                assignmentDate: coach.AssignmentDate,
                status: coach.QuitPlanStatus
            }
        };

        console.log('✅ Found assigned coach:', assignedCoach.fullName);
        console.log('✅ Returning coach data:', assignedCoach);

        res.json({
            success: true,
            data: assignedCoach,
            message: `Coach được phân công: ${assignedCoach.fullName}`
        });

    } catch (error) {
        console.error('❌ Error getting assigned coach:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin coach được phân công',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete user account
router.delete('/account', auth, async (req, res) => {
    try {
        const userId = req.user.UserID;
        const { password } = req.body;

        console.log(`🗑️ Delete account request from user: ${userId}`);
        console.log(`🔍 Request body:`, req.body);
        console.log(`🔍 User info:`, {
            UserID: req.user.UserID,
            id: req.user.id,
            Email: req.user.Email,
            email: req.user.email,
            Role: req.user.Role,
            role: req.user.role
        });

        // Validate password confirmation
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mật khẩu để xác nhận xóa tài khoản'
            });
        }

        // Get user's current password
        const userResult = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT Password, Email, FirstName, LastName, Role
                FROM Users 
                WHERE UserID = @UserID AND IsActive = 1
            `);

        if (userResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản'
            });
        }

        const user = userResult.recordset[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.Password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu không chính xác'
            });
        }

        // Prevent admin accounts from being deleted
        if (user.Role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không thể xóa tài khoản admin'
            });
        }

        // Begin transaction to delete all related data
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Ensure AccountDeletions table exists
            try {
                await transaction.request().query(`
                    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AccountDeletions' AND xtype='U')
                    BEGIN
                        CREATE TABLE AccountDeletions (
                            DeletionID INT IDENTITY(1,1) PRIMARY KEY,
                            UserID INT NOT NULL,
                            Email NVARCHAR(255) NOT NULL,
                            FirstName NVARCHAR(100),
                            LastName NVARCHAR(100),
                            Role NVARCHAR(50),
                            Reason NVARCHAR(1000),
                            DeletedAt DATETIME2 DEFAULT GETDATE(),
                            CreatedAt DATETIME2 DEFAULT GETDATE()
                        );
                    END
                `);
                console.log('✅ AccountDeletions table ensured');
            } catch (tableError) {
                console.log('⚠️ Error ensuring AccountDeletions table:', tableError.message);
            }

            // Delete user-related data in correct order (respecting foreign key constraints)

            // 1. Delete coach feedback
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM CoachFeedback WHERE UserID = @UserID OR CoachID = @UserID');

            // 2. Delete notifications
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM Notifications WHERE UserID = @UserID');

            // 3. Delete progress tracking
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM ProgressTracking WHERE UserID = @UserID');

            // 4. Delete health metrics
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM HealthMetrics WHERE UserID = @UserID');

            // 5. Delete user achievements
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM UserAchievements WHERE UserID = @UserID');

            // 6. Delete community comments
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM CommunityComments WHERE UserID = @UserID');

            // 7. Delete post likes
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM PostLikes WHERE UserID = @UserID');

            // 8. Delete community posts
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM CommunityPosts WHERE UserID = @UserID');

            // 9. Delete blog comments
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM Comments WHERE UserID = @UserID');

            // 10. Delete blog posts (if user is author)
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM BlogPosts WHERE AuthorID = @UserID');

            // 11. Delete appointments
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM Appointments WHERE UserID = @UserID OR CoachID = @UserID');

            // 12. Delete payments
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM Payments WHERE UserID = @UserID');

            // 13. Delete user memberships
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM UserMemberships WHERE UserID = @UserID');

            // 14. Delete smoking status
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM SmokingStatus WHERE UserID = @UserID');

            // 15. Delete quit plans (but keep plans assigned to this coach for other users)
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM QuitPlans WHERE UserID = @UserID');

            // 16. Update quit plans where this user is a coach (set CoachID to NULL)
            await transaction.request()
                .input('UserID', userId)
                .query('UPDATE QuitPlans SET CoachID = NULL WHERE CoachID = @UserID');

            // 17. Delete user surveys  
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM UserSurveys WHERE UserID = @UserID');

            // 18. Delete survey responses (if exists)
            try {
                await transaction.request()
                    .input('UserID', userId)
                    .query('DELETE FROM SurveyResponses WHERE UserID = @UserID');
            } catch (surveyResponsesError) {
                console.log('⚠️ SurveyResponses table not found or error deleting:', surveyResponsesError.message);
            }

            // 19. Delete user sessions (if exists)
            try {
                await transaction.request()
                    .input('UserID', userId)
                    .query('DELETE FROM UserSessions WHERE UserID = @UserID');
            } catch (userSessionsError) {
                console.log('⚠️ UserSessions table not found or error deleting:', userSessionsError.message);
            }

            // 20. Delete coach profile (if exists)
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM CoachProfiles WHERE UserID = @UserID');

            // 21. Delete login attempts (must be before LoginHistory due to foreign key)
            try {
                await transaction.request()
                    .input('UserID', userId)
                    .query('DELETE FROM LoginAttempts WHERE UserID = @UserID');
            } catch (loginAttemptsError) {
                // LoginAttempts table might not exist in some setups
                console.log('⚠️ LoginAttempts table not found or error deleting:', loginAttemptsError.message);
            }

            // 22. Delete login history
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM LoginHistory WHERE UserID = @UserID');

            // 23. Delete refresh tokens
            await transaction.request()
                .input('UserID', userId)
                .query('DELETE FROM RefreshTokens WHERE UserID = @UserID');

            // 24. Finally, delete the user account
            const deleteResult = await transaction.request()
                .input('UserID', userId)
                .query(`
                    DELETE FROM Users 
                    OUTPUT DELETED.Email, DELETED.FirstName, DELETED.LastName, DELETED.Role
                    WHERE UserID = @UserID
                `);

            // 25. Log the account deletion
            await transaction.request()
                .input('UserID', userId)
                .input('Email', user.Email)
                .input('Reason', 'User requested account deletion')
                .input('DeletedAt', new Date())
                .query(`
                    INSERT INTO AccountDeletions (UserID, Email, FirstName, LastName, Role, Reason, DeletedAt)
                    VALUES (@UserID, @Email, '${user.FirstName}', '${user.LastName}', '${user.Role}', @Reason, @DeletedAt)
                `);

            await transaction.commit();

            console.log(`✅ Account deleted successfully for user: ${user.Email}`);

            res.json({
                success: true,
                message: 'Tài khoản đã được xóa thành công',
                data: {
                    email: user.Email,
                    deletedAt: new Date().toISOString()
                }
            });

        } catch (transactionError) {
            await transaction.rollback();
            throw transactionError;
        }

    } catch (error) {
        console.error('❌ Error deleting account:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa tài khoản',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Debug endpoint for delete account testing
router.post('/test-delete-account', auth, async (req, res) => {
    try {
        const userId = req.user.UserID;
        const { password } = req.body;

        console.log(`🧪 Test delete account request from user: ${userId}`);
        console.log(`🔍 Request body:`, req.body);
        console.log(`🔍 User info:`, req.user);

        // Validate password confirmation
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mật khẩu để xác nhận xóa tài khoản'
            });
        }

        // Get user's current password
        const userResult = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT Password, Email, FirstName, LastName, Role
                FROM Users 
                WHERE UserID = @UserID AND IsActive = 1
            `);

        if (userResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản'
            });
        }

        const user = userResult.recordset[0];
        console.log('🔍 User found:', { Email: user.Email, Role: user.Role });

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.Password);
        console.log('🔍 Password validation:', isPasswordValid);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu không chính xác'
            });
        }

        // Instead of actually deleting, just return success
        res.json({
            success: true,
            message: 'TEST: Password verified, account would be deleted',
            data: {
                userId: userId,
                email: user.Email,
                canDelete: true
            }
        });

    } catch (error) {
        console.error('❌ Test delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi test xóa tài khoản',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 