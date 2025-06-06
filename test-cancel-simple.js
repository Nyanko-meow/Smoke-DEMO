const axios = require('axios');

const testCancelMembership = async () => {
    try {
        console.log('🔄 Testing membership cancellation...');

        // Step 1: Login to get token
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'leghenkiz@gmail.com',
            password: 'H12345678@'
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Step 2: Test cancellation with complete bank info
        const cancelData = {
            reason: 'Test hủy gói dịch vụ',
            bankAccountNumber: '0100109637777',
            bankName: 'MB BANK',
            accountHolderName: 'TRAN GIA HUY'
        };

        console.log('📤 Sending cancellation request with data:', cancelData);

        const cancelResponse = await axios.post('http://localhost:4000/api/membership/simple-cancel', cancelData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📊 Cancel response:', {
            status: cancelResponse.status,
            success: cancelResponse.data.success,
            message: cancelResponse.data.message,
            data: cancelResponse.data.data
        });

        if (cancelResponse.data.success) {
            console.log('🎉 Cancellation request sent successfully!');
            console.log('📝 Cancellation ID:', cancelResponse.data.data.cancellationRequestId);
            console.log('💰 Refund amount:', cancelResponse.data.data.refundAmount);
        } else {
            console.log('❌ Cancellation failed:', cancelResponse.data.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
    }
};

testCancelMembership(); 