const express = require('express');
const router = express.Router();
const { sql, pool } = require('../config/database');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/user-survey
 * @desc    Get user's comprehensive survey data
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.request()
            .input('userID', sql.Int, req.user.id)
            .query(`
                SELECT * FROM UserSurvey 
                WHERE UserID = @userID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Survey data not found' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error getting user survey data:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   POST /api/user-survey
 * @desc    Submit or update user's comprehensive survey
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
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

    // Validate essential input
    if (!cigarettesPerDay || !smokingDuration) {
        return res.status(400).json({ message: 'Please provide at least smoking duration and cigarettes per day' });
    }

    try {
        // Check if the user already has survey data
        const existingSurvey = await pool.request()
            .input('userID', sql.Int, req.user.id)
            .query(`
                SELECT SurveyID FROM UserSurvey
                WHERE UserID = @userID
            `);

        if (existingSurvey.recordset.length > 0) {
            // Update existing record
            await pool.request()
                .input('userID', sql.Int, req.user.id)
                .input('smokingDuration', sql.NVarChar(50), smokingDuration)
                .input('cigarettesPerDay', sql.Int, cigarettesPerDay)
                .input('smokingTime', sql.NVarChar(sql.MAX), smokingTime || null)
                .input('quitReason', sql.NVarChar(sql.MAX), quitReason || null)
                .input('previousAttempts', sql.NVarChar(sql.MAX), previousAttempts || null)
                .input('supportNeeds', sql.NVarChar(sql.MAX), supportNeeds || null)
                .input('monthlyBudget', sql.Decimal(10, 2), monthlyBudget || null)
                .input('preferredPlatform', sql.NVarChar(50), preferredPlatform || null)
                .input('importantMetrics', sql.NVarChar(sql.MAX), importantMetrics || null)
                .input('socialSharing', sql.Bit, socialSharing !== undefined ? socialSharing : null)
                .query(`
                    UPDATE UserSurvey
                    SET SmokingDuration = @smokingDuration,
                        CigarettesPerDay = @cigarettesPerDay,
                        SmokingTime = @smokingTime,
                        QuitReason = @quitReason,
                        PreviousAttempts = @previousAttempts,
                        SupportNeeds = @supportNeeds,
                        MonthlyBudget = @monthlyBudget,
                        PreferredPlatform = @preferredPlatform,
                        ImportantMetrics = @importantMetrics,
                        SocialSharing = @socialSharing
                    WHERE UserID = @userID
                `);

            // Also update the related smoking status if it exists
            await updateSmokingStatus(req.user.id, cigarettesPerDay);

            return res.json({ message: 'Survey updated successfully' });
        } else {
            // Insert new record
            await pool.request()
                .input('userID', sql.Int, req.user.id)
                .input('smokingDuration', sql.NVarChar(50), smokingDuration)
                .input('cigarettesPerDay', sql.Int, cigarettesPerDay)
                .input('smokingTime', sql.NVarChar(sql.MAX), smokingTime || null)
                .input('quitReason', sql.NVarChar(sql.MAX), quitReason || null)
                .input('previousAttempts', sql.NVarChar(sql.MAX), previousAttempts || null)
                .input('supportNeeds', sql.NVarChar(sql.MAX), supportNeeds || null)
                .input('monthlyBudget', sql.Decimal(10, 2), monthlyBudget || null)
                .input('preferredPlatform', sql.NVarChar(50), preferredPlatform || null)
                .input('importantMetrics', sql.NVarChar(sql.MAX), importantMetrics || null)
                .input('socialSharing', sql.Bit, socialSharing !== undefined ? socialSharing : null)
                .query(`
                    INSERT INTO UserSurvey (
                        UserID, SmokingDuration, CigarettesPerDay, SmokingTime, 
                        QuitReason, PreviousAttempts, SupportNeeds, MonthlyBudget,
                        PreferredPlatform, ImportantMetrics, SocialSharing
                    )
                    VALUES (
                        @userID, @smokingDuration, @cigarettesPerDay, @smokingTime,
                        @quitReason, @previousAttempts, @supportNeeds, @monthlyBudget,
                        @preferredPlatform, @importantMetrics, @socialSharing
                    )
                `);

            // Also create/update smoking status
            await updateSmokingStatus(req.user.id, cigarettesPerDay);

            return res.status(201).json({ message: 'Survey submitted successfully' });
        }
    } catch (error) {
        console.error('Error saving user survey:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function to update smoking status when survey is submitted
async function updateSmokingStatus(userId, cigarettesPerDay) {
    try {
        // Check if smoking status exists
        const existingStatus = await pool.request()
            .input('userID', sql.Int, userId)
            .query(`
                SELECT StatusID FROM SmokingStatus
                WHERE UserID = @userID
            `);

        if (existingStatus.recordset.length > 0) {
            // Update existing record
            await pool.request()
                .input('userID', sql.Int, userId)
                .input('cigarettesPerDay', sql.Int, cigarettesPerDay)
                .query(`
                    UPDATE SmokingStatus
                    SET CigarettesPerDay = @cigarettesPerDay,
                        LastUpdated = GETDATE()
                    WHERE UserID = @userID
                `);
        } else {
            // Insert new basic record
            await pool.request()
                .input('userID', sql.Int, userId)
                .input('cigarettesPerDay', sql.Int, cigarettesPerDay)
                .query(`
                    INSERT INTO SmokingStatus (UserID, CigarettesPerDay)
                    VALUES (@userID, @cigarettesPerDay)
                `);
        }
    } catch (error) {
        console.error('Error updating smoking status from survey:', error);
        // Don't throw the error - this is a secondary operation
    }
}

module.exports = router; 