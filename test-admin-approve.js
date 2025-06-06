const axios = require('axios');

async function testAdminApproval() {
    console.log('🔍 Testing Admin Approval Direct');

    const BASE_URL = 'http://localhost:4000';

    try {
        // Step 1: Admin login
        console.log('\n1️⃣ Admin Login...');
        const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@smokeking.com',
            password: 'admin123'
        });

        if (!adminLoginResponse.data.success) {
            // Try different admin credentials
            console.log('🔄 Trying different admin credentials...');
            const altLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: 'admin@example.com',
                password: 'admin123'
            });

            if (!altLoginResponse.data.success) {
                throw new Error('Admin login failed with both credentials');
            }
        }

        const adminToken = adminLoginResponse.data.success ? adminLoginResponse.data.token : altLoginResponse.data.token;
        console.log('✅ Admin logged in successfully');
        console.log('🔑 Token:', adminToken?.substring(0, 20) + '...');

        // Step 2: Get pending cancellations
        console.log('\n2️⃣ Getting Pending Cancellations...');
        const pendingResponse = await axios.get(`${BASE_URL}/api/admin/pending-cancellations`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (!pendingResponse.data.success) {
            throw new Error('Failed to get pending cancellations: ' + pendingResponse.data.message);
        }

        console.log('✅ Pending cancellations:', pendingResponse.data.data.length);

        if (pendingResponse.data.data.length === 0) {
            console.log('❌ No pending cancellations found to approve');
            return;
        }

        // Get the first pending request
        const cancellationRequest = pendingResponse.data.data[0];
        console.log('📋 First pending request:', {
            ID: cancellationRequest.CancellationRequestID,
            UserName: `${cancellationRequest.FirstName} ${cancellationRequest.LastName}`,
            PlanName: cancellationRequest.PlanName,
            RequestedAmount: cancellationRequest.RequestedRefundAmount
        });

        // Step 3: Approve the cancellation
        console.log('\n3️⃣ Approving Cancellation...');
        const approveData = {
            approveRefund: true,
            refundAmount: cancellationRequest.RequestedRefundAmount || 99500,
            adminNotes: 'Test approval via direct script'
        };

        console.log('📝 Approval data:', approveData);

        const approveResponse = await axios.post(
            `${BASE_URL}/api/admin/approve-cancellation/${cancellationRequest.CancellationRequestID}`,
            approveData,
            {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }
        );

        if (approveResponse.data.success) {
            console.log('✅ Cancellation approved successfully!');
            console.log('📊 Response:', approveResponse.data);
        } else {
            console.log('❌ Approval failed:', approveResponse.data);
        }

        // Step 4: Verify the approval
        console.log('\n4️⃣ Verifying Approval...');
        const verifyResponse = await axios.get(`${BASE_URL}/api/admin/cancellation-history?limit=5`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (verifyResponse.data.success) {
            const latestHistory = verifyResponse.data.data[0];
            console.log('📋 Latest history:', {
                ID: latestHistory?.CancellationRequestID,
                Status: latestHistory?.Status,
                RefundApproved: latestHistory?.RefundApproved,
                RefundAmount: latestHistory?.RefundAmount
            });
        }

        console.log('\n🎉 Admin approval test completed!');

    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

testAdminApproval(); 