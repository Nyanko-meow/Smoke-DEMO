const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();
const { auth: authenticateToken } = require('../middleware/auth.middleware');

// Test route for debugging
router.get('/test-auth', authenticateToken, (req, res) => {
    console.log('🧪 Test auth route - req.user:', req.user);
    res.json({
        success: true,
        message: 'Auth middleware works',
        user: req.user
    });
});

// Get coach conversations
router.get('/coach/conversations', authenticateToken, async (req, res) => {
    try {
        const coachId = req.user.UserID;
        console.log('🔍 Coach conversations - CoachID:', coachId);

        const result = await pool.request()
            .input('coachId', coachId)
            .query(`
                SELECT 
                    c.ConversationID,
                    c.CoachID,
                    c.MemberID,
                    c.LastMessageAt,
                    u.FirstName + ' ' + u.LastName as MemberName,
                    u.Avatar as MemberAvatar,
                    u.Email as MemberEmail,
                    (SELECT TOP 1 Content FROM Messages 
                     WHERE (SenderID = c.CoachID AND ReceiverID = c.MemberID) 
                        OR (SenderID = c.MemberID AND ReceiverID = c.CoachID)
                     ORDER BY CreatedAt DESC) as LastMessage
                FROM Conversations c
                INNER JOIN Users u ON c.MemberID = u.UserID
                WHERE c.CoachID = @coachId AND c.IsActive = 1
                ORDER BY c.LastMessageAt DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error loading coach conversations:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải cuộc trò chuyện',
            error: error.message
        });
    }
});

// Get conversation messages
router.get('/conversation/:conversationId/messages', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.UserID;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        console.log('🔍 Get conversation messages - ConversationID:', conversationId, 'UserID:', userId);

        // Verify user has access to this conversation
        const conversationCheck = await pool.request()
            .input('conversationId', conversationId)
            .input('userId', userId)
            .query(`
                SELECT ConversationID, CoachID, MemberID FROM Conversations 
                WHERE ConversationID = @conversationId 
                AND (CoachID = @userId OR MemberID = @userId)
            `);

        if (conversationCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cuộc trò chuyện không tồn tại hoặc bạn không có quyền truy cập'
            });
        }

        const conversation = conversationCheck.recordset[0];
        const coachId = conversation.CoachID;
        const memberId = conversation.MemberID;

        // Get messages (simplified without file columns)
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

        // Mark messages as read for current user
        await pool.request()
            .input('userId', userId)
            .input('otherUserId', userId === coachId ? memberId : coachId)
            .query(`
                UPDATE Messages 
                SET IsRead = 1 
                WHERE ReceiverID = @userId AND SenderID = @otherUserId AND IsRead = 0
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
        console.error('Error loading conversation messages:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải tin nhắn',
            error: error.message
        });
    }
});

// Send message to conversation
router.post('/conversation/:conversationId/send', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content, messageType = 'text', relatedPlanId = null } = req.body;
        const senderId = req.user.UserID;

        console.log('🔍 Send message to conversation - ConversationID:', conversationId, 'UserID:', senderId);

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu nội dung tin nhắn'
            });
        }

        // Verify user has access to this conversation
        const conversationCheck = await pool.request()
            .input('conversationId', conversationId)
            .input('userId', senderId)
            .query(`
                SELECT ConversationID, CoachID, MemberID FROM Conversations 
                WHERE ConversationID = @conversationId 
                AND (CoachID = @userId OR MemberID = @userId)
            `);

        if (conversationCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cuộc trò chuyện không tồn tại hoặc bạn không có quyền truy cập'
            });
        }

        const conversation = conversationCheck.recordset[0];
        const receiverId = senderId === conversation.CoachID ? conversation.MemberID : conversation.CoachID;

        // Create message (simplified without file columns)
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

        // Update conversation
        await pool.request()
            .input('messageId', messageId)
            .input('createdAt', createdAt)
            .input('conversationId', conversationId)
            .query(`
                UPDATE Conversations 
                SET LastMessageID = @messageId, LastMessageAt = @createdAt
                WHERE ConversationID = @conversationId
            `);

        // Get message info to return
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
        console.error('Error sending message to conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gửi tin nhắn',
            error: error.message
        });
    }
});

// Member messages endpoint
router.get('/member/messages', authenticateToken, async (req, res) => {
    try {
        const memberId = req.user.UserID;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        console.log('🔍 Member messages - UserID:', memberId);

        // Find coach for this member
        let coachResult = await pool.request()
            .input('memberId', memberId)
            .query(`
                SELECT TOP 1 CoachID
                FROM Conversations 
                WHERE MemberID = @memberId AND IsActive = 1
                ORDER BY LastMessageAt DESC
            `);

        let coachId;
        if (coachResult.recordset.length === 0) {
            // Find first available coach
            const availableCoach = await pool.request().query(`
                SELECT TOP 1 UserID
                FROM Users 
                WHERE Role = 'coach' AND IsActive = 1
                ORDER BY UserID
            `);

            if (availableCoach.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không có coach nào có sẵn trong hệ thống'
                });
            }

            coachId = availableCoach.recordset[0].UserID;

            // Create new conversation
            await pool.request()
                .input('coachId', coachId)
                .input('memberId', memberId)
                .query(`
                    INSERT INTO Conversations (CoachID, MemberID, LastMessageAt, IsActive)
                    VALUES (@coachId, @memberId, GETDATE(), 1)
                `);
        } else {
            coachId = coachResult.recordset[0].CoachID;
        }

        // Get messages (simplified without file columns)
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

        // Mark messages as read
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
            data: result.recordset.reverse(),
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

// Send message endpoint
router.post('/coach/chat/send', authenticateToken, async (req, res) => {
    try {
        const { content, messageType = 'text', relatedPlanId = null, memberId } = req.body;
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
            // Member sends to coach
            let coachResult = await pool.request()
                .input('senderId', senderId)
                .query(`
                    SELECT TOP 1 CoachID
                    FROM Conversations 
                    WHERE MemberID = @senderId AND IsActive = 1
                    ORDER BY LastMessageAt DESC
                `);

            if (coachResult.recordset.length === 0) {
                const availableCoach = await pool.request().query(`
                    SELECT TOP 1 UserID
                    FROM Users 
                    WHERE Role = 'coach' AND IsActive = 1
                    ORDER BY UserID
                `);

                if (availableCoach.recordset.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Không có coach nào có sẵn trong hệ thống'
                    });
                }

                receiverId = availableCoach.recordset[0].UserID;

                // Create conversation
                await pool.request()
                    .input('coachId', receiverId)
                    .input('memberId', senderId)
                    .query(`
                        INSERT INTO Conversations (CoachID, MemberID, LastMessageAt, IsActive)
                        VALUES (@coachId, @memberId, GETDATE(), 1)
                    `);
            } else {
                receiverId = coachResult.recordset[0].CoachID;
            }
        } else if (userRole === 'coach') {
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

        // Create message (simplified without file columns)
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

        // Update or create conversation
        const coachId = userRole === 'coach' ? senderId : receiverId;
        const memberIdForConv = userRole === 'member' ? senderId : receiverId;

        let conversation = await pool.request()
            .input('coachId', coachId)
            .input('memberId', memberIdForConv)
            .query(`
                SELECT ConversationID FROM Conversations 
                WHERE CoachID = @coachId AND MemberID = @memberId
            `);

        if (conversation.recordset.length === 0) {
            await pool.request()
                .input('coachId', coachId)
                .input('memberId', memberIdForConv)
                .input('messageId', messageId)
                .input('createdAt', createdAt)
                .query(`
                    INSERT INTO Conversations (CoachID, MemberID, LastMessageID, LastMessageAt, IsActive)
                    VALUES (@coachId, @memberId, @messageId, @createdAt, 1)
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

        // Get message info to return
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

module.exports = router; 