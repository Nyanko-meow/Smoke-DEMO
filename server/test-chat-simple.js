const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testChat() {
    try {
        console.log('🧪 Testing Chat API...');

        // 1. Get fresh tokens
        console.log('\n1. Getting tokens...');

        const coachLogin = await axios.post(`${BASE_URL}/api/test-login`, {
            email: 'coach@smokeking.com',
            password: 'coach123'
        });

        const memberLogin = await axios.post(`${BASE_URL}/api/test-login`, {
            email: 'leghenkiz@gmail.com',
            password: 'H12345678@'
        });

        const coachToken = coachLogin.data.token;
        const memberToken = memberLogin.data.token;

        console.log('✅ Got tokens');

        // 2. Test coach conversations
        console.log('\n2. Testing coach conversations...');

        try {
            const conversations = await axios.get(`${BASE_URL}/api/chat/coach/conversations`, {
                headers: { 'Authorization': `Bearer ${coachToken}` }
            });
            console.log('✅ Coach conversations:', conversations.data.data?.length || 0, 'conversations');
        } catch (error) {
            console.log('❌ Coach conversations failed:', error.response?.data?.message || error.message);
        }

        // 3. Test member messages
        console.log('\n3. Testing member messages...');

        try {
            const messages = await axios.get(`${BASE_URL}/api/chat/member/messages`, {
                headers: { 'Authorization': `Bearer ${memberToken}` }
            });
            console.log('✅ Member messages:', messages.data.data?.length || 0, 'messages');
        } catch (error) {
            console.log('❌ Member messages failed:', error.response?.data?.message || error.message);
        }

        // 4. Test sending message as member
        console.log('\n4. Testing send message as member...');

        try {
            const sendResult = await axios.post(`${BASE_URL}/api/chat/coach/chat/send`, {
                content: 'Test message from member ' + new Date().toISOString()
            }, {
                headers: { 'Authorization': `Bearer ${memberToken}` }
            });
            console.log('✅ Member send message:', sendResult.data.message);
        } catch (error) {
            console.log('❌ Member send failed:', error.response?.data?.message || error.message);
            console.log('❌ Error details:', error.response?.status, error.response?.data);
        }

        // 5. Test sending message as coach
        console.log('\n5. Testing send message as coach...');

        try {
            const sendResult = await axios.post(`${BASE_URL}/api/chat/coach/chat/send`, {
                content: 'Test message from coach ' + new Date().toISOString(),
                memberId: 2 // Test user ID
            }, {
                headers: { 'Authorization': `Bearer ${coachToken}` }
            });
            console.log('✅ Coach send message:', sendResult.data.message);
        } catch (error) {
            console.log('❌ Coach send failed:', error.response?.data?.message || error.message);
            console.log('❌ Error details:', error.response?.status, error.response?.data);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testChat(); 