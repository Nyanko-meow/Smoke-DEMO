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

async function createTestPayments() {
    let pool = null;
    try {
        console.log('🔗 Connecting to database...');
        pool = await sql.connect(config);
        console.log('✅ Database connected');

        // First check if user Tran Huy exists
        console.log('\n🔍 Checking if test user exists...');
        const userCheck = await pool.request().query(`
            SELECT UserID, FirstName, LastName, Email FROM Users WHERE Email = 'leghenkiz@gmail.com'
        `);

        if (userCheck.recordset.length === 0) {
            console.log('❌ User leghenkiz@gmail.com not found. Creating test user...');

            // Create test user
            const createUserResult = await pool.request()
                .input('Email', 'leghenkiz@gmail.com')
                .input('FirstName', 'Tran')
                .input('LastName', 'Huy')
                .input('Password', '123456')
                .query(`
                    INSERT INTO Users (Email, FirstName, LastName, Password, Role, IsActive, EmailVerified)
                    OUTPUT INSERTED.UserID
                    VALUES (@Email, @FirstName, @LastName, @Password, 'guest', 1, 1)
                `);

            console.log(`✅ Created test user with ID: ${createUserResult.recordset[0].UserID}`);
        } else {
            console.log(`✅ Found test user: ${userCheck.recordset[0].FirstName} ${userCheck.recordset[0].LastName} (ID: ${userCheck.recordset[0].UserID})`);
        }

        // Get the user ID
        const userResult = await pool.request().query(`
            SELECT UserID FROM Users WHERE Email = 'leghenkiz@gmail.com'
        `);
        const userId = userResult.recordset[0].UserID;

        // Check if Premium Plan exists
        console.log('\n🔍 Checking Premium Plan...');
        const planCheck = await pool.request().query(`
            SELECT PlanID, Name, Price FROM MembershipPlans WHERE Name LIKE '%Premium%'
        `);

        if (planCheck.recordset.length === 0) {
            console.log('❌ Premium Plan not found');
            return;
        }

        const plan = planCheck.recordset[0];
        console.log(`✅ Found plan: ${plan.Name} (ID: ${plan.PlanID}, Price: ${plan.Price})`);

        // Clear existing pending payments for this user
        console.log('\n🧹 Clearing existing pending payments...');
        await pool.request()
            .input('UserID', userId)
            .query(`DELETE FROM Payments WHERE UserID = @UserID AND Status = 'pending'`);

        // Create 3 test pending payments (simulating the duplicate issue)
        console.log('\n💳 Creating test pending payments...');

        for (let i = 1; i <= 3; i++) {
            const result = await pool.request()
                .input('UserID', userId)
                .input('PlanID', plan.PlanID)
                .input('Amount', plan.Price)
                .input('PaymentMethod', 'BankTransfer')
                .input('TransactionID', `TEST-${Date.now()}-${i}`)
                .input('Status', 'pending')
                .query(`
                    INSERT INTO Payments (UserID, PlanID, Amount, PaymentMethod, TransactionID, Status)
                    OUTPUT INSERTED.PaymentID, INSERTED.TransactionID
                    VALUES (@UserID, @PlanID, @Amount, @PaymentMethod, @TransactionID, @Status)
                `);

            const payment = result.recordset[0];
            console.log(`   ✅ Created payment ${i}: ID ${payment.PaymentID}, Transaction: ${payment.TransactionID}`);
        }

        // Verify the test payments
        console.log('\n🔍 Verifying created test payments...');
        const verifyResult = await pool.request().query(`
            SELECT 
                p.PaymentID,
                p.TransactionID,
                p.Amount,
                p.Status,
                u.FirstName,
                u.LastName,
                u.Email,
                mp.Name as PlanName
            FROM Payments p
            JOIN Users u ON p.UserID = u.UserID
            JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
            WHERE p.Status = 'pending'
            ORDER BY p.PaymentID DESC
        `);

        console.log(`📊 Total pending payments in database: ${verifyResult.recordset.length}`);
        verifyResult.recordset.forEach((payment, index) => {
            console.log(`   ${index + 1}. ID: ${payment.PaymentID}, User: ${payment.FirstName} ${payment.LastName}, Plan: ${payment.PlanName}, Transaction: ${payment.TransactionID}`);
        });

        console.log('\n🎉 Test payments created successfully!');
        console.log('💡 Now you can test the admin dashboard to see if it shows the pending payments correctly.');

    } catch (error) {
        console.error('❌ Error creating test payments:', error);
    } finally {
        if (pool) {
            await pool.close();
            console.log('🔌 Database connection closed');
        }
    }
}

createTestPayments(); 