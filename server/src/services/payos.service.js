const { payOS, PAYOS_CONFIG } = require('../config/payos.config');
const { pool } = require('../config/database');

class PayOSService {
    async createPaymentLink(orderData) {
        try {
            console.log('🔄 Creating PayOS payment link with data:', orderData);
            const paymentLinkData = await payOS.createPaymentLink(orderData);
            console.log('✅ PayOS payment link created:', paymentLinkData);
            return paymentLinkData;
        } catch (error) {
            console.error('❌ PayOS createPaymentLink error:', error);
            throw error;
        }
    }

    async getPaymentInfo(orderCode) {
        try {
            console.log('🔍 Getting PayOS payment info for orderCode:', orderCode);
            const paymentInfo = await payOS.getPaymentLinkInformation(orderCode);
            return paymentInfo;
        } catch (error) {
            console.error('❌ PayOS getPaymentInfo error:', error);
            throw error;
        }
    }

    async cancelPaymentLink(orderCode, reason = null) {
        try {
            console.log('🚫 Cancelling PayOS payment link:', orderCode);
            const result = await payOS.cancelPaymentLink(orderCode, reason);
            return result;
        } catch (error) {
            console.error('❌ PayOS cancelPaymentLink error:', error);
            throw error;
        }
    }

    async verifyWebhookData(webhookBody) {
        try {
            console.log('🔐 Verifying PayOS webhook data:', webhookBody);
            const paymentData = payOS.verifyPaymentWebhookData(webhookBody);
            console.log('✅ Verified payment data:', paymentData);
            return paymentData;
        } catch (error) {
            console.error('❌ PayOS verifyWebhookData error:', error);
            throw error;
        }
    }

    async updatePaymentStatus(orderCode, status, paymentData = null) {
        try {
            console.log(`🔄 PayOS: Updating payment status for ${orderCode} to ${status}`);
            
            const transaction = pool.transaction();
            await transaction.begin();

            try {
                // Get payment and user info first
                const paymentInfo = await transaction.request()
                    .input('OrderCode', orderCode)
                    .query(`
                        SELECT p.*, u.FirstName, u.LastName, u.Email, u.UserID, mp.Name as PlanName, mp.Duration
                        FROM Payments p
                        JOIN Users u ON p.UserID = u.UserID
                        JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
                        WHERE p.TransactionID = @OrderCode
                    `);

                if (paymentInfo.recordset.length === 0) {
                    throw new Error(`Payment not found for orderCode: ${orderCode}`);
                }

                const payment = paymentInfo.recordset[0];
                console.log(`🎯 PayOS: Processing payment for user ${payment.Email}, plan ${payment.PlanName}`);

                // Update payment status to confirmed (for PayOS successful payments)
                const finalStatus = status === 'PAID' ? 'confirmed' : status;
                await transaction.request()
                    .input('OrderCode', orderCode)
                    .input('Status', finalStatus)
                    .input('PaymentData', paymentData ? JSON.stringify(paymentData) : null)
                    .query(`
                        UPDATE Payments 
                        SET Status = @Status, 
                            PaymentData = @PaymentData,
                            PaymentDate = CASE WHEN @Status = 'confirmed' THEN GETDATE() ELSE PaymentDate END
                        WHERE TransactionID = @OrderCode
                    `);

                console.log(`✅ PayOS: Payment status updated to ${finalStatus}`);

                // Auto-activate membership for successful PayOS payments
                if (finalStatus === 'confirmed') {
                    console.log('🚀 PayOS: Auto-activating membership (no admin approval needed)...');
                    
                    // Calculate membership dates
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + payment.Duration);

                    // Create or update active membership
                    await transaction.request()
                        .input('UserID', payment.UserID)
                        .input('PlanID', payment.PlanID)
                        .input('StartDate', startDate)
                        .input('EndDate', endDate)
                        .query(`
                            MERGE UserMemberships AS target
                            USING (SELECT @UserID AS UserID) AS source
                            ON target.UserID = source.UserID
                            WHEN MATCHED THEN
                                UPDATE SET
                                    PlanID = @PlanID,
                                    StartDate = @StartDate,
                                    EndDate = @EndDate,
                                    Status = 'active',
                                    UpdatedAt = GETDATE()
                            WHEN NOT MATCHED THEN
                                INSERT (UserID, PlanID, StartDate, EndDate, Status, CreatedAt, UpdatedAt)
                                VALUES (@UserID, @PlanID, @StartDate, @EndDate, 'active', GETDATE(), GETDATE());
                        `);

                    console.log(`✅ PayOS: Membership activated for user ${payment.Email}`);

                    // Create success notification for user (no admin notification needed)
                    await transaction.request()
                        .input('UserID', payment.UserID)
                        .input('Title', '🎉 Gói dịch vụ đã được kích hoạt!')
                        .input('Message', `Chúc mừng! Gói ${payment.PlanName} của bạn đã được thanh toán thành công qua PayOS và đã được kích hoạt ngay lập tức. Hãy bắt đầu hành trình cai thuốc của bạn!`)
                        .input('Type', 'membership_activated')
                        .query(`
                            INSERT INTO Notifications (UserID, Title, Message, Type, CreatedAt)
                            VALUES (@UserID, @Title, @Message, @Type, GETDATE())
                        `);

                    console.log(`✅ PayOS: Success notification sent to user ${payment.Email}`);
                }

                await transaction.commit();
                console.log('✅ PayOS: Transaction completed successfully');
                return true;
            } catch (error) {
                await transaction.rollback();
                console.error('❌ PayOS: Transaction rolled back due to error:', error);
                throw error;
            }
        } catch (error) {
            console.error('❌ PayOS: Update payment status error:', error);
            throw error;
        }
    }
}

module.exports = new PayOSService(); 