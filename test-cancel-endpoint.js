const axios = require('axios');

async function testCancelEndpoint() {
    try {
        console.log('🔍 Testing cancel membership endpoint...');

        // Test if server is running
        const healthCheck = await axios.get('http://localhost:4000/api/test');
        console.log('✅ Server is running:', healthCheck.data);

        // Test cancel endpoint (should get 401 without token)
        try {
            const response = await axios.put('http://localhost:4000/api/membership/cancel', {
                bankAccountNumber: '123456789',
                bankName: 'Test Bank',
                accountHolderName: 'Test User'
            });
            console.log('❌ Unexpected success:', response.data);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Cancel endpoint exists and requires authentication (401)');
                console.log('   Response:', error.response.data);
            } else if (error.response && error.response.status === 404) {
                console.log('❌ Cancel endpoint NOT FOUND (404)');
                console.log('   Response:', error.response.data);
            } else {
                console.log('❌ Unexpected error:', error.message);
                if (error.response) {
                    console.log('   Status:', error.response.status);
                    console.log('   Data:', error.response.data);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error testing endpoint:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('🔴 Server is not running on port 4000');
        }
    }
}

testCancelEndpoint(); 