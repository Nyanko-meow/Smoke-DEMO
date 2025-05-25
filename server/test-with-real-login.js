const axios = require('axios');

async function testWithRealLogin() {
    try {
        console.log('🧪 Testing with real login...');

        const baseURL = 'http://localhost:4000/api';

        // 1. Login as coach
        console.log('\n🔐 Logging in as coach...');
        const loginResponse = await axios.post(`${baseURL}/coach/login`, {
            email: 'coach@example.com',
            password: 'H12345678@'
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed: ' + loginResponse.data.message);
        }

        const token = loginResponse.data.token;
        const user = loginResponse.data.user;

        console.log('✅ Login successful!');
        console.log('User:', user);
        console.log('Token:', token.substring(0, 50) + '...');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Test members endpoint
        console.log('\n📋 Testing /api/chat/coach/members...');
        try {
            const response = await axios.get(`${baseURL}/chat/coach/members`, { headers });
            console.log('✅ SUCCESS! Members endpoint works!');
            console.log(`Found ${response.data.data.length} members:`);
            response.data.data.forEach((member, index) => {
                console.log(`   ${index + 1}. ${member.FullName} (${member.Email})`);
            });
        } catch (error) {
            console.error('❌ Members endpoint failed:');
            console.error('Status:', error.response?.status);
            console.error('Data:', error.response?.data);
        }

        // 3. Test conversations endpoint
        console.log('\n💬 Testing /api/chat/coach/conversations...');
        try {
            const response = await axios.get(`${baseURL}/chat/coach/conversations`, { headers });
            console.log('✅ SUCCESS! Conversations endpoint works!');
            console.log(`Found ${response.data.data.length} conversations:`);
            response.data.data.forEach((conv, index) => {
                console.log(`   ${index + 1}. ${conv.MemberName} (${conv.MemberEmail})`);
            });
        } catch (error) {
            console.error('❌ Conversations endpoint failed:');
            console.error('Status:', error.response?.status);
            console.error('Data:', error.response?.data);
        }

        console.log('\n🏁 Test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testWithRealLogin(); 