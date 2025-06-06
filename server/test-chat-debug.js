const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Test tokens (you'll need to get these from login)
const COACH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJjb2FjaEBzbW9rZWtpbmcuY29tIiwicm9sZSI6ImNvYWNoIiwiaWF0IjoxNzM0NzY5NzE5LCJleHAiOjE3MzQ4NTYxMTl9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // Replace with actual token
const MEMBER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJsZWdoZW5raXpAZ21haWwuY29tIiwicm9sZSI6Imd1ZXN0IiwiaWF0IjoxNzM0NzY5NzE5LCJleHAiOjE3MzQ4NTYxMTl9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // Replace with actual token

async function testChatAPI() {
    console.log('🧪 Testing Chat API...\n');

    try {
        // 1. Test auth endpoints first
        console.log('1. Testing authentication...');

        try {
            const authTest = await axios.get(`${BASE_URL}/api/chat/test-auth`, {
                headers: { 'Authorization': `Bearer ${COACH_TOKEN}` }
            });
            console.log('✅ Coach auth test:', authTest.data);
        } catch (error) {
            console.log('❌ Coach auth failed:', error.response?.data || error.message);
        }

        // 2. Test coach conversations list
        console.log('\n2. Testing coach conversations...');

        try {
            const conversations = await axios.get(`${BASE_URL}/api/chat/coach/conversations`, {
                headers: { 'Authorization': `Bearer ${COACH_TOKEN}` }
            });
            console.log('✅ Coach conversations:', conversations.data);

            if (conversations.data.data && conversations.data.data.length > 0) {
                const conversationId = conversations.data.data[0].ConversationID;
                console.log('📋 Using conversation ID:', conversationId);

                // 3. Test conversation messages
                console.log('\n3. Testing conversation messages...');

                try {
                    const messages = await axios.get(`${BASE_URL}/api/chat/conversation/${conversationId}/messages`, {
                        headers: { 'Authorization': `Bearer ${COACH_TOKEN}` }
                    });
                    console.log('✅ Conversation messages:', messages.data);
                } catch (error) {
                    console.log('❌ Conversation messages failed:', error.response?.data || error.message);
                    console.log('❌ Error details:', error.response?.status, error.response?.statusText);
                }
            }
        } catch (error) {
            console.log('❌ Coach conversations failed:', error.response?.data || error.message);
        }

        // 4. Test member messages
        console.log('\n4. Testing member messages...');

        try {
            const memberMessages = await axios.get(`${BASE_URL}/api/chat/member/messages`, {
                headers: { 'Authorization': `Bearer ${MEMBER_TOKEN}` }
            });
            console.log('✅ Member messages:', memberMessages.data);
        } catch (error) {
            console.log('❌ Member messages failed:', error.response?.data || error.message);
        }

        // 5. Test database connection
        console.log('\n5. Testing database...');

        try {
            const dbTest = await axios.get(`${BASE_URL}/api/test`);
            console.log('✅ Database test:', dbTest.data);
        } catch (error) {
            console.log('❌ Database test failed:', error.response?.data || error.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Helper function to get fresh tokens
async function getTokens() {
    console.log('🔑 Getting fresh tokens...\n');

    try {
        // Login as coach
        const coachLogin = await axios.post(`${BASE_URL}/api/test-login`, {
            email: 'coach@smokeking.com',
            password: 'coach123'
        });
        console.log('✅ Coach login:', coachLogin.data.user);
        console.log('🎫 Coach token:', coachLogin.data.token);

        // Login as member
        const memberLogin = await axios.post(`${BASE_URL}/api/test-login`, {
            email: 'leghenkiz@gmail.com',
            password: 'H12345678@'
        });
        console.log('✅ Member login:', memberLogin.data.user);
        console.log('🎫 Member token:', memberLogin.data.token);

        return {
            coachToken: coachLogin.data.token,
            memberToken: memberLogin.data.token
        };
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return null;
    }
}

// Run the test
async function main() {
    console.log('🚀 Starting Chat API Debug Test\n');

    // First get fresh tokens
    const tokens = await getTokens();

    if (tokens) {
        // Update tokens and test
        console.log('\n' + '='.repeat(50));
        console.log('Testing with fresh tokens...');
        console.log('='.repeat(50) + '\n');

        // Replace the tokens in the script
        global.COACH_TOKEN = tokens.coachToken;
        global.MEMBER_TOKEN = tokens.memberToken;

        await testChatAPI();
    } else {
        console.log('❌ Could not get tokens, testing with default tokens...');
        await testChatAPI();
    }
}

main().catch(console.error); 