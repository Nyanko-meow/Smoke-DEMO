const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:4000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'smokeking_secret_key_ultra_secure_2024';

async function testWithLogs() {
    console.log('🔍 Testing with server logs monitoring...\n');

    // Create member token
    const memberPayload = {
        id: 2,
        email: 'member@example.com',
        role: 'member'
    };

    const memberToken = jwt.sign(memberPayload, JWT_SECRET, { expiresIn: '24h' });
    console.log('🔑 Member token created');
    console.log('Token (first 50 chars):', memberToken.substring(0, 50) + '...');

    console.log('\n📝 Making feedback request...');
    console.log('⚠️  Check the server console for detailed logs!');
    console.log('Expected to see:');
    console.log('  - "Token from Authorization header: ..."');
    console.log('  - "Token verified successfully, user ID: 2"');
    console.log('  - "User authenticated: { id: 2, email: member@example.com, role: member }"');
    console.log('  - "🔍 Authorization check:"');
    console.log('  - "✅ Authorization passed"');

    const feedbackData = {
        coachId: 3,
        rating: 5,
        comment: 'Test feedback for debugging'
    };

    try {
        const response = await axios.post(`${BASE_URL}/coach/feedback`, feedbackData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${memberToken}`
            }
        });

        console.log('\n✅ SUCCESS! Feedback submitted');
        console.log('Response:', response.data);

    } catch (error) {
        console.log('\n❌ FAILED!');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data?.message);

        if (error.response?.status === 403) {
            console.log('\n🔍 If you see this 403 error but NO server logs above,');
            console.log('   it means the request is not reaching our middleware.');
            console.log('   This could indicate:');
            console.log('   1. Wrong route path');
            console.log('   2. Middleware not properly attached');
            console.log('   3. Server routing issue');
        }
    }

    console.log('\n💡 Next steps:');
    console.log('1. Check the server console for the expected log messages');
    console.log('2. If no logs appear, there\'s a routing issue');
    console.log('3. If logs appear but authorization fails, there\'s a middleware issue');
}

testWithLogs().catch(console.error); 