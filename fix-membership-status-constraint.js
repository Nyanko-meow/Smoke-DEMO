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

async function fixMembershipStatusConstraint() {
    try {
        await sql.connect(config);
        console.log('✅ Connected to database');

        // First, let's see the current constraint
        const constraintQuery = await sql.query`
            SELECT 
                tc.CONSTRAINT_NAME,
                cc.CHECK_CLAUSE
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
            JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
                ON tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
            WHERE tc.TABLE_NAME = 'UserMemberships'
            AND tc.CONSTRAINT_TYPE = 'CHECK'
            AND cc.CHECK_CLAUSE LIKE '%Status%'
        `;

        console.log('🔍 Current Status constraints:');
        constraintQuery.recordset.forEach(row => {
            console.log(`- Constraint: ${row.CONSTRAINT_NAME}`);
            console.log(`- Check Clause: ${row.CHECK_CLAUSE}`);
        });

        // Drop existing status constraint if it exists
        if (constraintQuery.recordset.length > 0) {
            const constraintName = constraintQuery.recordset[0].CONSTRAINT_NAME;
            console.log(`\n🗑️ Dropping existing constraint: ${constraintName}`);

            const dropQuery = `ALTER TABLE UserMemberships DROP CONSTRAINT [${constraintName}]`;
            await sql.query(dropQuery);
            console.log('✅ Constraint dropped successfully');
        }

        // Create new constraint with pending_cancellation included
        console.log('\n📝 Creating new Status constraint with pending_cancellation...');

        const createConstraintQuery = `
            ALTER TABLE UserMemberships 
            ADD CONSTRAINT CK_UserMemberships_Status 
            CHECK (Status IN ('active', 'expired', 'cancelled', 'pending', 'pending_cancellation'))
        `;

        await sql.query(createConstraintQuery);
        console.log('✅ New constraint created successfully');

        // Verify the new constraint
        const newConstraintQuery = await sql.query`
            SELECT 
                tc.CONSTRAINT_NAME,
                cc.CHECK_CLAUSE
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
            JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
                ON tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
            WHERE tc.TABLE_NAME = 'UserMemberships'
            AND tc.CONSTRAINT_TYPE = 'CHECK'
            AND cc.CHECK_CLAUSE LIKE '%Status%'
        `;

        console.log('\n🔍 New Status constraint:');
        newConstraintQuery.recordset.forEach(row => {
            console.log(`- Constraint: ${row.CONSTRAINT_NAME}`);
            console.log(`- Check Clause: ${row.CHECK_CLAUSE}`);
        });

        console.log('\n🎉 Status constraint update completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

fixMembershipStatusConstraint(); 