const { pool, connectDB } = require('./src/config/database');

async function fixAchievements() {
    try {
        console.log('🔓 FIXING ACHIEVEMENTS');
        console.log('=====================\n');

        // Connect to database
        await connectDB();
        console.log('✅ Database connected\n');

        // Get all users with their progress
        const users = await pool.request().query(`
            SELECT DISTINCT u.UserID, u.Email, u.FirstName, u.LastName
            FROM Users u
            WHERE u.Role IN ('member', 'guest') 
            AND u.IsActive = 1
        `);

        console.log(`Found ${users.recordset.length} users\n`);

        let totalUnlocked = 0;

        for (const user of users.recordset) {
            console.log(`Checking user: ${user.Email}`);

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
            console.log(`  Progress: ${progressData.DaysSmokeFree} days, ${progressData.TotalMoneySaved} VND`);

            // If no progress, create basic entry
            if (progressData.ProgressEntries === 0) {
                console.log('  Creating basic progress entry...');

                await pool.request()
                    .input('UserID', user.UserID)
                    .input('Date', new Date().toISOString().split('T')[0])
                    .input('DaysSmokeFree', 1)
                    .input('MoneySaved', 50000)
                    .input('CigarettesSmoked', 0)
                    .input('CravingLevel', 5)
                    .query(`
                        INSERT INTO ProgressTracking (UserID, Date, DaysSmokeFree, MoneySaved, CigarettesSmoked, CravingLevel, CreatedAt)
                        VALUES (@UserID, @Date, @DaysSmokeFree, @MoneySaved, @CigarettesSmoked, @CravingLevel, GETDATE())
                    `);

                progressData.DaysSmokeFree = 1;
                progressData.TotalMoneySaved = 50000;
                console.log('  ✅ Basic progress created');
            }

            // Get achievements user doesn't have
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

        console.log(`\n🎉 COMPLETED!`);
        console.log(`Total achievements unlocked: ${totalUnlocked}`);
        console.log('💡 Refresh your browser to see the changes!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

fixAchievements(); 