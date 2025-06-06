const sql = require('mssql');

const config = {
    server: 'localhost',
    database: 'SMOKEKING',
    authentication: {
        type: 'default',
        options: {
            userName: 'sa',
            password: '12345'
        }
    },
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function adminApproveCancellation() {
    try {
        await sql.connect(config);
        console.log('✅ Connected to database');

        const userId = 6; // leghenkiz@gmail.com

        // 1. Find pending cancellation request
        const pendingRequest = await sql.query`
            SELECT TOP 1 
                cr.*,
                um.MembershipID,
                mp.Name as PlanName
            FROM CancellationRequests cr
            JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
            JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            WHERE cr.UserID = ${userId} AND cr.Status = 'pending'
            ORDER BY cr.RequestedAt DESC
        `;

        if (pendingRequest.recordset.length === 0) {
            console.log('❌ No pending cancellation request found');
            return;
        }

        const request = pendingRequest.recordset[0];
        console.log('🔍 Found pending request:', {
            CancellationRequestID: request.CancellationRequestID,
            PlanName: request.PlanName,
            RequestedRefundAmount: request.RequestedRefundAmount
        });

        // 2. Admin approves the cancellation
        console.log('✅ Admin approving cancellation...');

        const transaction = sql.transaction();
        await transaction.begin();

        try {
            // Update cancellation request to approved
            await transaction.request()
                .input('CancellationRequestID', request.CancellationRequestID)
                .input('AdminNotes', 'Auto-approved for testing purposes')
                .input('RefundApproved', 1)
                .input('RefundAmount', request.RequestedRefundAmount)
                .query(`
                    UPDATE CancellationRequests
                    SET Status = 'approved',
                        ProcessedAt = GETDATE(),
                        AdminNotes = @AdminNotes,
                        RefundApproved = @RefundApproved,
                        RefundAmount = @RefundAmount
                    WHERE CancellationRequestID = @CancellationRequestID
                `);

            // Update membership status to cancelled
            await transaction.request()
                .input('MembershipID', request.MembershipID)
                .query(`
                    UPDATE UserMemberships
                    SET Status = 'cancelled'
                    WHERE MembershipID = @MembershipID
                `);

            // Update user role to guest
            await transaction.request()
                .input('UserID', userId)
                .query(`
                    UPDATE Users
                    SET Role = 'guest'
                    WHERE UserID = @UserID
                `);

            await transaction.commit();
            console.log('✅ Cancellation approved successfully!');

            // Verify the changes
            const verification = await sql.query`
                SELECT 
                    u.Role,
                    um.Status as MembershipStatus,
                    cr.Status as CancellationStatus,
                    cr.RefundAmount
                FROM Users u
                JOIN UserMemberships um ON u.UserID = um.UserID
                JOIN CancellationRequests cr ON um.MembershipID = cr.MembershipID
                WHERE u.UserID = ${userId} AND cr.CancellationRequestID = ${request.CancellationRequestID}
            `;

            console.log('\n📊 Final Status:');
            const result = verification.recordset[0];
            console.log('👤 User Role:', result.Role);
            console.log('📦 Membership Status:', result.MembershipStatus);
            console.log('🔴 Cancellation Status:', result.CancellationStatus);
            console.log('💰 Refund Amount:', result.RefundAmount, 'VNĐ');

            console.log('\n🎉 Gói dịch vụ đã được hủy hoàn toàn!');
            console.log('💰 Hoàn tiền 50% đã được phê duyệt');
            console.log('👤 User role đã chuyển về guest');

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

adminApproveCancellation(); 