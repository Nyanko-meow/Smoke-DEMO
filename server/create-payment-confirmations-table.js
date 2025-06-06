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

async function createPaymentConfirmationsTable() {
    let pool;
    try {
        pool = await sql.connect(config);
        console.log('Connected to database');

        // Create PaymentConfirmations table if it doesn't exist
        const createTableQuery = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PaymentConfirmations' AND xtype='U')
            BEGIN
                CREATE TABLE PaymentConfirmations (
                    ConfirmationID INT IDENTITY(1,1) PRIMARY KEY,
                    PaymentID INT NOT NULL,
                    ConfirmedByUserID INT NOT NULL,
                    ConfirmationCode NVARCHAR(50) NOT NULL,
                    Notes NVARCHAR(500) NULL,
                    ConfirmationDate DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (PaymentID) REFERENCES Payments(PaymentID),
                    FOREIGN KEY (ConfirmedByUserID) REFERENCES Users(UserID)
                );
                PRINT 'PaymentConfirmations table created successfully';
            END
            ELSE
            BEGIN
                PRINT 'PaymentConfirmations table already exists';
            END
        `;

        await pool.request().query(createTableQuery);

        // Check if Payments table has the required columns
        const checkPaymentsColumns = `
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Payments' AND COLUMN_NAME = 'PlanID')
            BEGIN
                ALTER TABLE Payments ADD PlanID INT NULL;
                ALTER TABLE Payments ADD FOREIGN KEY (PlanID) REFERENCES MembershipPlans(PlanID);
                PRINT 'Added PlanID column to Payments table';
            END
            
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Payments' AND COLUMN_NAME = 'TransactionID')
            BEGIN
                ALTER TABLE Payments ADD TransactionID NVARCHAR(100) NULL;
                PRINT 'Added TransactionID column to Payments table';
            END
        `;

        await pool.request().query(checkPaymentsColumns);

        console.log('Database schema updated successfully');

    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

// Run the setup
createPaymentConfirmationsTable(); 