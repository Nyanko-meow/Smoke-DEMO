const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testChatMessagesFix() {
    try {
        console.log('🧪 Testing Chat Messages Fix...\n');

        // 1. Login as member
        console.log('1. Logging in as member...');
        const memberLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'member@example.com',
            password: '12345678'
        });

        const memberToken = memberLogin.data.token;
        console.log('✅ Member logged in successfully');

        // 2. Test member messages API
        console.log('\n2. Testing member messages API...');
        try {
            const messagesResponse = await axios.get(`${BASE_URL}/api/chat/member/messages`, {
                headers: {
                    'Authorization': `Bearer ${memberToken}`
                }
            });

            console.log('✅ Member messages API response:');
            console.log('- Success:', messagesResponse.data.success);
            console.log('- Messages count:', messagesResponse.data.data?.length || 0);

            if (messagesResponse.data.data && messagesResponse.data.data.length > 0) {
                console.log('- Sample message format:');
                const sampleMessage = messagesResponse.data.data[0];
                console.log('  * MessageID:', sampleMessage.MessageID);
                console.log('  * SenderID:', sampleMessage.SenderID);
                console.log('  * Content:', sampleMessage.Content);
                console.log('  * SenderName:', sampleMessage.SenderName);
                console.log('  * CreatedAt:', sampleMessage.CreatedAt);
            }

        } catch (error) {
            console.log('❌ Member messages API failed:');
            console.log('- Status:', error.response?.status);
            console.log('- Message:', error.response?.data?.message);
            console.log('- Error:', error.message);
        }

        // 3. Test sending a message
        console.log('\n3. Testing send message...');
        try {
            const sendResponse = await axios.post(`${BASE_URL}/api/chat/coach/chat/send`, {
                content: `Test message from member at ${new Date().toLocaleString()}`
            }, {
                headers: {
                    'Authorization': `Bearer ${memberToken}`
                }
            });

            console.log('✅ Message sent successfully:');
            console.log('- Success:', sendResponse.data.success);
            console.log('- Message:', sendResponse.data.message);

        } catch (error) {
            console.log('❌ Send message failed:');
            console.log('- Status:', error.response?.status);
            console.log('- Message:', error.response?.data?.message);
            console.log('- Error:', error.message);
        }

        // 4. Test getting messages again to see the new message
        console.log('\n4. Testing messages after sending...');
        try {
            const updatedMessagesResponse = await axios.get(`${BASE_URL}/api/chat/member/messages`, {
                headers: {
                    'Authorization': `Bearer ${memberToken}`
                }
            });

            console.log('✅ Updated messages:');
            console.log('- Messages count:', updatedMessagesResponse.data.data?.length || 0);

            if (updatedMessagesResponse.data.data && updatedMessagesResponse.data.data.length > 0) {
                console.log('- Latest message:');
                const latestMessage = updatedMessagesResponse.data.data[updatedMessagesResponse.data.data.length - 1];
                console.log('  * Content:', latestMessage.Content);
                console.log('  * SenderName:', latestMessage.SenderName);
                console.log('  * CreatedAt:', latestMessage.CreatedAt);
            }

        } catch (error) {
            console.log('❌ Updated messages failed:');
            console.log('- Status:', error.response?.status);
            console.log('- Message:', error.response?.data?.message);
        }

        // 5. Login as coach and test
        console.log('\n5. Testing coach login and messages...');
        try {
            const coachLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: 'coach@example.com',
                password: '12345678'
            });

            const coachToken = coachLogin.data.token;
            console.log('✅ Coach logged in successfully');

            // Test coach conversations
            const conversationsResponse = await axios.get(`${BASE_URL}/api/chat/coach/conversations`, {
                headers: {
                    'Authorization': `Bearer ${coachToken}`
                }
            });

            console.log('✅ Coach conversations:');
            console.log('- Conversations count:', conversationsResponse.data.data?.length || 0);

        } catch (error) {
            console.log('❌ Coach test failed:');
            console.log('- Status:', error.response?.status);
            console.log('- Message:', error.response?.data?.message);
        }

        console.log('\n🎉 Chat messages test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testChatMessagesFix(); 