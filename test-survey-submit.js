const axios = require('axios');

async function testSurveySubmission() {
    console.log('🔍 Testing survey submission...');

    // Test 1: Check if server is running
    try {
        console.log('\n1. Testing server connectivity...');
        const testResponse = await axios.get('http://localhost:4000/api/survey-questions/test');
        console.log('✅ Server is running:', testResponse.data);
    } catch (error) {
        console.log('❌ Server connectivity failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Server is not running on port 4000');
            return;
        }
    }

    // Test 2: Try to get questions (public endpoint)
    try {
        console.log('\n2. Testing public questions endpoint...');
        const questionsResponse = await axios.get('http://localhost:4000/api/survey-questions/public');
        console.log('✅ Questions loaded:', questionsResponse.data.length, 'questions');
    } catch (error) {
        console.log('❌ Questions loading failed:', error.response?.data || error.message);
    }

    // Test 3: Try authenticated submission
    try {
        console.log('\n3. Testing authenticated submission...');

        // Get token from localStorage simulation (you need to replace this with actual token)
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiaWF0IjoxNzM3MDE3MDE2LCJleHAiOjE3Mzk2MDkwMTZ9.YYxJNwKO0X6ZY7nDQiUVfeBKXQr8PMyMj7lPULNJ1SA'; // Replace with actual token

        const answers = [
            { questionId: 1, answerText: 'Test answer 1' },
            { questionId: 2, answerText: 'Test answer 2' }
        ];

        const response = await axios.post('http://localhost:4000/api/survey-questions/answers',
            { answers },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Survey submission successful:', response.data);

    } catch (error) {
        console.log('❌ Survey submission failed:');
        console.log('   Status:', error.response?.status);
        console.log('   Message:', error.response?.data?.message || error.message);
        console.log('   Headers:', error.config?.headers);

        if (error.response?.status === 401) {
            console.log('💡 Token might be invalid or expired');
        }
    }
}

testSurveySubmission(); 