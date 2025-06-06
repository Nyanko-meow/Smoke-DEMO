const { pool } = require('./src/config/database');

async function addSampleProgressData() {
    try {
        console.log('🔗 Connecting to database...');

        // Insert sample progress data for member (UserID = 2)
        const progressData = [
            // Week 1 - Starting to quit, high cigarettes, high craving
            { date: '2024-01-15', cigarettes: 15, craving: 8, daysSmokeFree: 0, moneySaved: 0 },
            { date: '2024-01-16', cigarettes: 12, craving: 7, daysSmokeFree: 0, moneySaved: 45000 },
            { date: '2024-01-17', cigarettes: 10, craving: 8, daysSmokeFree: 0, moneySaved: 90000 },
            { date: '2024-01-18', cigarettes: 8, craving: 7, daysSmokeFree: 0, moneySaved: 135000 },
            { date: '2024-01-19', cigarettes: 6, craving: 6, daysSmokeFree: 0, moneySaved: 180000 },
            { date: '2024-01-20', cigarettes: 5, craving: 6, daysSmokeFree: 0, moneySaved: 225000 },
            { date: '2024-01-21', cigarettes: 4, craving: 5, daysSmokeFree: 0, moneySaved: 270000 },

            // Week 2 - Improvement, reducing cigarettes
            { date: '2024-01-22', cigarettes: 3, craving: 5, daysSmokeFree: 0, moneySaved: 315000 },
            { date: '2024-01-23', cigarettes: 2, craving: 4, daysSmokeFree: 0, moneySaved: 360000 },
            { date: '2024-01-24', cigarettes: 2, craving: 4, daysSmokeFree: 0, moneySaved: 405000 },
            { date: '2024-01-25', cigarettes: 1, craving: 3, daysSmokeFree: 0, moneySaved: 450000 },
            { date: '2024-01-26', cigarettes: 1, craving: 3, daysSmokeFree: 0, moneySaved: 495000 },
            { date: '2024-01-27', cigarettes: 0, craving: 2, daysSmokeFree: 1, moneySaved: 540000 },
            { date: '2024-01-28', cigarettes: 0, craving: 2, daysSmokeFree: 2, moneySaved: 585000 },

            // Week 3 - Progressing well
            { date: '2024-01-29', cigarettes: 0, craving: 1, daysSmokeFree: 3, moneySaved: 630000 },
            { date: '2024-01-30', cigarettes: 0, craving: 1, daysSmokeFree: 4, moneySaved: 675000 },
            { date: '2024-01-31', cigarettes: 0, craving: 2, daysSmokeFree: 5, moneySaved: 720000 },
            { date: '2024-02-01', cigarettes: 0, craving: 1, daysSmokeFree: 6, moneySaved: 765000 },
            { date: '2024-02-02', cigarettes: 0, craving: 1, daysSmokeFree: 7, moneySaved: 810000 },
            { date: '2024-02-03', cigarettes: 0, craving: 2, daysSmokeFree: 8, moneySaved: 855000 },
            { date: '2024-02-04', cigarettes: 0, craving: 1, daysSmokeFree: 9, moneySaved: 900000 },

            // Week 4 - Recent data for analysis (last 7 days)
            { date: '2024-02-05', cigarettes: 0, craving: 1, daysSmokeFree: 10, moneySaved: 945000 },
            { date: '2024-02-06', cigarettes: 0, craving: 2, daysSmokeFree: 11, moneySaved: 990000 },
            { date: '2024-02-07', cigarettes: 0, craving: 1, daysSmokeFree: 12, moneySaved: 1035000 },
            { date: '2024-02-08', cigarettes: 0, craving: 1, daysSmokeFree: 13, moneySaved: 1080000 },
            { date: '2024-02-09', cigarettes: 0, craving: 2, daysSmokeFree: 14, moneySaved: 1125000 },
            { date: '2024-02-10', cigarettes: 0, craving: 1, daysSmokeFree: 15, moneySaved: 1170000 },
            { date: '2024-02-11', cigarettes: 0, craving: 1, daysSmokeFree: 16, moneySaved: 1215000 }
        ];

        console.log('📊 Inserting progress tracking data...');

        for (const data of progressData) {
            await pool.request()
                .input('UserID', 2) // Member user
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

        // Add smoking status for the member
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

        // Add quit plan
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

        // Add some achievements
        console.log('🏆 Adding achievements...');
        const achievements = [1, 2]; // First day and first week achievements

        for (const achievementId of achievements) {
            await pool.request()
                .input('UserID', 2)
                .input('AchievementID', achievementId)
                .input('EarnedAt', achievementId === 1 ? '2024-01-27' : '2024-02-02')
                .query(`
                    INSERT INTO UserAchievements (UserID, AchievementID, EarnedAt)
                    VALUES (@UserID, @AchievementID, @EarnedAt)
                `);
        }

        console.log('✅ Sample progress data added successfully!');
        console.log('📝 Data summary:');
        console.log(`   - ${progressData.length} progress entries`);
        console.log('   - 1 smoking status record');
        console.log('   - 1 quit plan');
        console.log('   - 2 achievements');
        console.log('\n🎯 This member should show "đang tiến triển" status based on the recent data');

    } catch (error) {
        console.error('❌ Error adding sample data:', error);
    }
}

// Add sample data for a member with stagnating progress
async function addStagnatingMemberData() {
    try {
        console.log('📊 Adding stagnating member data...');

        // Data shows no improvement - member stuck at 5-6 cigarettes per day
        const stagnatingData = [
            { date: '2024-02-05', cigarettes: 6, craving: 6, daysSmokeFree: 0, moneySaved: 200000 },
            { date: '2024-02-06', cigarettes: 5, craving: 5, daysSmokeFree: 0, moneySaved: 245000 },
            { date: '2024-02-07', cigarettes: 6, craving: 6, daysSmokeFree: 0, moneySaved: 290000 },
            { date: '2024-02-08', cigarettes: 5, craving: 5, daysSmokeFree: 0, moneySaved: 335000 },
            { date: '2024-02-09', cigarettes: 6, craving: 6, daysSmokeFree: 0, moneySaved: 380000 },
            { date: '2024-02-10', cigarettes: 5, craving: 5, daysSmokeFree: 0, moneySaved: 425000 },
            { date: '2024-02-11', cigarettes: 6, craving: 6, daysSmokeFree: 0, moneySaved: 470000 }
        ];

        // Check if guest user exists (UserID = 1), if not use member
        const userResult = await pool.request()
            .query('SELECT UserID FROM Users WHERE Role = \'guest\' ORDER BY UserID');

        const targetUserID = userResult.recordset.length > 0 ? userResult.recordset[0].UserID : 4;

        for (const data of stagnatingData) {
            await pool.request()
                .input('UserID', targetUserID)
                .input('Date', data.date)
                .input('CigarettesSmoked', data.cigarettes)
                .input('CravingLevel', data.craving)
                .input('DaysSmokeFree', data.daysSmokeFree)
                .input('MoneySaved', data.moneySaved)
                .input('EmotionNotes', 'Cảm thấy khó khăn trong việc giảm thêm')
                .input('HealthNotes', 'Chưa thấy cải thiện đáng kể')
                .query(`
                    INSERT INTO ProgressTracking 
                    (UserID, Date, CigarettesSmoked, CravingLevel, DaysSmokeFree, MoneySaved, EmotionNotes, HealthNotes)
                    VALUES (@UserID, @Date, @CigarettesSmoked, @CravingLevel, @DaysSmokeFree, @MoneySaved, @EmotionNotes, @HealthNotes)
                `);
        }

        console.log(`✅ Added stagnating data for UserID: ${targetUserID}`);
        console.log('🎯 This member should show "chững lại" status');

    } catch (error) {
        console.error('❌ Error adding stagnating data:', error);
    }
}

// Run the script
async function main() {
    console.log('🚀 Adding Sample Progress Data for Member Details Testing');
    console.log('========================================================\n');

    await addSampleProgressData();
    console.log('\n');
    await addStagnatingMemberData();

    console.log('\n🎉 All sample data added! You can now test the member details endpoint.');
    console.log('🧪 Run: node test-member-details.js');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { addSampleProgressData, addStagnatingMemberData }; 