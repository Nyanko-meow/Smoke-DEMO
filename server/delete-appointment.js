const { pool, connectDB } = require('./src/config/database');

async function deleteAppointment() {
    try {
        await connectDB();
        console.log('🗑️  Deleting appointment...');

        // First, let's find the appointment based on the details shown
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
                    AND Status = 'completed'
                    AND CAST(AppointmentDate AS DATE) = '2025-05-28'
                ORDER BY AppointmentDate DESC
            `);

        console.log('📋 Found appointments:', findResult.recordset);

        if (findResult.recordset.length > 0) {
            // Delete the appointment that matches the screenshot (likely the latest one)
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

            // Verify deletion
            const verifyResult = await pool.request()
                .input('MemberID', 6)
                .input('CoachID', 3)
                .query(`
                    SELECT COUNT(*) as remainingCount
                    FROM ConsultationAppointments
                    WHERE MemberID = @MemberID AND CoachID = @CoachID
                `);

            console.log(`📊 Remaining appointments for this user-coach pair: ${verifyResult.recordset[0].remainingCount}`);

        } else {
            console.log('❌ No matching appointment found to delete');
        }

    } catch (error) {
        console.error('❌ Error deleting appointment:', error);
    }
}

if (require.main === module) {
    deleteAppointment()
        .then(() => {
            console.log('\n✅ Deletion completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { deleteAppointment }; 