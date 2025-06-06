const { pool, connectDB } = require('./src/config/database');

async function debugCoachAssignment() {
    try {
        await connectDB();
        console.log('🔍 DEBUG COACH ASSIGNMENT AND FEEDBACK ISSUES');
        console.log('='.repeat(60));

        const userId = 6; // Member user ID - Tran Huy

        // 1. Check user info
        console.log('\n1. USER INFO:');
        const userResult = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT UserID, Email, FirstName, LastName, Role, IsActive 
                FROM Users 
                WHERE UserID = @UserID
            `);
        console.log(userResult.recordset[0]);

        // 2. Check all QuitPlans for this user
        console.log('\n2. ALL QUIT PLANS:');
        const allPlans = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    qp.PlanID,
                    qp.UserID,
                    qp.CoachID,
                    qp.Status,
                    qp.StartDate,
                    qp.CreatedAt,
                    c.Email as CoachEmail,
                    c.FirstName as CoachFirstName,
                    c.LastName as CoachLastName,
                    c.IsActive as CoachIsActive,
                    c.Role as CoachRole
                FROM QuitPlans qp
                LEFT JOIN Users c ON qp.CoachID = c.UserID
                WHERE qp.UserID = @UserID
                ORDER BY qp.CreatedAt DESC
            `);
        console.log('All Plans:', allPlans.recordset);

        // 3. Test assigned coach query
        console.log('\n3. ASSIGNED COACH QUERY TEST:');
        const assignedCoach = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    c.UserID as CoachID,
                    c.Email as CoachEmail,
                    c.FirstName as CoachFirstName,
                    c.LastName as CoachLastName,
                    c.Avatar as CoachAvatar,
                    qp.PlanID as QuitPlanID,
                    qp.Status as QuitPlanStatus
                FROM QuitPlans qp
                INNER JOIN Users c ON qp.CoachID = c.UserID
                WHERE qp.UserID = @UserID 
                    AND qp.Status = 'active'
                    AND qp.CoachID IS NOT NULL
                    AND c.Role = 'coach'
                    AND c.IsActive = 1
            `);
        console.log('Assigned Coach Query Result:', assignedCoach.recordset);

        // 4. Check completed appointments
        console.log('\n4. COMPLETED APPOINTMENTS:');
        const completedAppointments = await pool.request()
            .input('MemberID', userId)
            .query(`
                SELECT 
                    ca.AppointmentID,
                    ca.AppointmentDate,
                    ca.Status,
                    ca.CoachID,
                    c.FirstName + ' ' + c.LastName as CoachName
                FROM ConsultationAppointments ca
                INNER JOIN Users c ON ca.CoachID = c.UserID
                WHERE ca.MemberID = @MemberID 
                    AND ca.Status = 'completed'
                ORDER BY ca.AppointmentDate DESC
            `);
        console.log('Completed Appointments:', completedAppointments.recordset);

        // 5. Check existing feedback
        console.log('\n5. EXISTING FEEDBACK:');
        const existingFeedback = await pool.request()
            .input('MemberID', userId)
            .query(`
                SELECT 
                    cf.FeedbackID,
                    cf.AppointmentID,
                    cf.CoachID,
                    cf.Rating,
                    cf.Comment,
                    cf.CreatedAt
                FROM CoachFeedback cf
                WHERE cf.MemberID = @MemberID
                ORDER BY cf.CreatedAt DESC
            `);
        console.log('Existing Feedback:', existingFeedback.recordset);

        // 6. Check appointments needing feedback
        console.log('\n6. APPOINTMENTS NEEDING FEEDBACK:');
        const needsFeedback = await pool.request()
            .input('MemberID', userId)
            .query(`
                SELECT 
                    ca.AppointmentID as id,
                    ca.AppointmentDate as appointmentDate,
                    ca.Duration as duration,
                    ca.Type as type,
                    ca.Status as status,
                    ca.Notes as notes,
                    coach.UserID as coachId,
                    coach.FirstName as coachFirstName,
                    coach.LastName as coachLastName,
                    coach.Email as coachEmail,
                    coach.Avatar as coachAvatar

                FROM ConsultationAppointments ca
                INNER JOIN Users coach ON ca.CoachID = coach.UserID
                LEFT JOIN CoachFeedback cf ON ca.AppointmentID = cf.AppointmentID 
                    AND cf.MemberID = @MemberID
                WHERE ca.MemberID = @MemberID 
                    AND ca.Status = 'completed'
                    AND cf.FeedbackID IS NULL
                ORDER BY ca.AppointmentDate DESC
            `);
        console.log('Appointments Needing Feedback:', needsFeedback.recordset);

        console.log('\n' + '='.repeat(60));
        console.log('DEBUG SUMMARY:');
        console.log(`- User ID: ${userId}`);
        console.log(`- Total QuitPlans: ${allPlans.recordset.length}`);
        console.log(`- Active Coach Assignment: ${assignedCoach.recordset.length > 0 ? 'YES' : 'NO'}`);
        console.log(`- Completed Appointments: ${completedAppointments.recordset.length}`);
        console.log(`- Existing Feedback: ${existingFeedback.recordset.length}`);
        console.log(`- Appointments Needing Feedback: ${needsFeedback.recordset.length}`);

        // Fix data if needed
        if (assignedCoach.recordset.length === 0 && allPlans.recordset.length > 0) {
            console.log('\n🔧 FIXING COACH ASSIGNMENT...');

            // Get first available coach
            const availableCoach = await pool.request()
                .query(`
                    SELECT TOP 1 UserID 
                    FROM Users 
                    WHERE Role = 'coach' AND IsActive = 1
                `);

            if (availableCoach.recordset.length > 0) {
                const coachId = availableCoach.recordset[0].UserID;

                // Update or create active quit plan
                const planToUpdate = allPlans.recordset.find(p => p.Status === 'active') || allPlans.recordset[0];

                if (planToUpdate) {
                    await pool.request()
                        .input('PlanID', planToUpdate.PlanID)
                        .input('CoachID', coachId)
                        .query(`
                            UPDATE QuitPlans 
                            SET CoachID = @CoachID, Status = 'active'
                            WHERE PlanID = @PlanID
                        `);
                    console.log(`✅ Updated Plan ${planToUpdate.PlanID} with Coach ${coachId}`);
                } else {
                    // Create new quit plan
                    await pool.request()
                        .input('UserID', userId)
                        .input('CoachID', coachId)
                        .query(`
                            INSERT INTO QuitPlans (UserID, CoachID, StartDate, TargetDate, Reason, Status)
                            VALUES (@UserID, @CoachID, GETDATE(), DATEADD(month, 3, GETDATE()), N'Auto assigned by system', 'active')
                        `);
                    console.log(`✅ Created new QuitPlan for User ${userId} with Coach ${coachId}`);
                }
            }
        }

        // Create test completed appointment if none exists
        if (completedAppointments.recordset.length === 0) {
            console.log('\n🔧 CREATING TEST COMPLETED APPOINTMENT...');

            const coachId = assignedCoach.recordset[0]?.CoachID || 3; // Fallback to coach ID 3

            await pool.request()
                .input('CoachID', coachId)
                .input('MemberID', userId)
                .query(`
                    INSERT INTO ConsultationAppointments 
                    (CoachID, MemberID, AppointmentDate, Duration, Type, Status, Notes)
                    VALUES 
                    (@CoachID, @MemberID, DATEADD(day, -1, GETDATE()), 30, 'video', 'completed', N'Test appointment for feedback')
                `);
            console.log(`✅ Created test completed appointment`);
        }

    } catch (error) {
        console.error('❌ Debug error:', error);
    }
}

if (require.main === module) {
    debugCoachAssignment()
        .then(() => {
            console.log('\n✅ Debug completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { debugCoachAssignment }; 