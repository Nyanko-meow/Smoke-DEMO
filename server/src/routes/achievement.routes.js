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

// PUBLIC endpoint: Get all achievements without authentication (for display purposes)
router.get('/public', async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                AchievementID,
                Name,
                Description,
                IconURL,
                Category,
                MilestoneDays,
                SavedMoney,
                RequiredPlan,
                Difficulty,
                Points
            FROM Achievements
            WHERE IsActive = 1
            ORDER BY Category, Difficulty
        `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error getting public achievements:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting achievements',
            error: error.message
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

// Manual fix achievements endpoint
router.post('/fix-unlock', protect, async (req, res) => {
    try {
        console.log('🔓 Manual achievement fix requested by user:', req.user.UserID);

        // Get user's progress data
        const progressResult = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT 
                    COALESCE(MAX(DaysSmokeFree), 0) as DaysSmokeFree,
                    COALESCE(SUM(MoneySaved), 0) as TotalMoneySaved,
                    COUNT(*) as ProgressEntries
                FROM ProgressTracking 
                WHERE UserID = @UserID
            `);

        const progressData = progressResult.recordset[0];
        console.log('User progress:', progressData);

        // If no progress data, create basic entry
        if (progressData.ProgressEntries === 0) {
            console.log('Creating basic progress entry for user...');

            await pool.request()
                .input('UserID', req.user.UserID)
                .input('Date', new Date().toISOString().split('T')[0])
                .input('DaysSmokeFree', 1)
                .input('MoneySaved', 50000)
                .input('CigarettesSmoked', 0)
                .input('CravingLevel', 5)
                .query(`
                    INSERT INTO ProgressTracking (UserID, Date, DaysSmokeFree, MoneySaved, CigarettesSmoked, CravingLevel, CreatedAt)
                    VALUES (@UserID, @Date, @DaysSmokeFree, @MoneySaved, @CigarettesSmoked, @CravingLevel, GETDATE())
                `);

            progressData.DaysSmokeFree = 1;
            progressData.TotalMoneySaved = 50000;
        }

        // Get achievements user doesn't have yet
        const availableAchievements = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT a.*
                FROM Achievements a
                WHERE a.AchievementID NOT IN (
                    SELECT AchievementID 
                    FROM UserAchievements 
                    WHERE UserID = @UserID
                )
                ORDER BY a.AchievementID
            `);

        const newAchievements = [];

        // Check each achievement
        for (const achievement of availableAchievements.recordset) {
            let shouldUnlock = false;

            // Check milestone days
            if (achievement.MilestoneDays !== null) {
                if (progressData.DaysSmokeFree >= achievement.MilestoneDays) {
                    shouldUnlock = true;
                    console.log(`User qualifies for "${achievement.Name}" (${achievement.MilestoneDays} days)`);
                }
            }

            // Check saved money
            if (achievement.SavedMoney !== null) {
                if (progressData.TotalMoneySaved >= achievement.SavedMoney) {
                    shouldUnlock = true;
                    console.log(`User qualifies for "${achievement.Name}" (${achievement.SavedMoney} VND)`);
                }
            }

            // Award achievement
            if (shouldUnlock) {
                try {
                    await pool.request()
                        .input('UserID', req.user.UserID)
                        .input('AchievementID', achievement.AchievementID)
                        .query(`
                            INSERT INTO UserAchievements (UserID, AchievementID, EarnedAt)
                            VALUES (@UserID, @AchievementID, GETDATE())
                        `);

                    newAchievements.push(achievement);
                    console.log(`🏆 UNLOCKED: ${achievement.Name}`);
                } catch (error) {
                    if (!error.message.includes('duplicate')) {
                        console.error(`Error unlocking "${achievement.Name}":`, error.message);
                    }
                }
            }
        }

        res.json({
            success: true,
            message: newAchievements.length > 0
                ? `Đã mở khóa ${newAchievements.length} huy hiệu mới!`
                : 'Không có huy hiệu mới để mở khóa.',
            newAchievements,
            progressData
        });

    } catch (error) {
        console.error('Error fixing achievements:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra huy hiệu'
        });
    }
});

module.exports = router; 