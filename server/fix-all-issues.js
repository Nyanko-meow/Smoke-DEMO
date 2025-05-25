const bcrypt = require('bcryptjs');
const { pool, connectDB } = require('./src/config/database');

async function fixAllIssues() {
    try {
        console.log('🚀 FIXING ALL SYSTEM ISSUES');
        console.log('============================\n');

        // Step 1: Connect to database
        console.log('1. 🔌 Connecting to database...');
        await connectDB();
        await pool.request().query('SELECT 1 as test');
        console.log('✅ Database connected successfully\n');

        // Step 2: Create coach account
        console.log('2. 👨‍⚕️ Creating coach test account...');
        const email = 'coach@test.com';
        const password = 'Coach123@';

        // Check if coach already exists
        const existingCoach = await pool.request()
            .input('Email', email)
            .query('SELECT UserID FROM Users WHERE Email = @Email');

        if (existingCoach.recordset.length > 0) {
            console.log('✅ Coach account already exists:', email);
        } else {
            const hashedPassword = await bcrypt.hash(password, 12);

            const result = await pool.request()
                .input('Email', email)
                .input('Password', hashedPassword)
                .input('FirstName', 'Coach')
                .input('LastName', 'Test')
                .input('Role', 'coach')
                .query(`
                    INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified, CreatedAt, UpdatedAt)
                    OUTPUT INSERTED.UserID
                    VALUES (@Email, @Password, @FirstName, @LastName, @Role, 1, 1, GETDATE(), GETDATE())
                `);

            console.log('✅ Coach account created successfully!');
            console.log('   📧 Email:', email);
            console.log('   🔑 Password:', password);
            console.log('   👤 UserID:', result.recordset[0].UserID);
        }

        // Step 3: Fix Achievements table
        console.log('\n3. 🏆 Setting up Achievements system...');

        // Check if Achievements table exists
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Achievements'
        `);

        if (tableCheck.recordset[0].count === 0) {
            console.log('   Creating Achievements table...');
            await pool.request().query(`
                CREATE TABLE Achievements (
                    AchievementID INT PRIMARY KEY IDENTITY(1,1),
                    Name NVARCHAR(100) NOT NULL,
                    Description NVARCHAR(255),
                    IconURL NVARCHAR(255),
                    MilestoneDays INT NULL,
                    SavedMoney INT NULL,
                    CreatedAt DATETIME DEFAULT GETDATE()
                )
            `);
            console.log('✅ Achievements table created');
        } else {
            console.log('✅ Achievements table exists');
        }

        // Step 4: Check UserAchievements table
        const userAchTableCheck = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'UserAchievements'
        `);

        if (userAchTableCheck.recordset[0].count === 0) {
            console.log('   Creating UserAchievements table...');
            await pool.request().query(`
                CREATE TABLE UserAchievements (
                    UserAchievementID INT PRIMARY KEY IDENTITY(1,1),
                    UserID INT NOT NULL,
                    AchievementID INT NOT NULL,
                    EarnedAt DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (UserID) REFERENCES Users(UserID),
                    FOREIGN KEY (AchievementID) REFERENCES Achievements(AchievementID)
                )
            `);
            console.log('✅ UserAchievements table created');
        } else {
            console.log('✅ UserAchievements table exists');
        }

        // Step 5: Clear and insert achievements
        console.log('\n4. 🚀 Setting up achievement data...');

        // Clear existing achievements
        await pool.request().query('DELETE FROM UserAchievements WHERE 1=1');
        await pool.request().query('DELETE FROM Achievements WHERE 1=1');

        // Insert basic achievements
        const achievements = [
            { name: 'Ngày đầu tiên', desc: 'Chúc mừng bạn đã hoàn thành ngày đầu tiên không hút thuốc!', icon: 'https://img.icons8.com/emoji/48/000000/trophy-emoji.png', days: 1, money: null },
            { name: 'Tuần lễ khởi đầu', desc: 'Bạn đã không hút thuốc được 7 ngày liên tiếp!', icon: 'https://img.icons8.com/emoji/48/000000/star-emoji.png', days: 7, money: null },
            { name: 'Tháng đầu tiên', desc: 'Một tháng không hút thuốc - một cột mốc quan trọng!', icon: 'https://img.icons8.com/emoji/48/000000/crown-emoji.png', days: 30, money: null },
            { name: 'Quý đầu tiên', desc: '3 tháng không hút thuốc - sức khỏe của bạn đã cải thiện rất nhiều!', icon: 'https://img.icons8.com/emoji/48/000000/gem-stone-emoji.png', days: 90, money: null },
            { name: 'Tiết kiệm 100K', desc: 'Bạn đã tiết kiệm được 100,000 VNĐ nhờ việc không hút thuốc!', icon: 'https://img.icons8.com/emoji/48/000000/money-bag-emoji.png', days: null, money: 100000 },
            { name: 'Tiết kiệm 500K', desc: 'Tuyệt vời! Bạn đã tiết kiệm được 500,000 VNĐ!', icon: 'https://img.icons8.com/emoji/48/000000/money-with-wings-emoji.png', days: null, money: 500000 },
            { name: 'Tiết kiệm 1 triệu', desc: 'Thành tích đáng kinh ngạc! 1,000,000 VNĐ đã được tiết kiệm!', icon: 'https://img.icons8.com/emoji/48/000000/bank-emoji.png', days: null, money: 1000000 }
        ];

        for (const ach of achievements) {
            try {
                await pool.request()
                    .input('Name', ach.name)
                    .input('Description', ach.desc)
                    .input('IconURL', ach.icon)
                    .input('MilestoneDays', ach.days)
                    .input('SavedMoney', ach.money)
                    .query(`
                        INSERT INTO Achievements (Name, Description, IconURL, MilestoneDays, SavedMoney, CreatedAt)
                        VALUES (@Name, @Description, @IconURL, @MilestoneDays, @SavedMoney, GETDATE())
                    `);
                console.log(`✅ Created achievement: ${ach.name}`);
            } catch (error) {
                console.error(`❌ Error creating ${ach.name}:`, error.message);
            }
        }

        // Step 6: Verify data
        console.log('\n5. ✅ Verification...');
        const achievementCount = await pool.request().query('SELECT COUNT(*) as count FROM Achievements');
        const userCount = await pool.request().query('SELECT COUNT(*) as count FROM Users WHERE Role = \'coach\'');

        console.log(`   📊 Total achievements: ${achievementCount.recordset[0].count}`);
        console.log(`   👨‍⚕️ Total coaches: ${userCount.recordset[0].count}`);

        console.log('\n🎉 ALL ISSUES FIXED SUCCESSFULLY!');
        console.log('==================================');
        console.log('📧 Coach Login: coach@test.com');
        console.log('🔐 Coach Password: Coach123@');
        console.log('🌐 Coach Login URL: http://localhost:3000/coach/login');
        console.log('🎯 After login: http://localhost:3000/coach/dashboard');
        console.log('\n💡 You can now:');
        console.log('   1. Reload the frontend page');
        console.log('   2. Test the achievements system');
        console.log('   3. Login as coach using the credentials above');

    } catch (error) {
        console.error('❌ Error fixing issues:', error);
        throw error;
    }
}

if (require.main === module) {
    fixAllIssues()
        .then(() => {
            console.log('✅ Script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { fixAllIssues }; 