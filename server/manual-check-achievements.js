const { pool, connectDB } = require('./src/config/database');
const AchievementService = require('./src/services/achievementService');

async function manualCheckAchievements() {
    try {
        console.log('🔍 MANUAL ACHIEVEMENT CHECK');
        console.log('===========================\n');

        // Connect to database
        console.log('1. 🔌 Connecting to database...');
        await connectDB();
        await pool.request().query('SELECT 1 as test');
        console.log('✅ Database connected\n');

        // Get all users
        console.log('2. 👥 Getting users...');
        const users = await pool.request().query(`
            SELECT UserID, Email, FirstName, LastName, Role
            FROM Users 
            WHERE Role IN ('member', 'guest') 
            AND IsActive = 1
            ORDER BY UserID
        `);

        console.log(`✅ Found ${users.recordset.length} users\n`);

        // List users for selection
        console.log('📋 Available users:');
        users.recordset.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.Email} (${user.FirstName} ${user.LastName}) - ID: ${user.UserID}`);
        });

        // For now, let's check for the first user or you can specify a specific user ID
        const targetUserId = users.recordset.length > 0 ? users.recordset[0].UserID : null;

        if (!targetUserId) {
            console.log('❌ No users found to check achievements for');
            return;
        }

        console.log(`\n3. 🏆 Checking achievements for User ID: ${targetUserId}...`);

        // Get current user progress data
        console.log('\n📊 Current user data:');

        // Progress data
        const progressResult = await pool.request()
            .input('UserID', targetUserId)
            .query(`
                SELECT 
                    COALESCE(MAX(DaysSmokeFree), 0) as DaysSmokeFree,
                    COALESCE(SUM(MoneySaved), 0) as TotalMoneySaved,
                    COUNT(*) as ProgressEntries
                FROM ProgressTracking 
                WHERE UserID = @UserID
            `);

        const progress = progressResult.recordset[0];
        console.log(`   📈 Days smoke-free: ${progress.DaysSmokeFree}`);
        console.log(`   💰 Money saved: ${progress.TotalMoneySaved} VNĐ`);
        console.log(`   📝 Progress entries: ${progress.ProgressEntries}`);

        // Membership data
        const membershipResult = await pool.request()
            .input('UserID', targetUserId)
            .query(`
                SELECT TOP 1 mp.Name as PlanName
                FROM UserMemberships um
                JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                WHERE um.UserID = @UserID 
                AND um.Status = 'active'
                AND um.EndDate > GETDATE()
                ORDER BY um.EndDate DESC
            `);

        const membership = membershipResult.recordset[0];
        console.log(`   🎯 Membership plan: ${membership ? membership.PlanName : 'None'}`);

        // Current achievements
        const currentAchievements = await pool.request()
            .input('UserID', targetUserId)
            .query(`
                SELECT COUNT(*) as count
                FROM UserAchievements
                WHERE UserID = @UserID
            `);

        console.log(`   🏅 Current achievements: ${currentAchievements.recordset[0].count}`);

        // Now run the achievement check
        console.log('\n4. 🚀 Running achievement check...');
        const result = await AchievementService.checkAndAwardAchievements(targetUserId);

        if (result.success) {
            console.log(`\n✅ Achievement check completed!`);
            console.log(`   🏆 New achievements awarded: ${result.newAchievements.length}`);

            if (result.newAchievements.length > 0) {
                console.log(`\n🎉 New achievements:`);
                result.newAchievements.forEach((ach, index) => {
                    console.log(`   ${index + 1}. ${ach.Name} - ${ach.Description}`);
                });
            }

            console.log(`\n📝 Message: ${result.message}`);
        } else {
            console.log(`❌ Achievement check failed`);
        }

        // Show final achievement count
        const finalAchievements = await pool.request()
            .input('UserID', targetUserId)
            .query(`
                SELECT COUNT(*) as count
                FROM UserAchievements
                WHERE UserID = @UserID
            `);

        console.log(`\n📊 Final achievement count: ${finalAchievements.recordset[0].count}`);

        // If no progress data, create some test data
        if (progress.ProgressEntries === 0) {
            console.log('\n⚠️  No progress data found. Creating test data...');

            // Create test progress entries
            const testEntries = [
                { days: 1, money: 50000 },
                { days: 7, money: 350000 },
                { days: 30, money: 1500000 },
            ];

            for (const entry of testEntries) {
                await pool.request()
                    .input('UserID', targetUserId)
                    .input('Date', new Date())
                    .input('DaysSmokeFree', entry.days)
                    .input('MoneySaved', entry.money)
                    .input('CigarettesSmoked', 0)
                    .input('CravingLevel', 3)
                    .query(`
                        INSERT INTO ProgressTracking (UserID, Date, DaysSmokeFree, MoneySaved, CigarettesSmoked, CravingLevel, CreatedAt)
                        VALUES (@UserID, @Date, @DaysSmokeFree, @MoneySaved, @CigarettesSmoked, @CravingLevel, GETDATE())
                    `);
            }

            console.log('✅ Test progress data created');

            // Run achievement check again
            console.log('\n🔄 Running achievement check again with test data...');
            const result2 = await AchievementService.checkAndAwardAchievements(targetUserId);

            if (result2.newAchievements.length > 0) {
                console.log(`\n🎉 Additional achievements with test data:`);
                result2.newAchievements.forEach((ach, index) => {
                    console.log(`   ${index + 1}. ${ach.Name} - ${ach.Description}`);
                });
            }
        }

        console.log('\n🎯 MANUAL CHECK COMPLETED!');
        console.log('==========================');
        console.log('💡 If achievements were awarded, refresh your frontend page to see them!');

    } catch (error) {
        console.error('❌ Error in manual achievement check:', error);
    }
}

if (require.main === module) {
    manualCheckAchievements()
        .then(() => {
            console.log('✅ Script completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { manualCheckAchievements }; 