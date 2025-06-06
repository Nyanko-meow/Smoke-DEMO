const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '12345',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'SMOKEKING',
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true' || false,
        trustServerCertificate: true,
    },
};

async function checkDatabase() {
    let pool;

    try {
        console.log('🔍 Checking database connection...');
        console.log('📋 Config:', {
            server: dbConfig.server,
            database: dbConfig.database,
            user: dbConfig.user,
            port: dbConfig.port
        });

        // Test connection
        pool = await sql.connect(dbConfig);
        console.log('✅ Database connected successfully');

        // Check if MembershipPlans table exists
        console.log('\n📋 Checking MembershipPlans table...');
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) as TableExists 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'MembershipPlans'
        `);

        if (tableCheck.recordset[0].TableExists === 0) {
            console.log('❌ MembershipPlans table does not exist!');
            return;
        }

        console.log('✅ MembershipPlans table exists');

        // Check data in MembershipPlans
        const plansResult = await pool.request().query(`
            SELECT PlanID, Name, Price, Duration, Features 
            FROM MembershipPlans 
            ORDER BY PlanID
        `);

        console.log('\n📋 MembershipPlans data:');
        if (plansResult.recordset.length === 0) {
            console.log('❌ No plans found in MembershipPlans table!');

            // Try to insert Premium Plan
            console.log('\n🔧 Inserting Premium Plan...');
            await pool.request().query(`
                INSERT INTO MembershipPlans (Name, Description, Price, Duration, Features)
                VALUES ('Premium Plan', 'Gói cao cấp có hỗ trợ nâng cao.', 199000, 60, 'Theo dõi tiến trình, Phân tích nâng cao, Chiến lược bỏ thuốc cao cấp, Truy cập cộng đồng, Động lực hàng tuần, Được coach tư vấn qua chat và có thể đặt lịch')
            `);

            // Check again
            const newPlansResult = await pool.request().query(`
                SELECT PlanID, Name, Price, Duration 
                FROM MembershipPlans 
                ORDER BY PlanID
            `);

            console.log('✅ Plans after insert:', newPlansResult.recordset);
        } else {
            plansResult.recordset.forEach((plan, index) => {
                console.log(`   ${index + 1}. PlanID: ${plan.PlanID}, Name: ${plan.Name}, Price: ${plan.Price}, Duration: ${plan.Duration}`);
            });
        }

        // Check Users table for test user
        console.log('\n👤 Checking test users...');
        const usersResult = await pool.request().query(`
            SELECT TOP 3 UserID, Email, Role, IsActive 
            FROM Users 
            WHERE Email IN ('admin@example.com', 'member@example.com', 'coach@example.com')
        `);

        console.log('📋 Test users:');
        usersResult.recordset.forEach(user => {
            console.log(`   - UserID: ${user.UserID}, Email: ${user.Email}, Role: ${user.Role}, Active: ${user.IsActive}`);
        });

        // Check Payments table structure
        console.log('\n💳 Checking Payments table structure...');
        const paymentsStructure = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Payments'
            ORDER BY ORDINAL_POSITION
        `);

        console.log('📋 Payments table columns:');
        paymentsStructure.recordset.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // Test a simple insert into Payments (then delete)
        console.log('\n🧪 Testing Payments table insert...');
        try {
            const testInsert = await pool.request()
                .input('UserID', 4) // admin user
                .input('PlanID', 1)
                .input('Amount', 199000)
                .input('PaymentMethod', 'BankTransfer')
                .input('Status', 'pending')
                .input('TransactionID', 'TEST-' + Date.now())
                .input('Note', 'Test payment')
                .query(`
                    INSERT INTO Payments (UserID, PlanID, Amount, PaymentMethod, Status, TransactionID, Note)
                    OUTPUT INSERTED.PaymentID
                    VALUES (@UserID, @PlanID, @Amount, @PaymentMethod, @Status, @TransactionID, @Note)
                `);

            const paymentId = testInsert.recordset[0].PaymentID;
            console.log('✅ Test payment created with ID:', paymentId);

            // Delete the test payment
            await pool.request()
                .input('PaymentID', paymentId)
                .query('DELETE FROM Payments WHERE PaymentID = @PaymentID');

            console.log('✅ Test payment deleted');

        } catch (insertError) {
            console.error('❌ Error testing payment insert:', insertError.message);
        }

        console.log('\n🎉 Database check completed!');

    } catch (error) {
        console.error('❌ Database error:', error);

        if (error.code === 'ELOGIN') {
            console.error('💡 Login failed. Check:');
            console.error('   • SQL Server is running');
            console.error('   • Username/password is correct');
            console.error('   • Database exists');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('💡 Connection refused. Check:');
            console.error('   • SQL Server is running on port 1433');
            console.error('   • Firewall allows connections');
        }
    } finally {
        if (pool) {
            try {
                await pool.close();
                console.log('\n🔌 Database connection closed');
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
}

checkDatabase(); 