const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();
const { auth: authenticateToken } = require('../middleware/auth.middleware');

// Simple test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Chat test endpoint works',
        timestamp: new Date().toISOString()
    });
});

// Debug user endpoint (for compatibility)
router.get('/debug-user', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Debug user endpoint',
        user: req.user,
        userRole: req.user?.Role,
        userRoleType: typeof req.user?.Role
    });
});

// Member conversation endpoint (for compatibility)
router.get('/member/conversation', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.UserID;
        console.log('🔍 Member conversation - UserID:', userId);

        // Find or create conversation with a coach
        let conversation = await pool.request()
            .input('memberId', userId)
            .query(`
                SELECT TOP 1 ConversationID, CoachID 
                FROM Conversations 
                WHERE MemberID = @memberId
                ORDER BY LastMessageAt DESC
            `);

        let conversationId, coachId;

        if (conversation.recordset.length === 0) {
            // Find first available coach
            const coach = await pool.request().query(`
                SELECT TOP 1 UserID FROM Users 
                WHERE Role = 'coach' AND IsActive = 1
                ORDER BY UserID
            `);

            if (coach.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không có coach nào có sẵn trong hệ thống'
                });
            }

            coachId = coach.recordset[0].UserID;

            // Create conversation
            const newConv = await pool.request()
                .input('coachId', coachId)
                .input('memberId', userId)
                .query(`
                    INSERT INTO Conversations (CoachID, MemberID, LastMessageAt)
                    OUTPUT INSERTED.ConversationID
                    VALUES (@coachId, @memberId, GETDATE())
                `);

            conversationId = newConv.recordset[0].ConversationID;
        } else {
            conversationId = conversation.recordset[0].ConversationID;
            coachId = conversation.recordset[0].CoachID;
        }

        // Get coach info
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
                conversation: { ConversationID: conversationId, CoachID: coachId, MemberID: userId },
                coach: coachInfo.recordset[0] || {}
            }
        });

    } catch (error) {
        console.error('Error loading member conversation:', error);
        res.json({
            success: true,
            data: {
                conversation: null,
                coach: null
            },
            message: 'No conversation found'
        });
    }
});

// Get coach conversations (simple version)
router.get('/coach/conversations', authenticateToken, async (req, res) => {
    try {
        const coachId = req.user.UserID;
        console.log('🔍 Coach conversations - CoachID:', coachId);

        // Query with unread count and last message
        const result = await pool.request()
            .input('coachId', coachId)
            .query(`
                SELECT 
                    c.ConversationID,
                    c.CoachID,
                    c.MemberID,
                    c.LastMessageAt,
                    u.FirstName + ' ' + u.LastName as MemberName,
                    u.Email as MemberEmail,
                    COALESCE(u.Avatar, '/default-avatar.png') as MemberAvatar,
                    (SELECT COUNT(*) FROM Messages m 
                     WHERE m.SenderID = c.MemberID 
                     AND m.ReceiverID = c.CoachID 
                     AND m.IsRead = 0) as UnreadCount,
                    (SELECT TOP 1 Content FROM Messages m2
                     WHERE (m2.SenderID = c.CoachID AND m2.ReceiverID = c.MemberID)
                        OR (m2.SenderID = c.MemberID AND m2.ReceiverID = c.CoachID)
                     ORDER BY m2.CreatedAt DESC) as LastMessageContent
                FROM Conversations c
                INNER JOIN Users u ON c.MemberID = u.UserID
                WHERE c.CoachID = @coachId
                ORDER BY c.LastMessageAt DESC
            `);

        res.json({
            success: true,
            data: result.recordset || []
        });

    } catch (error) {
        console.error('Error loading coach conversations:', error);
        res.json({
            success: true,
            data: [],
            message: 'No conversations found'
        });
    }
});

// Get messages for conversation (simple version)
router.get('/conversation/:conversationId/messages', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.UserID;

        console.log('🔍 Get conversation messages - ConversationID:', conversationId, 'UserID:', userId);

        // Simple messages query
        const result = await pool.request()
            .input('conversationId', conversationId)
            .query(`
                SELECT TOP 50
                    m.MessageID,
                    m.SenderID,
                    m.ReceiverID,
                    m.Content,
                    m.MessageType,
                    m.CreatedAt,
                    u.FirstName + ' ' + u.LastName as SenderName,
                    u.Role as SenderRole
                FROM Messages m
                INNER JOIN Users u ON m.SenderID = u.UserID
                INNER JOIN Conversations c ON 
                    (m.SenderID = c.CoachID AND m.ReceiverID = c.MemberID) OR
                    (m.SenderID = c.MemberID AND m.ReceiverID = c.CoachID)
                WHERE c.ConversationID = @conversationId
                ORDER BY m.CreatedAt ASC
            `);

        res.json({
            success: true,
            data: result.recordset || []
        });

    } catch (error) {
        console.error('Error loading conversation messages:', error);
        res.json({
            success: true,
            data: [],
            message: 'No messages found'
        });
    }
});

// Send message (simple version)
router.post('/conversation/:conversationId/send', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content } = req.body;
        const senderId = req.user.UserID;

        console.log('🔍 Send message - ConversationID:', conversationId, 'UserID:', senderId);

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }

        // Get conversation info
        const conversation = await pool.request()
            .input('conversationId', conversationId)
            .query(`
                SELECT CoachID, MemberID FROM Conversations 
                WHERE ConversationID = @conversationId
            `);

        if (conversation.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        const conv = conversation.recordset[0];
        const receiverId = senderId === conv.CoachID ? conv.MemberID : conv.CoachID;

        // Insert message
        const messageResult = await pool.request()
            .input('senderId', senderId)
            .input('receiverId', receiverId)
            .input('content', content)
            .query(`
                INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType)
                OUTPUT INSERTED.MessageID, INSERTED.CreatedAt
                VALUES (@senderId, @receiverId, @content, 'text')
            `);

        const messageId = messageResult.recordset[0].MessageID;

        // Update conversation
        await pool.request()
            .input('messageId', messageId)
            .input('conversationId', conversationId)
            .query(`
                UPDATE Conversations 
                SET LastMessageID = @messageId, LastMessageAt = GETDATE()
                WHERE ConversationID = @conversationId
            `);

        // Get the created message
        const messageInfo = await pool.request()
            .input('messageId', messageId)
            .query(`
                SELECT 
                    m.MessageID,
                    m.SenderID,
                    m.ReceiverID,
                    m.Content,
                    m.MessageType,
                    m.CreatedAt,
                    u.FirstName + ' ' + u.LastName as SenderName,
                    u.Role as SenderRole
                FROM Messages m
                INNER JOIN Users u ON m.SenderID = u.UserID
                WHERE m.MessageID = @messageId
            `);

        res.json({
            success: true,
            message: 'Message sent successfully',
            data: messageInfo.recordset[0]
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
});

// Member messages (simple version)
router.get('/member/messages', authenticateToken, async (req, res) => {
    try {
        const memberId = req.user.UserID;
        console.log('🔍 Member messages - UserID:', memberId, 'User:', req.user);

        // Find or create conversation with a coach
        let conversation = await pool.request()
            .input('memberId', memberId)
            .query(`
                SELECT TOP 1 ConversationID, CoachID 
                FROM Conversations 
                WHERE MemberID = @memberId
                ORDER BY LastMessageAt DESC
            `);

        let conversationId, coachId;

        if (conversation.recordset.length === 0) {
            // Find first available coach
            const coach = await pool.request().query(`
                SELECT TOP 1 UserID FROM Users 
                WHERE Role = 'coach' AND IsActive = 1
                ORDER BY UserID
            `);

            if (coach.recordset.length === 0) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'No coaches available'
                });
            }

            coachId = coach.recordset[0].UserID;

            // Create conversation
            const newConv = await pool.request()
                .input('coachId', coachId)
                .input('memberId', memberId)
                .query(`
                    INSERT INTO Conversations (CoachID, MemberID, LastMessageAt)
                    OUTPUT INSERTED.ConversationID
                    VALUES (@coachId, @memberId, GETDATE())
                `);

            conversationId = newConv.recordset[0].ConversationID;
        } else {
            conversationId = conversation.recordset[0].ConversationID;
            coachId = conversation.recordset[0].CoachID;
        }

        // Get messages
        console.log('🔍 Getting messages for conversation:', { conversationId, coachId, memberId });

        const messages = await pool.request()
            .input('coachId', coachId)
            .input('memberId', memberId)
            .query(`
                SELECT TOP 50
                    m.MessageID,
                    m.SenderID,
                    m.ReceiverID,
                    m.Content,
                    m.MessageType,
                    m.CreatedAt,
                    u.FirstName + ' ' + u.LastName as SenderName,
                    u.Role as SenderRole
                FROM Messages m
                INNER JOIN Users u ON m.SenderID = u.UserID
                WHERE (m.SenderID = @coachId AND m.ReceiverID = @memberId)
                   OR (m.SenderID = @memberId AND m.ReceiverID = @coachId)
                ORDER BY m.CreatedAt ASC
            `);

        console.log('🔍 Found messages:', messages.recordset.length);

        res.json({
            success: true,
            data: messages.recordset || []
        });

    } catch (error) {
        console.error('Error loading member messages:', error);
        res.json({
            success: true,
            data: [],
            message: 'No messages found'
        });
    }
});

// Send message for member/coach
router.post('/coach/chat/send', authenticateToken, async (req, res) => {
    try {
        const { content, memberId } = req.body;
        const senderId = req.user.UserID;
        const userRole = req.user.Role;

        console.log('🔍 Send message - UserID:', senderId, 'Role:', userRole);

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }

        let receiverId;

        if (userRole === 'member') {
            // Member sends to coach - find their coach
            const conversation = await pool.request()
                .input('memberId', senderId)
                .query(`
                    SELECT TOP 1 CoachID FROM Conversations 
                    WHERE MemberID = @memberId
                    ORDER BY LastMessageAt DESC
                `);

            if (conversation.recordset.length === 0) {
                // Find first available coach
                const coach = await pool.request().query(`
                    SELECT TOP 1 UserID FROM Users 
                    WHERE Role = 'coach' AND IsActive = 1
                    ORDER BY UserID
                `);

                if (coach.recordset.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'No coaches available'
                    });
                }

                receiverId = coach.recordset[0].UserID;

                // Create conversation
                await pool.request()
                    .input('coachId', receiverId)
                    .input('memberId', senderId)
                    .query(`
                        INSERT INTO Conversations (CoachID, MemberID, LastMessageAt)
                        VALUES (@coachId, @memberId, GETDATE())
                    `);
            } else {
                receiverId = conversation.recordset[0].CoachID;
            }
        } else if (userRole === 'coach') {
            if (!memberId) {
                return res.status(400).json({
                    success: false,
                    message: 'Member ID is required for coach'
                });
            }
            receiverId = memberId;
        } else {
            return res.status(403).json({
                success: false,
                message: 'Only members and coaches can send messages'
            });
        }

        // Insert message
        const messageResult = await pool.request()
            .input('senderId', senderId)
            .input('receiverId', receiverId)
            .input('content', content)
            .query(`
                INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType)
                OUTPUT INSERTED.MessageID, INSERTED.CreatedAt
                VALUES (@senderId, @receiverId, @content, 'text')
            `);

        const messageId = messageResult.recordset[0].MessageID;

        // Update or create conversation
        const coachId = userRole === 'coach' ? senderId : receiverId;
        const memberIdForConv = userRole === 'member' ? senderId : receiverId;

        const existingConv = await pool.request()
            .input('coachId', coachId)
            .input('memberId', memberIdForConv)
            .query(`
                SELECT ConversationID FROM Conversations 
                WHERE CoachID = @coachId AND MemberID = @memberId
            `);

        if (existingConv.recordset.length === 0) {
            await pool.request()
                .input('coachId', coachId)
                .input('memberId', memberIdForConv)
                .input('messageId', messageId)
                .query(`
                    INSERT INTO Conversations (CoachID, MemberID, LastMessageID, LastMessageAt)
                    VALUES (@coachId, @memberId, @messageId, GETDATE())
                `);
        } else {
            await pool.request()
                .input('messageId', messageId)
                .input('conversationId', existingConv.recordset[0].ConversationID)
                .query(`
                    UPDATE Conversations 
                    SET LastMessageID = @messageId, LastMessageAt = GETDATE()
                    WHERE ConversationID = @conversationId
                `);
        }

        // Get the created message
        const messageInfo = await pool.request()
            .input('messageId', messageId)
            .query(`
                SELECT 
                    m.MessageID,
                    m.SenderID,
                    m.ReceiverID,
                    m.Content,
                    m.MessageType,
                    m.CreatedAt,
                    u.FirstName + ' ' + u.LastName as SenderName,
                    u.Role as SenderRole
                FROM Messages m
                INNER JOIN Users u ON m.SenderID = u.UserID
                WHERE m.MessageID = @messageId
            `);

        res.json({
            success: true,
            message: 'Message sent successfully',
            data: messageInfo.recordset[0]
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
});

// Fix member coach endpoint (for compatibility)
router.post('/fix-member-coach', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.UserID;
        console.log('🔧 Fix member coach - UserID:', userId);

        // Find or create conversation with first available coach
        const coach = await pool.request().query(`
            SELECT TOP 1 UserID FROM Users 
            WHERE Role = 'coach' AND IsActive = 1
            ORDER BY UserID
        `);

        if (coach.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No coaches available'
            });
        }

        const coachId = coach.recordset[0].UserID;

        // Check if conversation exists
        let conversation = await pool.request()
            .input('coachId', coachId)
            .input('memberId', userId)
            .query(`
                SELECT ConversationID FROM Conversations 
                WHERE CoachID = @coachId AND MemberID = @memberId
            `);

        if (conversation.recordset.length === 0) {
            // Create conversation
            await pool.request()
                .input('coachId', coachId)
                .input('memberId', userId)
                .query(`
                    INSERT INTO Conversations (CoachID, MemberID, LastMessageAt)
                    VALUES (@coachId, @memberId, GETDATE())
                `);
        }

        res.json({
            success: true,
            message: 'Member-coach relationship fixed',
            coachId: coachId
        });

    } catch (error) {
        console.error('Error fixing member coach:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fix member coach relationship',
            error: error.message
        });
    }
});

// Coach members endpoint (for compatibility)
router.get('/coach/members', authenticateToken, async (req, res) => {
    try {
        const coachId = req.user.UserID;
        console.log('🔍 Coach members - CoachID:', coachId);

        const result = await pool.request()
            .input('coachId', coachId)
            .query(`
                SELECT DISTINCT
                    u.UserID,
                    u.FirstName + ' ' + u.LastName as FullName,
                    u.Email,
                    u.Avatar,
                    c.ConversationID,
                    c.LastMessageAt
                FROM Users u
                INNER JOIN Conversations c ON u.UserID = c.MemberID
                WHERE c.CoachID = @coachId
                ORDER BY c.LastMessageAt DESC
            `);

        res.json({
            success: true,
            data: result.recordset || []
        });

    } catch (error) {
        console.error('Error loading coach members:', error);
        res.json({
            success: true,
            data: [],
            message: 'No members found'
        });
    }
});

// Start conversation endpoint (for compatibility)
router.post('/coach/start-conversation', authenticateToken, async (req, res) => {
    try {
        const { memberId } = req.body;
        const coachId = req.user.UserID;

        console.log('🔍 Start conversation - CoachID:', coachId, 'MemberID:', memberId);

        if (!memberId) {
            return res.status(400).json({
                success: false,
                message: 'Member ID is required'
            });
        }

        // Check if conversation exists
        let conversation = await pool.request()
            .input('coachId', coachId)
            .input('memberId', memberId)
            .query(`
                SELECT ConversationID FROM Conversations 
                WHERE CoachID = @coachId AND MemberID = @memberId
            `);

        let conversationId;

        if (conversation.recordset.length === 0) {
            // Create conversation
            const newConv = await pool.request()
                .input('coachId', coachId)
                .input('memberId', memberId)
                .query(`
                    INSERT INTO Conversations (CoachID, MemberID, LastMessageAt)
                    OUTPUT INSERTED.ConversationID
                    VALUES (@coachId, @memberId, GETDATE())
                `);

            conversationId = newConv.recordset[0].ConversationID;
        } else {
            conversationId = conversation.recordset[0].ConversationID;
        }

        res.json({
            success: true,
            message: 'Conversation started successfully',
            data: {
                conversationId: conversationId,
                coachId: coachId,
                memberId: memberId
            }
        });

    } catch (error) {
        console.error('Error starting conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start conversation',
            error: error.message
        });
    }
});

module.exports = router; 