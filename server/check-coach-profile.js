const { pool, connectDB } = require('./src/config/database');

async function checkCoachProfile() {
    try {
        await connectDB();
        console.log('🔍 Checking CoachProfiles table...');

        const result = await pool.request()
            .input('UserID', 3)
            .query('SELECT * FROM CoachProfiles WHERE UserID = @UserID');

        console.log('Coach Profile for UserID 3:', result.recordset);

        if (result.recordset.length === 0) {
            console.log('📝 Creating CoachProfile for UserID 3...');
            await pool.request()
                .input('UserID', 3)
                .query(`
                    INSERT INTO CoachProfiles (
                        UserID, Bio, Specialization, Experience, HourlyRate, IsAvailable,
                        YearsOfExperience, Education, Certifications, Languages, WorkingHours
                    ) VALUES (
                        @UserID, 
                        N'Tôi là một coach chuyên nghiệp với nhiều năm kinh nghiệm hỗ trợ người cai thuốc lá. Tôi đã giúp hàng trăm người thành công trong hành trình cai thuốc của họ.',
                        N'Cai thuốc lá, Tư vấn sức khỏe tâm lý',
                        5,
                        100000,
                        1,
                        5,
                        N'Thạc sĩ Tâm lý học - Đại học Y Hà Nội',
                        N'Chứng chỉ tư vấn viên cai thuốc quốc tế, Chứng chỉ CBT (Cognitive Behavioral Therapy)',
                        N'Tiếng Việt, Tiếng Anh',
                        N'Thứ 2-6: 8:00-17:00, Thứ 7: 8:00-12:00'
                    )
                `);
            console.log('✅ CoachProfile created successfully!');
        } else {
            console.log('✅ CoachProfile already exists!');

            // Update IsAvailable to true to make sure coach is available for booking
            await pool.request()
                .input('UserID', 3)
                .query(`
                    UPDATE CoachProfiles 
                    SET IsAvailable = 1,
                        Bio = N'Tôi là một coach chuyên nghiệp với nhiều năm kinh nghiệm hỗ trợ người cai thuốc lá. Tôi đã giúp hàng trăm người thành công trong hành trình cai thuốc của họ.'
                    WHERE UserID = @UserID
                `);
            console.log('✅ CoachProfile updated to be available!');
        }

        // Now test the assigned coach query
        console.log('\n🧪 Testing assigned coach query for user 6...');
        const testResult = await pool.request()
            .input('UserID', 6)
            .query(`
                SELECT 
                    c.UserID as CoachID,
                    c.Email as CoachEmail,
                    c.FirstName as CoachFirstName,
                    c.LastName as CoachLastName,
                    c.Avatar as CoachAvatar,
                    c.PhoneNumber as CoachPhoneNumber,
                    cp.Bio,
                    cp.Specialization,
                    cp.Experience,
                    cp.HourlyRate,
                    cp.IsAvailable,
                    cp.YearsOfExperience,
                    cp.Education,
                    cp.Certifications,
                    cp.Languages,
                    cp.WorkingHours,
                    cp.ConsultationTypes,
                    qp.PlanID as QuitPlanID,
                    qp.StartDate as AssignmentDate,
                    qp.Status as QuitPlanStatus
                FROM QuitPlans qp
                INNER JOIN Users c ON qp.CoachID = c.UserID
                LEFT JOIN CoachProfiles cp ON c.UserID = cp.UserID
                WHERE qp.UserID = @UserID 
                    AND qp.Status = 'active'
                    AND qp.CoachID IS NOT NULL
                    AND c.Role = 'coach'
                    AND c.IsActive = 1
            `);

        console.log('📊 Query result:', testResult.recordset);

        if (testResult.recordset.length > 0) {
            console.log('🎉 SUCCESS! Coach assignment is working now!');
            const coach = testResult.recordset[0];
            console.log(`   Coach: ${coach.CoachFirstName} ${coach.CoachLastName}`);
            console.log(`   Available: ${coach.IsAvailable}`);
            console.log(`   Bio: ${coach.Bio?.substring(0, 50)}...`);
        } else {
            console.log('❌ Still no coach assignment found');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

if (require.main === module) {
    checkCoachProfile()
        .then(() => {
            console.log('\n✅ Check completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { checkCoachProfile }; 