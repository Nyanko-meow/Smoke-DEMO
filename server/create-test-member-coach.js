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

async function createTestMemberCoach() {
    try {
        console.log('🔧 Creating test member-coach relationship...');

        // Connect to database
        await sql.connect(config);

        // 1. Check if member exists (UserID = 2)
        const memberCheck = await sql.query`
            SELECT UserID, Email, Role FROM Users WHERE UserID = 2
        `;

        if (memberCheck.recordset.length === 0) {
            console.log('❌ Member with UserID = 2 not found');
            return;
        }

        console.log('✅ Member found:', memberCheck.recordset[0]);

        // 2. Check if coach exists (UserID = 3)
        const coachCheck = await sql.query`
            SELECT UserID, Email, Role FROM Users WHERE UserID = 3
        `;

        if (coachCheck.recordset.length === 0) {
            console.log('❌ Coach with UserID = 3 not found');
            return;
        }

        console.log('✅ Coach found:', coachCheck.recordset[0]);

        // 3. Check if QuitPlan exists for member
        const quitPlanCheck = await sql.query`
            SELECT PlanID, UserID, CoachID, Status FROM QuitPlans WHERE UserID = 2
        `;

        if (quitPlanCheck.recordset.length === 0) {
            // Create QuitPlan for member
            console.log('📝 Creating QuitPlan for member...');

            const startDate = new Date();
            const targetDate = new Date();
            targetDate.setDate(startDate.getDate() + 90); // 90 days plan

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

            console.log('✅ QuitPlan created successfully');
        } else {
            // Update existing QuitPlan to assign coach
            console.log('📝 Updating existing QuitPlan...');

            await sql.query`
                UPDATE QuitPlans 
                SET CoachID = 3, Status = 'active'
                WHERE UserID = 2
            `;

            console.log('✅ QuitPlan updated successfully');
        }

        // 4. Verify the setup
        const verifyResult = await sql.query`
            SELECT 
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
            WHERE qp.UserID = 2 AND qp.Status = 'active'
        `;

        if (verifyResult.recordset.length > 0) {
            console.log('🎉 Setup verified successfully:');
            console.log(verifyResult.recordset[0]);
        } else {
            console.log('❌ Setup verification failed');
        }

        // 5. Create a test conversation if not exists
        const conversationCheck = await sql.query`
            SELECT ConversationID FROM Conversations WHERE CoachID = 3 AND MemberID = 2
        `;

        if (conversationCheck.recordset.length === 0) {
            console.log('📝 Creating test conversation...');

            await sql.query`
                INSERT INTO Conversations (CoachID, MemberID, LastMessageAt, IsActive)
                VALUES (3, 2, GETDATE(), 1)
            `;

            console.log('✅ Test conversation created');
        } else {
            console.log('✅ Conversation already exists');
        }

        // 6. Create some test messages
        const messageCheck = await sql.query`
            SELECT COUNT(*) as count FROM Messages 
            WHERE (SenderID = 2 AND ReceiverID = 3) OR (SenderID = 3 AND ReceiverID = 2)
        `;

        if (messageCheck.recordset[0].count === 0) {
            console.log('📝 Creating test messages...');

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
            console.log('✅ Test messages already exist');
        }

        console.log('\n🎉 Test member-coach setup completed successfully!');
        console.log('You can now test the chat functionality.');

    } catch (error) {
        console.error('❌ Error creating test data:', error);
    } finally {
        await sql.close();
    }
}

// Run the setup
createTestMemberCoach(); 