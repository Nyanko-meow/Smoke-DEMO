const axios = require('axios');

async function testSimple() {
    try {
        console.log('🧪 Testing simple endpoints...');

        const baseURL = 'http://localhost:4000';

        // Test 1: Root endpoint
        console.log('\n🏠 Testing root endpoint...');
        try {
            const response = await axios.get(`${baseURL}/`);
            console.log('✅ Root endpoint works!');
            console.log('Response:', response.data);
        } catch (error) {
            console.error('❌ Root endpoint failed:', error.message);
        }

        // Test 2: API endpoint
        console.log('\n📡 Testing /api endpoint...');
        try {
            const response = await axios.get(`${baseURL}/api`);
            console.log('✅ API endpoint works!');
            console.log('Available endpoints:', response.data.endpoints);
        } catch (error) {
            console.error('❌ API endpoint failed:', error.message);
        }

        // Test 3: Chat routes without auth
        console.log('\n💬 Testing chat routes (should fail with 401)...');
        try {
            const response = await axios.get(`${baseURL}/api/chat/coach/members`);
            console.log('❌ Unexpected success - should require auth');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Chat endpoint correctly requires authentication');
            } else if (error.response?.status === 404) {
                console.log('❌ Chat endpoint not found (404) - route not registered');
            } else {
                console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
            }
        }

        console.log('\n🏁 Simple test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSimple(); 