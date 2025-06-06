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

async function directAdminApprove() {
    try {
        await sql.connect(config);
        console.log('✅ Connected to database');

        // 1. Find pending cancellation requests
        const pendingRequests = await sql.query`
            SELECT TOP 5
                cr.*,
                u.FirstName,
                u.LastName,
                u.Email,
                mp.Name as PlanName,
                um.MembershipID
            FROM CancellationRequests cr
            JOIN Users u ON cr.UserID = u.UserID
            JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
            JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            WHERE cr.Status = 'pending'
            ORDER BY cr.RequestedAt DESC
        `;

        console.log(`📊 Found ${pendingRequests.recordset.length} pending cancellation requests`);

        if (pendingRequests.recordset.length === 0) {
            console.log('❌ No pending cancellation requests found');
            return;
        }

        // Display all pending requests
        console.log('\n📋 Pending Cancellation Requests:');
        pendingRequests.recordset.forEach((req, index) => {
            console.log(`${index + 1}. ID: ${req.CancellationRequestID} - ${req.FirstName} ${req.LastName} - ${req.PlanName} - ${req.RequestedRefundAmount?.toLocaleString('vi-VN')} VNĐ`);
        });

        // Process the first one
        const request = pendingRequests.recordset[0];
        console.log(`\n🔍 Processing request ID: ${request.CancellationRequestID}`);
        console.log(`👤 User: ${request.FirstName} ${request.LastName} (${request.Email})`);
        console.log(`📦 Plan: ${request.PlanName}`);
        console.log(`💰 Requested Amount: ${request.RequestedRefundAmount?.toLocaleString('vi-VN')} VNĐ`);

        // Start transaction
        const transaction = new sql.Transaction();
        await transaction.begin();

        try {
            // 2. Approve the cancellation request
            await transaction.request()
                .input('CancellationRequestID', request.CancellationRequestID)
                .input('AdminNotes', 'Direct approval via script - Admin confirmed')
                .input('RefundApproved', 1)
                .input('RefundAmount', request.RequestedRefundAmount)
                .query(`
                    UPDATE CancellationRequests
                    SET Status = 'approved',
                        ProcessedAt = GETDATE(),
                        AdminNotes = @AdminNotes,
                        RefundApproved = @RefundApproved,
                        RefundAmount = @RefundAmount,
                        ProcessedByUserID = 1
                    WHERE CancellationRequestID = @CancellationRequestID
                `);

            console.log('✅ Updated cancellation request to approved');

            // 3. Update membership status to cancelled
            await transaction.request()
                .input('MembershipID', sql.Int, request.MembershipID)
                .query(`
                    UPDATE UserMemberships
                    SET Status = 'cancelled'
                    WHERE MembershipID = @MembershipID
                `);

            console.log('✅ Updated membership status to cancelled');

            // 4. Update user role to guest (if no other active memberships)
            const otherMemberships = await transaction.request()
                .input('UserID', request.UserID)
                .query(`
                    SELECT COUNT(*) as ActiveCount
                    FROM UserMemberships
                    WHERE UserID = @UserID AND Status = 'active'
                `);

            if (otherMemberships.recordset[0].ActiveCount === 0) {
                await transaction.request()
                    .input('UserID', request.UserID)
                    .query(`
                        UPDATE Users
                        SET Role = 'guest'
                        WHERE UserID = @UserID
                    `);
                console.log('✅ Updated user role to guest');
            } else {
                console.log('ℹ️ User still has other active memberships, keeping member role');
            }

            // 5. Create notification for user
            await transaction.request()
                .input('UserID', request.UserID)
                .input('Title', 'Yêu cầu hủy gói đã được chấp nhận')
                .input('Message', `Yêu cầu hủy gói ${request.PlanName} đã được admin chấp nhận. Số tiền hoàn lại: ${request.RequestedRefundAmount?.toLocaleString('vi-VN')} VNĐ sẽ được chuyển vào tài khoản ngân hàng của bạn trong 3-5 ngày làm việc.`)
                .input('Type', 'cancellation_approved')
                .input('RelatedID', request.CancellationRequestID)
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type, RelatedID, CreatedAt)
                    VALUES (@UserID, @Title, @Message, @Type, @RelatedID, GETDATE())
                `);

            console.log('✅ Created notification for user');

            await transaction.commit();
            console.log('\n🎉 Cancellation approved successfully!');

            // 6. Verify the changes
            const verification = await sql.query`
                SELECT 
                    cr.Status as CancellationStatus,
                    cr.RefundApproved,
                    cr.RefundAmount,
                    cr.ProcessedAt,
                    um.Status as MembershipStatus,
                    u.Role as UserRole
                FROM CancellationRequests cr
                JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
                JOIN Users u ON cr.UserID = u.UserID
                WHERE cr.CancellationRequestID = ${request.CancellationRequestID}
            `;

            const result = verification.recordset[0];
            console.log('\n📊 Final Status:');
            console.log('🔴 Cancellation Status:', result.CancellationStatus);
            console.log('💰 Refund Approved:', result.RefundApproved ? 'Yes' : 'No');
            console.log('💵 Refund Amount:', result.RefundAmount?.toLocaleString('vi-VN'), 'VNĐ');
            console.log('📦 Membership Status:', result.MembershipStatus);
            console.log('👤 User Role:', result.UserRole);
            console.log('⏰ Processed At:', result.ProcessedAt);

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

directAdminApprove(); 