const sql = require('mssql');

// Try multiple password options to find the correct one
const passwordOptions = ['12345', 'password', 'Tran0210203@'];

async function testConnection(password) {
    const config = {
        server: 'localhost',
        database: 'SMOKEKING',
        options: {
            encrypt: false,
            trustServerCertificate: true
        },
        authentication: {
            type: 'default',
            options: {
                userName: 'sa',
                password: password
            }
        }
    };

    try {
        await sql.connect(config);
        await sql.query`SELECT 1 as test`;
        console.log(`✅ Connected successfully with password: ${password}`);
        return config;
    } catch (error) {
        console.log(`❌ Failed with password: ${password}`);
        return null;
    } finally {
        try {
            await sql.close();
        } catch (e) {
            // Ignore close errors
        }
    }
}

async function fixAchievementsNoHash() {
    console.log('🔍 Testing database connections...');

    let workingConfig = null;
    for (const password of passwordOptions) {
        workingConfig = await testConnection(password);
        if (workingConfig) break;
    }

    if (!workingConfig) {
        console.error('❌ Could not connect to database with any password!');
        console.log('💡 Please check SQL Server is running and credentials are correct.');
        return;
    }

    try {
        await sql.connect(workingConfig);
        console.log('🔌 Connected to database successfully');

        // Check if Achievements table exists and has required columns
        const tableCheck = await sql.query`
            SELECT COUNT(*) as TableExists 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Achievements'
        `;

        if (tableCheck.recordset[0].TableExists === 0) {
            console.log('❌ Achievements table does not exist! Creating it...');

            // Create Achievements table
            await sql.query`
                CREATE TABLE Achievements (
                    AchievementID INT PRIMARY KEY IDENTITY(1,1),
                    Name NVARCHAR(100) NOT NULL,
                    Description NVARCHAR(255),
                    IconURL NVARCHAR(255),
                    Category NVARCHAR(50) DEFAULT 'general',
                    MilestoneDays INT NULL,
                    SavedMoney DECIMAL(10,2) NULL,
                    RequiredPlan NVARCHAR(20) DEFAULT 'any',
                    Difficulty NVARCHAR(20) DEFAULT 'easy',
                    Points INT DEFAULT 10,
                    IsActive BIT DEFAULT 1,
                    CreatedAt DATETIME DEFAULT GETDATE()
                )
            `;
            console.log('✅ Created Achievements table');
        } else {
            console.log('✅ Achievements table exists');

            // Check for missing columns and add them
            const columnsToCheck = [
                { name: 'Category', type: 'NVARCHAR(50)', default: "'general'" },
                { name: 'RequiredPlan', type: 'NVARCHAR(20)', default: "'any'" },
                { name: 'Difficulty', type: 'NVARCHAR(20)', default: "'easy'" },
                { name: 'Points', type: 'INT', default: '10' },
                { name: 'IsActive', type: 'BIT', default: '1' }
            ];

            for (const column of columnsToCheck) {
                const columnCheck = await sql.query`
                    SELECT COUNT(*) as ColumnExists 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'Achievements' AND COLUMN_NAME = ${column.name}
                `;

                if (columnCheck.recordset[0].ColumnExists === 0) {
                    console.log(`➕ Adding column ${column.name}...`);
                    await sql.query(`ALTER TABLE Achievements ADD ${column.name} ${column.type} DEFAULT ${column.default}`);
                    if (column.name === 'IsActive') {
                        await sql.query`UPDATE Achievements SET IsActive = 1 WHERE IsActive IS NULL`;
                    }
                }
            }
        }

        // Check achievement count
        const countResult = await sql.query`SELECT COUNT(*) as AchievementCount FROM Achievements`;
        console.log('🏆 Current achievements count:', countResult.recordset[0].AchievementCount);

        if (countResult.recordset[0].AchievementCount === 0) {
            console.log('📝 Inserting sample achievements...');

            // Insert sample achievements
            await sql.query`
                INSERT INTO Achievements (Name, Description, IconURL, Category, MilestoneDays, SavedMoney, Difficulty, Points, IsActive)
                VALUES 
                (N'Ngày đầu tiên', N'Chúc mừng bạn đã hoàn thành ngày đầu tiên không hút thuốc!', 'https://img.icons8.com/emoji/48/000000/trophy-emoji.png', 'time_based', 1, NULL, 'easy', 10, 1),
                (N'Tuần lễ khởi đầu', N'Bạn đã không hút thuốc được 7 ngày liên tiếp!', 'https://img.icons8.com/emoji/48/000000/star-emoji.png', 'time_based', 7, NULL, 'medium', 50, 1),
                (N'Tháng đầu tiên', N'Một tháng không hút thuốc - một cột mốc quan trọng!', 'https://img.icons8.com/emoji/48/000000/crown-emoji.png', 'time_based', 30, NULL, 'hard', 200, 1),
                (N'Quý đầu tiên', N'3 tháng không hút thuốc - sức khỏe của bạn đã cải thiện rất nhiều!', 'https://img.icons8.com/emoji/48/000000/gem-stone-emoji.png', 'time_based', 90, NULL, 'expert', 500, 1),
                (N'Tiết kiệm 100K', N'Bạn đã tiết kiệm được 100,000 VNĐ nhờ việc không hút thuốc!', 'https://img.icons8.com/emoji/48/000000/money-bag-emoji.png', 'savings', NULL, 100000, 'easy', 25, 1),
                (N'Tiết kiệm 500K', N'Tuyệt vời! Bạn đã tiết kiệm được 500,000 VNĐ!', 'https://img.icons8.com/emoji/48/000000/money-with-wings-emoji.png', 'savings', NULL, 500000, 'medium', 100, 1),
                (N'Tiết kiệm 1 triệu', N'Thành tích đáng kinh ngạc! 1,000,000 VNĐ đã được tiết kiệm!', 'https://img.icons8.com/emoji/48/000000/bank-emoji.png', 'savings', NULL, 1000000, 'hard', 300, 1)
            `;

            const newCount = await sql.query`SELECT COUNT(*) as AchievementCount FROM Achievements`;
            console.log('✅ Inserted achievements. New count:', newCount.recordset[0].AchievementCount);
        }

        // Check UserAchievements table
        const userAchievementsCheck = await sql.query`
            SELECT COUNT(*) as TableExists 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'UserAchievements'
        `;

        if (userAchievementsCheck.recordset[0].TableExists === 0) {
            console.log('❌ UserAchievements table does not exist! Creating it...');
            await sql.query`
                CREATE TABLE UserAchievements (
                    UserAchievementID INT PRIMARY KEY IDENTITY(1,1),
                    UserID INT NOT NULL,
                    AchievementID INT NOT NULL,
                    EarnedAt DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (UserID) REFERENCES Users(UserID),
                    FOREIGN KEY (AchievementID) REFERENCES Achievements(AchievementID),
                    UNIQUE(UserID, AchievementID)
                )
            `;
            console.log('✅ Created UserAchievements table');
        }

        // Verify that users can still login with plain text passwords
        console.log('\n🔐 Checking user login credentials...');
        const users = await sql.query`
            SELECT UserID, Email, Password, Role, IsActive 
            FROM Users 
            WHERE Email IN ('member@example.com', 'coach@example.com', 'admin@example.com')
        `;

        console.log('👥 User accounts:');
        users.recordset.forEach(user => {
            const passwordType = user.Password.length > 20 ? 'HASHED' : 'PLAIN TEXT';
            console.log(`   ${user.Role}: ${user.Email} | Password: ${user.Password} (${passwordType}) | Active: ${user.IsActive}`);
        });

        if (users.recordset.some(user => user.Password.length > 20)) {
            console.log('\n⚠️  WARNING: Some users have hashed passwords!');
            console.log('💡 You may need to run the plain password fix script to ensure login works.');
            console.log('🔧 Run: node server/fix-password-plain-text.js');
        } else {
            console.log('\n✅ All users have plain text passwords - login should work!');
        }

        console.log('\n🎉 Achievements database setup complete!');
        console.log('🌐 You can now access the achievements page at: http://localhost:3000/achievement');
        console.log('🔑 Login credentials: email@example.com / password');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

fixAchievementsNoHash(); 