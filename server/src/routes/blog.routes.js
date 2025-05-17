const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');

// Get all published blog posts
router.get('/', async (req, res) => {
    try {
        const result = await pool.request()
            .query(`
        SELECT 
            p.*,
            u.FirstName as AuthorFirstName,
            u.LastName as AuthorLastName,
            (SELECT COUNT(*) FROM Comments c WHERE c.PostID = p.PostID AND c.Status = 'approved') as CommentCount
        FROM BlogPosts p
        JOIN Users u ON p.AuthorID = u.UserID
        WHERE p.Status = 'published'
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
            message: 'Error getting blog posts'
        });
    }
});

// Get single blog post
router.get('/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        const result = await pool.request()
            .input('PostID', postId)
            .query(`
        SELECT 
            p.*,
            u.FirstName as AuthorFirstName,
            u.LastName as AuthorLastName,
            (SELECT COUNT(*) FROM Comments c WHERE c.PostID = p.PostID AND c.Status = 'approved') as CommentCount
        FROM BlogPosts p
        JOIN Users u ON p.AuthorID = u.UserID
        WHERE p.PostID = @PostID AND p.Status = 'published'
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
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
            message: 'Error getting blog post'
        });
    }
});

// Create blog post (admin/coach only)
router.post('/', protect, authorize('admin', 'coach'), async (req, res) => {
    try {
        const { title, content } = req.body;

        const result = await pool.request()
            .input('Title', title)
            .input('Content', content)
            .input('AuthorID', req.user.UserID)
            .query(`
        INSERT INTO BlogPosts (Title, Content, AuthorID, Status)
        OUTPUT INSERTED.*
        VALUES (@Title, @Content, @AuthorID, 'draft')
      `);

        res.status(201).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error creating blog post'
        });
    }
});

// Update blog post (admin/coach only)
router.put('/:postId', protect, authorize('admin', 'coach'), async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content, status } = req.body;

        const result = await pool.request()
            .input('PostID', postId)
            .input('Title', title)
            .input('Content', content)
            .input('Status', status)
            .input('AuthorID', req.user.UserID)
            .query(`
        UPDATE BlogPosts
        SET Title = @Title,
            Content = @Content,
            Status = @Status,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE PostID = @PostID AND AuthorID = @AuthorID
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
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
            message: 'Error updating blog post'
        });
    }
});

// Add comment to blog post
router.post('/:postId/comments', protect, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;

        const result = await pool.request()
            .input('PostID', postId)
            .input('UserID', req.user.UserID)
            .input('Content', content)
            .query(`
        INSERT INTO Comments (PostID, UserID, Content, Status)
        OUTPUT INSERTED.*
        VALUES (@PostID, @UserID, @Content, 'pending')
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

// Get comments for blog post
router.get('/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;

        const result = await pool.request()
            .input('PostID', postId)
            .query(`
        SELECT 
            c.*,
            u.FirstName,
            u.LastName
        FROM Comments c
        JOIN Users u ON c.UserID = u.UserID
        WHERE c.PostID = @PostID AND c.Status = 'approved'
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

// Moderate comment (admin only)
router.put('/comments/:commentId', protect, authorize('admin'), async (req, res) => {
    try {
        const { commentId } = req.params;
        const { status } = req.body;

        const result = await pool.request()
            .input('CommentID', commentId)
            .input('Status', status)
            .query(`
        UPDATE Comments
        SET Status = @Status
        OUTPUT INSERTED.*
        WHERE CommentID = @CommentID
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
            message: 'Error moderating comment'
        });
    }
});

module.exports = router; 