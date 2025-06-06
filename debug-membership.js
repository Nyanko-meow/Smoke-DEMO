const axios = require('axios');

// Test configuration
const API_BASE = 'http://localhost:3000/api';

async function debugMembershipPurchase() {
    try {
        console.log('🔍 Debug Membership Purchase API\n');

        // Test credentials - use admin account
        const loginData = {
            email: 'admin@example.com',
            password: 'H12345678@'
        };

        console.log('1️⃣ Logging in...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);

        if (!loginResponse.data.success) {
            console.error('❌ Login failed:', loginResponse.data.message);
            return;
        }

        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        console.log('✅ Login successful');
        console.log('👤 User:', {
            id: user.id,
            UserID: user.UserID,
            email: user.email,
            role: user.role
        });

        // Test 2: Get membership plans
        console.log('\n2️⃣ Fetching membership plans...');
        try {
            const plansResponse = await axios.get(`${API_BASE}/membership/plans`);
            console.log('✅ Plans fetched:', plansResponse.data);

            if (plansResponse.data.data && plansResponse.data.data.length > 0) {
                const plan = plansResponse.data.data[0];
                console.log('📋 Using plan:', {
                    PlanID: plan.PlanID,
                    Name: plan.Name,
                    Price: plan.Price
                });

                // Test 3: Try membership purchase
                console.log('\n3️⃣ Testing membership purchase...');
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
                }
            } else {
                console.error('❌ No plans found');
            }

        } catch (plansError) {
            console.error('❌ Failed to fetch plans:', plansError.response?.data || plansError.message);
        }

    } catch (error) {
        console.error('❌ Debug script error:', error.message);
    }
}

// Run the debug
debugMembershipPurchase(); 