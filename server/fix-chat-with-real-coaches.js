const { pool } = require('./src/config/database');

async function fixChatWithRealCoaches() {
    console.log('🔧 FIXING CHAT WITH REAL COACHES IN DATABASE...\n');

    try {
        // 1. Test database connection
        console.log('1. Testing database connection...');
        await pool.request().query('SELECT 1 as test');
        console.log('✅ Database connection OK');

        // 2. Find all existing coaches
        console.log('\n2. Finding existing coaches...');
        const coaches = await pool.request().query(`
            SELECT UserID, Email, FirstName, LastName, Role, IsActive 
            FROM Users 
            WHERE Role = 'coach' AND IsActive = 1
        `);

        console.log(`Found ${coaches.recordset.length} active coaches:`);
        coaches.recordset.forEach(coach => {
            console.log(`   - ${coach.FirstName} ${coach.LastName} (${coach.Email}) - ID: ${coach.UserID}`);
        });

        if (coaches.recordset.length === 0) {
            console.log('❌ No active coaches found! Please create a coach account first.');
            return;
        }

        // 3. Find current member (leghenkiz@gmail.com)
        console.log('\n3. Finding current member...');
        const member = await pool.request()
            .input('email', 'leghenkiz@gmail.com')
            .query(`
                SELECT UserID, Email, FirstName, LastName, Role 
                FROM Users 
                WHERE Email = @email
            `);

        if (member.recordset.length === 0) {
            console.log('❌ Member leghenkiz@gmail.com not found!');
            return;
        }

        const memberData = member.recordset[0];
        console.log(`✅ Found member: ${memberData.FirstName} ${memberData.LastName} (ID: ${memberData.UserID})`);

        // 4. Use first available coach
        const coachData = coaches.recordset[0];
        console.log(`\n4. Assigning coach: ${coachData.FirstName} ${coachData.LastName} (ID: ${coachData.UserID})`);

        // 5. Check/Create QuitPlan to link member with coach
        console.log('\n5. Setting up QuitPlan...');
        const existingPlan = await pool.request()
            .input('memberId', memberData.UserID)
            .query(`
                SELECT PlanID, CoachID FROM QuitPlans 
                WHERE UserID = @memberId AND Status = 'active'
            `);

        let planId;
        if (existingPlan.recordset.length > 0) {
            // Update existing plan with coach
            planId = existingPlan.recordset[0].PlanID;
            await pool.request()
                .input('planId', planId)
                .input('coachId', coachData.UserID)
                .query(`
                    UPDATE QuitPlans 
                    SET CoachID = @coachId 
                    WHERE PlanID = @planId
                `);
            console.log(`✅ Updated existing QuitPlan ${planId} with coach ${coachData.UserID}`);
        } else {
            // Create new quit plan
            const planResult = await pool.request()
                .input('memberId', memberData.UserID)
                .input('coachId', coachData.UserID)
                .input('startDate', new Date())
                .input('targetDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                .input('reason', 'Chat system setup - member coach assignment')
                .input('motivationLevel', 8)
                .input('detailedPlan', 'Kế hoạch cai thuốc với sự hỗ trợ của coach')
                .input('status', 'active')
                .query(`
                    INSERT INTO QuitPlans (UserID, CoachID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status)
                    OUTPUT INSERTED.PlanID
                    VALUES (@memberId, @coachId, @startDate, @targetDate, @reason, @motivationLevel, @detailedPlan, @status)
                `);
            planId = planResult.recordset[0].PlanID;
            console.log(`✅ Created new QuitPlan ${planId} linking member to coach`);
        }

        // 6. Check/Create Conversation
        console.log('\n6. Setting up conversation...');
        const existingConv = await pool.request()
            .input('coachId', coachData.UserID)
            .input('memberId', memberData.UserID)
            .query(`
                SELECT ConversationID FROM Conversations 
                WHERE CoachID = @coachId AND MemberID = @memberId
            `);

        let conversationId;
        if (existingConv.recordset.length > 0) {
            conversationId = existingConv.recordset[0].ConversationID;
            console.log(`✅ Conversation already exists: ${conversationId}`);
        } else {
            const convResult = await pool.request()
                .input('coachId', coachData.UserID)
                .input('memberId', memberData.UserID)
                .query(`
                    INSERT INTO Conversations (CoachID, MemberID, LastMessageAt, IsActive)
                    OUTPUT INSERTED.ConversationID
                    VALUES (@coachId, @memberId, GETDATE(), 1)
                `);
            conversationId = convResult.recordset[0].ConversationID;
            console.log(`✅ Created new conversation: ${conversationId}`);

            // Add welcome message from coach
            await pool.request()
                .input('senderId', coachData.UserID)
                .input('receiverId', memberData.UserID)
                .input('content', `Xin chào ${memberData.FirstName}! Tôi là ${coachData.FirstName} ${coachData.LastName}, coach sẽ hỗ trợ bạn trong quá trình cai thuốc. Hãy cho tôi biết nếu bạn cần hỗ trợ gì nhé!`)
                .query(`
                    INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
                    VALUES (@senderId, @receiverId, @content, 'text', 0)
                `);
            console.log('✅ Added welcome message from coach');
        }

        // 7. Test the setup
        console.log('\n7. Testing chat setup...');

        // Test member conversation endpoint
        const testConv = await pool.request()
            .input('memberId', memberData.UserID)
            .query(`
                SELECT TOP 1 CoachID
                FROM QuitPlans 
                WHERE UserID = @memberId AND CoachID IS NOT NULL AND Status = 'active'
                ORDER BY CreatedAt DESC
            `);

        if (testConv.recordset.length > 0) {
            console.log('✅ Member can find assigned coach');
        } else {
            console.log('❌ Member cannot find assigned coach');
        }

        // Test coach conversations endpoint
        const testCoachConv = await pool.request()
            .input('coachId', coachData.UserID)
            .query(`
                SELECT COUNT(*) as count
                FROM Conversations c
                WHERE c.CoachID = @coachId AND c.IsActive = 1
            `);

        console.log(`✅ Coach has ${testCoachConv.recordset[0].count} active conversations`);

        console.log('\n🎉 CHAT SYSTEM FIXED WITH REAL COACHES!');
        console.log('\n📋 Summary:');
        console.log(`- Member: ${memberData.FirstName} ${memberData.LastName} (${memberData.Email})`);
        console.log(`- Coach: ${coachData.FirstName} ${coachData.LastName} (${coachData.Email})`);
        console.log(`- QuitPlan ID: ${planId}`);
        console.log(`- Conversation ID: ${conversationId}`);

        console.log('\n🚀 Now you can test:');
        console.log('1. Member login: leghenkiz@gmail.com / H12345678@');
        console.log(`2. Coach login: ${coachData.Email} / [your coach password]`);
        console.log('3. Both should be able to chat with each other!');

        console.log('\n📱 URLs:');
        console.log('- Member: http://localhost:3000 → Click "Chat với Coach"');
        console.log('- Coach: http://localhost:3000/coach/dashboard → Go to Chat section');

    } catch (error) {
        console.error('❌ Fix failed:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        try {
            await pool.close();
        } catch (error) {
            // Ignore close errors
        }
    }
}

// Run the fix
fixChatWithRealCoaches(); 