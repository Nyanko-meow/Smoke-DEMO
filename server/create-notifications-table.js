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

async function createNotificationsTable() {
    try {
        console.log('🔗 Connecting to database...');
        const pool = await sql.connect(config);

        // Check if Notifications table exists
        const checkTableResult = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Notifications'
        `);

        if (checkTableResult.recordset[0].count > 0) {
            console.log('✅ Notifications table already exists');
            return;
        }

        console.log('📝 Creating Notifications table...');

        // Create Notifications table
        await pool.request().query(`
            CREATE TABLE Notifications (
                NotificationID INT IDENTITY(1,1) PRIMARY KEY,
                UserID INT NOT NULL,
                Type NVARCHAR(50) NOT NULL,
                Title NVARCHAR(255) NOT NULL,
                Message NVARCHAR(MAX) NOT NULL,
                RelatedID INT NULL,
                IsRead BIT DEFAULT 0,
                CreatedAt DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (UserID) REFERENCES Users(UserID)
            )
        `);

        console.log('✅ Notifications table created successfully!');

        // Close connection
        await pool.close();
        console.log('🔌 Database connection closed');

    } catch (error) {
        console.error('❌ Error creating Notifications table:', error);
        process.exit(1);
    }
}

// Run the function
createNotificationsTable(); 