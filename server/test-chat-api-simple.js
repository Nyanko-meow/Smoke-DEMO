const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Test data
const memberToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoibWVtYmVyQGV4YW1wbGUuY29tIiwicm9sZSI6Im1lbWJlciIsImlhdCI6MTczNDUxNzE5NCwiZXhwIjoxNzM0NjAzNTk0fQ.example'; // Replace with actual token
const coachToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoiY29hY2hAZXhhbXBsZS5jb20iLCJyb2xlIjoiY29hY2giLCJpYXQiOjE3MzQ1MTcxOTQsImV4cCI6MTczNDYwMzU5NH0.example'; // Replace with actual token

async function testChatAPI() {
    console.log('🧪 Testing Chat API...\n');

    try {
        // Test 1: Member sends message to coach
        console.log('1. Testing member sending message to coach...');
        const memberMessage = await axios.post(
            `${BASE_URL}/api/chat/coach/chat/send`,
            {
                content: 'Hello coach! I need help with my quit plan.'
            },
            {
                headers: {
                    'Authorization': `Bearer ${memberToken}`
                }
            }
        );
        console.log('✅ Member message sent:', memberMessage.data);

        // Test 2: Member gets conversation
        console.log('\n2. Testing member getting conversation...');
        const memberConversation = await axios.get(
            `${BASE_URL}/api/chat/member/conversation`,
            {
                headers: {
                    'Authorization': `Bearer ${memberToken}`
                }
            }
        );
        console.log('✅ Member conversation:', memberConversation.data);

        // Test 3: Member gets messages
        console.log('\n3. Testing member getting messages...');
        const memberMessages = await axios.get(
            `${BASE_URL}/api/chat/member/messages`,
            {
                headers: {
                    'Authorization': `Bearer ${memberToken}`
                }
            }
        );
        console.log('✅ Member messages:', memberMessages.data);

        // Test 4: Coach gets conversations
        console.log('\n4. Testing coach getting conversations...');
        const coachConversations = await axios.get(
            `${BASE_URL}/api/chat/coach/conversations`,
            {
                headers: {
                    'Authorization': `Bearer ${coachToken}`
                }
            }
        );
        console.log('✅ Coach conversations:', coachConversations.data);

        // Test 5: Coach sends message to member
        console.log('\n5. Testing coach sending message to member...');
        const coachMessage = await axios.post(
            `${BASE_URL}/api/chat/coach/chat/send`,
            {
                content: 'Hi! I\'m here to help you. Let\'s work on your quit plan together.',
                memberId: 2 // Member ID
            },
            {
                headers: {
                    'Authorization': `Bearer ${coachToken}`
                }
            }
        );
        console.log('✅ Coach message sent:', coachMessage.data);

        console.log('\n🎉 All tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run tests
testChatAPI(); 