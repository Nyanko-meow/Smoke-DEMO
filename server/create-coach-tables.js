const { pool } = require('./src/config/database');

async function createCoachTables() {
    try {
        // Connect to database first
        await pool.connect();
        console.log('🔧 Creating CoachProfiles table...');

        // Create CoachProfiles table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CoachProfiles')
            BEGIN
                CREATE TABLE CoachProfiles (
                    ProfileID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NOT NULL,
                    Bio NVARCHAR(MAX),
                    Specialization NVARCHAR(500),
                    Experience INT,
                    HourlyRate DECIMAL(10,2),
                    IsAvailable BIT DEFAULT 1,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    UpdatedAt DATETIME DEFAULT GETDATE(),
                    
                    FOREIGN KEY (UserID) REFERENCES Users(UserID)
                )
            END
        `);

        console.log('✅ CoachProfiles table created');

        // Create CoachReviews table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CoachReviews')
            BEGIN
                CREATE TABLE CoachReviews (
                    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
                    CoachUserID INT NOT NULL,
                    ClientUserID INT NULL,
                    ClientName NVARCHAR(255),
                    ReviewTitle NVARCHAR(255),
                    ReviewContent NVARCHAR(MAX),
                    Rating INT CHECK (Rating BETWEEN 1 AND 5),
                    IsAnonymous BIT DEFAULT 0,
                    IsPublic BIT DEFAULT 1,
                    CreatedAt DATETIME DEFAULT GETDATE(),

                    FOREIGN KEY (CoachUserID) REFERENCES Users(UserID),
                    FOREIGN KEY (ClientUserID) REFERENCES Users(UserID)
                )
            END
        `);

        console.log('✅ CoachReviews table created');

        // Insert sample coach profile
        const coachResult = await pool.request().query(`
            SELECT UserID FROM Users WHERE Email = 'coach@example.com' AND Role = 'coach'
        `);

        if (coachResult.recordset.length > 0) {
            const coachId = coachResult.recordset[0].UserID;

            // Check if profile exists
            const existingProfile = await pool.request()
                .input('UserID', coachId)
                .query(`SELECT ProfileID FROM CoachProfiles WHERE UserID = @UserID`);

            if (existingProfile.recordset.length === 0) {
                await pool.request()
                    .input('UserID', coachId)
                    .query(`
                        INSERT INTO CoachProfiles (UserID, Bio, Specialization, Experience, HourlyRate, IsAvailable)
                        VALUES (@UserID, 
                            N'Chuyên gia tư vấn cai thuốc lá với hơn 5 năm kinh nghiệm. Tôi đã giúp hàng trăm người thành công trong việc cai thuốc.',
                            N'Cai thuốc lá, Tư vấn nghiện, Liệu pháp hành vi',
                            5,
                            200000,
                            1)
                    `);

                console.log('✅ Sample coach profile created');

                // Add some sample reviews
                await pool.request()
                    .input('CoachUserID', coachId)
                    .query(`
                        INSERT INTO CoachReviews (CoachUserID, ClientName, ReviewTitle, ReviewContent, Rating, IsAnonymous, IsPublic)
                        VALUES 
                        (@CoachUserID, N'Nguyễn Văn A', N'Coach rất tận tâm', N'Coach đã giúp tôi cai thuốc thành công sau 3 tháng. Rất cảm ơn!', 5, 0, 1),
                        (@CoachUserID, N'Trần Thị B', N'Phương pháp hiệu quả', N'Phương pháp của coach rất khoa học và dễ thực hiện.', 4, 0, 1),
                        (@CoachUserID, N'Lê Văn C', N'Hỗ trợ tuyệt vời', N'Coach luôn sẵn sàng hỗ trợ và động viên khi tôi gặp khó khăn.', 5, 0, 1)
                    `);

                console.log('✅ Sample reviews created');
            } else {
                console.log('ℹ️ Coach profile already exists');
            }
        }

        console.log('🎉 All done!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.close();
        process.exit(0);
    }
}

createCoachTables(); 