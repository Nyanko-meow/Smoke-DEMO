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

// Get single blog post (WITHOUT incrementing view)
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
                message: 'Blog post not found or not published'
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

// Increment view count (separate endpoint)
router.post('/:postId/view', async (req, res) => {
    try {
        const { postId } = req.params;

        // Check if post exists and is published
        const checkResult = await pool.request()
            .input('PostID', postId)
            .query('SELECT PostID FROM BlogPosts WHERE PostID = @PostID AND Status = \'published\'');

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found or not published'
            });
        }

        // Increment view count
        await pool.request()
            .input('PostID', postId)
            .query('UPDATE BlogPosts SET Views = Views + 1 WHERE PostID = @PostID');

        res.json({
            success: true,
            message: 'View count incremented'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error incrementing view count'
        });
    }
});

// Create blog post (users and coaches can post, but need approval)
router.post('/', protect, async (req, res) => {
    try {
        console.log('🔍 Creating blog post:', {
            user: req.user,
            body: req.body
        });

        const { title, content, metaDescription, thumbnailURL } = req.body;

        // Validation
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu đề và nội dung là bắt buộc'
            });
        }

        if (title.length > 200) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu đề không được quá 200 ký tự'
            });
        }

        if (metaDescription && metaDescription.length > 300) {
            return res.status(400).json({
                success: false,
                message: 'Mô tả không được quá 300 ký tự'
            });
        }

        // Validate and clean thumbnail URL
        let cleanThumbnailURL = '';
        if (thumbnailURL && thumbnailURL.trim()) {
            const urlToCheck = thumbnailURL.trim();

            // Check length
            if (urlToCheck.length > 500) {
                return res.status(400).json({
                    success: false,
                    message: 'URL hình ảnh không được quá 500 ký tự'
                });
            }

            // Basic URL validation
            try {
                // If URL doesn't start with http/https, add https
                const fullUrl = urlToCheck.startsWith('http') ? urlToCheck : `https://${urlToCheck}`;
                new URL(fullUrl); // Will throw if invalid
                cleanThumbnailURL = fullUrl;
            } catch (urlError) {
                return res.status(400).json({
                    success: false,
                    message: 'URL hình ảnh không hợp lệ'
                });
            }
        }

        // Determine status based on user role
        let status = 'Pending'; // Default to pending for members/coaches
        let publishedAt = null;

        console.log('👤 User role check:', {
            userRole: req.user.Role,
            userRoleType: typeof req.user.Role,
            isAdmin: req.user.Role === 'admin'
        });

        // Only admin can publish immediately
        if (req.user.Role === 'admin') {
            status = 'published';
            publishedAt = new Date();
        }

        console.log('💾 Database query params:', {
            Title: title,
            Content: content?.substring(0, 100) + '...',
            MetaDescription: metaDescription || '',
            ThumbnailURL: cleanThumbnailURL,
            AuthorID: req.user.UserID,
            Status: status,
            PublishedAt: publishedAt
        });

        const result = await pool.request()
            .input('Title', title)
            .input('Content', content)
            .input('MetaDescription', metaDescription || '')
            .input('ThumbnailURL', cleanThumbnailURL)
            .input('AuthorID', req.user.UserID)
            .input('Status', status)
            .input('PublishedAt', publishedAt)
            .query(`
                INSERT INTO BlogPosts (Title, Content, MetaDescription, ThumbnailURL, AuthorID, Status, PublishedAt)
                OUTPUT INSERTED.*
                VALUES (@Title, @Content, @MetaDescription, @ThumbnailURL, @AuthorID, @Status, @PublishedAt)
            `);

        console.log('✅ Blog post created successfully:', result.recordset[0]);

        const responseMessage = status === 'published'
            ? 'Bài viết đã được tạo và xuất bản thành công'
            : 'Bài viết đã được tạo thành công và đang chờ duyệt';

        res.status(201).json({
            success: true,
            data: result.recordset[0],
            message: responseMessage,
            status: status
        });
    } catch (error) {
        console.error('❌ Error creating blog post:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
        });

        // Handle specific database errors
        if (error.code === 'EREQUEST') {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo bài viết. Vui lòng thử lại sau.'
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

        // Check if user is admin or the author of the post
        if (req.user.role === 'admin') {
            // Admin can delete any blog post
            // First delete all comments for this blog post
            await pool.request()
                .input('PostID', postId)
                .query(`
                DELETE FROM Comments
                WHERE PostID = @PostID
            `);

            // Then delete the blog post
            const result = await pool.request()
                .input('PostID', postId)
                .query(`
                DELETE FROM BlogPosts 
                WHERE PostID = @PostID
            `);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Blog post not found'
                });
            }

            res.json({
                success: true,
                message: 'Blog post deleted successfully by admin'
            });
        } else {
            // Regular user can only delete their own blog posts
            // First delete all comments for this blog post if user owns it
            await pool.request()
                .input('PostID', postId)
                .input('AuthorID', req.user.UserID)
                .query(`
                DELETE FROM Comments
                WHERE PostID = @PostID AND PostID IN (
                    SELECT PostID FROM BlogPosts WHERE PostID = @PostID AND AuthorID = @AuthorID
                )
            `);

            // Then delete the blog post
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
        }
    } catch (error) {
        console.error('Error deleting blog post:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting blog post'
        });
    }
});

// Delete comment (user or admin) - Must be before /:postId/comments routes
router.delete('/comments/:commentId', protect, async (req, res) => {
    try {
        const { commentId } = req.params;

        // Check if user is admin or the owner of the comment
        if (req.user.role === 'admin') {
            // Admin can delete any comment
            const result = await pool.request()
                .input('CommentID', commentId)
                .query(`
                DELETE FROM Comments
                OUTPUT DELETED.*
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
                message: 'Comment deleted successfully by admin'
            });
        } else {
            // Regular user can only delete their own comments
            const result = await pool.request()
                .input('CommentID', commentId)
                .input('UserID', req.user.UserID)
                .query(`
                DELETE FROM Comments
                OUTPUT DELETED.*
                WHERE CommentID = @CommentID AND UserID = @UserID
            `);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found or you do not have permission to delete it'
                });
            }

            res.json({
                success: true,
                data: result.recordset[0],
                message: 'Comment deleted successfully'
            });
        }
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting comment'
        });
    }
});

// Moderate comment (admin only) - Must be before /:postId/comments routes
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

// Get user's own posts (including pending)
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



// Get user notifications
router.get('/notifications', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT 
                    NotificationID,
                    Type,
                    Title,
                    Message,
                    RelatedID,
                    IsRead,
                    CreatedAt
                FROM Notifications
                WHERE UserID = @UserID
                ORDER BY CreatedAt DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting notifications'
        });
    }
});

// Mark notification as read
router.patch('/notifications/:notificationId/read', protect, async (req, res) => {
    try {
        const { notificationId } = req.params;

        const result = await pool.request()
            .input('NotificationID', notificationId)
            .input('UserID', req.user.UserID)
            .query(`
                UPDATE Notifications
                SET IsRead = 1
                WHERE NotificationID = @NotificationID AND UserID = @UserID
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking notification as read'
        });
    }
});

// Get unread notifications count
router.get('/notifications/unread-count', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT COUNT(*) as unreadCount
                FROM Notifications
                WHERE UserID = @UserID AND IsRead = 0
            `);

        res.json({
            success: true,
            data: {
                unreadCount: result.recordset[0].unreadCount || 0
            }
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting unread count'
        });
    }
});

module.exports = router; 