const { pool, connectDB } = require('./src/config/database');

async function forceUnlockAchievements() {
    try {
        console.log('🚀 FORCE UNLOCK ACHIEVEMENTS');
        console.log('============================\n');

        // Connect to database
        console.log('1. 🔌 Connecting to database...');
        await connectDB();
        await pool.request().query('SELECT 1 as test');
        console.log('✅ Database connected\n');

        // Get all users with progress data
        console.log('2. 👤 Finding users with progress...');
        const users = await pool.request().query(`
            SELECT DISTINCT u.UserID, u.Email, u.FirstName, u.LastName
            FROM Users u
            WHERE u.Role IN ('member', 'guest', 'admin')
            AND u.IsActive = 1
        `);

        console.log(`Found ${users.recordset.length} users to check\n`);

        // Get all achievements
        const achievements = await pool.request().query(`
            SELECT AchievementID, Name, Description, MilestoneDays, SavedMoney, Category
            FROM Achievements 
            WHERE IsActive = 1
            ORDER BY AchievementID
        `);

        console.log(`Found ${achievements.recordset.length} achievements\n`);

        let totalUnlocked = 0;

        // Process each user
        for (const user of users.recordset) {
            console.log(`\n🔍 Checking user: ${user.Email} (ID: ${user.UserID})`);

            // Get user's current progress data
            const progressResult = await pool.request()
                .input('UserID', user.UserID)
                .query(`
                    SELECT 
                        COALESCE(MAX(DaysSmokeFree), 0) as DaysSmokeFree,
                        COALESCE(SUM(MoneySaved), 0) as TotalMoneySaved,
                        COUNT(*) as TotalEntries,
                        COUNT(CASE WHEN CigarettesSmoked = 0 THEN 1 END) as SmokeFreeEntries
                    FROM ProgressTracking 
                    WHERE UserID = @UserID
                `);

            const progress = progressResult.recordset[0];
            console.log(`   📊 Progress: ${progress.DaysSmokeFree} days smoke-free, ${Math.round(progress.TotalMoneySaved)} VNĐ saved`);

            // If no progress data, create dummy data for demo
            if (progress.TotalEntries === 0) {
                console.log('   📝 Creating demo progress data...');

                // Create progress entries for demo
                const demoEntries = [
                    { days: 1, money: 50000, cigarettes: 0, date: new Date() },
                    { days: 7, money: 350000, cigarettes: 0, date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) }
                ];

                for (const entry of demoEntries) {
                    await pool.request()
                        .input('UserID', user.UserID)
                        .input('Date', entry.date.toISOString().split('T')[0])
                        .input('DaysSmokeFree', entry.days)
                        .input('MoneySaved', entry.money)
                        .input('CigarettesSmoked', entry.cigarettes)
                        .input('CravingLevel', 3)
                        .input('EmotionNotes', 'Demo data')
                        .query(`
                            INSERT INTO ProgressTracking (UserID, Date, DaysSmokeFree, MoneySaved, CigarettesSmoked, CravingLevel, EmotionNotes, CreatedAt)
                            VALUES (@UserID, @Date, @DaysSmokeFree, @MoneySaved, @CigarettesSmoked, @CravingLevel, @EmotionNotes, GETDATE())
                        `);
                }

                // Update progress data
                progress.DaysSmokeFree = 7;
                progress.TotalMoneySaved = 350000;
                console.log('   ✅ Demo data created');
            }

            // Get user's current achievements
            const currentAchievements = await pool.request()
                .input('UserID', user.UserID)
                .query(`
                    SELECT AchievementID 
                    FROM UserAchievements 
                    WHERE UserID = @UserID
                `);

            const earnedAchievementIds = currentAchievements.recordset.map(a => a.AchievementID);

            // Check each achievement
            for (const achievement of achievements.recordset) {
                // Skip if already earned
                if (earnedAchievementIds.includes(achievement.AchievementID)) {
                    continue;
                }

                let shouldUnlock = false;

                // Check milestone days
                if (achievement.MilestoneDays !== null) {
                    if (progress.DaysSmokeFree >= achievement.MilestoneDays) {
                        shouldUnlock = true;
                        console.log(`   ✅ Qualifies for "${achievement.Name}" (${progress.DaysSmokeFree} >= ${achievement.MilestoneDays} days)`);
                    }
                }

                // Check saved money
                if (achievement.SavedMoney !== null) {
                    if (progress.TotalMoneySaved >= achievement.SavedMoney) {
                        shouldUnlock = true;
                        console.log(`   ✅ Qualifies for "${achievement.Name}" (${Math.round(progress.TotalMoneySaved)} >= ${achievement.SavedMoney} VNĐ)`);
                    }
                }

                // Unlock the achievement
                if (shouldUnlock) {
                    try {
                        await pool.request()
                            .input('UserID', user.UserID)
                            .input('AchievementID', achievement.AchievementID)
                            .query(`
                                INSERT INTO UserAchievements (UserID, AchievementID, EarnedAt)
                                VALUES (@UserID, @AchievementID, GETDATE())
                            `);

                        console.log(`   🏆 UNLOCKED: "${achievement.Name}"`);
                        totalUnlocked++;
                    } catch (error) {
                        if (error.message.includes('duplicate')) {
                            console.log(`   ⚠️ Already has: "${achievement.Name}"`);
                        } else {
                            console.error(`   ❌ Error unlocking "${achievement.Name}":`, error.message);
                        }
                    }
                }
            }
        }

        console.log('\n🎉 FORCE UNLOCK COMPLETED!');
        console.log('==========================');
        console.log(`✅ Total achievements unlocked: ${totalUnlocked}`);
        console.log('✅ Users should now see their earned achievements');
        console.log('\n💡 Refresh your browser to see the changes!');

    } catch (error) {
        console.error('❌ Force unlock failed:', error);
        throw error;
    }
}

if (require.main === module) {
    forceUnlockAchievements()
        .then(() => {
            console.log('✅ Script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { forceUnlockAchievements }; 