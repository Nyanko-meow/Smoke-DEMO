const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');

// Get all community posts with achievements and likes
router.get('/posts', async (req, res) => {
    try {
        const result = await pool.request()
            .query(`
        SELECT 
            p.*,
            u.FirstName,
            u.LastName,
            u.Avatar,
            a.Name as AchievementName,
            a.Description as AchievementDescription,
            a.IconURL as AchievementIcon,
            (SELECT COUNT(*) FROM CommunityComments c WHERE c.PostID = p.PostID) as CommentCount,
            (SELECT COUNT(*) FROM PostLikes pl WHERE pl.PostID = p.PostID) as LikesCount
        FROM CommunityPosts p
        JOIN Users u ON p.UserID = u.UserID
        LEFT JOIN Achievements a ON p.AchievementID = a.AchievementID
        WHERE p.IsPublic = 1
        ORDER BY p.CreatedAt DESC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting community posts'
        });
    }
});

// Get single community post with achievement details
router.get('/posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        const result = await pool.request()
            .input('PostID', postId)
            .query(`
        SELECT 
            p.*,
            u.FirstName,
            u.LastName,
            u.Avatar,
            a.Name as AchievementName,
            a.Description as AchievementDescription,
            a.IconURL as AchievementIcon,
            (SELECT COUNT(*) FROM CommunityComments c WHERE c.PostID = p.PostID) as CommentCount,
            (SELECT COUNT(*) FROM PostLikes pl WHERE pl.PostID = p.PostID) as LikesCount
        FROM CommunityPosts p
        JOIN Users u ON p.UserID = u.UserID
        LEFT JOIN Achievements a ON p.AchievementID = a.AchievementID
        WHERE p.PostID = @PostID
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Community post not found'
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
            message: 'Error getting community post'
        });
    }
});

// Create community post
router.post('/posts', protect, async (req, res) => {
    try {
        const { title, content, achievementId } = req.body;

        const result = await pool.request()
            .input('Title', title)
            .input('Content', content)
            .input('UserID', req.user.UserID)
            .input('AchievementID', achievementId || null)
            .query(`
        INSERT INTO CommunityPosts (Title, Content, UserID, AchievementID)
        OUTPUT INSERTED.*
        VALUES (@Title, @Content, @UserID, @AchievementID)
      `);

        res.status(201).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error creating community post'
        });
    }
});

// Like/Unlike post
router.post('/posts/:postId/like', protect, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.UserID;

        // Check if user already liked this post
        const existingLike = await pool.request()
            .input('PostID', postId)
            .input('UserID', userId)
            .query(`
                SELECT LikeID FROM PostLikes 
                WHERE PostID = @PostID AND UserID = @UserID
            `);

        if (existingLike.recordset.length > 0) {
            // Unlike: Remove the like
            await pool.request()
                .input('PostID', postId)
                .input('UserID', userId)
                .query(`
                    DELETE FROM PostLikes 
                    WHERE PostID = @PostID AND UserID = @UserID
                `);

            // Update likes count in CommunityPosts
            const likesCount = await pool.request()
                .input('PostID', postId)
                .query(`
                    UPDATE CommunityPosts 
                    SET Likes = (SELECT COUNT(*) FROM PostLikes WHERE PostID = @PostID)
                    WHERE PostID = @PostID;
                    
                    SELECT Likes FROM CommunityPosts WHERE PostID = @PostID;
                `);

            res.json({
                success: true,
                liked: false,
                likesCount: likesCount.recordset[0].Likes
            });
        } else {
            // Like: Add the like
            await pool.request()
                .input('PostID', postId)
                .input('UserID', userId)
                .query(`
                    INSERT INTO PostLikes (PostID, UserID) 
                    VALUES (@PostID, @UserID)
                `);

            // Update likes count in CommunityPosts
            const likesCount = await pool.request()
                .input('PostID', postId)
                .query(`
                    UPDATE CommunityPosts 
                    SET Likes = (SELECT COUNT(*) FROM PostLikes WHERE PostID = @PostID)
                    WHERE PostID = @PostID;
                    
                    SELECT Likes FROM CommunityPosts WHERE PostID = @PostID;
                `);

            res.json({
                success: true,
                liked: true,
                likesCount: likesCount.recordset[0].Likes
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error toggling like'
        });
    }
});

// Check if user liked a post
router.get('/posts/:postId/like-status', protect, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.UserID;

        const result = await pool.request()
            .input('PostID', postId)
            .input('UserID', userId)
            .query(`
                SELECT LikeID FROM PostLikes 
                WHERE PostID = @PostID AND UserID = @UserID
            `);

        res.json({
            success: true,
            liked: result.recordset.length > 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error checking like status'
        });
    }
});

// Share achievement to community
router.post('/share-achievement', protect, async (req, res) => {
    try {
        const { achievementId, message } = req.body;
        const userId = req.user.UserID;

        // Get achievement details
        const achievement = await pool.request()
            .input('AchievementID', achievementId)
            .input('UserID', userId)
            .query(`
                SELECT a.*, ua.EarnedAt
                FROM Achievements a
                JOIN UserAchievements ua ON a.AchievementID = ua.AchievementID
                WHERE a.AchievementID = @AchievementID AND ua.UserID = @UserID
            `);

        if (achievement.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Achievement not found or not earned by user'
            });
        }

        const achievementData = achievement.recordset[0];
        const title = `🏆 Đã đạt được: ${achievementData.Name}`;
        const content = message || `Tôi vừa đạt được huy hiệu "${achievementData.Name}"! ${achievementData.Description}`;

        const result = await pool.request()
            .input('Title', title)
            .input('Content', content)
            .input('UserID', userId)
            .input('AchievementID', achievementId)
            .query(`
                INSERT INTO CommunityPosts (Title, Content, UserID, AchievementID)
                OUTPUT INSERTED.*
                VALUES (@Title, @Content, @UserID, @AchievementID)
            `);

        res.status(201).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error sharing achievement'
        });
    }
});

// Update community post
router.put('/posts/:postId', protect, async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content } = req.body;

        const result = await pool.request()
            .input('PostID', postId)
            .input('Title', title)
            .input('Content', content)
            .input('UserID', req.user.UserID)
            .query(`
        UPDATE CommunityPosts
        SET Title = @Title,
            Content = @Content,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE PostID = @PostID AND UserID = @UserID
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Community post not found'
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
            message: 'Error updating community post'
        });
    }
});

// Delete community post
router.delete('/posts/:postId', protect, async (req, res) => {
    try {
        const { postId } = req.params;

        // Check if user is admin or the owner of the post
        if (req.user.role === 'admin') {
            // Admin can delete any post
            const result = await pool.request()
                .input('PostID', postId)
                .query(`
                DELETE FROM CommunityPosts
                OUTPUT DELETED.*
                WHERE PostID = @PostID
            `);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Community post not found'
                });
            }

            res.json({
                success: true,
                data: result.recordset[0],
                deletedBy: 'admin'
            });
        } else {
            // Regular user can only delete their own posts
            const result = await pool.request()
                .input('PostID', postId)
                .input('UserID', req.user.UserID)
                .query(`
                DELETE FROM CommunityPosts
                OUTPUT DELETED.*
                WHERE PostID = @PostID AND UserID = @UserID
            `);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Community post not found or you do not have permission to delete it'
                });
            }

            res.json({
                success: true,
                data: result.recordset[0],
                deletedBy: 'owner'
            });
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting community post'
        });
    }
});

// Add comment to community post
router.post('/posts/:postId/comments', protect, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;

        const result = await pool.request()
            .input('PostID', postId)
            .input('UserID', req.user.UserID)
            .input('Content', content)
            .query(`
        INSERT INTO CommunityComments (PostID, UserID, Content)
        OUTPUT INSERTED.*
        VALUES (@PostID, @UserID, @Content)
      `);

        res.status(201).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error adding comment'
        });
    }
});

// Get comments for community post
router.get('/posts/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;

        const result = await pool.request()
            .input('PostID', postId)
            .query(`
        SELECT 
            c.*,
            u.FirstName,
            u.LastName
        FROM CommunityComments c
        JOIN Users u ON c.UserID = u.UserID
        WHERE c.PostID = @PostID
        ORDER BY c.CreatedAt DESC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting comments'
        });
    }
});

// Update community comment
router.put('/comments/:commentId', protect, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;

        const result = await pool.request()
            .input('CommentID', commentId)
            .input('Content', content)
            .input('UserID', req.user.UserID)
            .query(`
        UPDATE CommunityComments
        SET Content = @Content,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE CommentID = @CommentID AND UserID = @UserID
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
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
            message: 'Error updating comment'
        });
    }
});

// Delete community comment
router.delete('/comments/:commentId', protect, async (req, res) => {
    try {
        const { commentId } = req.params;

        const result = await pool.request()
            .input('CommentID', commentId)
            .input('UserID', req.user.UserID)
            .query(`
        DELETE FROM CommunityComments
        OUTPUT DELETED.*
        WHERE CommentID = @CommentID AND UserID = @UserID
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
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
            message: 'Error deleting comment'
        });
    }
});

// Get user's comments
router.get('/user-comments', protect, async (req, res) => {
    try {
        console.log('📝 Getting comments for user:', req.user.UserID);

        // First check if tables exist
        const tablesCheck = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME IN ('CommunityComments', 'CommunityPosts')
            ORDER BY TABLE_NAME
        `);

        console.log('📊 Available tables:', tablesCheck.recordset.map(t => t.TABLE_NAME));

        if (tablesCheck.recordset.length < 2) {
            return res.status(500).json({
                success: false,
                message: 'Database tables not properly set up. Please run setup script.',
                missingTables: ['CommunityComments', 'CommunityPosts'].filter(
                    t => !tablesCheck.recordset.some(r => r.TABLE_NAME === t)
                )
            });
        }

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT 
                    c.*,
                    p.Title as PostTitle,
                    u.FirstName,
                    u.LastName
                FROM CommunityComments c
                LEFT JOIN CommunityPosts p ON c.PostID = p.PostID
                LEFT JOIN Users u ON c.UserID = u.UserID
                WHERE c.UserID = @UserID
                ORDER BY c.CreatedAt DESC
            `);

        console.log(`✅ Found ${result.recordset.length} comments for user ${req.user.UserID}`);

        res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });
    } catch (error) {
        console.error('❌ Error getting user comments:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting user comments',
            error: error.message
        });
    }
});

module.exports = router; 