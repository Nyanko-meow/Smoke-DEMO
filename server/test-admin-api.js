const axios = require('axios');
const sql = require('mssql');

// Database configuration  
const config = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

async function testAdminAPI() {
    let pool = null;
    try {
        console.log('🔗 Connecting to database...');
        pool = await sql.connect(config);
        console.log('✅ Database connected');

        // Test direct SQL query (same as admin route)
        console.log('\n🔍 Testing admin route SQL query directly...');
        const sqlResult = await pool.request().query(`
            SELECT 
                p.PaymentID,
                p.UserID,
                p.PlanID,
                p.Amount,
                p.PaymentMethod,
                p.Status,
                p.TransactionID,
                p.PaymentDate,
                u.FirstName,
                u.LastName,
                u.Email,
                u.PhoneNumber,
                mp.Name as PlanName,
                mp.Description as PlanDescription,
                mp.Duration,
                um.StartDate,
                um.EndDate,
                um.Status as MembershipStatus
            FROM Payments p
            JOIN Users u ON p.UserID = u.UserID
            JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
            LEFT JOIN UserMemberships um ON p.UserID = um.UserID AND um.PlanID = mp.PlanID
            WHERE p.Status = 'pending'
            ORDER BY p.PaymentDate DESC
        `);

        console.log(`📊 SQL Query Result: ${sqlResult.recordset.length} records`);
        if (sqlResult.recordset.length > 0) {
            console.log('📋 Records found:');
            sqlResult.recordset.forEach((record, index) => {
                console.log(`   ${index + 1}. PaymentID: ${record.PaymentID}, User: ${record.FirstName} ${record.LastName}, Plan: ${record.PlanName}, Status: ${record.Status}`);
            });
        } else {
            console.log('✅ No pending payments found in SQL query');
        }

        // Test with different JOIN to see if that's the issue
        console.log('\n🔍 Testing simpler query without JOIN...');
        const simpleResult = await pool.request().query(`
            SELECT COUNT(*) as PendingCount
            FROM Payments 
            WHERE Status = 'pending'
        `);
        console.log(`📊 Simple count query: ${simpleResult.recordset[0].PendingCount} pending payments`);

        // Test if there are any payments at all
        console.log('\n🔍 Checking all payments...');
        const allPaymentsResult = await pool.request().query(`
            SELECT Status, COUNT(*) as Count
            FROM Payments 
            GROUP BY Status
            ORDER BY Count DESC
        `);
        console.log('📊 All payments by status:');
        allPaymentsResult.recordset.forEach(row => {
            console.log(`   ${row.Status}: ${row.Count} payments`);
        });

        // Test specific user payments
        console.log('\n🔍 Checking payments for leghenkiz@gmail.com...');
        const userPaymentsResult = await pool.request().query(`
            SELECT p.*, u.Email
            FROM Payments p
            JOIN Users u ON p.UserID = u.UserID
            WHERE u.Email = 'leghenkiz@gmail.com'
            ORDER BY p.PaymentDate DESC
        `);
        console.log(`📊 Payments for leghenkiz@gmail.com: ${userPaymentsResult.recordset.length}`);
        userPaymentsResult.recordset.forEach((payment, index) => {
            console.log(`   ${index + 1}. ID: ${payment.PaymentID}, Status: ${payment.Status}, Amount: ${payment.Amount}, Date: ${payment.PaymentDate}`);
        });

    } catch (error) {
        console.error('❌ Error testing admin API:', error);
    } finally {
        if (pool) {
            await pool.close();
            console.log('🔌 Database connection closed');
        }
    }
}

async function testAPIEndpoint() {
    try {
        console.log('\n🌐 Testing HTTP API endpoint...');
        console.log('Note: Server needs to be running on port 4000');

        // This would require the server to be running and authentication token
        // For now just showing the SQL query results above
        console.log('⏭️ Skipping HTTP test - use the SQL results above');

    } catch (error) {
        console.log('❌ HTTP API test failed (server might not be running):', error.message);
    }
}

console.log('🧪 Testing Admin Pending Payments API...\n');
testAdminAPI().then(() => testAPIEndpoint()); 