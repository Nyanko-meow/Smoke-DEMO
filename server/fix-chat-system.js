const sql = require('mssql');

const config = {
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    authentication: {
        type: 'default',
        options: {
            userName: 'sa',
            password: '12345'
        }
    }
};

async function fixChatSystem() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        console.log('🔄 Fixing chat system...');

        // 1. Check current users and their roles
        console.log('\n📊 Checking current users...');
        const users = await sql.query`
            SELECT UserID, Email, FirstName, LastName, Role, IsActive, EmailVerified
            FROM Users
            ORDER BY Role, UserID
        `;

        console.log('Current users:');
        users.recordset.forEach(user => {
            console.log(`   ${user.Role}: ${user.Email} (ID: ${user.UserID}) - Active: ${user.IsActive}, Verified: ${user.EmailVerified}`);
        });

        // 2. Get coach and members
        const coaches = users.recordset.filter(u => u.Role === 'coach');
        const members = users.recordset.filter(u => u.Role === 'member' || u.Role === 'guest');

        if (coaches.length === 0) {
            console.log('❌ No coaches found!');
            return;
        }

        if (members.length === 0) {
            console.log('❌ No members found!');
            return;
        }

        const coach = coaches[0]; // Use first coach
        console.log(`\n👨‍⚕️ Using coach: ${coach.Email} (ID: ${coach.UserID})`);

        // 3. Check and create active quit plans for members with coach assignment
        console.log('\n🎯 Creating quit plans for members...');

        for (const member of members) {
            // Check if member already has an active quit plan
            const existingPlan = await sql.query`
                SELECT PlanID FROM QuitPlans 
                WHERE UserID = ${member.UserID} AND Status = 'active'
            `;

            if (existingPlan.recordset.length === 0) {
                // Create new quit plan with coach assignment
                const startDate = new Date();
                const targetDate = new Date();
                targetDate.setDate(startDate.getDate() + 90); // 90 days plan

                await sql.query`
                    INSERT INTO QuitPlans (UserID, CoachID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status)
                    VALUES (
                        ${member.UserID}, 
                        ${coach.UserID}, 
                        ${startDate}, 
                        ${targetDate},
                        N'Cải thiện sức khỏe và tiết kiệm tiền',
                        8,
                        N'Kế hoạch cai thuốc được tư vấn bởi coach chuyên nghiệp',
                        'active'
                    )
                `;
                console.log(`   ✅ Created quit plan for ${member.Email} with coach assignment`);
            } else {
                // Update existing plan to assign coach if not assigned
                await sql.query`
                    UPDATE QuitPlans 
                    SET CoachID = ${coach.UserID}
                    WHERE UserID = ${member.UserID} AND Status = 'active' AND CoachID IS NULL
                `;
                console.log(`   ✅ Assigned coach to existing plan for ${member.Email}`);
            }
        }

        // 4. Create conversations between coach and members
        console.log('\n💬 Creating conversations...');

        for (const member of members) {
            // Check if conversation already exists
            const existingConversation = await sql.query`
                SELECT ConversationID FROM Conversations 
                WHERE CoachID = ${coach.UserID} AND MemberID = ${member.UserID}
            `;

            if (existingConversation.recordset.length === 0) {
                // Create new conversation
                await sql.query`
                    INSERT INTO Conversations (CoachID, MemberID, LastMessageAt, IsActive)
                    VALUES (${coach.UserID}, ${member.UserID}, GETDATE(), 1)
                `;
                console.log(`   ✅ Created conversation between coach and ${member.Email}`);

                // Create initial message from coach
                const conversationResult = await sql.query`
                    SELECT ConversationID FROM Conversations 
                    WHERE CoachID = ${coach.UserID} AND MemberID = ${member.UserID}
                `;

                const conversationId = conversationResult.recordset[0].ConversationID;

                const initialMessage = await sql.query`
                    INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
                    OUTPUT INSERTED.MessageID, INSERTED.CreatedAt
                    VALUES (
                        ${coach.UserID}, 
                        ${member.UserID}, 
                        N'Xin chào! Tôi là coach của bạn. Tôi sẽ hỗ trợ bạn trong quá trình cai thuốc. Bạn cảm thấy thế nào về kế hoạch hiện tại?', 
                        'text', 
                        0
                    )
                `;

                // Update conversation with last message
                await sql.query`
                    UPDATE Conversations 
                    SET LastMessageID = ${initialMessage.recordset[0].MessageID},
                        LastMessageAt = ${initialMessage.recordset[0].CreatedAt}
                    WHERE ConversationID = ${conversationId}
                `;

                console.log(`   ✅ Created initial message in conversation`);
            } else {
                console.log(`   ℹ️ Conversation already exists with ${member.Email}`);
            }
        }

        // 5. Verify chat system setup
        console.log('\n🔍 Verifying chat system setup...');

        // Check conversations
        const conversations = await sql.query`
            SELECT 
                c.ConversationID,
                c.CoachID,
                c.MemberID,
                coach.FirstName + ' ' + coach.LastName as CoachName,
                member.FirstName + ' ' + member.LastName as MemberName,
                c.LastMessageAt,
                m.Content as LastMessage
            FROM Conversations c
            INNER JOIN Users coach ON c.CoachID = coach.UserID
            INNER JOIN Users member ON c.MemberID = member.UserID
            LEFT JOIN Messages m ON c.LastMessageID = m.MessageID
            WHERE c.IsActive = 1
            ORDER BY c.LastMessageAt DESC
        `;

        console.log(`📊 Total active conversations: ${conversations.recordset.length}`);
        conversations.recordset.forEach(conv => {
            console.log(`   Conversation ${conv.ConversationID}: ${conv.CoachName} ↔ ${conv.MemberName}`);
            console.log(`      Last message: ${conv.LastMessage || 'No messages'}`);
        });

        // Check quit plans with coach assignments
        const quitPlans = await sql.query`
            SELECT 
                qp.PlanID,
                qp.UserID,
                qp.CoachID,
                member.FirstName + ' ' + member.LastName as MemberName,
                coach.FirstName + ' ' + coach.LastName as CoachName,
                qp.Status
            FROM QuitPlans qp
            INNER JOIN Users member ON qp.UserID = member.UserID
            LEFT JOIN Users coach ON qp.CoachID = coach.UserID
            WHERE qp.Status = 'active'
        `;

        console.log(`\n📋 Active quit plans: ${quitPlans.recordset.length}`);
        quitPlans.recordset.forEach(plan => {
            console.log(`   Plan ${plan.PlanID}: ${plan.MemberName} → Coach: ${plan.CoachName || 'Not assigned'}`);
        });

        // 6. Create sample progress data for testing
        console.log('\n📈 Creating sample progress data...');

        for (const member of members.slice(0, 2)) { // Just first 2 members
            // Check if progress data exists
            const existingProgress = await sql.query`
                SELECT COUNT(*) as Count FROM ProgressTracking WHERE UserID = ${member.UserID}
            `;

            if (existingProgress.recordset[0].Count === 0) {
                // Create sample progress for last 7 days
                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);

                    const cigarettesSmoked = Math.max(0, 10 - i); // Decreasing trend
                    const daysSmokeFree = Math.max(0, i - 2);
                    const moneySaved = daysSmokeFree * 50000; // 50k per day
                    const cravingLevel = Math.max(1, 8 - i);

                    await sql.query`
                        INSERT INTO ProgressTracking (UserID, Date, CigarettesSmoked, CravingLevel, MoneySaved, DaysSmokeFree, EmotionNotes)
                        VALUES (
                            ${member.UserID}, 
                            ${date}, 
                            ${cigarettesSmoked}, 
                            ${cravingLevel}, 
                            ${moneySaved}, 
                            ${daysSmokeFree},
                            N'Đang cố gắng cai thuốc với sự hỗ trợ của coach'
                        )
                    `;
                }
                console.log(`   ✅ Created progress data for ${member.Email}`);
            }
        }

        // 7. Test API endpoints
        console.log('\n🧪 Testing API setup...');

        // Check if coach conversations endpoint will work
        const coachConversationsTest = await sql.query`
            SELECT 
                c.ConversationID,
                c.MemberID,
                u.FirstName + ' ' + u.LastName as MemberName,
                u.Avatar as MemberAvatar,
                u.Email as MemberEmail,
                c.LastMessageAt,
                m.Content as LastMessageContent,
                m.SenderID as LastMessageSenderID,
                (SELECT COUNT(*) FROM Messages WHERE ReceiverID = ${coach.UserID} AND SenderID = c.MemberID AND IsRead = 0) as UnreadCount
            FROM Conversations c
            INNER JOIN Users u ON c.MemberID = u.UserID
            LEFT JOIN Messages m ON c.LastMessageID = m.MessageID
            WHERE c.CoachID = ${coach.UserID} AND c.IsActive = 1
            ORDER BY c.LastMessageAt DESC
        `;

        console.log(`✅ Coach conversations API will return ${coachConversationsTest.recordset.length} conversations`);

        // 8. Display login credentials
        console.log('\n🔑 Login credentials for testing:');
        console.log('   Coach login:');
        console.log(`      Email: ${coach.Email}`);
        console.log(`      Password: H12345678@`);
        console.log(`      URL: http://localhost:3000/coach/dashboard`);

        console.log('\n   Member login(s):');
        members.slice(0, 2).forEach(member => {
            console.log(`      Email: ${member.Email}`);
            console.log(`      Password: H12345678@`);
            console.log(`      URL: http://localhost:3000/quit-plan`);
        });

        console.log('\n🎉 Chat system setup completed successfully!');

        console.log('\n📝 Next steps:');
        console.log('   1. Login as coach at http://localhost:3000/coach/dashboard');
        console.log('   2. Go to Chat section in coach dashboard');
        console.log('   3. You should see member conversations in the left panel');
        console.log('   4. Click on a member to start chatting');
        console.log('   5. Login as member to test member side chat');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

fixChatSystem(); 