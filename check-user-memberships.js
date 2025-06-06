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

async function checkUserMemberships() {
    try {
        await sql.connect(config);
        console.log('✅ Connected to database');

        // Check specific user (UserID 6 - leghenkiz@gmail.com)
        const specificUser = await sql.query`
            SELECT 
                u.UserID,
                u.FirstName,
                u.LastName,
                u.Email,
                u.Role,
                um.MembershipID,
                um.Status as MembershipStatus,
                mp.Name as PlanName,
                mp.Price,
                um.StartDate,
                um.EndDate,
                um.CreatedAt,
                p.PaymentID,
                p.Status as PaymentStatus,
                p.Amount as PaidAmount
            FROM Users u
            LEFT JOIN UserMemberships um ON u.UserID = um.UserID
            LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            LEFT JOIN Payments p ON u.UserID = p.UserID AND um.PlanID = p.PlanID
            WHERE u.UserID = 6
            ORDER BY um.CreatedAt DESC
        `;

        console.log('\n👤 User ID 6 (leghenkiz@gmail.com) current status:');
        specificUser.recordset.forEach(membership => {
            console.log(`\n📦 Membership ID: ${membership.MembershipID || 'N/A'}`);
            console.log(`   📧 Email: ${membership.Email}`);
            console.log(`   🎭 Role: ${membership.Role}`);
            console.log(`   📋 Plan: ${membership.PlanName || 'No Plan'}`);
            console.log(`   📊 Membership Status: ${membership.MembershipStatus || 'No membership'}`);
            console.log(`   💰 Price: ${membership.Price || 'N/A'} VNĐ`);
            console.log(`   📅 Period: ${membership.StartDate || 'N/A'} to ${membership.EndDate || 'N/A'}`);
            console.log(`   🕐 Created: ${membership.CreatedAt || 'N/A'}`);
            if (membership.PaymentID) {
                console.log(`   💳 Payment: ID ${membership.PaymentID} - ${membership.PaymentStatus} - ${membership.PaidAmount} VNĐ`);
            }
        });

        // Check cancellation requests for this user
        const cancellationRequests = await sql.query`
            SELECT 
                cr.*,
                mp.Name as PlanName
            FROM CancellationRequests cr
            JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
            JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            WHERE cr.UserID = 6
            ORDER BY cr.RequestedAt DESC
        `;

        console.log('\n📋 Cancellation requests for this user:');
        if (cancellationRequests.recordset.length > 0) {
            cancellationRequests.recordset.forEach(req => {
                console.log(`\n🔴 Request ID: ${req.CancellationRequestID}`);
                console.log(`   📦 Plan: ${req.PlanName}`);
                console.log(`   📊 Status: ${req.Status}`);
                console.log(`   💰 Requested Refund: ${req.RequestedRefundAmount} VNĐ`);
                console.log(`   🕐 Requested At: ${req.RequestedAt}`);
                console.log(`   💬 Reason: ${req.CancellationReason}`);
                console.log(`   🏦 Bank Info: ${req.BankName} - ${req.BankAccountNumber} - ${req.AccountHolderName}`);
            });
        } else {
            console.log('   ➡️  No cancellation requests found');
        }

        // Solution: Reset membership to active if it's pending_cancellation
        const pendingMemberships = await sql.query`
            SELECT MembershipID, Status 
            FROM UserMemberships 
            WHERE UserID = 6 AND Status = 'pending_cancellation'
        `;

        if (pendingMemberships.recordset.length > 0) {
            console.log('\n🔄 Found memberships in pending_cancellation status. Resetting to active for testing...');

            await sql.query`
                UPDATE UserMemberships 
                SET Status = 'active' 
                WHERE UserID = 6 AND Status = 'pending_cancellation'
            `;

            console.log('✅ Reset membership status to active');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

checkUserMemberships(); 