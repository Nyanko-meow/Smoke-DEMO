const { pool, connectDB } = require('./src/config/database');

async function createCompletedAppointment() {
    try {
        // Connect to database first
        await connectDB();

        console.log('🔄 Creating completed appointment for testing feedback...');

        // First check if there's already a completed appointment
        const existingCheck = await pool.request()
            .query(`
                SELECT COUNT(*) as count 
                FROM ConsultationAppointments 
                WHERE Status = 'completed'
            `);

        if (existingCheck.recordset[0].count > 0) {
            console.log('✅ Already have completed appointments');
            return;
        }

        // Create a completed appointment
        const result = await pool.request()
            .query(`
                INSERT INTO ConsultationAppointments 
                (CoachID, MemberID, AppointmentDate, Duration, Type, Status, Notes, CreatedAt, UpdatedAt)
                VALUES 
                (3, 2, DATEADD(DAY, -1, GETDATE()), 30, 'video', 'completed', N'Tư vấn về kế hoạch cai thuốc', GETDATE(), GETDATE())
            `);

        console.log('✅ Created completed appointment for testing');

        // Create another one for variety
        await pool.request()
            .query(`
                INSERT INTO ConsultationAppointments 
                (CoachID, MemberID, AppointmentDate, Duration, Type, Status, Notes, CreatedAt, UpdatedAt)
                VALUES 
                (3, 2, DATEADD(DAY, -3, GETDATE()), 45, 'audio', 'completed', N'Tư vấn về động lực', GETDATE(), GETDATE())
            `);

        console.log('✅ Created second completed appointment');

    } catch (error) {
        console.error('❌ Error creating completed appointment:', error);
    }
}

// Run if called directly
if (require.main === module) {
    createCompletedAppointment()
        .then(() => {
            console.log('✅ Test completed appointments created successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { createCompletedAppointment }; 