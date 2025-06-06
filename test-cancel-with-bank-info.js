const axios = require('axios');

async function testCancelWithBankInfo() {
    try {
        console.log('🔍 Testing Cancel Membership with Bank Information\n');

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

        // Step 2: Check current payment history
        console.log('\n2️⃣ Checking payment history...');
        try {
            const paymentsResponse = await axios.get('http://localhost:4000/api/membership/payment-history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('📋 Payment history:', {
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

        // Step 3: Test cancel with bank information
        console.log('\n3️⃣ Testing cancel with bank information...');
        try {
            const cancelResponse = await axios.post('http://localhost:4000/api/membership/cancel', {
                reason: 'Test cancellation with bank info',
                bankAccountNumber: '1234567890',
                bankName: 'Vietcombank',
                accountHolderName: 'Nguyễn Văn Test'
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Cancel successful!');
            console.log('📄 Response:', JSON.stringify(cancelResponse.data, null, 2));

        } catch (cancelError) {
            console.error('❌ Cancel failed!');
            if (cancelError.response) {
                console.error('Status:', cancelError.response.status);
                console.error('Error data:', JSON.stringify(cancelError.response.data, null, 2));
            } else {
                console.error('Error message:', cancelError.message);
            }
        }

        // Step 4: Check refund requests
        console.log('\n4️⃣ Checking refund requests...');
        try {
            const refundResponse = await axios.get('http://localhost:4000/api/membership/refund-requests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('✅ Refund requests retrieved successfully');
            console.log('📄 Refund requests:', JSON.stringify(refundResponse.data, null, 2));

        } catch (refundError) {
            console.error('❌ Failed to get refund requests:', refundError.response?.data || refundError.message);
        }

    } catch (error) {
        console.error('❌ Test script error:', error.message);
    }
}

// Run the test
testCancelWithBankInfo(); 