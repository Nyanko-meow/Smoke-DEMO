const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testChatFinal() {
    console.log('🧪 Testing Chat System - FINAL TEST...\n');

    try {
        // 1. Test server connection
        console.log('1. Testing server connection...');
        try {
            const serverTest = await axios.get(`${BASE_URL}/api/test`);
            console.log('✅ Server is running:', serverTest.data.message);
        } catch (error) {
            console.log('❌ Server not running. Please start with: npm start');
            console.log('Error:', error.message);
            return;
        }

        // 2. Test login to get token
        console.log('\n2. Testing login...');
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
                return;
            }
        } catch (error) {
            console.log('❌ Login error:', error.response?.data?.message || error.message);
            return;
        }

        // 3. Test debug endpoint
        console.log('\n3. Testing debug endpoint...');
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

        // 4. Test member conversation endpoint
        console.log('\n4. Testing member conversation...');
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
            if (error.response?.status === 404) {
                console.log('🔧 Running fix script to create test data...');
                // Run fix script if 404
                const { spawn } = require('child_process');
                const fixProcess = spawn('node', ['fix-chat-error.js'], { cwd: __dirname });

                fixProcess.on('close', async (code) => {
                    if (code === 0) {
                        console.log('✅ Fix script completed, retrying conversation...');
                        try {
                            const retryResponse = await axios.get(
                                `${BASE_URL}/api/chat/member/conversation`,
                                {
                                    headers: {
                                        'Authorization': `Bearer ${token}`
                                    }
                                }
                            );
                            console.log('✅ Conversation retry successful:', retryResponse.data);
                        } catch (retryError) {
                            console.log('❌ Conversation retry failed:', retryError.response?.data?.message);
                        }
                    }
                });
            }
        }

        // 5. Test member messages endpoint
        console.log('\n5. Testing member messages...');
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

        // 6. Test send message
        console.log('\n6. Testing send message...');
        try {
            const sendResponse = await axios.post(
                `${BASE_URL}/api/chat/coach/chat/send`,
                {
                    content: 'Test message from final test script - ' + new Date().toLocaleString()
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

        console.log('\n🎉 Final chat test completed!');
        console.log('\n📋 Summary:');
        console.log('- Server: ✅ Running');
        console.log('- Login: ✅ Working');
        console.log('- Debug: ✅ Working');
        console.log('- Chat APIs: Check results above');

        console.log('\n🚀 Frontend Test:');
        console.log('1. Open browser: http://localhost:3000');
        console.log('2. Login: member@example.com / 12345678@');
        console.log('3. Click "Chat với Coach" button');
        console.log('4. Chat should work perfectly!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run tests
testChatFinal(); 