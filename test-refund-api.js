const axios = require('axios');

const API_BASE = 'http://127.0.0.1:3000/api';

async function testRefundAPI() {
    try {
        console.log('🧪 Testing refund requests API...\n');

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

        // Step 2: Test refund requests endpoint
        console.log('\n2️⃣ Testing refund requests endpoint...');

        try {
            const refundResponse = await axios.get(`${API_BASE}/membership/refund-requests`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Refund requests API successful!');
            console.log('📄 Response status:', refundResponse.status);
            console.log('📄 Response data:', refundResponse.data);

            if (refundResponse.data.data) {
                console.log('📋 Refund requests count:', refundResponse.data.data.length);
                if (refundResponse.data.data.length > 0) {
                    console.log('📋 First refund request:', refundResponse.data.data[0]);
                }
            }

        } catch (refundError) {
            console.error('❌ Refund requests API failed!');
            if (refundError.response) {
                console.error('Status:', refundError.response.status);
                console.error('Data:', refundError.response.data);
                console.error('Headers:', refundError.response.headers);
            } else if (refundError.request) {
                console.error('Request error:', refundError.request);
            } else {
                console.error('Error:', refundError.message);
            }
        }

        // Step 3: Check if RefundRequests table exists
        console.log('\n3️⃣ Testing database tables...');

        try {
            // Test if we can query RefundRequests table directly
            const debugResponse = await axios.get(`${API_BASE}/membership/debug-purchase`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('📊 Debug endpoint accessible');

        } catch (debugError) {
            console.error('❌ Debug endpoint error:', debugError.message);
        }

    } catch (error) {
        console.error('❌ Error:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });
    }
}

testRefundAPI(); 