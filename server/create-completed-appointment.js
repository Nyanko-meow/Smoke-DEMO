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

async function createCompletedAppointment() {
    try {
        console.log('🔗 Connecting to database...');
        await sql.connect(config);
        console.log('✅ Connected to database');

        // Insert a completed appointment
        const result = await sql.query`
            INSERT INTO ConsultationAppointments (CoachID, MemberID, AppointmentDate, Duration, Type, Status, Notes)
            VALUES (3, 2, DATEADD(day, -1, GETDATE()), 30, 'chat', 'completed', N'Buổi tư vấn đã hoàn thành - Test feedback');
        `;

        console.log('✅ Created completed appointment for testing');

        // Check all appointments
        const check = await sql.query`
            SELECT ca.AppointmentID, ca.Status, ca.AppointmentDate, ca.Duration, ca.Type,
                   u1.FirstName + ' ' + u1.LastName as CoachName,
                   u2.FirstName + ' ' + u2.LastName as MemberName
            FROM ConsultationAppointments ca
            LEFT JOIN Users u1 ON ca.CoachID = u1.UserID
            LEFT JOIN Users u2 ON ca.MemberID = u2.UserID
            ORDER BY ca.AppointmentDate DESC;
        `;

        console.log('📋 All appointments:');
        check.recordset.forEach(apt => {
            console.log(`- ID: ${apt.AppointmentID}, Status: ${apt.Status}, Coach: ${apt.CoachName}, Member: ${apt.MemberName}, Date: ${apt.AppointmentDate}`);
        });

        console.log('🎉 Now refresh the page and you should see the feedback button!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
        console.log('🔌 Database connection closed');
    }
}

createCompletedAppointment(); 