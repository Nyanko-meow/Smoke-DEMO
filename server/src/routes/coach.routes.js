const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { protect, authorize } = require('../middleware/auth.middleware');

// Coach login endpoint - only for role 'coach'
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

        // Check if user exists and has coach role
        const result = await pool.request()
            .input('Email', email)
            .query(`
                SELECT UserID, Email, Password, FirstName, LastName, Role, IsActive, EmailVerified
                FROM Users 
                WHERE Email = @Email AND Role = 'coach'
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email không tồn tại hoặc không có quyền coach'
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
        console.error('Coach login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Coach logout
router.post('/logout', protect, authorize('coach'), async (req, res) => {
    try {
        res.clearCookie('token');
        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    } catch (error) {
        console.error('Coach logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng xuất'
        });
    }
});

// Get enhanced coach profile with professional information
router.get('/profile', protect, authorize('coach'), async (req, res) => {
    try {
        // Get basic user information
        const userResult = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT UserID, Email, FirstName, LastName, Role, Avatar, PhoneNumber, Address, CreatedAt, LastLoginAt
                FROM Users
                WHERE UserID = @UserID
            `);

        if (userResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin coach'
            });
        }

        const user = userResult.recordset[0];

        // Get professional profile information
        const profileResult = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT *
                FROM CoachProfiles
                WHERE UserID = @UserID
            `);

        // Get reviews and ratings
        const reviewsResult = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT 
                    ReviewTitle, ReviewContent, Rating, ClientName, IsAnonymous, CreatedAt
                FROM CoachReviews
                WHERE CoachUserID = @UserID AND IsPublic = 1
                ORDER BY CreatedAt DESC
            `);

        // Combine all data
        const profileData = {
            // Basic user info
            UserID: user.UserID,
            Email: user.Email,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Role: user.Role,
            Avatar: user.Avatar,
            PhoneNumber: user.PhoneNumber,
            Address: user.Address,
            CreatedAt: user.CreatedAt,
            LastLoginAt: user.LastLoginAt,

            // Professional info (if exists)
            professionalProfile: profileResult.recordset.length > 0 ? profileResult.recordset[0] : null,

            // Reviews
            reviews: reviewsResult.recordset || [],
            reviewsCount: reviewsResult.recordset.length,

            // Calculate average rating
            averageRating: reviewsResult.recordset.length > 0
                ? (reviewsResult.recordset.reduce((sum, review) => sum + review.Rating, 0) / reviewsResult.recordset.length).toFixed(1)
                : 0
        };

        res.json({
            success: true,
            data: profileData
        });
    } catch (error) {
        console.error('Get coach profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin coach'
        });
    }
});

// Update coach profile
router.put('/profile', protect, authorize('coach'), async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            phoneNumber,
            address,
            avatar,
            // Professional profile fields
            specialization,
            yearsOfExperience,
            education,
            certifications,
            license,
            bio,
            methodology,
            successStory,
            languages,
            communicationStyle,
            workingHours,
            website,
            linkedin,
            hourlyRate,
            consultationFee,
            servicesOffered
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Họ và tên là bắt buộc'
            });
        }

        // Start transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Update basic user information
            await transaction.request()
                .input('UserID', req.user.UserID)
                .input('FirstName', firstName)
                .input('LastName', lastName)
                .input('PhoneNumber', phoneNumber || null)
                .input('Address', address || null)
                .input('Avatar', avatar || null)
                .query(`
                    UPDATE Users SET 
                        FirstName = @FirstName,
                        LastName = @LastName,
                        PhoneNumber = @PhoneNumber,
                        Address = @Address,
                        Avatar = @Avatar,
                        UpdatedAt = GETDATE()
                    WHERE UserID = @UserID
                `);

            // Check if professional profile exists
            const existingProfile = await transaction.request()
                .input('UserID', req.user.UserID)
                .query('SELECT ProfileID FROM CoachProfiles WHERE UserID = @UserID');

            if (existingProfile.recordset.length > 0) {
                // Update existing professional profile
                await transaction.request()
                    .input('UserID', req.user.UserID)
                    .input('Specialization', specialization || null)
                    .input('YearsOfExperience', yearsOfExperience || 0)
                    .input('Education', education || null)
                    .input('Certifications', certifications || null)
                    .input('License', license || null)
                    .input('Bio', bio || null)
                    .input('Methodology', methodology || null)
                    .input('SuccessStory', successStory || null)
                    .input('Languages', languages || null)
                    .input('CommunicationStyle', communicationStyle || null)
                    .input('WorkingHours', workingHours || null)
                    .input('Website', website || null)
                    .input('LinkedIn', linkedin || null)
                    .input('HourlyRate', hourlyRate || null)
                    .input('ConsultationFee', consultationFee || null)
                    .input('ServicesOffered', servicesOffered || null)
                    .query(`
                        UPDATE CoachProfiles SET 
                            Specialization = @Specialization,
                            YearsOfExperience = @YearsOfExperience,
                            Education = @Education,
                            Certifications = @Certifications,
                            License = @License,
                            Bio = @Bio,
                            Methodology = @Methodology,
                            SuccessStory = @SuccessStory,
                            Languages = @Languages,
                            CommunicationStyle = @CommunicationStyle,
                            WorkingHours = @WorkingHours,
                            Website = @Website,
                            LinkedIn = @LinkedIn,
                            HourlyRate = @HourlyRate,
                            ConsultationFee = @ConsultationFee,
                            ServicesOffered = @ServicesOffered,
                            UpdatedAt = GETDATE()
                        WHERE UserID = @UserID
                    `);
            } else {
                // Create new professional profile
                await transaction.request()
                    .input('UserID', req.user.UserID)
                    .input('Specialization', specialization || null)
                    .input('YearsOfExperience', yearsOfExperience || 0)
                    .input('Education', education || null)
                    .input('Certifications', certifications || null)
                    .input('License', license || null)
                    .input('Bio', bio || null)
                    .input('Methodology', methodology || null)
                    .input('SuccessStory', successStory || null)
                    .input('Languages', languages || null)
                    .input('CommunicationStyle', communicationStyle || null)
                    .input('WorkingHours', workingHours || null)
                    .input('Website', website || null)
                    .input('LinkedIn', linkedin || null)
                    .input('HourlyRate', hourlyRate || null)
                    .input('ConsultationFee', consultationFee || null)
                    .input('ServicesOffered', servicesOffered || null)
                    .query(`
                        INSERT INTO CoachProfiles (
                            UserID, Specialization, YearsOfExperience, Education, Certifications, License,
                            Bio, Methodology, SuccessStory, Languages, CommunicationStyle, WorkingHours,
                            Website, LinkedIn, HourlyRate, ConsultationFee, ServicesOffered
                        ) VALUES (
                            @UserID, @Specialization, @YearsOfExperience, @Education, @Certifications, @License,
                            @Bio, @Methodology, @SuccessStory, @Languages, @CommunicationStyle, @WorkingHours,
                            @Website, @LinkedIn, @HourlyRate, @ConsultationFee, @ServicesOffered
                        )
                    `);
            }

            // Commit transaction
            await transaction.commit();

            res.json({
                success: true,
                message: 'Cập nhật thông tin thành công'
            });

        } catch (error) {
            // Rollback transaction on error
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Update coach profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thông tin',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all members/users for coach dashboard
router.get('/members', protect, authorize('coach'), async (req, res) => {
    try {
        // Get all users with their basic info and membership status
        const result = await pool.request()
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
                    um.MembershipID,
                    um.PlanID,
                    um.StartDate as MembershipStartDate,
                    um.EndDate as MembershipEndDate,
                    um.Status as MembershipStatus,
                    mp.Name as PlanName,
                    mp.Price as PlanPrice,
                    mp.Duration as PlanDuration,
                    DATEDIFF(day, GETDATE(), um.EndDate) as DaysRemaining,
                    qp.PlanID as QuitPlanID,
                    qp.StartDate as QuitStartDate,
                    qp.TargetDate as QuitTargetDate,
                    qp.Status as QuitPlanStatus,
                    qp.MotivationLevel,
                    pt.CigarettesSmoked,
                    pt.DaysSmokeFree,
                    pt.MoneySaved,
                    pt.CravingLevel
                FROM Users u
                LEFT JOIN UserMemberships um ON u.UserID = um.UserID 
                    AND um.Status = 'active' 
                    AND um.EndDate > GETDATE()
                LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                LEFT JOIN QuitPlans qp ON u.UserID = qp.UserID 
                    AND qp.Status = 'active'
                LEFT JOIN (
                    SELECT UserID, 
                           CigarettesSmoked, 
                           DaysSmokeFree, 
                           MoneySaved, 
                           CravingLevel,
                           ROW_NUMBER() OVER (PARTITION BY UserID ORDER BY Date DESC) as rn
                    FROM ProgressTracking
                ) pt ON u.UserID = pt.UserID AND pt.rn = 1
                WHERE u.Role IN ('guest', 'member')
                ORDER BY u.CreatedAt DESC
            `);

        // Get achievement counts for each user
        const achievementCounts = await pool.request()
            .query(`
                SELECT 
                    ua.UserID,
                    COUNT(*) as AchievementCount
                FROM UserAchievements ua
                JOIN Users u ON ua.UserID = u.UserID
                WHERE u.Role IN ('guest', 'member')
                GROUP BY ua.UserID
            `);

        // Create achievement lookup map
        const achievementMap = {};
        achievementCounts.recordset.forEach(item => {
            achievementMap[item.UserID] = item.AchievementCount;
        });

        // Format the response data
        const members = result.recordset.map(user => ({
            id: user.UserID,
            email: user.Email,
            firstName: user.FirstName,
            lastName: user.LastName,
            fullName: `${user.FirstName} ${user.LastName}`,
            role: user.Role,
            phoneNumber: user.PhoneNumber,
            address: user.Address,
            avatar: user.Avatar,
            isActive: user.IsActive === 1,
            emailVerified: user.EmailVerified === 1,
            createdAt: user.CreatedAt,
            lastLoginAt: user.LastLoginAt,
            membership: user.MembershipID ? {
                id: user.MembershipID,
                planId: user.PlanID,
                planName: user.PlanName,
                planPrice: user.PlanPrice,
                planDuration: user.PlanDuration,
                startDate: user.MembershipStartDate,
                endDate: user.MembershipEndDate,
                daysRemaining: user.DaysRemaining,
                status: user.MembershipStatus
            } : null,
            quitPlan: user.QuitPlanID ? {
                id: user.QuitPlanID,
                startDate: user.QuitStartDate,
                targetDate: user.QuitTargetDate,
                status: user.QuitPlanStatus,
                motivationLevel: user.MotivationLevel
            } : null,
            progress: {
                cigarettesSmoked: user.CigarettesSmoked || 0,
                daysSmokeFree: user.DaysSmokeFree || 0,
                moneySaved: user.MoneySaved || 0,
                cravingLevel: user.CravingLevel || 0
            },
            achievementCount: achievementMap[user.UserID] || 0,
            isSubscribed: user.MembershipID !== null
        }));

        res.json({
            success: true,
            data: members,
            total: members.length,
            message: 'Đã lấy danh sách members thành công'
        });

    } catch (error) {
        console.error('Error getting members:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách members',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get member statistics for dashboard
router.get('/stats', protect, authorize('coach'), async (req, res) => {
    try {
        // Get basic statistics
        const totalMembersResult = await pool.request()
            .query(`
                SELECT COUNT(*) as TotalMembers
                FROM Users 
                WHERE Role IN ('guest', 'member')
            `);

        const activeMembersResult = await pool.request()
            .query(`
                SELECT COUNT(*) as ActiveMembers
                FROM Users u
                JOIN UserMemberships um ON u.UserID = um.UserID
                WHERE u.Role IN ('guest', 'member')
                AND um.Status = 'active'
                AND um.EndDate > GETDATE()
            `);

        const completedPlansResult = await pool.request()
            .query(`
                SELECT COUNT(*) as CompletedPlans
                FROM QuitPlans qp
                JOIN Users u ON qp.UserID = u.UserID
                WHERE u.Role IN ('guest', 'member')
                AND qp.Status = 'completed'
            `);

        // Calculate success rate
        const totalPlansResult = await pool.request()
            .query(`
                SELECT COUNT(*) as TotalPlans
                FROM QuitPlans qp
                JOIN Users u ON qp.UserID = u.UserID
                WHERE u.Role IN ('guest', 'member')
                AND qp.Status IN ('active', 'completed', 'cancelled')
            `);

        const totalMembers = totalMembersResult.recordset[0].TotalMembers;
        const activeMembers = activeMembersResult.recordset[0].ActiveMembers;
        const completedPlans = completedPlansResult.recordset[0].CompletedPlans;
        const totalPlans = totalPlansResult.recordset[0].TotalPlans;

        const successRate = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

        res.json({
            success: true,
            data: {
                totalMembers,
                activeMembers,
                completedPlans,
                successRate
            },
            message: 'Đã lấy thống kê thành công'
        });

    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get detailed member information with quit smoking status
router.get('/members/:id/details', protect, authorize('coach'), async (req, res) => {
    try {
        const memberId = req.params.id;

        // Validate member ID
        if (!memberId || isNaN(memberId)) {
            return res.status(400).json({
                success: false,
                message: 'ID thành viên không hợp lệ'
            });
        }

        // Get basic member information with membership
        const memberResult = await pool.request()
            .input('UserID', memberId)
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
                    um.MembershipID,
                    um.PlanID,
                    um.StartDate as MembershipStartDate,
                    um.EndDate as MembershipEndDate,
                    um.Status as MembershipStatus,
                    mp.Name as PlanName,
                    mp.Description as PlanDescription,
                    mp.Price as PlanPrice,
                    mp.Duration as PlanDuration,
                    mp.Features as PlanFeatures,
                    DATEDIFF(day, GETDATE(), um.EndDate) as DaysRemaining
                FROM Users u
                LEFT JOIN UserMemberships um ON u.UserID = um.UserID 
                    AND um.Status = 'active' 
                    AND um.EndDate > GETDATE()
                LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                WHERE u.UserID = @UserID AND u.Role IN ('guest', 'member')
            `);

        if (memberResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành viên'
            });
        }

        const member = memberResult.recordset[0];

        // Get quit plan information
        const quitPlanResult = await pool.request()
            .input('UserID', memberId)
            .query(`
                SELECT 
                    PlanID,
                    StartDate,
                    TargetDate,
                    Reason,
                    MotivationLevel,
                    DetailedPlan,
                    Status,
                    CreatedAt,
                    CoachID
                FROM QuitPlans
                WHERE UserID = @UserID AND Status = 'active'
            `);

        // Get progress tracking data (last 30 days)
        const progressResult = await pool.request()
            .input('UserID', memberId)
            .query(`
                SELECT 
                    Date,
                    CigarettesSmoked,
                    CravingLevel,
                    EmotionNotes,
                    MoneySaved,
                    DaysSmokeFree,
                    HealthNotes,
                    CreatedAt
                FROM ProgressTracking
                WHERE UserID = @UserID
                AND Date >= DATEADD(day, -30, GETDATE())
                ORDER BY Date DESC
            `);

        // Get smoking status
        const smokingStatusResult = await pool.request()
            .input('UserID', memberId)
            .query(`
                SELECT 
                    CigarettesPerDay,
                    CigarettePrice,
                    SmokingFrequency,
                    LastUpdated
                FROM SmokingStatus
                WHERE UserID = @UserID
            `);

        // Get achievements
        const achievementsResult = await pool.request()
            .input('UserID', memberId)
            .query(`
                SELECT 
                    a.AchievementID,
                    a.Name,
                    a.Description,
                    a.IconURL,
                    a.MilestoneDays,
                    a.SavedMoney,
                    ua.EarnedAt
                FROM UserAchievements ua
                JOIN Achievements a ON ua.AchievementID = a.AchievementID
                WHERE ua.UserID = @UserID
                ORDER BY ua.EarnedAt DESC
            `);

        // Analyze quit smoking status based on progress data
        const quitSmokingStatus = analyzeQuitSmokingStatus(progressResult.recordset, quitPlanResult.recordset[0]);

        // Calculate statistics
        const progressData = progressResult.recordset;
        const statistics = calculateMemberStatistics(progressData, smokingStatusResult.recordset[0]);

        // Format response
        const memberDetails = {
            // Basic information
            id: member.UserID,
            email: member.Email,
            firstName: member.FirstName,
            lastName: member.LastName,
            fullName: `${member.FirstName} ${member.LastName}`,
            role: member.Role,
            phoneNumber: member.PhoneNumber,
            address: member.Address,
            avatar: member.Avatar,
            isActive: member.IsActive === 1,
            emailVerified: member.EmailVerified === 1,
            createdAt: member.CreatedAt,
            lastLoginAt: member.LastLoginAt,

            // Membership information
            membership: member.MembershipID ? {
                id: member.MembershipID,
                planId: member.PlanID,
                planName: member.PlanName,
                planDescription: member.PlanDescription,
                planPrice: member.PlanPrice,
                planDuration: member.PlanDuration,
                planFeatures: member.PlanFeatures ? member.PlanFeatures.split(',').map(f => f.trim()) : [],
                startDate: member.MembershipStartDate,
                endDate: member.MembershipEndDate,
                daysRemaining: member.DaysRemaining,
                status: member.MembershipStatus
            } : null,

            // Quit smoking status
            quitSmokingStatus: quitSmokingStatus,

            // Quit plan
            quitPlan: quitPlanResult.recordset.length > 0 ? {
                id: quitPlanResult.recordset[0].PlanID,
                startDate: quitPlanResult.recordset[0].StartDate,
                targetDate: quitPlanResult.recordset[0].TargetDate,
                reason: quitPlanResult.recordset[0].Reason,
                motivationLevel: quitPlanResult.recordset[0].MotivationLevel,
                detailedPlan: quitPlanResult.recordset[0].DetailedPlan,
                status: quitPlanResult.recordset[0].Status,
                createdAt: quitPlanResult.recordset[0].CreatedAt,
                coachId: quitPlanResult.recordset[0].CoachID,
                daysInPlan: quitPlanResult.recordset[0].StartDate ?
                    Math.floor((new Date() - new Date(quitPlanResult.recordset[0].StartDate)) / (1000 * 60 * 60 * 24)) : 0
            } : null,

            // Smoking status
            smokingStatus: smokingStatusResult.recordset.length > 0 ? {
                cigarettesPerDay: smokingStatusResult.recordset[0].CigarettesPerDay,
                cigarettePrice: smokingStatusResult.recordset[0].CigarettePrice,
                smokingFrequency: smokingStatusResult.recordset[0].SmokingFrequency,
                lastUpdated: smokingStatusResult.recordset[0].LastUpdated
            } : null,

            // Statistics
            statistics: statistics,

            // Recent progress (last 7 days)
            recentProgress: progressData.slice(0, 7),

            // Achievements
            achievements: achievementsResult.recordset,
            achievementCount: achievementsResult.recordset.length,

            // Additional flags
            isSubscribed: member.MembershipID !== null,
            hasActiveQuitPlan: quitPlanResult.recordset.length > 0
        };

        res.json({
            success: true,
            data: memberDetails,
            message: 'Đã lấy thông tin chi tiết thành viên thành công'
        });

    } catch (error) {
        console.error('Error getting member details:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin chi tiết thành viên',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get member progress tracking data for detailed monitoring
router.get('/members/:id/progress', protect, authorize('coach'), async (req, res) => {
    try {
        const memberId = req.params.id;
        const { days = 30 } = req.query; // Default to last 30 days

        // Validate member ID
        if (!memberId || isNaN(memberId)) {
            return res.status(400).json({
                success: false,
                message: 'ID thành viên không hợp lệ'
            });
        }

        // Validate days parameter
        const daysNumber = parseInt(days);
        if (isNaN(daysNumber) || daysNumber < 1 || daysNumber > 365) {
            return res.status(400).json({
                success: false,
                message: 'Số ngày phải trong khoảng 1-365'
            });
        }

        // Check if member exists and coach has permission
        const memberCheck = await pool.request()
            .input('UserID', memberId)
            .query(`
                SELECT UserID, FirstName, LastName, Email, Role
                FROM Users 
                WHERE UserID = @UserID AND Role IN ('guest', 'member')
            `);

        if (memberCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành viên'
            });
        }

        const member = memberCheck.recordset[0];

        // Get basic member info with membership
        const memberInfoResult = await pool.request()
            .input('UserID', memberId)
            .query(`
                SELECT 
                    u.UserID,
                    u.Email,
                    u.FirstName,
                    u.LastName,
                    u.Avatar,
                    u.PhoneNumber,
                    u.CreatedAt,
                    um.StartDate as MembershipStartDate,
                    um.EndDate as MembershipEndDate,
                    mp.Name as PlanName
                FROM Users u
                LEFT JOIN UserMemberships um ON u.UserID = um.UserID 
                    AND um.Status = 'active' 
                    AND um.EndDate > GETDATE()
                LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                WHERE u.UserID = @UserID
            `);

        // Get progress tracking data
        const progressResult = await pool.request()
            .input('UserID', memberId)
            .input('DaysBack', daysNumber)
            .query(`
                SELECT 
                    Date,
                    CigarettesSmoked,
                    CravingLevel,
                    EmotionNotes,
                    MoneySaved,
                    DaysSmokeFree,
                    HealthNotes,
                    CreatedAt
                FROM ProgressTracking
                WHERE UserID = @UserID
                AND Date >= DATEADD(day, -@DaysBack, GETDATE())
                ORDER BY Date DESC
            `);

        // Get quit plan information
        const quitPlanResult = await pool.request()
            .input('UserID', memberId)
            .query(`
                SELECT 
                    PlanID,
                    StartDate,
                    TargetDate,
                    Reason,
                    MotivationLevel,
                    DetailedPlan,
                    Status,
                    CreatedAt,
                    CoachID,
                    DATEDIFF(day, StartDate, GETDATE()) as DaysInPlan,
                    DATEDIFF(day, GETDATE(), TargetDate) as DaysToTarget
                FROM QuitPlans
                WHERE UserID = @UserID AND Status = 'active'
            `);

        // Get smoking status
        const smokingStatusResult = await pool.request()
            .input('UserID', memberId)
            .query(`
                SELECT 
                    CigarettesPerDay,
                    CigarettePrice,
                    SmokingFrequency,
                    LastUpdated
                FROM SmokingStatus
                WHERE UserID = @UserID
            `);

        // Get achievements with progress tracking
        const achievementsResult = await pool.request()
            .input('UserID', memberId)
            .query(`
                SELECT 
                    a.AchievementID,
                    a.Name,
                    a.Description,
                    a.IconURL,
                    a.MilestoneDays,
                    a.SavedMoney,
                    ua.EarnedAt,
                    CASE 
                        WHEN ua.UserAchievementID IS NOT NULL THEN 1 
                        ELSE 0 
                    END as IsEarned
                FROM Achievements a
                LEFT JOIN UserAchievements ua ON a.AchievementID = ua.AchievementID AND ua.UserID = @UserID
                ORDER BY a.MilestoneDays ASC, a.SavedMoney ASC
            `);

        // Calculate detailed progress analytics
        const progressData = progressResult.recordset;
        const analytics = calculateDetailedProgressAnalytics(progressData, smokingStatusResult.recordset[0]);

        // Format response
        const memberProgress = {
            // Member basic info
            member: {
                id: member.UserID,
                firstName: member.FirstName,
                lastName: member.LastName,
                fullName: `${member.FirstName} ${member.LastName}`,
                email: member.Email,
                avatar: memberInfoResult.recordset[0]?.Avatar,
                phoneNumber: memberInfoResult.recordset[0]?.PhoneNumber,
                createdAt: memberInfoResult.recordset[0]?.CreatedAt,
                membershipPlan: memberInfoResult.recordset[0]?.PlanName,
                membershipStartDate: memberInfoResult.recordset[0]?.MembershipStartDate,
                membershipEndDate: memberInfoResult.recordset[0]?.MembershipEndDate
            },

            // Progress tracking data
            progressData: progressData.map(item => ({
                date: item.Date,
                cigarettesSmoked: item.CigarettesSmoked || 0,
                cravingLevel: item.CravingLevel || 0,
                emotionNotes: item.EmotionNotes,
                moneySaved: item.MoneySaved || 0,
                daysSmokeFree: item.DaysSmokeFree || 0,
                healthNotes: item.HealthNotes,
                createdAt: item.CreatedAt
            })),

            // Quit plan
            quitPlan: quitPlanResult.recordset.length > 0 ? {
                id: quitPlanResult.recordset[0].PlanID,
                startDate: quitPlanResult.recordset[0].StartDate,
                targetDate: quitPlanResult.recordset[0].TargetDate,
                reason: quitPlanResult.recordset[0].Reason,
                motivationLevel: quitPlanResult.recordset[0].MotivationLevel,
                detailedPlan: quitPlanResult.recordset[0].DetailedPlan,
                status: quitPlanResult.recordset[0].Status,
                createdAt: quitPlanResult.recordset[0].CreatedAt,
                coachId: quitPlanResult.recordset[0].CoachID,
                daysInPlan: quitPlanResult.recordset[0].DaysInPlan,
                daysToTarget: quitPlanResult.recordset[0].DaysToTarget
            } : null,

            // Smoking status
            smokingStatus: smokingStatusResult.recordset.length > 0 ? {
                cigarettesPerDay: smokingStatusResult.recordset[0].CigarettesPerDay,
                cigarettePrice: smokingStatusResult.recordset[0].CigarettePrice,
                smokingFrequency: smokingStatusResult.recordset[0].SmokingFrequency,
                lastUpdated: smokingStatusResult.recordset[0].LastUpdated
            } : null,

            // Achievements
            achievements: achievementsResult.recordset.map(achievement => ({
                id: achievement.AchievementID,
                name: achievement.Name,
                description: achievement.Description,
                iconURL: achievement.IconURL,
                milestoneDays: achievement.MilestoneDays,
                savedMoney: achievement.SavedMoney,
                isEarned: achievement.IsEarned === 1,
                earnedAt: achievement.EarnedAt
            })),

            // Analytics
            analytics: analytics,

            // Query parameters
            queryParams: {
                days: daysNumber,
                totalRecords: progressData.length
            }
        };

        res.json({
            success: true,
            data: memberProgress,
            message: `Đã lấy dữ liệu tiến trình ${daysNumber} ngày gần nhất của thành viên thành công`
        });

    } catch (error) {
        console.error('Error getting member progress:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu tiến trình thành viên',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Test endpoint to check member details functionality
router.get('/test-member-details/:id?', protect, authorize('coach'), async (req, res) => {
    try {
        const memberId = req.params.id || 2; // Default to user ID 2

        console.log(`Testing member details for ID: ${memberId}`);

        // Basic member info
        const memberResult = await pool.request()
            .input('UserID', memberId)
            .query(`
                SELECT 
                    u.UserID, u.Email, u.FirstName, u.LastName, u.Role, 
                    u.PhoneNumber, u.Address, u.IsActive,
                    um.MembershipID, um.StartDate as MembershipStart, um.EndDate as MembershipEnd,
                    mp.Name as PlanName, mp.Price as PlanPrice, mp.Features,
                    qp.StartDate as QuitPlanStart, qp.TargetDate as QuitPlanTarget, qp.Reason
                FROM Users u
                LEFT JOIN UserMemberships um ON u.UserID = um.UserID AND um.Status = 'active'
                LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID  
                LEFT JOIN QuitPlans qp ON u.UserID = qp.UserID AND qp.Status = 'active'
                WHERE u.UserID = @UserID
            `);

        // Progress data
        const progressResult = await pool.request()
            .input('UserID', memberId)
            .query(`
                SELECT TOP 10 Date, CigarettesSmoked, CravingLevel, MoneySaved, DaysSmokeFree
                FROM ProgressTracking 
                WHERE UserID = @UserID 
                ORDER BY Date DESC
            `);

        // Achievements
        const achievementResult = await pool.request()
            .input('UserID', memberId)
            .query(`
                SELECT a.Name, a.Description, ua.EarnedAt
                FROM UserAchievements ua
                JOIN Achievements a ON ua.AchievementID = a.AchievementID
                WHERE ua.UserID = @UserID
            `);

        const testData = {
            found: memberResult.recordset.length > 0,
            memberInfo: memberResult.recordset[0] || null,
            progressCount: progressResult.recordset.length,
            progressData: progressResult.recordset,
            achievementCount: achievementResult.recordset.length,
            achievements: achievementResult.recordset
        };

        res.json({
            success: true,
            message: 'Test endpoint working',
            data: testData
        });

    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Test endpoint failed',
            error: error.message
        });
    }
});

// Helper function to analyze quit smoking status
function analyzeQuitSmokingStatus(progressData, quitPlan) {
    if (!progressData || progressData.length === 0) {
        return {
            status: 'cần hỗ trợ',
            description: 'Chưa có dữ liệu theo dõi tiến trình',
            statusCode: 'no_data',
            recommendation: 'Khuyến khích thành viên bắt đầu ghi nhật ký tiến trình hàng ngày'
        };
    }

    // Sort by date (newest first)
    const sortedData = progressData.sort((a, b) => new Date(b.Date) - new Date(a.Date));

    // Get recent data (last 7 days)
    const recentData = sortedData.slice(0, 7);
    const olderData = sortedData.slice(7, 14); // Previous 7 days for comparison

    // Analyze trends
    const recentAvgCigarettes = recentData.reduce((sum, item) => sum + (item.CigarettesSmoked || 0), 0) / recentData.length;
    const recentAvgCraving = recentData.reduce((sum, item) => sum + (item.CravingLevel || 0), 0) / recentData.length;
    const recentDaysSmokeFree = Math.max(...recentData.map(item => item.DaysSmokeFree || 0));

    let status, description, statusCode, recommendation;

    // Check if progressing well
    if (olderData.length > 0) {
        const olderAvgCigarettes = olderData.reduce((sum, item) => sum + (item.CigarettesSmoked || 0), 0) / olderData.length;

        // Progressing (cigarettes decreasing or maintaining low levels)
        if (recentAvgCigarettes <= olderAvgCigarettes && recentAvgCigarettes <= 2 && recentAvgCraving <= 4) {
            status = 'đang tiến triển';
            statusCode = 'progressing';
            description = `Tiến trình tốt! Trung bình ${recentAvgCigarettes.toFixed(1)} điếu/ngày trong tuần qua.`;
            recommendation = 'Tiếp tục duy trì và có thể tăng cường các hoạt động tích cực khác.';
        }
        // Stagnating (no significant change)
        else if (Math.abs(recentAvgCigarettes - olderAvgCigarettes) <= 1 && recentAvgCigarettes > 2) {
            status = 'chững lại';
            statusCode = 'stagnating';
            description = `Tiến trình chậm lại. Trung bình ${recentAvgCigarettes.toFixed(1)} điếu/ngày, chưa có cải thiện.`;
            recommendation = 'Cần thay đổi chiến lược cai thuốc hoặc tăng cường hỗ trợ từ coach.';
        }
        // Need support (cigarettes increasing or high craving)
        else {
            status = 'cần hỗ trợ';
            statusCode = 'need_support';
            description = `Cần hỗ trợ gấp! Mức độ hút thuốc tăng lên hoặc cơn thèm cao.`;
            recommendation = 'Liên hệ ngay với coach để được hỗ trợ cá nhân hóa.';
        }
    } else {
        // New user, judge based on recent data only
        if (recentAvgCigarettes <= 2 && recentAvgCraving <= 4) {
            status = 'đang tiến triển';
            statusCode = 'progressing';
            description = `Bắt đầu tốt! Trung bình ${recentAvgCigarettes.toFixed(1)} điếu/ngày.`;
            recommendation = 'Tiếp tục theo dõi và ghi nhật ký đều đặn.';
        } else if (recentAvgCigarettes <= 5) {
            status = 'chững lại';
            statusCode = 'stagnating';
            description = `Tiến trình chậm. Trung bình ${recentAvgCigarettes.toFixed(1)} điếu/ngày.`;
            recommendation = 'Cần xây dựng kế hoạch cai thuốc rõ ràng hơn.';
        } else {
            status = 'cần hỗ trợ';
            statusCode = 'need_support';
            description = `Cần hỗ trợ! Mức độ hút thuốc còn cao (${recentAvgCigarettes.toFixed(1)} điếu/ngày).`;
            recommendation = 'Cần tư vấn chuyên sâu từ coach để xây dựng lộ trình phù hợp.';
        }
    }

    return {
        status,
        description,
        statusCode,
        recommendation,
        metrics: {
            recentAvgCigarettes: recentAvgCigarettes.toFixed(1),
            recentAvgCraving: recentAvgCraving.toFixed(1),
            daysSmokeFree: recentDaysSmokeFree,
            totalProgressDays: progressData.length
        }
    };
}

// Helper function to calculate member statistics
function calculateMemberStatistics(progressData, smokingStatus) {
    if (!progressData || progressData.length === 0) {
        return {
            totalDaysTracked: 0,
            averageCigarettesPerDay: 0,
            averageCravingLevel: 0,
            totalMoneySaved: 0,
            bestDaysSmokeFree: 0,
            progressTrend: 'no_data'
        };
    }

    const totalDaysTracked = progressData.length;
    const averageCigarettesPerDay = progressData.reduce((sum, item) => sum + (item.CigarettesSmoked || 0), 0) / totalDaysTracked;
    const averageCravingLevel = progressData.reduce((sum, item) => sum + (item.CravingLevel || 0), 0) / totalDaysTracked;
    const totalMoneySaved = Math.max(...progressData.map(item => item.MoneySaved || 0));
    const bestDaysSmokeFree = Math.max(...progressData.map(item => item.DaysSmokeFree || 0));

    // Calculate trend (comparing first half vs second half of data)
    let progressTrend = 'stable';
    if (totalDaysTracked >= 6) {
        const halfPoint = Math.floor(totalDaysTracked / 2);
        const recentHalf = progressData.slice(0, halfPoint);
        const olderHalf = progressData.slice(halfPoint);

        const recentAvg = recentHalf.reduce((sum, item) => sum + (item.CigarettesSmoked || 0), 0) / recentHalf.length;
        const olderAvg = olderHalf.reduce((sum, item) => sum + (item.CigarettesSmoked || 0), 0) / olderHalf.length;

        if (recentAvg < olderAvg - 1) {
            progressTrend = 'improving';
        } else if (recentAvg > olderAvg + 1) {
            progressTrend = 'declining';
        }
    }

    return {
        totalDaysTracked,
        averageCigarettesPerDay: parseFloat(averageCigarettesPerDay.toFixed(1)),
        averageCravingLevel: parseFloat(averageCravingLevel.toFixed(1)),
        totalMoneySaved: parseFloat(totalMoneySaved.toFixed(2)),
        bestDaysSmokeFree,
        progressTrend,
        cigarettesPerDayBeforeQuitting: smokingStatus ? smokingStatus.CigarettesPerDay : null,
        smokingFrequency: smokingStatus ? smokingStatus.SmokingFrequency : null
    };
}

// Helper function to calculate detailed progress analytics for member progress page
function calculateDetailedProgressAnalytics(progressData, smokingStatus) {
    if (!progressData || progressData.length === 0) {
        return {
            summary: {
                totalDaysTracked: 0,
                averageCigarettesPerDay: 0,
                averageCravingLevel: 0,
                currentMoneySaved: 0,
                bestDaysSmokeFree: 0,
                progressStatus: 'no_data'
            },
            trends: {
                cigarettesTrend: 'no_data',
                cravingTrend: 'no_data',
                moneySavingTrend: 'no_data',
                smokeFreeStreak: 0
            },
            weeklyAnalysis: [],
            improvements: [],
            concerns: []
        };
    }

    // Sort data by date (newest first)
    const sortedData = progressData.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    const totalDaysTracked = sortedData.length;

    // Basic statistics
    const totalCigarettes = sortedData.reduce((sum, item) => sum + (item.CigarettesSmoked || 0), 0);
    const averageCigarettesPerDay = totalCigarettes / totalDaysTracked;
    const averageCravingLevel = sortedData.reduce((sum, item) => sum + (item.CravingLevel || 0), 0) / totalDaysTracked;
    const currentMoneySaved = Math.max(...sortedData.map(item => item.MoneySaved || 0));
    const bestDaysSmokeFree = Math.max(...sortedData.map(item => item.DaysSmokeFree || 0));

    // Weekly analysis (group by weeks)
    const weeklyAnalysis = [];
    const weeksToAnalyze = Math.min(Math.ceil(totalDaysTracked / 7), 8); // Max 8 weeks

    for (let week = 0; week < weeksToAnalyze; week++) {
        const weekStart = week * 7;
        const weekEnd = Math.min((week + 1) * 7, totalDaysTracked);
        const weekData = sortedData.slice(weekStart, weekEnd);

        if (weekData.length > 0) {
            const weekStartDate = new Date(weekData[weekData.length - 1].Date);
            const weekEndDate = new Date(weekData[0].Date);

            weeklyAnalysis.push({
                week: week + 1,
                startDate: weekStartDate,
                endDate: weekEndDate,
                daysTracked: weekData.length,
                averageCigarettes: parseFloat((weekData.reduce((sum, item) => sum + (item.CigarettesSmoked || 0), 0) / weekData.length).toFixed(1)),
                averageCraving: parseFloat((weekData.reduce((sum, item) => sum + (item.CravingLevel || 0), 0) / weekData.length).toFixed(1)),
                smokeFreeStreak: Math.max(...weekData.map(item => item.DaysSmokeFree || 0)),
                moneySaved: Math.max(...weekData.map(item => item.MoneySaved || 0)),
                smokeFreeCount: weekData.filter(item => (item.CigarettesSmoked || 0) === 0).length
            });
        }
    }

    // Calculate trends
    let cigarettesTrend = 'stable';
    let cravingTrend = 'stable';
    let moneySavingTrend = 'stable';

    if (weeklyAnalysis.length >= 2) {
        const recentWeek = weeklyAnalysis[0];
        const previousWeek = weeklyAnalysis[1];

        // Cigarettes trend
        if (recentWeek.averageCigarettes < previousWeek.averageCigarettes - 0.5) {
            cigarettesTrend = 'improving';
        } else if (recentWeek.averageCigarettes > previousWeek.averageCigarettes + 0.5) {
            cigarettesTrend = 'declining';
        }

        // Craving trend
        if (recentWeek.averageCraving < previousWeek.averageCraving - 0.5) {
            cravingTrend = 'improving';
        } else if (recentWeek.averageCraving > previousWeek.averageCraving + 0.5) {
            cravingTrend = 'declining';
        }

        // Money saving trend
        if (recentWeek.moneySaved > previousWeek.moneySaved) {
            moneySavingTrend = 'improving';
        }
    }

    // Calculate current smoke-free streak
    let currentSmokeFreeStreak = 0;
    for (const dayData of sortedData) {
        if ((dayData.CigarettesSmoked || 0) === 0) {
            currentSmokeFreeStreak++;
        } else {
            break;
        }
    }

    // Determine overall progress status
    let progressStatus = 'stable';
    if (averageCigarettesPerDay <= 2 && averageCravingLevel <= 4) {
        progressStatus = 'excellent';
    } else if (averageCigarettesPerDay <= 5 && cigarettesTrend === 'improving') {
        progressStatus = 'good';
    } else if (cigarettesTrend === 'declining' || averageCigarettesPerDay > 10) {
        progressStatus = 'needs_attention';
    }

    // Generate improvements and concerns
    const improvements = [];
    const concerns = [];

    if (cigarettesTrend === 'improving') {
        improvements.push('Số lượng thuốc hút giảm dần qua các tuần');
    }
    if (cravingTrend === 'improving') {
        improvements.push('Mức độ thèm thuốc giảm rõ rệt');
    }
    if (currentSmokeFreeStreak > 0) {
        improvements.push(`Đã ${currentSmokeFreeStreak} ngày không hút thuốc liên tiếp`);
    }
    if (currentMoneySaved > 0) {
        improvements.push(`Đã tiết kiệm được ${currentMoneySaved.toLocaleString('vi-VN')} VNĐ`);
    }

    if (cigarettesTrend === 'declining') {
        concerns.push('Số lượng thuốc hút tăng trong thời gian gần đây');
    }
    if (cravingTrend === 'declining') {
        concerns.push('Mức độ thèm thuốc tăng cao');
    }
    if (averageCigarettesPerDay > 10) {
        concerns.push('Số lượng thuốc hút hàng ngày vẫn còn cao');
    }
    if (totalDaysTracked < 7) {
        concerns.push('Cần theo dõi dữ liệu thường xuyên hơn');
    }

    return {
        summary: {
            totalDaysTracked,
            averageCigarettesPerDay: parseFloat(averageCigarettesPerDay.toFixed(1)),
            averageCravingLevel: parseFloat(averageCravingLevel.toFixed(1)),
            currentMoneySaved: parseFloat(currentMoneySaved.toFixed(2)),
            bestDaysSmokeFree,
            progressStatus,
            currentSmokeFreeStreak
        },
        trends: {
            cigarettesTrend,
            cravingTrend,
            moneySavingTrend,
            smokeFreeStreak: currentSmokeFreeStreak
        },
        weeklyAnalysis,
        improvements,
        concerns,
        chartData: {
            daily: sortedData.reverse().map(item => ({
                date: item.Date,
                cigarettes: item.CigarettesSmoked || 0,
                craving: item.CravingLevel || 0,
                moneySaved: item.MoneySaved || 0,
                daysSmokeFree: item.DaysSmokeFree || 0
            })),
            weekly: weeklyAnalysis.reverse()
        }
    };
}

module.exports = router; 