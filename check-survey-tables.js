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

async function checkTables() {
    try {
        await sql.connect(config);
        console.log('🔍 Checking database tables...');

        // Check all tables
        const allTablesQuery = `
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'TABLE'
            ORDER BY TABLE_NAME
        `;
        const allTablesResult = await sql.query(allTablesQuery);
        console.log('📋 All tables:', allTablesResult.recordset.map(t => t.TABLE_NAME));

        // Check survey-related tables
        const surveyTablesQuery = `
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'TABLE' AND TABLE_NAME LIKE '%Survey%'
        `;
        const surveyTablesResult = await sql.query(surveyTablesQuery);
        console.log('🎯 Survey tables:', surveyTablesResult.recordset.map(t => t.TABLE_NAME));

        // Check if QuitPlan table exists (might contain survey data)
        const quitPlanQuery = `
            SELECT TABLE_NAME, COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME LIKE '%Quit%' OR TABLE_NAME LIKE '%Plan%' OR TABLE_NAME LIKE '%Survey%'
            ORDER BY TABLE_NAME, COLUMN_NAME
        `;
        const quitPlanResult = await sql.query(quitPlanQuery);
        console.log('📊 Quit/Plan/Survey related tables and columns:', quitPlanResult.recordset);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sql.close();
    }
}

checkTables(); 