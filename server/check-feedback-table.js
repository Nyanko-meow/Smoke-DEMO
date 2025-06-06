const { pool } = require('./src/config/database');

async function checkFeedbackTable() {
    try {
        console.log('Kết nối database...');
        await pool.connect();

        console.log('Kiểm tra bảng CoachFeedback...');

        // Kiểm tra xem bảng có tồn tại không
        const checkTable = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'CoachFeedback'
        `);

        if (checkTable.recordset.length === 0) {
            console.log('Bảng CoachFeedback chưa tồn tại. Tạo bảng...');

            // Tạo bảng CoachFeedback
            await pool.request().query(`
                CREATE TABLE CoachFeedback (
                    FeedbackID INT IDENTITY(1,1) PRIMARY KEY,
                    MemberID INT NOT NULL,
                    CoachID INT NOT NULL,
                    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
                    Comment NVARCHAR(MAX),
                    Status NVARCHAR(20) DEFAULT 'active' CHECK (Status IN ('active', 'inactive', 'deleted')),
                    CreatedAt DATETIME2 DEFAULT GETDATE(),
                    UpdatedAt DATETIME2 DEFAULT GETDATE(),
                    FOREIGN KEY (MemberID) REFERENCES Users(UserID),
                    FOREIGN KEY (CoachID) REFERENCES Users(UserID)
                )
            `);

            console.log('Đã tạo bảng CoachFeedback thành công!');

            // Tạo dữ liệu mẫu
            console.log('Tạo dữ liệu mẫu...');
            await pool.request().query(`
                INSERT INTO CoachFeedback (MemberID, CoachID, Rating, Comment, Status)
                VALUES 
                (6, 2, 5, N'Coach rất nhiệt tình và chuyên nghiệp. Đã giúp tôi rất nhiều trong việc cai thuốc.', 'active'),
                (6, 2, 4, N'Lời khuyên rất hữu ích, tuy nhiên có thể cần thêm thời gian tư vấn.', 'active'),
                (7, 2, 5, N'Tuyệt vời! Coach đã thay đổi cuộc đời tôi.', 'active'),
                (8, 3, 4, N'Coach am hiểu và có kinh nghiệm. Cảm ơn nhiều!', 'active'),
                (9, 3, 3, N'Ổn, nhưng cần cải thiện thêm về phương pháp tư vấn.', 'active')
            `);

            console.log('Đã tạo dữ liệu mẫu thành công!');
        } else {
            console.log('Bảng CoachFeedback đã tồn tại.');

            // Kiểm tra dữ liệu hiện có
            const countResult = await pool.request().query('SELECT COUNT(*) as count FROM CoachFeedback');
            console.log(`Có ${countResult.recordset[0].count} phản hồi trong bảng.`);
        }

        await pool.close();
        console.log('Hoàn thành!');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error);
        try {
            await pool.close();
        } catch (closeError) {
            console.error('Lỗi khi đóng kết nối:', closeError);
        }
        process.exit(1);
    }
}

checkFeedbackTable(); 