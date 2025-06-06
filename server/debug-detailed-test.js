const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:4000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'smokeking_secret_key_ultra_secure_2024';

async function detailedTest() {
    console.log('🔍 Detailed Authorization Debug Test\n');

    // Create member token
    const memberPayload = {
        id: 2,
        email: 'member@example.com',
        role: 'member'
    };

    const memberToken = jwt.sign(memberPayload, JWT_SECRET, { expiresIn: '24h' });
    console.log('🔑 Member token created');
    console.log('Token payload:', jwt.decode(memberToken));

    // Test 1: Check if we can reach the server at all
    console.log('\n1️⃣ Testing server connectivity...');
    try {
        const response = await axios.get(`${BASE_URL}/coach/3/feedback`);
        console.log('✅ Server is reachable, status:', response.status);
    } catch (error) {
        console.log('❌ Server not reachable:', error.message);
        return;
    }

    // Test 2: Test authentication middleware (without authorization)
    console.log('\n2️⃣ Testing authentication middleware...');
    try {
        // Try to access a protected route that doesn't have role restrictions
        const response = await axios.get(`${BASE_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${memberToken}`
            }
        });
        console.log('✅ Authentication middleware working, status:', response.status);
    } catch (error) {
        console.log('❌ Authentication failed:', error.response?.status, error.response?.data?.message);
        if (error.response?.status === 404) {
            console.log('ℹ️  Route not found, but auth might be working');
        }
    }

    // Test 3: Test the specific feedback route
    console.log('\n3️⃣ Testing feedback route with detailed logging...');

    const feedbackData = {
        coachId: 3,
        rating: 5,
        comment: 'Test feedback'
    };

    try {
        console.log('Making request to:', `${BASE_URL}/coach/feedback`);
        console.log('With headers:', {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${memberToken.substring(0, 20)}...`
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
        console.log('❌ FAILED! Status:', error.response?.status);
        console.log('Error message:', error.response?.data?.message);
        console.log('Full error data:', error.response?.data);

        // Additional debugging
        if (error.response?.status === 403) {
            console.log('\n🔍 403 Forbidden - Authorization issue detected');
            console.log('This means:');
            console.log('- Authentication passed (token is valid)');
            console.log('- But authorization failed (role check failed)');
            console.log('- Expected roles: member, guest');
            console.log('- User role in token:', jwt.decode(memberToken).role);
        }
    }

    // Test 4: Test with a different approach - check if the route exists
    console.log('\n4️⃣ Testing route existence...');
    try {
        // Try without auth to see if we get 401 (route exists) or 404 (route doesn't exist)
        const response = await axios.post(`${BASE_URL}/coach/feedback`, feedbackData);
        console.log('❌ Unexpected: No auth required?', response.status);
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Route exists and requires authentication');
        } else if (error.response?.status === 404) {
            console.log('❌ Route not found!');
        } else {
            console.log('🤔 Unexpected status:', error.response?.status);
        }
    }

    console.log('\n🎉 Detailed test completed!');
}

detailedTest().catch(console.error); 