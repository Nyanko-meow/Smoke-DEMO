const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');

// Submit survey response
router.post('/', protect, async (req, res) => {
    try {
        const {
            smokingDuration,
            cigarettesPerDay,
            smokingTime,
            quitReason,
            previousAttempts,
            supportNeeds,
            monthlyBudget,
            preferredPlatform,
            importantMetrics,
            socialSharing
        } = req.body;

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('SmokingDuration', smokingDuration)
            .input('CigarettesPerDay', cigarettesPerDay)
            .input('SmokingTime', smokingTime)
            .input('QuitReason', quitReason)
            .input('PreviousAttempts', previousAttempts)
            .input('SupportNeeds', supportNeeds)
            .input('MonthlyBudget', monthlyBudget)
            .input('PreferredPlatform', preferredPlatform)
            .input('ImportantMetrics', importantMetrics)
            .input('SocialSharing', socialSharing)
            .query(`
        INSERT INTO UserSurvey (
            UserID, SmokingDuration, CigarettesPerDay, SmokingTime,
            QuitReason, PreviousAttempts, SupportNeeds, MonthlyBudget,
            PreferredPlatform, ImportantMetrics, SocialSharing
        )
        OUTPUT INSERTED.*
        VALUES (
            @UserID, @SmokingDuration, @CigarettesPerDay, @SmokingTime,
            @QuitReason, @PreviousAttempts, @SupportNeeds, @MonthlyBudget,
            @PreferredPlatform, @ImportantMetrics, @SocialSharing
        )
      `);

        res.status(201).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error submitting survey'
        });
    }
});

// Get user's survey response
router.get('/my-survey', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query('SELECT * FROM UserSurvey WHERE UserID = @UserID');

        res.json({
            success: true,
            data: result.recordset[0] || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting survey response'
        });
    }
});

// Get survey statistics (admin only)
router.get('/statistics', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .query(`
        SELECT 
            AVG(CAST(CigarettesPerDay as FLOAT)) as AvgCigarettesPerDay,
            AVG(CAST(MonthlyBudget as FLOAT)) as AvgMonthlyBudget,
            COUNT(CASE WHEN PreferredPlatform = 'mobile' THEN 1 END) as MobileUsers,
            COUNT(CASE WHEN PreferredPlatform = 'web' THEN 1 END) as WebUsers,
            COUNT(CASE WHEN SocialSharing = 1 THEN 1 END) as SocialSharers,
            COUNT(*) as TotalResponses
        FROM UserSurvey
      `);

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting survey statistics'
        });
    }
});

module.exports = router; 