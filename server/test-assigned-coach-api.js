const { pool, connectDB } = require('./src/config/database');

async function testAssignedCoachAPI() {
    try {
        await connectDB();
        console.log('🧪 TESTING ASSIGNED COACH API FOR USER 6');
        console.log('='.repeat(50));

        const userId = 6; // Tran Huy

        // Test the exact query used by the API
        const result = await pool.request()
            .input('UserID', userId)
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
                    qp.Status as QuitPlanStatus,
                    (SELECT AVG(CAST(Rating AS FLOAT)) FROM CoachFeedback WHERE CoachID = c.UserID AND Status = 'active') as AverageRating,
                    (SELECT COUNT(*) FROM CoachFeedback WHERE CoachID = c.UserID AND Status = 'active') as ReviewCount
                FROM QuitPlans qp
                INNER JOIN Users c ON qp.CoachID = c.UserID
                LEFT JOIN CoachProfiles cp ON c.UserID = cp.UserID
                WHERE qp.UserID = @UserID 
                    AND qp.Status = 'active'
                    AND qp.CoachID IS NOT NULL
                    AND c.Role = 'coach'
                    AND c.IsActive = 1
            `);

        console.log('✅ SQL Query Result:');
        console.log(JSON.stringify(result.recordset, null, 2));

        if (result.recordset.length > 0) {
            console.log('\n🎯 EXPECTED API RESPONSE:');
            const coach = result.recordset[0];
            const apiResponse = {
                success: true,
                data: {
                    id: coach.CoachID,
                    fullName: `${coach.CoachFirstName} ${coach.CoachLastName}`,
                    email: coach.CoachEmail,
                    avatar: coach.CoachAvatar,
                    phoneNumber: coach.CoachPhoneNumber,
                    bio: coach.Bio,
                    specialization: coach.Specialization,
                    experience: coach.Experience,
                    hourlyRate: coach.HourlyRate,
                    isAvailable: coach.IsAvailable,
                    yearsOfExperience: coach.YearsOfExperience,
                    education: coach.Education,
                    certifications: coach.Certifications,
                    languages: coach.Languages,
                    workingHours: coach.WorkingHours,
                    consultationTypes: coach.ConsultationTypes,
                    quitPlanId: coach.QuitPlanID,
                    assignmentDate: coach.AssignmentDate,
                    quitPlanStatus: coach.QuitPlanStatus,
                    averageRating: coach.AverageRating || 0,
                    reviewCount: coach.ReviewCount || 0
                }
            };
            console.log(JSON.stringify(apiResponse, null, 2));
        } else {
            console.log('❌ No coach assigned!');
        }

        console.log('\n🌐 BROWSER DEBUG COMMANDS:');
        console.log('=====================================');
        console.log('1. Open browser DevTools (F12)');
        console.log('2. Go to Console tab');
        console.log('3. Run these commands one by one:');
        console.log('');
        console.log('// Clear storage');
        console.log('localStorage.clear()');
        console.log('sessionStorage.clear()');
        console.log('');
        console.log('// Check current token');
        console.log('console.log("Token:", localStorage.getItem("token"))');
        console.log('console.log("User:", localStorage.getItem("user"))');
        console.log('');
        console.log('// Test API call directly');
        console.log('fetch("http://localhost:4000/api/user/assigned-coach", {');
        console.log('  headers: {');
        console.log('    "Authorization": "Bearer " + localStorage.getItem("token"),');
        console.log('    "Content-Type": "application/json"');
        console.log('  }');
        console.log('}).then(r => r.json()).then(data => console.log("API Response:", data))');
        console.log('');
        console.log('// Refresh page');
        console.log('location.reload(true)');

    } catch (error) {
        console.error('❌ Error testing assigned coach API:', error);
    }
}

if (require.main === module) {
    testAssignedCoachAPI()
        .then(() => {
            console.log('\n✅ Test completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { testAssignedCoachAPI }; 