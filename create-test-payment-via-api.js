const axios = require('axios');

async function createTestPaymentViaAPI() {
    try {
        console.log('🔧 Creating test payment via API for cancellation testing...');

        // Step 1: Login to get token
        console.log('1️⃣ Logging in...');
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'leghenkiz@gmail.com',
            password: 'H12345678@'
        });

        if (!loginResponse.data.success) {
            console.error('❌ Login failed:', loginResponse.data.message);
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Step 2: Purchase a new membership
        console.log('\n2️⃣ Creating new membership purchase...');
        try {
            const purchaseResponse = await axios.post('http://localhost:4000/api/membership/purchase', {
                planId: 1, // Basic Plan instead of Premium
                paymentMethod: 'BankTransfer'
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Purchase successful!');
            console.log('📄 Purchase response:', JSON.stringify(purchaseResponse.data, null, 2));

            console.log('\n🎉 Test payment setup completed!');
            console.log('📋 You can now test cancellation with bank information');

        } catch (purchaseError) {
            console.error('❌ Purchase failed!');
            if (purchaseError.response) {
                console.error('Status:', purchaseError.response.status);
                console.error('Error data:', JSON.stringify(purchaseError.response.data, null, 2));
            } else {
                console.error('Error message:', purchaseError.message);
            }
        }

    } catch (error) {
        console.error('❌ Test setup error:', error.message);
    }
}

// Run the setup
createTestPaymentViaAPI(); 