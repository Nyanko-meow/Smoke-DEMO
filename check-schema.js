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

async function checkAndFixSchema() {
    try {
        await sql.connect(config);
        console.log('✅ Connected to database');

        // Check if bank info columns exist
        const bankResult = await sql.query`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'CancellationRequests'
            AND COLUMN_NAME IN ('BankAccountNumber', 'BankName', 'AccountHolderName')
        `;

        console.log('🔍 Existing bank columns:', bankResult.recordset.map(r => r.COLUMN_NAME));

        // Add missing bank columns
        const bankColumns = ['BankAccountNumber', 'BankName', 'AccountHolderName'];
        const existingBankColumns = bankResult.recordset.map(r => r.COLUMN_NAME);

        for (const column of bankColumns) {
            if (!existingBankColumns.includes(column)) {
                console.log(`📝 Adding missing bank column: ${column}`);
                let dataType = 'NVARCHAR(100)';
                if (column === 'BankAccountNumber') dataType = 'NVARCHAR(50)';

                const alterQuery = `ALTER TABLE CancellationRequests ADD ${column} ${dataType}`;
                await sql.query(alterQuery);
                console.log(`✅ Added ${column} column`);
            } else {
                console.log(`✅ Bank column ${column} already exists`);
            }
        }

        // Check if transfer tracking columns exist
        const transferResult = await sql.query`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'CancellationRequests'
            AND COLUMN_NAME IN ('TransferConfirmed', 'TransferDate', 'RefundReceived', 'ReceivedDate')
        `;

        console.log('🔍 Existing transfer columns:', transferResult.recordset.map(r => r.COLUMN_NAME));

        // Add missing transfer tracking columns
        const transferColumns = [
            { name: 'TransferConfirmed', type: 'BIT DEFAULT 0' },
            { name: 'TransferDate', type: 'DATETIME NULL' },
            { name: 'RefundReceived', type: 'BIT DEFAULT 0' },
            { name: 'ReceivedDate', type: 'DATETIME NULL' }
        ];
        const existingTransferColumns = transferResult.recordset.map(r => r.COLUMN_NAME);

        for (const column of transferColumns) {
            if (!existingTransferColumns.includes(column.name)) {
                console.log(`📝 Adding missing transfer column: ${column.name}`);
                const alterQuery = `ALTER TABLE CancellationRequests ADD ${column.name} ${column.type}`;
                await sql.query(alterQuery);
                console.log(`✅ Added ${column.name} column`);
            } else {
                console.log(`✅ Transfer column ${column.name} already exists`);
            }
        }

        // Test the updated schema
        const finalResult = await sql.query`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'CancellationRequests'
            ORDER BY ORDINAL_POSITION
        `;

        console.log('\n📋 Final CancellationRequests table schema:');
        finalResult.recordset.forEach(col => {
            console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
        });

        console.log('\n🎉 Schema check/update completed');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

checkAndFixSchema(); 