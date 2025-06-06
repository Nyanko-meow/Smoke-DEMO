const sql = require('mssql');

// Database configuration
const config = {
    user: 'sa',
    password: 'Anhquan123@',
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function fixChatError() {
    try {
        console.log('🔧 Fixing chat error...\n');

        // Connect to database
        await sql.connect(config);

        // 1. Check if member exists (UserID = 2)
        console.log('1. Checking member...');
        const memberCheck = await sql.query`
            SELECT UserID, Email, Role, IsActive FROM Users WHERE UserID = 2
        `;

        if (memberCheck.recordset.length === 0) {
            console.log('❌ Member not found, creating...');
            await sql.query`
                INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified)
                VALUES ('member@example.com', 'H12345678@', 'Member', 'User', 'member', 1, 1)
            `;
            console.log('✅ Member created');
        } else {
            console.log('✅ Member found:', memberCheck.recordset[0]);
        }

        // 2. Check if coach exists (UserID = 3)
        console.log('\n2. Checking coach...');
        const coachCheck = await sql.query`
            SELECT UserID, Email, Role, IsActive FROM Users WHERE UserID = 3
        `;

        if (coachCheck.recordset.length === 0) {
            console.log('❌ Coach not found, creating...');
            await sql.query`
                INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified)
                VALUES ('coach@example.com', 'H12345678@', 'Coach', 'Smith', 'coach', 1, 1)
            `;
            console.log('✅ Coach created');
        } else {
            console.log('✅ Coach found:', coachCheck.recordset[0]);
        }

        // 3. Check and create QuitPlan
        console.log('\n3. Checking QuitPlan...');
        const quitPlanCheck = await sql.query`
            SELECT PlanID, UserID, CoachID, Status FROM QuitPlans WHERE UserID = 2
        `;

        if (quitPlanCheck.recordset.length === 0) {
            console.log('❌ QuitPlan not found, creating...');
            const startDate = new Date();
            const targetDate = new Date();
            targetDate.setDate(startDate.getDate() + 90);

            await sql.query`
                INSERT INTO QuitPlans (UserID, CoachID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status)
                VALUES (
                    2, 
                    3, 
                    ${startDate}, 
                    ${targetDate},
                    N'Cải thiện sức khỏe và chất lượng cuộc sống',
                    8,
                    N'Kế hoạch cai thuốc 90 ngày với sự hỗ trợ từ coach chuyên nghiệp',
                    'active'
                )
            `;
            console.log('✅ QuitPlan created');
        } else {
            // Update existing plan to assign coach
            await sql.query`
                UPDATE QuitPlans 
                SET CoachID = 3, Status = 'active'
                WHERE UserID = 2
            `;
            console.log('✅ QuitPlan updated:', quitPlanCheck.recordset[0]);
        }

        // 4. Check and create Conversation
        console.log('\n4. Checking Conversation...');
        const conversationCheck = await sql.query`
            SELECT ConversationID, CoachID, MemberID FROM Conversations WHERE CoachID = 3 AND MemberID = 2
        `;

        if (conversationCheck.recordset.length === 0) {
            console.log('❌ Conversation not found, creating...');
            await sql.query`
                INSERT INTO Conversations (CoachID, MemberID, LastMessageAt, IsActive)
                VALUES (3, 2, GETDATE(), 1)
            `;
            console.log('✅ Conversation created');
        } else {
            console.log('✅ Conversation found:', conversationCheck.recordset[0]);
        }

        // 5. Create test messages if not exist
        console.log('\n5. Checking Messages...');
        const messageCheck = await sql.query`
            SELECT COUNT(*) as count FROM Messages 
            WHERE (SenderID = 2 AND ReceiverID = 3) OR (SenderID = 3 AND ReceiverID = 2)
        `;

        if (messageCheck.recordset[0].count === 0) {
            console.log('❌ No messages found, creating test messages...');

            // Coach welcome message
            await sql.query`
                INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
                VALUES (
                    3, 
                    2, 
                    N'Xin chào! Tôi là coach của bạn. Tôi rất vui được hỗ trợ bạn trong hành trình cai thuốc. Bạn có thể chia sẻ với tôi về tình trạng hiện tại của bạn không?', 
                    'text', 
                    0
                )
            `;

            // Member response
            await sql.query`
                INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
                VALUES (
                    2, 
                    3, 
                    N'Chào coach! Em cảm thấy còn khó khăn trong việc kiểm soát cơn thèm thuốc. Em có thể nhờ coach tư vấn thêm không ạ?', 
                    'text', 
                    1
                )
            `;

            console.log('✅ Test messages created');
        } else {
            console.log('✅ Messages exist:', messageCheck.recordset[0].count, 'messages');
        }

        // 6. Verify the complete setup
        console.log('\n6. Final verification...');
        const verifyResult = await sql.query`
            SELECT 
                qp.PlanID,
                qp.UserID,
                qp.CoachID,
                qp.Status as PlanStatus,
                u1.Email as MemberEmail,
                u1.Role as MemberRole,
                u2.Email as CoachEmail,
                u2.Role as CoachRole,
                c.ConversationID,
                (SELECT COUNT(*) FROM Messages WHERE (SenderID = qp.UserID AND ReceiverID = qp.CoachID) OR (SenderID = qp.CoachID AND ReceiverID = qp.UserID)) as MessageCount
            FROM QuitPlans qp
            INNER JOIN Users u1 ON qp.UserID = u1.UserID
            INNER JOIN Users u2 ON qp.CoachID = u2.UserID
            LEFT JOIN Conversations c ON c.CoachID = qp.CoachID AND c.MemberID = qp.UserID
            WHERE qp.UserID = 2 AND qp.Status = 'active'
        `;

        if (verifyResult.recordset.length > 0) {
            console.log('🎉 Setup verified successfully:');
            console.table(verifyResult.recordset[0]);
        } else {
            console.log('❌ Setup verification failed');
        }

        console.log('\n✅ Chat error fix completed!');
        console.log('Now you can test the chat functionality with:');
        console.log('- Member: member@example.com / 12345678@');
        console.log('- Coach: coach@example.com / 12345678@');

    } catch (error) {
        console.error('❌ Error fixing chat:', error);
    } finally {
        await sql.close();
    }
}

// Run the fix
fixChatError(); 