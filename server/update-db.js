const sql = require('mssql');
const fs = require('fs');

async function updateDatabase() {
    try {
        console.log('🔄 Connecting to database...');

        const config = {
            user: 'sa',
            password: '12345',
            server: 'localhost',
            database: 'master',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                connectTimeout: 30000,
                requestTimeout: 30000
            }
        };

        await sql.connect(config);
        console.log('✅ Connected to SQL Server');

        console.log('📋 Reading schema file...');
        const schema = fs.readFileSync('./server/src/database/schema.sql', 'utf8');

        console.log('🔨 Executing schema...');
        await sql.query(schema);

        console.log('✅ Database updated successfully!');
        console.log('🎉 CoachProfiles and CoachReviews tables created');

        process.exit(0);
    } catch (error) {
        console.error('❌ Database update error:', error.message);
        process.exit(1);
    }
}

updateDatabase(); 