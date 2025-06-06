const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'sa',
    server: 'DESKTOP-615IDKR\\SQLEXPRESS',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function fixChatAndAppointments() {
    try {
        console.log('🔄 Connecting to database...');
        await sql.connect(config);
        console.log('✅ Connected to database');

        // 1. Update passwords to plain text
        console.log('\n1. Updating passwords to plain text...');
        await sql.query`
            UPDATE Users 
            SET Password = '12345678'
            WHERE UserID IN (1, 2, 3, 4)
        `;
        console.log('✅ Passwords updated');

        // 2. Check existing conversations
        console.log('\n2. Checking existing conversations...');
        const conversations = await sql.query`
            SELECT ConversationID, CoachID, MemberID, LastMessageAt
            FROM Conversations
        `;
        console.log(`📊 Found ${conversations.recordset.length} conversations`);

        // 3. Create conversation between coach and member if not exists
        console.log('\n3. Ensuring conversation exists between coach and member...');
        const existingConv = await sql.query`
            SELECT ConversationID FROM Conversations 
            WHERE CoachID = 3 AND MemberID = 2
        `;

        let conversationId;
        if (existingConv.recordset.length === 0) {
            const newConv = await sql.query`
                INSERT INTO Conversations (CoachID, MemberID, LastMessageAt, IsActive)
                OUTPUT INSERTED.ConversationID
                VALUES (3, 2, GETDATE(), 1)
            `;
            conversationId = newConv.recordset[0].ConversationID;
            console.log(`✅ Created new conversation: ${conversationId}`);
        } else {
            conversationId = existingConv.recordset[0].ConversationID;
            console.log(`✅ Using existing conversation: ${conversationId}`);
        }

        // 4. Add sample messages if none exist
        console.log('\n4. Checking and adding sample messages...');
        const existingMessages = await sql.query`
            SELECT COUNT(*) as count FROM Messages 
            WHERE (SenderID = 2 AND ReceiverID = 3) OR (SenderID = 3 AND ReceiverID = 2)
        `;

        if (existingMessages.recordset[0].count === 0) {
            console.log('Adding sample messages...');

            // Coach welcome message
            await sql.query`
                INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
                VALUES (3, 2, N'Xin chào! Tôi là Coach Smith, tôi sẽ hỗ trợ bạn trong quá trình cai thuốc. Bạn cảm thấy thế nào về kế hoạch hiện tại?', 'text', 0)
            `;

            // Member response
            await sql.query`
                INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
                VALUES (2, 3, N'Chào coach! Em cảm thấy còn khó khăn trong việc kiểm soát cơn thèm thuốc. Em có thể nhờ coach tư vấn thêm không ạ?', 'text', 1)
            `;

            // Coach advice
            await sql.query`
                INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
                VALUES (3, 2, N'Tất nhiên rồi! Cơn thèm thuốc là điều bình thường trong giai đoạn đầu. Hãy thử uống nước lạnh và tập thở sâu khi có cơn thèm nhé!', 'text', 0)
            `;

            console.log('✅ Added sample messages');
        } else {
            console.log(`✅ Found ${existingMessages.recordset[0].count} existing messages`);
        }

        // 5. Check appointments and add notification messages
        console.log('\n5. Checking appointments and notifications...');
        const appointments = await sql.query`
            SELECT AppointmentID, CoachID, MemberID, AppointmentDate, Status, CreatedAt
            FROM ConsultationAppointments
            WHERE Status = 'scheduled'
        `;

        console.log(`📊 Found ${appointments.recordset.length} scheduled appointments`);

        for (const appointment of appointments.recordset) {
            // Check if notification message exists
            const notificationExists = await sql.query`
                SELECT COUNT(*) as count FROM Messages 
                WHERE MessageType = 'plan_update' 
                AND RelatedPlanID = ${appointment.AppointmentID}
            `;

            if (notificationExists.recordset[0].count === 0) {
                // Create notification message
                const appointmentDate = new Date(appointment.AppointmentDate);
                const content = `📅 Lịch hẹn tư vấn đã được tạo cho ${appointmentDate.toLocaleString('vi-VN')}`;

                await sql.query`
                    INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, RelatedPlanID, IsRead)
                    VALUES (${appointment.CoachID}, ${appointment.MemberID}, ${content}, 'plan_update', ${appointment.AppointmentID}, 0)
                `;

                console.log(`✅ Added notification for appointment ${appointment.AppointmentID}`);
            }
        }

        // 6. Update conversation with latest message
        console.log('\n6. Updating conversation with latest message...');
        const latestMessage = await sql.query`
            SELECT TOP 1 MessageID, CreatedAt FROM Messages 
            WHERE (SenderID = 2 AND ReceiverID = 3) OR (SenderID = 3 AND ReceiverID = 2)
            ORDER BY CreatedAt DESC
        `;

        if (latestMessage.recordset.length > 0) {
            await sql.query`
                UPDATE Conversations 
                SET LastMessageID = ${latestMessage.recordset[0].MessageID}, 
                    LastMessageAt = '${latestMessage.recordset[0].CreatedAt}'
                WHERE ConversationID = ${conversationId}
            `;
            console.log('✅ Updated conversation with latest message');
        }

        // 7. Verify the fix
        console.log('\n7. Verifying the fix...');

        // Check users
        const users = await sql.query`
            SELECT UserID, Email, Password, Role FROM Users WHERE UserID IN (2, 3)
        `;
        console.log('\n👥 Users:');
        users.recordset.forEach(user => {
            console.log(`- ${user.Email} (${user.Role}): password = ${user.Password}`);
        });

        // Check messages
        const messages = await sql.query`
            SELECT 
                m.MessageID, m.SenderID, m.ReceiverID, m.Content, m.MessageType, m.CreatedAt,
                sender.FirstName + ' ' + sender.LastName as SenderName
            FROM Messages m
            INNER JOIN Users sender ON m.SenderID = sender.UserID
            WHERE (m.SenderID = 2 AND m.ReceiverID = 3) OR (m.SenderID = 3 AND m.ReceiverID = 2)
            ORDER BY m.CreatedAt ASC
        `;

        console.log(`\n💬 Messages (${messages.recordset.length} total):`);
        messages.recordset.forEach(msg => {
            const type = msg.MessageType === 'plan_update' ? '📅' : '💬';
            console.log(`${type} ${msg.SenderName}: ${msg.Content.substring(0, 50)}...`);
        });

        // Check appointments
        const allAppointments = await sql.query`
            SELECT AppointmentID, AppointmentDate, Status, Notes FROM ConsultationAppointments
        `;

        console.log(`\n📅 Appointments (${allAppointments.recordset.length} total):`);
        allAppointments.recordset.forEach(apt => {
            console.log(`- ID ${apt.AppointmentID}: ${new Date(apt.AppointmentDate).toLocaleString('vi-VN')} (${apt.Status})`);
        });

        console.log('\n🎉 Chat and appointments fix completed successfully!');
        console.log('\n📋 Summary:');
        console.log('✅ Passwords updated to plain text (12345678)');
        console.log('✅ Conversation between coach and member ensured');
        console.log('✅ Sample messages added');
        console.log('✅ Appointment notifications created');
        console.log('✅ Database is ready for frontend testing');

        console.log('\n🔑 Login credentials:');
        console.log('- Member: member@example.com / 12345678');
        console.log('- Coach: coach@example.com / 12345678');

    } catch (error) {
        console.error('❌ Error fixing chat and appointments:', error);
    } finally {
        await sql.close();
        console.log('🔌 Database connection closed');
    }
}

fixChatAndAppointments(); 