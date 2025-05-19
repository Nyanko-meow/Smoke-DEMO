const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');

// Record daily progress
router.post('/', protect, async (req, res) => {
    try {
        const { date, cigarettesSmoked, cravingLevel, moneySpent, healthNotes } = req.body;

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('Date', date)
            .input('CigarettesSmoked', cigarettesSmoked)
            .input('CravingLevel', cravingLevel)
            .input('MoneySpent', moneySpent)
            .input('HealthNotes', healthNotes)
            .query(`
        MERGE INTO ProgressTracking AS target
        USING (SELECT @UserID AS UserID, @Date AS Date) AS source
        ON target.UserID = source.UserID AND target.Date = source.Date
        WHEN MATCHED THEN
          UPDATE SET
            CigarettesSmoked = @CigarettesSmoked,
            CravingLevel = @CravingLevel,
            MoneySpent = @MoneySpent,
            HealthNotes = @HealthNotes,
            CreatedAt = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (UserID, Date, CigarettesSmoked, CravingLevel, MoneySpent, HealthNotes)
          VALUES (@UserID, @Date, @CigarettesSmoked, @CravingLevel, @MoneySpent, @HealthNotes)
        OUTPUT INSERTED.*;
      `);

        res.status(201).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error recording progress'
        });
    }
});

// Get progress for a date range
router.get('/range', protect, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('StartDate', startDate)
            .input('EndDate', endDate)
            .query(`
        SELECT *
        FROM ProgressTracking
        WHERE UserID = @UserID
        AND Date BETWEEN @StartDate AND @EndDate
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
            message: 'Error getting progress range'
        });
    }
});

// Get progress summary
router.get('/summary', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT 
          COUNT(*) as TotalDaysTracked,
          SUM(CigarettesSmoked) as TotalCigarettesSmoked,
          SUM(MoneySpent) as TotalMoneySpent,
          AVG(CigarettesSmoked) as AverageCigarettesPerDay,
          MIN(Date) as FirstTrackedDate,
          MAX(Date) as LastTrackedDate,
          (SELECT COUNT(*) FROM ProgressTracking 
           WHERE UserID = @UserID AND CigarettesSmoked = 0) as SmokeFreeDays
        FROM ProgressTracking
        WHERE UserID = @UserID
      `);

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting progress summary'
        });
    }
});

// Get streak information
router.get('/streak', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        WITH Streaks AS (
          SELECT 
            Date,
            CigarettesSmoked,
            ROW_NUMBER() OVER (ORDER BY Date) - 
            ROW_NUMBER() OVER (PARTITION BY CASE WHEN CigarettesSmoked = 0 THEN 1 ELSE 0 END ORDER BY Date) as StreakGroup
          FROM ProgressTracking
          WHERE UserID = @UserID
        )
        SELECT 
          MAX(CASE WHEN CigarettesSmoked = 0 THEN COUNT(*) ELSE 0 END) as CurrentStreak,
          MAX(CASE WHEN CigarettesSmoked = 0 THEN COUNT(*) ELSE 0 END) as LongestStreak
        FROM Streaks
        GROUP BY StreakGroup
      `);

        res.json({
            success: true,
            data: {
                currentStreak: result.recordset[0]?.CurrentStreak || 0,
                longestStreak: result.recordset[0]?.LongestStreak || 0
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting streak information'
        });
    }
});

// Get health improvement metrics
router.get('/health', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT 
          COUNT(*) as TotalDaysTracked,
          SUM(CASE WHEN CigarettesSmoked = 0 THEN 1 ELSE 0 END) as SmokeFreeDays,
          AVG(CASE WHEN CigarettesSmoked = 0 THEN 1 ELSE 0 END) * 100 as SmokeFreePercentage
        FROM ProgressTracking
        WHERE UserID = @UserID
      `);

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting health metrics'
        });
    }
});

// Lời khuyên tự động dựa trên số điếu hút và mức độ thèm thuốc
router.get('/advice', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT TOP 1 CigarettesSmoked, CravingLevel, Date
        FROM ProgressTracking
        WHERE UserID = @UserID
        ORDER BY Date DESC
      `);
        if (!result.recordset[0]) {
            return res.json({
                success: true,
                advice: 'Hãy bắt đầu ghi nhật ký tiến trình để nhận lời khuyên phù hợp!'
            });
        }
        const { CigarettesSmoked, CravingLevel, Date: logDate } = result.recordset[0];
        let advice = '';
        if (CigarettesSmoked > 0 && CravingLevel >= 7) {
            advice = 'Bạn đang hút nhiều và mức độ thèm thuốc cao. Hãy thử các kỹ thuật thư giãn, uống nước hoặc vận động nhẹ để giảm cảm giác thèm.';
        } else if (CigarettesSmoked > 0) {
            advice = 'Bạn vẫn còn hút thuốc. Hãy cố gắng giảm dần số điếu mỗi ngày và tìm hoạt động thay thế.';
        } else if (CravingLevel >= 7) {
            advice = 'Bạn không hút thuốc nhưng vẫn còn thèm. Hãy kiên trì, cảm giác này sẽ giảm dần theo thời gian!';
        } else if (CigarettesSmoked === 0 && CravingLevel <= 3) {
            advice = 'Tuyệt vời! Bạn đang kiểm soát tốt cả hành vi và cảm xúc. Hãy tiếp tục phát huy!';
        } else {
            advice = 'Tiến trình của bạn đang đi đúng hướng. Hãy tiếp tục ghi nhận và duy trì động lực!';
        }
        res.json({
            success: true,
            advice,
            logDate
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting advice'
        });
    }
});

// Tính tiền tiết kiệm
router.get('/savings', protect, async (req, res) => {
    try {
        // Lấy thông tin thói quen cũ
        const status = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`SELECT TOP 1 CigarettesPerDay, CigarettePrice FROM SmokingStatus WHERE UserID = @UserID ORDER BY LastUpdated DESC`);
        if (!status.recordset[0]) {
            return res.json({ success: false, message: 'Chưa có thông tin thói quen hút thuốc.' });
        }
        const { CigarettesPerDay, CigarettePrice } = status.recordset[0];

        // Lấy tổng số điếu đã hút trong các ngày đã ghi nhận
        const progress = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`SELECT COUNT(*) as Days, SUM(CigarettesSmoked) as TotalSmoked FROM ProgressTracking WHERE UserID = @UserID`);
        const { Days, TotalSmoked } = progress.recordset[0];

        // Số điếu lẽ ra sẽ hút nếu không cai
        const expected = Days * CigarettesPerDay;
        const saved = expected - (TotalSmoked || 0);
        const moneySaved = saved * CigarettePrice;

        res.json({
            success: true,
            moneySaved,
            cigarettesNotSmoked: saved
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error calculating savings' });
    }
});

module.exports = router; 