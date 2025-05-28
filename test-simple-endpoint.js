const axios = require('axios');

async function testSimpleEndpoint() {
    try {
        console.log('🧪 Testing simple endpoint...');

        // First, login as coach to get token
        const loginResponse = await axios.post('http://localhost:4000/api/coach/login', {
            email: 'coach@smokeking.com',
            password: 'coach123'
        }, {
            withCredentials: true
        });

        if (!loginResponse.data.success) {
            console.error('❌ Login failed:', loginResponse.data.message);
            return;
        }

        console.log('✅ Login successful');
        const token = loginResponse.data.token;

        // Test the simple endpoint
        const testData = {
            firstName: 'SimpleTest',
            lastName: 'Working'
        };

        console.log('📤 Sending request to /profile-test...');

        const testResponse = await axios.put('http://localhost:4000/api/coach/profile-test', testData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });

        if (testResponse.data.success) {
            console.log('✅ Simple endpoint test successful!');
            console.log('Response:', testResponse.data);
        } else {
            console.log('❌ Simple endpoint test failed:', testResponse.data.message);
        }

        // Now test the original endpoint
        console.log('\n📤 Testing original /profile endpoint...');

        const originalTestData = {
            firstName: 'OriginalTest',
            lastName: 'Working'
        };

        const originalResponse = await axios.put('http://localhost:4000/api/coach/profile', originalTestData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });

        if (originalResponse.data.success) {
            console.log('✅ Original endpoint test successful!');
            console.log('Response:', originalResponse.data);
        } else {
            console.log('❌ Original endpoint test failed:', originalResponse.data.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);

        if (error.response?.data?.error) {
            console.error('Server error details:', error.response.data.error);
        }
    }
}

// Run test
testSimpleEndpoint(); 