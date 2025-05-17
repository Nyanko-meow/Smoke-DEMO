const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');

// Get all achievements
router.get('/', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT 
          a.*,
          CASE WHEN ua.UserAchievementID IS NOT NULL THEN 1 ELSE 0 END as IsEarned,
          ua.EarnedDate
        FROM Achievements a
        LEFT JOIN UserAchievements ua ON a.AchievementID = ua.AchievementID 
          AND ua.UserID = @UserID
        ORDER BY a.AchievementID
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

// Get user's earned achievements
router.get('/earned', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT 
          a.*,
          ua.EarnedDate
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
            message: 'Error getting earned achievements'
        });
    }
});

// Create new achievement (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, description, type, criteria, badgeImage } = req.body;

        const result = await pool.request()
            .input('Name', name)
            .input('Description', description)
            .input('Type', type)
            .input('Criteria', criteria)
            .input('BadgeImage', badgeImage)
            .query(`
        INSERT INTO Achievements (Name, Description, Type, Criteria, BadgeImage)
        OUTPUT INSERTED.*
        VALUES (@Name, @Description, @Type, @Criteria, @BadgeImage)
      `);

        res.status(201).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error creating achievement'
        });
    }
});

// Update achievement (admin only)
router.put('/:achievementId', protect, authorize('admin'), async (req, res) => {
    try {
        const { achievementId } = req.params;
        const { name, description, type, criteria, badgeImage } = req.body;

        const result = await pool.request()
            .input('AchievementID', achievementId)
            .input('Name', name)
            .input('Description', description)
            .input('Type', type)
            .input('Criteria', criteria)
            .input('BadgeImage', badgeImage)
            .query(`
        UPDATE Achievements
        SET Name = @Name,
            Description = @Description,
            Type = @Type,
            Criteria = @Criteria,
            BadgeImage = @BadgeImage
        OUTPUT INSERTED.*
        WHERE AchievementID = @AchievementID
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Achievement not found'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error updating achievement'
        });
    }
});

// Award achievement to user (admin only)
router.post('/award', protect, authorize('admin'), async (req, res) => {
    try {
        const { userId, achievementId } = req.body;

        const result = await pool.request()
            .input('UserID', userId)
            .input('AchievementID', achievementId)
            .query(`
        MERGE INTO UserAchievements AS target
        USING (SELECT @UserID AS UserID, @AchievementID AS AchievementID) AS source
        ON target.UserID = source.UserID AND target.AchievementID = source.AchievementID
        WHEN NOT MATCHED THEN
          INSERT (UserID, AchievementID)
          VALUES (@UserID, @AchievementID)
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
            message: 'Error awarding achievement'
        });
    }
});

// Check and award achievements based on progress
router.post('/check', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        -- Check for smoke-free day achievements
        INSERT INTO UserAchievements (UserID, AchievementID)
        SELECT @UserID, a.AchievementID
        FROM Achievements a
        WHERE a.Type = 'smoke_free_days'
        AND NOT EXISTS (
          SELECT 1 FROM UserAchievements ua 
          WHERE ua.UserID = @UserID AND ua.AchievementID = a.AchievementID
        )
        AND EXISTS (
          SELECT 1 FROM ProgressTracking pt
          WHERE pt.UserID = @UserID
          AND pt.CigarettesSmoked = 0
          AND pt.Date >= DATEADD(day, -CAST(a.Criteria as int), GETDATE())
        );

        -- Check for money saved achievements
        INSERT INTO UserAchievements (UserID, AchievementID)
        SELECT @UserID, a.AchievementID
        FROM Achievements a
        WHERE a.Type = 'money_saved'
        AND NOT EXISTS (
          SELECT 1 FROM UserAchievements ua 
          WHERE ua.UserID = @UserID AND ua.AchievementID = a.AchievementID
        )
        AND EXISTS (
          SELECT 1 FROM ProgressTracking pt
          WHERE pt.UserID = @UserID
          AND pt.MoneySpent >= CAST(a.Criteria as decimal(10,2))
        );

        -- Return newly earned achievements
        SELECT 
          a.*,
          ua.EarnedDate
        FROM UserAchievements ua
        JOIN Achievements a ON ua.AchievementID = a.AchievementID
        WHERE ua.UserID = @UserID
        AND ua.EarnedDate >= DATEADD(minute, -5, GETDATE())
        ORDER BY ua.EarnedDate DESC;
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error checking achievements'
        });
    }
});

module.exports = router; 