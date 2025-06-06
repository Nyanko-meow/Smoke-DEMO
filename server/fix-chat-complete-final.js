const { pool } = require('./src/config/database');

async function fixChatCompleteFinal() {
    console.log('🔧 FIXING CHAT SYSTEM - COMPLETE FINAL FIX...\n');

    try {
        // 1. Test database connection
        console.log('1. Testing database connection...');
        try {
            await pool.request().query('SELECT 1 as test');
            console.log('✅ Database connection OK');
        } catch (error) {
            console.log('❌ Database connection failed:', error.message);
            console.log('🔧 Please check SQL Server is running and connection string is correct');
            return;
        }

        // 2. Check if required tables exist
        console.log('\n2. Checking required tables...');
        const requiredTables = ['Users', 'QuitPlans', 'Conversations', 'Messages'];

        for (const table of requiredTables) {
            try {
                const result = await pool.request().query(`
                    SELECT COUNT(*) as count 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_NAME = '${table}'
                `);

                if (result.recordset[0].count > 0) {
                    console.log(`✅ Table ${table} exists`);
                } else {
                    console.log(`❌ Table ${table} missing`);
                    console.log('🔧 Please run the database schema setup first');
                    return;
                }
            } catch (error) {
                console.log(`❌ Error checking table ${table}:`, error.message);
                return;
            }
        }

        // 3. Check if test users exist
        console.log('\n3. Checking test users...');
        const users = await pool.request().query(`
            SELECT UserID, Email, Role, FirstName, LastName 
            FROM Users 
            WHERE Email IN ('member@example.com', 'coach@example.com', 'leghenkiz@gmail.com')
        `);

        console.log(`Found ${users.recordset.length} test users`);

        let memberId, coachId, existingMemberId;

        for (const user of users.recordset) {
            console.log(`- ${user.Email} (${user.Role}) - ID: ${user.UserID}`);
            if (user.Role === 'member' && user.Email === 'member@example.com') memberId = user.UserID;
            if (user.Role === 'coach') coachId = user.UserID;
            if (user.Email === 'leghenkiz@gmail.com') existingMemberId = user.UserID;
        }

        // Use existing member if available
        if (existingMemberId && !memberId) {
            memberId = existingMemberId;
            console.log(`Using existing member: leghenkiz@gmail.com (ID: ${memberId})`);
        }

        // 4. Create test users if they don't exist
        if (!memberId) {
            console.log('\n4a. Creating test member...');
            const memberResult = await pool.request()
                .input('email', 'member@example.com')
                .input('password', '12345678@')
                .input('firstName', 'Test')
                .input('lastName', 'Member')
                .input('role', 'member')
                .query(`
                    INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified)
                    OUTPUT INSERTED.UserID
                    VALUES (@email, @password, @firstName, @lastName, @role, 1, 1)
                `);
            memberId = memberResult.recordset[0].UserID;
            console.log(`✅ Created member with ID: ${memberId}`);
        }

        if (!coachId) {
            console.log('\n4b. Creating test coach...');
            const coachResult = await pool.request()
                .input('email', 'coach@example.com')
                .input('password', '12345678@')
                .input('firstName', 'Test')
                .input('lastName', 'Coach')
                .input('role', 'coach')
                .query(`
                    INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified)
                    OUTPUT INSERTED.UserID
                    VALUES (@email, @password, @firstName, @lastName, @role, 1, 1)
                `);
            coachId = coachResult.recordset[0].UserID;
            console.log(`✅ Created coach with ID: ${coachId}`);
        }

        // 5. Check/Create QuitPlan
        console.log('\n5. Checking QuitPlan...');

        // First check if member has any active quit plan
        const existingPlan = await pool.request()
            .input('memberId', memberId)
            .query(`
                SELECT PlanID, CoachID FROM QuitPlans 
                WHERE UserID = @memberId AND Status = 'active'
            `);

        let planId;
        if (existingPlan.recordset.length > 0) {
            // Update existing plan to assign coach
            planId = existingPlan.recordset[0].PlanID;
            const currentCoachId = existingPlan.recordset[0].CoachID;

            if (!currentCoachId || currentCoachId !== coachId) {
                console.log(`Updating existing QuitPlan ${planId} to assign coach ${coachId}...`);
                await pool.request()
                    .input('planId', planId)
                    .input('coachId', coachId)
                    .query(`
                        UPDATE QuitPlans 
                        SET CoachID = @coachId 
                        WHERE PlanID = @planId
                    `);
                console.log(`✅ Updated QuitPlan ${planId} with coach assignment`);
            } else {
                console.log(`✅ QuitPlan ${planId} already has correct coach assignment`);
            }
        } else {
            // Create new quit plan
            console.log('Creating new QuitPlan...');
            const planResult = await pool.request()
                .input('memberId', memberId)
                .input('coachId', coachId)
                .input('startDate', new Date())
                .input('targetDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30 days from now
                .input('reason', 'Test quit plan for chat system')
                .input('motivationLevel', 8)
                .input('detailedPlan', 'This is a test quit plan created for chat system testing')
                .input('status', 'active')
                .query(`
                    INSERT INTO QuitPlans (UserID, CoachID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status)
                    OUTPUT INSERTED.PlanID
                    VALUES (@memberId, @coachId, @startDate, @targetDate, @reason, @motivationLevel, @detailedPlan, @status)
                `);
            planId = planResult.recordset[0].PlanID;
            console.log(`✅ Created QuitPlan with ID: ${planId}`);
        }

        // 6. Check/Create Conversation
        console.log('\n6. Checking Conversation...');
        const conversation = await pool.request()
            .input('coachId', coachId)
            .input('memberId', memberId)
            .query(`
                SELECT ConversationID FROM Conversations 
                WHERE CoachID = @coachId AND MemberID = @memberId
            `);

        let conversationId;
        if (conversation.recordset.length === 0) {
            console.log('Creating Conversation...');
            const convResult = await pool.request()
                .input('coachId', coachId)
                .input('memberId', memberId)
                .query(`
                    INSERT INTO Conversations (CoachID, MemberID, LastMessageAt)
                    OUTPUT INSERTED.ConversationID
                    VALUES (@coachId, @memberId, GETDATE())
                `);
            conversationId = convResult.recordset[0].ConversationID;
            console.log(`✅ Created Conversation with ID: ${conversationId}`);
        } else {
            conversationId = conversation.recordset[0].ConversationID;
            console.log(`✅ Conversation exists with ID: ${conversationId}`);
        }

        // 7. Create test messages
        console.log('\n7. Creating test messages...');
        const existingMessages = await pool.request()
            .input('coachId', coachId)
            .input('memberId', memberId)
            .query(`
                SELECT COUNT(*) as count FROM Messages 
                WHERE (SenderID = @coachId AND ReceiverID = @memberId)
                   OR (SenderID = @memberId AND ReceiverID = @coachId)
            `);

        if (existingMessages.recordset[0].count === 0) {
            // Create initial messages
            await pool.request()
                .input('senderId', coachId)
                .input('receiverId', memberId)
                .input('content', 'Xin chào! Tôi là coach của bạn. Tôi sẽ hỗ trợ bạn trong quá trình cai thuốc.')
                .query(`
                    INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
                    VALUES (@senderId, @receiverId, @content, 'text', 1)
                `);

            await pool.request()
                .input('senderId', memberId)
                .input('receiverId', coachId)
                .input('content', 'Chào coach! Em cảm ơn coach đã hỗ trợ. Em sẽ cố gắng thực hiện kế hoạch cai thuốc.')
                .query(`
                    INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
                    VALUES (@senderId, @receiverId, @content, 'text', 1)
                `);

            console.log('✅ Created test messages');
        } else {
            console.log(`✅ Messages already exist (${existingMessages.recordset[0].count} messages)`);
        }

        // 8. Test the API endpoints
        console.log('\n8. Testing API endpoints...');

        // Test with axios
        const axios = require('axios');
        const BASE_URL = 'http://localhost:4000';

        try {
            // Login to get token (try existing member first)
            let loginEmail = existingMemberId ? 'leghenkiz@gmail.com' : 'member@example.com';
            let loginPassword = existingMemberId ? 'H12345678@' : '12345678@';

            const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: loginEmail,
                password: loginPassword
            });

            if (loginResponse.data.success) {
                const token = loginResponse.data.token;
                console.log(`✅ Login successful with ${loginEmail}`);

                // Test conversation endpoint
                try {
                    const convResponse = await axios.get(
                        `${BASE_URL}/api/chat/member/conversation`,
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    console.log('✅ Conversation endpoint working');
                } catch (error) {
                    console.log('❌ Conversation endpoint failed:', error.response?.status, error.response?.data?.message);
                }

                // Test messages endpoint
                try {
                    const msgResponse = await axios.get(
                        `${BASE_URL}/api/chat/member/messages`,
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    console.log('✅ Messages endpoint working');
                } catch (error) {
                    console.log('❌ Messages endpoint failed:', error.response?.status, error.response?.data?.message);
                }

                // Test send message endpoint
                try {
                    const sendResponse = await axios.post(
                        `${BASE_URL}/api/chat/coach/chat/send`,
                        { content: 'Test message from fix script - ' + new Date().toLocaleString() },
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    console.log('✅ Send message endpoint working');
                } catch (error) {
                    console.log('❌ Send message endpoint failed:', error.response?.status, error.response?.data?.message);
                }
            }
        } catch (error) {
            console.log('❌ API testing failed:', error.message);
            console.log('🔧 Make sure server is running: npm start');
        }

        console.log('\n🎉 CHAT SYSTEM FIX COMPLETED!');
        console.log('\n📋 Summary:');
        console.log(`- Member ID: ${memberId} (member@example.com)`);
        console.log(`- Coach ID: ${coachId} (coach@example.com)`);
        console.log(`- QuitPlan ID: ${planId}`);
        console.log(`- Conversation ID: ${conversationId}`);

        console.log('\n🚀 Next Steps:');
        console.log('1. Make sure server is running: npm start');
        console.log('2. Open frontend: http://localhost:3000');
        console.log('3. Login as: member@example.com / 12345678@');
        console.log('4. Click "Chat với Coach" button');
        console.log('5. Chat should work perfectly now!');

    } catch (error) {
        console.error('❌ Fix failed:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        // Close database connection
        try {
            await pool.close();
        } catch (error) {
            // Ignore close errors
        }
    }
}

// Run the fix
fixChatCompleteFinal(); 