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

async function resetUserForTesting() {
    try {
        await sql.connect(config);
        console.log('✅ Connected to database');

        const userId = 6; // leghenkiz@gmail.com

        // 1. Delete all cancellation requests for this user
        console.log('🗑️ Deleting all cancellation requests for user...');
        const deleteResult = await sql.query`
            DELETE FROM CancellationRequests WHERE UserID = ${userId}
        `;
        console.log(`✅ Deleted ${deleteResult.rowsAffected[0]} cancellation requests`);

        // 2. Reset membership status to active
        console.log('🔄 Resetting membership status to active...');
        const updateResult = await sql.query`
            UPDATE UserMemberships 
            SET Status = 'active' 
            WHERE UserID = ${userId}
        `;
        console.log(`✅ Updated ${updateResult.rowsAffected[0]} membership records`);

        // 3. Verify the reset
        console.log('\n🔍 Verifying reset...');
        const verifyResult = await sql.query`
            SELECT 
                um.MembershipID,
                um.Status as MembershipStatus,
                mp.Name as PlanName,
                COUNT(cr.CancellationRequestID) as CancellationCount
            FROM UserMemberships um
            JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            LEFT JOIN CancellationRequests cr ON um.MembershipID = cr.MembershipID
            WHERE um.UserID = ${userId}
            GROUP BY um.MembershipID, um.Status, mp.Name
        `;

        verifyResult.recordset.forEach(row => {
            console.log(`📦 Membership ID ${row.MembershipID}: ${row.PlanName}`);
            console.log(`   📊 Status: ${row.MembershipStatus}`);
            console.log(`   🔴 Cancellation Requests: ${row.CancellationCount}`);
        });

        console.log('\n🎉 User reset completed! Ready for testing cancellation again.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

resetUserForTesting(); 