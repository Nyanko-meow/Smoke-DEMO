const { pool, connectDB } = require('./src/config/database');

async function deleteSpecificAppointment() {
    try {
        await connectDB();
        console.log('🗑️  Deleting specific appointment (60 phút, video call)...');

        // Delete the appointment that matches the screenshot exactly
        // 60 phút, video call, với notes về chiến lược dài hạn
        const findResult = await pool.request()
            .input('MemberID', 6) // User Tran Huy
            .input('CoachID', 3)  // Coach Smith
            .query(`
                SELECT 
                    AppointmentID,
                    AppointmentDate,
                    Duration,
                    Type,
                    Status,
                    Notes,
                    CoachID,
                    MemberID
                FROM ConsultationAppointments
                WHERE MemberID = @MemberID 
                    AND CoachID = @CoachID
                    AND Duration = 60
                    AND Type = 'video'
                    AND Status = 'completed'
                ORDER BY AppointmentDate DESC
            `);

        console.log('📋 Found matching appointments:', findResult.recordset);

        if (findResult.recordset.length > 0) {
            const appointmentToDelete = findResult.recordset[0];
            const appointmentId = appointmentToDelete.AppointmentID;

            console.log(`🎯 Deleting appointment ID: ${appointmentId}`);
            console.log(`   Date: ${appointmentToDelete.AppointmentDate}`);
            console.log(`   Duration: ${appointmentToDelete.Duration} phút`);
            console.log(`   Type: ${appointmentToDelete.Type}`);
            console.log(`   Notes: ${appointmentToDelete.Notes}`);

            // Delete related feedback first (if any)
            const deleteFeedback = await pool.request()
                .input('AppointmentID', appointmentId)
                .query(`
                    DELETE FROM CoachFeedback 
                    WHERE AppointmentID = @AppointmentID
                `);

            console.log(`🗑️  Deleted ${deleteFeedback.rowsAffected[0]} feedback records`);

            // Delete the appointment
            const deleteResult = await pool.request()
                .input('AppointmentID', appointmentId)
                .query(`
                    DELETE FROM ConsultationAppointments 
                    WHERE AppointmentID = @AppointmentID
                `);

            console.log(`✅ Deleted ${deleteResult.rowsAffected[0]} appointment record`);

            // Check remaining appointments
            const remainingResult = await pool.request()
                .input('MemberID', 6)
                .input('CoachID', 3)
                .query(`
                    SELECT 
                        AppointmentID,
                        AppointmentDate,
                        Duration,
                        Type,
                        Status,
                        Notes
                    FROM ConsultationAppointments
                    WHERE MemberID = @MemberID AND CoachID = @CoachID
                    ORDER BY AppointmentDate DESC
                `);

            console.log('📊 Remaining appointments:');
            remainingResult.recordset.forEach(app => {
                console.log(`   - ID ${app.AppointmentID}: ${app.Duration}min ${app.Type} (${app.Status}) - ${app.Notes}`);
            });

        } else {
            console.log('❌ No matching appointment found to delete');
        }

    } catch (error) {
        console.error('❌ Error deleting appointment:', error);
    }
}

if (require.main === module) {
    deleteSpecificAppointment()
        .then(() => {
            console.log('\n✅ Deletion completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { deleteSpecificAppointment }; 