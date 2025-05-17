const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');

// Get all community posts
router.get('/posts', async (req, res) => {
    try {
        const result = await pool.request()
            .query(`
        SELECT 
            p.*,
            u.FirstName,
            u.LastName,
            (SELECT COUNT(*) FROM CommunityComments c WHERE c.PostID = p.PostID) as CommentCount
        FROM CommunityPosts p
        JOIN Users u ON p.UserID = u.UserID
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

// Get single community post
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
            (SELECT COUNT(*) FROM CommunityComments c WHERE c.PostID = p.PostID) as CommentCount
        FROM CommunityPosts p
        JOIN Users u ON p.UserID = u.UserID
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
        const { title, content } = req.body;

        const result = await pool.request()
            .input('Title', title)
            .input('Content', content)
            .input('UserID', req.user.UserID)
            .query(`
        INSERT INTO CommunityPosts (Title, Content, UserID)
        OUTPUT INSERTED.*
        VALUES (@Title, @Content, @UserID)
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

module.exports = router; 