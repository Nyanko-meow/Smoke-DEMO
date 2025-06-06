const { pool, connectDB } = require('./src/config/database');

async function fixCompletedAppointments() {
    try {
        await connectDB();
        console.log('🔧 FIXING COMPLETED APPOINTMENTS FOR FEEDBACK');
        console.log('='.repeat(60));

        const userId = 6; // Tran Huy

        // 1. Check all appointments for user 6
        console.log('\n1. 📊 ALL APPOINTMENTS FOR USER 6:');
        const allAppointments = await pool.request()
            .input('MemberID', userId)
            .query(`
                SELECT 
                    ca.AppointmentID,
                    ca.AppointmentDate,
                    ca.Duration,
                    ca.Type,
                    ca.Status,
                    ca.Notes,
                    ca.CoachID,
                    c.FirstName + ' ' + c.LastName as CoachName
                FROM ConsultationAppointments ca
                LEFT JOIN Users c ON ca.CoachID = c.UserID
                WHERE ca.MemberID = @MemberID
                ORDER BY ca.AppointmentDate DESC
            `);

        console.log(`Found ${allAppointments.recordset.length} appointments:`);
        allAppointments.recordset.forEach(apt => {
            console.log(`   - ID ${apt.AppointmentID}: ${apt.Status} | ${apt.Duration}min ${apt.Type} | Coach: ${apt.CoachName} | Date: ${apt.AppointmentDate}`);
        });

        // 2. Check specifically completed appointments
        console.log('\n2. ✅ COMPLETED APPOINTMENTS:');
        const completedAppointments = await pool.request()
            .input('MemberID', userId)
            .query(`
                SELECT 
                    ca.AppointmentID,
                    ca.AppointmentDate,
                    ca.Duration,
                    ca.Type,
                    ca.Status,
                    ca.Notes,
                    ca.CoachID,
                    c.FirstName + ' ' + c.LastName as CoachName
                FROM ConsultationAppointments ca
                LEFT JOIN Users c ON ca.CoachID = c.UserID
                WHERE ca.MemberID = @MemberID AND ca.Status = 'completed'
                ORDER BY ca.AppointmentDate DESC
            `);

        console.log(`Found ${completedAppointments.recordset.length} completed appointments:`);
        completedAppointments.recordset.forEach(apt => {
            console.log(`   - ID ${apt.AppointmentID}: ${apt.Duration}min ${apt.Type} | Coach: ${apt.CoachName} | Date: ${apt.AppointmentDate}`);
        });

        // 3. Test the exact API query used by frontend
        console.log('\n3. 🧪 TESTING API QUERY (appointments/completed):');
        const apiResult = await pool.request()
            .input('MemberID', userId)
            .query(`
                SELECT 
                    ca.AppointmentID as id,
                    ca.AppointmentDate as appointmentDate,
                    ca.Duration as duration,
                    ca.Type as type,
                    ca.Status as status,
                    ca.Notes as notes,
                    ca.MeetingLink as meetingLink,
                    ca.CreatedAt as createdAt,
                    ca.UpdatedAt as updatedAt,
                    
                    -- Coach info
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

        console.log(`API query result: ${apiResult.recordset.length} appointments needing feedback`);
        apiResult.recordset.forEach(apt => {
            console.log(`   - ID ${apt.id}: ${apt.duration}min ${apt.type} | Coach: ${apt.coachFirstName} ${apt.coachLastName} | Date: ${apt.appointmentDate}`);
        });

        // 4. If no completed appointments, create one
        if (completedAppointments.recordset.length === 0) {
            console.log('\n4. 🔧 CREATING COMPLETED APPOINTMENT FOR TESTING:');

            const createResult = await pool.request()
                .input('CoachID', 3) // Coach Smith
                .input('MemberID', userId)
                .query(`
                    INSERT INTO ConsultationAppointments 
                    (CoachID, MemberID, AppointmentDate, Duration, Type, Status, Notes, CreatedAt, UpdatedAt)
                    OUTPUT INSERTED.AppointmentID
                    VALUES 
                    (@CoachID, @MemberID, DATEADD(day, -1, GETDATE()), 60, 'video', 'completed', 
                     N'Buổi tư vấn hoàn thành - cần feedback', GETDATE(), GETDATE())
                `);

            const newAppointmentId = createResult.recordset[0].AppointmentID;
            console.log(`✅ Created completed appointment ID: ${newAppointmentId}`);

            // Test API query again
            console.log('\n🔄 RETESTING API QUERY:');
            const retestResult = await pool.request()
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

            console.log(`✅ After creating: ${retestResult.recordset.length} appointments available for feedback`);
        }

        // 5. Update any existing appointments to completed status if needed
        if (allAppointments.recordset.length > 0 && completedAppointments.recordset.length === 0) {
            console.log('\n5. 🔄 UPDATING EXISTING APPOINTMENT TO COMPLETED:');

            const latestAppointment = allAppointments.recordset[0];
            await pool.request()
                .input('AppointmentID', latestAppointment.AppointmentID)
                .query(`
                    UPDATE ConsultationAppointments 
                    SET Status = 'completed', 
                        Notes = N'Đã hoàn thành - cần feedback',
                        UpdatedAt = GETDATE()
                    WHERE AppointmentID = @AppointmentID
                `);

            console.log(`✅ Updated appointment ID ${latestAppointment.AppointmentID} to completed status`);
        }

        // 6. Generate test token for API testing
        console.log('\n6. 🔑 TEST TOKEN FOR BROWSER:');
        const jwt = require('jsonwebtoken');
        const testToken = jwt.sign(
            {
                id: userId,
                UserID: userId,
                email: 'leghenkiz@gmail.com',
                Role: 'member'
            },
            process.env.JWT_SECRET || 'smokeking_secret_key_ultra_secure_2024',
            { expiresIn: '24h' }
        );

        console.log('Test Token:', testToken.substring(0, 50) + '...');

        // 7. API test instructions
        console.log('\n7. 🌐 BROWSER TEST COMMANDS:');
        console.log('Open browser console and run:');
        console.log('');
        console.log('// Set token and user');
        console.log(`localStorage.setItem('token', '${testToken}');`);
        console.log(`localStorage.setItem('user', '${JSON.stringify({
            id: userId,
            email: 'leghenkiz@gmail.com',
            firstName: 'Tran',
            lastName: 'Huy',
            role: 'member'
        })}');`);
        console.log('');
        console.log('// Test completed appointments API');
        console.log('fetch("http://localhost:4000/api/chat/appointments/completed", {');
        console.log('  headers: {');
        console.log('    "Authorization": "Bearer " + localStorage.getItem("token"),');
        console.log('    "Content-Type": "application/json"');
        console.log('  }');
        console.log('}).then(r => r.json()).then(data => console.log("Completed Appointments:", data))');
        console.log('');
        console.log('// Refresh page');
        console.log('location.reload();');

        console.log('\n✅ COMPLETED APPOINTMENTS FIX COMPLETED!');

    } catch (error) {
        console.error('❌ Error fixing completed appointments:', error);
    }
}

if (require.main === module) {
    fixCompletedAppointments()
        .then(() => {
            console.log('\n✅ Fix completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { fixCompletedAppointments }; 