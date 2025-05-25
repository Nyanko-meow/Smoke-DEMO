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

async function fixChatSimple() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        console.log('🔄 Starting simple chat system fix...');

        // 1. Check current users
        console.log('\n👥 Checking users...');
        const users = await sql.query`
            SELECT UserID, Email, FirstName, LastName, Role, IsActive, EmailVerified
            FROM Users
            WHERE Role IN ('coach', 'member', 'guest') AND IsActive = 1
            ORDER BY Role, UserID
        `;

        console.log('Current users:');
        users.recordset.forEach(user => {
            console.log(`   ${user.Role}: ${user.Email} (ID: ${user.UserID})`);
        });

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

        const coach = coaches[0];
        console.log(`\n👨‍⚕️ Using coach: ${coach.Email} (ID: ${coach.UserID})`);

        // 2. Create/update quit plans for members without coach assignment
        console.log('\n🎯 Creating/updating quit plans...');
        for (const member of members) {
            const existingPlan = await sql.query`
                SELECT PlanID, CoachID FROM QuitPlans 
                WHERE UserID = ${member.UserID} AND Status = 'active'
            `;

            if (existingPlan.recordset.length === 0) {
                // Create new quit plan
                const startDate = new Date();
                const targetDate = new Date();
                targetDate.setDate(startDate.getDate() + 90);

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
                console.log(`   ✅ Created quit plan for ${member.Email}`);
            } else if (!existingPlan.recordset[0].CoachID) {
                // Assign coach to existing plan
                await sql.query`
                    UPDATE QuitPlans 
                    SET CoachID = ${coach.UserID}
                    WHERE UserID = ${member.UserID} AND Status = 'active'
                `;
                console.log(`   ✅ Assigned coach to existing plan for ${member.Email}`);
            } else {
                console.log(`   ℹ️  ${member.Email} already has a plan with coach assigned`);
            }
        }

        // 3. Create conversations for members without existing conversations
        console.log('\n💬 Creating conversations...');
        for (const member of members) {
            const existingConversation = await sql.query`
                SELECT ConversationID FROM Conversations 
                WHERE CoachID = ${coach.UserID} AND MemberID = ${member.UserID}
            `;

            if (existingConversation.recordset.length === 0) {
                // Create new conversation
                const conversationResult = await sql.query`
                    INSERT INTO Conversations (CoachID, MemberID, LastMessageAt, IsActive)
                    OUTPUT INSERTED.ConversationID
                    VALUES (${coach.UserID}, ${member.UserID}, GETDATE(), 1)
                `;

                const conversationId = conversationResult.recordset[0].ConversationID;

                // Create welcome message from coach
                const welcomeMessage = `Xin chào ${member.FirstName}! Tôi là coach của bạn. Tôi sẽ hỗ trợ bạn trong quá trình cai thuốc. Bạn cảm thấy thế nào về kế hoạch hiện tại?`;

                const messageResult = await sql.query`
                    INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
                    OUTPUT INSERTED.MessageID, INSERTED.CreatedAt
                    VALUES (
                        ${coach.UserID}, 
                        ${member.UserID}, 
                        ${welcomeMessage}, 
                        'text', 
                        0
                    )
                `;

                // Update conversation with the welcome message
                await sql.query`
                    UPDATE Conversations 
                    SET LastMessageID = ${messageResult.recordset[0].MessageID},
                        LastMessageAt = ${messageResult.recordset[0].CreatedAt}
                    WHERE ConversationID = ${conversationId}
                `;

                console.log(`   ✅ Created conversation for ${member.Email}`);
            } else {
                console.log(`   ℹ️  Conversation already exists with ${member.Email}`);
            }
        }

        // 4. Verify final setup
        console.log('\n🔍 Verifying setup...');

        const finalConversations = await sql.query`
            SELECT 
                c.ConversationID,
                coach.FirstName + ' ' + coach.LastName as CoachName,
                member.FirstName + ' ' + member.LastName as MemberName,
                c.LastMessageAt,
                m.Content as LastMessage
            FROM Conversations c
            INNER JOIN Users coach ON c.CoachID = coach.UserID
            INNER JOIN Users member ON c.MemberID = member.UserID
            LEFT JOIN Messages m ON c.LastMessageID = m.MessageID
            WHERE c.IsActive = 1 AND c.CoachID = ${coach.UserID}
            ORDER BY c.LastMessageAt DESC
        `;

        console.log(`📊 Total conversations: ${finalConversations.recordset.length}`);
        finalConversations.recordset.forEach(conv => {
            console.log(`   ${conv.CoachName} ↔ ${conv.MemberName}: "${conv.LastMessage?.substring(0, 40)}..."`);
        });

        const quitPlansCount = await sql.query`
            SELECT COUNT(*) as count FROM QuitPlans 
            WHERE CoachID = ${coach.UserID} AND Status = 'active'
        `;

        console.log(`📋 Active quit plans with coach: ${quitPlansCount.recordset[0].count}`);

        // 5. Display login info
        console.log('\n🔑 LOGIN CREDENTIALS:');
        console.log('==========================================');
        console.log('👨‍⚕️ COACH LOGIN:');
        console.log(`   Email: ${coach.Email}`);
        console.log(`   Password: H12345678@`);
        console.log(`   URL: http://localhost:3000/coach/dashboard`);

        console.log('\n👥 MEMBER LOGINS:');
        members.forEach((member, index) => {
            console.log(`   ${index + 1}. ${member.FirstName} ${member.LastName} (${member.Role})`);
            console.log(`      Email: ${member.Email}`);
            console.log(`      Password: H12345678@`);
            console.log(`      URL: http://localhost:3000/quit-plan`);
        });

        console.log('\n🚀 TESTING STEPS:');
        console.log('==========================================');
        console.log('1. Login as coach at coach dashboard');
        console.log('2. Go to Chat section');
        console.log('3. You should see conversations in "Cuộc trò chuyện" tab');
        console.log('4. You should see all members in "Thành viên" tab');
        console.log('5. Click on conversations to chat');
        console.log('6. Test member login and chat with coach');

        console.log('\n✅ CHAT SYSTEM READY!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await sql.close();
    }
}

fixChatSimple(); 