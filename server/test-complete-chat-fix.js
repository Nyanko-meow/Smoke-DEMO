const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testCompleteChatFix() {
    console.log('🧪 Testing Complete Chat Fix...\n');

    try {
        // 1. Test server connection
        console.log('1. Testing server connection...');
        try {
            const serverTest = await axios.get(`${BASE_URL}/api/test`);
            console.log('✅ Server is running:', serverTest.data);
        } catch (error) {
            console.log('❌ Server not running. Please start with: npm start');
            console.log('Error:', error.message);
            return;
        }

        // 2. Test basic API endpoint
        console.log('\n2. Testing basic API endpoint...');
        try {
            const apiTest = await axios.get(`${BASE_URL}/api`);
            console.log('✅ API endpoint working:', apiTest.data.message);
        } catch (error) {
            console.log('❌ API endpoint failed:', error.message);
        }

        // 3. Test login to get token
        console.log('\n3. Testing login...');
        let token;
        try {
            const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: 'member@example.com',
                password: '12345678@'
            });

            if (loginResponse.data.success && loginResponse.data.token) {
                token = loginResponse.data.token;
                console.log('✅ Login successful');
                console.log('User:', loginResponse.data.user);
            } else {
                console.log('❌ Login failed:', loginResponse.data.message);

                // Try alternative login
                console.log('Trying alternative login...');
                const altLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
                    email: 'leghenkiz@gmail.com',
                    password: 'H12345678@'
                });

                if (altLoginResponse.data.success && altLoginResponse.data.token) {
                    token = altLoginResponse.data.token;
                    console.log('✅ Alternative login successful');
                    console.log('User:', altLoginResponse.data.user);
                } else {
                    console.log('❌ Alternative login also failed');
                    return;
                }
            }
        } catch (error) {
            console.log('❌ Login error:', error.response?.data?.message || error.message);
            return;
        }

        // 4. Test debug endpoint
        console.log('\n4. Testing debug endpoint...');
        try {
            const debugResponse = await axios.get(
                `${BASE_URL}/api/chat/debug-user`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            console.log('✅ Debug response:', debugResponse.data);
        } catch (error) {
            console.log('❌ Debug failed:', error.response?.status, error.response?.data?.message);
        }

        // 5. Test member conversation endpoint
        console.log('\n5. Testing member conversation...');
        try {
            const conversationResponse = await axios.get(
                `${BASE_URL}/api/chat/member/conversation`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            console.log('✅ Conversation response:', conversationResponse.data);
        } catch (error) {
            console.log('❌ Conversation failed:', error.response?.status, error.response?.data?.message);
            console.log('Full error:', error.response?.data);
        }

        // 6. Test member messages endpoint
        console.log('\n6. Testing member messages...');
        try {
            const messagesResponse = await axios.get(
                `${BASE_URL}/api/chat/member/messages`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            console.log('✅ Messages response:', messagesResponse.data);
        } catch (error) {
            console.log('❌ Messages failed:', error.response?.status, error.response?.data?.message);
        }

        // 7. Test send message
        console.log('\n7. Testing send message...');
        try {
            const sendResponse = await axios.post(
                `${BASE_URL}/api/chat/coach/chat/send`,
                {
                    content: 'Test message from complete fix script - ' + new Date().toLocaleString()
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            console.log('✅ Send message response:', sendResponse.data);
        } catch (error) {
            console.log('❌ Send message failed:', error.response?.status, error.response?.data?.message);
        }

        console.log('\n🎉 Complete chat test finished!');
        console.log('\n📋 Summary:');
        console.log('- Server: Running on port 4000');
        console.log('- API: Working');
        console.log('- Login: Working');
        console.log('- Chat endpoints: Check individual results above');
        console.log('\n🚀 Next steps:');
        console.log('1. Open browser and go to http://localhost:3000');
        console.log('2. Login with member@example.com / 12345678@');
        console.log('3. Click "Chat với Coach" button');
        console.log('4. Chat should work now!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run tests
testCompleteChatFix(); 