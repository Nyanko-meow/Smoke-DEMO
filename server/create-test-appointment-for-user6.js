const { pool, connectDB } = require('./src/config/database');

async function createTestAppointmentForUser6() {
    try {
        await connectDB();
        console.log('🔄 Creating test completed appointment for User 6 (Tran Huy)...');

        const userId = 6; // Tran Huy
        const coachId = 3; // Coach Smith

        // Create a new completed appointment
        const result = await pool.request()
            .input('CoachID', coachId)
            .input('MemberID', userId)
            .query(`
                INSERT INTO ConsultationAppointments 
                (CoachID, MemberID, AppointmentDate, Duration, Type, Status, Notes, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.AppointmentID, INSERTED.AppointmentDate, INSERTED.Status
                VALUES 
                (@CoachID, @MemberID, DATEADD(day, -2, GETDATE()), 60, 'video', 'completed', N'Tư vấn về chiến lược dài hạn cai thuốc', GETDATE(), GETDATE())
            `);

        const newAppointment = result.recordset[0];
        console.log('✅ Created test appointment:', newAppointment);

        // Check that it appears in feedback query
        console.log('\n🔍 Checking appointments needing feedback...');
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
                    coach.Email as coachEmail

                FROM ConsultationAppointments ca
                INNER JOIN Users coach ON ca.CoachID = coach.UserID
                LEFT JOIN CoachFeedback cf ON ca.AppointmentID = cf.AppointmentID 
                    AND cf.MemberID = @MemberID
                WHERE ca.MemberID = @MemberID 
                    AND ca.Status = 'completed'
                    AND cf.FeedbackID IS NULL
                ORDER BY ca.AppointmentDate DESC
            `);

        console.log(`✅ Found ${needsFeedback.recordset.length} appointments needing feedback:`);
        needsFeedback.recordset.forEach(apt => {
            console.log(`   - ID: ${apt.id}, Date: ${apt.appointmentDate}, Coach: ${apt.coachFirstName} ${apt.coachLastName}`);
        });

    } catch (error) {
        console.error('❌ Error creating test appointment:', error);
    }
}

if (require.main === module) {
    createTestAppointmentForUser6()
        .then(() => {
            console.log('\n✅ Test appointment creation completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { createTestAppointmentForUser6 }; 