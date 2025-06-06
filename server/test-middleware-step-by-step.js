const axios = require('axios');

async function testMiddlewareStepByStep() {
    try {
        console.log('🧪 Testing middleware step by step...');

        const baseURL = 'http://localhost:4000/api';

        // 1. Login as coach
        console.log('\n🔐 Step 1: Login as coach...');
        const loginResponse = await axios.post(`${baseURL}/coach/login`, {
            email: 'coach@example.com',
            password: 'H12345678@'
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed: ' + loginResponse.data.message);
        }

        const token = loginResponse.data.token;
        const user = loginResponse.data.user;

        console.log('✅ Login successful!');
        console.log('User role:', user.role);
        console.log('User ID:', user.id);

        // 2. Test a simple authenticated endpoint first
        console.log('\n🔍 Step 2: Test simple authenticated endpoint...');
        try {
            const response = await axios.get(`${baseURL}/coach/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Coach dashboard works - auth middleware is OK');
        } catch (error) {
            console.log('❌ Coach dashboard failed:', error.response?.status, error.response?.data?.message);
        }

        // 3. Test chat endpoint without auth (should get 401)
        console.log('\n🔍 Step 3: Test chat endpoint without auth...');
        try {
            const response = await axios.get(`${baseURL}/chat/coach/members`);
            console.log('❌ Unexpected success - should require auth');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly requires authentication');
            } else {
                console.log('❌ Unexpected error:', error.response?.status);
            }
        }

        // 4. Test chat endpoint with auth
        console.log('\n🔍 Step 4: Test chat endpoint with auth...');
        try {
            const response = await axios.get(`${baseURL}/chat/coach/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ SUCCESS! Chat endpoint works!');
            console.log('Response:', response.data);
        } catch (error) {
            console.log('❌ Chat endpoint failed:');
            console.log('Status:', error.response?.status);
            console.log('Message:', error.response?.data?.message);

            // If it's 403, let's check what the server logs show
            if (error.response?.status === 403) {
                console.log('\n🔍 403 Forbidden - checking server logs...');
                console.log('This means auth passed but authorization failed');
                console.log('Check server console for role authorization logs');
            }
        }

        console.log('\n🏁 Test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testMiddlewareStepByStep(); 