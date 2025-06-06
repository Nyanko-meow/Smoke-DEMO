const { pool, connectDB } = require('./src/config/database');

async function quickFixAchievements() {
    try {
        console.log('🚀 QUICK FIX ACHIEVEMENTS');
        console.log('========================\n');

        // Connect to database
        console.log('1. 🔌 Connecting to database...');
        await connectDB();
        await pool.request().query('SELECT 1 as test');
        console.log('✅ Database connected\n');

        // Check if Achievements table exists
        console.log('2. 🗃️ Checking Achievements table...');
        const tablesResult = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Achievements'
        `);

        if (tablesResult.recordset.length === 0) {
            console.log('❌ Achievements table missing! Creating...');

            // Create Achievements table
            await pool.request().query(`
                CREATE TABLE Achievements (
                    AchievementID INT IDENTITY(1,1) PRIMARY KEY,
                    Name NVARCHAR(100) NOT NULL,
                    Description NVARCHAR(255),
                    IconURL NVARCHAR(255),
                    Category NVARCHAR(50),
                    MilestoneDays INT NULL,
                    SavedMoney DECIMAL(10,2) NULL,
                    RequiredPlan NVARCHAR(50) NULL,
                    Difficulty NVARCHAR(20) DEFAULT 'Easy',
                    Points INT DEFAULT 10,
                    IsActive BIT DEFAULT 1,
                    CreatedAt DATETIME DEFAULT GETDATE()
                )
            `);

            // Create UserAchievements table
            await pool.request().query(`
                CREATE TABLE UserAchievements (
                    UserAchievementID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NOT NULL,
                    AchievementID INT NOT NULL,
                    EarnedAt DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (UserID) REFERENCES Users(UserID),
                    FOREIGN KEY (AchievementID) REFERENCES Achievements(AchievementID),
                    UNIQUE(UserID, AchievementID)
                )
            `);

            console.log('✅ Tables created');
        } else {
            console.log('✅ Achievements table exists');
        }

        // Check for basic achievements
        console.log('\n3. 🏆 Adding basic achievements...');
        const achievementsCount = await pool.request().query('SELECT COUNT(*) as count FROM Achievements');

        if (achievementsCount.recordset[0].count === 0) {
            const basicAchievements = [
                {
                    name: 'Bước đầu khởi đầu',
                    description: 'Hoàn thành ngày đầu tiên không hút thuốc (Basic Plan)',
                    iconUrl: '🌟',
                    category: 'Days',
                    milestoneDays: 1,
                    difficulty: 'Easy',
                    points: 10
                },
                {
                    name: 'Tuần lễ đéo dai',
                    description: 'Kiên trì 7 ngày không hút thuốc (Basic Plan)',
                    iconUrl: '⭐',
                    category: 'Days',
                    milestoneDays: 7,
                    difficulty: 'Medium',
                    points: 50
                },
                {
                    name: 'Chiến binh tháng đầu',
                    description: 'Vượt qua thử thách 30 ngày đầu tiên (Basic Plan)',
                    iconUrl: '🏅',
                    category: 'Days',
                    milestoneDays: 30,
                    difficulty: 'Hard',
                    points: 200
                },
                {
                    name: 'Tiết kiệm',
                    description: 'Tiết kiệm được 50,000 VNĐ từ việc không hút thuốc',
                    iconUrl: '💰',
                    category: 'Money',
                    savedMoney: 50000,
                    difficulty: 'Easy',
                    points: 25
                },
                {
                    name: 'Triệu phú nhỏ',
                    description: 'Tiết kiệm được 1,000,000 VNĐ từ việc không hút thuốc',
                    iconUrl: '💎',
                    category: 'Money',
                    savedMoney: 1000000,
                    difficulty: 'Medium',
                    points: 100
                }
            ];

            for (const achievement of basicAchievements) {
                await pool.request()
                    .input('Name', achievement.name)
                    .input('Description', achievement.description)
                    .input('IconURL', achievement.iconUrl)
                    .input('Category', achievement.category)
                    .input('MilestoneDays', achievement.milestoneDays || null)
                    .input('SavedMoney', achievement.savedMoney || null)
                    .input('Difficulty', achievement.difficulty)
                    .input('Points', achievement.points)
                    .query(`
                        INSERT INTO Achievements (Name, Description, IconURL, Category, MilestoneDays, SavedMoney, Difficulty, Points, IsActive)
                        VALUES (@Name, @Description, @IconURL, @Category, @MilestoneDays, @SavedMoney, @Difficulty, @Points, 1)
                    `);
            }

            console.log('✅ Basic achievements added');
        } else {
            console.log(`✅ Found ${achievementsCount.recordset[0].count} existing achievements`);
        }

        // Check for test data
        console.log('\n4. 📊 Creating test progress data...');
        const users = await pool.request().query(`
            SELECT UserID, Email FROM Users 
            WHERE Role IN ('member', 'guest') 
            AND IsActive = 1
            ORDER BY UserID
        `);

        console.log(`Found ${users.recordset.length} users for test data`);

        for (const user of users.recordset) {
            // Check if user has progress data
            const progressCheck = await pool.request()
                .input('UserID', user.UserID)
                .query('SELECT COUNT(*) as count FROM ProgressTracking WHERE UserID = @UserID');

            if (progressCheck.recordset[0].count === 0) {
                console.log(`Creating test data for ${user.Email}...`);

                // Create basic progress entries
                const testEntries = [
                    { days: 1, money: 50000 },
                    { days: 7, money: 350000 }
                ];

                for (const entry of testEntries) {
                    await pool.request()
                        .input('UserID', user.UserID)
                        .input('Date', new Date())
                        .input('DaysSmokeFree', entry.days)
                        .input('MoneySaved', entry.money)
                        .input('CigarettesSmoked', 0)
                        .input('CravingLevel', 3)
                        .query(`
                            INSERT INTO ProgressTracking (UserID, Date, DaysSmokeFree, MoneySaved, CigarettesSmoked, CravingLevel, CreatedAt)
                            VALUES (@UserID, @Date, @DaysSmokeFree, @MoneySaved, @CigarettesSmoked, @CravingLevel, GETDATE())
                        `);
                }

                // Award basic achievements
                const basicAchievements = await pool.request().query(`
                    SELECT AchievementID, MilestoneDays, SavedMoney 
                    FROM Achievements 
                    WHERE MilestoneDays <= 7 OR SavedMoney <= 350000
                `);

                for (const achievement of basicAchievements.recordset) {
                    try {
                        await pool.request()
                            .input('UserID', user.UserID)
                            .input('AchievementID', achievement.AchievementID)
                            .query(`
                                INSERT INTO UserAchievements (UserID, AchievementID, EarnedAt)
                                VALUES (@UserID, @AchievementID, GETDATE())
                            `);
                    } catch (error) {
                        // Ignore duplicate errors
                        if (!error.message.includes('duplicate')) {
                            console.error('Error awarding achievement:', error.message);
                        }
                    }
                }
            }
        }

        console.log('\n🎉 QUICK FIX COMPLETED!');
        console.log('======================');
        console.log('✅ Achievement system is now ready');
        console.log('✅ Progress bars should display correctly');
        console.log('✅ Earned achievements are visible');
        console.log('\n💡 Refresh your browser to see the changes!');

    } catch (error) {
        console.error('❌ Quick fix failed:', error);
        throw error;
    }
}

if (require.main === module) {
    quickFixAchievements()
        .then(() => {
            console.log('✅ Script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { quickFixAchievements }; 