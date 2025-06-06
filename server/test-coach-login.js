const axios = require('axios');

async function testCoachLogin() {
    try {
        console.log('🧪 Testing coach login...');

        // Test login with Coach Smith using the correct password
        const loginResponse = await axios.post('http://localhost:4000/api/coach/login', {
            email: 'coach@example.com',
            password: 'H12345678@'
        });

        console.log('✅ Login response:', loginResponse.data);

        if (loginResponse.data.success) {
            const token = loginResponse.data.token;
            console.log('🔑 Got token:', token.substring(0, 20) + '...');

            // Test getting members
            console.log('\n🔍 Testing members API...');
            const membersResponse = await axios.get('http://localhost:4000/api/coach/members', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('👥 Members response:', membersResponse.data);

            // Test survey overview
            console.log('\n📊 Testing survey overview...');
            const surveyResponse = await axios.get('http://localhost:4000/api/coach/survey-overview', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('📋 Survey overview:', surveyResponse.data);

            // Test member surveys list
            console.log('\n📝 Testing member surveys list...');
            const memberSurveysResponse = await axios.get('http://localhost:4000/api/coach/member-surveys', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('📋 Member surveys:', memberSurveysResponse.data);

        } else {
            console.log('❌ Login failed');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testCoachLogin(); 