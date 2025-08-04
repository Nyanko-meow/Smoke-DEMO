const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkMembershipAccess, filterByCurrentMembership } = require('../middleware/membershipAccess.middleware');
const { pool } = require('../config/database');
const AchievementService = require('../services/achievementService');

// Middleware kiểm tra quyền truy cập dựa trên PaymentConfirmations
const checkProgressAccess = async (req, res, next) => {
    try {
        console.log('🔍 Checking progress access for user:', req.user.UserID);

        // Check if user has payment confirmation
        const accessCheck = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT DISTINCT p.UserID
                FROM Payments p
                INNER JOIN PaymentConfirmations pc ON p.PaymentID = pc.PaymentID
                WHERE p.UserID = @UserID 
                AND p.Status = 'confirmed'
                AND p.EndDate > GETDATE()
                
                UNION
                
                SELECT UserID 
                FROM Users 
                WHERE UserID = @UserID 
                AND Role IN ('coach', 'admin')
            `);

        if (accessCheck.recordset.length === 0) {
            console.log('❌ User does not have progress access');
            return res.status(403).json({
                success: false,
                message: 'Bạn cần có gói dịch vụ được xác nhận hoặc là Coach/Admin để truy cập tính năng này',
                requirePayment: true
            });
        }

        console.log('✅ User has progress access');
        next();
    } catch (error) {
        console.error('❌ Error checking progress access:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền truy cập'
        });
    }
};

// Record daily progress - updated to match requirements  
router.post('/', protect, checkMembershipAccess, async (req, res) => {
    try {
        const { date, cigarettesSmoked, cravingLevel, emotionNotes } = req.body;

        console.log('📝 Recording progress:', {
            userID: req.user.UserID,
            date,
            cigarettesSmoked,
            cravingLevel,
            emotionNotes
        });

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

            // Improved calculation: Use standard pricing if not set
            // Standard: 1 pack = 20 cigarettes = 30,000 VNĐ → 1 cigarette = 1,500 VNĐ
            const standardCigarettePrice = CigarettePrice || 1500;
            const baselineCigarettesPerDay = CigarettesPerDay || 10; // Default to half pack per day

            // Calculate money saved for this day
            const cigarettesNotSmoked = Math.max(0, baselineCigarettesPerDay - cigarettesSmoked);
            moneySaved = cigarettesNotSmoked * standardCigarettePrice;

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
        } else {
            // Default calculation if no smoking status is set
            // Assume standard baseline: 10 cigarettes per day (half pack) at 1500 VNĐ per cigarette
            const defaultCigarettesPerDay = 10;
            const defaultCigarettePrice = 1500;

            const cigarettesNotSmoked = Math.max(0, defaultCigarettesPerDay - cigarettesSmoked);
            moneySaved = cigarettesNotSmoked * defaultCigarettePrice;

            if (cigarettesSmoked === 0) {
                daysSmokeFree = 1;
            }
        }

        // Sử dụng currentMembership từ middleware checkMembershipAccess
        const currentMembershipID = req.currentMembership.MembershipID;

        // Luôn sử dụng MembershipID để link progress với membership cụ thể
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('MembershipID', currentMembershipID)
            .input('Date', date)
            .input('CigarettesSmoked', cigarettesSmoked)
            .input('CravingLevel', cravingLevel)
            .input('EmotionNotes', emotionNotes || '')
            .input('MoneySaved', moneySaved)
            .input('DaysSmokeFree', daysSmokeFree)
            .query(`
                MERGE INTO ProgressTracking AS target
                USING (SELECT @UserID AS UserID, @MembershipID AS MembershipID, @Date AS Date) AS source
                ON target.UserID = source.UserID AND target.MembershipID = source.MembershipID AND target.Date = source.Date
                WHEN MATCHED THEN
                    UPDATE SET
                        CigarettesSmoked = @CigarettesSmoked,
                        CravingLevel = @CravingLevel,
                        EmotionNotes = @EmotionNotes,
                        MoneySaved = @MoneySaved,
                        DaysSmokeFree = @DaysSmokeFree,
                        CreatedAt = GETDATE()
                WHEN NOT MATCHED THEN
                    INSERT (UserID, MembershipID, Date, CigarettesSmoked, CravingLevel, EmotionNotes, MoneySaved, DaysSmokeFree, CreatedAt)
                    VALUES (@UserID, @MembershipID, @Date, @CigarettesSmoked, @CravingLevel, @EmotionNotes, @MoneySaved, @DaysSmokeFree, GETDATE())
                OUTPUT INSERTED.*;
            `);

        console.log('✅ Progress recorded successfully');

        // Kiểm tra và trao huy hiệu tự động
        let newAchievements = [];
        let motivationalMessages = [];

        try {
            newAchievements = await AchievementService.checkAndAwardAchievements(req.user.UserID);

            if (newAchievements.length > 0) {
                motivationalMessages = AchievementService.generateMotivationalMessage(
                    newAchievements,
                    { DaysSmokeFree: daysSmokeFree, MoneySaved: moneySaved }
                );
            }
        } catch (achievementError) {
            console.error('⚠️ Error checking achievements:', achievementError);
            // Don't fail the request if achievement checking fails
        }

        res.status(201).json({
            success: true,
            data: result.recordset[0],
            calculations: {
                moneySaved,
                daysSmokeFree,
                cigarettesNotSmoked: smokingInfo.recordset.length > 0 ?
                    Math.max(0, smokingInfo.recordset[0].CigarettesPerDay - cigarettesSmoked) : 0
            },
            achievements: {
                newAchievements,
                motivationalMessages
            }
        });
    } catch (error) {
        console.error('❌ Error recording progress:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi ghi nhận tiến trình. Vui lòng thử lại.'
        });
    }
});

// Get today's progress
router.get('/today', protect, filterByCurrentMembership, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Nếu không có active membership, return empty
        if (req.noActiveMembership) {
            return res.json({
                success: true,
                data: null,
                hasEntry: false,
                message: 'No active membership'
            });
        }

        let query = `
            SELECT *
            FROM ProgressTracking
            WHERE UserID = @UserID AND Date = @Date
        `;

        const request = pool.request()
            .input('UserID', req.user.UserID)
            .input('Date', today);

        // Nếu có MembershipID từ middleware, filter theo đó
        if (req.currentMembershipID) {
            query += ` AND MembershipID = @MembershipID`;
            request.input('MembershipID', req.currentMembershipID);
        }

        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset[0] || null,
            hasEntry: result.recordset.length > 0
        });
    } catch (error) {
        console.error('❌ Error getting today progress:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy tiến trình hôm nay'
        });
    }
});

// Get progress for a date range - membership-aware or backward compatible
router.get('/range', protect, filterByCurrentMembership, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Nếu không có active membership, return empty
        if (req.noActiveMembership) {
            return res.json({
                success: true,
                data: [],
                message: 'No active membership found'
            });
        }

        let query = `
            SELECT *
            FROM ProgressTracking
            WHERE UserID = @UserID
              AND Date BETWEEN @StartDate AND @EndDate
        `;

        const request = pool.request()
            .input('UserID', req.user.UserID)
            .input('StartDate', startDate)
            .input('EndDate', endDate);

        // Nếu có MembershipID từ middleware, filter theo đó
        if (req.currentMembershipID) {
            query += ` AND MembershipID = @MembershipID`;
            request.input('MembershipID', req.currentMembershipID);
        }

        query += ` ORDER BY Date DESC`;

        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('❌ Error getting progress range:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy tiến trình theo khoảng thời gian'
        });
    }
});

// Get progress summary with enhanced calculations - membership-aware or backward compatible
router.get('/summary', protect, filterByCurrentMembership, async (req, res) => {
    try {
        // Set cache control headers to prevent 304 responses and ensure fresh data
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Last-Modified': new Date().toUTCString(),
            'ETag': Date.now().toString() // Unique ETag to prevent 304
        });

        // Nếu không có active membership, return zeros
        if (req.noActiveMembership) {
            return res.json({
                success: true,
                data: {
                    TotalDaysTracked: 0,
                    SmokeFreeDays: 0,
                    TotalMoneySaved: 0,
                    TotalCigarettesSmoked: 0,
                    AverageCigarettesPerDay: 0,
                    AverageCravingLevel: 0,
                    CigarettesNotSmoked: 0,
                    SmokeFreePercentage: 0
                },
                message: 'No active membership found'
            });
        }

        let query = `
            SELECT 
                COUNT(*) as TotalDaysTracked,
                SUM(CigarettesSmoked) as TotalCigarettesSmoked,
                SUM(MoneySaved) as TotalMoneySaved,
                AVG(CAST(CigarettesSmoked AS FLOAT)) as AverageCigarettesPerDay,
                AVG(CAST(CravingLevel AS FLOAT)) as AverageCravingLevel,
                MIN(Date) as FirstTrackedDate,
                MAX(Date) as LastTrackedDate,
                SUM(CASE WHEN CigarettesSmoked = 0 THEN 1 ELSE 0 END) as SmokeFreeDays
            FROM ProgressTracking
            WHERE UserID = @UserID
        `;

        const request = pool.request()
            .input('UserID', req.user.UserID);

        // Nếu có MembershipID từ middleware, filter theo đó
        if (req.currentMembershipID) {
            query += ` AND MembershipID = @MembershipID`;
            request.input('MembershipID', req.currentMembershipID);
        }

        const result = await request.query(query);

        // Get user's baseline smoking info
        const smokingInfo = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT TOP 1 CigarettesPerDay, CigarettePrice 
                FROM SmokingStatus 
                WHERE UserID = @UserID 
                ORDER BY LastUpdated DESC
            `);

        const summaryData = result.recordset[0];
        let totalSavings = summaryData.TotalMoneySaved || 0;
        let potentialCigarettes = 0;

        if (smokingInfo.recordset.length > 0 && summaryData.TotalDaysTracked > 0) {
            const { CigarettesPerDay, CigarettePrice } = smokingInfo.recordset[0];

            // Use standard pricing and baseline from survey data
            const standardCigarettePrice = CigarettePrice || 1500; // 1 cigarette = 1500 VNĐ
            const baselineCigarettesPerDay = CigarettesPerDay || 10; // Default half pack per day

            potentialCigarettes = summaryData.TotalDaysTracked * baselineCigarettesPerDay;

            // Recalculate total savings with improved formula
            const cigarettesNotSmoked = potentialCigarettes - (summaryData.TotalCigarettesSmoked || 0);
            totalSavings = Math.max(totalSavings, cigarettesNotSmoked * standardCigarettePrice);
        } else {
            // Use default values if no smoking info available
            const defaultCigarettesPerDay = 10; // Half pack per day
            const defaultCigarettePrice = 1500; // Standard price per cigarette

            potentialCigarettes = summaryData.TotalDaysTracked * defaultCigarettesPerDay;
            const cigarettesNotSmoked = potentialCigarettes - (summaryData.TotalCigarettesSmoked || 0);
            totalSavings = Math.max(totalSavings, cigarettesNotSmoked * defaultCigarettePrice);
        }

        // Always return 200 OK with fresh data for achievement checking
        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            cached: false, // Indicate this is fresh data
            data: {
                ...summaryData,
                TotalMoneySaved: totalSavings,
                CigarettesNotSmoked: Math.max(0, potentialCigarettes - (summaryData.TotalCigarettesSmoked || 0)),
                SmokeFreePercentage: summaryData.TotalDaysTracked > 0 ?
                    (summaryData.SmokeFreeDays / summaryData.TotalDaysTracked * 100) : 0
            }
        });
    } catch (error) {
        console.error('❌ Error getting progress summary:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy tổng kết tiến trình'
        });
    }
});

// PUBLIC endpoint: Get basic progress summary without authentication (for demo purposes)
router.get('/public-summary', async (req, res) => {
    try {
        // Use a default user or return realistic calculated data
        const defaultUserId = 2; // Use the test user we created

        const result = await pool.request()
            .input('UserID', defaultUserId)
            .query(`
                SELECT 
                    COUNT(*) as TotalDaysTracked,
                    SUM(CigarettesSmoked) as TotalCigarettesSmoked,
                    SUM(MoneySaved) as TotalMoneySaved,
                    AVG(CAST(CigarettesSmoked AS FLOAT)) as AverageCigarettesPerDay,
                    AVG(CAST(CravingLevel AS FLOAT)) as AverageCravingLevel,
                    MIN(Date) as FirstTrackedDate,
                    MAX(Date) as LastTrackedDate,
                    SUM(CASE WHEN CigarettesSmoked = 0 THEN 1 ELSE 0 END) as SmokeFreeDays
                FROM ProgressTracking
                WHERE UserID = @UserID
            `);

        const summaryData = result.recordset[0];

        // If no data exists, calculate realistic demo values
        if (!summaryData.TotalDaysTracked || summaryData.TotalDaysTracked === 0) {
            const demoDaysTracked = 7;
            const demoSmokeFreeDays = 7;
            const baselineCigarettesPerDay = 10; // Half pack per day
            const cigarettePrice = 1500; // Standard price
            const potentialCigarettes = demoDaysTracked * baselineCigarettesPerDay;
            const actualCigarettes = 0; // Demo user is smoke-free
            const calculatedSavings = (potentialCigarettes - actualCigarettes) * cigarettePrice;

            return res.json({
                success: true,
                data: {
                    TotalDaysTracked: demoDaysTracked,
                    SmokeFreeDays: demoSmokeFreeDays,
                    TotalMoneySaved: calculatedSavings, // 105,000 VNĐ (7 × 10 × 1500)
                    TotalCigarettesSmoked: actualCigarettes,
                    AverageCigarettesPerDay: 0,
                    AverageCravingLevel: 2,
                    CigarettesNotSmoked: potentialCigarettes,
                    SmokeFreePercentage: 100,
                    calculation: {
                        description: `${demoDaysTracked} ngày × ${baselineCigarettesPerDay} điếu/ngày × ${cigarettePrice.toLocaleString('vi-VN')} VNĐ/điếu`,
                        isDemo: true
                    }
                }
            });
        }

        // Calculate actual data if available
        const baselineCigarettesPerDay = 10; // Default baseline
        const cigarettePrice = 1500; // Standard price
        const potentialCigarettes = summaryData.TotalDaysTracked * baselineCigarettesPerDay;
        const actualCigarettes = summaryData.TotalCigarettesSmoked || 0;
        const calculatedSavings = (potentialCigarettes - actualCigarettes) * cigarettePrice;

        res.json({
            success: true,
            data: {
                TotalDaysTracked: summaryData.TotalDaysTracked,
                SmokeFreeDays: summaryData.SmokeFreeDays || 0,
                TotalMoneySaved: Math.max(summaryData.TotalMoneySaved || 0, calculatedSavings),
                TotalCigarettesSmoked: actualCigarettes,
                AverageCigarettesPerDay: summaryData.AverageCigarettesPerDay || 0,
                AverageCravingLevel: summaryData.AverageCravingLevel || 0,
                CigarettesNotSmoked: potentialCigarettes - actualCigarettes,
                SmokeFreePercentage: summaryData.TotalDaysTracked > 0 ?
                    (summaryData.SmokeFreeDays / summaryData.TotalDaysTracked * 100) : 0,
                calculation: {
                    description: `${summaryData.TotalDaysTracked} ngày × ${baselineCigarettesPerDay} điếu/ngày × ${cigarettePrice.toLocaleString('vi-VN')} VNĐ/điếu`,
                    isDemo: false
                }
            }
        });
    } catch (error) {
        console.error('❌ Error getting public progress summary:', error);
        // Return calculated demo data if database fails
        const demoDaysTracked = 7;
        const baselineCigarettesPerDay = 10;
        const cigarettePrice = 1500;
        const calculatedSavings = demoDaysTracked * baselineCigarettesPerDay * cigarettePrice;

        res.json({
            success: true,
            data: {
                TotalDaysTracked: demoDaysTracked,
                SmokeFreeDays: demoDaysTracked,
                TotalMoneySaved: calculatedSavings,
                TotalCigarettesSmoked: 0,
                AverageCigarettesPerDay: 0,
                AverageCravingLevel: 2,
                CigarettesNotSmoked: demoDaysTracked * baselineCigarettesPerDay,
                SmokeFreePercentage: 100,
                calculation: {
                    description: `${demoDaysTracked} ngày × ${baselineCigarettesPerDay} điếu/ngày × ${cigarettePrice.toLocaleString('vi-VN')} VNĐ/điếu`,
                    isDemo: true,
                    error: "Database connection failed"
                }
            }
        });
    }
});

// Get streak information
router.get('/streak', protect, filterByCurrentMembership, async (req, res) => {
    try {
        // Get current streak (consecutive smoke-free days from most recent)
        const currentStreakResult = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                WITH RecentDays AS (
                    SELECT Date, CigarettesSmoked,
                           ROW_NUMBER() OVER (ORDER BY Date DESC) as RowNum
                    FROM ProgressTracking
                    WHERE UserID = @UserID
                ),
                StreakCalc AS (
                    SELECT Date, CigarettesSmoked, RowNum,
                           CASE 
                               WHEN CigarettesSmoked = 0 THEN 1
                               ELSE 0
                           END as IsSmokeFreee
                    FROM RecentDays
                )
                SELECT COUNT(*) as CurrentStreak
                FROM StreakCalc
                WHERE RowNum <= (
                    SELECT ISNULL(MIN(RowNum), 999) 
                    FROM StreakCalc 
                    WHERE CigarettesSmoked > 0
                )
                AND CigarettesSmoked = 0
            `);

        // Get longest streak
        const longestStreakResult = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                WITH DateGroups AS (
                    SELECT Date, CigarettesSmoked,
                           ROW_NUMBER() OVER (ORDER BY Date) - 
                           ROW_NUMBER() OVER (PARTITION BY CASE WHEN CigarettesSmoked = 0 THEN 1 ELSE 0 END ORDER BY Date) as StreakGroup
                    FROM ProgressTracking
                    WHERE UserID = @UserID
                ),
                StreakLengths AS (
                    SELECT StreakGroup, COUNT(*) as StreakLength
                    FROM DateGroups
                    WHERE CigarettesSmoked = 0
                    GROUP BY StreakGroup
                )
                SELECT ISNULL(MAX(StreakLength), 0) as LongestStreak
                FROM StreakLengths
            `);

        res.json({
            success: true,
            data: {
                currentStreak: currentStreakResult.recordset[0]?.CurrentStreak || 0,
                longestStreak: longestStreakResult.recordset[0]?.LongestStreak || 0
            }
        });
    } catch (error) {
        console.error('❌ Error getting streak information:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thông tin chuỗi ngày'
        });
    }
});

// Get health improvement metrics
router.get('/health', protect, filterByCurrentMembership, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT 
                    COUNT(*) as TotalDaysTracked,
                    SUM(CASE WHEN CigarettesSmoked = 0 THEN 1 ELSE 0 END) as SmokeFreeDays,
                    CASE 
                        WHEN COUNT(*) > 0 THEN 
                            CAST(SUM(CASE WHEN CigarettesSmoked = 0 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100
                        ELSE 0 
                    END as SmokeFreePercentage,
                    AVG(CAST(CravingLevel AS FLOAT)) as AverageCravingLevel,
                    MIN(Date) as StartDate,
                    MAX(Date) as LastLoggedDate
                FROM ProgressTracking
                WHERE UserID = @UserID
            `);

        const healthData = result.recordset[0];

        // Calculate days since start
        let daysSinceStart = 0;
        if (healthData.StartDate) {
            const start = new Date(healthData.StartDate);
            const today = new Date();
            daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
        }

        res.json({
            success: true,
            data: {
                ...healthData,
                DaysSinceStart: daysSinceStart,
                HealthImprovementScore: Math.min(100, (healthData.SmokeFreePercentage || 0) + (daysSinceStart * 2))
            }
        });
    } catch (error) {
        console.error('❌ Error getting health metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy chỉ số sức khỏe'
        });
    }
});

// Get personalized advice based on recent progress
router.get('/advice', protect, filterByCurrentMembership, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT TOP 1 CigarettesSmoked, CravingLevel, Date, EmotionNotes
                FROM ProgressTracking
                WHERE UserID = @UserID
                ORDER BY Date DESC
            `);

        if (!result.recordset[0]) {
            return res.json({
                success: true,
                advice: 'Hãy bắt đầu ghi nhật ký tiến trình hàng ngày để nhận lời khuyên cá nhân hóa!',
                type: 'welcome'
            });
        }

        const { CigarettesSmoked, CravingLevel, Date: logDate, EmotionNotes } = result.recordset[0];
        let advice = '';
        let type = 'general';

        if (CigarettesSmoked === 0 && CravingLevel <= 3) {
            advice = 'Xuất sắc! Bạn đang kiểm soát tốt cả hành vi và cảm xúc. Hãy tiếp tục duy trì và chia sẻ kinh nghiệm với cộng đồng!';
            type = 'excellent';
        } else if (CigarettesSmoked === 0 && CravingLevel >= 7) {
            advice = 'Bạn đã không hút thuốc - điều này tuyệt vời! Mức độ thèm cao là bình thường. Hãy thử hít thở sâu, uống nước hoặc gọi điện cho bạn bè.';
            type = 'craving';
        } else if (CigarettesSmoked > 0 && CigarettesSmoked <= 2) {
            advice = 'Bạn đã giảm đáng kể! Đây là tiến bộ tốt. Hãy xác định thời điểm bạn hút và tìm cách thay thế những thói quen đó.';
            type = 'progress';
        } else if (CigarettesSmoked > 2) {
            advice = 'Đừng nản lòng! Cai thuốc là một hành trình. Hãy thử đặt mục tiêu nhỏ hơn cho ngày mai và tìm kiếm sự hỗ trợ từ coach.';
            type = 'support';
        } else {
            advice = 'Tiến trình của bạn đang đi đúng hướng. Hãy tiếp tục ghi nhận hàng ngày và duy trì động lực!';
            type = 'encouragement';
        }

        res.json({
            success: true,
            advice,
            type,
            logDate,
            basedOn: {
                cigarettesSmoked: CigarettesSmoked,
                cravingLevel: CravingLevel,
                hasEmotionNotes: !!EmotionNotes
            }
        });
    } catch (error) {
        console.error('❌ Error getting advice:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy lời khuyên'
        });
    }
});

// Get savings calculation with detailed breakdown
router.get('/savings', protect, filterByCurrentMembership, async (req, res) => {
    try {
        // Get user's smoking baseline from smoking status
        const smokingInfo = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT TOP 1 CigarettesPerDay, CigarettePrice 
                FROM SmokingStatus 
                WHERE UserID = @UserID 
                ORDER BY LastUpdated DESC
            `);

        // Try to get baseline from survey if smoking status is not available
        let baselineCigarettesPerDay = 10; // Default half pack
        let cigarettePrice = 1500; // Default 1500 VNĐ per cigarette

        if (smokingInfo.recordset.length > 0) {
            const { CigarettesPerDay, CigarettePrice } = smokingInfo.recordset[0];
            baselineCigarettesPerDay = CigarettesPerDay || 10;
            cigarettePrice = CigarettePrice || 1500;
        } else {
            // Try to get from survey data (question 2 about cigarettes per day)
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
            }
        }

        // Get progress summary
        const progressInfo = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT 
                    COUNT(*) as DaysTracked, 
                    SUM(CigarettesSmoked) as TotalSmoked,
                    SUM(MoneySaved) as TotalMoneySaved
                FROM ProgressTracking 
                WHERE UserID = @UserID
            `);

        const { DaysTracked, TotalSmoked } = progressInfo.recordset[0];

        // Calculate potential vs actual with improved formula
        const potentialCigarettes = DaysTracked * baselineCigarettesPerDay;
        const actualCigarettes = TotalSmoked || 0;
        const cigarettesNotSmoked = Math.max(0, potentialCigarettes - actualCigarettes);
        const moneySaved = cigarettesNotSmoked * cigarettePrice;

        // Calculate daily average savings
        const dailyPotentialCost = baselineCigarettesPerDay * cigarettePrice;
        const dailyActualCost = DaysTracked > 0 ? (actualCigarettes / DaysTracked) * cigarettePrice : 0;
        const dailyAvgSavings = dailyPotentialCost - dailyActualCost;

        res.json({
            success: true,
            data: {
                totalMoneySaved: moneySaved,
                cigarettesNotSmoked: cigarettesNotSmoked,
                daysTracked: DaysTracked,
                dailyAverageSavings: dailyAvgSavings,
                baseline: {
                    cigarettesPerDay: baselineCigarettesPerDay,
                    cigarettePrice: cigarettePrice,
                    dailyCost: dailyPotentialCost
                },
                actual: {
                    totalCigarettes: actualCigarettes,
                    averagePerDay: DaysTracked > 0 ? actualCigarettes / DaysTracked : 0,
                    dailyCost: dailyActualCost
                },
                calculation: {
                    description: `Tính toán dựa trên ${baselineCigarettesPerDay} điếu/ngày × ${cigarettePrice.toLocaleString('vi-VN')} VNĐ/điếu`,
                    standardPack: "1 gói = 20 điếu = 30,000 VNĐ",
                    perCigarette: "1 điếu = 1,500 VNĐ (chuẩn)"
                }
            }
        });
    } catch (error) {
        console.error('❌ Error calculating savings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tính toán tiền tiết kiệm'
        });
    }
});

// Get success rate analysis for user (SIMPLIFIED FOR TESTING)
router.get('/success-rate', protect, async (req, res) => {
    try {
        console.log('📊 Success rate endpoint called');
        console.log('📊 User from auth:', req.user);
        
        const userId = req.user.UserID || req.user.id;
        console.log('📊 Getting success rate for user:', userId);
        
        if (!userId) {
            console.error('❌ No UserID found in request');
            return res.status(400).json({
                success: false,
                message: 'User ID not found'
            });
        }

        // Return simple mock data for now to test the endpoint
        console.log('📊 Returning simple mock data');
        return res.json({
            success: true,
            data: {
                successRate: 75,
                daysTracked: 10,
                smokeFreedays: 7,
                factors: {
                    smokeFree: {
                        label: "Ngày không hút thuốc",
                        value: "7/10 ngày",
                        percentage: 70,
                        status: 'good'
                    },
                    emotion: {
                        label: "Tâm trạng trung bình",
                        value: "7.5/10",
                        percentage: 75,
                        status: 'excellent'
                    },
                    craving: {
                        label: "Mức độ thèm thuốc",
                        value: "3.2/10",
                        percentage: 68,
                        status: 'excellent'
                    },
                    sleep: {
                        label: "Chất lượng giấc ngủ",
                        value: "8.0/10",
                        percentage: 80,
                        status: 'excellent'
                    }
                },
                insights: [
                    "Xuất sắc! Bạn đã duy trì được nhiều ngày không hút thuốc.",
                    "Tâm trạng của bạn rất tích cực!",
                    "Tuyệt vời! Mức độ thèm thuốc của bạn đang ở mức thấp."
                ],
                recommendations: [
                    "Hãy cố gắng tăng số ngày không hút thuốc lên 80% để cải thiện tỷ lệ thành công.",
                    "Tiếp tục duy trì lối sống tích cực và healthy habits."
                ],
                summary: {
                    totalExerciseMinutes: 150,
                    averageStressLevel: "4.2"
                }
            }
        });

    } catch (error) {
        console.error('❌ Error in success rate endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 