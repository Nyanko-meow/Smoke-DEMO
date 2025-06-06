const axios = require('axios');

async function testPayment() {
    try {
        console.log('🔍 Testing payment endpoint...');

        // First login to get token
        console.log('1. Logging in...');
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'member@example.com',
            password: 'H12345678@'
        });

        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }

        console.log('✅ Login successful');
        const token = loginResponse.data.token;

        // Get plans first
        console.log('2. Getting plans...');
        const plansResponse = await axios.get('http://localhost:4000/api/membership/plans');
        console.log('Available plans:', plansResponse.data.data?.length || 0);

        // Test payment with correct planId
        console.log('3. Testing payment...');
        const paymentResponse = await axios.post(
            'http://localhost:4000/api/membership/purchase',
            {
                planId: 1,  // Use first plan ID
                paymentMethod: 'BankTransfer'
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Payment response:', paymentResponse.data);
    } catch (error) {
        console.log('❌ Error details:');
        console.log('Status:', error.response?.status);
        console.log('Data:', error.response?.data);
        console.log('Message:', error.message);
    }
}

testPayment(); 