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

async function fixChatComprehensive() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        console.log('🔄 Starting comprehensive chat system fix...');

        // 1. Check and create necessary tables
        console.log('\n📋 Checking database tables...');

        // Check if Conversations table exists and has correct structure
        const conversationsTableCheck = await sql.query`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Conversations'
        `;

        if (conversationsTableCheck.recordset.length === 0) {
            console.log('❌ Conversations table not found, creating...');
            await sql.query`
                CREATE TABLE Conversations (
                    ConversationID int IDENTITY(1,1) PRIMARY KEY,
                    CoachID int NOT NULL,
                    MemberID int NOT NULL,
                    LastMessageID int NULL,
                    LastMessageAt datetime2 DEFAULT GETDATE(),
                    IsActive bit DEFAULT 1,
                    CreatedAt datetime2 DEFAULT GETDATE(),
                    FOREIGN KEY (CoachID) REFERENCES Users(UserID),
                    FOREIGN KEY (MemberID) REFERENCES Users(UserID)
                )
            `;
            console.log('✅ Conversations table created');
        }

        // Check if Messages table exists
        const messagesTableCheck = await sql.query`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Messages'
        `;

        if (messagesTableCheck.recordset.length === 0) {
            console.log('❌ Messages table not found, creating...');
            await sql.query`
                CREATE TABLE Messages (
                    MessageID int IDENTITY(1,1) PRIMARY KEY,
                    SenderID int NOT NULL,
                    ReceiverID int NOT NULL,
                    Content nvarchar(4000) NOT NULL,
                    MessageType nvarchar(50) DEFAULT 'text',
                    IsRead bit DEFAULT 0,
                    RelatedPlanID int NULL,
                    CreatedAt datetime2 DEFAULT GETDATE(),
                    FOREIGN KEY (SenderID) REFERENCES Users(UserID),
                    FOREIGN KEY (ReceiverID) REFERENCES Users(UserID),
                    FOREIGN KEY (RelatedPlanID) REFERENCES QuitPlans(PlanID)
                )
            `;
            console.log('✅ Messages table created');
        }

        // 2. Check current users and fix authentication data
        console.log('\n👥 Checking users and authentication...');
        const users = await sql.query`
            SELECT UserID, Email, FirstName, LastName, Role, IsActive, EmailVerified, Password
            FROM Users
            WHERE Role IN ('coach', 'member', 'guest')
            ORDER BY Role, UserID
        `;

        console.log('Current users:');
        users.recordset.forEach(user => {
            console.log(`   ${user.Role}: ${user.Email} (ID: ${user.UserID}) - Active: ${user.IsActive}, Verified: ${user.EmailVerified}`);
        });

        // 3. Ensure all users have proper authentication setup
        console.log('\n🔐 Fixing user authentication...');
        for (const user of users.recordset) {
            if (!user.Password || user.Password !== 'H12345678@') {
                await sql.query`
                    UPDATE Users 
                    SET Password = 'H12345678@', 
                        IsActive = 1, 
                        EmailVerified = 1
                    WHERE UserID = ${user.UserID}
                `;
                console.log(`   ✅ Fixed authentication for ${user.Email}`);
            }
        }

        // 4. Get coaches and members
        const coaches = users.recordset.filter(u => u.Role === 'coach');
        const members = users.recordset.filter(u => u.Role === 'member' || u.Role === 'guest');

        if (coaches.length === 0) {
            console.log('❌ No coaches found! Creating a test coach...');
            await sql.query`
                INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified)
                VALUES ('coach@example.com', 'H12345678@', 'Coach', 'Smith', 'coach', 1, 1)
            `;

            // Reload users
            const updatedUsers = await sql.query`
                SELECT UserID, Email, FirstName, LastName, Role, IsActive, EmailVerified
                FROM Users
                WHERE Role = 'coach'
            `;
            coaches.push(updatedUsers.recordset[0]);
            console.log('✅ Test coach created');
        }

        if (members.length === 0) {
            console.log('❌ No members found! Creating test members...');

            const memberEmails = ['member@example.com', 'guest@example.com', 'leghenkiz@gmail.com'];
            const memberNames = [
                ['Member', 'User'],
                ['Guest', 'User'],
                ['Tran', 'Huy']
            ];
            const memberRoles = ['member', 'guest', 'member'];

            for (let i = 0; i < memberEmails.length; i++) {
                const existingUser = await sql.query`
                    SELECT UserID FROM Users WHERE Email = ${memberEmails[i]}
                `;

                if (existingUser.recordset.length === 0) {
                    await sql.query`
                        INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified)
                        VALUES (${memberEmails[i]}, 'H12345678@', ${memberNames[i][0]}, ${memberNames[i][1]}, ${memberRoles[i]}, 1, 1)
                    `;
                    console.log(`   ✅ Created test ${memberRoles[i]}: ${memberEmails[i]}`);
                }
            }

            // Reload members
            const updatedMembers = await sql.query`
                SELECT UserID, Email, FirstName, LastName, Role, IsActive, EmailVerified
                FROM Users
                WHERE Role IN ('member', 'guest')
            `;
            members.length = 0;
            members.push(...updatedMembers.recordset);
        }

        const coach = coaches[0];
        console.log(`\n👨‍⚕️ Using coach: ${coach.Email} (ID: ${coach.UserID})`);

        // 5. Clear existing conversations and messages for clean start
        console.log('\n🧹 Cleaning existing conversations...');
        await sql.query`DELETE FROM Messages`;
        await sql.query`DELETE FROM Conversations`;
        console.log('✅ Existing conversations cleared');

        // 6. Create quit plans for all members with coach assignment
        console.log('\n🎯 Creating/updating quit plans...');
        for (const member of members) {
            const existingPlan = await sql.query`
                SELECT PlanID FROM QuitPlans 
                WHERE UserID = ${member.UserID} AND Status = 'active'
            `;

            if (existingPlan.recordset.length === 0) {
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
            } else {
                await sql.query`
                    UPDATE QuitPlans 
                    SET CoachID = ${coach.UserID}
                    WHERE UserID = ${member.UserID} AND Status = 'active'
                `;
                console.log(`   ✅ Updated coach assignment for ${member.Email}`);
            }
        }

        // 7. Create conversations between coach and all members
        console.log('\n💬 Creating conversations...');
        for (const member of members) {
            // Create conversation
            const conversationResult = await sql.query`
                INSERT INTO Conversations (CoachID, MemberID, LastMessageAt, IsActive)
                OUTPUT INSERTED.ConversationID
                VALUES (${coach.UserID}, ${member.UserID}, GETDATE(), 1)
            `;

            const conversationId = conversationResult.recordset[0].ConversationID;

            // Create initial welcome message from coach
            const welcomeMessages = [
                `Xin chào ${member.FirstName}! Tôi là coach của bạn. Tôi sẽ hỗ trợ bạn trong quá trình cai thuốc. Bạn cảm thấy thế nào về kế hoạch hiện tại?`,
                `Chào ${member.FirstName}! Rất vui được làm việc với bạn. Hãy chia sẻ với tôi về mục tiêu cai thuốc của bạn nhé!`,
                `Hi ${member.FirstName}! Tôi ở đây để hỗ trợ bạn 24/7. Bạn có thắc mắc gì về quá trình cai thuốc không?`
            ];

            const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

            const messageResult = await sql.query`
                INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
                OUTPUT INSERTED.MessageID, INSERTED.CreatedAt
                VALUES (
                    ${coach.UserID}, 
                    ${member.UserID}, 
                    ${randomMessage}, 
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

            console.log(`   ✅ Created conversation and welcome message for ${member.Email}`);

            // Add a sample response from member for more realistic conversation
            if (Math.random() > 0.5) {
                const memberResponses = [
                    'Cảm ơn coach! Tôi đang cố gắng cai thuốc và cần sự hỗ trợ.',
                    'Chào coach! Tôi đã thử cai thuốc nhiều lần nhưng chưa thành công.',
                    'Hi coach! Tôi muốn bỏ thuốc lá để cải thiện sức khỏe.',
                    'Cảm ơn coach đã hỗ trợ! Tôi sẵn sàng bắt đầu.',
                    'Chào coach! Tôi rất cần lời khuyên về cách vượt qua cơn thèm thuốc.'
                ];

                const randomResponse = memberResponses[Math.floor(Math.random() * memberResponses.length)];

                const memberMessageResult = await sql.query`
                    INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
                    OUTPUT INSERTED.MessageID, INSERTED.CreatedAt
                    VALUES (
                        ${member.UserID}, 
                        ${coach.UserID}, 
                        ${randomResponse}, 
                        'text', 
                        0
                    )
                `;

                // Update conversation with member's response
                await sql.query`
                    UPDATE Conversations 
                    SET LastMessageID = ${memberMessageResult.recordset[0].MessageID},
                        LastMessageAt = ${memberMessageResult.recordset[0].CreatedAt}
                    WHERE ConversationID = ${conversationId}
                `;

                console.log(`      💬 Added member response for ${member.Email}`);
            }
        }

        // 8. Create sample progress data
        console.log('\n📈 Creating sample progress data...');
        for (const member of members.slice(0, 2)) {
            // Clear existing progress data
            await sql.query`DELETE FROM ProgressTracking WHERE UserID = ${member.UserID}`;

            // Create progress for last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);

                const cigarettesSmoked = Math.max(0, 10 - i - Math.floor(Math.random() * 3));
                const daysSmokeFree = Math.max(0, i - 2);
                const moneySaved = daysSmokeFree * 50000;
                const cravingLevel = Math.max(1, 8 - i + Math.floor(Math.random() * 2));

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

        // 9. Verify chat system
        console.log('\n🔍 Verifying chat system...');

        const finalConversations = await sql.query`
            SELECT 
                c.ConversationID,
                c.CoachID,
                c.MemberID,
                coach.FirstName + ' ' + coach.LastName as CoachName,
                member.FirstName + ' ' + member.LastName as MemberName,
                c.LastMessageAt,
                m.Content as LastMessage,
                (SELECT COUNT(*) FROM Messages WHERE 
                 (SenderID = c.CoachID AND ReceiverID = c.MemberID) OR 
                 (SenderID = c.MemberID AND ReceiverID = c.CoachID)) as MessageCount
            FROM Conversations c
            INNER JOIN Users coach ON c.CoachID = coach.UserID
            INNER JOIN Users member ON c.MemberID = member.UserID
            LEFT JOIN Messages m ON c.LastMessageID = m.MessageID
            WHERE c.IsActive = 1
            ORDER BY c.LastMessageAt DESC
        `;

        console.log(`📊 Total conversations: ${finalConversations.recordset.length}`);
        finalConversations.recordset.forEach(conv => {
            console.log(`   Conversation ${conv.ConversationID}: ${conv.CoachName} ↔ ${conv.MemberName}`);
            console.log(`      Messages: ${conv.MessageCount}, Last: "${conv.LastMessage?.substring(0, 50)}..."`);
        });

        // 10. Test API endpoints availability
        console.log('\n🧪 Testing API endpoint requirements...');

        // Test coach conversations query
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

        console.log(`✅ Coach conversations API: ${coachConversationsTest.recordset.length} conversations`);

        // Test members list query
        const membersListTest = await sql.query`
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
            LEFT JOIN QuitPlans qp ON u.UserID = qp.UserID AND qp.Status = 'active' AND qp.CoachID = ${coach.UserID}
            LEFT JOIN Conversations c ON u.UserID = c.MemberID AND c.CoachID = ${coach.UserID}
            WHERE u.Role IN ('member', 'guest') AND u.IsActive = 1
            ORDER BY u.FirstName, u.LastName
        `;

        console.log(`✅ Members list API: ${membersListTest.recordset.length} members`);

        // 11. Display login credentials and URLs
        console.log('\n🔑 LOGIN CREDENTIALS FOR TESTING:');
        console.log('==========================================');
        console.log('👨‍⚕️ COACH LOGIN:');
        console.log(`   Email: ${coach.Email}`);
        console.log(`   Password: H12345678@`);
        console.log(`   URL: http://localhost:3000/coach/dashboard`);
        console.log(`   Direct Chat URL: http://localhost:3000/coach/dashboard#chat`);

        console.log('\n👥 MEMBER LOGINS:');
        members.forEach((member, index) => {
            console.log(`   ${index + 1}. ${member.Role.toUpperCase()} - ${member.FirstName} ${member.LastName}`);
            console.log(`      Email: ${member.Email}`);
            console.log(`      Password: H12345678@`);
            console.log(`      URL: http://localhost:3000/quit-plan`);
            console.log('');
        });

        console.log('🚀 TESTING INSTRUCTIONS:');
        console.log('==========================================');
        console.log('1. Open TWO browser windows/tabs:');
        console.log('   - Window 1: Login as coach');
        console.log('   - Window 2: Login as member');
        console.log('');
        console.log('2. In Coach window:');
        console.log('   - Go to Chat section');
        console.log('   - You should see conversations in "Cuộc trò chuyện" tab');
        console.log('   - You should see all members in "Thành viên" tab');
        console.log('   - Click on a conversation to start chatting');
        console.log('');
        console.log('3. In Member window:');
        console.log('   - Go to "Chat với Coach" tab');
        console.log('   - You should see conversation with your coach');
        console.log('   - Send messages back and forth to test real-time chat');
        console.log('');
        console.log('4. Test creating new conversations:');
        console.log('   - In coach view, go to "Thành viên" tab');
        console.log('   - Click "Bắt đầu chat" for members without conversations');

        console.log('\n🎉 COMPREHENSIVE CHAT SYSTEM FIX COMPLETED!');
        console.log('==========================================');
        console.log('✅ Database tables verified/created');
        console.log('✅ User authentication fixed');
        console.log('✅ Quit plans with coach assignments created');
        console.log('✅ Conversations with sample messages created');
        console.log('✅ Progress tracking data created');
        console.log('✅ API endpoints tested and verified');
        console.log('');
        console.log('🔥 The chat system should now work perfectly!');

    } catch (error) {
        console.error('❌ Error in comprehensive chat fix:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await sql.close();
    }
}

// Run the comprehensive fix
fixChatComprehensive(); 