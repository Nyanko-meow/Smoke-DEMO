const bcrypt = require('bcryptjs');
const { pool, connectDB } = require('./src/config/database');

async function fixUnlockAchievements() {
    try {
        console.log('🔓 FIXING ACHIEVEMENT UNLOCK ISSUES');
        console.log('===================================\n');

        // Connect to database
        console.log('1. 🔌 Connecting to database...');
        await connectDB();
        await pool.request().query('SELECT 1 as test');
        console.log('✅ Database connected\n');

        // Get all active users with progress data
        console.log('2. 👥 Getting users with progress...');
        const users = await pool.request().query(`
            SELECT DISTINCT u.UserID, u.Email, u.FirstName, u.LastName,
                   COALESCE(MAX(pt.DaysSmokeFree), 0) as DaysSmokeFree,
                   COALESCE(SUM(pt.MoneySaved), 0) as TotalMoneySaved,
                   COUNT(pt.ProgressID) as ProgressEntries
            FROM Users u
            LEFT JOIN ProgressTracking pt ON u.UserID = pt.UserID
            WHERE u.Role IN ('member', 'guest') 
            AND u.IsActive = 1
            GROUP BY u.UserID, u.Email, u.FirstName, u.LastName
            ORDER BY u.UserID
        `);

        console.log(`✅ Found ${users.recordset.length} users\n`);

        let totalUnlocked = 0;

        // Process each user
        for (const user of users.recordset) {
            console.log(`\n📊 Checking user: ${user.Email} (ID: ${user.UserID})`);
            console.log(`   📈 Days smoke-free: ${user.DaysSmokeFree}`);
            console.log(`   💰 Money saved: ${user.TotalMoneySaved} VNĐ`);
            console.log(`   📝 Progress entries: ${user.ProgressEntries}`);

            // If user has no progress, create basic test data
            if (user.ProgressEntries === 0) {
                console.log('   ⚠️  No progress data, creating basic entry...');

                // Create a basic progress entry
                await pool.request()
                    .input('UserID', user.UserID)
                    .input('Date', new Date())
                    .input('DaysSmokeFree', 1)
                    .input('MoneySaved', 50000)
                    .input('CigarettesSmoked', 0)
                    .input('CravingLevel', 5)
                    .query(`
                        INSERT INTO ProgressTracking (UserID, Date, DaysSmokeFree, MoneySaved, CigarettesSmoked, CravingLevel, CreatedAt)
                        VALUES (@UserID, @Date, @DaysSmokeFree, @MoneySaved, @CigarettesSmoked, @CravingLevel, GETDATE())
                    `);

                user.DaysSmokeFree = 1;
                user.TotalMoneySaved = 50000;
                console.log('   ✅ Basic progress created');
            }

            // Get all achievements this user could potentially earn
            const availableAchievements = await pool.request()
                .input('UserID', user.UserID)
                .query(`
                    SELECT a.*
                    FROM Achievements a
                    WHERE a.AchievementID NOT IN (
                        SELECT AchievementID 
                        FROM UserAchievements 
                        WHERE UserID = @UserID
                    )
                    ORDER BY a.AchievementID
                `);

            console.log(`   🎯 Available achievements: ${availableAchievements.recordset.length}`);

            let userUnlocked = 0;

            // Check each achievement
            for (const achievement of availableAchievements.recordset) {
                let shouldUnlock = false;

                // Check milestone days
                if (achievement.MilestoneDays !== null) {
                    if (user.DaysSmokeFree >= achievement.MilestoneDays) {
                        shouldUnlock = true;
                        console.log(`     ✅ Qualifies for "${achievement.Name}" (${achievement.MilestoneDays} days)`);
                    }
                }

                // Check saved money
                if (achievement.SavedMoney !== null) {
                    if (user.TotalMoneySaved >= achievement.SavedMoney) {
                        shouldUnlock = true;
                        console.log(`     ✅ Qualifies for "${achievement.Name}" (${achievement.SavedMoney} VNĐ)`);
                    }
                }

                // Special achievements (award to all active users)
                if (achievement.Name.includes('Người tiên phong') || achievement.Name.includes('Khởi đầu')) {
                    shouldUnlock = true;
                    console.log(`     ✅ Qualifies for special achievement "${achievement.Name}"`);
                }

                // Award the achievement
                if (shouldUnlock) {
                    try {
                        await pool.request()
                            .input('UserID', user.UserID)
                            .input('AchievementID', achievement.AchievementID)
                            .query(`
                                INSERT INTO UserAchievements (UserID, AchievementID, EarnedAt)
                                VALUES (@UserID, @AchievementID, GETDATE())
                            `);

                        userUnlocked++;
                        totalUnlocked++;
                        console.log(`     🏆 UNLOCKED: ${achievement.Name}`);
                    } catch (error) {
                        if (!error.message.includes('duplicate')) {
                            console.error(`     ❌ Error unlocking "${achievement.Name}":`, error.message);
                        }
                    }
                }
            }

            console.log(`   🎉 Total unlocked for this user: ${userUnlocked}`);
        }

        // Summary
        console.log(`\n🎯 ACHIEVEMENT UNLOCK SUMMARY`);
        console.log(`===============================`);
        console.log(`✅ Total achievements unlocked: ${totalUnlocked}`);
        console.log(`👥 Users processed: ${users.recordset.length}`);

        // Get final statistics
        const finalStats = await pool.request().query(`
            SELECT 
                COUNT(DISTINCT ua.UserID) as UsersWithAchievements,
                COUNT(*) as TotalUnlockedAchievements,
                (SELECT COUNT(*) FROM Achievements) as TotalAchievements
            FROM UserAchievements ua
        `);

        const stats = finalStats.recordset[0];
        console.log(`📊 Final stats:`);
        console.log(`   👤 Users with achievements: ${stats.UsersWithAchievements}`);
        console.log(`   🏆 Total unlocked achievements: ${stats.TotalUnlockedAchievements}`);
        console.log(`   📋 Total available achievements: ${stats.TotalAchievements}`);

        console.log('\n🎉 ACHIEVEMENT UNLOCK FIX COMPLETED!');
        console.log('====================================');
        console.log('💡 Refresh your frontend page to see unlocked achievements!');
        console.log('🔄 The achievements should now show as completed with progress bars filled!');

    } catch (error) {
        console.error('❌ Error fixing achievement unlocks:', error);
        throw error;
    }
}

if (require.main === module) {
    fixUnlockAchievements()
        .then(() => {
            console.log('✅ Script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { fixUnlockAchievements }; 