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

async function checkPaymentsTable() {
    let pool;
    try {
        pool = await sql.connect(config);
        console.log('Connected to database');

        // Check table structure
        const tableInfo = await pool.request().query(`
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT,
                CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Payments'
            ORDER BY ORDINAL_POSITION
        `);

        console.log('Payments table structure:');
        console.table(tableInfo.recordset);

        // Check constraints
        const constraints = await pool.request().query(`
            SELECT 
                tc.CONSTRAINT_NAME,
                tc.CONSTRAINT_TYPE,
                ccu.COLUMN_NAME,
                tc.TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
            JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu ON tc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
            WHERE tc.TABLE_NAME = 'Payments'
        `);

        console.log('Payments table constraints:');
        console.table(constraints.recordset);

        // Check if table exists, if not create it
        const tableExists = await pool.request().query(`
            SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Payments'
        `);

        if (tableExists.recordset[0].count === 0) {
            console.log('Payments table does not exist. Creating...');
            await pool.request().query(`
                CREATE TABLE Payments (
                    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NOT NULL,
                    PlanID INT NULL,
                    Amount DECIMAL(10,2) NOT NULL,
                    PaymentMethod NVARCHAR(50) NOT NULL,
                    TransactionID NVARCHAR(100) NULL,
                    Status NVARCHAR(20) DEFAULT 'pending',
                    PaymentDate DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (UserID) REFERENCES Users(UserID),
                    FOREIGN KEY (PlanID) REFERENCES MembershipPlans(PlanID)
                )
            `);
            console.log('Payments table created successfully');
        } else {
            // Check if required columns exist and add if missing
            const columnsResult = await pool.request().query(`
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Payments'
            `);

            const existingColumns = columnsResult.recordset.map(row => row.COLUMN_NAME);

            if (!existingColumns.includes('PlanID')) {
                console.log('Adding PlanID column...');
                await pool.request().query(`
                    ALTER TABLE Payments ADD PlanID INT NULL
                `);
                // Add foreign key constraint
                await pool.request().query(`
                    ALTER TABLE Payments ADD CONSTRAINT FK_Payments_PlanID 
                    FOREIGN KEY (PlanID) REFERENCES MembershipPlans(PlanID)
                `);
            }

            if (!existingColumns.includes('TransactionID')) {
                console.log('Adding TransactionID column...');
                await pool.request().query(`
                    ALTER TABLE Payments ADD TransactionID NVARCHAR(100) NULL
                `);
            }
        }

        console.log('Payments table setup completed successfully');

    } catch (error) {
        console.error('Error checking payments table:', error);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

// Run the check
checkPaymentsTable(); 