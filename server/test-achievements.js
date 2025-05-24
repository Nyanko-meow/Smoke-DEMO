const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
    email: 'member@example.com',
    password: 'H12345678@'
};

let authToken = '';

async function login() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
        if (response.data.success) {
            authToken = response.data.token;
            console.log('✅ Login successful');
            return true;
        }
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testAchievements() {
    const headers = { Authorization: `Bearer ${authToken}` };

    try {
        // Test get all achievements
        console.log('\n🔍 Testing GET /achievements');
        const achievementsRes = await axios.get(`${BASE_URL}/achievements`, { headers });
        console.log('✅ Achievements:', achievementsRes.data.data.length, 'items');

        // Test get earned achievements
        console.log('\n🔍 Testing GET /achievements/earned');
        const earnedRes = await axios.get(`${BASE_URL}/achievements/earned`, { headers });
        console.log('✅ Earned achievements:', earnedRes.data.data.length, 'items');

        // Test check achievements
        console.log('\n🔍 Testing POST /achievements/check');
        const checkRes = await axios.post(`${BASE_URL}/achievements/check`, {}, { headers });
        console.log('✅ Check result:', checkRes.data.message);
        console.log('New achievements:', checkRes.data.data.length);

    } catch (error) {
        console.error('❌ Achievement test failed:', error.response?.data?.message || error.message);
    }
}

async function testCommunity() {
    const headers = { Authorization: `Bearer ${authToken}` };

    try {
        // Test get community posts
        console.log('\n🔍 Testing GET /community/posts');
        const postsRes = await axios.get(`${BASE_URL}/community/posts`, { headers });
        console.log('✅ Community posts:', postsRes.data.data.length, 'items');

        // Test create post
        console.log('\n🔍 Testing POST /community/posts');
        const createRes = await axios.post(`${BASE_URL}/community/posts`, {
            title: 'Test Achievement Post',
            content: 'This is a test post for achievements feature',
            achievementId: null
        }, { headers });
        console.log('✅ Post created:', createRes.data.data.PostID);

    } catch (error) {
        console.error('❌ Community test failed:', error.response?.data?.message || error.message);
    }
}

async function testProgress() {
    const headers = { Authorization: `Bearer ${authToken}` };

    try {
        // Test record progress
        console.log('\n🔍 Testing POST /progress');
        const progressRes = await axios.post(`${BASE_URL}/progress`, {
            date: new Date().toISOString().split('T')[0],
            cigarettesSmoked: 0,
            cravingLevel: 3,
            emotionNotes: 'Feeling good today!'
        }, { headers });
        console.log('✅ Progress recorded');
        console.log('New achievements:', progressRes.data.achievements?.newAchievements?.length || 0);
        console.log('Motivational messages:', progressRes.data.achievements?.motivationalMessages?.length || 0);

    } catch (error) {
        console.error('❌ Progress test failed:', error.response?.data?.message || error.message);
    }
}

async function runTests() {
    console.log('🚀 Starting API tests...\n');

    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('❌ Cannot proceed without login');
        return;
    }

    await testAchievements();
    await testCommunity();
    await testProgress();

    console.log('\n✅ All tests completed!');
}

runTests().catch(console.error); 