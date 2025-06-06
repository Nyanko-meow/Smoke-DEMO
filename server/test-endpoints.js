const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testEndpoints() {
    console.log('🧪 Testing Chat Endpoints...\n');

    try {
        // 1. Test basic endpoint
        console.log('1. Testing basic endpoint...');
        const basicTest = await axios.get(`${BASE_URL}/api/chat/test`);
        console.log('✅ Basic test:', basicTest.data.message);

        // 2. Test login to get tokens
        console.log('\n2. Getting tokens...');
        const memberLogin = await axios.post(`${BASE_URL}/api/test-login`, {
            email: 'leghenkiz@gmail.com',
            password: 'H12345678@'
        });

        const coachLogin = await axios.post(`${BASE_URL}/api/test-login`, {
            email: 'coach@smokeking.com',
            password: 'coach123'
        });

        const memberToken = memberLogin.data.token;
        const coachToken = coachLogin.data.token;
        console.log('✅ Got tokens');

        // 3. Test debug-user endpoint
        console.log('\n3. Testing debug-user endpoint...');
        try {
            const debugTest = await axios.get(`${BASE_URL}/api/chat/debug-user`, {
                headers: { 'Authorization': `Bearer ${memberToken}` }
            });
            console.log('✅ Debug user:', debugTest.data.message);
        } catch (error) {
            console.log('❌ Debug user failed:', error.response?.status);
        }

        // 4. Test member/conversation endpoint
        console.log('\n4. Testing member/conversation endpoint...');
        try {
            const convTest = await axios.get(`${BASE_URL}/api/chat/member/conversation`, {
                headers: { 'Authorization': `Bearer ${memberToken}` }
            });
            console.log('✅ Member conversation:', convTest.data.message || 'Success');
        } catch (error) {
            console.log('❌ Member conversation failed:', error.response?.status);
        }

        // 5. Test member messages
        console.log('\n5. Testing member messages...');
        try {
            const messagesTest = await axios.get(`${BASE_URL}/api/chat/member/messages`, {
                headers: { 'Authorization': `Bearer ${memberToken}` }
            });
            console.log('✅ Member messages:', messagesTest.data.data?.length || 0, 'messages');
        } catch (error) {
            console.log('❌ Member messages failed:', error.response?.status);
        }

        // 6. Test coach conversations
        console.log('\n6. Testing coach conversations...');
        try {
            const coachConvTest = await axios.get(`${BASE_URL}/api/chat/coach/conversations`, {
                headers: { 'Authorization': `Bearer ${coachToken}` }
            });
            console.log('✅ Coach conversations:', coachConvTest.data.data?.length || 0, 'conversations');
        } catch (error) {
            console.log('❌ Coach conversations failed:', error.response?.status);
        }

        console.log('\n🎉 All endpoints tested!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testEndpoints(); 