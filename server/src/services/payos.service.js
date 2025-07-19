const { payOS, PAYOS_CONFIG } = require('../config/payos.config');
const { pool } = require('../config/database');
const { sendPaymentInvoiceEmail } = require('../utils/email.util');

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

    async verifyWebhookData(webhookData) {
        try {
            console.log('🔍 Verifying PayOS webhook data...');
            const verifiedData = await payOS.verifyPaymentWebhookData(webhookData);
            return verifiedData;
        } catch (error) {
            console.error('❌ PayOS verifyWebhookData error:', error);
            throw error;
        }
    }

    async updatePaymentStatus(orderCode, status, paymentData = null) {
        const transaction = await pool.transaction();
        
        try {
            await transaction.begin();
            console.log(`🔄 Updating payment status for orderCode ${orderCode} to ${status}`);
            
            // Cập nhật status trong bảng Payments
            const updateResult = await transaction.request()
                .input('Status', status === 'PAID' ? 'confirmed' : status.toLowerCase())
                .input('OrderCode', orderCode.toString())
                .query(`
                    UPDATE Payments 
                    SET Status = @Status, UpdatedAt = GETDATE()
                    OUTPUT INSERTED.*
                    WHERE TransactionID = @OrderCode
                `);

            if (updateResult.recordset.length === 0) {
                throw new Error(`Payment not found for orderCode: ${orderCode}`);
            }

            const payment = updateResult.recordset[0];
            console.log('✅ Payment status updated:', payment.PaymentID);

            if (status === 'PAID' || status === 'confirmed') {
                // 🔄 BƯỚC 1: TẠO MEMBERSHIP TRƯỚC
                console.log('📅 Creating/checking membership first...');
                
                const membershipResult = await transaction.request()
                    .input('UserID', payment.UserID)
                    .input('PlanID', payment.PlanID)
                    .query(`
                        SELECT * FROM UserMemberships 
                        WHERE UserID = @UserID AND PlanID = @PlanID AND Status = 'active'
                    `);

                if (membershipResult.recordset.length === 0) {
                    // Lấy thông tin plan Duration
                    const planResult = await transaction.request()
                        .input('PlanID', payment.PlanID)
                        .query('SELECT Duration FROM MembershipPlans WHERE PlanID = @PlanID');
                    
                    const planDuration = planResult.recordset[0]?.Duration || 30;
                    
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + planDuration);
                    
                    console.log(`📅 Creating membership with ${planDuration} days duration`);

                    await transaction.request()
                        .input('UserID', payment.UserID)
                        .input('PlanID', payment.PlanID)
                        .input('StartDate', startDate)
                        .input('EndDate', endDate)
                        .input('Status', 'active')
                        .query(`
                            INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status, CreatedAt)
                            VALUES (@UserID, @PlanID, @StartDate, @EndDate, @Status, GETDATE())
                        `);

                    console.log('✅ Membership activated for user:', payment.UserID);
                }

                // 🔄 BƯỚC 2: CẬP NHẬT USER ROLE
                await transaction.request()
                    .input('UserID', payment.UserID)
                    .query(`
                        UPDATE Users 
                        SET Role = 'member' 
                        WHERE UserID = @UserID AND Role = 'guest'
                    `);

                // 🔄 BƯỚC 3: GỬI EMAIL (SAU KHI ĐÃ CÓ MEMBERSHIP)
                console.log('💌 Sending invoice email...');
                
                try {
                    const paymentDetailResult = await transaction.request()
                        .input('PaymentID', payment.PaymentID)
                        .query(`
                            SELECT 
                                p.*,
                                u.FirstName, u.LastName, u.Email, u.PhoneNumber,
                                mp.Name as PlanName, mp.Description as PlanDescription, 
                                mp.Duration, mp.Features, mp.Price,
                                FORMAT(p.PaymentDate, 'dd/MM/yyyy HH:mm') as FormattedPaymentDate,
                                um.StartDate as MembershipStartDate,
                                um.EndDate as MembershipEndDate,
                                FORMAT(um.EndDate, 'dd/MM/yyyy') as FormattedEndDate
                            FROM Payments p
                            INNER JOIN Users u ON p.UserID = u.UserID
                            INNER JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
                            LEFT JOIN UserMemberships um ON p.UserID = um.UserID 
                                AND p.PlanID = um.PlanID 
                                AND um.Status = 'active'
                            WHERE p.PaymentID = @PaymentID
                        `);

                    if (paymentDetailResult.recordset.length > 0) {
                        const paymentDetail = paymentDetailResult.recordset[0];
                        
                        console.log('🔍 Payment detail data:');
                        console.log('  - FormattedEndDate:', paymentDetail.FormattedEndDate);
                        console.log('  - MembershipEndDate:', paymentDetail.MembershipEndDate);
                        
                        const user = {
                            FirstName: paymentDetail.FirstName,
                            LastName: paymentDetail.LastName,
                            Email: paymentDetail.Email,
                            PhoneNumber: paymentDetail.PhoneNumber
                        };

                        const plan = {
                            Name: paymentDetail.PlanName,
                            Description: paymentDetail.PlanDescription,
                            Duration: paymentDetail.Duration,
                            Features: paymentDetail.Features,
                            Price: paymentDetail.Price
                        };

                        // 📧 GỬI EMAIL (Bây giờ đã có membership data)
                        await sendPaymentInvoiceEmail({
                            user,
                            payment: paymentDetail,
                            plan,
                            orderCode
                        });

                        console.log('✅ Payment invoice email sent successfully to:', user.Email);
                    }
                } catch (emailError) {
                    console.error('⚠️ Failed to send payment invoice email:', emailError);
                }
            } else {
                console.log(`⏭️ Skipping email for status: ${status}`);
            }

            await transaction.commit();
            console.log('✅ Payment status update completed successfully');

            return payment;
        } catch (error) {
            await transaction.rollback();
            console.error('❌ Error updating payment status:', error);
            throw error;
        }
    }
}

module.exports = new PayOSService(); 