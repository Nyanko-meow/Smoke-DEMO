const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:4000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'smokeking_secret_key_ultra_secure_2024';

async function finalTestFeedback() {
    console.log('🎯 FINAL TEST: Coach Feedback Authorization Fix\n');

    // Create member token
    const memberPayload = {
        id: 2,
        email: 'member@example.com',
        role: 'member'
    };

    const memberToken = jwt.sign(memberPayload, JWT_SECRET, { expiresIn: '24h' });
    console.log('🔑 Member token created for testing');

    // Test 1: Check server connectivity
    console.log('\n1️⃣ Checking server connectivity...');
    try {
        const response = await axios.get(`${BASE_URL}/coach`);
        console.log('✅ Server is running and accessible');
    } catch (error) {
        console.log('❌ Server is not running or not accessible');
        console.log('Please start the server first: npm start');
        return;
    }

    // Test 2: Test the fixed feedback endpoint
    console.log('\n2️⃣ Testing feedback submission (should work now)...');

    const feedbackData = {
        coachId: 3,
        rating: 5,
        comment: 'Test feedback after authorization fix',
        categories: {
            professionalism: 5,
            helpfulness: 5,
            communication: 4,
            knowledge: 5
        },
        isAnonymous: false
    };

    try {
        console.log('📝 Submitting feedback...');
        const response = await axios.post(`${BASE_URL}/coach/feedback`, feedbackData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${memberToken}`
            }
        });

        console.log('🎉 SUCCESS! Feedback submitted successfully!');
        console.log('Response:', response.data);
        console.log('\n✅ The authorization fix is working correctly!');

    } catch (error) {
        console.log('❌ FAILED! Still getting error:');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.message);

        if (error.response?.status === 403) {
            console.log('\n🔍 Still getting 403 error. This could mean:');
            console.log('1. Server needs to be restarted to apply the fix');
            console.log('2. The route fix was not saved properly');
            console.log('3. There might be caching issues');

            console.log('\n💡 Solutions:');
            console.log('1. Stop the server (Ctrl+C)');
            console.log('2. Restart with: npm start');
            console.log('3. Try the test again');
        } else if (error.response?.status === 401) {
            console.log('\n🔍 401 error means authentication failed');
            console.log('Check if the JWT secret is correct');
        } else {
            console.log('\n🔍 Unexpected error. Check server logs for details.');
        }
    }

    // Test 3: Test with coach token (should fail)
    console.log('\n3️⃣ Testing with coach token (should fail)...');

    const coachPayload = {
        id: 3,
        email: 'coach@example.com',
        role: 'coach'
    };

    const coachToken = jwt.sign(coachPayload, JWT_SECRET, { expiresIn: '24h' });

    try {
        const response = await axios.post(`${BASE_URL}/coach/feedback`, feedbackData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${coachToken}`
            }
        });

        console.log('❌ UNEXPECTED! Coach should not be able to submit feedback');

    } catch (error) {
        if (error.response?.status === 403) {
            console.log('✅ EXPECTED! Coach correctly cannot submit feedback');
        } else {
            console.log('🤔 Unexpected error for coach:', error.response?.status);
        }
    }

    // Test 4: Get feedback (should work for everyone)
    console.log('\n4️⃣ Testing get feedback (public endpoint)...');
    try {
        const response = await axios.get(`${BASE_URL}/coach/3/feedback`);
        console.log('✅ Get feedback works');
        console.log(`Found ${response.data.data?.feedback?.length || 0} feedback records`);
    } catch (error) {
        console.log('❌ Get feedback failed:', error.response?.status);
    }

    console.log('\n🏁 Final test completed!');
    console.log('\n📋 Summary:');
    console.log('- The fix has been applied to server/src/routes/coach.routes.js');
    console.log('- Changed: authorize([\'member\', \'guest\']) → authorize(\'member\', \'guest\')');
    console.log('- Server needs to be restarted to apply the changes');
    console.log('\n🚀 To apply the fix:');
    console.log('1. Stop the current server');
    console.log('2. Run: npm start');
    console.log('3. Test the feedback feature in the frontend');
}

finalTestFeedback().catch(console.error); 