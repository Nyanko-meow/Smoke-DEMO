const { pool, connectDB } = require('./server/src/config/database');

async function checkCoachProfilesSchema() {
    try {
        console.log('🔍 Checking CoachProfiles table schema...');

        // Connect to database
        await connectDB();

        // Get table schema
        const schemaResult = await pool.request()
            .query(`
                SELECT 
                    COLUMN_NAME,
                    DATA_TYPE,
                    IS_NULLABLE,
                    CHARACTER_MAXIMUM_LENGTH,
                    COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'CoachProfiles'
                ORDER BY ORDINAL_POSITION
            `);

        console.log('📋 CoachProfiles table columns:');
        schemaResult.recordset.forEach(column => {
            console.log(`  - ${column.COLUMN_NAME} (${column.DATA_TYPE}${column.CHARACTER_MAXIMUM_LENGTH ? `(${column.CHARACTER_MAXIMUM_LENGTH})` : ''}) ${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        // Check if table exists
        const tableCheck = await pool.request()
            .query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'CoachProfiles'
            `);

        if (tableCheck.recordset.length === 0) {
            console.log('❌ CoachProfiles table does not exist!');

            // Create the table
            console.log('🔨 Creating CoachProfiles table...');
            await pool.request().query(`
                CREATE TABLE CoachProfiles (
                    ProfileID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NOT NULL,
                    Specialization NVARCHAR(500),
                    YearsOfExperience INT DEFAULT 0,
                    Education NVARCHAR(MAX),
                    Certifications NVARCHAR(MAX),
                    License NVARCHAR(200),
                    Bio NVARCHAR(MAX),
                    Methodology NVARCHAR(MAX),
                    SuccessStory NVARCHAR(MAX),
                    Languages NVARCHAR(500),
                    CommunicationStyle NVARCHAR(500),
                    WorkingHours NVARCHAR(500),
                    Website NVARCHAR(500),
                    LinkedIn NVARCHAR(500),
                    HourlyRate DECIMAL(10,2),
                    ConsultationFee DECIMAL(10,2),
                    ServicesOffered NVARCHAR(MAX),
                    IsAvailable BIT DEFAULT 1,
                    IsVerified BIT DEFAULT 0,
                    CreatedAt DATETIME2 DEFAULT GETDATE(),
                    UpdatedAt DATETIME2 DEFAULT GETDATE(),
                    FOREIGN KEY (UserID) REFERENCES Users(UserID)
                )
            `);
            console.log('✅ CoachProfiles table created successfully!');
        } else {
            console.log('✅ CoachProfiles table exists');
        }

        // Show current coach profiles
        const profiles = await pool.request().query('SELECT * FROM CoachProfiles');
        console.log(`\n📊 Current coach profiles count: ${profiles.recordset.length}`);

        if (profiles.recordset.length > 0) {
            console.log('First profile:', profiles.recordset[0]);
        }

    } catch (error) {
        console.error('❌ Error checking schema:', error);
    }
}

checkCoachProfilesSchema(); 