const sql = require('mssql');

async function createTestPayment() {
    try {
        console.log('🔧 Creating test payment for cancellation testing...');

        // Connect to database
        await sql.connect({
            user: 'sa',
            password: 'YourPassword123!',
            server: 'localhost',
            database: 'SMOKEKING',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        });

        // First, set all existing payments to rejected to clear the slate
        console.log('🗑️ Clearing existing active payments...');
        await sql.query`
            UPDATE Payments 
            SET Status = 'rejected' 
            WHERE UserID = 6 AND Status IN ('pending', 'confirmed')
        `;

        // Create a new confirmed payment for testing cancellation
        console.log('➕ Creating new test payment...');
        const insertResult = await sql.query`
            INSERT INTO Payments (UserID, PlanID, Amount, PaymentMethod, Status, PaymentDate, StartDate, EndDate)
            OUTPUT INSERTED.PaymentID
            VALUES (6, 2, 199000, 'BankTransfer', 'confirmed', GETDATE(), GETDATE(), DATEADD(DAY, 60, GETDATE()))
        `;

        const newPaymentId = insertResult.recordset[0].PaymentID;
        console.log(`✅ Created payment with ID: ${newPaymentId}`);

        // Create corresponding UserMemberships record
        console.log('👤 Creating UserMemberships record...');
        await sql.query`
            INSERT INTO UserMemberships (UserID, PlanID, Status, StartDate, EndDate)
            VALUES (6, 2, 'active', GETDATE(), DATEADD(DAY, 60, GETDATE()))
        `;

        // Update user role to member
        console.log('🔄 Updating user role to member...');
        await sql.query`
            UPDATE Users 
            SET Role = 'member' 
            WHERE UserID = 6
        `;

        console.log('🎉 Test payment setup completed successfully!');
        console.log('📋 You can now test cancellation with bank information');

    } catch (error) {
        console.error('❌ Error creating test payment:', error);
    } finally {
        await sql.close();
    }
}

// Run the setup
createTestPayment(); 