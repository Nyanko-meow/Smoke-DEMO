const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');
const AchievementService = require('../services/achievementService');

// Get all achievements with user's earned status
router.get('/', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT 
                    a.*,
                    CASE WHEN ua.UserAchievementID IS NOT NULL THEN 1 ELSE 0 END as IsEarned,
                    ua.EarnedAt
                FROM Achievements a
                LEFT JOIN UserAchievements ua ON a.AchievementID = ua.AchievementID 
                    AND ua.UserID = @UserID
                WHERE a.IsActive = 1
                ORDER BY a.Category, a.Difficulty
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
        const achievements = await AchievementService.getUserAchievements(req.user.UserID);

        res.json({
            success: true,
            data: achievements
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting earned achievements'
        });
    }
});

// Get user's top badge for display
router.get('/top-badge', protect, async (req, res) => {
    try {
        const topBadge = await AchievementService.getUserTopBadge(req.user.UserID);

        res.json({
            success: true,
            data: topBadge
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting top badge'
        });
    }
});

// Check and award achievements for current user
router.post('/check', protect, async (req, res) => {
    try {
        const result = await AchievementService.checkAndAwardAchievements(req.user.UserID);

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error checking achievements'
        });
    }
});

// Trigger achievement check on progress update
router.post('/progress-update', protect, async (req, res) => {
    try {
        const result = await AchievementService.onProgressUpdate(req.user.UserID);

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error processing progress update'
        });
    }
});

// Get achievement statistics
router.get('/stats', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT 
                    COUNT(*) as TotalAchievements,
                    (SELECT COUNT(*) FROM UserAchievements WHERE UserID = @UserID) as EarnedCount,
                    (SELECT SUM(Points) FROM Achievements a 
                     JOIN UserAchievements ua ON a.AchievementID = ua.AchievementID 
                     WHERE ua.UserID = @UserID) as TotalPoints,
                    (SELECT COUNT(DISTINCT Category) FROM Achievements a 
                     JOIN UserAchievements ua ON a.AchievementID = ua.AchievementID 
                     WHERE ua.UserID = @UserID) as CategoriesCompleted
                FROM Achievements 
                WHERE IsActive = 1
            `);

        const stats = result.recordset[0];
        const completionRate = stats.TotalAchievements > 0
            ? Math.round((stats.EarnedCount / stats.TotalAchievements) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                ...stats,
                CompletionRate: completionRate
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting achievement statistics'
        });
    }
});

// Get achievements by category
router.get('/categories/:category', protect, async (req, res) => {
    try {
        const { category } = req.params;

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('Category', category)
            .query(`
                SELECT 
                    a.*,
                    CASE WHEN ua.UserAchievementID IS NOT NULL THEN 1 ELSE 0 END as IsEarned,
                    ua.EarnedAt
                FROM Achievements a
                LEFT JOIN UserAchievements ua ON a.AchievementID = ua.AchievementID 
                    AND ua.UserID = @UserID
                WHERE a.Category = @Category AND a.IsActive = 1
                ORDER BY a.Difficulty
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting achievements by category'
        });
    }
});

// === ADMIN ONLY ROUTES ===

// Create new achievement (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const {
            name, description, iconUrl, category,
            milestoneDays, savedMoney, requiredPlan,
            difficulty, points
        } = req.body;

        const result = await pool.request()
            .input('Name', name)
            .input('Description', description)
            .input('IconURL', iconUrl)
            .input('Category', category)
            .input('MilestoneDays', milestoneDays)
            .input('SavedMoney', savedMoney)
            .input('RequiredPlan', requiredPlan)
            .input('Difficulty', difficulty)
            .input('Points', points)
            .query(`
                INSERT INTO Achievements (
                    Name, Description, IconURL, Category, MilestoneDays, 
                    SavedMoney, RequiredPlan, Difficulty, Points, IsActive, CreatedAt
                )
                OUTPUT INSERTED.*
                VALUES (
                    @Name, @Description, @IconURL, @Category, @MilestoneDays, 
                    @SavedMoney, @RequiredPlan, @Difficulty, @Points, 1, GETDATE()
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
            message: 'Error creating achievement'
        });
    }
});

// Award achievement to user (admin only)
router.post('/award', protect, authorize('admin'), async (req, res) => {
    try {
        const { userId, achievementId } = req.body;

        await AchievementService.awardAchievement(userId, achievementId);

        res.json({
            success: true,
            message: 'Achievement awarded successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error awarding achievement'
        });
    }
});

// Check achievements for any user (admin only)
router.post('/check/:userId', protect, authorize('admin'), async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await AchievementService.checkAndAwardAchievements(parseInt(userId));

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error checking user achievements'
        });
    }
});

module.exports = router; 