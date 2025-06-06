const sql = require('mssql');

const config = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'SMOKEKING',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkUsersSchema() {
    try {
        await sql.connect(config);
        console.log('🔗 Connected to database');

        // Check table schema
        const schema = await sql.query`
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users'
            ORDER BY ORDINAL_POSITION
        `;

        console.log('📋 Users table schema:');
        schema.recordset.forEach(col => {
            console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE})`);
        });

        // Check current coach data
        const coaches = await sql.query`
            SELECT * FROM Users WHERE Role = 'coach'
        `;

        console.log('\n👨‍🏫 Current coaches:');
        coaches.recordset.forEach(coach => {
            console.log('Coach data:', Object.keys(coach));
            console.log('Coach details:', coach);
        });

        await sql.close();

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkUsersSchema(); 