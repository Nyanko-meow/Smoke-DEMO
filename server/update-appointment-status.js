const sql = require('mssql');

const config = {
    server: 'localhost',
    database: 'SMOKEKING',
    user: 'sa',
    password: 'dinhcapro123',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function updateAppointmentStatus() {
    try {
        console.log('🔗 Connecting to database...');
        await sql.connect(config);
        console.log('✅ Connected to database');

        // Update appointments to completed status
        const result = await sql.query`
            UPDATE ConsultationAppointments 
            SET Status = 'completed'
            WHERE Status IN ('confirmed', 'scheduled');
        `;

        console.log(`✅ Updated ${result.rowsAffected[0]} appointments to completed status`);

        // Check completed appointments
        const check = await sql.query`
            SELECT AppointmentID, Status, AppointmentDate, CoachID, MemberID
            FROM ConsultationAppointments 
            WHERE Status = 'completed'
            ORDER BY AppointmentDate DESC;
        `;

        console.log('📋 Completed appointments:');
        check.recordset.forEach(apt => {
            console.log(`- ID: ${apt.AppointmentID}, Date: ${apt.AppointmentDate}, Coach: ${apt.CoachID}, Member: ${apt.MemberID}`);
        });

        console.log('🎉 Now you can test the feedback feature!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
        console.log('🔌 Database connection closed');
    }
}

updateAppointmentStatus(); 