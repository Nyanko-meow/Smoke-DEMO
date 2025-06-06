-- Quick setup for chat testing
USE SMOKEKING;

-- 1. Ensure member exists (UserID = 2)
IF NOT EXISTS (SELECT 1 FROM Users WHERE UserID = 2)
BEGIN
    INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified)
    VALUES ('member@example.com', 'H12345678@', 'Member', 'User', 'member', 1, 1);
END

-- 2. Ensure coach exists (UserID = 3)  
IF NOT EXISTS (SELECT 1 FROM Users WHERE UserID = 3)
BEGIN
    INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified)
    VALUES ('coach@example.com', 'H12345678@', 'Coach', 'Smith', 'coach', 1, 1);
END

-- 3. Create or update QuitPlan for member with coach assigned
IF NOT EXISTS (SELECT 1 FROM QuitPlans WHERE UserID = 2 AND Status = 'active')
BEGIN
    INSERT INTO QuitPlans (UserID, CoachID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status)
    VALUES (
        2, 
        3, 
        GETDATE(), 
        DATEADD(DAY, 90, GETDATE()),
        N'Cải thiện sức khỏe và chất lượng cuộc sống',
        8,
        N'Kế hoạch cai thuốc 90 ngày với sự hỗ trợ từ coach chuyên nghiệp',
        'active'
    );
END
ELSE
BEGIN
    UPDATE QuitPlans 
    SET CoachID = 3, Status = 'active'
    WHERE UserID = 2;
END

-- 4. Create conversation if not exists
IF NOT EXISTS (SELECT 1 FROM Conversations WHERE CoachID = 3 AND MemberID = 2)
BEGIN
    INSERT INTO Conversations (CoachID, MemberID, LastMessageAt, IsActive)
    VALUES (3, 2, GETDATE(), 1);
END

-- 5. Create test messages if not exists
IF NOT EXISTS (SELECT 1 FROM Messages WHERE (SenderID = 2 AND ReceiverID = 3) OR (SenderID = 3 AND ReceiverID = 2))
BEGIN
    -- Coach welcome message
    INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
    VALUES (
        3, 
        2, 
        N'Xin chào! Tôi là coach của bạn. Tôi rất vui được hỗ trợ bạn trong hành trình cai thuốc. Bạn có thể chia sẻ với tôi về tình trạng hiện tại của bạn không?', 
        'text', 
        0
    );
    
    -- Member response
    INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
    VALUES (
        2, 
        3, 
        N'Chào coach! Em cảm thấy còn khó khăn trong việc kiểm soát cơn thèm thuốc. Em có thể nhờ coach tư vấn thêm không ạ?', 
        'text', 
        1
    );
END

-- 6. Verify setup
SELECT 
    'Setup verification' as Status,
    qp.PlanID,
    qp.UserID,
    qp.CoachID,
    qp.Status,
    u1.Email as MemberEmail,
    u1.Role as MemberRole,
    u2.Email as CoachEmail,
    u2.Role as CoachRole
FROM QuitPlans qp
INNER JOIN Users u1 ON qp.UserID = u1.UserID
INNER JOIN Users u2 ON qp.CoachID = u2.UserID
WHERE qp.UserID = 2 AND qp.Status = 'active';

-- Show conversations
SELECT 
    'Conversations' as Type,
    c.ConversationID,
    c.CoachID,
    c.MemberID,
    c.IsActive,
    u1.Email as CoachEmail,
    u2.Email as MemberEmail
FROM Conversations c
INNER JOIN Users u1 ON c.CoachID = u1.UserID
INNER JOIN Users u2 ON c.MemberID = u2.UserID
WHERE c.CoachID = 3 AND c.MemberID = 2;

-- Show messages
SELECT 
    'Messages' as Type,
    m.MessageID,
    m.SenderID,
    m.ReceiverID,
    m.Content,
    m.CreatedAt,
    u.Email as SenderEmail
FROM Messages m
INNER JOIN Users u ON m.SenderID = u.UserID
WHERE (m.SenderID = 2 AND m.ReceiverID = 3) OR (m.SenderID = 3 AND m.ReceiverID = 2)
ORDER BY m.CreatedAt; 