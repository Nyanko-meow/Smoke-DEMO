const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testDirectEndpoint() {
    try {
        console.log('🧪 Testing chat endpoints directly...');

        const baseURL = 'http://localhost:4000/api';
        const JWT_SECRET = 'smokeking_secret_key_ultra_secure_2024';

        // Create a valid JWT token for coach
        const payload = {
            id: 3,  // Coach UserID from database
            email: 'coach@example.com',
            role: 'coach'
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
        console.log('✅ Created test token for coach');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Test 1: GET /api/chat/coach/members
        console.log('\n📋 Testing GET /api/chat/coach/members...');

        try {
            const response = await axios.get(`${baseURL}/chat/coach/members`, {
                headers,
                timeout: 10000
            });

            console.log('✅ SUCCESS! Members endpoint works!');
            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(response.data, null, 2));

        } catch (error) {
            console.error('❌ Members endpoint failed:');
            console.error('Status:', error.response?.status);
            console.error('Status text:', error.response?.statusText);
            console.error('Response data:', error.response?.data);
            console.error('URL:', error.config?.url);
        }

        // Test 2: GET /api/chat/coach/conversations
        console.log('\n💬 Testing GET /api/chat/coach/conversations...');

        try {
            const response = await axios.get(`${baseURL}/chat/coach/conversations`, {
                headers,
                timeout: 10000
            });

            console.log('✅ SUCCESS! Conversations endpoint works!');
            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(response.data, null, 2));

        } catch (error) {
            console.error('❌ Conversations endpoint failed:');
            console.error('Status:', error.response?.status);
            console.error('Status text:', error.response?.statusText);
            console.error('Response data:', error.response?.data);
            console.error('URL:', error.config?.url);
        }

        console.log('\n🏁 Test completed!');

    } catch (error) {
        console.error('❌ Test setup failed:', error.message);
    }
}

testDirectEndpoint(); 