const axios = require('axios');

async function simpleTest() {
    try {
        console.log('🧪 Simple API Test');

        const baseURL = 'http://localhost:4001/api';

        // 1. Test login
        console.log('\n🔑 Testing login...');
        const loginData = {
            email: 'member@example.com',
            password: 'H12345678@'
        };

        const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);

        if (!loginResponse.data.success) {
            throw new Error('Login failed: ' + loginResponse.data.message);
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful!');

        // 2. Get current profile
        console.log('\n👤 Getting current profile...');
        const profileResponse = await axios.get(`${baseURL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Current profile:', profileResponse.data.data.userInfo);

        // 3. Update profile
        const updateData = {
            firstName: 'Tran',
            lastName: 'Huy',
            phoneNumber: '0938987703',
            address: '123 Main Sts - FINAL TEST SUCCESS'
        };

        console.log('\n✏️ Updating profile...');
        const updateResponse = await axios.put(`${baseURL}/users/profile`, updateData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (updateResponse.data.success) {
            console.log('✅ PROFILE UPDATE SUCCESSFUL!');
            console.log('Updated data:', updateResponse.data.data);
        } else {
            console.log('❌ Profile update failed:', updateResponse.data.message);
        }

        // 4. Verify the update
        console.log('\n🔍 Verifying update...');
        const verifyResponse = await axios.get(`${baseURL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const updatedUser = verifyResponse.data.data.userInfo;
        console.log('✅ Verified profile:');
        console.log('Address:', updatedUser.address);
        console.log('Phone:', updatedUser.phoneNumber);

        if (updatedUser.address === updateData.address) {
            console.log('\n🎉 SUCCESS! Profile update is working correctly!');
        } else {
            console.log('\n❌ FAILED! Address was not updated properly');
            console.log('Expected:', updateData.address);
            console.log('Got:', updatedUser.address);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Server is not running. Please start the server first:');
            console.log('cd server && set PORT=4001 && npm start');
        } else if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('🚀 Server should be running on port 4001');
console.log('Testing profile update functionality...');
console.log('');

simpleTest(); 