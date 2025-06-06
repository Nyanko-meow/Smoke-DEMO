const { pool } = require('./src/config/database');

async function setupEnhancedAchievements() {
    try {
        console.log('🏆 Setting up enhanced achievements system...\n');

        // Clear existing achievements to start fresh
        console.log('🧹 Clearing existing achievements...');
        await pool.request().query('DELETE FROM UserAchievements');
        await pool.request().query('DELETE FROM Achievements');

        // Enhanced achievements structure with membership plan integration
        const achievements = [
            // ===== BASIC PLAN ACHIEVEMENTS =====
            {
                name: '🌟 Bước đầu khởi đầu',
                description: 'Hoàn thành ngày đầu tiên không hút thuốc (Basic Plan)',
                iconUrl: '🌟',
                category: 'basic',
                milestoneDays: 1,
                savedMoney: null,
                requiredPlan: 'basic',
                difficulty: 1,
                points: 10
            },
            {
                name: '⭐ Tuần lễ dẻo dai',
                description: 'Kiên trì 7 ngày không hút thuốc (Basic Plan)',
                iconUrl: '⭐',
                category: 'basic',
                milestoneDays: 7,
                savedMoney: null,
                requiredPlan: 'basic',
                difficulty: 2,
                points: 50
            },
            {
                name: '🏅 Chiến binh tháng đầu',
                description: 'Vượt qua thử thách 30 ngày đầu tiên (Basic Plan)',
                iconUrl: '🏅',
                category: 'basic',
                milestoneDays: 30,
                savedMoney: null,
                requiredPlan: 'basic',
                difficulty: 3,
                points: 200
            },

            // ===== PREMIUM PLAN ACHIEVEMENTS =====
            {
                name: '💎 Khởi đầu Premium',
                description: 'Hoàn thành ngày đầu với gói Premium',
                iconUrl: '💎',
                category: 'premium',
                milestoneDays: 1,
                savedMoney: null,
                requiredPlan: 'premium',
                difficulty: 1,
                points: 15
            },
            {
                name: '🔥 Tuần lễ Premium',
                description: 'Kiên trì 7 ngày với hỗ trợ Premium',
                iconUrl: '🔥',
                category: 'premium',
                milestoneDays: 7,
                savedMoney: null,
                requiredPlan: 'premium',
                difficulty: 2,
                points: 75
            },
            {
                name: '👑 Tháng vàng Premium',
                description: '30 ngày hoàn hảo với gói Premium',
                iconUrl: '👑',
                category: 'premium',
                milestoneDays: 30,
                savedMoney: null,
                requiredPlan: 'premium',
                difficulty: 3,
                points: 300
            },
            {
                name: '🎯 Quý Master Premium',
                description: '90 ngày kiên định với Premium',
                iconUrl: '🎯',
                category: 'premium',
                milestoneDays: 90,
                savedMoney: null,
                requiredPlan: 'premium',
                difficulty: 4,
                points: 500
            },

            // ===== PRO PLAN ACHIEVEMENTS =====
            {
                name: '🚀 Pro Starter',
                description: 'Bắt đầu hành trình với gói Pro',
                iconUrl: '🚀',
                category: 'pro',
                milestoneDays: 1,
                savedMoney: null,
                requiredPlan: 'pro',
                difficulty: 1,
                points: 20
            },
            {
                name: '💪 Pro Warrior',
                description: 'Chiến thắng tuần đầu với Pro',
                iconUrl: '💪',
                category: 'pro',
                milestoneDays: 7,
                savedMoney: null,
                requiredPlan: 'pro',
                difficulty: 2,
                points: 100
            },
            {
                name: '🏆 Pro Champion',
                description: 'Tháng đầu hoàn hảo với Pro',
                iconUrl: '🏆',
                category: 'pro',
                milestoneDays: 30,
                savedMoney: null,
                requiredPlan: 'pro',
                difficulty: 3,
                points: 400
            },
            {
                name: '🌟 Pro Legend',
                description: 'Quý đầu huyền thoại với Pro',
                iconUrl: '🌟',
                category: 'pro',
                milestoneDays: 90,
                savedMoney: null,
                requiredPlan: 'pro',
                difficulty: 4,
                points: 800
            },
            {
                name: '👨‍🎓 Pro Master',
                description: '6 tháng kiên trì với Pro',
                iconUrl: '👨‍🎓',
                category: 'pro',
                milestoneDays: 180,
                savedMoney: null,
                requiredPlan: 'pro',
                difficulty: 5,
                points: 1500
            },
            {
                name: '🎖️ Pro Grandmaster',
                description: '1 năm hoàn hảo với Pro',
                iconUrl: '🎖️',
                category: 'pro',
                milestoneDays: 365,
                savedMoney: null,
                requiredPlan: 'pro',
                difficulty: 6,
                points: 3000
            },

            // ===== MONEY SAVED ACHIEVEMENTS =====
            {
                name: '💰 Tiết kiệm khởi đầu',
                description: 'Tiết kiệm được 50,000 VNĐ',
                iconUrl: '💰',
                category: 'money',
                milestoneDays: null,
                savedMoney: 50000,
                requiredPlan: null,
                difficulty: 1,
                points: 25
            },
            {
                name: '💵 Túi tiền dày lên',
                description: 'Tiết kiệm được 100,000 VNĐ',
                iconUrl: '💵',
                category: 'money',
                milestoneDays: null,
                savedMoney: 100000,
                requiredPlan: null,
                difficulty: 2,
                points: 50
            },
            {
                name: '💎 Kho báu nhỏ',
                description: 'Tiết kiệm được 500,000 VNĐ',
                iconUrl: '💎',
                category: 'money',
                milestoneDays: null,
                savedMoney: 500000,
                requiredPlan: null,
                difficulty: 3,
                points: 150
            },
            {
                name: '🏦 Triệu phú nhỏ',
                description: 'Tiết kiệm được 1,000,000 VNĐ',
                iconUrl: '🏦',
                category: 'money',
                milestoneDays: null,
                savedMoney: 1000000,
                requiredPlan: null,
                difficulty: 4,
                points: 300
            },
            {
                name: '💸 Tỷ phú tương lai',
                description: 'Tiết kiệm được 5,000,000 VNĐ',
                iconUrl: '💸',
                category: 'money',
                milestoneDays: null,
                savedMoney: 5000000,
                requiredPlan: null,
                difficulty: 5,
                points: 750
            },

            // ===== SPECIAL ACHIEVEMENTS =====
            {
                name: '🎉 Người tiên phong',
                description: 'Là một trong 100 người đầu tiên tham gia',
                iconUrl: '🎉',
                category: 'special',
                milestoneDays: null,
                savedMoney: null,
                requiredPlan: null,
                difficulty: 1,
                points: 100
            },
            {
                name: '🤝 Người chia sẻ',
                description: 'Chia sẻ 10 bài viết trong cộng đồng',
                iconUrl: '🤝',
                category: 'social',
                milestoneDays: null,
                savedMoney: null,
                requiredPlan: null,
                difficulty: 2,
                points: 80
            },
            {
                name: '💬 Người truyền cảm hứng',
                description: 'Nhận được 50 likes trong cộng đồng',
                iconUrl: '💬',
                category: 'social',
                milestoneDays: null,
                savedMoney: null,
                requiredPlan: null,
                difficulty: 3,
                points: 120
            }
        ];

        // Update Achievements table structure
        console.log('📝 Updating Achievements table structure...');

        // Add new columns if they don't exist
        try {
            await pool.request().query(`
                ALTER TABLE Achievements ADD 
                Category NVARCHAR(50),
                RequiredPlan NVARCHAR(20),
                Difficulty INT,
                Points INT DEFAULT 0,
                IsActive BIT DEFAULT 1
            `);
            console.log('✅ Added new columns to Achievements table');
        } catch (error) {
            console.log('ℹ️ Columns may already exist');
        }

        // Insert enhanced achievements
        console.log('🚀 Inserting enhanced achievements...');

        for (const achievement of achievements) {
            try {
                const result = await pool.request()
                    .input('Name', achievement.name)
                    .input('Description', achievement.description)
                    .input('IconURL', achievement.iconUrl)
                    .input('MilestoneDays', achievement.milestoneDays)
                    .input('SavedMoney', achievement.savedMoney)
                    .input('Category', achievement.category)
                    .input('RequiredPlan', achievement.requiredPlan)
                    .input('Difficulty', achievement.difficulty)
                    .input('Points', achievement.points)
                    .query(`
                        INSERT INTO Achievements (
                            Name, Description, IconURL, MilestoneDays, SavedMoney,
                            Category, RequiredPlan, Difficulty, Points, IsActive, CreatedAt
                        )
                        OUTPUT INSERTED.AchievementID
                        VALUES (
                            @Name, @Description, @IconURL, @MilestoneDays, @SavedMoney,
                            @Category, @RequiredPlan, @Difficulty, @Points, 1, GETDATE()
                        )
                    `);

                console.log(`✅ Created: ${achievement.name} (ID: ${result.recordset[0].AchievementID})`);
            } catch (error) {
                console.error(`❌ Error creating ${achievement.name}:`, error.message);
            }
        }

        // Show summary
        const totalAchievements = await pool.request().query('SELECT COUNT(*) as count FROM Achievements');
        console.log(`\n🎯 Total achievements created: ${totalAchievements.recordset[0].count}`);

        // Show achievements by category
        const categories = await pool.request().query(`
            SELECT Category, COUNT(*) as count 
            FROM Achievements 
            GROUP BY Category 
            ORDER BY Category
        `);

        console.log('\n📊 Achievements by category:');
        categories.recordset.forEach(cat => {
            console.log(`- ${cat.Category}: ${cat.count} achievements`);
        });

        console.log('\n✅ Enhanced achievements system setup completed!');

    } catch (error) {
        console.error('❌ Error setting up achievements:', error);
        throw error;
    }
}

if (require.main === module) {
    setupEnhancedAchievements()
        .then(() => {
            console.log('✅ Script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { setupEnhancedAchievements }; 