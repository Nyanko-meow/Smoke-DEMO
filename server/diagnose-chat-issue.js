const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function diagnoseChatIssue() {
    console.log('🔍 DIAGNOSING CHAT ISSUE...\n');

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

        // 2. Test login
        console.log('\n2. Testing login...');
        let token;
        try {
            const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: 'member@example.com',
                password: '12345678@'
            }, { timeout: 10000 });

            if (loginResponse.data.success && loginResponse.data.token) {
                token = loginResponse.data.token;
                console.log('✅ Login successful');
                console.log('User ID:', loginResponse.data.user.UserID);
                console.log('Role:', loginResponse.data.user.Role);
            } else {
                console.log('❌ Login failed:', loginResponse.data.message);
                return;
            }
        } catch (error) {
            console.log('❌ Login error:', error.response?.data?.message || error.message);
            return;
        }

        // 3. Test chat debug endpoint
        console.log('\n3. Testing chat debug endpoint...');
        try {
            const debugResponse = await axios.get(
                `${BASE_URL}/api/chat/debug-user`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 10000
                }
            );
            console.log('✅ Debug endpoint works:', debugResponse.data);
        } catch (error) {
            console.log('❌ Debug endpoint failed:');
            console.log('Status:', error.response?.status);
            console.log('Message:', error.response?.data?.message || error.message);
            console.log('URL:', error.config?.url);
        }

        // 4. Test member conversation endpoint
        console.log('\n4. Testing member conversation endpoint...');
        try {
            const conversationResponse = await axios.get(
                `${BASE_URL}/api/chat/member/conversation`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 10000
                }
            );
            console.log('✅ Conversation endpoint works:', conversationResponse.data);
        } catch (error) {
            console.log('❌ Conversation endpoint failed:');
            console.log('Status:', error.response?.status);
            console.log('Message:', error.response?.data?.message || error.message);

            if (error.response?.status === 404) {
                console.log('\n🔧 404 Error - Need to create test data');
                console.log('Running fix script...');

                // Try to run fix script
                try {
                    const { spawn } = require('child_process');
                    const fixProcess = spawn('node', ['fix-chat-error.js'], {
                        cwd: __dirname,
                        stdio: 'inherit'
                    });

                    fixProcess.on('close', (code) => {
                        console.log(`Fix script completed with code: ${code}`);
                    });
                } catch (fixError) {
                    console.log('❌ Could not run fix script:', fixError.message);
                }
            }
        }

        // 5. Test send message endpoint
        console.log('\n5. Testing send message endpoint...');
        try {
            const sendResponse = await axios.post(
                `${BASE_URL}/api/chat/coach/chat/send`,
                {
                    content: 'Test message from diagnostic script - ' + new Date().toLocaleString()
                },
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 10000
                }
            );
            console.log('✅ Send message works:', sendResponse.data);
        } catch (error) {
            console.log('❌ Send message failed:');
            console.log('Status:', error.response?.status);
            console.log('Message:', error.response?.data?.message || error.message);
        }

        console.log('\n🎯 DIAGNOSIS COMPLETE');
        console.log('\n📋 NEXT STEPS:');
        console.log('1. If 404 errors: Run fix-chat-error.js to create test data');
        console.log('2. If 500 errors: Check database connection and SQL queries');
        console.log('3. If 401 errors: Check authentication middleware');
        console.log('4. If connection errors: Make sure server is running on port 4000');

    } catch (error) {
        console.error('❌ Diagnosis failed:', error.message);
    }
}

// Run diagnosis
diagnoseChatIssue(); 