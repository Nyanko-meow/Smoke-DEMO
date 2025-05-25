const axios = require('axios');

async function testChatAPI() {
    try {
        console.log('🧪 Testing Chat API endpoints...');

        const baseURL = 'http://localhost:4000/api';

        // First, let's get a valid coach token by logging in
        console.log('🔐 Getting coach authentication token...');

        const loginResponse = await axios.post(`${baseURL}/coach/login`, {
            email: 'coach@example.com',
            password: 'H12345678@'
        });

        if (!loginResponse.data.success) {
            throw new Error('Coach login failed: ' + loginResponse.data.message);
        }

        const token = loginResponse.data.token;
        console.log('✅ Coach login successful');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Get coach members
        console.log('\n📋 Testing GET /api/chat/coach/members...');

        try {
            const membersResponse = await axios.get(`${baseURL}/chat/coach/members`, { headers });

            console.log('✅ Members endpoint works!');
            console.log(`📊 Found ${membersResponse.data.data.length} members:`);

            membersResponse.data.data.forEach((member, index) => {
                console.log(`   ${index + 1}. ${member.FullName} (${member.Email}) - ${member.Role}`);
                console.log(`      Has conversation: ${member.HasConversation ? 'Yes' : 'No'}`);
                console.log(`      Quit plan: ${member.QuitPlanStatus || 'None'}`);
            });

        } catch (error) {
            console.error('❌ Members endpoint failed:', error.response?.data || error.message);
        }

        // Test 2: Get coach conversations
        console.log('\n💬 Testing GET /api/chat/coach/conversations...');

        try {
            const conversationsResponse = await axios.get(`${baseURL}/chat/coach/conversations`, { headers });

            console.log('✅ Conversations endpoint works!');
            console.log(`📊 Found ${conversationsResponse.data.data.length} conversations:`);

            conversationsResponse.data.data.forEach((conv, index) => {
                console.log(`   ${index + 1}. ${conv.MemberName} (${conv.MemberEmail})`);
                console.log(`      Last message: "${conv.LastMessageContent?.substring(0, 50)}..."`);
                console.log(`      Unread: ${conv.UnreadCount}`);
            });

        } catch (error) {
            console.error('❌ Conversations endpoint failed:', error.response?.data || error.message);
        }

        // Test 3: Check database connection
        console.log('\n🔍 Testing database directly...');

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

        await sql.connect(config);

        const users = await sql.query`
            SELECT UserID, Email, FirstName, LastName, Role, IsActive
            FROM Users
            WHERE Role IN ('coach', 'member', 'guest') AND IsActive = 1
        `;

        console.log(`🗃️  Database connection works! Found ${users.recordset.length} active users:`);
        users.recordset.forEach(user => {
            console.log(`   ${user.Role}: ${user.Email} (ID: ${user.UserID})`);
        });

        await sql.close();

        console.log('\n✅ All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Details:', error.response?.data || error.stack);
    }
}

testChatAPI(); 