const axios = require('axios');

async function testBankInfoSaving() {
    try {
        console.log('🔍 Testing Bank Information Storage in RefundRequests Table\n');

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

        // Step 2: Check current refund requests before test
        console.log('\n2️⃣ Checking current refund requests...');
        const refundsBefore = await axios.get('http://localhost:4000/api/membership/refund-requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('📋 Current refund requests:', refundsBefore.data.data?.length || 0);

        if (refundsBefore.data.data && refundsBefore.data.data.length > 0) {
            const latestRefund = refundsBefore.data.data[0];
            console.log('📋 Latest refund request bank info:');
            console.log('  BankAccountNumber:', latestRefund.BankAccountNumber || 'EMPTY');
            console.log('  BankName:', latestRefund.BankName || 'EMPTY');
            console.log('  AccountHolderName:', latestRefund.AccountHolderName || 'EMPTY');

            if (!latestRefund.BankAccountNumber) {
                console.log('\n❌ PROBLEM CONFIRMED: Bank information is empty in RefundRequests table');
                console.log('💡 This confirms the issue is in the backend RefundRequests INSERT');
            } else {
                console.log('\n✅ Bank information is properly stored');
            }
        }

        console.log('\n📊 Analysis Summary:');
        console.log('- Cancel membership API works ✅');
        console.log('- Record is created in RefundRequests table ✅');
        console.log('- Bank information is missing in RefundRequests ❌');
        console.log('- Need to debug the RefundRequests INSERT statement');

    } catch (error) {
        console.error('❌ Test error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

// Run the test
testBankInfoSaving(); 