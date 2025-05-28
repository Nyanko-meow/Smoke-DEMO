const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:4000';
const TEST_TOKEN = 'YOUR_TOKEN_HERE'; // Thay bằng token thực tế

// Test data
const testData = {
    receiverId: 3, // ID của coach
    appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Ngày mai
    duration: 30,
    type: 'chat',
    notes: 'Test appointment from script'
};

async function testAppointmentAPI() {
    console.log('🧪 Testing Appointment API...');
    console.log('📋 Test data:', testData);

    try {
        const response = await axios.post(`${BASE_URL}/api/chat/appointment`, testData, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Success Response:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('❌ Error Response:');
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Message:', error.message);
    }
}

async function testChatMessagesAPI() {
    console.log('\n🧪 Testing Chat Messages API...');

    try {
        const response = await axios.get(`${BASE_URL}/api/chat/member/messages`, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`
            }
        });

        console.log('✅ Messages Success:');
        console.log('Status:', response.status);
        console.log('Message count:', response.data.data?.length || 0);

    } catch (error) {
        console.error('❌ Messages Error:');
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    }
}

async function runTests() {
    console.log('🚀 Starting API Tests...\n');

    if (TEST_TOKEN === 'YOUR_TOKEN_HERE') {
        console.log('⚠️  Please update TEST_TOKEN with a real token');
        return;
    }

    await testChatMessagesAPI();
    await testAppointmentAPI();

    console.log('\n✨ Tests completed!');
}

// Uncomment to run tests
// runTests();

module.exports = { testAppointmentAPI, testChatMessagesAPI, runTests }; 