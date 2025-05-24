const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '12345',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'SMOKEKING',
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true' || false,
        trustServerCertificate: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

async function fixAchievementLogic() {
    let pool = null;

    try {
        console.log('🔧 Fixing Achievement Logic Issues...\n');

        // Create new connection
        console.log('🔌 Connecting to database...');
        pool = new sql.ConnectionPool(dbConfig);
        await pool.connect();
        console.log('✅ Database connected successfully!');

        // 1. Find user với 1 ngày không hút thuốc
        console.log('\n1. 🔍 Finding users with smoke-free progress...');
        const usersWithProgress = await pool.request().query(`
            SELECT 
                u.UserID, 
                u.FirstName, 
                u.LastName,
                COUNT(CASE WHEN pt.CigarettesSmoked = 0 THEN 1 END) as SmokeFreeDays,
                MAX(pt.DaysSmokeFree) as MaxDaysSmokeFree,
                MIN(pt.Date) as FirstProgressDate,
                MAX(pt.Date) as LastProgressDate,
                (SELECT COUNT(*) FROM UserAchievements WHERE UserID = u.UserID) as CurrentAchievements
            FROM Users u
            LEFT JOIN ProgressTracking pt ON u.UserID = pt.UserID
            WHERE u.Role IN ('member', 'guest')
            GROUP BY u.UserID, u.FirstName, u.LastName
            HAVING COUNT(CASE WHEN pt.CigarettesSmoked = 0 THEN 1 END) > 0
            ORDER BY SmokeFreeDays DESC
        `);

        console.log(`📊 Found ${usersWithProgress.recordset.length} users with smoke-free progress:`);
        usersWithProgress.recordset.forEach(user => {
            console.log(`   - ${user.FirstName} ${user.LastName}: ${user.SmokeFreeDays} smoke-free days, ${user.CurrentAchievements} achievements`);
        });

        // 2. Fix Achievement Logic in AchievementService
        console.log('\n2. 🔧 Checking achievement eligibility logic...');

        for (const user of usersWithProgress.recordset) {
            if (user.SmokeFreeDays >= 1) {
                console.log(`\n🎯 Checking achievements for ${user.FirstName} ${user.LastName}...`);

                // Simulate the improved achievement checking logic
                const achievements = await checkUserAchievements(pool, user.UserID);
                console.log(`   Results: ${achievements.newAchievements.length} new achievements`);

                if (achievements.newAchievements.length > 0) {
                    console.log('   New achievements awarded:');
                    achievements.newAchievements.forEach(ach => {
                        console.log(`   ✅ ${ach.Name}`);
                    });
                }
            }
        }

        // 3. Create test progress entry for demonstration
        console.log('\n3. 🧪 Creating test progress entry...');
        const testUser = usersWithProgress.recordset[0];

        if (testUser) {
            const today = new Date().toISOString().split('T')[0];

            await pool.request()
                .input('UserID', testUser.UserID)
                .input('Date', today)
                .input('CigarettesSmoked', 0)
                .input('CravingLevel', 5)
                .input('EmotionNotes', 'Test entry for achievement checking')
                .input('MoneySaved', 50000)
                .input('DaysSmokeFree', 1)
                .query(`
                    MERGE INTO ProgressTracking AS target
                    USING (SELECT @UserID AS UserID, @Date AS Date) AS source
                    ON target.UserID = source.UserID AND target.Date = source.Date
                    WHEN MATCHED THEN
                        UPDATE SET
                            CigarettesSmoked = @CigarettesSmoked,
                            CravingLevel = @CravingLevel,
                            EmotionNotes = @EmotionNotes,
                            MoneySaved = @MoneySaved,
                            DaysSmokeFree = @DaysSmokeFree
                    WHEN NOT MATCHED THEN
                        INSERT (UserID, Date, CigarettesSmoked, CravingLevel, EmotionNotes, MoneySaved, DaysSmokeFree)
                        VALUES (@UserID, @Date, @CigarettesSmoked, @CravingLevel, @EmotionNotes, @MoneySaved, @DaysSmokeFree);
                `);

            console.log(`✅ Created/Updated progress entry for ${testUser.FirstName}`);

            // Check achievements again
            const newCheck = await checkUserAchievements(pool, testUser.UserID);
            console.log(`🏆 Achievement check result: ${newCheck.newAchievements.length} new achievements`);
        }

        console.log('\n✅ Achievement logic fix completed successfully!');
        console.log('💡 Recommendations:');
        console.log('   1. Frontend should call /api/achievements/check after loading achievement page');
        console.log('   2. Progress tracking should trigger achievement check automatically');
        console.log('   3. Consider running achievement check daily via cron job');

    } catch (error) {
        console.error('❌ Error fixing achievement logic:', error);
        throw error;
    } finally {
        if (pool) {
            try {
                await pool.close();
                console.log('🔌 Database connection closed');
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
}

// Improved achievement checking logic
async function checkUserAchievements(pool, userId) {
    try {
        // Get user's progress data with correct logic
        const progressResult = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    COUNT(CASE WHEN CigarettesSmoked = 0 THEN 1 END) as SmokeFreeDays,
                    COALESCE(SUM(MoneySaved), 0) as TotalMoneySaved,
                    COUNT(*) as ProgressEntries,
                    MIN(Date) as FirstEntry,
                    MAX(Date) as LastEntry
                FROM ProgressTracking 
                WHERE UserID = @UserID
            `);

        const progressData = progressResult.recordset[0] || {
            SmokeFreeDays: 0,
            TotalMoneySaved: 0,
            ProgressEntries: 0
        };

        // Get user's membership plan
        const planResult = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT TOP 1 mp.Name
                FROM UserMemberships um
                JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                WHERE um.UserID = @UserID 
                AND um.Status = 'active'
                AND um.EndDate > GETDATE()
                ORDER BY um.EndDate DESC
            `);

        const userPlan = planResult.recordset.length > 0
            ? planResult.recordset[0].Name.toLowerCase().replace(' plan', '')
            : 'basic'; // Default to basic if no plan

        // Get available achievements
        const achievementsResult = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT a.*
                FROM Achievements a
                WHERE a.IsActive = 1
                AND a.AchievementID NOT IN (
                    SELECT AchievementID 
                    FROM UserAchievements 
                    WHERE UserID = @UserID
                )
                ORDER BY a.Category, a.Difficulty
            `);

        const newAchievements = [];

        for (const achievement of achievementsResult.recordset) {
            let isEligible = true;

            // Check plan requirement
            if (achievement.RequiredPlan && achievement.RequiredPlan !== userPlan) {
                isEligible = false;
            }

            // Check milestone days (use SmokeFreeDays instead of DaysSinceQuitStart)
            if (achievement.MilestoneDays !== null && isEligible) {
                if (progressData.SmokeFreeDays < achievement.MilestoneDays) {
                    isEligible = false;
                }
            }

            // Check saved money
            if (achievement.SavedMoney !== null && isEligible) {
                if (progressData.TotalMoneySaved < achievement.SavedMoney) {
                    isEligible = false;
                }
            }

            // Award achievement if eligible
            if (isEligible) {
                await pool.request()
                    .input('UserID', userId)
                    .input('AchievementID', achievement.AchievementID)
                    .query(`
                        INSERT INTO UserAchievements (UserID, AchievementID, EarnedAt)
                        VALUES (@UserID, @AchievementID, GETDATE())
                    `);

                newAchievements.push(achievement);
            }
        }

        return {
            success: true,
            newAchievements,
            progressData,
            userPlan
        };

    } catch (error) {
        console.error('Error checking achievements:', error);
        return {
            success: false,
            newAchievements: [],
            error: error.message
        };
    }
}

if (require.main === module) {
    fixAchievementLogic()
        .then(() => {
            console.log('✅ Script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { fixAchievementLogic, checkUserAchievements }; 