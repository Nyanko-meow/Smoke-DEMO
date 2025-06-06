const { pool, connectDB } = require('./src/config/database');

async function fixFrontendIssues() {
    try {
        await connectDB();
        console.log('🔧 FIXING FRONTEND ISSUES');
        console.log('='.repeat(50));

        // 1. Verify database state
        console.log('\n1. 📊 CURRENT DATABASE STATE:');

        // Check user 6
        const userResult = await pool.request()
            .input('UserID', 6)
            .query(`
                SELECT UserID, Email, FirstName, LastName, Role, IsActive
                FROM Users 
                WHERE UserID = @UserID
            `);
        console.log('User 6:', userResult.recordset[0]);

        // Check QuitPlans for user 6
        const quitPlansResult = await pool.request()
            .input('UserID', 6)
            .query(`
                SELECT 
                    qp.PlanID,
                    qp.UserID,
                    qp.CoachID,
                    qp.Status,
                    qp.StartDate,
                    c.Email as CoachEmail,
                    c.FirstName as CoachFirstName,
                    c.LastName as CoachLastName,
                    c.IsActive as CoachIsActive
                FROM QuitPlans qp
                LEFT JOIN Users c ON qp.CoachID = c.UserID
                WHERE qp.UserID = @UserID
                ORDER BY qp.CreatedAt DESC
            `);
        console.log('QuitPlans for User 6:', quitPlansResult.recordset);

        // 2. Test the assigned coach API query directly
        console.log('\n2. 🧪 TESTING ASSIGNED COACH API QUERY:');
        const assignedCoachResult = await pool.request()
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

        if (assignedCoachResult.recordset.length > 0) {
            console.log('✅ API Query Result - Coach Found:');
            const coach = assignedCoachResult.recordset[0];
            console.log(`   Coach: ${coach.CoachFirstName} ${coach.CoachLastName}`);
            console.log(`   Email: ${coach.CoachEmail}`);
            console.log(`   QuitPlan ID: ${coach.QuitPlanID}`);
            console.log(`   QuitPlan Status: ${coach.QuitPlanStatus}`);
            console.log(`   IsAvailable: ${coach.IsAvailable}`);
        } else {
            console.log('❌ API Query Result - No Coach Found');

            // Debug why no coach found
            console.log('\n🔍 DEBUGGING WHY NO COACH FOUND:');

            const debugResult = await pool.request()
                .input('UserID', 6)
                .query(`
                    SELECT 
                        qp.PlanID,
                        qp.Status as QuitPlanStatus,
                        qp.CoachID,
                        c.UserID as CoachUserID,
                        c.Role as CoachRole,
                        c.IsActive as CoachIsActive,
                        cp.ProfileID as HasProfile
                    FROM QuitPlans qp
                    LEFT JOIN Users c ON qp.CoachID = c.UserID
                    LEFT JOIN CoachProfiles cp ON c.UserID = cp.UserID
                    WHERE qp.UserID = @UserID
                    ORDER BY qp.CreatedAt DESC
                `);

            console.log('Debug Results:');
            debugResult.recordset.forEach(row => {
                console.log(`   Plan ${row.PlanID}: Status=${row.QuitPlanStatus}, CoachID=${row.CoachID}, CoachRole=${row.CoachRole}, CoachActive=${row.CoachIsActive}, HasProfile=${row.HasProfile ? 'Yes' : 'No'}`);
            });

            // Fix: Make sure we have an active plan with coach
            console.log('\n🔧 FIXING: Ensure active plan with coach...');
            const activeCount = await pool.request()
                .input('UserID', 6)
                .query(`
                    SELECT COUNT(*) as count 
                    FROM QuitPlans 
                    WHERE UserID = @UserID AND Status = 'active' AND CoachID IS NOT NULL
                `);

            if (activeCount.recordset[0].count === 0) {
                console.log('🔧 Creating/Updating active plan with coach...');

                // Find the latest plan and update it
                const latestPlan = await pool.request()
                    .input('UserID', 6)
                    .query(`
                        SELECT TOP 1 PlanID 
                        FROM QuitPlans 
                        WHERE UserID = @UserID 
                        ORDER BY CreatedAt DESC
                    `);

                if (latestPlan.recordset.length > 0) {
                    await pool.request()
                        .input('PlanID', latestPlan.recordset[0].PlanID)
                        .input('CoachID', 3)
                        .query(`
                            UPDATE QuitPlans 
                            SET Status = 'active', CoachID = @CoachID 
                            WHERE PlanID = @PlanID
                        `);
                    console.log('✅ Updated latest plan to active with coach');
                }
            }
        }

        // 3. Generate a test token for debugging
        console.log('\n3. 🔑 GENERATING TEST TOKEN:');
        const jwt = require('jsonwebtoken');
        const testToken = jwt.sign(
            {
                id: 6,
                UserID: 6,
                email: 'leghenkiz@gmail.com',
                Role: 'member'
            },
            process.env.JWT_SECRET || 'smokeking_secret_key_ultra_secure_2024',
            { expiresIn: '24h' }
        );

        console.log('Test Token (copy this for browser):', testToken.substring(0, 50) + '...');

        // 4. Test API endpoint directly
        console.log('\n4. 🌐 API ENDPOINT TEST INSTRUCTIONS:');
        console.log('Open browser console and run:');
        console.log('');
        console.log('// Clear storage and set test token');
        console.log('localStorage.clear();');
        console.log('sessionStorage.clear();');
        console.log(`localStorage.setItem('token', '${testToken}');`);
        console.log(`localStorage.setItem('user', '${JSON.stringify({
            id: 6,
            email: 'leghenkiz@gmail.com',
            firstName: 'Tran',
            lastName: 'Huy',
            role: 'member'
        })}');`);
        console.log('');
        console.log('// Test API call');
        console.log('fetch("http://localhost:4000/api/user/assigned-coach", {');
        console.log('  headers: {');
        console.log('    "Authorization": "Bearer " + localStorage.getItem("token"),');
        console.log('    "Content-Type": "application/json"');
        console.log('  }');
        console.log('}).then(r => r.json()).then(data => console.log("API Response:", data))');
        console.log('');
        console.log('// Refresh page');
        console.log('location.reload();');

        // 5. Final verification
        console.log('\n5. ✅ FINAL VERIFICATION:');
        const finalCheck = await pool.request()
            .input('UserID', 6)
            .query(`
                SELECT 
                    c.FirstName + ' ' + c.LastName as CoachName,
                    qp.Status as PlanStatus,
                    qp.PlanID
                FROM QuitPlans qp
                INNER JOIN Users c ON qp.CoachID = c.UserID
                WHERE qp.UserID = @UserID 
                    AND qp.Status = 'active'
                    AND qp.CoachID IS NOT NULL
            `);

        if (finalCheck.recordset.length > 0) {
            const result = finalCheck.recordset[0];
            console.log(`✅ SUCCESS: User 6 has active coach assignment`);
            console.log(`   Coach: ${result.CoachName}`);
            console.log(`   Plan Status: ${result.PlanStatus}`);
            console.log(`   Plan ID: ${result.PlanID}`);
        } else {
            console.log('❌ STILL NO ACTIVE COACH ASSIGNMENT');
        }

    } catch (error) {
        console.error('❌ Error fixing frontend issues:', error);
    }
}

if (require.main === module) {
    fixFrontendIssues()
        .then(() => {
            console.log('\n✅ Fix attempt completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { fixFrontendIssues }; 