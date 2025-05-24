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
        WHERE p.Status IN ('published', 'Pending')
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
        WHERE p.PostID = @PostID AND p.Status IN ('published', 'Pending')
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
            });
        }

        // Increment view count
        await pool.request()
            .input('PostID', postId)
            .query('UPDATE BlogPosts SET Views = Views + 1 WHERE PostID = @PostID');

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

// Create blog post (users and coaches can post, auto-approved for now)
router.post('/', protect, async (req, res) => {
    try {
        const { title, content, metaDescription, thumbnailURL } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        const result = await pool.request()
            .input('Title', title)
            .input('Content', content)
            .input('MetaDescription', metaDescription || '')
            .input('ThumbnailURL', thumbnailURL || '')
            .input('AuthorID', req.user.UserID)
            .query(`
        INSERT INTO BlogPosts (Title, Content, MetaDescription, ThumbnailURL, AuthorID, Status, PublishedAt)
        OUTPUT INSERTED.*
        VALUES (@Title, @Content, @MetaDescription, @ThumbnailURL, @AuthorID, 'published', GETDATE())
      `);

        res.status(201).json({
            success: true,
            data: result.recordset[0],
            message: 'Blog post created successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error creating blog post'
        });
    }
});

// Update blog post (author only)
router.put('/:postId', protect, async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content, metaDescription, thumbnailURL, status } = req.body;

        const result = await pool.request()
            .input('PostID', postId)
            .input('Title', title)
            .input('Content', content)
            .input('MetaDescription', metaDescription || '')
            .input('ThumbnailURL', thumbnailURL || '')
            .input('Status', status || 'published')
            .input('AuthorID', req.user.UserID)
            .query(`
        UPDATE BlogPosts
        SET Title = @Title,
            Content = @Content,
            MetaDescription = @MetaDescription,
            ThumbnailURL = @ThumbnailURL,
            Status = @Status
        OUTPUT INSERTED.*
        WHERE PostID = @PostID AND AuthorID = @AuthorID
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found or you are not authorized to edit it'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
            message: 'Blog post updated successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error updating blog post'
        });
    }
});

// Delete blog post (author only)
router.delete('/:postId', protect, async (req, res) => {
    try {
        const { postId } = req.params;

        const result = await pool.request()
            .input('PostID', postId)
            .input('AuthorID', req.user.UserID)
            .query(`
        DELETE FROM BlogPosts 
        WHERE PostID = @PostID AND AuthorID = @AuthorID
      `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found or you are not authorized to delete it'
            });
        }

        res.json({
            success: true,
            message: 'Blog post deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error deleting blog post'
        });
    }
});

// Add comment to blog post
router.post('/:postId/comments', protect, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Comment content is required'
            });
        }

        const result = await pool.request()
            .input('PostID', postId)
            .input('UserID', req.user.UserID)
            .input('Content', content)
            .query(`
        INSERT INTO Comments (PostID, UserID, CommentText, Status)
        OUTPUT INSERTED.*
        VALUES (@PostID, @UserID, @Content, 'approved')
      `);

        res.status(201).json({
            success: true,
            data: result.recordset[0],
            message: 'Comment added successfully'
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

// Get user's own posts
router.get('/my/posts', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('AuthorID', req.user.UserID)
            .query(`
        SELECT 
            p.*,
            u.FirstName as AuthorFirstName,
            u.LastName as AuthorLastName,
            (SELECT COUNT(*) FROM Comments c WHERE c.PostID = p.PostID AND c.Status = 'approved') as CommentCount
        FROM BlogPosts p
        JOIN Users u ON p.AuthorID = u.UserID
        WHERE p.AuthorID = @AuthorID
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
            message: 'Error getting your blog posts'
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
            data: result.recordset[0],
            message: 'Comment moderated successfully'
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