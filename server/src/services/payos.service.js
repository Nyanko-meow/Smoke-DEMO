const payOS = require('../config/payos.config');
const { pool } = require('../config/database');

class PayOSService {
    async createPaymentLink(orderData) {
        try {
            const paymentLinkData = await payOS.createPaymentLink(orderData);
            return paymentLinkData;
        } catch (error) {
            console.error('PayOS createPaymentLink error:', error);
            throw error;
        }
    }

    async getPaymentInfo(orderCode) {
        try {
            const paymentInfo = await payOS.getPaymentLinkInformation(orderCode);
            return paymentInfo;
        } catch (error) {
            console.error('PayOS getPaymentInfo error:', error);
            throw error;
        }
    }

    async cancelPaymentLink(orderCode, reason = null) {
        try {
            const result = await payOS.cancelPaymentLink(orderCode, reason);
            return result;
        } catch (error) {
            console.error('PayOS cancelPaymentLink error:', error);
            throw error;
        }
    }

    async verifyWebhookData(webhookBody) {
        try {
            const paymentData = payOS.verifyPaymentWebhookData(webhookBody);
            return paymentData;
        } catch (error) {
            console.error('PayOS verifyWebhookData error:', error);
            throw error;
        }
    }

    // Update payment status in database
    async updatePaymentStatus(orderCode, status, paymentData = null) {
        try {
            const transaction = pool.transaction();
            await transaction.begin();

            // Update payment status
            await transaction.request()
                .input('OrderCode', orderCode)
                .input('Status', status)
                .input('PaymentData', paymentData ? JSON.stringify(paymentData) : null)
                .query(`
                    UPDATE Payments 
                    SET Status = @Status, 
                        PaymentData = @PaymentData,
                        UpdatedAt = GETDATE()
                    WHERE TransactionID = @OrderCode
                `);

            // If payment successful, update membership
            if (status === 'PAID') {
                await transaction.request()
                    .input('OrderCode', orderCode)
                    .query(`
                        UPDATE UserMemberships 
                        SET Status = 'active'
                        WHERE UserID IN (
                            SELECT UserID FROM Payments WHERE TransactionID = @OrderCode
                        )
                    `);
            }

            await transaction.commit();
            return true;
        } catch (error) {
            console.error('Update payment status error:', error);
            throw error;
        }
    }
}

module.exports = new PayOSService(); 