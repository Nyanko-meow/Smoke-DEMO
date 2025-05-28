const sql = require('mssql');

const dbConfig = {
    user: 'sa',
    password: 'H12345678',
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function createDirectAppointment() {
    try {
        console.log('🧪 Creating appointment directly in database...\n');

        // Connect to database
        console.log('1️⃣ Connecting to database...');
        const pool = await sql.connect(dbConfig);
        console.log('✅ Database connected');

        // Check existing appointments
        console.log('\n2️⃣ Checking existing appointments...');
        const existingResult = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM ConsultationAppointments 
            WHERE Status = 'scheduled'
        `);
        console.log('📊 Existing scheduled appointments:', existingResult.recordset[0].count);

        // Create new appointment
        console.log('\n3️⃣ Creating new appointment...');
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 1); // Tomorrow
        appointmentDate.setHours(14, 0, 0, 0); // 2:00 PM

        const insertResult = await pool.request()
            .input('coachId', 3) // Coach UserID
            .input('memberId', 2) // Member UserID  
            .input('appointmentDate', appointmentDate)
            .input('type', 'video')
            .input('notes', 'Test appointment for cancellation testing')
            .query(`
                INSERT INTO ConsultationAppointments 
                (CoachID, MemberID, AppointmentDate, Duration, Type, Status, Notes, CreatedAt, UpdatedAt)
                VALUES (@coachId, @memberId, @appointmentDate, 30, @type, 'scheduled', @notes, GETDATE(), GETDATE());
                
                SELECT SCOPE_IDENTITY() as AppointmentID;
            `);

        const appointmentId = insertResult.recordset[0].AppointmentID;
        console.log('✅ Appointment created with ID:', appointmentId);

        // Verify appointment
        console.log('\n4️⃣ Verifying appointment...');
        const verifyResult = await pool.request()
            .input('appointmentId', appointmentId)
            .query(`
                SELECT 
                    ca.AppointmentID,
                    ca.Status,
                    ca.AppointmentDate,
                    ca.Type,
                    ca.Notes,
                    coach.FirstName + ' ' + coach.LastName as CoachName,
                    member.FirstName + ' ' + member.LastName as MemberName
                FROM ConsultationAppointments ca
                INNER JOIN Users coach ON ca.CoachID = coach.UserID
                INNER JOIN Users member ON ca.MemberID = member.UserID
                WHERE ca.AppointmentID = @appointmentId
            `);

        if (verifyResult.recordset.length > 0) {
            const appointment = verifyResult.recordset[0];
            console.log('✅ Appointment verified:', {
                id: appointment.AppointmentID,
                status: appointment.Status,
                date: appointment.AppointmentDate,
                type: appointment.Type,
                coach: appointment.CoachName,
                member: appointment.MemberName,
                notes: appointment.Notes
            });
        }

        // Close connection
        await pool.close();
        console.log('\n🎉 Test appointment created successfully!');
        console.log('💡 You can now test cancellation with appointment ID:', appointmentId);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.originalError) {
            console.error('❌ SQL Error:', error.originalError.message);
        }
    }
}

createDirectAppointment(); 