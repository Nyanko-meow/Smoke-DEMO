const { pool, connectDB } = require('./src/config/database');

async function fixAchievementsStructure() {
    try {
        console.log('🔍 Checking and fixing Achievements table structure...');

        await connectDB();

        // 1. Check if Achievements table exists
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Achievements'
        `);

        if (tableCheck.recordset[0].count === 0) {
            console.log('❌ Achievements table does not exist! Creating...');

            await pool.request().query(`
                CREATE TABLE Achievements (
                    AchievementID INT PRIMARY KEY IDENTITY(1,1),
                    Name NVARCHAR(100) NOT NULL,
                    Description NVARCHAR(255),
                    IconURL NVARCHAR(255),
                    Category NVARCHAR(50) DEFAULT 'milestone',
                    MilestoneDays INT NULL,
                    SavedMoney DECIMAL(10,2) NULL,
                    RequiredPlan NVARCHAR(20) NULL,
                    Difficulty INT DEFAULT 1,
                    Points INT DEFAULT 10,
                    IsActive BIT DEFAULT 1,
                    CreatedAt DATETIME DEFAULT GETDATE()
                )
            `);
            console.log('✅ Created Achievements table');
        } else {
            console.log('✅ Achievements table exists');

            // 2. Check for missing columns and add them
            const requiredColumns = [
                { name: 'Category', type: 'NVARCHAR(50)', default: "'milestone'" },
                { name: 'RequiredPlan', type: 'NVARCHAR(20)', default: 'NULL' },
                { name: 'Difficulty', type: 'INT', default: '1' },
                { name: 'Points', type: 'INT', default: '10' },
                { name: 'IsActive', type: 'BIT', default: '1' }
            ];

            for (const column of requiredColumns) {
                const columnCheck = await pool.request().query(`
                    SELECT COUNT(*) as count 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'Achievements' AND COLUMN_NAME = '${column.name}'
                `);

                if (columnCheck.recordset[0].count === 0) {
                    console.log(`➕ Adding missing column: ${column.name}`);

                    await pool.request().query(`
                        ALTER TABLE Achievements 
                        ADD ${column.name} ${column.type} DEFAULT ${column.default}
                    `);

                    console.log(`✅ Added column: ${column.name}`);
                } else {
                    console.log(`✅ Column exists: ${column.name}`);
                }
            }
        }

        // 3. Check UserAchievements table
        const userAchTableCheck = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'UserAchievements'
        `);

        if (userAchTableCheck.recordset[0].count === 0) {
            console.log('❌ UserAchievements table does not exist! Creating...');

            await pool.request().query(`
                CREATE TABLE UserAchievements (
                    UserAchievementID INT PRIMARY KEY IDENTITY(1,1),
                    UserID INT NOT NULL,
                    AchievementID INT NOT NULL,
                    EarnedAt DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (UserID) REFERENCES Users(UserID),
                    FOREIGN KEY (AchievementID) REFERENCES Achievements(AchievementID),
                    UNIQUE(UserID, AchievementID)
                )
            `);
            console.log('✅ Created UserAchievements table');
        } else {
            console.log('✅ UserAchievements table exists');
        }

        // 4. Update existing achievements with new columns
        await pool.request().query(`
            UPDATE Achievements 
            SET IsActive = 1 
            WHERE IsActive IS NULL
        `);

        await pool.request().query(`
            UPDATE Achievements 
            SET Category = 'milestone'
            WHERE Category IS NULL AND MilestoneDays IS NOT NULL
        `);

        await pool.request().query(`
            UPDATE Achievements 
            SET Category = 'savings'
            WHERE Category IS NULL AND SavedMoney IS NOT NULL
        `);

        await pool.request().query(`
            UPDATE Achievements 
            SET Difficulty = CASE 
                WHEN MilestoneDays = 1 THEN 1
                WHEN MilestoneDays = 7 THEN 1
                WHEN MilestoneDays = 30 THEN 2
                WHEN MilestoneDays = 90 THEN 3
                WHEN SavedMoney = 100000 THEN 1
                WHEN SavedMoney = 500000 THEN 2
                WHEN SavedMoney = 1000000 THEN 3
                ELSE 1
            END
            WHERE Difficulty IS NULL OR Difficulty = 0
        `);

        await pool.request().query(`
            UPDATE Achievements 
            SET Points = CASE 
                WHEN MilestoneDays = 1 THEN 10
                WHEN MilestoneDays = 7 THEN 25
                WHEN MilestoneDays = 30 THEN 100
                WHEN MilestoneDays = 90 THEN 300
                WHEN SavedMoney = 100000 THEN 50
                WHEN SavedMoney = 500000 THEN 150
                WHEN SavedMoney = 1000000 THEN 500
                ELSE 10
            END
            WHERE Points IS NULL OR Points = 0
        `);

        // 5. Check achievement count
        const countResult = await pool.request().query('SELECT COUNT(*) as count FROM Achievements');
        console.log(`🏆 Total achievements: ${countResult.recordset[0].count}`);

        if (countResult.recordset[0].count === 0) {
            console.log('🚀 Adding basic achievements...');

            const basicAchievements = [
                { name: 'Ngày đầu tiên', desc: 'Chúc mừng bạn đã hoàn thành ngày đầu tiên không hút thuốc!', icon: '🏆', cat: 'milestone', days: 1, money: null, pts: 10 },
                { name: 'Tuần lễ khởi đầu', desc: 'Bạn đã không hút thuốc được 7 ngày liên tiếp!', icon: '⭐', cat: 'milestone', days: 7, money: null, pts: 25 },
                { name: 'Tháng đầu tiên', desc: 'Một tháng không hút thuốc - một cột mốc quan trọng!', icon: '👑', cat: 'milestone', days: 30, money: null, pts: 100 },
                { name: 'Quý đầu tiên', desc: '3 tháng không hút thuốc - sức khỏe của bạn đã cải thiện rất nhiều!', icon: '💎', cat: 'milestone', days: 90, money: null, pts: 300 },
                { name: 'Tiết kiệm 100K', desc: 'Bạn đã tiết kiệm được 100,000 VNĐ nhờ việc không hút thuốc!', icon: '💰', cat: 'savings', days: null, money: 100000, pts: 50 },
                { name: 'Tiết kiệm 500K', desc: 'Tuyệt vời! Bạn đã tiết kiệm được 500,000 VNĐ!', icon: '💵', cat: 'savings', days: null, money: 500000, pts: 150 },
                { name: 'Tiết kiệm 1 triệu', desc: 'Thành tích đáng kinh ngạc! 1,000,000 VNĐ đã được tiết kiệm!', icon: '🏦', cat: 'savings', days: null, money: 1000000, pts: 500 }
            ];

            for (const ach of basicAchievements) {
                await pool.request()
                    .input('Name', ach.name)
                    .input('Description', ach.desc)
                    .input('IconURL', ach.icon)
                    .input('Category', ach.cat)
                    .input('MilestoneDays', ach.days)
                    .input('SavedMoney', ach.money)
                    .input('Difficulty', ach.days >= 30 ? 2 : ach.money >= 500000 ? 2 : 1)
                    .input('Points', ach.pts)
                    .query(`
                        INSERT INTO Achievements (
                            Name, Description, IconURL, Category, MilestoneDays, 
                            SavedMoney, Difficulty, Points, IsActive, CreatedAt
                        ) VALUES (
                            @Name, @Description, @IconURL, @Category, @MilestoneDays,
                            @SavedMoney, @Difficulty, @Points, 1, GETDATE()
                        )
                    `);
                console.log(`✅ Created: ${ach.name}`);
            }
        }

        // 6. Final verification
        const finalCount = await pool.request().query('SELECT COUNT(*) as count FROM Achievements');
        console.log(`🎯 Final achievements count: ${finalCount.recordset[0].count}`);

        console.log('\n🎉 Achievements structure fix completed successfully!');
        console.log('🌐 You can now test the achievements API at: http://localhost:4000/api/achievements/earned');

    } catch (error) {
        console.error('❌ Error fixing achievements structure:', error);
    }
}

// Run the fix
fixAchievementsStructure().then(() => {
    console.log('🏁 Script completed');
    process.exit(0);
}).catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
}); 