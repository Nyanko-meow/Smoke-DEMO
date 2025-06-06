const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:4000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'smokeking_secret_key_ultra_secure_2024';

async function testFeedbackAPI() {
    try {
        console.log('🧪 Testing Coach Feedback API...\n');

        // 1. Create a valid member token
        console.log('🔑 Creating valid member token...');
        const memberPayload = {
            id: 2, // member@example.com UserID
            email: 'member@example.com',
            role: 'member'
        };

        const memberToken = jwt.sign(memberPayload, JWT_SECRET, { expiresIn: '24h' });
        console.log('✅ Member token created:', memberToken.substring(0, 30) + '...');

        // 2. Create a valid coach token for comparison
        console.log('\n🔑 Creating valid coach token...');
        const coachPayload = {
            id: 3, // coach@example.com UserID
            email: 'coach@example.com',
            role: 'coach'
        };

        const coachToken = jwt.sign(coachPayload, JWT_SECRET, { expiresIn: '24h' });
        console.log('✅ Coach token created:', coachToken.substring(0, 30) + '...');

        // 3. Test member authentication with feedback endpoint
        console.log('\n📝 Testing feedback submission with member token...');

        const feedbackData = {
            coachId: 3, // coach@example.com UserID
            rating: 5,
            comment: 'Excellent coach! Very helpful and professional.',
            categories: {
                professionalism: 5,
                helpfulness: 5,
                communication: 4,
                knowledge: 5
            },
            isAnonymous: false
        };

        console.log('Feedback data:', feedbackData);

        try {
            const response = await axios.post(`${BASE_URL}/coach/feedback`, feedbackData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${memberToken}`
                }
            });

            console.log('✅ SUCCESS! Feedback submitted successfully');
            console.log('Response:', response.data);

        } catch (error) {
            console.log('❌ FAILED! Feedback submission failed');
            console.log('Status:', error.response?.status);
            console.log('Error data:', error.response?.data);

            if (error.response?.status === 403) {
                console.log('\n🔍 Debugging authorization issue...');
                console.log('Expected: User role should be "member" or "guest"');
                console.log('Token payload:', jwt.decode(memberToken));
            }
        }

        // 4. Test with coach token (should fail)
        console.log('\n🚫 Testing feedback submission with coach token (should fail)...');

        try {
            const response = await axios.post(`${BASE_URL}/coach/feedback`, feedbackData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${coachToken}`
                }
            });

            console.log('❌ UNEXPECTED! Coach was able to submit feedback');
            console.log('Response:', response.data);

        } catch (error) {
            console.log('✅ EXPECTED! Coach cannot submit feedback');
            console.log('Status:', error.response?.status);
            console.log('Error:', error.response?.data?.message);
        }

        // 5. Test getting coach feedback (public endpoint)
        console.log('\n📋 Testing get coach feedback (public endpoint)...');

        try {
            const response = await axios.get(`${BASE_URL}/coach/3/feedback`);
            console.log('✅ SUCCESS! Got coach feedback');
            console.log('Feedback count:', response.data.data?.feedback?.length || 0);

        } catch (error) {
            console.log('❌ FAILED! Could not get coach feedback');
            console.log('Status:', error.response?.status);
            console.log('Error:', error.response?.data);
        }

        console.log('\n🎉 Test completed!');
        console.log('\n💡 For frontend testing, use this member token:');
        console.log(`Bearer ${memberToken}`);
        console.log('\n📋 Instructions:');
        console.log('1. Open browser console');
        console.log('2. Set token: localStorage.setItem("token", "' + memberToken + '")');
        console.log('3. Set user: localStorage.setItem("user", \'{"UserID": 2, "Role": "member", "Email": "member@example.com"}\')');
        console.log('4. Try submitting feedback again');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testFeedbackAPI().catch(console.error); 