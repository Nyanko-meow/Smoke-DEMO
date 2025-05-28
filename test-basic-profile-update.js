const axios = require('axios');

async function testBasicProfileUpdate() {
    try {
        console.log('🧪 Testing basic profile update...');

        // First, login as coach to get token
        const loginResponse = await axios.post('http://localhost:4000/api/coach/login', {
            email: 'coach@smokeking.com',
            password: 'coach123'
        }, {
            withCredentials: true
        });

        if (!loginResponse.data.success) {
            console.error('❌ Login failed:', loginResponse.data.message);
            return;
        }

        console.log('✅ Login successful');
        const token = loginResponse.data.token;

        // Test profile update with ONLY basic data
        const updateData = {
            firstName: 'CoachTest',
            lastName: 'SmithTest',
            phoneNumber: '0111222333',
            address: '789 Coach Blvd',
            avatar: 'coach.jpg'
            // NO professional fields
        };

        console.log('📤 Sending basic update request...');
        console.log('Update data:', JSON.stringify(updateData, null, 2));

        const updateResponse = await axios.put('http://localhost:4000/api/coach/profile', updateData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });

        if (updateResponse.data.success) {
            console.log('✅ Basic profile update successful!');
            console.log('Response:', updateResponse.data);
        } else {
            console.log('❌ Basic profile update failed:', updateResponse.data.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);

        if (error.response?.data?.error) {
            console.error('Server error details:', error.response.data.error);
        }
    }
}

// Run test
testBasicProfileUpdate(); 