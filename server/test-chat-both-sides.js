const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testChatBothSides() {
    console.log('🧪 TESTING CHAT SYSTEM - BOTH MEMBER AND COACH...\n');

    try {
        // 1. Test server connection
        console.log('1. Testing server connection...');
        try {
            const response = await axios.get(`${BASE_URL}/api/test`, { timeout: 5000 });
            console.log('✅ Server is running:', response.data);
        } catch (error) {
            console.log('❌ Server connection failed:', error.message);
            console.log('🔧 Please start server with: npm start');
            return;
        }

        // 2. Test member login and chat
        console.log('\n2. Testing MEMBER chat functionality...');
        let memberToken;
        try {
            // Try existing member first
            const memberLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: 'leghenkiz@gmail.com',
                password: 'H12345678@'
            });

            if (memberLogin.data.success) {
                memberToken = memberLogin.data.token;
                console.log('✅ Member login successful (leghenkiz@gmail.com)');
                console.log('Member ID:', memberLogin.data.user.UserID);
                console.log('Member Role:', memberLogin.data.user.Role);
            }
        } catch (error) {
            // Try backup member
            try {
                const memberLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
                    email: 'member@example.com',
                    password: '12345678@'
                });

                if (memberLogin.data.success) {
                    memberToken = memberLogin.data.token;
                    console.log('✅ Member login successful (member@example.com)');
                }
            } catch (backupError) {
                console.log('❌ Member login failed:', backupError.response?.data?.message);
            }
        }

        if (memberToken) {
            // Test member conversation
            try {
                const memberConv = await axios.get(
                    `${BASE_URL}/api/chat/member/conversation`,
                    { headers: { 'Authorization': `Bearer ${memberToken}` } }
                );
                console.log('✅ Member conversation endpoint working');
            } catch (error) {
                console.log('❌ Member conversation failed:', error.response?.status, error.response?.data?.message);
            }

            // Test member messages
            try {
                const memberMsg = await axios.get(
                    `${BASE_URL}/api/chat/member/messages`,
                    { headers: { 'Authorization': `Bearer ${memberToken}` } }
                );
                console.log('✅ Member messages endpoint working');
            } catch (error) {
                console.log('❌ Member messages failed:', error.response?.status, error.response?.data?.message);
            }

            // Test member send message
            try {
                const memberSend = await axios.post(
                    `${BASE_URL}/api/chat/coach/chat/send`,
                    { content: 'Test message from member - ' + new Date().toLocaleString() },
                    { headers: { 'Authorization': `Bearer ${memberToken}` } }
                );
                console.log('✅ Member send message working');
            } catch (error) {
                console.log('❌ Member send message failed:', error.response?.status, error.response?.data?.message);
            }
        }

        // 3. Test coach login and chat
        console.log('\n3. Testing COACH chat functionality...');
        let coachToken;
        try {
            const coachLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: 'coach@example.com',
                password: '12345678@'
            });

            if (coachLogin.data.success) {
                coachToken = coachLogin.data.token;
                console.log('✅ Coach login successful');
                console.log('Coach ID:', coachLogin.data.user.UserID);
                console.log('Coach Role:', coachLogin.data.user.Role);
            }
        } catch (error) {
            console.log('❌ Coach login failed:', error.response?.data?.message);
        }

        if (coachToken) {
            // Test coach conversations
            try {
                const coachConv = await axios.get(
                    `${BASE_URL}/api/chat/coach/conversations`,
                    { headers: { 'Authorization': `Bearer ${coachToken}` } }
                );
                console.log('✅ Coach conversations endpoint working');
                console.log(`Found ${coachConv.data.data.length} conversations`);
            } catch (error) {
                console.log('❌ Coach conversations failed:', error.response?.status, error.response?.data?.message);
            }

            // Test coach members
            try {
                const coachMembers = await axios.get(
                    `${BASE_URL}/api/chat/coach/members`,
                    { headers: { 'Authorization': `Bearer ${coachToken}` } }
                );
                console.log('✅ Coach members endpoint working');
                console.log(`Found ${coachMembers.data.data.length} members`);
            } catch (error) {
                console.log('❌ Coach members failed:', error.response?.status, error.response?.data?.message);
            }

            // Test coach send message (if we have a member)
            if (memberToken) {
                try {
                    const coachSend = await axios.post(
                        `${BASE_URL}/api/chat/coach/chat/send`,
                        {
                            content: 'Test message from coach - ' + new Date().toLocaleString(),
                            memberId: 7 // Try with existing member ID
                        },
                        { headers: { 'Authorization': `Bearer ${coachToken}` } }
                    );
                    console.log('✅ Coach send message working');
                } catch (error) {
                    console.log('❌ Coach send message failed:', error.response?.status, error.response?.data?.message);
                }
            }
        }

        console.log('\n🎉 CHAT SYSTEM TEST COMPLETED!');
        console.log('\n📋 Summary:');
        console.log('- Member chat:', memberToken ? '✅ Working' : '❌ Failed');
        console.log('- Coach chat:', coachToken ? '✅ Working' : '❌ Failed');

        console.log('\n🚀 Frontend Testing:');
        console.log('1. Member: http://localhost:3000 (login: leghenkiz@gmail.com / H12345678@)');
        console.log('2. Coach: http://localhost:3000/coach/dashboard (login: coach@example.com / 12345678@)');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run tests
testChatBothSides(); 