const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:4000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'smokeking_secret_key_ultra_secure_2024';

async function testAuthMiddleware() {
    try {
        console.log('🧪 Testing Auth Middleware Debug...\n');

        // 1. Create a valid member token
        console.log('🔑 Creating valid member token...');
        const memberPayload = {
            id: 2, // member@example.com UserID
            email: 'member@example.com',
            role: 'member'
        };

        const memberToken = jwt.sign(memberPayload, JWT_SECRET, { expiresIn: '24h' });
        console.log('✅ Member token created');
        console.log('Token payload:', jwt.decode(memberToken));

        // 2. Test a simple endpoint first to check if server is running
        console.log('\n🌐 Testing if server is running...');
        try {
            const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
            console.log('✅ Server is running');
        } catch (error) {
            console.log('❌ Server might not be running or health endpoint not available');
            console.log('Trying basic endpoint...');

            try {
                const response = await axios.get(`${BASE_URL}/coach/3/feedback`);
                console.log('✅ Server is running (tested with public endpoint)');
            } catch (error2) {
                console.log('❌ Server is not running or not accessible');
                console.log('Error:', error2.message);
                return;
            }
        }

        // 3. Test auth middleware with a simple protected endpoint
        console.log('\n🔐 Testing auth middleware with protected endpoint...');

        // Try to find a simple protected endpoint
        const testEndpoints = [
            '/coach/stats',
            '/coach/members',
            '/user/role'
        ];

        for (const endpoint of testEndpoints) {
            console.log(`\n🧪 Testing ${endpoint}...`);
            try {
                const response = await axios.get(`${BASE_URL}${endpoint}`, {
                    headers: {
                        'Authorization': `Bearer ${memberToken}`
                    }
                });
                console.log(`✅ ${endpoint} - Success:`, response.status);
                break; // If one works, auth is working
            } catch (error) {
                console.log(`❌ ${endpoint} - Failed:`, error.response?.status, error.response?.data?.message);

                if (error.response?.status === 401) {
                    console.log('   → Authentication failed');
                } else if (error.response?.status === 403) {
                    console.log('   → Authorization failed (auth worked, but role check failed)');
                } else {
                    console.log('   → Other error');
                }
            }
        }

        // 4. Test the specific feedback endpoint with detailed logging
        console.log('\n📝 Testing feedback endpoint with detailed logging...');

        const feedbackData = {
            coachId: 3,
            rating: 5,
            comment: 'Test feedback',
            categories: {
                professionalism: 5,
                helpfulness: 5,
                communication: 4,
                knowledge: 5
            },
            isAnonymous: false
        };

        try {
            console.log('Making request to:', `${BASE_URL}/coach/feedback`);
            console.log('With headers:', {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${memberToken.substring(0, 30)}...`
            });
            console.log('With data:', feedbackData);

            const response = await axios.post(`${BASE_URL}/coach/feedback`, feedbackData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${memberToken}`
                }
            });

            console.log('✅ SUCCESS! Feedback submitted');
            console.log('Response:', response.data);

        } catch (error) {
            console.log('❌ FAILED! Feedback submission failed');
            console.log('Status:', error.response?.status);
            console.log('Error data:', error.response?.data);
            console.log('Error headers:', error.response?.headers);

            // Check if it's a CORS issue
            if (error.code === 'ECONNREFUSED') {
                console.log('🔍 Connection refused - server might not be running on port 4000');
            } else if (error.response?.status === 401) {
                console.log('🔍 401 Unauthorized - token might be invalid or expired');
            } else if (error.response?.status === 403) {
                console.log('🔍 403 Forbidden - role authorization failed');
                console.log('   Check server logs for authorization middleware output');
            }
        }

        console.log('\n🎉 Test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testAuthMiddleware().catch(console.error); 