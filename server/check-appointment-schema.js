const { pool } = require('./src/config/database');

async function checkSchema() {
    try {
        console.log('Checking ConsultationAppointments schema...');

        const result = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'ConsultationAppointments'
            ORDER BY ORDINAL_POSITION
        `);

        console.log('ConsultationAppointments schema:');
        result.recordset.forEach(col => {
            console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT ? 'DEFAULT ' + col.COLUMN_DEFAULT : ''}`);
        });

        // Test if table exists and has data
        const countResult = await pool.request().query('SELECT COUNT(*) as count FROM ConsultationAppointments');
        console.log(`\nTable has ${countResult.recordset[0].count} records`);

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }

    process.exit(0);
}

checkSchema(); 