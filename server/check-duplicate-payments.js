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

async function checkDuplicatePayments() {
    let pool = null;
    try {
        console.log('🔗 Connecting to database...');
        pool = await sql.connect(config);
        console.log('✅ Database connected');

        // 1. Check total pending payments
        console.log('\n🔍 Checking total pending payments...');
        const totalResult = await pool.request().query(`
            SELECT COUNT(*) as TotalPendingPayments FROM Payments WHERE Status = 'pending'
        `);
        console.log(`📊 Total pending payments: ${totalResult.recordset[0].TotalPendingPayments}`);

        // 2. Check unique users with pending payments
        console.log('\n👥 Checking unique users with pending payments...');
        const uniqueUsersResult = await pool.request().query(`
            SELECT COUNT(DISTINCT UserID) as UniqueUsersWithPendingPayments FROM Payments WHERE Status = 'pending'
        `);
        console.log(`👤 Unique users with pending payments: ${uniqueUsersResult.recordset[0].UniqueUsersWithPendingPayments}`);

        // 3. Find users with multiple pending payments (duplicates)
        console.log('\n🔍 Finding users with duplicate pending payments...');
        const duplicatesResult = await pool.request().query(`
            SELECT 
                u.UserID,
                u.FirstName,
                u.LastName,
                u.Email,
                COUNT(p.PaymentID) as PendingPaymentCount,
                STRING_AGG(CAST(p.PaymentID AS VARCHAR), ', ') as PaymentIDs
            FROM Payments p
            JOIN Users u ON p.UserID = u.UserID
            WHERE p.Status = 'pending'
            GROUP BY u.UserID, u.FirstName, u.LastName, u.Email
            HAVING COUNT(p.PaymentID) > 1
            ORDER BY PendingPaymentCount DESC
        `);

        if (duplicatesResult.recordset.length > 0) {
            console.log('\n🚨 Found users with duplicate pending payments:');
            duplicatesResult.recordset.forEach(user => {
                console.log(`   ${user.FirstName} ${user.LastName} (${user.Email}): ${user.PendingPaymentCount} payments - IDs: ${user.PaymentIDs}`);
            });
        } else {
            console.log('✅ No duplicate pending payments found');
        }

        // 4. Show all pending payments details
        console.log('\n📋 All pending payments details:');
        const allPendingResult = await pool.request().query(`
            SELECT 
                p.PaymentID,
                p.UserID,
                u.FirstName,
                u.LastName,
                u.Email,
                p.PlanID,
                mp.Name as PlanName,
                p.Amount,
                p.PaymentMethod,
                p.TransactionID,
                p.PaymentDate
            FROM Payments p
            JOIN Users u ON p.UserID = u.UserID
            JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
            WHERE p.Status = 'pending'
            ORDER BY u.Email, p.PaymentDate DESC
        `);

        console.log(`📊 Found ${allPendingResult.recordset.length} pending payments:`);
        allPendingResult.recordset.forEach((payment, index) => {
            console.log(`   ${index + 1}. ID: ${payment.PaymentID}, User: ${payment.FirstName} ${payment.LastName} (${payment.Email}), Plan: ${payment.PlanName}, Amount: ${payment.Amount}, Date: ${payment.PaymentDate}`);
        });

        // 5. Check if there are exact duplicates (same user, same plan, same amount)
        console.log('\n🔍 Checking for exact duplicate payments...');
        const exactDuplicatesResult = await pool.request().query(`
            SELECT 
                p.UserID,
                p.PlanID,
                p.Amount,
                u.FirstName,
                u.LastName,
                u.Email,
                mp.Name as PlanName,
                COUNT(*) as DuplicateCount,
                STRING_AGG(CAST(p.PaymentID AS VARCHAR), ', ') as PaymentIDs
            FROM Payments p
            JOIN Users u ON p.UserID = u.UserID
            JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
            WHERE p.Status = 'pending'
            GROUP BY p.UserID, p.PlanID, p.Amount, u.FirstName, u.LastName, u.Email, mp.Name
            HAVING COUNT(*) > 1
            ORDER BY DuplicateCount DESC
        `);

        if (exactDuplicatesResult.recordset.length > 0) {
            console.log('\n🚨 Found exact duplicate payments:');
            exactDuplicatesResult.recordset.forEach(duplicate => {
                console.log(`   ${duplicate.FirstName} ${duplicate.LastName} (${duplicate.Email}) - Plan: ${duplicate.PlanName}, Amount: ${duplicate.Amount}, Count: ${duplicate.DuplicateCount}, IDs: ${duplicate.PaymentIDs}`);
            });
        } else {
            console.log('✅ No exact duplicate payments found');
        }

        console.log('\n🎉 Duplicate payments check completed!');

    } catch (error) {
        console.error('❌ Error checking duplicate payments:', error);
    } finally {
        if (pool) {
            await pool.close();
            console.log('🔌 Database connection closed');
        }
    }
}

checkDuplicatePayments(); 