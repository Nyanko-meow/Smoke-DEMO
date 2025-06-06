const { pool, connectDB } = require('./src/config/database');

async function checkAndAddAchievements() {
    try {
        console.log('🔍 CHECKING ACHIEVEMENTS DATA');
        console.log('============================\n');

        await connectDB();
        console.log('✅ Database connected\n');

        // Check current achievements
        const currentAchievements = await pool.request().query(`
            SELECT AchievementID, Name, Description, MilestoneDays, SavedMoney
            FROM Achievements
            ORDER BY AchievementID
        `);

        console.log(`📋 Current achievements: ${currentAchievements.recordset.length}`);
        currentAchievements.recordset.forEach(ach => {
            console.log(`  - ${ach.Name} (Days: ${ach.MilestoneDays}, Money: ${ach.SavedMoney})`);
        });

        // Add more achievements if needed
        const newAchievements = [
            {
                name: 'Tuần lễ khởi đầu',
                description: 'Bạn đã không hút thuốc được 7 ngày liên tiếp!',
                iconURL: '🌟',
                milestoneDays: 7,
                savedMoney: null,
                category: 'basic'
            },
            {
                name: 'Tháng đầu tiên',
                description: 'Một tháng không hút thuốc - một cột mốc quan trọng!',
                iconURL: '👑',
                milestoneDays: 30,
                savedMoney: null,
                category: 'basic'
            },
            {
                name: 'Tiết kiệm 100K',
                description: 'Bạn đã tiết kiệm được 100,000 VNĐ nhờ việc không hút thuốc!',
                iconURL: '💰',
                milestoneDays: null,
                savedMoney: 100000,
                category: 'money'
            },
            {
                name: 'Tiết kiệm 500K',
                description: 'Tuyệt vời! Bạn đã tiết kiệm được 500,000 VNĐ!',
                iconURL: '💎',
                milestoneDays: null,
                savedMoney: 500000,
                category: 'money'
            }
        ];

        console.log('\n📝 Adding new achievements...');

        for (const ach of newAchievements) {
            try {
                // Check if achievement already exists
                const existing = await pool.request()
                    .input('Name', ach.name)
                    .query('SELECT AchievementID FROM Achievements WHERE Name = @Name');

                if (existing.recordset.length === 0) {
                    await pool.request()
                        .input('Name', ach.name)
                        .input('Description', ach.description)
                        .input('IconURL', ach.iconURL)
                        .input('MilestoneDays', ach.milestoneDays)
                        .input('SavedMoney', ach.savedMoney)
                        .input('Category', ach.category)
                        .query(`
                            INSERT INTO Achievements (Name, Description, IconURL, MilestoneDays, SavedMoney, Category, IsActive, CreatedAt)
                            VALUES (@Name, @Description, @IconURL, @MilestoneDays, @SavedMoney, @Category, 1, GETDATE())
                        `);

                    console.log(`  ✅ Added: ${ach.name}`);
                } else {
                    console.log(`  ⚠️ Already exists: ${ach.name}`);
                }
            } catch (error) {
                console.error(`  ❌ Error adding ${ach.name}:`, error.message);
            }
        }

        // Check final count
        const finalAchievements = await pool.request().query(`
            SELECT COUNT(*) as count FROM Achievements WHERE IsActive = 1
        `);

        console.log(`\n🎯 Final achievement count: ${finalAchievements.recordset[0].count}`);

        // Now run the fix script again
        console.log('\n🔄 Running achievement fix for all users...');

        const users = await pool.request().query(`
            SELECT DISTINCT u.UserID, u.Email, u.FirstName, u.LastName
            FROM Users u
            WHERE u.Role IN ('member', 'guest') 
            AND u.IsActive = 1
        `);

        let totalUnlocked = 0;

        for (const user of users.recordset) {
            console.log(`\nChecking user: ${user.Email}`);

            // Get user's progress
            const progress = await pool.request()
                .input('UserID', user.UserID)
                .query(`
                    SELECT 
                        COALESCE(MAX(DaysSmokeFree), 0) as DaysSmokeFree,
                        COALESCE(SUM(MoneySaved), 0) as TotalMoneySaved,
                        COUNT(*) as ProgressEntries
                    FROM ProgressTracking 
                    WHERE UserID = @UserID
                `);

            const progressData = progress.recordset[0];

            // If no progress, create more realistic data
            if (progressData.ProgressEntries === 0) {
                console.log('  Creating demo progress data...');

                // Create multiple progress entries
                const demoEntries = [
                    { days: 1, money: 50000, date: new Date() },
                    { days: 7, money: 350000, date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
                    { days: 30, money: 1500000, date: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000) }
                ];

                for (const entry of demoEntries) {
                    await pool.request()
                        .input('UserID', user.UserID)
                        .input('Date', entry.date.toISOString().split('T')[0])
                        .input('DaysSmokeFree', entry.days)
                        .input('MoneySaved', entry.money)
                        .input('CigarettesSmoked', 0)
                        .input('CravingLevel', 3)
                        .query(`
                            INSERT INTO ProgressTracking (UserID, Date, DaysSmokeFree, MoneySaved, CigarettesSmoked, CravingLevel, CreatedAt)
                            VALUES (@UserID, @Date, @DaysSmokeFree, @MoneySaved, @CigarettesSmoked, @CravingLevel, GETDATE())
                        `);
                }

                progressData.DaysSmokeFree = 30;
                progressData.TotalMoneySaved = 1500000;
                console.log('  ✅ Demo progress created');
            }

            console.log(`  Progress: ${progressData.DaysSmokeFree} days, ${progressData.TotalMoneySaved} VND`);

            // Get achievements user doesn't have
            const availableAchievements = await pool.request()
                .input('UserID', user.UserID)
                .query(`
                    SELECT a.*
                    FROM Achievements a
                    WHERE a.IsActive = 1
                    AND a.AchievementID NOT IN (
                        SELECT AchievementID 
                        FROM UserAchievements 
                        WHERE UserID = @UserID
                    )
                    ORDER BY a.AchievementID
                `);

            console.log(`  Available achievements: ${availableAchievements.recordset.length}`);

            // Check each achievement
            for (const achievement of availableAchievements.recordset) {
                let shouldUnlock = false;

                // Check milestone days
                if (achievement.MilestoneDays !== null) {
                    if (progressData.DaysSmokeFree >= achievement.MilestoneDays) {
                        shouldUnlock = true;
                        console.log(`    ✅ Qualifies for "${achievement.Name}" (${achievement.MilestoneDays} days)`);
                    }
                }

                // Check saved money
                if (achievement.SavedMoney !== null) {
                    if (progressData.TotalMoneySaved >= achievement.SavedMoney) {
                        shouldUnlock = true;
                        console.log(`    ✅ Qualifies for "${achievement.Name}" (${achievement.SavedMoney} VND)`);
                    }
                }

                // Award achievement
                if (shouldUnlock) {
                    try {
                        await pool.request()
                            .input('UserID', user.UserID)
                            .input('AchievementID', achievement.AchievementID)
                            .query(`
                                INSERT INTO UserAchievements (UserID, AchievementID, EarnedAt)
                                VALUES (@UserID, @AchievementID, GETDATE())
                            `);

                        console.log(`    🏆 UNLOCKED: ${achievement.Name}`);
                        totalUnlocked++;
                    } catch (error) {
                        if (!error.message.includes('duplicate')) {
                            console.error(`    ❌ Error: ${error.message}`);
                        }
                    }
                }
            }
        }

        console.log(`\n🎉 FINAL RESULTS!`);
        console.log(`Total achievements unlocked: ${totalUnlocked}`);
        console.log('💡 Refresh your browser to see all the changes!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

checkAndAddAchievements(); 