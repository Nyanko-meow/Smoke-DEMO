const sql = require('mssql');

const config = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkPaymentConstraints() {
    let pool;
    try {
        pool = await sql.connect(config);
        console.log('Connected to database');

        // Get CHECK constraint definitions
        const checkConstraints = await pool.request().query(`
            SELECT 
                cc.CONSTRAINT_NAME,
                cc.CHECK_CLAUSE
            FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
            JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu ON cc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
            WHERE ccu.TABLE_NAME = 'Payments'
        `);

        console.log('CHECK constraints on Payments table:');
        checkConstraints.recordset.forEach(constraint => {
            console.log(`${constraint.CONSTRAINT_NAME}: ${constraint.CHECK_CLAUSE}`);
        });

        // Try to insert a test payment with different payment methods to see what works
        console.log('\nTesting payment methods...');

        const testMethods = ['credit_card', 'bank_transfer', 'cash', 'online', 'card'];

        for (const method of testMethods) {
            try {
                // Test if this payment method is allowed
                await pool.request()
                    .input('PaymentMethod', method)
                    .query(`
                        SELECT 1 WHERE @PaymentMethod IN (
                            SELECT DISTINCT PaymentMethod FROM Payments
                            UNION
                            SELECT 'credit_card'
                            UNION 
                            SELECT 'bank_transfer'
                            UNION
                            SELECT 'cash'
                        )
                    `);
                console.log(`✓ ${method} - OK`);
            } catch (error) {
                console.log(`✗ ${method} - Error: ${error.message}`);
            }
        }

        // Check what payment methods are currently in the database
        const existingMethods = await pool.request().query(`
            SELECT DISTINCT PaymentMethod FROM Payments
        `);

        console.log('\nExisting payment methods in database:');
        existingMethods.recordset.forEach(row => {
            console.log(`- ${row.PaymentMethod}`);
        });

        // Check allowed statuses
        console.log('\nTesting statuses...');
        const testStatuses = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'];

        for (const status of testStatuses) {
            try {
                await pool.request()
                    .input('Status', status)
                    .query(`
                        SELECT 1 WHERE @Status IN ('pending', 'confirmed', 'rejected', 'completed', 'cancelled')
                    `);
                console.log(`✓ ${status} - OK`);
            } catch (error) {
                console.log(`✗ ${status} - Error: ${error.message}`);
            }
        }

    } catch (error) {
        console.error('Error checking constraints:', error);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

// Run the check
checkPaymentConstraints(); 