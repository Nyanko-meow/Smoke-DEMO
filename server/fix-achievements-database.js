const { pool } = require('./src/config/database');

async function fixAchievementsDatabase() {
    try {
        console.log('🔧 Fixing Achievements Database Issues...\n');

        // Step 1: Check if Achievements table exists
        console.log('1. 📊 Checking Achievements table...');
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Achievements'
        `);

        if (tableCheck.recordset[0].count === 0) {
            console.log('❌ Achievements table does not exist. Creating...');

            await pool.request().query(`
                CREATE TABLE Achievements (
                    AchievementID INT PRIMARY KEY IDENTITY(1,1),
                    Name NVARCHAR(100) NOT NULL,
                    Description NVARCHAR(255),
                    IconURL NVARCHAR(255),
                    MilestoneDays INT NULL,
                    SavedMoney INT NULL,
                    Category NVARCHAR(50),
                    RequiredPlan NVARCHAR(20),
                    Difficulty INT,
                    Points INT DEFAULT 0,
                    IsActive BIT DEFAULT 1,
                    CreatedAt DATETIME DEFAULT GETDATE()
                )
            `);
            console.log('✅ Achievements table created');
        } else {
            console.log('✅ Achievements table exists');

            // Step 2: Check if new columns exist
            console.log('\n2. 🔍 Checking for missing columns...');
            const columns = await pool.request().query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Achievements'
            `);

            const existingColumns = columns.recordset.map(col => col.COLUMN_NAME);
            const requiredColumns = ['Category', 'RequiredPlan', 'Difficulty', 'Points', 'IsActive'];

            for (const column of requiredColumns) {
                if (!existingColumns.includes(column)) {
                    console.log(`➕ Adding missing column: ${column}`);

                    switch (column) {
                        case 'Category':
                            await pool.request().query('ALTER TABLE Achievements ADD Category NVARCHAR(50)');
                            break;
                        case 'RequiredPlan':
                            await pool.request().query('ALTER TABLE Achievements ADD RequiredPlan NVARCHAR(20)');
                            break;
                        case 'Difficulty':
                            await pool.request().query('ALTER TABLE Achievements ADD Difficulty INT');
                            break;
                        case 'Points':
                            await pool.request().query('ALTER TABLE Achievements ADD Points INT DEFAULT 0');
                            break;
                        case 'IsActive':
                            await pool.request().query('ALTER TABLE Achievements ADD IsActive BIT DEFAULT 1');
                            break;
                    }
                    console.log(`✅ Added column: ${column}`);
                } else {
                    console.log(`✅ Column exists: ${column}`);
                }
            }
        }

        // Step 3: Clear existing data and insert new achievements
        console.log('\n3. 🧹 Clearing existing achievements...');
        await pool.request().query('DELETE FROM UserAchievements');
        await pool.request().query('DELETE FROM Achievements');

        // Step 4: Insert enhanced achievements
        console.log('\n4. 🚀 Inserting enhanced achievements...');

        const achievements = [
            // Basic Plan
            { name: '🌟 Bước đầu khởi đầu', desc: 'Hoàn thành ngày đầu tiên không hút thuốc (Basic Plan)', icon: '🌟', cat: 'basic', days: 1, money: null, plan: 'basic', diff: 1, pts: 10 },
            { name: '⭐ Tuần lễ dẻo dai', desc: 'Kiên trì 7 ngày không hút thuốc (Basic Plan)', icon: '⭐', cat: 'basic', days: 7, money: null, plan: 'basic', diff: 2, pts: 50 },
            { name: '🏅 Chiến binh tháng đầu', desc: 'Vượt qua thử thách 30 ngày đầu tiên (Basic Plan)', icon: '🏅', cat: 'basic', days: 30, money: null, plan: 'basic', diff: 3, pts: 200 },

            // Premium Plan
            { name: '💎 Khởi đầu Premium', desc: 'Hoàn thành ngày đầu với gói Premium', icon: '💎', cat: 'premium', days: 1, money: null, plan: 'premium', diff: 1, pts: 15 },
            { name: '🔥 Tuần lễ Premium', desc: 'Kiên trì 7 ngày với hỗ trợ Premium', icon: '🔥', cat: 'premium', days: 7, money: null, plan: 'premium', diff: 2, pts: 75 },
            { name: '👑 Tháng vàng Premium', desc: '30 ngày hoàn hảo với gói Premium', icon: '👑', cat: 'premium', days: 30, money: null, plan: 'premium', diff: 3, pts: 300 },
            { name: '🎯 Quý Master Premium', desc: '90 ngày kiên định với Premium', icon: '🎯', cat: 'premium', days: 90, money: null, plan: 'premium', diff: 4, pts: 500 },

            // Pro Plan
            { name: '🚀 Pro Starter', desc: 'Bắt đầu hành trình với gói Pro', icon: '🚀', cat: 'pro', days: 1, money: null, plan: 'pro', diff: 1, pts: 20 },
            { name: '💪 Pro Warrior', desc: 'Chiến thắng tuần đầu với Pro', icon: '💪', cat: 'pro', days: 7, money: null, plan: 'pro', diff: 2, pts: 100 },
            { name: '🏆 Pro Champion', desc: 'Tháng đầu hoàn hảo với Pro', icon: '🏆', cat: 'pro', days: 30, money: null, plan: 'pro', diff: 3, pts: 400 },
            { name: '🌟 Pro Legend', desc: 'Quý đầu huyền thoại với Pro', icon: '🌟', cat: 'pro', days: 90, money: null, plan: 'pro', diff: 4, pts: 800 },
            { name: '👨‍🎓 Pro Master', desc: '6 tháng kiên trì với Pro', icon: '👨‍🎓', cat: 'pro', days: 180, money: null, plan: 'pro', diff: 5, pts: 1500 },
            { name: '🎖️ Pro Grandmaster', desc: '1 năm hoàn hảo với Pro', icon: '🎖️', cat: 'pro', days: 365, money: null, plan: 'pro', diff: 6, pts: 3000 },

            // Money Achievements
            { name: '💰 Tiết kiệm khởi đầu', desc: 'Tiết kiệm được 50,000 VNĐ', icon: '💰', cat: 'money', days: null, money: 50000, plan: null, diff: 1, pts: 25 },
            { name: '💵 Túi tiền dày lên', desc: 'Tiết kiệm được 100,000 VNĐ', icon: '💵', cat: 'money', days: null, money: 100000, plan: null, diff: 2, pts: 50 },
            { name: '💎 Kho báu nhỏ', desc: 'Tiết kiệm được 500,000 VNĐ', icon: '💎', cat: 'money', days: null, money: 500000, plan: null, diff: 3, pts: 150 },
            { name: '🏦 Triệu phú nhỏ', desc: 'Tiết kiệm được 1,000,000 VNĐ', icon: '🏦', cat: 'money', days: null, money: 1000000, plan: null, diff: 4, pts: 300 },
            { name: '💸 Tỷ phú tương lai', desc: 'Tiết kiệm được 5,000,000 VNĐ', icon: '💸', cat: 'money', days: null, money: 5000000, plan: null, diff: 5, pts: 750 },

            // Special & Social
            { name: '🎉 Người tiên phong', desc: 'Là một trong 100 người đầu tiên tham gia', icon: '🎉', cat: 'special', days: null, money: null, plan: null, diff: 1, pts: 100 },
            { name: '🤝 Người chia sẻ', desc: 'Chia sẻ 10 bài viết trong cộng đồng', icon: '🤝', cat: 'social', days: null, money: null, plan: null, diff: 2, pts: 80 },
            { name: '💬 Người truyền cảm hứng', desc: 'Nhận được 50 likes trong cộng đồng', icon: '💬', cat: 'social', days: null, money: null, plan: null, diff: 3, pts: 120 }
        ];

        for (const ach of achievements) {
            try {
                await pool.request()
                    .input('Name', ach.name)
                    .input('Description', ach.desc)
                    .input('IconURL', ach.icon)
                    .input('MilestoneDays', ach.days)
                    .input('SavedMoney', ach.money)
                    .input('Category', ach.cat)
                    .input('RequiredPlan', ach.plan)
                    .input('Difficulty', ach.diff)
                    .input('Points', ach.pts)
                    .query(`
                        INSERT INTO Achievements (
                            Name, Description, IconURL, MilestoneDays, SavedMoney,
                            Category, RequiredPlan, Difficulty, Points, IsActive, CreatedAt
                        ) VALUES (
                            @Name, @Description, @IconURL, @MilestoneDays, @SavedMoney,
                            @Category, @RequiredPlan, @Difficulty, @Points, 1, GETDATE()
                        )
                    `);
                console.log(`✅ Created: ${ach.name}`);
            } catch (error) {
                console.error(`❌ Error creating ${ach.name}:`, error.message);
            }
        }

        // Step 5: Show summary
        const count = await pool.request().query('SELECT COUNT(*) as count FROM Achievements');
        console.log(`\n🎯 Total achievements created: ${count.recordset[0].count}`);

        console.log('\n✅ Database fix completed successfully!');
        console.log('💡 You can now reload the frontend page to see achievements!');

    } catch (error) {
        console.error('❌ Error fixing database:', error);
        throw error;
    }
}

if (require.main === module) {
    fixAchievementsDatabase()
        .then(() => {
            console.log('✅ Script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { fixAchievementsDatabase }; 