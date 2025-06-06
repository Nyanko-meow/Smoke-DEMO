const axios = require('axios');

async function testAPIUpdate() {
    try {
        console.log('🔍 Testing API profile update...');

        const baseURL = 'http://localhost:5000/api';

        // Test data
        const loginData = {
            email: 'member@example.com',
            password: 'H12345678@'
        };

        console.log('\n1. Logging in to get token...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);

        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Get current profile
        console.log('\n2. Getting current profile...');
        const profileResponse = await axios.get(`${baseURL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Current profile:', profileResponse.data.data.userInfo);

        // Update profile with new address
        const updateData = {
            firstName: profileResponse.data.data.userInfo.firstName,
            lastName: profileResponse.data.data.userInfo.lastName,
            phoneNumber: profileResponse.data.data.userInfo.phoneNumber,
            address: '789 New API Test Address'
        };

        console.log('\n3. Updating profile...');
        console.log('Update data:', updateData);

        const updateResponse = await axios.put(`${baseURL}/users/profile`, updateData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (updateResponse.data.success) {
            console.log('✅ Profile update successful!');
            console.log('Updated data:', updateResponse.data.data);
        } else {
            console.log('❌ Profile update failed:', updateResponse.data.message);
        }

        // Verify the update
        console.log('\n4. Verifying update...');
        const verifyResponse = await axios.get(`${baseURL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Verified profile:', verifyResponse.data.data.userInfo);

        console.log('\n🎉 API test completed!');

    } catch (error) {
        console.error('❌ API test failed:', error.message);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testAPIUpdate(); 