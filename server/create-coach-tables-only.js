const sql = require('mssql');

async function createCoachTables() {
    try {
        console.log('🔄 Connecting to database...');

        const config = {
            user: 'sa',
            password: '12345',
            server: 'localhost',
            database: 'SMOKEKING',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                connectTimeout: 30000,
                requestTimeout: 30000
            }
        };

        await sql.connect(config);
        console.log('✅ Connected to SMOKEKING database');

        // Check if tables exist first
        console.log('🔍 Checking if CoachProfiles table exists...');
        const checkCoachProfiles = await sql.query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'CoachProfiles'
        `);

        if (checkCoachProfiles.recordset[0].count === 0) {
            console.log('📋 Creating CoachProfiles table...');
            await sql.query(`
                CREATE TABLE CoachProfiles (
                    ProfileID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NOT NULL,
                    Bio NVARCHAR(MAX),
                    Specialization NVARCHAR(255),
                    Experience INT,
                    HourlyRate DECIMAL(10,2),
                    IsAvailable BIT DEFAULT 1,
                    YearsOfExperience INT,
                    Education NVARCHAR(MAX),
                    Certifications NVARCHAR(MAX),
                    Languages NVARCHAR(255),
                    WorkingHours NVARCHAR(255),
                    ConsultationTypes NVARCHAR(255),
                    SuccessRate DECIMAL(5,2),
                    TotalClients INT DEFAULT 0,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    UpdatedAt DATETIME DEFAULT GETDATE(),

                    FOREIGN KEY (UserID) REFERENCES Users(UserID)
                );
            `);
            console.log('✅ CoachProfiles table created');
        } else {
            console.log('ℹ️ CoachProfiles table already exists');
        }

        // Check if CoachReviews table exists
        console.log('🔍 Checking if CoachReviews table exists...');
        const checkCoachReviews = await sql.query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'CoachReviews'
        `);

        if (checkCoachReviews.recordset[0].count === 0) {
            console.log('📋 Creating CoachReviews table...');
            await sql.query(`
                CREATE TABLE CoachReviews (
                    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
                    CoachUserID INT NOT NULL,
                    ClientName NVARCHAR(255),
                    ReviewTitle NVARCHAR(255),
                    ReviewContent NVARCHAR(MAX),
                    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
                    IsAnonymous BIT DEFAULT 0,
                    IsVerified BIT DEFAULT 0,
                    IsPublic BIT DEFAULT 1,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    UpdatedAt DATETIME DEFAULT GETDATE(),

                    FOREIGN KEY (CoachUserID) REFERENCES Users(UserID)
                );
            `);
            console.log('✅ CoachReviews table created');
        } else {
            console.log('ℹ️ CoachReviews table already exists');
        }

        // Insert sample data if tables are empty
        console.log('📊 Checking for existing coach profile data...');
        const profileCount = await sql.query('SELECT COUNT(*) as count FROM CoachProfiles WHERE UserID = 3');

        if (profileCount.recordset[0].count === 0) {
            console.log('📝 Inserting sample coach profile...');
            await sql.query(`
                INSERT INTO CoachProfiles (UserID, Bio, Specialization, Experience, HourlyRate, IsAvailable, YearsOfExperience, Education, Certifications, Languages, WorkingHours, ConsultationTypes, SuccessRate, TotalClients)
                VALUES 
                (3, N'Tôi là một coach chuyên nghiệp với nhiều năm kinh nghiệm hỗ trợ người cai thuốc lá. Tôi đã giúp hàng trăm người thành công trong hành trình cai thuốc của họ.', 
                 N'Cai thuốc lá, Tư vấn sức khỏe tâm lý', 5, 200000.00, 1, 5, 
                 N'Thạc sĩ Tâm lý học - Đại học Y Hà Nội', 
                 N'Chứng chỉ tư vấn viên cai thuốc quốc tế, Chứng chỉ CBT (Cognitive Behavioral Therapy)', 
                 N'Tiếng Việt, Tiếng Anh', 
                 N'Thứ 2-6: 8:00-17:00, Thứ 7: 8:00-12:00', 
                 N'Video call, Voice call, Chat', 
                 85.5, 150)
            `);
            console.log('✅ Sample coach profile inserted');
        }

        const reviewCount = await sql.query('SELECT COUNT(*) as count FROM CoachReviews WHERE CoachUserID = 3');

        if (reviewCount.recordset[0].count === 0) {
            console.log('📝 Inserting sample reviews...');
            await sql.query(`
                INSERT INTO CoachReviews (CoachUserID, ClientName, ReviewTitle, ReviewContent, Rating, IsAnonymous, IsVerified, IsPublic)
                VALUES 
                (3, N'Nguyễn Văn A', N'Coach rất tận tâm', N'Coach Smith đã giúp tôi rất nhiều trong việc cai thuốc. Những lời khuyên của coach rất thiết thực và hiệu quả.', 5, 0, 1, 1),
                (3, N'Trần Thị B', N'Phương pháp hiệu quả', N'Tôi đã thử nhiều cách nhưng không thành công. Nhờ có coach mà tôi đã cai được thuốc sau 3 tháng.', 5, 0, 1, 1),
                (3, N'Lê Văn C', N'Hỗ trợ tốt', N'Coach luôn sẵn sàng hỗ trợ khi tôi gặp khó khăn. Rất recommend!', 4, 0, 1, 1)
            `);
            console.log('✅ Sample reviews inserted');
        }

        console.log('🎉 Coach tables setup completed successfully!');
        console.log('📋 Tables created: CoachProfiles, CoachReviews');
        console.log('🔗 Now the coaches API should work properly');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating coach tables:', error.message);
        process.exit(1);
    }
}

createCoachTables(); 