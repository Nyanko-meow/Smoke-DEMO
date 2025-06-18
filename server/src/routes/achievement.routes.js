const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');
const AchievementService = require('../services/achievementService');
const sql = require('mssql');

// Get all achievements with user's earned status
router.get('/', protect, async (req, res) => {
    try {
        // Get user's progress data to check eligibility
        const progressData = await AchievementService.getUserProgressData(req.user.UserID);
        const userPlan = await AchievementService.getUserMembershipPlan(req.user.UserID);

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

        // Add eligibility check for each achievement
        const achievementsWithEligibility = result.recordset.map(achievement => {
            let isEligible = false;

            // Check milestone days
            if (achievement.MilestoneDays !== null) {
                isEligible = progressData.SmokeFreeDays >= achievement.MilestoneDays;
            }

            // Check saved money
            if (achievement.SavedMoney !== null) {
                isEligible = progressData.TotalMoneySaved >= achievement.SavedMoney;
            }

            // If no specific requirements, consider eligible
            if (achievement.MilestoneDays === null && achievement.SavedMoney === null) {
                isEligible = true;
            }

            return {
                ...achievement,
                IsEligible: isEligible ? 1 : 0,
                // Progress towards this achievement
                Progress: achievement.MilestoneDays
                    ? Math.min(progressData.SmokeFreeDays / achievement.MilestoneDays * 100, 100)
                    : achievement.SavedMoney
                        ? Math.min(progressData.TotalMoneySaved / achievement.SavedMoney * 100, 100)
                        : 100
            };
        });

        res.json({
            success: true,
            data: achievementsWithEligibility
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
        // Set cache control headers to prevent 304 responses
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Last-Modified': new Date().toUTCString()
        });

        const achievements = await AchievementService.getUserAchievements(req.user.UserID);

        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
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
        // Set cache control headers to prevent 304 responses
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Last-Modified': new Date().toUTCString()
        });

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

        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
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

// ==================== ADMIN ENDPOINTS ====================

// Get all achievements (public - for admin interface)
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
                Points,
                IsActive,
                CreatedAt
            FROM Achievements
            ORDER BY Category, AchievementID
        `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error getting public achievements:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách thành tích'
        });
    }
});

// Create new achievement (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, description, category, points, iconURL, isActive, milestoneDays, savedMoney } = req.body;

        // Validate required fields
        if (!name || !description || !category || points === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin: tên, mô tả, danh mục và điểm thưởng'
            });
        }

        // Check if achievement name already exists
        const existingResult = await pool.request()
            .input('Name', name)
            .query('SELECT AchievementID FROM Achievements WHERE Name = @Name');

        if (existingResult.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Tên thành tích đã tồn tại'
            });
        }

        // Create new achievement
        const result = await pool.request()
            .input('Name', name)
            .input('Description', description)
            .input('Category', category)
            .input('Points', points)
            .input('IconURL', iconURL || '🏆')
            .input('IsActive', isActive !== undefined ? isActive : true)
            .input('MilestoneDays', milestoneDays)
            .input('SavedMoney', savedMoney)
            .query(`
                INSERT INTO Achievements (Name, Description, Category, Points, IconURL, IsActive, MilestoneDays, SavedMoney)
                OUTPUT INSERTED.*
                VALUES (@Name, @Description, @Category, @Points, @IconURL, @IsActive, @MilestoneDays, @SavedMoney)
            `);

        res.status(201).json({
            success: true,
            data: result.recordset[0],
            message: 'Tạo thành tích thành công'
        });

    } catch (error) {
        console.error('Error creating achievement:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo thành tích: ' + error.message
        });
    }
});

// Update achievement (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, points, iconURL, isActive, milestoneDays, savedMoney } = req.body;

        // Validate achievement ID
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID thành tích không hợp lệ'
            });
        }

        // Validate required fields
        if (!name || !description || !category || points === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin: tên, mô tả, danh mục và điểm thưởng'
            });
        }

        // Check if achievement exists
        const existingResult = await pool.request()
            .input('AchievementID', id)
            .query('SELECT AchievementID FROM Achievements WHERE AchievementID = @AchievementID');

        if (existingResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành tích'
            });
        }

        // Check if new name conflicts with other achievements
        const nameConflictResult = await pool.request()
            .input('Name', name)
            .input('AchievementID', id)
            .query('SELECT AchievementID FROM Achievements WHERE Name = @Name AND AchievementID != @AchievementID');

        if (nameConflictResult.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Tên thành tích đã tồn tại'
            });
        }

        // Update achievement
        const result = await pool.request()
            .input('AchievementID', id)
            .input('Name', name)
            .input('Description', description)
            .input('Category', category)
            .input('Points', points)
            .input('IconURL', iconURL || '🏆')
            .input('IsActive', isActive !== undefined ? isActive : true)
            .input('MilestoneDays', milestoneDays)
            .input('SavedMoney', savedMoney)
            .query(`
                UPDATE Achievements 
                SET Name = @Name,
                    Description = @Description,
                    Category = @Category,
                    Points = @Points,
                    IconURL = @IconURL,
                    IsActive = @IsActive,
                    MilestoneDays = @MilestoneDays,
                    SavedMoney = @SavedMoney
                OUTPUT INSERTED.*
                WHERE AchievementID = @AchievementID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không thể cập nhật thành tích'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
            message: 'Cập nhật thành tích thành công'
        });

    } catch (error) {
        console.error('Error updating achievement:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thành tích: ' + error.message
        });
    }
});

// Delete achievement (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Validate achievement ID
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID thành tích không hợp lệ'
            });
        }

        // Check if achievement exists
        const existingResult = await pool.request()
            .input('AchievementID', id)
            .query('SELECT AchievementID, Name FROM Achievements WHERE AchievementID = @AchievementID');

        if (existingResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành tích'
            });
        }

        const achievement = existingResult.recordset[0];

        // Check if achievement is being used by users
        const usageResult = await pool.request()
            .input('AchievementID', id)
            .query('SELECT COUNT(*) as UsageCount FROM UserAchievements WHERE AchievementID = @AchievementID');

        const usageCount = usageResult.recordset[0].UsageCount;

        if (usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa thành tích "${achievement.Name}" vì có ${usageCount} người dùng đã đạt được thành tích này. Hãy vô hiệu hóa thay vì xóa.`
            });
        }

        // Delete achievement
        await pool.request()
            .input('AchievementID', id)
            .query('DELETE FROM Achievements WHERE AchievementID = @AchievementID');

        res.json({
            success: true,
            message: `Xóa thành tích "${achievement.Name}" thành công`
        });

    } catch (error) {
        console.error('Error deleting achievement:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa thành tích: ' + error.message
        });
    }
});

// Clear user's achievements (for testing)
router.post('/clear-my-achievements', protect, async (req, res) => {
    try {
        console.log('🗑️ Clearing achievements for user:', req.user.UserID);

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query('DELETE FROM UserAchievements WHERE UserID = @UserID');

        res.json({
            success: true,
            message: `Đã xóa ${result.rowsAffected[0]} huy hiệu. Bây giờ chỉ những huy hiệu đủ điều kiện mới có thể mở khóa.`,
            clearedCount: result.rowsAffected[0]
        });
    } catch (error) {
        console.error('❌ Error clearing achievements:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa achievements: ' + error.message
        });
    }
});

// Debug endpoint to update achievements to use emojis
router.post('/update-emojis', async (req, res) => {
    try {
        const pool = await sql.connect();

        // Update achievements to use emojis instead of image paths
        const updates = [
            { id: 1, emoji: '🏆' }, // Ngày đầu tiên
            { id: 2, emoji: '⭐' }, // Tuần lễ khởi đầu
            { id: 3, emoji: '👑' }, // Tháng đầu tiên
            { id: 4, emoji: '💎' }, // Quý đầu tiên
            { id: 5, emoji: '💰' }, // Tiết kiệm 100K
            { id: 6, emoji: '💵' }, // Tiết kiệm 500K
            { id: 7, emoji: '🤑' }  // Tiết kiệm 1 triệu
        ];

        for (const update of updates) {
            await pool.request()
                .input('id', sql.Int, update.id)
                .input('emoji', sql.NVarChar, update.emoji)
                .query('UPDATE Achievements SET IconURL = @emoji WHERE AchievementID = @id');
        }

        // Verify the updates
        const result = await pool.request().query('SELECT AchievementID, Name, IconURL FROM Achievements ORDER BY AchievementID');

        res.json({
            success: true,
            message: 'Achievements updated to use emojis',
            data: result.recordset
        });

    } catch (error) {
        console.error('Error updating achievement emojis:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật emoji huy hiệu: ' + error.message
        });
    }
});

module.exports = router; 