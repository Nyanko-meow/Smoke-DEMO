const axios = require('axios');

const API_BASE = 'http://127.0.0.1:3000/api';

async function testDirectAPI() {
    try {
        console.log('🧪 Testing API directly...\n');

        // Step 1: Login first
        console.log('1️⃣ Logging in...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'leghenkiz@gmail.com',
            password: 'H12345678@'
        });

        if (!loginResponse.data.success) {
            console.error('❌ Login failed:', loginResponse.data.message);
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful, token received');

        // Step 2: Get membership plans
        console.log('\n2️⃣ Fetching membership plans...');
        const plansResponse = await axios.get(`${API_BASE}/membership/plans`);
        console.log('✅ Plans response:', plansResponse.data);

        if (!plansResponse.data.data || plansResponse.data.data.length === 0) {
            console.error('❌ No plans found');
            return;
        }

        const plan = plansResponse.data.data[0];
        console.log('📋 Using first plan:', {
            PlanID: plan.PlanID,
            Name: plan.Name,
            Price: plan.Price
        });

        // Step 3: Test purchase
        console.log('\n3️⃣ Testing purchase...');
        const purchaseData = {
            planId: plan.PlanID,
            paymentMethod: 'BankTransfer'
        };

        console.log('💳 Purchase request:', purchaseData);

        try {
            const purchaseResponse = await axios.post(
                `${API_BASE}/membership/purchase`,
                purchaseData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Purchase successful!');
            console.log('📄 Response:', purchaseResponse.data);

        } catch (purchaseError) {
            console.error('❌ Purchase failed!');
            if (purchaseError.response) {
                console.error('Status:', purchaseError.response.status);
                console.error('Data:', purchaseError.response.data);
                console.error('Headers:', purchaseError.response.headers);
            } else if (purchaseError.request) {
                console.error('Request error:', purchaseError.request);
            } else {
                console.error('Error:', purchaseError.message);
            }

            // Try debug endpoint for more info
            console.log('\n4️⃣ Testing debug purchase...');
            try {
                const debugResponse = await axios.post(
                    `${API_BASE}/membership/debug-purchase`,
                    purchaseData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                console.log('✅ Debug purchase successful!');
                console.log('📄 Debug response:', debugResponse.data);

            } catch (debugError) {
                console.error('❌ Debug purchase also failed!');
                if (debugError.response) {
                    console.error('Debug Status:', debugError.response.status);
                    console.error('Debug Data:', debugError.response.data);
                } else {
                    console.error('Debug Error:', debugError.message);
                }
            }
        }

        // Step 4: Check payment history
        console.log('\n4️⃣ Checking payment history...');
        const historyResponse = await axios.get(`${API_BASE}/membership/payment-history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ Payment history response:', historyResponse.data);

    } catch (error) {
        console.error('❌ Error:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });
    }
}

testDirectAPI(); 