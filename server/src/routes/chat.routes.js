const express = require('express');
const sql = require('mssql');
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

// Test route for debugging authorization
router.get('/test-coach-auth', authenticateToken, authorizeRole(['coach']), (req, res) => {
    console.log('🧪 Test coach auth route - req.user:', req.user);
    res.json({
        success: true,
        message: 'Coach authorization works',
        user: req.user
    });
});

// Lấy danh sách conversations của coach
router.get('/coach/conversations', authenticateToken, debugMiddleware, authorizeRole(['coach']), async (req, res) => {
    try {
        console.log('🎯 Inside /coach/conversations handler');
        const coachId = req.user.UserID;

        const result = await sql.query`
            SELECT 
                c.ConversationID,
                c.MemberID,
                u.FirstName + ' ' + u.LastName as MemberName,
                u.Avatar as MemberAvatar,
                u.Email as MemberEmail,
                c.LastMessageAt,
                m.Content as LastMessageContent,
                m.SenderID as LastMessageSenderID,
                (SELECT COUNT(*) FROM Messages WHERE ReceiverID = ${coachId} AND SenderID = c.MemberID AND IsRead = 0) as UnreadCount
            FROM Conversations c
            INNER JOIN Users u ON c.MemberID = u.UserID
            LEFT JOIN Messages m ON c.LastMessageID = m.MessageID
            WHERE c.CoachID = ${coachId} AND c.IsActive = 1
            ORDER BY c.LastMessageAt DESC
        `;

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error loading coach conversations:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách cuộc trò chuyện'
        });
    }
});

// Lấy conversation của member với coach
router.get('/member/conversation', authenticateToken, authorizeRole(['member']), async (req, res) => {
    try {
        const memberId = req.user.UserID;

        // Tìm coach được assign cho member này (thông qua QuitPlans)
        const coachResult = await sql.query`
            SELECT TOP 1 CoachID
            FROM QuitPlans 
            WHERE UserID = ${memberId} AND CoachID IS NOT NULL AND Status = 'active'
            ORDER BY CreatedAt DESC
        `;

        if (coachResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bạn chưa được assign coach hoặc chưa có kế hoạch cai thuốc active'
            });
        }

        const coachId = coachResult.recordset[0].CoachID;

        // Tìm hoặc tạo conversation
        let conversation = await sql.query`
            SELECT ConversationID, CoachID, MemberID
            FROM Conversations 
            WHERE CoachID = ${coachId} AND MemberID = ${memberId}
        `;

        if (conversation.recordset.length === 0) {
            // Tạo conversation mới
            await sql.query`
                INSERT INTO Conversations (CoachID, MemberID, LastMessageAt)
                VALUES (${coachId}, ${memberId}, GETDATE())
            `;

            conversation = await sql.query`
                SELECT ConversationID, CoachID, MemberID
                FROM Conversations 
                WHERE CoachID = ${coachId} AND MemberID = ${memberId}
            `;
        }

        // Lấy thông tin coach
        const coachInfo = await sql.query`
            SELECT UserID, FirstName + ' ' + LastName as FullName, Avatar, Email
            FROM Users 
            WHERE UserID = ${coachId}
        `;

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
            message: 'Lỗi khi tải cuộc trò chuyện'
        });
    }
});

// Lấy tin nhắn trong conversation
router.get('/conversation/:conversationId/messages', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.UserID;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        // Kiểm tra quyền truy cập conversation
        const conversationCheck = await sql.query`
            SELECT * FROM Conversations 
            WHERE ConversationID = ${conversationId} 
            AND (CoachID = ${userId} OR MemberID = ${userId})
        `;

        if (conversationCheck.recordset.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập cuộc trò chuyện này'
            });
        }

        const result = await sql.query`
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
            WHERE (m.SenderID = ${conversationCheck.recordset[0].CoachID} AND m.ReceiverID = ${conversationCheck.recordset[0].MemberID})
               OR (m.SenderID = ${conversationCheck.recordset[0].MemberID} AND m.ReceiverID = ${conversationCheck.recordset[0].CoachID})
            ORDER BY m.CreatedAt DESC
            OFFSET ${offset} ROWS
            FETCH NEXT ${limit} ROWS ONLY
        `;

        // Đánh dấu tin nhắn đã đọc
        await sql.query`
            UPDATE Messages 
            SET IsRead = 1 
            WHERE ReceiverID = ${userId} 
            AND ((SenderID = ${conversationCheck.recordset[0].CoachID} AND ReceiverID = ${conversationCheck.recordset[0].MemberID})
                OR (SenderID = ${conversationCheck.recordset[0].MemberID} AND ReceiverID = ${conversationCheck.recordset[0].CoachID}))
            AND IsRead = 0
        `;

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
        console.error('Error loading messages:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải tin nhắn'
        });
    }
});

// Gửi tin nhắn
router.post('/send', authenticateToken, async (req, res) => {
    try {
        const { receiverId, content, messageType = 'text', relatedPlanId = null } = req.body;
        const senderId = req.user.UserID;

        if (!receiverId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin người nhận hoặc nội dung tin nhắn'
            });
        }

        // Kiểm tra người nhận tồn tại
        const receiverCheck = await sql.query`
            SELECT UserID, Role FROM Users WHERE UserID = ${receiverId}
        `;

        if (receiverCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Người nhận không tồn tại'
            });
        }

        // Kiểm tra quyền chat (coach chỉ chat với member của mình, member chỉ chat với coach)
        const userRole = req.user.Role;
        const receiverRole = receiverCheck.recordset[0].Role;

        if (userRole === 'coach' && receiverRole !== 'member') {
            return res.status(403).json({
                success: false,
                message: 'Coach chỉ có thể chat với member'
            });
        }

        if (userRole === 'member' && receiverRole !== 'coach') {
            return res.status(403).json({
                success: false,
                message: 'Member chỉ có thể chat với coach'
            });
        }

        // Nếu là member gửi cho coach, kiểm tra xem coach có được assign không
        if (userRole === 'member') {
            const assignCheck = await sql.query`
                SELECT COUNT(*) as count
                FROM QuitPlans 
                WHERE UserID = ${senderId} AND CoachID = ${receiverId} AND Status = 'active'
            `;

            if (assignCheck.recordset[0].count === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có thể chat với coach được assign cho bạn'
                });
            }
        }

        // Tạo tin nhắn
        const messageResult = await sql.query`
            INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, RelatedPlanID)
            OUTPUT INSERTED.MessageID, INSERTED.CreatedAt
            VALUES (${senderId}, ${receiverId}, ${content}, ${messageType}, ${relatedPlanId})
        `;

        const messageId = messageResult.recordset[0].MessageID;
        const createdAt = messageResult.recordset[0].CreatedAt;

        // Tìm hoặc tạo conversation
        const coachId = userRole === 'coach' ? senderId : receiverId;
        const memberId = userRole === 'member' ? senderId : receiverId;

        let conversation = await sql.query`
            SELECT ConversationID FROM Conversations 
            WHERE CoachID = ${coachId} AND MemberID = ${memberId}
        `;

        if (conversation.recordset.length === 0) {
            await sql.query`
                INSERT INTO Conversations (CoachID, MemberID, LastMessageID, LastMessageAt)
                VALUES (${coachId}, ${memberId}, ${messageId}, ${createdAt})
            `;
        } else {
            await sql.query`
                UPDATE Conversations 
                SET LastMessageID = ${messageId}, LastMessageAt = ${createdAt}
                WHERE ConversationID = ${conversation.recordset[0].ConversationID}
            `;
        }

        // Lấy thông tin tin nhắn vừa gửi để trả về
        const messageInfo = await sql.query`
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
            WHERE m.MessageID = ${messageId}
        `;

        res.json({
            success: true,
            message: 'Tin nhắn đã được gửi',
            data: messageInfo.recordset[0]
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gửi tin nhắn'
        });
    }
});

// Đánh dấu tin nhắn đã đọc
router.put('/messages/:messageId/read', authenticateToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.UserID;

        await sql.query`
            UPDATE Messages 
            SET IsRead = 1 
            WHERE MessageID = ${messageId} AND ReceiverID = ${userId}
        `;

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

        const result = await sql.query`
            SELECT COUNT(*) as unreadCount
            FROM Messages 
            WHERE ReceiverID = ${userId} AND IsRead = 0
        `;

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

// API cho coach cập nhật kế hoạch cai thuốc của member
router.put('/coach/member/:memberId/plan/:planId', authenticateToken, authorizeRole(['coach']), async (req, res) => {
    try {
        const { memberId, planId } = req.params;
        const { reason, detailedPlan, motivationLevel, targetDate } = req.body;
        const coachId = req.user.UserID;

        // Kiểm tra quyền sửa kế hoạch
        const planCheck = await sql.query`
            SELECT * FROM QuitPlans 
            WHERE PlanID = ${planId} AND UserID = ${memberId} AND CoachID = ${coachId}
        `;

        if (planCheck.recordset.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền chỉnh sửa kế hoạch này'
            });
        }

        // Cập nhật kế hoạch
        await sql.query`
            UPDATE QuitPlans 
            SET Reason = ${reason},
                DetailedPlan = ${detailedPlan},
                MotivationLevel = ${motivationLevel},
                TargetDate = ${targetDate}
            WHERE PlanID = ${planId}
        `;

        // Gửi tin nhắn thông báo về việc cập nhật kế hoạch
        const notificationContent = `Coach đã cập nhật kế hoạch cai thuốc của bạn. Vui lòng kiểm tra lại kế hoạch mới.`;

        await sql.query`
            INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, RelatedPlanID)
            VALUES (${coachId}, ${memberId}, ${notificationContent}, 'plan_update', ${planId})
        `;

        res.json({
            success: true,
            message: 'Kế hoạch đã được cập nhật và thông báo đã được gửi'
        });

    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật kế hoạch'
        });
    }
});

// Lấy danh sách tất cả members cho coach để tạo conversation mới
router.get('/coach/members', authenticateToken, debugMiddleware, authorizeRole(['coach']), async (req, res) => {
    try {
        console.log('🎯 Inside /coach/members handler');
        const coachId = req.user.UserID;

        // Lấy tất cả members và check conversation status
        const result = await sql.query`
            SELECT 
                u.UserID,
                u.FirstName + ' ' + u.LastName as FullName,
                u.Email,
                u.Avatar,
                u.Role,
                u.IsActive,
                qp.PlanID,
                qp.Status as QuitPlanStatus,
                c.ConversationID,
                CASE WHEN c.ConversationID IS NOT NULL THEN 1 ELSE 0 END as HasConversation
            FROM Users u
            LEFT JOIN QuitPlans qp ON u.UserID = qp.UserID AND qp.Status = 'active' AND qp.CoachID = ${coachId}
            LEFT JOIN Conversations c ON u.UserID = c.MemberID AND c.CoachID = ${coachId}
            WHERE u.Role IN ('member', 'guest') AND u.IsActive = 1
            ORDER BY u.FirstName, u.LastName
        `;

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error loading members:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách thành viên'
        });
    }
});

// Tạo conversation mới với member
router.post('/coach/start-conversation', authenticateToken, authorizeRole(['coach']), async (req, res) => {
    try {
        const { memberId } = req.body;
        const coachId = req.user.UserID;

        if (!memberId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin member ID'
            });
        }

        // Kiểm tra member tồn tại
        const memberCheck = await sql.query`
            SELECT UserID, FirstName, LastName, Email FROM Users 
            WHERE UserID = ${memberId} AND Role IN ('member', 'guest') AND IsActive = 1
        `;

        if (memberCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Thành viên không tồn tại'
            });
        }

        const member = memberCheck.recordset[0];

        // Kiểm tra conversation đã tồn tại chưa
        const existingConversation = await sql.query`
            SELECT ConversationID FROM Conversations 
            WHERE CoachID = ${coachId} AND MemberID = ${memberId}
        `;

        if (existingConversation.recordset.length > 0) {
            return res.json({
                success: true,
                message: 'Cuộc trò chuyện đã tồn tại',
                data: {
                    conversationId: existingConversation.recordset[0].ConversationID,
                    isNew: false
                }
            });
        }

        // Tạo conversation mới
        const conversationResult = await sql.query`
            INSERT INTO Conversations (CoachID, MemberID, LastMessageAt, IsActive)
            OUTPUT INSERTED.ConversationID
            VALUES (${coachId}, ${memberId}, GETDATE(), 1)
        `;

        const conversationId = conversationResult.recordset[0].ConversationID;

        // Tạo tin nhắn chào hỏi từ coach
        const welcomeMessage = await sql.query`
            INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
            OUTPUT INSERTED.MessageID, INSERTED.CreatedAt
            VALUES (
                ${coachId}, 
                ${memberId}, 
                N'Xin chào ${member.FirstName}! Tôi là coach của bạn. Tôi rất vui được hỗ trợ bạn trong hành trình cai thuốc. Bạn có thể chia sẻ với tôi về tình trạng hiện tại của bạn không?', 
                'text', 
                0
            )
        `;

        // Cập nhật conversation với tin nhắn đầu tiên
        await sql.query`
            UPDATE Conversations 
            SET LastMessageID = ${welcomeMessage.recordset[0].MessageID},
                LastMessageAt = ${welcomeMessage.recordset[0].CreatedAt}
            WHERE ConversationID = ${conversationId}
        `;

        // Tạo quit plan nếu chưa có
        const existingPlan = await sql.query`
            SELECT PlanID FROM QuitPlans 
            WHERE UserID = ${memberId} AND Status = 'active'
        `;

        if (existingPlan.recordset.length === 0) {
            const startDate = new Date();
            const targetDate = new Date();
            targetDate.setDate(startDate.getDate() + 90); // 90 days plan

            await sql.query`
                INSERT INTO QuitPlans (UserID, CoachID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status)
                VALUES (
                    ${memberId}, 
                    ${coachId}, 
                    ${startDate}, 
                    ${targetDate},
                    N'Cải thiện sức khỏe và chất lượng cuộc sống',
                    8,
                    N'Kế hoạch cai thuốc 90 ngày với sự hỗ trợ từ coach chuyên nghiệp',
                    'active'
                )
            `;
        } else {
            // Assign coach to existing plan if not assigned
            await sql.query`
                UPDATE QuitPlans 
                SET CoachID = ${coachId}
                WHERE UserID = ${memberId} AND Status = 'active' AND CoachID IS NULL
            `;
        }

        res.json({
            success: true,
            message: 'Cuộc trò chuyện đã được tạo thành công',
            data: {
                conversationId: conversationId,
                memberName: `${member.FirstName} ${member.LastName}`,
                memberEmail: member.Email,
                isNew: true
            }
        });

    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo cuộc trò chuyện'
        });
    }
});

// API đặt lịch tư vấn
router.post('/appointment', authenticateToken, async (req, res) => {
    try {
        const { receiverId, appointmentDate, duration = 30, type = 'chat', notes } = req.body;
        const userId = req.user.UserID;
        const userRole = req.user.Role;

        if (!receiverId || !appointmentDate) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin cần thiết'
            });
        }

        // Xác định coach và member
        let coachId, memberId;
        if (userRole === 'coach') {
            coachId = userId;
            memberId = receiverId;
        } else {
            coachId = receiverId;
            memberId = userId;
        }

        // Tạo cuộc hẹn
        const result = await sql.query`
            INSERT INTO ConsultationAppointments (CoachID, MemberID, AppointmentDate, Duration, Type, Notes)
            OUTPUT INSERTED.AppointmentID
            VALUES (${coachId}, ${memberId}, ${appointmentDate}, ${duration}, ${type}, ${notes})
        `;

        const appointmentId = result.recordset[0].AppointmentID;

        // Gửi tin nhắn thông báo
        const notificationContent = `${userRole === 'coach' ? 'Coach' : 'Member'} đã đặt lịch tư vấn ${type} vào ${new Date(appointmentDate).toLocaleString('vi-VN')}`;

        await sql.query`
            INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType)
            VALUES (${userId}, ${receiverId}, ${notificationContent}, 'text')
        `;

        res.json({
            success: true,
            message: 'Lịch tư vấn đã được đặt',
            data: { appointmentId }
        });

    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đặt lịch tư vấn'
        });
    }
});

// API lấy danh sách lịch tư vấn
router.get('/appointments', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.UserID;
        const userRole = req.user.Role;

        let query;
        if (userRole === 'coach') {
            query = sql.query`
                SELECT 
                    a.*,
                    u.FirstName + ' ' + u.LastName as MemberName,
                    u.Avatar as MemberAvatar
                FROM ConsultationAppointments a
                INNER JOIN Users u ON a.MemberID = u.UserID
                WHERE a.CoachID = ${userId}
                ORDER BY a.AppointmentDate DESC
            `;
        } else {
            query = sql.query`
                SELECT 
                    a.*,
                    u.FirstName + ' ' + u.LastName as CoachName,
                    u.Avatar as CoachAvatar
                FROM ConsultationAppointments a
                INNER JOIN Users u ON a.CoachID = u.UserID
                WHERE a.MemberID = ${userId}
                ORDER BY a.AppointmentDate DESC
            `;
        }

        const result = await query;

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error loading appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách lịch tư vấn'
        });
    }
});

module.exports = router; 