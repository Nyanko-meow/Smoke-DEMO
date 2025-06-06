const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testChatFix() {
    console.log('🧪 TESTING CHAT FIX...\n');

    try {
        // Test 1: Login as coach
        console.log('1. Testing coach login...');
        const coachLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'coach@example.com',
            password: 'H12345678@'
        });

        if (!coachLogin.data.success) {
            throw new Error('Coach login failed');
        }

        const coachToken = coachLogin.data.token;
        console.log('✅ Coach login successful');

        // Test 2: Login as member
        console.log('\n2. Testing member login...');
        const memberLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'member@example.com',
            password: 'H12345678@'
        });

        if (!memberLogin.data.success) {
            throw new Error('Member login failed');
        }

        const memberToken = memberLogin.data.token;
        console.log('✅ Member login successful');

        // Test 3: Coach gets conversations
        console.log('\n3. Testing coach getting conversations...');
        const coachConversations = await axios.get(
            `${BASE_URL}/api/chat/coach/conversations`,
            {
                headers: {
                    'Authorization': `Bearer ${coachToken}`
                }
            }
        );
        console.log('✅ Coach conversations:', coachConversations.data.data.length, 'conversations found');

        // Test 4: If no conversations, create one
        let conversationId;
        if (coachConversations.data.data.length === 0) {
            console.log('\n4. Creating conversation between coach and member...');
            const createConv = await axios.post(
                `${BASE_URL}/api/chat/coach/start-conversation`,
                {
                    memberId: 2 // Member ID from schema
                },
                {
                    headers: {
                        'Authorization': `Bearer ${coachToken}`
                    }
                }
            );
            conversationId = createConv.data.data.conversationId;
            console.log('✅ Conversation created:', conversationId);
        } else {
            conversationId = coachConversations.data.data[0].ConversationID;
            console.log('\n4. Using existing conversation:', conversationId);
        }

        // Test 5: Coach sends message using new endpoint
        console.log('\n5. Testing coach sending message via conversation endpoint...');
        const coachMessage = await axios.post(
            `${BASE_URL}/api/chat/conversation/${conversationId}/send`,
            {
                content: 'Test message from coach via new endpoint - ' + new Date().toLocaleString()
            },
            {
                headers: {
                    'Authorization': `Bearer ${coachToken}`
                }
            }
        );
        console.log('✅ Coach message sent via conversation endpoint');

        // Test 6: Get messages via conversation endpoint
        console.log('\n6. Testing getting messages via conversation endpoint...');
        const conversationMessages = await axios.get(
            `${BASE_URL}/api/chat/conversation/${conversationId}/messages`,
            {
                headers: {
                    'Authorization': `Bearer ${coachToken}`
                }
            }
        );
        console.log('✅ Messages retrieved via conversation endpoint:', conversationMessages.data.data.length, 'messages');

        // Test 7: Member sends message
        console.log('\n7. Testing member sending message...');
        const memberMessage = await axios.post(
            `${BASE_URL}/api/chat/coach/chat/send`,
            {
                content: 'Test reply from member - ' + new Date().toLocaleString()
            },
            {
                headers: {
                    'Authorization': `Bearer ${memberToken}`
                }
            }
        );
        console.log('✅ Member message sent');

        // Test 8: Coach gets updated messages
        console.log('\n8. Testing coach getting updated messages...');
        const updatedMessages = await axios.get(
            `${BASE_URL}/api/chat/conversation/${conversationId}/messages`,
            {
                headers: {
                    'Authorization': `Bearer ${coachToken}`
                }
            }
        );
        console.log('✅ Updated messages retrieved:', updatedMessages.data.data.length, 'messages');

        console.log('\n🎉 ALL CHAT TESTS PASSED!');
        console.log('\n📋 Summary:');
        console.log('- Coach login: ✅');
        console.log('- Member login: ✅');
        console.log('- Coach conversations: ✅');
        console.log('- Conversation creation: ✅');
        console.log('- Coach send via conversation: ✅');
        console.log('- Get messages via conversation: ✅');
        console.log('- Member send message: ✅');
        console.log('- Updated messages: ✅');

        console.log('\n🚀 Frontend should now work properly!');
        console.log('Coach can now reply to members by clicking on conversations.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status === 404) {
            console.log('\n💡 Tip: Make sure the server is running on port 4000');
        }
    }
}

testChatFix(); 