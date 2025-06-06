const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testFullFunctionality() {
    try {
        console.log('🔍 Testing complete functionality...\n');

        // Test 1: Login
        console.log('1. Testing login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'member@example.com',
            password: 'H12345678@'
        });

        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }

        console.log('✅ Login successful');
        const token = loginResponse.data.token;
        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Test 2: Get current user profile
        console.log('\n2. Testing get profile...');
        try {
            const profileResponse = await axios.get(`${API_BASE}/users/profile`, { headers });
            console.log('✅ Profile retrieved:', {
                name: `${profileResponse.data.data.userInfo.firstName} ${profileResponse.data.data.userInfo.lastName}`,
                email: profileResponse.data.data.userInfo.email
            });
        } catch (error) {
            console.log('❌ Profile retrieval failed:', error.response?.data?.message || error.message);
        }

        // Test 3: Update profile
        console.log('\n3. Testing profile update...');
        try {
            const updateData = {
                firstName: 'Test',
                lastName: 'Member Updated',
                phoneNumber: '0123456789',
                address: 'Test Address 123'
            };

            const updateResponse = await axios.put(`${API_BASE}/users/profile`, updateData, { headers });

            if (updateResponse.data.success) {
                console.log('✅ Profile update successful');
            } else {
                console.log('❌ Profile update failed:', updateResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Profile update error:', error.response?.data?.message || error.message);
        }

        // Test 4: Get membership plans
        console.log('\n4. Testing get membership plans...');
        try {
            const plansResponse = await axios.get(`${API_BASE}/membership/plans`);
            const plans = plansResponse.data.data;
            console.log('✅ Plans retrieved:', plans.length, 'plans available');

            if (plans.length > 0) {
                console.log('First plan:', plans[0].Name, '-', plans[0].Price, 'VND');

                // Test 5: Purchase membership
                console.log('\n5. Testing membership purchase...');
                try {
                    const purchaseResponse = await axios.post(
                        `${API_BASE}/membership/purchase`,
                        {
                            planId: plans[0].PlanID,
                            paymentMethod: 'BankTransfer'
                        },
                        { headers }
                    );

                    if (purchaseResponse.data.success) {
                        console.log('✅ Membership purchase successful');
                        console.log('Transaction ID:', purchaseResponse.data.transactionId);
                    } else {
                        console.log('❌ Membership purchase failed:', purchaseResponse.data.message);
                    }
                } catch (error) {
                    console.log('❌ Membership purchase error:', error.response?.data?.message || error.message);
                    console.log('Error details:', error.response?.data);
                }
            }
        } catch (error) {
            console.log('❌ Plans retrieval failed:', error.response?.data?.message || error.message);
        }

        console.log('\n🎉 Test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Check if server is running first
async function checkServer() {
    try {
        await axios.get(`${API_BASE}/auth/test`);
        return true;
    } catch (error) {
        console.log('❌ Server is not running on port 4000');
        console.log('Please start the server first:');
        console.log('cd server && npm start');
        return false;
    }
}

async function runTests() {
    const serverRunning = await checkServer();
    if (serverRunning) {
        await testFullFunctionality();
    }
}

runTests(); 