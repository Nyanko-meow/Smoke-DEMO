const axios = require('axios');

async function testPaymentAPI() {
    try {
        console.log('🔍 Testing payment history API...');

        // You'll need to get a valid token first
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@example.com', // Change to your test account
            password: 'H12345678@'
        });

        if (!loginResponse.data.success) {
            console.error('❌ Login failed');
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful, testing payment-history...');

        const paymentResponse = await axios.get('http://localhost:3000/api/membership/payment-history', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📨 Payment history response:', {
            status: paymentResponse.status,
            success: paymentResponse.data.success,
            dataCount: paymentResponse.data.data?.length || 0,
            firstRecord: paymentResponse.data.data?.[0]
        });

        if (paymentResponse.data.data && paymentResponse.data.data.length > 0) {
            const payment = paymentResponse.data.data[0];
            console.log('💳 First payment details:', {
                StartDate: payment.StartDate,
                EndDate: payment.EndDate,
                PaymentStartDate: payment.PaymentStartDate,
                PaymentEndDate: payment.PaymentEndDate,
                PlanName: payment.PlanName,
                PaymentStatus: payment.PaymentStatus
            });
        }

    } catch (error) {
        console.error('❌ API test failed:', error.response?.data || error.message);
    }
}

testPaymentAPI(); 