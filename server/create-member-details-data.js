const { pool } = require('./src/config/database');

async function createMemberDetailsData() {
    console.log('🚀 Creating Member Details Test Data');
    console.log('===================================\n');

    try {
        console.log('🔍 Checking existing data...');

        // Check if we have users
        const usersCheck = await pool.request().query('SELECT COUNT(*) as count FROM Users');
        console.log(`Found ${usersCheck.recordset[0].count} users`);

        // Check for member user (ID = 2)
        const memberCheck = await pool.request()
            .query("SELECT * FROM Users WHERE UserID = 2 AND Role = 'member'");

        if (memberCheck.recordset.length === 0) {
            console.log('❌ Member user (ID=2) not found');
            return;
        }

        const member = memberCheck.recordset[0];
        console.log(`✅ Found member: ${member.FirstName} ${member.LastName} (${member.Email})`);

        // Clear existing test data for this user
        console.log('\n🧹 Clearing existing test data...');
        await pool.request()
            .input('UserID', 2)
            .query('DELETE FROM UserAchievements WHERE UserID = @UserID');

        await pool.request()
            .input('UserID', 2)
            .query('DELETE FROM ProgressTracking WHERE UserID = @UserID');

        await pool.request()
            .input('UserID', 2)
            .query('DELETE FROM QuitPlans WHERE UserID = @UserID');

        await pool.request()
            .input('UserID', 2)
            .query('DELETE FROM SmokingStatus WHERE UserID = @UserID');

        // 1. Add smoking status
        console.log('🚬 Adding smoking status...');
        await pool.request()
            .input('UserID', 2)
            .input('CigarettesPerDay', 20)
            .input('CigarettePrice', 45000)
            .input('SmokingFrequency', 'Hàng ngày, đặc biệt sau bữa ăn và khi stress')
            .query(`
                INSERT INTO SmokingStatus (UserID, CigarettesPerDay, CigarettePrice, SmokingFrequency)
                VALUES (@UserID, @CigarettesPerDay, @CigarettePrice, @SmokingFrequency)
            `);

        // 2. Add quit plan
        console.log('📋 Adding quit plan...');
        await pool.request()
            .input('UserID', 2)
            .input('StartDate', '2024-01-15')
            .input('TargetDate', '2024-03-15')
            .input('Reason', 'Muốn có sức khỏe tốt hơn cho gia đình và tiết kiệm tiền')
            .input('MotivationLevel', 8)
            .input('DetailedPlan', 'Giảm dần số lượng điếu mỗi ngày, thay thế bằng kẹo cao su và tập thể dục')
            .input('Status', 'active')
            .input('CoachID', 3)
            .query(`
                INSERT INTO QuitPlans (UserID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status, CoachID)
                VALUES (@UserID, @StartDate, @TargetDate, @Reason, @MotivationLevel, @DetailedPlan, @Status, @CoachID)
            `);

        // 3. Add progress data (last 14 days for analysis)
        console.log('📊 Adding progress data...');
        const progressData = [
            // Recent 7 days (good progress)
            { date: '2024-02-11', cigarettes: 0, craving: 1, daysSmokeFree: 16, moneySaved: 1215000 },
            { date: '2024-02-10', cigarettes: 0, craving: 1, daysSmokeFree: 15, moneySaved: 1170000 },
            { date: '2024-02-09', cigarettes: 0, craving: 2, daysSmokeFree: 14, moneySaved: 1125000 },
            { date: '2024-02-08', cigarettes: 0, craving: 1, daysSmokeFree: 13, moneySaved: 1080000 },
            { date: '2024-02-07', cigarettes: 0, craving: 1, daysSmokeFree: 12, moneySaved: 1035000 },
            { date: '2024-02-06', cigarettes: 0, craving: 2, daysSmokeFree: 11, moneySaved: 990000 },
            { date: '2024-02-05', cigarettes: 0, craving: 1, daysSmokeFree: 10, moneySaved: 945000 },

            // Previous 7 days (for comparison - worse performance)
            { date: '2024-02-04', cigarettes: 1, craving: 3, daysSmokeFree: 9, moneySaved: 900000 },
            { date: '2024-02-03', cigarettes: 1, craving: 2, daysSmokeFree: 8, moneySaved: 855000 },
            { date: '2024-02-02', cigarettes: 0, craving: 1, daysSmokeFree: 7, moneySaved: 810000 },
            { date: '2024-02-01', cigarettes: 2, craving: 4, daysSmokeFree: 6, moneySaved: 765000 },
            { date: '2024-01-31', cigarettes: 3, craving: 5, daysSmokeFree: 5, moneySaved: 720000 },
            { date: '2024-01-30', cigarettes: 2, craving: 3, daysSmokeFree: 4, moneySaved: 675000 },
            { date: '2024-01-29', cigarettes: 4, craving: 6, daysSmokeFree: 3, moneySaved: 630000 }
        ];

        for (const data of progressData) {
            await pool.request()
                .input('UserID', 2)
                .input('Date', data.date)
                .input('CigarettesSmoked', data.cigarettes)
                .input('CravingLevel', data.craving)
                .input('DaysSmokeFree', data.daysSmokeFree)
                .input('MoneySaved', data.moneySaved)
                .input('EmotionNotes', data.cigarettes === 0 ? 'Cảm thấy tự tin và khỏe mạnh' : 'Vẫn còn thèm thuốc nhưng đang cố gắng')
                .input('HealthNotes', data.daysSmokeFree > 0 ? 'Hơi thở thơm hơn, ngủ ngon hơn' : 'Bắt đầu cảm thấy khác biệt')
                .query(`
                    INSERT INTO ProgressTracking 
                    (UserID, Date, CigarettesSmoked, CravingLevel, DaysSmokeFree, MoneySaved, EmotionNotes, HealthNotes)
                    VALUES (@UserID, @Date, @CigarettesSmoked, @CravingLevel, @DaysSmokeFree, @MoneySaved, @EmotionNotes, @HealthNotes)
                `);
        }

        // 4. Add achievements
        console.log('🏆 Adding achievements...');
        const achievements = [
            { id: 1, date: '2024-01-27' }, // First day
            { id: 2, date: '2024-02-02' }  // First week
        ];

        for (const achievement of achievements) {
            await pool.request()
                .input('UserID', 2)
                .input('AchievementID', achievement.id)
                .input('EarnedAt', achievement.date)
                .query(`
                    INSERT INTO UserAchievements (UserID, AchievementID, EarnedAt)
                    VALUES (@UserID, @AchievementID, @EarnedAt)
                `);
        }

        console.log('\n✅ Sample data created successfully!');
        console.log('📝 Summary:');
        console.log(`   - 1 smoking status record`);
        console.log(`   - 1 quit plan`);
        console.log(`   - ${progressData.length} progress entries`);
        console.log(`   - ${achievements.length} achievements`);
        console.log('\n🎯 Member should show "đang tiến triển" status (recent avg: 0.0 cigarettes/day)');
        console.log('\n🧪 Test with: node quick-test-member-details.js');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    createMemberDetailsData().catch(console.error);
}

module.exports = { createMemberDetailsData }; 