const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { protect, authorize } = require('../middleware/auth.middleware');
const nodemailer = require('nodemailer');

// Cấu hình nodemailer với TLS port 465
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for SSL/TLS on port 465
  auth: {
    user: 'wibuclient@gmail.com',
    pass: 'zvhw mkkm yrgl zpqf',
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  connectionTimeout: 60000, // 60 giây
  greetingTimeout: 30000,   // 30 giây
  socketTimeout: 60000,     // 60 giây
  debug: true, // Enable debug logs
  logger: true // Enable logs
});

// Verify connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Email transporter verification failed:', error);
    } else {
        console.log('✅ Email transporter is ready to send messages (TLS 465)');
    }
});

// Thêm templates và function notifyAppointmentChange
const EMAIL_TEMPLATES = {
  create:  { subject: 'Lịch hẹn mới được tạo',  statusText: 'đặt mới' },
  confirm: { subject: 'Lịch hẹn đã xác nhận',   statusText: 'xác nhận' },
  complete:{ subject: 'Lịch hẹn đã hoàn thành', statusText: 'hoàn thành' },
  cancel:  { subject: 'Lịch hẹn đã bị huỷ',     statusText: 'huỷ' },
  delete:  { subject: 'Lịch hẹn đã bị xoá',     statusText: 'xoá' },
  'update-link': { subject: 'Cập nhật link tham gia', statusText: 'cập nhật link' },
  update:  { subject: 'Cập nhật lịch hẹn',      statusText: 'cập nhật' },
};

async function notifyAppointmentChange({ action, appointment, member, notes = '', meetingLink = '#' }) {
  const { subject, statusText } = EMAIL_TEMPLATES[action] || EMAIL_TEMPLATES.update;

  const apptDate = new Date(appointment.AppointmentDate);
  const dateStr  = apptDate.toLocaleDateString('vi-VN');
  const timeStr  = apptDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const html = `
    <p>Xin chào <strong>${member.FirstName} ${member.LastName}</strong>,</p>
    <p>Lịch hẹn tư vấn của bạn đã được <strong>${statusText}</strong>.</p>
    <ul>
      <li><strong>Thời gian:</strong> ${dateStr} lúc ${timeStr}</li>
      <li><strong>Trạng thái:</strong> ${statusText}</li>
      <li><strong>Ghi chú:</strong> ${notes || 'Không có'}</li>
      <li><strong>Link tham gia:</strong> <a href="${meetingLink}">${meetingLink}</a></li>
    </ul>
    <p>Trân trọng,<br/>Đội ngũ SmokeKing</p>`;

  await transporter.sendMail({
    from: 'SmokeKing <wibuclient@gmail.com>',
    to: member.Email,
    subject: `[SmokeKing] ${subject}`,
    html,
  });
}

// Test email endpoint với thông tin port mới
router.get('/test-email', async (req, res) => {
    try {
        console.log('🧪 Testing email configuration with TLS 465...');
        
        // Test connection
        await transporter.verify();
        console.log('✅ SMTP TLS 465 connection verified');
        
        // Send test email
        const testResult = await transporter.sendMail({
            from: 'SmokeKing <wibuclient@gmail.com>',
            to: 'wibuclient@gmail.com',
            subject: 'Test Email - SmokeKing (TLS 465)',
            html: `
                <h2>Test Email - TLS Configuration</h2>
                <p>Email configuration is working correctly!</p>
                <ul>
                    <li><strong>Host:</strong> smtp.gmail.com</li>
                    <li><strong>Port:</strong> 465</li>
                    <li><strong>Security:</strong> TLS/SSL</li>
                    <li><strong>User:</strong> wibuclient@gmail.com</li>
                </ul>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                <p>🎉 Email gửi thành công qua TLS port 465!</p>
            `
        });
        
        console.log('✅ Test email sent successfully via TLS 465:', testResult.messageId);
        
        res.json({
            success: true,
            message: 'Email test successful with TLS 465',
            messageId: testResult.messageId,
            config: {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                protocol: 'TLS/SSL',
                user: 'wibuclient@gmail.com'
            }
        });
        
    } catch (error) {
        console.error('❌ Email test failed with TLS 465:', error);
        res.status(500).json({
            success: false,
            message: 'Email test failed with TLS 465',
            error: error.message,
            code: error.code,
            config: {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                protocol: 'TLS/SSL'
            }
        });
    }
});

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

        console.log('🔑 Coach login debug:');
        console.log('   User from DB:', user);
        console.log('   Token payload:', { id: user.UserID, email: user.Email, role: user.Role });
        console.log('   Generated token:', token.substring(0, 20) + '...');

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

// Get all coaches (for member to select when booking appointments)
router.get('/', async (req, res) => {
    try {
        console.log('🔍 Getting all coaches...');

        const result = await pool.request()
            .query(`
                SELECT 
                    u.UserID,
                    u.Email,
                    u.FirstName,
                    u.LastName,
                    u.Avatar,
                    u.PhoneNumber,
                    u.IsActive,
                    cp.Bio,
                    cp.Specialization,
                    cp.Experience,
                    cp.HourlyRate,
                    cp.IsAvailable,
                    (SELECT AVG(CAST(Rating AS FLOAT)) FROM CoachReviews WHERE CoachUserID = u.UserID AND IsPublic = 1) as AverageRating,
                    (SELECT COUNT(*) FROM CoachReviews WHERE CoachUserID = u.UserID AND IsPublic = 1) as ReviewCount
                FROM Users u
                LEFT JOIN CoachProfiles cp ON u.UserID = cp.UserID
                WHERE u.Role = 'coach' AND u.IsActive = 1
                ORDER BY u.FirstName, u.LastName
            `);

        const coaches = result.recordset.map(coach => ({
            UserID: coach.UserID,
            Email: coach.Email,
            FirstName: coach.FirstName,
            LastName: coach.LastName,
            FullName: `${coach.FirstName} ${coach.LastName}`,
            Avatar: coach.Avatar,
            PhoneNumber: coach.PhoneNumber,
            IsActive: coach.IsActive === true || coach.IsActive === 1,
            Bio: coach.Bio,
            Specialization: coach.Specialization,
            Experience: coach.Experience,
            HourlyRate: coach.HourlyRate,
            IsAvailable: coach.IsAvailable === true || coach.IsAvailable === 1,
            AverageRating: coach.AverageRating ? parseFloat(coach.AverageRating).toFixed(1) : 0,
            ReviewCount: coach.ReviewCount || 0
        }));

        console.log(`✅ Found ${coaches.length} coaches`);

        res.json({
            success: true,
            data: coaches,
            message: `Tìm thấy ${coaches.length} coach`
        });

    } catch (error) {
        console.error('Error getting coaches:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách coach',
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

        // Get the coach profile data if exists
        const coachProfile = profileResult.recordset.length > 0 ? profileResult.recordset[0] : null;

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

            // Professional info from CoachProfiles (flatten to root level for easier access)
            Bio: coachProfile?.Bio || null,
            Specialization: coachProfile?.Specialization || null,
            Experience: coachProfile?.Experience || 0,
            HourlyRate: coachProfile?.HourlyRate || null,
            IsAvailable: coachProfile?.IsAvailable || true,
            YearsOfExperience: coachProfile?.YearsOfExperience || 0,
            Education: coachProfile?.Education || null,
            Certifications: coachProfile?.Certifications || null,
            Languages: coachProfile?.Languages || null,
            WorkingHours: coachProfile?.WorkingHours || null,
            ConsultationTypes: coachProfile?.ConsultationTypes || null,
            SuccessRate: coachProfile?.SuccessRate || 0,
            TotalClients: coachProfile?.TotalClients || 0,

            // Keep professional profile as well for compatibility
            professionalProfile: coachProfile,

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

        console.log('Update coach profile request:', {
            userId: req.user.UserID,
            firstName,
            lastName,
            phoneNumber,
            address
        });

        // Validate required fields
        if (!firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Họ và tên là bắt buộc'
            });
        }

        // Import sql from database config
        const { sql } = require('../config/database');

        // Start transaction
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Update basic user information
            const updateUserRequest = new sql.Request(transaction);
            await updateUserRequest
                .input('UserID', sql.Int, req.user.UserID)
                .input('FirstName', sql.NVarChar, firstName)
                .input('LastName', sql.NVarChar, lastName)
                .input('PhoneNumber', sql.NVarChar, phoneNumber || null)
                .input('Address', sql.NVarChar, address || null)
                .input('Avatar', sql.NVarChar, avatar || null)
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

            console.log('Basic user info updated successfully');

            // Check if professional profile exists
            const checkProfileRequest = new sql.Request(transaction);
            const existingProfile = await checkProfileRequest
                .input('UserID', sql.Int, req.user.UserID)
                .query('SELECT ProfileID FROM CoachProfiles WHERE UserID = @UserID');

            if (existingProfile.recordset.length > 0) {
                console.log('Updating existing professional profile');
                // Update existing professional profile with all available fields
                const updateProfileRequest = new sql.Request(transaction);
                await updateProfileRequest
                    .input('UserID', sql.Int, req.user.UserID)
                    .input('Specialization', sql.NVarChar, specialization || null)
                    .input('Experience', sql.Int, yearsOfExperience || 0)
                    .input('Bio', sql.NVarChar, bio || null)
                    .input('HourlyRate', sql.Decimal(10, 2), hourlyRate || null)
                    .input('YearsOfExperience', sql.Int, yearsOfExperience || 0)
                    .input('Education', sql.NVarChar, education || null)
                    .input('Certifications', sql.NVarChar, certifications || null)
                    .input('Languages', sql.NVarChar, languages || null)
                    .input('WorkingHours', sql.NVarChar, workingHours || null)
                    .input('ConsultationTypes', sql.NVarChar, servicesOffered || null)
                    .query(`
                        UPDATE CoachProfiles SET 
                            Specialization = @Specialization,
                            Experience = @Experience,
                            Bio = @Bio,
                            HourlyRate = @HourlyRate,
                            YearsOfExperience = @YearsOfExperience,
                            Education = @Education,
                            Certifications = @Certifications,
                            Languages = @Languages,
                            WorkingHours = @WorkingHours,
                            ConsultationTypes = @ConsultationTypes,
                            UpdatedAt = GETDATE()
                        WHERE UserID = @UserID
                    `);
                console.log('Updated professional profile with complete data');
            } else {
                console.log('Creating new professional profile');
                // Create new professional profile with all available fields
                const createProfileRequest = new sql.Request(transaction);
                await createProfileRequest
                    .input('UserID', sql.Int, req.user.UserID)
                    .input('Specialization', sql.NVarChar, specialization || null)
                    .input('Experience', sql.Int, yearsOfExperience || 0)
                    .input('Bio', sql.NVarChar, bio || null)
                    .input('HourlyRate', sql.Decimal(10, 2), hourlyRate || null)
                    .input('YearsOfExperience', sql.Int, yearsOfExperience || 0)
                    .input('Education', sql.NVarChar, education || null)
                    .input('Certifications', sql.NVarChar, certifications || null)
                    .input('Languages', sql.NVarChar, languages || null)
                    .input('WorkingHours', sql.NVarChar, workingHours || null)
                    .input('ConsultationTypes', sql.NVarChar, servicesOffered || null)
                    .query(`
                        INSERT INTO CoachProfiles (
                            UserID, Specialization, Experience, Bio, HourlyRate, YearsOfExperience,
                            Education, Certifications, Languages, WorkingHours, ConsultationTypes,
                            IsAvailable, CreatedAt, UpdatedAt
                        ) VALUES (
                            @UserID, @Specialization, @Experience, @Bio, @HourlyRate, @YearsOfExperience,
                            @Education, @Certifications, @Languages, @WorkingHours, @ConsultationTypes,
                            1, GETDATE(), GETDATE()
                        )
                    `);
                console.log('Created new professional profile with complete data');
            }

            // Commit transaction
            await transaction.commit();
            console.log('Transaction committed successfully');

            res.json({
                success: true,
                message: 'Cập nhật thông tin thành công'
            });

        } catch (error) {
            // Rollback transaction on error
            console.error('Transaction error, rolling back:', error);
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

// Test endpoint for debugging profile update
router.put('/profile-test', protect, authorize('coach'), async (req, res) => {
    try {
        console.log('🧪 Test profile update endpoint hit');
        console.log('User ID:', req.user.UserID);
        console.log('Request body:', req.body);

        const { firstName, lastName } = req.body;

        // Simple user update only
        await pool.request()
            .input('UserID', req.user.UserID)
            .input('FirstName', firstName || 'TestCoach')
            .input('LastName', lastName || 'TestName')
            .query(`
                UPDATE Users SET 
                    FirstName = @FirstName,
                    LastName = @LastName,
                    UpdatedAt = GETDATE()
                WHERE UserID = @UserID
            `);

        console.log('✅ Test update successful');

        res.json({
            success: true,
            message: 'Test update successful',
            userId: req.user.UserID
        });

    } catch (error) {
        console.error('❌ Test update error:', error);
        res.status(500).json({
            success: false,
            message: 'Test update failed',
            error: error.message
        });
    }
});

// Get all members/users for coach dashboard
router.get('/members', protect, authorize('coach'), async (req, res) => {
    try {
        const coachId = req.user.id; // Get current coach ID from auth middleware

        console.log('🔍 Coach /members endpoint debug:');
        console.log('   req.user:', req.user);
        console.log('   coachId:', coachId);

        // Get only members assigned to this coach through QuitPlans (DISTINCT to avoid duplicates)
        const result = await pool.request()
            .input('CoachID', coachId)
            .query(`
                SELECT DISTINCT
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
                    qp_latest.PlanID as QuitPlanID,
                    qp_latest.StartDate as QuitStartDate,
                    qp_latest.TargetDate as QuitTargetDate,
                    qp_latest.Status as QuitPlanStatus,
                    qp_latest.MotivationLevel,
                    qp_latest.CoachID,
                    pt.CigarettesSmoked,
                    pt.DaysSmokeFree,
                    pt.MoneySaved,
                    pt.CravingLevel
                FROM Users u
                INNER JOIN (
                    -- Get latest QuitPlan for each user assigned to this coach
                    SELECT qp.*,
                           ROW_NUMBER() OVER (PARTITION BY qp.UserID ORDER BY qp.CreatedAt DESC) as rn
                    FROM QuitPlans qp
                    WHERE qp.CoachID = @CoachID
                        AND qp.Status = 'active'
                ) qp_latest ON u.UserID = qp_latest.UserID AND qp_latest.rn = 1
                LEFT JOIN UserMemberships um ON u.UserID = um.UserID 
                    AND um.Status = 'active' 
                    AND um.EndDate > GETDATE()
                LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
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
                    AND u.IsActive = 1
                ORDER BY u.CreatedAt DESC
            `);

        console.log('   SQL result count:', result.recordset.length);
        console.log('   SQL result:', result.recordset);

        // Get achievement counts for assigned members only
        const achievementCounts = await pool.request()
            .input('CoachID', coachId)
            .query(`
                SELECT 
                    ua.UserID,
                    COUNT(*) as AchievementCount
                FROM UserAchievements ua
                WHERE ua.UserID IN (
                    SELECT DISTINCT qp.UserID 
                    FROM QuitPlans qp 
                    WHERE qp.CoachID = @CoachID AND qp.Status = 'active'
                )
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
                motivationLevel: user.MotivationLevel,
                coachId: user.CoachID
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

        console.log('   Final members count:', members.length);

        res.json({
            success: true,
            data: members,
            total: members.length,
            message: members.length > 0
                ? `Đã lấy danh sách ${members.length} members được phân công thành công`
                : 'Chưa có members nào được phân công cho bạn'
        });

    } catch (error) {
        console.error('Error getting assigned members:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách members được phân công',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get member statistics for dashboard
router.get('/stats', protect, authorize('coach'), async (req, res) => {
    try {
        const coachId = req.user.id; // Get current coach ID from auth middleware

        // Get statistics only for members assigned to this coach
        const totalMembersResult = await pool.request()
            .input('CoachID', coachId)
            .query(`
                SELECT COUNT(DISTINCT u.UserID) as TotalMembers
                FROM Users u
                INNER JOIN QuitPlans qp ON u.UserID = qp.UserID
                WHERE u.Role IN ('guest', 'member')
                    AND qp.CoachID = @CoachID
                    AND qp.Status = 'active'
                    AND u.IsActive = 1
            `);

        const activeMembersResult = await pool.request()
            .input('CoachID', coachId)
            .query(`
                SELECT COUNT(DISTINCT u.UserID) as ActiveMembers
                FROM Users u
                INNER JOIN QuitPlans qp ON u.UserID = qp.UserID
                INNER JOIN UserMemberships um ON u.UserID = um.UserID
                WHERE u.Role IN ('guest', 'member')
                    AND qp.CoachID = @CoachID
                    AND qp.Status = 'active'
                    AND um.Status = 'active'
                    AND um.EndDate > GETDATE()
                    AND u.IsActive = 1
            `);

        const completedPlansResult = await pool.request()
            .input('CoachID', coachId)
            .query(`
                SELECT COUNT(*) as CompletedPlans
                FROM QuitPlans qp
                JOIN Users u ON qp.UserID = u.UserID
                WHERE u.Role IN ('guest', 'member')
                    AND qp.CoachID = @CoachID
                    AND qp.Status = 'completed'
            `);

        // Calculate success rate based on coach's plans
        const totalPlansResult = await pool.request()
            .input('CoachID', coachId)
            .query(`
                SELECT COUNT(*) as TotalPlans
                FROM QuitPlans qp
                JOIN Users u ON qp.UserID = u.UserID
                WHERE u.Role IN ('guest', 'member')
                    AND qp.CoachID = @CoachID
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
            message: totalMembers > 0
                ? 'Đã lấy thống kê thành công'
                : 'Chưa có members nào được phân công cho bạn'
        });

    } catch (error) {
        console.error('Error getting coach stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê coach',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get detailed member information with quit smoking status
router.get('/members/:id/details', protect, authorize('coach'), async (req, res) => {
    try {
        const memberId = req.params.id;
        const coachId = req.user.id; // Get current coach ID from auth middleware

        // Validate member ID
        if (!memberId || isNaN(memberId)) {
            return res.status(400).json({
                success: false,
                message: 'ID thành viên không hợp lệ'
            });
        }

        // First check if this member is assigned to the current coach
        const assignmentCheck = await pool.request()
            .input('UserID', memberId)
            .input('CoachID', coachId)
            .query(`
                SELECT qp.PlanID, qp.CoachID
                FROM QuitPlans qp
                JOIN Users u ON qp.UserID = u.UserID
                WHERE qp.UserID = @UserID 
                    AND qp.CoachID = @CoachID 
                    AND qp.Status = 'active'
                    AND u.Role IN ('guest', 'member')
                    AND u.IsActive = 1
            `);

        if (assignmentCheck.recordset.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem thông tin member này. Member chưa được phân công cho bạn.'
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

// ==================== COACHING APPOINTMENT APIS ====================

// Create appointment (Coach schedules with Member)
router.post('/schedule', protect, authorize('coach'), async (req, res) => {
    try {
        const { memberId, appointmentDate, duration = 30, type = 'chat', notes } = req.body;
        const coachId = req.user.UserID;

        console.log('📅 Coach schedule appointment request:', {
            coachId,
            memberId,
            appointmentDate,
            duration,
            type,
            notes,
            user: req.user
        });

        // Validate input
        if (!memberId || !appointmentDate) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin: memberId và appointmentDate'
            });
        }

        // Validate appointment date (must be in the future)
        const appointmentDateTime = new Date(appointmentDate);
        const now = new Date();
        if (appointmentDateTime <= now) {
            return res.status(400).json({
                success: false,
                message: 'Thời gian hẹn phải trong tương lai'
            });
        }

        // Check if member exists
        const memberCheck = await pool.request()
            .input('MemberID', memberId)
            .query(`
                SELECT u.UserID, u.FirstName, u.LastName, u.Email,
                       um.Status as MembershipStatus, um.EndDate as MembershipEndDate,
                       mp.Name as PlanName
                FROM Users u
                LEFT JOIN UserMemberships um ON u.UserID = um.UserID AND um.Status = 'active'
                LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                WHERE u.UserID = @MemberID AND u.Role IN ('member', 'guest')
            `);

        if (memberCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành viên'
            });
        }

        const member = memberCheck.recordset[0];

        // NEW: Check if member has active membership and appointment is within membership period
        if (!member.MembershipStatus || member.MembershipStatus !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Thành viên này không có gói membership còn hiệu lực. Không thể đặt lịch tư vấn.'
            });
        }

        const membershipEndDate = new Date(member.MembershipEndDate);
        if (appointmentDateTime > membershipEndDate) {
            return res.status(400).json({
                success: false,
                message: `Không thể đặt lịch vào ngày ${appointmentDateTime.toLocaleDateString('vi-VN')} vì gói ${member.PlanName} của thành viên hết hạn vào ngày ${membershipEndDate.toLocaleDateString('vi-VN')}. Vui lòng chọn ngày khác.`
            });
        }

        // Check if coach and member have an existing relationship (through quit plan)
        // Temporarily disabled for testing
        /*
        const relationshipCheck = await pool.request()
            .input('CoachID', coachId)
            .input('MemberID', memberId)
            .query(`
                SELECT COUNT(*) as count
                FROM QuitPlans
                WHERE CoachID = @CoachID AND UserID = @MemberID AND Status = 'active'
            `);

        if (relationshipCheck.recordset[0].count === 0) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chưa được assign làm coach cho thành viên này'
            });
        }
        */

        // Check for scheduling conflicts
        const conflictCheck = await pool.request()
            .input('CoachID', coachId)
            .input('AppointmentDate', appointmentDate)
            .input('Duration', duration)
            .query(`
                SELECT COUNT(*) as count
                FROM ConsultationAppointments
                WHERE CoachID = @CoachID 
                AND Status IN ('scheduled', 'confirmed')
                AND (
                    (AppointmentDate <= @AppointmentDate AND DATEADD(MINUTE, Duration, AppointmentDate) > @AppointmentDate)
                    OR
                    (AppointmentDate < DATEADD(MINUTE, @Duration, @AppointmentDate) AND AppointmentDate >= @AppointmentDate)
                )
            `);

        if (conflictCheck.recordset[0].count > 0) {
            return res.status(409).json({
                success: false,
                message: 'Thời gian này đã có lịch hẹn khác. Vui lòng chọn thời gian khác'
            });
        }

        // Create the appointment
        const result = await pool.request()
            .input('CoachID', coachId)
            .input('MemberID', memberId)
            .input('AppointmentDate', appointmentDate)
            .input('Duration', duration)
            .input('Type', type)
            .input('Notes', notes || '')
            .query(`
                INSERT INTO ConsultationAppointments (CoachID, MemberID, AppointmentDate, Duration, Type, Notes, Status)
                OUTPUT INSERTED.AppointmentID, INSERTED.AppointmentDate, INSERTED.Duration, INSERTED.Type, INSERTED.Status
                VALUES (@CoachID, @MemberID, @AppointmentDate, @Duration, @Type, @Notes, 'scheduled')
            `);

        const appointment = result.recordset[0];

        // Generate meeting link if it's video/audio call
        let meetingLink = null;
        if (type === 'video' || type === 'audio') {
            // In a real app, you would integrate with Zoom/Google Meet API here
            meetingLink = `https://meet.smokeking.com/room/${appointment.AppointmentID}`;

            // Update appointment with meeting link
            await pool.request()
                .input('AppointmentID', appointment.AppointmentID)
                .input('MeetingLink', meetingLink)
                .query(`
                    UPDATE ConsultationAppointments 
                    SET MeetingLink = @MeetingLink 
                    WHERE AppointmentID = @AppointmentID
                `);
        }

        // 👉 THÊM EMAIL NOTIFICATION Ở ĐÂY
        try {
            await notifyAppointmentChange({
                action: 'create',
                appointment,
                member,
                notes,
                meetingLink: meetingLink || '#',
            });
        } catch (emailError) {
            console.log('⚠️ Email notification failed:', emailError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Lịch tư vấn đã được đặt thành công',
            data: {
                appointmentId: appointment.AppointmentID,
                appointmentDate: appointment.AppointmentDate,
                duration: appointment.Duration,
                type: appointment.Type,
                status: appointment.Status,
                meetingLink: meetingLink,
                member: {
                    id: member.UserID,
                    name: `${member.FirstName} ${member.LastName}`,
                    email: member.Email,
                    planName: member.PlanName
                }
            }
        });

    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo lịch hẹn',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get coach's appointments
router.get('/appointments', protect, authorize('coach'), async (req, res) => {
    try {
        const coachId = req.user.UserID;
        const { status, date, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT 
                ca.AppointmentID,
                ca.AppointmentDate,
                ca.Duration,
                ca.Type,
                ca.Status,
                ca.Notes,
                ca.MeetingLink,
                ca.CreatedAt,
                ca.UpdatedAt,
                u.UserID as MemberID,
                u.FirstName as MemberFirstName,
                u.LastName as MemberLastName,
                u.Email as MemberEmail,
                u.Avatar as MemberAvatar,
                mp.Name as MembershipPlan
            FROM ConsultationAppointments ca
            INNER JOIN Users u ON ca.MemberID = u.UserID
            LEFT JOIN UserMemberships um ON u.UserID = um.UserID AND um.Status = 'active'
            LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            WHERE ca.CoachID = @CoachID
        `;

        const request = pool.request().input('CoachID', coachId);

        // Add filters
        if (status) {
            query += ` AND ca.Status = @Status`;
            request.input('Status', status);
        }

        if (date) {
            query += ` AND CAST(ca.AppointmentDate AS DATE) = @Date`;
            request.input('Date', date);
        }

        query += ` ORDER BY ca.AppointmentDate DESC`;
        query += ` OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY`;

        request.input('Offset', parseInt(offset));
        request.input('Limit', parseInt(limit));

        const result = await request.query(query);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total
            FROM ConsultationAppointments ca
            WHERE ca.CoachID = @CoachID
        `;

        const countRequest = pool.request().input('CoachID', coachId);

        if (status) {
            countQuery += ` AND ca.Status = @Status`;
            countRequest.input('Status', status);
        }

        if (date) {
            countQuery += ` AND CAST(ca.AppointmentDate AS DATE) = @Date`;
            countRequest.input('Date', date);
        }

        const countResult = await countRequest.query(countQuery);
        const total = countResult.recordset[0].total;

        // Format appointments data
        const appointments = result.recordset.map(appointment => ({
            id: appointment.AppointmentID,
            appointmentDate: appointment.AppointmentDate,
            duration: appointment.Duration,
            type: appointment.Type,
            status: appointment.Status,
            notes: appointment.Notes,
            meetingLink: appointment.MeetingLink,
            createdAt: appointment.CreatedAt,
            updatedAt: appointment.UpdatedAt,
            member: {
                id: appointment.MemberID,
                firstName: appointment.MemberFirstName,
                lastName: appointment.MemberLastName,
                fullName: `${appointment.MemberFirstName} ${appointment.MemberLastName}`,
                email: appointment.MemberEmail,
                avatar: appointment.MemberAvatar,
                membershipPlan: appointment.MembershipPlan
            }
        }));

        res.json({
            success: true,
            data: appointments,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < total
            }
        });

    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tải danh sách lịch hẹn',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update appointment status
router.patch('/appointments/:appointmentId', protect, authorize('coach'), async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status, notes, meetingLink } = req.body;
        const coachId = req.user.UserID;

        // Validate status
        const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        // Check if appointment exists and belongs to this coach
        const appointmentCheck = await pool.request()
            .input('AppointmentID', appointmentId)
            .input('CoachID', coachId)
            .query(`
                SELECT AppointmentID, Status, AppointmentDate
                FROM ConsultationAppointments
                WHERE AppointmentID = @AppointmentID AND CoachID = @CoachID
            `);

        if (appointmentCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch hẹn hoặc bạn không có quyền chỉnh sửa'
            });
        }

        const appointment = appointmentCheck.recordset[0];

        // Build update query dynamically
        let updateFields = [];
        const request = pool.request()
            .input('AppointmentID', appointmentId)
            .input('CoachID', coachId);

        if (status) {
            updateFields.push('Status = @Status');
            request.input('Status', status);
        }

        if (notes !== undefined) {
            updateFields.push('Notes = @Notes');
            request.input('Notes', notes);
        }

        if (meetingLink !== undefined) {
            updateFields.push('MeetingLink = @MeetingLink');
            request.input('MeetingLink', meetingLink);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có thông tin nào để cập nhật'
            });
        }

        updateFields.push('UpdatedAt = GETDATE()');

        const updateQuery = `
            UPDATE ConsultationAppointments 
            SET ${updateFields.join(', ')}
            OUTPUT INSERTED.AppointmentID, INSERTED.Status, INSERTED.Notes, INSERTED.MeetingLink, INSERTED.UpdatedAt
            WHERE AppointmentID = @AppointmentID AND CoachID = @CoachID
        `;

        const result = await request.query(updateQuery);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không thể cập nhật lịch hẹn'
            });
        }

        const updatedAppointment = result.recordset[0];

        // 👉 THÊM EMAIL NOTIFICATION Ở ĐÂY
        try {
            // Lấy thông tin member
            const memberInfo = await pool.request()
                .input('AppointmentID', appointmentId)
                .query(`
                    SELECT u.UserID, u.FirstName, u.LastName, u.Email,
                           ca.AppointmentDate
                    FROM ConsultationAppointments ca
                    JOIN Users u ON ca.MemberID = u.UserID
                    WHERE ca.AppointmentID = @AppointmentID
                `);

            if (memberInfo.recordset.length > 0) {
                const member = memberInfo.recordset[0];
                
                // Xác định action theo status
                let action = 'update';
                if (status === 'confirmed') action = 'confirm';
                if (status === 'completed') action = 'complete';
                if (status === 'cancelled') action = 'cancel';

                await notifyAppointmentChange({
                    action,
                    appointment: { ...updatedAppointment, AppointmentDate: member.AppointmentDate },
                    member,
                    notes: updatedAppointment.Notes,
                    meetingLink: updatedAppointment.MeetingLink || '#',
                });
            }
        } catch (emailError) {
            console.log('⚠️ Email notification failed:', emailError.message);
        }

        res.json({
            success: true,
            message: 'Cập nhật lịch hẹn thành công',
            data: {
                appointmentId: updatedAppointment.AppointmentID,
                status: updatedAppointment.Status,
                notes: updatedAppointment.Notes,
                meetingLink: updatedAppointment.MeetingLink,
                updatedAt: updatedAppointment.UpdatedAt
            }
        });

    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật lịch hẹn',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update appointment meeting link
router.patch('/appointments/:appointmentId/meeting-link', protect, authorize('coach'), async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { meetingLink } = req.body;
        const coachId = req.user.UserID;

        // Check if appointment exists and belongs to this coach
        const appointmentCheck = await pool.request()
            .input('AppointmentID', appointmentId)
            .input('CoachID', coachId)
            .query(`
                SELECT AppointmentID, Status, AppointmentDate
                FROM ConsultationAppointments
                WHERE AppointmentID = @AppointmentID AND CoachID = @CoachID
            `);

        if (appointmentCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch hẹn hoặc bạn không có quyền chỉnh sửa'
            });
        }

        // Update meeting link
        const result = await pool.request()
            .input('AppointmentID', appointmentId)
            .input('CoachID', coachId)
            .input('MeetingLink', meetingLink || null)
            .query(`
                UPDATE ConsultationAppointments 
                SET MeetingLink = @MeetingLink, UpdatedAt = GETDATE()
                OUTPUT INSERTED.AppointmentID, INSERTED.MeetingLink, INSERTED.UpdatedAt
                WHERE AppointmentID = @AppointmentID AND CoachID = @CoachID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không thể cập nhật link tham gia'
            });
        }

        const updatedAppointment = result.recordset[0];

        res.json({
            success: true,
            message: 'Cập nhật link tham gia thành công',
            data: {
                appointmentId: updatedAppointment.AppointmentID,
                meetingLink: updatedAppointment.MeetingLink,
                updatedAt: updatedAppointment.UpdatedAt
            }
        });

    } catch (error) {
        console.error('Error updating meeting link:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật link tham gia',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete appointment
router.delete('/appointments/:appointmentId', protect, authorize('coach'), async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const coachId = req.user.UserID;

        // Check if appointment exists and belongs to this coach
        const appointmentCheck = await pool.request()
            .input('AppointmentID', appointmentId)
            .input('CoachID', coachId)
            .query(`
                SELECT AppointmentID, Status, AppointmentDate
                FROM ConsultationAppointments
                WHERE AppointmentID = @AppointmentID AND CoachID = @CoachID
            `);

        if (appointmentCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch hẹn hoặc bạn không có quyền xóa'
            });
        }

        const appointment = appointmentCheck.recordset[0];

        // Check if appointment can be deleted (not completed)
        if (appointment.Status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa lịch hẹn đã hoàn thành'
            });
        }

        // Delete the appointment
        await pool.request()
            .input('AppointmentID', appointmentId)
            .input('CoachID', coachId)
            .query(`
                DELETE FROM ConsultationAppointments
                WHERE AppointmentID = @AppointmentID AND CoachID = @CoachID
            `);

        res.json({
            success: true,
            message: 'Xóa lịch hẹn thành công'
        });

    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa lịch hẹn',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get available time slots for scheduling
router.get('/available-slots', protect, authorize('coach'), async (req, res) => {
    try {
        const coachId = req.user.UserID;
        const { date, duration = 30 } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ngày cần kiểm tra'
            });
        }

        // Get coach's working hours (default: 8:00 - 17:00)
        const workingHours = {
            start: 8, // 8:00 AM
            end: 17,  // 5:00 PM
            interval: parseInt(duration) // minutes
        };

        // Get existing appointments for the date
        const existingAppointments = await pool.request()
            .input('CoachID', coachId)
            .input('Date', date)
            .query(`
                SELECT AppointmentDate, Duration
                FROM ConsultationAppointments
                WHERE CoachID = @CoachID 
                AND CAST(AppointmentDate AS DATE) = @Date
                AND Status IN ('scheduled', 'confirmed')
                ORDER BY AppointmentDate
            `);

        // Generate available time slots
        const availableSlots = [];
        const selectedDate = new Date(date);

        for (let hour = workingHours.start; hour < workingHours.end; hour++) {
            for (let minute = 0; minute < 60; minute += workingHours.interval) {
                const slotStart = new Date(selectedDate);
                slotStart.setHours(hour, minute, 0, 0);

                const slotEnd = new Date(slotStart);
                slotEnd.setMinutes(slotEnd.getMinutes() + workingHours.interval);

                // Check if this slot conflicts with existing appointments
                const hasConflict = existingAppointments.recordset.some(appointment => {
                    const appointmentStart = new Date(appointment.AppointmentDate);
                    const appointmentEnd = new Date(appointmentStart);
                    appointmentEnd.setMinutes(appointmentEnd.getMinutes() + appointment.Duration);

                    return (slotStart < appointmentEnd && slotEnd > appointmentStart);
                });

                // Check if slot is in the future
                const now = new Date();
                const isInFuture = slotStart > now;

                if (!hasConflict && isInFuture) {
                    availableSlots.push({
                        startTime: slotStart.toISOString(),
                        endTime: slotEnd.toISOString(),
                        duration: workingHours.interval,
                        available: true
                    });
                }
            }
        }

        res.json({
            success: true,
            data: {
                date: date,
                duration: workingHours.interval,
                workingHours: {
                    start: `${workingHours.start}:00`,
                    end: `${workingHours.end}:00`
                },
                availableSlots: availableSlots,
                totalSlots: availableSlots.length
            }
        });

    } catch (error) {
        console.error('Error fetching available slots:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tải thời gian trống',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// =================== FEEDBACK ENDPOINTS ===================

// Get coach feedback/ratings (for coach to view their ratings)
router.get('/feedback', protect, authorize('coach'), async (req, res) => {
    try {
        const coachId = req.user.UserID;
        const { page = 1, limit = 10, status = 'active' } = req.query;
        const offset = (page - 1) * limit;

        // Get feedback with member info
        const result = await pool.request()
            .input('CoachID', coachId)
            .input('Status', status)
            .input('Limit', parseInt(limit))
            .input('Offset', offset)
            .query(`
                SELECT 
                    cf.FeedbackID,
                    cf.Rating,
                    cf.Comment,
                    cf.Categories,
                    cf.IsAnonymous,
                    cf.CreatedAt,
                    cf.UpdatedAt,
                    CASE 
                        WHEN cf.IsAnonymous = 1 THEN N'Ẩn danh'
                        ELSE u.FirstName + ' ' + u.LastName
                    END as MemberName,
                    CASE 
                        WHEN cf.IsAnonymous = 1 THEN NULL
                        ELSE u.Avatar
                    END as MemberAvatar,
                    ca.AppointmentDate,
                    ca.Type as AppointmentType
                FROM CoachFeedback cf
                INNER JOIN Users u ON cf.MemberID = u.UserID
                LEFT JOIN ConsultationAppointments ca ON cf.AppointmentID = ca.AppointmentID
                WHERE cf.CoachID = @CoachID AND cf.Status = @Status
                ORDER BY cf.CreatedAt DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
            `);

        // Get total count
        const countResult = await pool.request()
            .input('CoachID', coachId)
            .input('Status', status)
            .query(`
                SELECT COUNT(*) as Total
                FROM CoachFeedback
                WHERE CoachID = @CoachID AND Status = @Status
            `);

        // Get rating statistics
        const statsResult = await pool.request()
            .input('CoachID', coachId)
            .query(`
                SELECT * FROM CoachRatingStats WHERE CoachID = @CoachID
            `);

        const feedback = result.recordset.map(item => ({
            ...item,
            Categories: item.Categories ? JSON.parse(item.Categories) : null,
            CreatedAt: new Date(item.CreatedAt).toISOString(),
            UpdatedAt: new Date(item.UpdatedAt).toISOString(),
            AppointmentDate: item.AppointmentDate ? new Date(item.AppointmentDate).toISOString() : null
        }));

        const total = countResult.recordset[0]?.Total || 0;
        const stats = statsResult.recordset[0] || {
            TotalReviews: 0,
            AverageRating: 0,
            FiveStarCount: 0,
            FourStarCount: 0,
            ThreeStarCount: 0,
            TwoStarCount: 0,
            OneStarCount: 0
        };

        res.json({
            success: true,
            data: {
                feedback,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                statistics: {
                    totalReviews: stats.TotalReviews,
                    averageRating: parseFloat(stats.AverageRating || 0).toFixed(1),
                    ratingDistribution: {
                        5: stats.FiveStarCount,
                        4: stats.FourStarCount,
                        3: stats.ThreeStarCount,
                        2: stats.TwoStarCount,
                        1: stats.OneStarCount
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error getting coach feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải đánh giá',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Submit feedback (Member đánh giá Coach)
router.post('/feedback', protect, authorize('member', 'guest'), async (req, res) => {
    try {
        const memberId = req.user.UserID;
        const {
            coachId,
            appointmentId,
            rating,
            comment,
            categories,
            isAnonymous = false
        } = req.body;

        // Validate required fields
        if (!coachId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Coach ID và đánh giá là bắt buộc'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá phải từ 1 đến 5 sao'
            });
        }

        // Verify coach exists
        const coachCheck = await pool.request()
            .input('CoachID', coachId)
            .query(`
                SELECT UserID FROM Users 
                WHERE UserID = @CoachID AND Role = 'coach' AND IsActive = 1
            `);

        if (coachCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Coach không tồn tại'
            });
        }

        // Check if appointment exists and belongs to this member
        if (appointmentId) {
            const appointmentCheck = await pool.request()
                .input('AppointmentID', appointmentId)
                .input('MemberID', memberId)
                .input('CoachID', coachId)
                .query(`
                    SELECT AppointmentID 
                    FROM ConsultationAppointments
                    WHERE AppointmentID = @AppointmentID 
                    AND MemberID = @MemberID 
                    AND CoachID = @CoachID
                `);

            if (appointmentCheck.recordset.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cuộc hẹn không hợp lệ'
                });
            }
        }

        // Check if feedback already exists for this combination
        const existingFeedback = await pool.request()
            .input('MemberID', memberId)
            .input('CoachID', coachId)
            .input('AppointmentID', appointmentId || null)
            .query(`
                SELECT FeedbackID 
                FROM CoachFeedback
                WHERE MemberID = @MemberID 
                AND CoachID = @CoachID 
                AND (
                    (@AppointmentID IS NULL AND AppointmentID IS NULL) 
                    OR AppointmentID = @AppointmentID
                )
            `);

        if (existingFeedback.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đánh giá coach này rồi'
            });
        }

        // Insert feedback
        const request = pool.request()
            .input('CoachID', coachId)
            .input('MemberID', memberId)
            .input('Rating', rating)
            .input('IsAnonymous', isAnonymous);

        if (appointmentId) request.input('AppointmentID', appointmentId);
        if (comment) request.input('Comment', comment);
        if (categories) request.input('Categories', JSON.stringify(categories));

        const insertQuery = `
            INSERT INTO CoachFeedback (
                CoachID, MemberID, ${appointmentId ? 'AppointmentID,' : ''} 
                Rating, ${comment ? 'Comment,' : ''} ${categories ? 'Categories,' : ''} IsAnonymous
            )
            OUTPUT INSERTED.FeedbackID, INSERTED.CreatedAt
            VALUES (
                @CoachID, @MemberID, ${appointmentId ? '@AppointmentID,' : ''}
                @Rating, ${comment ? '@Comment,' : ''} ${categories ? '@Categories,' : ''} @IsAnonymous
            )
        `;

        const result = await request.query(insertQuery);
        const feedback = result.recordset[0];

        res.status(201).json({
            success: true,
            message: 'Đánh giá đã được gửi thành công',
            data: {
                feedbackId: feedback.FeedbackID,
                createdAt: feedback.CreatedAt
            }
        });

    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gửi đánh giá',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update feedback status (Coach có thể ẩn/hiện feedback)
router.patch('/feedback/:feedbackId', protect, authorize('coach'), async (req, res) => {
    try {
        const coachId = req.user.UserID;
        const { feedbackId } = req.params;
        const { status } = req.body;

        if (!['active', 'hidden'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        // Verify feedback belongs to this coach
        const feedbackCheck = await pool.request()
            .input('FeedbackID', feedbackId)
            .input('CoachID', coachId)
            .query(`
                SELECT FeedbackID 
                FROM CoachFeedback
                WHERE FeedbackID = @FeedbackID AND CoachID = @CoachID
            `);

        if (feedbackCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        // Update status
        await pool.request()
            .input('FeedbackID', feedbackId)
            .input('Status', status)
            .query(`
                UPDATE CoachFeedback 
                SET Status = @Status, UpdatedAt = GETDATE()
                WHERE FeedbackID = @FeedbackID
            `);

        res.json({
            success: true,
            message: `Đánh giá đã được ${status === 'hidden' ? 'ẩn' : 'hiển thị'}`
        });

    } catch (error) {
        console.error('Error updating feedback status:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái đánh giá',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get public feedback for a coach (for members to view before booking)
router.get('/:coachId/feedback', async (req, res) => {
    try {
        const { coachId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // Get public feedback
        const result = await pool.request()
            .input('CoachID', coachId)
            .input('Limit', parseInt(limit))
            .input('Offset', offset)
            .query(`
                SELECT 
                    cf.FeedbackID,
                    cf.Rating,
                    cf.Comment,
                    cf.Categories,
                    cf.CreatedAt,
                    CASE 
                        WHEN cf.IsAnonymous = 1 THEN N'Thành viên ẩn danh'
                        ELSE u.FirstName + ' ' + u.LastName
                    END as MemberName,
                    CASE 
                        WHEN cf.IsAnonymous = 1 THEN NULL
                        ELSE u.Avatar
                    END as MemberAvatar
                FROM CoachFeedback cf
                INNER JOIN Users u ON cf.MemberID = u.UserID
                WHERE cf.CoachID = @CoachID AND cf.Status = 'active'
                ORDER BY cf.CreatedAt DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
            `);

        // Get total count and stats
        const countResult = await pool.request()
            .input('CoachID', coachId)
            .query(`
                SELECT COUNT(*) as Total
                FROM CoachFeedback
                WHERE CoachID = @CoachID AND Status = 'active'
            `);

        const statsResult = await pool.request()
            .input('CoachID', coachId)
            .query(`
                SELECT * FROM CoachRatingStats WHERE CoachID = @CoachID
            `);

        const feedback = result.recordset.map(item => ({
            ...item,
            Categories: item.Categories ? JSON.parse(item.Categories) : null,
            CreatedAt: new Date(item.CreatedAt).toISOString()
        }));

        const total = countResult.recordset[0]?.Total || 0;
        const stats = statsResult.recordset[0] || {
            TotalReviews: 0,
            AverageRating: 0,
            FiveStarCount: 0,
            FourStarCount: 0,
            ThreeStarCount: 0,
            TwoStarCount: 0,
            OneStarCount: 0
        };

        res.json({
            success: true,
            data: {
                feedback,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                statistics: {
                    totalReviews: stats.TotalReviews,
                    averageRating: parseFloat(stats.AverageRating || 0).toFixed(1),
                    ratingDistribution: {
                        5: stats.FiveStarCount,
                        4: stats.FourStarCount,
                        3: stats.ThreeStarCount,
                        2: stats.TwoStarCount,
                        1: stats.OneStarCount
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error getting public coach feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải đánh giá',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Survey Management Routes for Coach

/**
 * @route   GET /api/coach/member-surveys
 * @desc    Get surveys of members assigned to this coach
 * @access  Private/Coach
 */
router.get('/member-surveys', protect, authorize('coach'), async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;
        const coachId = req.user.UserID;

        console.log(`🔍 Coach ${coachId} requesting member surveys with params:`, { page, limit, search });

        // Build search condition
        let searchCondition = '';
        if (search) {
            searchCondition = `
                AND (u.FirstName LIKE @search 
                OR u.LastName LIKE @search 
                OR u.Email LIKE @search)
            `;
        }

        // Get members assigned to this coach through QuitPlans with their surveys
        const result = await pool.request()
            .input('coachId', coachId)
            .input('search', `%${search}%`)
            .input('offset', offset)
            .input('limit', parseInt(limit))
            .query(`
                SELECT DISTINCT
                    u.UserID,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.Avatar,
                    qp.StartDate as AssignmentDate,
                    qp.Status as QuitPlanStatus,
                    um.Status as MembershipStatus,
                    um.StartDate as MembershipStart,
                    um.EndDate as MembershipEnd,
                    MAX(usa.SubmittedAt) as LastSurveyUpdate,
                    COUNT(usa.QuestionID) as TotalAnswers
                FROM Users u
                INNER JOIN QuitPlans qp ON u.UserID = qp.UserID AND qp.CoachID = @coachId AND qp.Status = 'active'
                LEFT JOIN UserMemberships um ON u.UserID = um.UserID AND um.Status = 'active'
                LEFT JOIN UserSurveyAnswers usa ON u.UserID = usa.UserID
                WHERE u.Role IN ('member', 'guest')
                ${searchCondition}
                GROUP BY u.UserID, u.FirstName, u.LastName, u.Email, u.Avatar,
                         qp.StartDate, qp.Status, um.Status, um.StartDate, um.EndDate
                ORDER BY LastSurveyUpdate DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

        // Get total count
        const countResult = await pool.request()
            .input('coachId', coachId)
            .input('search', `%${search}%`)
            .query(`
                SELECT COUNT(DISTINCT u.UserID) as total
                FROM Users u
                INNER JOIN QuitPlans qp ON u.UserID = qp.UserID AND qp.CoachID = @coachId AND qp.Status = 'active'
                WHERE u.Role IN ('member', 'guest')
                ${searchCondition}
            `);

        const total = countResult.recordset[0].total;

        console.log(`📊 Found ${result.recordset.length} assigned members for coach ${coachId}, total: ${total}`);

        res.json({
            members: result.recordset,
            pagination: {
                current: parseInt(page),
                pageSize: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting member surveys:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/coach/member-surveys/:memberId
 * @desc    Get specific member's survey answers
 * @access  Private/Coach
 */
router.get('/member-surveys/:memberId', protect, authorize('coach'), async (req, res) => {
    try {
        const { memberId } = req.params;
        const coachId = req.user.UserID;

        console.log(`🔍 Coach ${coachId} requesting survey for member ${memberId}`);

        // Validate memberId is a number
        if (!memberId || isNaN(parseInt(memberId))) {
            console.log(`❌ Invalid member ID: ${memberId}`);
            return res.status(400).json({
                message: 'Invalid member ID provided'
            });
        }

        const memberIdInt = parseInt(memberId);
        console.log(`📋 Validated member ID: ${memberIdInt}`);

        // Verify this member is assigned to this coach through QuitPlans
        console.log('🔍 Step 1: Checking assignment...');
        const assignmentCheck = await pool.request()
            .input('memberId', memberIdInt)
            .input('coachId', coachId)
            .query(`
                SELECT 
                    u.UserID, 
                    u.FirstName, 
                    u.LastName, 
                    u.Email,
                    u.Role,
                    qp.Status as QuitPlanStatus,
                    qp.StartDate as AssignmentDate,
                    qp.CoachID,
                    um.Status as MembershipStatus,
                    um.StartDate as MembershipStartDate,
                    um.EndDate as MembershipEndDate
                FROM Users u
                INNER JOIN QuitPlans qp ON u.UserID = qp.UserID
                LEFT JOIN UserMemberships um ON u.UserID = um.UserID AND um.Status = 'active'
                WHERE u.UserID = @memberId 
                AND u.Role IN ('member', 'guest')
                AND qp.CoachID = @coachId
                AND qp.Status = 'active'
            `);

        console.log(`📋 Assignment check result:`, assignmentCheck.recordset);

        if (assignmentCheck.recordset.length === 0) {
            console.log(`❌ Member ${memberIdInt} not assigned to coach ${coachId}`);
            return res.status(404).json({
                message: 'Member not found or not assigned to this coach'
            });
        }

        const member = assignmentCheck.recordset[0];
        console.log(`✅ Member ${member.FirstName} ${member.LastName} is assigned to coach`);

        // Get member's survey answers
        console.log('🔍 Step 2: Getting survey questions and answers...');
        const answersResult = await pool.request()
            .input('memberId', memberIdInt)
            .query(`
                SELECT 
                    sq.QuestionID,
                    sq.QuestionText,
                    'text' as QuestionType,
                    'General' as Category,
                    usa.Answer as AnswerText,
                    usa.SubmittedAt
                FROM SurveyQuestions sq
                LEFT JOIN UserSurveyAnswers usa ON sq.QuestionID = usa.QuestionID AND usa.UserID = @memberId
                ORDER BY sq.QuestionID
            `);

        console.log(`📊 Found ${answersResult.recordset.length} survey questions`);
        const answeredCount = answersResult.recordset.filter(a => a.AnswerText && a.AnswerText.trim()).length;
        console.log(`📝 Member has answered ${answeredCount} questions`);

        // Log first few questions for debugging
        if (answersResult.recordset.length > 0) {
            console.log('🔍 Sample questions:', answersResult.recordset.slice(0, 3).map(q => ({
                id: q.QuestionID,
                question: q.QuestionText?.substring(0, 50) + '...',
                hasAnswer: !!q.AnswerText
            })));
        }

        console.log('✅ Step 3: Sending successful response');
        res.json({
            member: member,
            answers: answersResult.recordset
        });

    } catch (error) {
        console.error('❌ Error getting member survey:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            memberId: req.params.memberId,
            coachId: req.user?.UserID
        });

        // Send more descriptive error based on the type
        if (error.message && error.message.includes('Invalid column name')) {
            res.status(500).json({
                message: 'Database schema error - please check table structure',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } else if (error.message && error.message.includes('connection')) {
            res.status(500).json({
                message: 'Database connection error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } else {
            res.status(500).json({
                message: 'Server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
});

/**
 * @route   GET /api/coach/survey-overview
 * @desc    Get survey overview statistics for coach's members
 * @access  Private/Coach
 */
router.get('/survey-overview', protect, authorize('coach'), async (req, res) => {
    try {
        const coachId = req.user.UserID;

        console.log(`📈 Coach ${coachId} requesting survey overview`);

        // Get overview statistics for coach's assigned members
        const statsResult = await pool.request()
            .input('coachId', coachId)
            .query(`
                SELECT 
                    COUNT(DISTINCT u.UserID) as TotalMembers,
                    COUNT(DISTINCT usa.UserID) as MembersWithSurveys,
                    COUNT(usa.AnswerID) as TotalAnswers,
                    ISNULL(AVG(CAST(member_answers.AnswerCount as FLOAT)), 0) as AvgAnswersPerMember
                FROM Users u
                INNER JOIN QuitPlans qp ON u.UserID = qp.UserID AND qp.CoachID = @coachId AND qp.Status = 'active'
                LEFT JOIN UserSurveyAnswers usa ON u.UserID = usa.UserID
                LEFT JOIN (
                    SELECT UserID, COUNT(QuestionID) as AnswerCount
                    FROM UserSurveyAnswers
                    WHERE UserID IN (
                        SELECT DISTINCT u.UserID 
                        FROM Users u 
                        INNER JOIN QuitPlans qp ON u.UserID = qp.UserID 
                        WHERE qp.CoachID = @coachId AND qp.Status = 'active'
                    )
                    GROUP BY UserID
                ) member_answers ON u.UserID = member_answers.UserID
                WHERE u.Role IN ('member', 'guest')
            `);

        // Get recent survey activities from coach's assigned members
        const recentActivitiesResult = await pool.request()
            .input('coachId', coachId)
            .query(`
                SELECT TOP 10
                    u.FirstName + ' ' + u.LastName as MemberName,
                    u.Email,
                    sq.QuestionText,
                    usa.Answer as AnswerText,
                    usa.SubmittedAt
                FROM UserSurveyAnswers usa
                INNER JOIN Users u ON usa.UserID = u.UserID
                INNER JOIN QuitPlans qp ON u.UserID = qp.UserID AND qp.CoachID = @coachId AND qp.Status = 'active'
                INNER JOIN SurveyQuestions sq ON usa.QuestionID = sq.QuestionID
                WHERE u.Role IN ('member', 'guest')
                AND usa.Answer IS NOT NULL
                AND usa.Answer != ''
                ORDER BY usa.SubmittedAt DESC
            `);

        const statistics = statsResult.recordset[0] || {
            TotalMembers: 0,
            MembersWithSurveys: 0,
            TotalAnswers: 0,
            AvgAnswersPerMember: 0
        };

        console.log(`📊 Survey overview for coach ${coachId}:`, statistics);
        console.log(`📝 Recent activities count:`, recentActivitiesResult.recordset.length);

        res.json({
            statistics: statistics,
            recentActivities: recentActivitiesResult.recordset
        });
    } catch (error) {
        console.error('Error getting survey overview:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== SMOKING ADDICTION SURVEY APIS ====================

// Get addiction overview statistics for coach dashboard
router.get('/addiction-overview', protect, authorize('coach'), async (req, res) => {
    try {
        const coachId = req.user.UserID;

        // Get total members with surveys
        const totalMembersResult = await pool.request()
            .query(`
                SELECT COUNT(DISTINCT sasr.UserID) as TotalMembers
                FROM SmokingAddictionSurveyResults sasr
                INNER JOIN Users u ON sasr.UserID = u.UserID
                WHERE u.Role IN ('guest', 'member') AND u.IsActive = 1
            `);

        // Get members who completed surveys
        const completedSurveysResult = await pool.request()
            .query(`
                SELECT COUNT(DISTINCT sasr.UserID) as CompletedSurveys
                FROM SmokingAddictionSurveyResults sasr
                INNER JOIN Users u ON sasr.UserID = u.UserID
                WHERE u.Role IN ('guest', 'member') 
                AND u.IsActive = 1
                AND sasr.FTNDScore IS NOT NULL
            `);

        // Calculate average success rate
        const averageSuccessRateResult = await pool.request()
            .query(`
                SELECT AVG(CAST(sasr.SuccessProbability AS FLOAT)) as AverageSuccessRate
                FROM SmokingAddictionSurveyResults sasr
                INNER JOIN Users u ON sasr.UserID = u.UserID
                WHERE u.Role IN ('guest', 'member') 
                AND u.IsActive = 1
                AND sasr.SuccessProbability IS NOT NULL
            `);

        // Calculate total money saved potential
        const totalMoneySavedResult = await pool.request()
            .query(`
                SELECT SUM(CAST(sasr.MonthlySavings AS FLOAT)) as TotalMoneySaved
                FROM SmokingAddictionSurveyResults sasr
                INNER JOIN Users u ON sasr.UserID = u.UserID
                WHERE u.Role IN ('guest', 'member') 
                AND u.IsActive = 1
                AND sasr.MonthlySavings IS NOT NULL
            `);

        const statistics = {
            totalMembers: totalMembersResult.recordset[0]?.TotalMembers || 0,
            completedSurveys: completedSurveysResult.recordset[0]?.CompletedSurveys || 0,
            averageSuccessRate: Math.round(averageSuccessRateResult.recordset[0]?.AverageSuccessRate || 0),
            totalMoneySaved: Math.round(totalMoneySavedResult.recordset[0]?.TotalMoneySaved || 0)
        };

        res.json({
            success: true,
            data: statistics,
            message: 'Đã lấy thống kê tổng quan thành công'
        });

    } catch (error) {
        console.error('Error getting addiction overview:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê tổng quan',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get members with addiction survey data
router.get('/member-addiction-surveys', protect, authorize('coach'), async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                u.UserID,
                u.Email,
                u.FirstName,
                u.LastName,
                u.Avatar,
                u.CreatedAt,
                sasr.FTNDScore,
                sasr.AddictionLevel,
                sasr.SuccessProbability,
                sasr.MonthlySavings,
                sasr.DailySavings,
                sasr.YearlySavings,
                sasr.PackYear,
                sasr.CigarettesPerDay,
                sasr.PackageName,
                sasr.PackagePrice,
                sasr.PriceRange,
                sasr.Age,
                sasr.YearsSmoked,
                sasr.Motivation,
                sasr.AddictionSeverity,
                sasr.SubmittedAt,
                0 as smokeFreeDays,
                0 as actualMoneySaved,
                sasr.SubmittedAt as lastUpdated
            FROM Users u
            INNER JOIN SmokingAddictionSurveyResults sasr ON u.UserID = sasr.UserID
            WHERE u.Role IN ('guest', 'member') 
            AND u.IsActive = 1
        `;

        const request = pool.request()
            .input('Limit', parseInt(limit))
            .input('Offset', offset);

        // Add search filter
        if (search) {
            query += ` AND (u.FirstName LIKE @Search OR u.LastName LIKE @Search OR u.Email LIKE @Search)`;
            request.input('Search', `%${search}%`);
        }

        query += ` ORDER BY sasr.SubmittedAt DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY`;

        const result = await request.query(query);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(DISTINCT u.UserID) as Total
            FROM Users u
            INNER JOIN SmokingAddictionSurveyResults sasr ON u.UserID = sasr.UserID
            WHERE u.Role IN ('guest', 'member') 
            AND u.IsActive = 1
        `;

        const countRequest = pool.request();
        if (search) {
            countQuery += ` AND (u.FirstName LIKE @Search OR u.LastName LIKE @Search OR u.Email LIKE @Search)`;
            countRequest.input('Search', `%${search}%`);
        }

        const countResult = await countRequest.query(countQuery);
        const total = countResult.recordset[0]?.Total || 0;

        // Format the response
        const members = result.recordset.map(member => ({
            UserID: member.UserID,
            Email: member.Email,
            FirstName: member.FirstName,
            LastName: member.LastName,
            FullName: `${member.FirstName} ${member.LastName}`,
            Avatar: member.Avatar,
            CreatedAt: member.CreatedAt,
            FTNDScore: member.FTNDScore,
            AddictionLevel: member.AddictionLevel,
            SuccessProbability: member.SuccessProbability,
            MonthlySavings: member.MonthlySavings,
            DailySavings: member.DailySavings,
            YearlySavings: member.YearlySavings,
            PackYear: member.PackYear,
            CigarettesPerDay: member.CigarettesPerDay,
            PackageName: member.PackageName,
            PackagePrice: member.PackagePrice,
            PriceRange: member.PriceRange,
            Age: member.Age,
            YearsSmoked: member.YearsSmoked,
            Motivation: member.Motivation,
            AddictionSeverity: member.AddictionSeverity,
            smokeFreeDays: member.smokeFreeDays,
            actualMoneySaved: member.actualMoneySaved,
            lastUpdated: member.lastUpdated
        }));

        res.json({
            success: true,
            data: {
                members,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            },
            message: `Đã lấy danh sách ${members.length} members thành công`
        });

    } catch (error) {
        console.error('Error getting member addiction surveys:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách khảo sát nghiện thuốc',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get detailed survey data for a specific member
router.get('/member-survey/:memberId', protect, authorize('coach'), async (req, res) => {
    try {
        const { memberId } = req.params;

        // Get survey results
        const surveyResult = await pool.request()
            .input('UserID', memberId)
            .query(`
                SELECT TOP 1
                    sasr.ResultID,
                    sasr.UserID,
                    sasr.FTNDScore,
                    sasr.CigarettesPerDay,
                    sasr.PackYear,
                    sasr.AddictionLevel,
                    sasr.AddictionSeverity,
                    sasr.SuccessProbability,
                    sasr.PackageName,
                    sasr.PackagePrice,
                    sasr.PriceRange,
                    sasr.DailySavings,
                    sasr.MonthlySavings,
                    sasr.YearlySavings,
                    sasr.Age,
                    sasr.YearsSmoked,
                    sasr.Motivation,
                    sasr.SubmittedAt
                FROM SmokingAddictionSurveyResults sasr
                WHERE sasr.UserID = @UserID
                ORDER BY sasr.SubmittedAt DESC
            `);

        if (surveyResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy dữ liệu khảo sát cho member này'
            });
        }

        const surveyData = surveyResult.recordset[0];

        res.json({
            success: true,
            data: surveyData,
            message: 'Đã lấy dữ liệu khảo sát thành công'
        });

    } catch (error) {
        console.error('Error getting member survey data:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu khảo sát',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get member progress data
router.get('/member-progress/:memberId', protect, authorize('coach'), async (req, res) => {
    try {
        const { memberId } = req.params;

        // Get basic progress data (for now, return mock data since ProgressTracking might not have data)
        const progressData = {
            smokeFreeDays: 0,
            actualMoneySaved: 0,
            lastUpdate: new Date(),
            progressHistory: []
        };

        res.json({
            success: true,
            data: progressData,
            message: 'Đã lấy dữ liệu tiến trình thành công'
        });

    } catch (error) {
        console.error('Error getting member progress:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu tiến trình',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 