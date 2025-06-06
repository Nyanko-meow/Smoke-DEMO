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

async function simpleApprove() {
    try {
        await sql.connect(config);
        console.log('✅ Connected to database');

        // 1. Update cancellation request to approved
        const updateResult = await sql.query`
            UPDATE CancellationRequests
            SET Status = 'approved',
                ProcessedAt = GETDATE(),
                AdminNotes = 'Admin approved via script',
                RefundApproved = 1,
                ProcessedByUserID = 1
            WHERE CancellationRequestID = 17 AND Status = 'pending'
        `;

        console.log('✅ Updated cancellation request rows:', updateResult.rowsAffected[0]);

        // 2. Update membership to cancelled  
        const membershipUpdate = await sql.query`
            UPDATE UserMemberships
            SET Status = 'cancelled'
            WHERE MembershipID IN (
                SELECT MembershipID 
                FROM CancellationRequests 
                WHERE CancellationRequestID = 17
            )
        `;

        console.log('✅ Updated membership rows:', membershipUpdate.rowsAffected[0]);

        // 3. Update user role to guest
        const userUpdate = await sql.query`
            UPDATE Users
            SET Role = 'guest'
            WHERE UserID IN (
                SELECT UserID 
                FROM CancellationRequests 
                WHERE CancellationRequestID = 17
            )
        `;

        console.log('✅ Updated user role rows:', userUpdate.rowsAffected[0]);

        // 4. Verify the changes
        const verification = await sql.query`
            SELECT 
                cr.Status as CancellationStatus,
                cr.RefundApproved,
                cr.ProcessedAt,
                um.Status as MembershipStatus,
                u.Role as UserRole,
                u.FirstName,
                u.LastName
            FROM CancellationRequests cr
            JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
            JOIN Users u ON cr.UserID = u.UserID
            WHERE cr.CancellationRequestID = 17
        `;

        if (verification.recordset.length > 0) {
            const result = verification.recordset[0];
            console.log('\n🎉 SUCCESS! Cancellation approved:');
            console.log('👤 User:', result.FirstName, result.LastName);
            console.log('🔴 Cancellation Status:', result.CancellationStatus);
            console.log('💰 Refund Approved:', result.RefundApproved ? 'Yes' : 'No');
            console.log('📦 Membership Status:', result.MembershipStatus);
            console.log('👤 User Role:', result.UserRole);
            console.log('⏰ Processed At:', result.ProcessedAt);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

simpleApprove(); 