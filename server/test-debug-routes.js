const axios = require('axios');

async function testDebugRoutes() {
    try {
        console.log('🧪 Testing debug routes...');

        const baseURL = 'http://localhost:4000/api';

        // 1. Login as coach
        console.log('\n🔐 Login as coach...');
        const loginResponse = await axios.post(`${baseURL}/coach/login`, {
            email: 'coach@example.com',
            password: 'H12345678@'
        });

        const token = loginResponse.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        console.log('✅ Login successful!');

        // 2. Test auth only
        console.log('\n🔍 Test /api/chat/test-auth...');
        try {
            const response = await axios.get(`${baseURL}/chat/test-auth`, { headers });
            console.log('✅ Auth test works!');
            console.log('User:', response.data.user);
        } catch (error) {
            console.log('❌ Auth test failed:', error.response?.status, error.response?.data);
        }

        // 3. Test auth + authorization
        console.log('\n🔍 Test /api/chat/test-coach-auth...');
        try {
            const response = await axios.get(`${baseURL}/chat/test-coach-auth`, { headers });
            console.log('✅ Coach auth test works!');
            console.log('User:', response.data.user);
        } catch (error) {
            console.log('❌ Coach auth test failed:', error.response?.status, error.response?.data);
        }

        // 4. Test actual endpoint
        console.log('\n🔍 Test /api/chat/coach/members...');
        try {
            const response = await axios.get(`${baseURL}/chat/coach/members`, { headers });
            console.log('✅ Members endpoint works!');
            console.log('Data:', response.data);
        } catch (error) {
            console.log('❌ Members endpoint failed:', error.response?.status, error.response?.data);
        }

        console.log('\n🏁 Test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testDebugRoutes(); 