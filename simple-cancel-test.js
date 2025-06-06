const sql = require('mssql');

const config = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function directCancelMembership() {
    try {
        console.log('🔧 Direct Database Cancel Membership Test\n');

        // Connect to database
        await sql.connect(config);
        console.log('✅ Connected to database');

        // Find user's latest payment
        const userEmail = 'leghenkiz@gmail.com';

        // Get user ID
        const userResult = await sql.query`
            SELECT UserID FROM Users WHERE Email = ${userEmail}
        `;

        if (userResult.recordset.length === 0) {
            console.error('❌ User not found');
            return;
        }

        const userId = userResult.recordset[0].UserID;
        console.log('👤 User ID:', userId);

        // Get latest confirmed payment
        const paymentResult = await sql.query`
            SELECT TOP 1 PaymentID, Amount, Status 
            FROM Payments 
            WHERE UserID = ${userId} AND Status = 'confirmed'
            ORDER BY PaymentDate DESC
        `;

        if (paymentResult.recordset.length === 0) {
            console.error('❌ No confirmed payment found');
            return;
        }

        const payment = paymentResult.recordset[0];
        console.log('💰 Found payment:', payment);

        const refundAmount = payment.Amount * 0.5;
        console.log('💸 Calculated refund amount:', refundAmount);

        // Start transaction
        const transaction = new sql.Transaction();
        await transaction.begin();

        try {
            // 1. Update Payment status to 'rejected'
            await transaction.request()
                .input('PaymentID', payment.PaymentID)
                .query(`UPDATE Payments SET Status = 'rejected' WHERE PaymentID = @PaymentID`);

            console.log('✅ Updated Payment status to rejected');

            // 2. Update UserMemberships status to 'cancelled'
            await transaction.request()
                .input('UserID', userId)
                .query(`UPDATE UserMemberships SET Status = 'cancelled' WHERE UserID = @UserID AND Status = 'active'`);

            console.log('✅ Updated UserMemberships status to cancelled');

            // Commit transaction (skip refund record creation for now)
            await transaction.commit();
            console.log('🎉 Cancellation completed successfully!');

            // Show final status
            const finalStatus = await sql.query`
                SELECT 
                    p.PaymentID, p.Status as PaymentStatus,
                    um.Status as MembershipStatus,
                    r.RefundID, r.RefundAmount
                FROM Payments p
                LEFT JOIN UserMemberships um ON p.UserID = um.UserID
                LEFT JOIN Refunds r ON r.UserID = p.UserID
                WHERE p.PaymentID = ${payment.PaymentID}
            `;

            console.log('\n📊 Final Status:', finalStatus.recordset[0]);

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

// Run the test
directCancelMembership(); 