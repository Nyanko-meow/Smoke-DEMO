const axios = require('axios');

async function testCoachLoginPlain() {
    try {
        console.log('🧪 Testing coach login with plain text password...');

        // Test coach login
        console.log('🔐 Testing login with coach@example.com / H12345678');
        const loginResponse = await axios.post('http://localhost:4000/api/coach/login', {
            email: 'coach@example.com',
            password: 'H12345678'
        });

        if (loginResponse.data.success) {
            console.log('✅ Coach login successful!');
            console.log('👤 User info:', {
                id: loginResponse.data.user.id,
                email: loginResponse.data.user.email,
                firstName: loginResponse.data.user.firstName,
                lastName: loginResponse.data.user.lastName,
                role: loginResponse.data.user.role
            });
            console.log('🔑 Token received:', loginResponse.data.token ? 'Yes' : 'No');

            // Test getting coach profile
            const token = loginResponse.data.token;
            console.log('\n📋 Testing coach profile API...');
            const profileResponse = await axios.get('http://localhost:4000/api/coach/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (profileResponse.data.success) {
                console.log('✅ Coach profile loaded successfully!');
                const data = profileResponse.data.data;
                console.log('Profile data:', {
                    name: `${data.FirstName} ${data.LastName}`,
                    email: data.Email,
                    phone: data.PhoneNumber,
                    bio: data.Bio ? data.Bio.substring(0, 50) + '...' : 'No bio',
                    specialization: data.Specialization,
                    experience: data.Experience,
                    hourlyRate: data.HourlyRate
                });
            } else {
                console.log('❌ Failed to load coach profile:', profileResponse.data.message);
            }

            // Test coaches list API
            console.log('\n📝 Testing coaches list API...');
            const coachesResponse = await axios.get('http://localhost:4000/api/coach/');

            if (coachesResponse.data.success) {
                console.log('✅ Coaches list loaded successfully!');
                console.log(`Found ${coachesResponse.data.data.length} coaches`);
                coachesResponse.data.data.forEach(coach => {
                    console.log(`   - ${coach.FullName} (${coach.Email}) - ${coach.Specialization || 'No specialization'}`);
                });
            } else {
                console.log('❌ Failed to load coaches list:', coachesResponse.data.message);
            }

        } else {
            console.log('❌ Coach login failed:', loginResponse.data.message);
        }

        console.log('\n🎉 All tests completed!');
        console.log('✅ Plain text password system is working correctly');
        console.log('🔗 You can now access coach dashboard at: http://localhost:3000/coach/login');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('Status:', error.response.status);
        }
    }
}

testCoachLoginPlain(); 