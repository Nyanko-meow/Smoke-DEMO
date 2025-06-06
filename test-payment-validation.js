const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testPaymentValidation() {
    try {
        console.log('🧪 Testing Payment Validation Fix\n');

        // Test 1: Login and check user object structure
        console.log('1. Testing login and user object structure...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'member@example.com',
            password: 'H12345678@'
        });

        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }

        const user = loginResponse.data.user;
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log('User object structure:', {
            hasId: 'id' in user,
            hasUserID: 'UserID' in user,
            idValue: user.id,
            UserIDValue: user.UserID,
            preferredId: user.id || user.UserID
        });

        // Test 2: Get available membership plans
        console.log('\n2. Getting membership plans...');
        const plansResponse = await axios.get(`${API_BASE}/membership/plans`);

        if (!plansResponse.data.success) {
            console.log('❌ Failed to get plans:', plansResponse.data.message);
            return;
        }

        const plans = plansResponse.data.data;
        console.log('✅ Plans fetched successfully');
        console.log(`Found ${plans.length} plans:`, plans.map(p => ({
            PlanID: p.PlanID,
            Name: p.Name,
            Price: p.Price
        })));

        // Test 3: Test payment endpoint with correct validation
        if (plans.length > 0) {
            const testPlan = plans[0]; // Use first plan for testing

            console.log('\n3. Testing payment endpoint...');
            console.log('Using plan:', { PlanID: testPlan.PlanID, Name: testPlan.Name });

            const paymentData = {
                planId: testPlan.PlanID,
                paymentMethod: 'bank_transfer'
            };

            try {
                const paymentResponse = await axios.post(`${API_BASE}/membership/purchase`, paymentData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (paymentResponse.data.success) {
                    console.log('✅ Payment request successful!');
                    console.log('Payment response:', paymentResponse.data);
                } else {
                    console.log('❌ Payment failed:', paymentResponse.data.message);
                }
            } catch (error) {
                if (error.response?.status === 400 && error.response?.data?.message?.includes('already has an active membership')) {
                    console.log('⚠️ User already has active membership (expected)');
                    console.log('Response:', error.response.data.message);
                } else {
                    console.log('❌ Payment error:', error.response?.data?.message || error.message);
                    if (error.response?.data) {
                        console.log('Error details:', error.response.data);
                    }
                }
            }
        }

        // Test 4: Check membership status
        console.log('\n4. Checking membership status...');
        try {
            const membershipResponse = await axios.get(`${API_BASE}/membership/current`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (membershipResponse.data.success) {
                console.log('✅ Membership status fetched');
                console.log('Current membership:', membershipResponse.data.data);
            } else {
                console.log('⚠️ No active membership:', membershipResponse.data.message);
            }
        } catch (error) {
            console.log('⚠️ Membership check error:', error.response?.data?.message || error.message);
        }

        // Test 5: Test with invalid plan ID (should fail validation)
        console.log('\n5. Testing with invalid plan ID...');
        try {
            const invalidPaymentData = {
                planId: 999999, // Invalid plan ID
                paymentMethod: 'bank_transfer'
            };

            const invalidPaymentResponse = await axios.post(`${API_BASE}/membership/purchase`, invalidPaymentData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('❌ Invalid payment should have failed but succeeded:', invalidPaymentResponse.data);
        } catch (error) {
            console.log('✅ Invalid payment correctly failed:', error.response?.data?.message || error.message);
        }

        console.log('\n🎉 Payment validation testing completed!');

    } catch (error) {
        console.error('❌ Script error:', error.message);
    }
}

// Note: Make sure server is running on port 4000 before running this test
console.log('📋 Note: Make sure the server is running on port 4000 before running this test');
console.log('You can start it with: cd server && npm start\n');

testPaymentValidation(); 