const { pool } = require('./src/config/database');

async function resetAchievements() {
    try {
        console.log('🔄 RESETTING ALL ACHIEVEMENTS');
        console.log('==============================\n');

        // 1. Clear all user achievements
        console.log('1. 🗑️ Clearing all user achievements...');
        const deleteResult = await pool.request().query('DELETE FROM UserAchievements');
        console.log(`   ✅ Cleared ${deleteResult.rowsAffected[0]} user achievements`);

        // 2. Show current user progress to verify what should be unlocked
        console.log('\n2. 📊 Current user progress:');
        const usersResult = await pool.request().query(`
            SELECT u.UserID, u.Email, u.FirstName
            FROM Users u 
            WHERE u.Role IN ('member', 'guest') 
            AND u.IsActive = 1
        `);

        for (const user of usersResult.recordset) {
            console.log(`\n   👤 User: ${user.Email}`);

            const progressResult = await pool.request()
                .input('UserID', user.UserID)
                .query(`
                    SELECT 
                        COUNT(CASE WHEN CigarettesSmoked = 0 THEN 1 END) as SmokeFreeDays,
                        COALESCE(SUM(MoneySaved), 0) as TotalMoneySaved,
                        COUNT(*) as ProgressEntries
                    FROM ProgressTracking 
                    WHERE UserID = @UserID
                `);

            const progress = progressResult.recordset[0];
            console.log(`      📈 Progress: ${progress.SmokeFreeDays} smoke-free days, ${progress.TotalMoneySaved} VND saved, ${progress.ProgressEntries} entries`);

            // Check which achievements they SHOULD have based on actual progress
            const achievementsResult = await pool.request().query(`
                SELECT AchievementID, Name, MilestoneDays, SavedMoney
                FROM Achievements 
                WHERE IsActive = 1
                ORDER BY AchievementID
            `);

            const shouldHave = [];
            for (const ach of achievementsResult.recordset) {
                let eligible = false;

                if (ach.MilestoneDays !== null) {
                    if (progress.SmokeFreeDays >= ach.MilestoneDays) {
                        eligible = true;
                    }
                }

                if (ach.SavedMoney !== null) {
                    if (progress.TotalMoneySaved >= ach.SavedMoney) {
                        eligible = true;
                    }
                }

                if (eligible) {
                    shouldHave.push(ach.Name);
                }
            }

            if (shouldHave.length > 0) {
                console.log(`      🎯 Should have: ${shouldHave.join(', ')}`);
            } else {
                console.log(`      ❌ Should have: None (needs more progress)`);
            }
        }

        console.log('\n🎉 RESET COMPLETE!');
        console.log('==================');
        console.log('✨ All user achievements have been cleared');
        console.log('💡 Users will need to use "Kiểm tra huy hiệu" button to unlock achievements they qualify for');
        console.log('🔍 Only achievements with sufficient progress will be unlocked');

    } catch (error) {
        console.error('❌ Error resetting achievements:', error);
        throw error;
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

if (require.main === module) {
    resetAchievements()
        .then(() => {
            console.log('\n✅ Script completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = resetAchievements; 