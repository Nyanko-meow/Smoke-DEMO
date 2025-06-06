const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();
const { auth: authenticateToken, authorize: authorizeRole } = require('../middleware/auth.middleware');

// Debug middleware
const debugMiddleware = (req, res, next) => {
    console.log('🔍 Chat route accessed:', req.method, req.path);
    console.log('🔍 User from auth middleware:', req.user);
    next();
};

// Test route for debugging
router.get('/test-auth', authenticateToken, (req, res) => {
    console.log('🧪 Test auth route - req.user:', req.user);
    res.json({
        success: true,
        message: 'Auth middleware works',
        user: req.user
    });
});

// Debug route to check current user
router.get('/debug-user', authenticateToken, (req, res) => {
    console.log('🔍 Debug user route - req.user:', req.user);
    res.json({
        success: true,
        message: 'User info retrieved',
        user: req.user,
        userRole: req.user?.Role,
        userRoleType: typeof req.user?.Role
    });
});

// Lấy conversation của member với coach (bypass role check for now)
router.get('/member/conversation', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.UserID;
        console.log('🔍 Member conversation - UserID:', userId, 'Role:', req.user.Role);

        // Tìm coach được assign cho user này (thông qua QuitPlans)
        const coachResult = await pool.request()
            .input('userId', userId)
            .query(`
                SELECT TOP 1 CoachID
                FROM QuitPlans 
                WHERE UserID = @userId AND CoachID IS NOT NULL AND Status = 'active'
                ORDER BY CreatedAt DESC
            `);

        console.log('🔍 Coach result:', coachResult.recordset);

        if (coachResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bạn chưa được assign coach hoặc chưa có kế hoạch cai thuốc active'
            });
        }

        const coachId = coachResult.recordset[0].CoachID;

        // Tìm hoặc tạo conversation
        let conversation = await pool.request()
            .input('coachId', coachId)
            .input('userId', userId)
            .query(`
                SELECT ConversationID, CoachID, MemberID
                FROM Conversations 
                WHERE CoachID = @coachId AND MemberID = @userId
            `);

        if (conversation.recordset.length === 0) {
            // Tạo conversation mới
            await pool.request()
                .input('coachId', coachId)
                .input('userId', userId)
                .query(`
                    INSERT INTO Conversations (CoachID, MemberID, LastMessageAt)
                    VALUES (@coachId, @userId, GETDATE())
                `);

            conversation = await pool.request()
                .input('coachId', coachId)
                .input('userId', userId)
                .query(`
                    SELECT ConversationID, CoachID, MemberID
                    FROM Conversations 
                    WHERE CoachID = @coachId AND MemberID = @userId
                `);
        }

        // Lấy thông tin coach
        const coachInfo = await pool.request()
            .input('coachId', coachId)
            .query(`
                SELECT UserID, FirstName + ' ' + LastName as FullName, Avatar, Email
                FROM Users 
                WHERE UserID = @coachId
            `);

        res.json({
            success: true,
            data: {
                conversation: conversation.recordset[0],
                coach: coachInfo.recordset[0]
            }
        });

    } catch (error) {
        console.error('Error loading member conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải cuộc trò chuyện',
            error: error.message
        });
    }
});

// API lấy lịch sử chat cho member (bypass role check for now)
router.get('/member/messages', authenticateToken, async (req, res) => {
    try {
        const memberId = req.user.UserID;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        console.log('🔍 Member messages - UserID:', memberId);

        // Tìm coach được assign cho member này
        const coachResult = await pool.request()
            .input('memberId', memberId)
            .query(`
                SELECT TOP 1 CoachID
                FROM QuitPlans 
                WHERE UserID = @memberId AND CoachID IS NOT NULL AND Status = 'active'
                ORDER BY CreatedAt DESC
            `);

        if (coachResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bạn chưa được assign coach hoặc chưa có kế hoạch cai thuốc active'
            });
        }

        const coachId = coachResult.recordset[0].CoachID;

        // Lấy tin nhắn giữa member và coach
        const result = await pool.request()
            .input('coachId', coachId)
            .input('memberId', memberId)
            .input('offset', offset)
            .input('limit', limit)
            .query(`
                SELECT 
                    m.MessageID,
                    m.SenderID,
                    m.ReceiverID,
                    m.Content,
                    m.MessageType,
                    m.IsRead,
                    m.RelatedPlanID,
                    m.CreatedAt,
                    u.FirstName + ' ' + u.LastName as SenderName,
                    u.Avatar as SenderAvatar,
                    u.Role as SenderRole
                FROM Messages m
                INNER JOIN Users u ON m.SenderID = u.UserID
                WHERE (m.SenderID = @coachId AND m.ReceiverID = @memberId)
                   OR (m.SenderID = @memberId AND m.ReceiverID = @coachId)
                ORDER BY m.CreatedAt DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

        // Đánh dấu tin nhắn từ coach đã đọc
        await pool.request()
            .input('memberId', memberId)
            .input('coachId', coachId)
            .query(`
                UPDATE Messages 
                SET IsRead = 1 
                WHERE ReceiverID = @memberId AND SenderID = @coachId AND IsRead = 0
            `);

        res.json({
            success: true,
            data: result.recordset.reverse(), // Reverse để tin nhắn cũ ở trên
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                hasMore: result.recordset.length === parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error loading member messages:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải tin nhắn',
            error: error.message
        });
    }
});

// API gửi tin nhắn cho coach (endpoint theo yêu cầu) - bypass role check for now
router.post('/coach/chat/send', authenticateToken, async (req, res) => {
    try {
        const { content, messageType = 'text', relatedPlanId = null } = req.body;
        const senderId = req.user.UserID;
        const userRole = req.user.Role;

        console.log('🔍 Send message - UserID:', senderId, 'Role:', userRole, 'Content:', content);

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu nội dung tin nhắn'
            });
        }

        let receiverId;

        if (userRole === 'member') {
            // Member gửi tin nhắn cho coach
            const coachResult = await pool.request()
                .input('senderId', senderId)
                .query(`
                    SELECT TOP 1 CoachID
                    FROM QuitPlans 
                    WHERE UserID = @senderId AND CoachID IS NOT NULL AND Status = 'active'
                    ORDER BY CreatedAt DESC
                `);

            if (coachResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Bạn chưa được assign coach hoặc chưa có kế hoạch cai thuốc active'
                });
            }

            receiverId = coachResult.recordset[0].CoachID;
        } else if (userRole === 'coach') {
            // Coach cần chỉ định member để gửi tin nhắn
            const { memberId } = req.body;
            if (!memberId) {
                return res.status(400).json({
                    success: false,
                    message: 'Coach cần chỉ định member để gửi tin nhắn'
                });
            }
            receiverId = memberId;
        } else {
            return res.status(403).json({
                success: false,
                message: 'Chỉ member và coach mới có thể sử dụng chức năng chat'
            });
        }

        // Kiểm tra người nhận tồn tại
        const receiverCheck = await pool.request()
            .input('receiverId', receiverId)
            .query(`
                SELECT UserID, Role FROM Users WHERE UserID = @receiverId
            `);

        if (receiverCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Người nhận không tồn tại'
            });
        }

        // Tạo tin nhắn
        const messageResult = await pool.request()
            .input('senderId', senderId)
            .input('receiverId', receiverId)
            .input('content', content)
            .input('messageType', messageType)
            .input('relatedPlanId', relatedPlanId)
            .query(`
                INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, RelatedPlanID)
                OUTPUT INSERTED.MessageID, INSERTED.CreatedAt
                VALUES (@senderId, @receiverId, @content, @messageType, @relatedPlanId)
            `);

        const messageId = messageResult.recordset[0].MessageID;
        const createdAt = messageResult.recordset[0].CreatedAt;

        // Tìm hoặc tạo conversation
        const coachId = userRole === 'coach' ? senderId : receiverId;
        const memberId = userRole === 'member' ? senderId : receiverId;

        let conversation = await pool.request()
            .input('coachId', coachId)
            .input('memberId', memberId)
            .query(`
                SELECT ConversationID FROM Conversations 
                WHERE CoachID = @coachId AND MemberID = @memberId
            `);

        if (conversation.recordset.length === 0) {
            await pool.request()
                .input('coachId', coachId)
                .input('memberId', memberId)
                .input('messageId', messageId)
                .input('createdAt', createdAt)
                .query(`
                    INSERT INTO Conversations (CoachID, MemberID, LastMessageID, LastMessageAt)
                    VALUES (@coachId, @memberId, @messageId, @createdAt)
                `);
        } else {
            await pool.request()
                .input('messageId', messageId)
                .input('createdAt', createdAt)
                .input('conversationId', conversation.recordset[0].ConversationID)
                .query(`
                    UPDATE Conversations 
                    SET LastMessageID = @messageId, LastMessageAt = @createdAt
                    WHERE ConversationID = @conversationId
                `);
        }

        // Lấy thông tin tin nhắn vừa gửi để trả về
        const messageInfo = await pool.request()
            .input('messageId', messageId)
            .query(`
                SELECT 
                    m.MessageID,
                    m.SenderID,
                    m.ReceiverID,
                    m.Content,
                    m.MessageType,
                    m.IsRead,
                    m.RelatedPlanID,
                    m.CreatedAt,
                    u.FirstName + ' ' + u.LastName as SenderName,
                    u.Avatar as SenderAvatar,
                    u.Role as SenderRole
                FROM Messages m
                INNER JOIN Users u ON m.SenderID = u.UserID
                WHERE m.MessageID = @messageId
            `);

        res.json({
            success: true,
            message: 'Tin nhắn đã được gửi',
            data: messageInfo.recordset[0]
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gửi tin nhắn',
            error: error.message
        });
    }
});

// Đánh dấu tin nhắn đã đọc
router.put('/messages/:messageId/read', authenticateToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.UserID;

        await pool.request()
            .input('messageId', messageId)
            .input('userId', userId)
            .query(`
                UPDATE Messages 
                SET IsRead = 1 
                WHERE MessageID = @messageId AND ReceiverID = @userId
            `);

        res.json({
            success: true,
            message: 'Đã đánh dấu tin nhắn đã đọc'
        });

    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đánh dấu tin nhắn đã đọc'
        });
    }
});

// Lấy số tin nhắn chưa đọc
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.UserID;

        const result = await pool.request()
            .input('userId', userId)
            .query(`
                SELECT COUNT(*) as unreadCount
                FROM Messages 
                WHERE ReceiverID = @userId AND IsRead = 0
            `);

        res.json({
            success: true,
            data: {
                unreadCount: result.recordset[0].unreadCount
            }
        });

    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy số tin nhắn chưa đọc'
        });
    }
});

module.exports = router; 