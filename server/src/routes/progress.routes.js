const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');

// Record daily progress
router.post('/', protect, async (req, res) => {
    try {
        const { date, cigarettesSmoked, moneySpent, healthNotes } = req.body;

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('Date', date)
            .input('CigarettesSmoked', cigarettesSmoked)
            .input('MoneySpent', moneySpent)
            .input('HealthNotes', healthNotes)
            .query(`
        MERGE INTO ProgressTracking AS target
        USING (SELECT @UserID AS UserID, @Date AS Date) AS source
        ON target.UserID = source.UserID AND target.Date = source.Date
        WHEN MATCHED THEN
          UPDATE SET
            CigarettesSmoked = @CigarettesSmoked,
            MoneySpent = @MoneySpent,
            HealthNotes = @HealthNotes,
            CreatedAt = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (UserID, Date, CigarettesSmoked, MoneySpent, HealthNotes)
          VALUES (@UserID, @Date, @CigarettesSmoked, @MoneySpent, @HealthNotes)
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

module.exports = router; 