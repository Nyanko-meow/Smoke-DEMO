const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test user credentials
const testUser = {
    email: 'member@example.com',
    password: 'H12345678@'
};

async function testUserComments() {
    try {
        console.log('🚀 Testing user comments API...\n');

        // 1. Login to get token
        console.log('1. 🔐 Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);

        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // 2. Test user-comments endpoint
        console.log('\n2. 📝 Testing /community/user-comments...');

        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${BASE_URL}/community/user-comments`, { headers });

        console.log('📊 Response status:', response.status);
        console.log('📄 Response data:');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log(`✅ API working! Found ${response.data.count || 0} comments`);

            if (response.data.data.length > 0) {
                console.log('\n📝 Sample comment:');
                const sample = response.data.data[0];
                console.log(`- Content: "${sample.Content}"`);
                console.log(`- Post: ${sample.PostTitle || 'No title'}`);
                console.log(`- Created: ${sample.CreatedAt}`);
            }
        } else {
            console.log('❌ API returned error:', response.data.message);
        }

    } catch (error) {
        console.error('❌ Test failed:');

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testUserComments(); 