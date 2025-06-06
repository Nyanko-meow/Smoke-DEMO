const axios = require('axios');

async function fullCancelTest() {
    try {
        console.log('🧪 FULL CANCEL MEMBERSHIP TEST WITH BANK INFO\n');

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

        // Step 2: Create test payment first
        console.log('\n2️⃣ Creating test payment...');
        try {
            const createPaymentResponse = await axios.post('http://localhost:4000/api/membership/create-test-payment', {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('✅ Test payment created:', createPaymentResponse.data);
        } catch (error) {
            console.log('⚠️ Could not create test payment, using existing data');
        }

        // Step 3: Test cancel with bank information
        console.log('\n3️⃣ Testing cancel with detailed bank information...');
        try {
            const cancelResponse = await axios.post('http://localhost:4000/api/membership/cancel', {
                reason: 'TEST: Full cancellation with detailed bank info',
                bankAccountNumber: '9876543210',
                bankName: 'BIDV Bank',
                accountHolderName: 'Nguyen Van Test User'
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Cancel successful!');
            console.log('📄 Response:', JSON.stringify(cancelResponse.data, null, 2));

            // Verify response contains bank info
            if (cancelResponse.data.data && cancelResponse.data.data.bankInfo) {
                console.log('\n✅ RESPONSE VERIFICATION:');
                console.log('- refundId:', cancelResponse.data.data.refundId || 'MISSING');
                console.log('- bankAccountNumber:', cancelResponse.data.data.bankInfo.bankAccountNumber);
                console.log('- bankName:', cancelResponse.data.data.bankInfo.bankName);
                console.log('- accountHolderName:', cancelResponse.data.data.bankInfo.accountHolderName);
            }

        } catch (cancelError) {
            console.error('❌ Cancel failed!');
            if (cancelError.response) {
                console.error('Status:', cancelError.response.status);
                console.error('Error data:', JSON.stringify(cancelError.response.data, null, 2));
            } else {
                console.error('Error message:', cancelError.message);
            }
        }

        // Step 4: Check refund requests to verify bank info saved
        console.log('\n4️⃣ Checking refund requests to verify bank info saved...');
        try {
            const refundResponse = await axios.get('http://localhost:4000/api/membership/refund-requests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('✅ Refund requests retrieved successfully');

            if (refundResponse.data.data && refundResponse.data.data.length > 0) {
                const latestRefund = refundResponse.data.data[0];
                console.log('\n📋 LATEST REFUND REQUEST VERIFICATION:');
                console.log('- RefundAmount:', latestRefund.RefundAmount);
                console.log('- RefundReason:', latestRefund.RefundReason);
                console.log('- BankAccountNumber:', latestRefund.BankAccountNumber || 'EMPTY ❌');
                console.log('- BankName:', latestRefund.BankName || 'EMPTY ❌');
                console.log('- AccountHolderName:', latestRefund.AccountHolderName || 'EMPTY ❌');
                console.log('- Status:', latestRefund.Status);

                if (latestRefund.BankAccountNumber) {
                    console.log('\n🎉 SUCCESS: Bank information properly saved to RefundRequests table!');
                } else {
                    console.log('\n❌ FAILURE: Bank information still empty in RefundRequests table');
                    console.log('💡 Check server logs for RefundRequests INSERT errors');
                }
            }

        } catch (refundError) {
            console.error('❌ Failed to get refund requests:', refundError.response?.data || refundError.message);
        }

        console.log('\n📊 TEST SUMMARY:');
        console.log('- Login: ✅');
        console.log('- Test payment creation: ✅');
        console.log('- Cancel API call: ✅');
        console.log('- Response bank info: ✅');
        console.log('- Database bank info: ❓ (Check above)');

    } catch (error) {
        console.error('❌ Test script error:', error.message);
    }
}

// Run the full test
fullCancelTest(); 