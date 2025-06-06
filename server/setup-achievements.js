const { pool } = require('./src/config/database');

async function setupAchievements() {
    try {
        console.log('🏆 Setting up Achievements tables...');

        // Create Achievements table if not exists
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Achievements' AND xtype='U')
            CREATE TABLE Achievements (
                AchievementID INT PRIMARY KEY IDENTITY(1,1),
                Name NVARCHAR(100) NOT NULL,
                Description NVARCHAR(255),
                IconURL NVARCHAR(255),
                MilestoneDays INT NULL,
                SavedMoney INT NULL,
                CreatedAt DATETIME DEFAULT GETDATE()
            );
        `);

        console.log('✅ Achievements table created/verified');

        // Create UserAchievements table if not exists
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserAchievements' AND xtype='U')
            CREATE TABLE UserAchievements (
                UserAchievementID INT PRIMARY KEY IDENTITY(1,1),
                UserID INT NOT NULL,
                AchievementID INT NOT NULL,
                EarnedAt DATETIME DEFAULT GETDATE(),

                FOREIGN KEY (UserID) REFERENCES Users(UserID),
                FOREIGN KEY (AchievementID) REFERENCES Achievements(AchievementID)
            );
        `);

        console.log('✅ UserAchievements table created/verified');

        // Check if achievements data exists
        const existingCount = await pool.request().query('SELECT COUNT(*) as count FROM Achievements');

        if (existingCount.recordset[0].count === 0) {
            // Insert sample achievements
            await pool.request().query(`
                INSERT INTO Achievements (Name, Description, IconURL, MilestoneDays, SavedMoney)
                VALUES 
                (N'Ngày đầu tiên', N'Chúc mừng bạn đã hoàn thành ngày đầu tiên không hút thuốc!', 'https://img.icons8.com/emoji/48/000000/trophy-emoji.png', 1, NULL),
                (N'Tuần lễ khởi đầu', N'Bạn đã không hút thuốc được 7 ngày liên tiếp!', 'https://img.icons8.com/emoji/48/000000/star-emoji.png', 7, NULL),
                (N'Tháng đầu tiên', N'Một tháng không hút thuốc - một cột mốc quan trọng!', 'https://img.icons8.com/emoji/48/000000/crown-emoji.png', 30, NULL),
                (N'Quý đầu tiên', N'3 tháng không hút thuốc - sức khỏe của bạn đã cải thiện rất nhiều!', 'https://img.icons8.com/emoji/48/000000/gem-stone-emoji.png', 90, NULL),
                (N'Tiết kiệm 100K', N'Bạn đã tiết kiệm được 100,000 VNĐ nhờ việc không hút thuốc!', 'https://img.icons8.com/emoji/48/000000/money-bag-emoji.png', NULL, 100000),
                (N'Tiết kiệm 500K', N'Tuyệt vời! Bạn đã tiết kiệm được 500,000 VNĐ!', 'https://img.icons8.com/emoji/48/000000/money-with-wings-emoji.png', NULL, 500000),
                (N'Tiết kiệm 1 triệu', N'Thành tích đáng kinh ngạc! 1,000,000 VNĐ đã được tiết kiệm!', 'https://img.icons8.com/emoji/48/000000/bank-emoji.png', NULL, 1000000);
            `);

            console.log('✅ Sample achievements inserted');
        } else {
            console.log('✅ Achievements data already exists');
        }

        // Update CommunityPosts table to add AchievementID if not exists
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CommunityPosts') AND name = 'AchievementID')
            ALTER TABLE CommunityPosts ADD AchievementID INT NULL;
        `);

        // Add foreign key constraint if not exists
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_CommunityPosts_Achievements')
            ALTER TABLE CommunityPosts ADD CONSTRAINT FK_CommunityPosts_Achievements 
            FOREIGN KEY (AchievementID) REFERENCES Achievements(AchievementID);
        `);

        console.log('✅ CommunityPosts table updated');

        // Create PostLikes table if not exists
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PostLikes' AND xtype='U')
            CREATE TABLE PostLikes (
                LikeID INT PRIMARY KEY IDENTITY(1,1),
                PostID INT NOT NULL,
                UserID INT NOT NULL,
                LikedAt DATETIME DEFAULT GETDATE(),

                UNIQUE(PostID, UserID),
                FOREIGN KEY (PostID) REFERENCES CommunityPosts(PostID),
                FOREIGN KEY (UserID) REFERENCES Users(UserID)
            );
        `);

        console.log('✅ PostLikes table created/verified');

        console.log('🎉 Achievements setup completed successfully!');

    } catch (error) {
        console.error('❌ Error setting up achievements:', error);
        throw error;
    }
}

if (require.main === module) {
    setupAchievements()
        .then(() => {
            console.log('Done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupAchievements }; 