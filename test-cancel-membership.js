const axios = require('axios');

async function testCancelMembership() {
    try {
        console.log('🔍 Testing Cancel Membership Functionality\n');

        // Step 1: Login to get token
        console.log('1️⃣ Logging in...');
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'leghenkiz@gmail.com', // Or the email you're using
            password: 'H12345678@'
        });

        if (!loginResponse.data.success) {
            console.error('❌ Login failed:', loginResponse.data.message);
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful, token:', token.substring(0, 20) + '...');

        // Step 2: Check if user has active payments
        console.log('\n2️⃣ Checking user payments...');
        try {
            const paymentsResponse = await axios.get('http://localhost:4000/api/membership/payment-history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('✅ Payment history response:', {
                success: paymentsResponse.data.success,
                count: paymentsResponse.data.data?.length || 0,
                payments: paymentsResponse.data.data?.map(p => ({
                    PaymentID: p.PaymentID,
                    Status: p.Status,
                    Amount: p.Amount,
                    PlanName: p.PlanName
                }))
            });
        } catch (error) {
            console.error('❌ Failed to get payment history:', error.response?.data || error.message);
        }

        // Step 3: Test the cancel endpoint directly
        console.log('\n3️⃣ Testing cancel endpoint...');
        try {
            const cancelResponse = await axios.post('http://localhost:4000/api/membership/cancel', {
                reason: 'Test cancellation',
                bankAccount: '0100109637777'
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Cancel successful!');
            console.log('📄 Response:', cancelResponse.data);

        } catch (cancelError) {
            console.error('❌ Cancel failed!');
            if (cancelError.response) {
                console.error('Status:', cancelError.response.status);
                console.error('Error data:', cancelError.response.data);
                console.error('Headers:', cancelError.response.headers);
            } else if (cancelError.request) {
                console.error('No response received');
                console.error('Request error:', cancelError.request);
            } else {
                console.error('Error message:', cancelError.message);
            }
        }

        // Step 4: Check if server is responding
        console.log('\n4️⃣ Testing server health...');
        try {
            const healthResponse = await axios.get('http://localhost:4000/api/membership/plans');
            console.log('✅ Server is responsive, plans count:', healthResponse.data.data?.length || 0);
        } catch (error) {
            console.error('❌ Server health check failed:', error.message);
            if (error.code === 'ECONNREFUSED') {
                console.log('🔴 Server is not running on port 4000!');
            }
        }

    } catch (error) {
        console.error('❌ Test script error:', error.message);
    }
}

// Run the test
testCancelMembership(); 