const axios = require('axios');

async function testCancellationFlow() {
    console.log('🔍 Testing Cancellation Flow');

    const BASE_URL = 'http://localhost:4000';

    try {
        // Step 1: Member login and get token
        console.log('\n1️⃣ Member Login...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'leghenkiz@gmail.com',
            password: '123456'
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }

        const memberToken = loginResponse.data.token;
        console.log('✅ Member logged in successfully');

        // Step 2: Member requests cancellation
        console.log('\n2️⃣ Member Request Cancellation...');
        const cancelResponse = await axios.post(`${BASE_URL}/api/membership/request-cancellation`, {
            membershipId: 'AUTO_DETECT',
            reason: 'Test cancellation workflow',
            requestRefund: true,
            requestedRefundAmount: null, // Auto-calculate 50%
            bankAccountNumber: '1234567890',
            bankName: 'Vietcombank',
            accountHolderName: 'Tran Huy Test'
        }, {
            headers: { 'Authorization': `Bearer ${memberToken}` }
        });

        if (cancelResponse.data.success) {
            console.log('✅ Cancellation request created:', cancelResponse.data.data);
            const cancellationId = cancelResponse.data.data.cancellationRequestId;

            // Step 3: Admin login
            console.log('\n3️⃣ Admin Login...');
            const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: 'admin@smokeking.com',
                password: 'admin123'
            });

            if (!adminLoginResponse.data.success) {
                throw new Error('Admin login failed');
            }

            const adminToken = adminLoginResponse.data.token;
            console.log('✅ Admin logged in successfully');

            // Step 4: Admin views pending cancellations
            console.log('\n4️⃣ Admin Check Pending Cancellations...');
            const pendingResponse = await axios.get(`${BASE_URL}/api/admin/pending-cancellations`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            if (pendingResponse.data.success) {
                console.log('✅ Pending cancellations:', pendingResponse.data.data.length);
                console.log('📋 First request:', pendingResponse.data.data[0]);
            }

            // Step 5: Admin approves cancellation
            console.log('\n5️⃣ Admin Approve Cancellation...');
            const approveResponse = await axios.post(`${BASE_URL}/api/admin/approve-cancellation/${cancellationId}`, {
                approveRefund: true,
                refundAmount: 99500, // 50% of 199k
                adminNotes: 'Test approval for cancellation workflow'
            }, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            if (approveResponse.data.success) {
                console.log('✅ Cancellation approved:', approveResponse.data.data);
            } else {
                console.log('❌ Approval failed:', approveResponse.data);
            }

            // Step 6: Member checks refund requests
            console.log('\n6️⃣ Member Check Refund Requests...');
            const refundRequestsResponse = await axios.get(`${BASE_URL}/api/membership/refund-requests`, {
                headers: { 'Authorization': `Bearer ${memberToken}` }
            });

            if (refundRequestsResponse.data.success) {
                console.log('✅ Member refund requests:', refundRequestsResponse.data.data.length);
                const latestRequest = refundRequestsResponse.data.data[0];
                console.log('📋 Latest request status:', {
                    Status: latestRequest.Status,
                    RefundApproved: latestRequest.RefundApproved,
                    ApprovedRefundAmount: latestRequest.ApprovedRefundAmount
                });
            }

            console.log('\n🎉 Cancellation flow test completed successfully!');

        } else {
            console.log('❌ Cancellation request failed:', cancelResponse.data);
        }

    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

testCancellationFlow(); 