const { pool, connectDB } = require('./src/config/database');

async function forceUnlockNow() {
    try {
        console.log('🚀 FORCE UNLOCK ACHIEVEMENTS NOW');
        console.log('================================\n');

        await connectDB();
        console.log('✅ Database connected\n');

        // Get all users
        const users = await pool.request().query(`
            SELECT UserID, Email, FirstName, LastName
            FROM Users 
            WHERE Role IN ('member', 'guest') 
            AND IsActive = 1
        `);

        console.log(`Found ${users.recordset.length} users\n`);

        for (const user of users.recordset) {
            console.log(`🔧 Processing user: ${user.Email}`);

            // Force create progress data with good values
            console.log('  📊 Creating/updating progress data...');

            // Delete existing progress to start fresh
            await pool.request()
                .input('UserID', user.UserID)
                .query('DELETE FROM ProgressTracking WHERE UserID = @UserID');

            // Create multiple progress entries with increasing values
            const progressEntries = [
                { date: '2024-01-01', days: 1, money: 50000, cigarettes: 0 },
                { date: '2024-01-07', days: 7, money: 350000, cigarettes: 0 },
                { date: '2024-01-30', days: 30, money: 1500000, cigarettes: 0 },
                { date: '2024-02-29', days: 60, money: 3000000, cigarettes: 0 },
                { date: '2024-03-30', days: 90, money: 4500000, cigarettes: 0 }
            ];

            for (const entry of progressEntries) {
                await pool.request()
                    .input('UserID', user.UserID)
                    .input('Date', entry.date)
                    .input('DaysSmokeFree', entry.days)
                    .input('MoneySaved', entry.money)
                    .input('CigarettesSmoked', entry.cigarettes)
                    .input('CravingLevel', 2)
                    .input('EmotionNotes', 'Feeling great!')
                    .query(`
                        INSERT INTO ProgressTracking (UserID, Date, DaysSmokeFree, MoneySaved, CigarettesSmoked, CravingLevel, EmotionNotes, CreatedAt)
                        VALUES (@UserID, @Date, @DaysSmokeFree, @MoneySaved, @CigarettesSmoked, @CravingLevel, @EmotionNotes, GETDATE())
                    `);
            }

            console.log('  ✅ Progress data created');

            // Get current progress
            const progress = await pool.request()
                .input('UserID', user.UserID)
                .query(`
                    SELECT 
                        MAX(DaysSmokeFree) as DaysSmokeFree,
                        SUM(MoneySaved) as TotalMoneySaved
                    FROM ProgressTracking 
                    WHERE UserID = @UserID
                `);

            const progressData = progress.recordset[0];
            console.log(`  📈 Final progress: ${progressData.DaysSmokeFree} days, ${progressData.TotalMoneySaved} VND`);

            // Clear existing achievements
            await pool.request()
                .input('UserID', user.UserID)
                .query('DELETE FROM UserAchievements WHERE UserID = @UserID');

            console.log('  🗑️ Cleared existing achievements');

            // Get all achievements
            const achievements = await pool.request().query(`
                SELECT AchievementID, Name, MilestoneDays, SavedMoney
                FROM Achievements
                WHERE IsActive = 1
                ORDER BY AchievementID
            `);

            console.log(`  🎯 Checking ${achievements.recordset.length} achievements...`);

            let unlockedCount = 0;

            // Check and unlock each achievement
            for (const achievement of achievements.recordset) {
                let shouldUnlock = false;

                // Check milestone days
                if (achievement.MilestoneDays !== null) {
                    if (progressData.DaysSmokeFree >= achievement.MilestoneDays) {
                        shouldUnlock = true;
                        console.log(`    ✅ Qualifies for "${achievement.Name}" (${achievement.MilestoneDays} days)`);
                    } else {
                        console.log(`    ❌ Not qualified for "${achievement.Name}" (need ${achievement.MilestoneDays} days, have ${progressData.DaysSmokeFree})`);
                    }
                }

                // Check saved money
                if (achievement.SavedMoney !== null) {
                    if (progressData.TotalMoneySaved >= achievement.SavedMoney) {
                        shouldUnlock = true;
                        console.log(`    ✅ Qualifies for "${achievement.Name}" (${achievement.SavedMoney} VND)`);
                    } else {
                        console.log(`    ❌ Not qualified for "${achievement.Name}" (need ${achievement.SavedMoney} VND, have ${progressData.TotalMoneySaved})`);
                    }
                }

                // Force unlock if no specific criteria
                if (achievement.MilestoneDays === null && achievement.SavedMoney === null) {
                    shouldUnlock = true;
                    console.log(`    ✅ Force unlocking "${achievement.Name}" (no specific criteria)`);
                }

                // Award achievement
                if (shouldUnlock) {
                    await pool.request()
                        .input('UserID', user.UserID)
                        .input('AchievementID', achievement.AchievementID)
                        .query(`
                            INSERT INTO UserAchievements (UserID, AchievementID, EarnedAt)
                            VALUES (@UserID, @AchievementID, GETDATE())
                        `);

                    console.log(`    🏆 UNLOCKED: ${achievement.Name}`);
                    unlockedCount++;
                }
            }

            console.log(`  🎉 Total unlocked for ${user.Email}: ${unlockedCount} achievements\n`);
        }

        // Final summary
        const finalStats = await pool.request().query(`
            SELECT 
                COUNT(DISTINCT ua.UserID) as UsersWithAchievements,
                COUNT(*) as TotalUnlockedAchievements
            FROM UserAchievements ua
        `);

        const stats = finalStats.recordset[0];
        console.log('🎯 FINAL SUMMARY');
        console.log('================');
        console.log(`👤 Users with achievements: ${stats.UsersWithAchievements}`);
        console.log(`🏆 Total unlocked achievements: ${stats.TotalUnlockedAchievements}`);
        console.log('\n🎉 FORCE UNLOCK COMPLETED!');
        console.log('💡 Now refresh your browser and check the achievements page!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

forceUnlockNow(); 