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

async function fixMembershipStatusConstraint() {
    try {
        console.log('🔗 Connecting to database...');
        const pool = await sql.connect(config);

        console.log('🔍 Checking current UserMemberships table constraints...');

        // Get constraint information
        const constraintResult = await pool.request().query(`
            SELECT 
                tc.CONSTRAINT_NAME, 
                cc.CHECK_CLAUSE
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
            JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc ON tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
            WHERE tc.TABLE_NAME = 'UserMemberships' AND tc.CONSTRAINT_TYPE = 'CHECK'
        `);

        if (constraintResult.recordset.length > 0) {
            console.log('Current constraints:', constraintResult.recordset);

            // Drop the existing constraint
            const constraintName = constraintResult.recordset[0].CONSTRAINT_NAME;
            console.log(`🗑️ Dropping constraint: ${constraintName}`);

            await pool.request().query(`
                ALTER TABLE UserMemberships
                DROP CONSTRAINT ${constraintName}
            `);
            console.log('✅ Constraint dropped successfully');
        }

        // Add new constraint that includes 'pending'
        console.log("🔧 Adding new constraint with 'pending' status...");
        await pool.request().query(`
            ALTER TABLE UserMemberships
            ADD CONSTRAINT CK_UserMemberships_Status 
            CHECK (Status IN ('active', 'expired', 'cancelled', 'pending'))
        `);

        console.log('✅ New constraint added successfully!');
        console.log('📋 UserMemberships table now allows: active, expired, cancelled, pending');

        // Verify the change
        const verifyResult = await pool.request().query(`
            SELECT 
                tc.CONSTRAINT_NAME, 
                cc.CHECK_CLAUSE
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
            JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc ON tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
            WHERE tc.TABLE_NAME = 'UserMemberships' AND tc.CONSTRAINT_TYPE = 'CHECK'
        `);

        console.log('✅ Verification - New constraint:', verifyResult.recordset);

        // Close connection
        await pool.close();
        console.log('🔌 Database connection closed');

    } catch (error) {
        console.error('❌ Error fixing membership status constraint:', error);
        process.exit(1);
    }
}

// Run the function
fixMembershipStatusConstraint(); 