const sql = require('mssql');

const config = {
    server: 'localhost',
    database: 'SMOKEKING',
    user: 'sa',
    password: 'dinhcapro123',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function updateFeedbackSchema() {
    try {
        console.log('🔗 Connecting to database...');
        await sql.connect(config);
        console.log('✅ Connected to database');

        // Check if CoachFeedback table exists
        const checkTableResult = await sql.query(`
            SELECT COUNT(*) as TableExists 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'CoachFeedback'
        `);

        if (checkTableResult.recordset[0].TableExists === 0) {
            console.log('📋 Creating CoachFeedback table...');

            await sql.query(`
                -- Coach Feedback Table (Member đánh giá Coach)
                CREATE TABLE CoachFeedback (
                    FeedbackID INT IDENTITY(1,1) PRIMARY KEY,
                    CoachID INT NOT NULL,
                    MemberID INT NOT NULL,
                    AppointmentID INT NULL, -- Liên kết với buổi tư vấn (nếu có)
                    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5), -- Đánh giá từ 1-5 sao
                    Comment NVARCHAR(MAX), -- Nhận xét của member
                    Categories NVARCHAR(MAX), -- JSON string chứa đánh giá theo từng tiêu chí
                    IsAnonymous BIT DEFAULT 0, -- Có hiển thị tên member hay không
                    Status NVARCHAR(20) DEFAULT 'active' CHECK (Status IN ('active', 'hidden', 'deleted')),
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    UpdatedAt DATETIME DEFAULT GETDATE(),

                    FOREIGN KEY (CoachID) REFERENCES Users(UserID),
                    FOREIGN KEY (MemberID) REFERENCES Users(UserID),
                    FOREIGN KEY (AppointmentID) REFERENCES ConsultationAppointments(AppointmentID),
                    UNIQUE(MemberID, CoachID, AppointmentID) -- Mỗi member chỉ đánh giá 1 lần cho 1 coach trong 1 buổi
                );
            `);

            console.log('✅ CoachFeedback table created');
        } else {
            console.log('✅ CoachFeedback table already exists');
        }

        // Check if CoachRatingStats view exists
        const checkViewResult = await sql.query(`
            SELECT COUNT(*) as ViewExists 
            FROM INFORMATION_SCHEMA.VIEWS 
            WHERE TABLE_NAME = 'CoachRatingStats'
        `);

        if (checkViewResult.recordset[0].ViewExists === 0) {
            console.log('📊 Creating CoachRatingStats view...');

            await sql.query(`
                -- Coach Statistics View (để tính toán thống kê đánh giá)
                CREATE VIEW CoachRatingStats AS
                SELECT 
                    c.UserID as CoachID,
                    c.FirstName + ' ' + c.LastName as CoachName,
                    COUNT(cf.FeedbackID) as TotalReviews,
                    AVG(CAST(cf.Rating as FLOAT)) as AverageRating,
                    COUNT(CASE WHEN cf.Rating = 5 THEN 1 END) as FiveStarCount,
                    COUNT(CASE WHEN cf.Rating = 4 THEN 1 END) as FourStarCount,
                    COUNT(CASE WHEN cf.Rating = 3 THEN 1 END) as ThreeStarCount,
                    COUNT(CASE WHEN cf.Rating = 2 THEN 1 END) as TwoStarCount,
                    COUNT(CASE WHEN cf.Rating = 1 THEN 1 END) as OneStarCount
                FROM Users c
                LEFT JOIN CoachFeedback cf ON c.UserID = cf.CoachID AND cf.Status = 'active'
                WHERE c.Role = 'coach'
                GROUP BY c.UserID, c.FirstName, c.LastName;
            `);

            console.log('✅ CoachRatingStats view created');
        } else {
            console.log('✅ CoachRatingStats view already exists');
        }

        // Insert sample feedback data
        console.log('📝 Inserting sample feedback data...');

        const sampleDataResult = await sql.query(`
            SELECT COUNT(*) as FeedbackCount FROM CoachFeedback
        `);

        if (sampleDataResult.recordset[0].FeedbackCount === 0) {
            await sql.query(`
                -- Insert sample feedback data
                INSERT INTO CoachFeedback (CoachID, MemberID, AppointmentID, Rating, Comment, Categories, IsAnonymous)
                VALUES 
                (3, 2, NULL, 5, N'Coach Smith rất tận tâm và kiên nhẫn. Những lời khuyên của coach đã giúp em rất nhiều trong việc cai thuốc.', 
                 '{"professionalism": 5, "helpfulness": 5, "communication": 5, "knowledge": 4}', 0),
                (3, 4, NULL, 4, N'Coach có kiến thức chuyên môn tốt, tuy nhiên em mong muốn có thêm thời gian tư vấn.', 
                 '{"professionalism": 4, "helpfulness": 4, "communication": 4, "knowledge": 5}', 1);
            `);

            console.log('✅ Sample feedback data inserted');
        } else {
            console.log('✅ Sample feedback data already exists');
        }

        console.log('🎉 Database schema update completed successfully!');

    } catch (error) {
        console.error('❌ Error updating database schema:', error);
        throw error;
    } finally {
        await sql.close();
        console.log('🔌 Database connection closed');
    }
}

async function main() {
    try {
        await updateFeedbackSchema();
        process.exit(0);
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { updateFeedbackSchema }; 