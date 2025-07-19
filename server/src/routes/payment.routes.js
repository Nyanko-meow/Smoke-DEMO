const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');
const { updateUserRole } = require('../database/db.utils');
const sql = require('mssql');
const payOSService = require('../services/payos.service');

// Get membership plans
router.get('/plans', async (req, res) => {
    try {
        const result = await pool.request()
            .query(`
        SELECT *
        FROM MembershipPlans
        ORDER BY Price ASC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting membership plans'
        });
    }
});

// Create payment
router.post('/', protect, async (req, res) => {
    try {
        const { planId, amount, paymentMethod, transactionId } = req.body;

        console.log('Creating payment:', { planId, amount, paymentMethod, transactionId });

        // Validate input
        if (!planId || !amount || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: planId, amount, paymentMethod'
            });
        }

        // Start transaction
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Calculate dates
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.Duration);

            // Create payment record with pending status
            const paymentResult = await transaction.request()
                .input('UserID', req.user.id)
                .input('PlanID', planId)
                .input('Amount', amount)
                .input('PaymentMethod', paymentMethod)
                .input('TransactionID', transactionId || `TX-${Date.now()}`)
                .input('Status', 'pending')
                .input('StartDate', startDate)
                .input('EndDate', endDate)
                .query(`
                    INSERT INTO Payments (UserID, PlanID, Amount, PaymentMethod, Status, TransactionID, StartDate, EndDate)
                    OUTPUT INSERTED.*
                    VALUES (@UserID, @PlanID, @Amount, @PaymentMethod, @Status, @TransactionID, @StartDate, @EndDate)
                `);

            // Get the payment record
            const payment = paymentResult.recordset[0];

            // Get plan details
            const planResult = await transaction.request()
                .input('PlanID', planId)
                .query('SELECT * FROM MembershipPlans WHERE PlanID = @PlanID');

            if (planResult.recordset.length === 0) {
                throw new Error('Plan not found');
            }

            const plan = planResult.recordset[0];

            // Create membership record with active status (immediate activation)
            const membershipResult = await transaction.request()
                .input('UserID', req.user.id)
                .input('PlanID', planId)
                .input('StartDate', startDate)
                .input('EndDate', endDate)
                .input('Status', 'active')
                .query(`
                    MERGE INTO UserMemberships AS target
                    USING (SELECT @UserID AS UserID) AS source
                    ON target.UserID = source.UserID
                    WHEN MATCHED THEN
                        UPDATE SET
                            PlanID = @PlanID,
                            StartDate = @StartDate,
                            EndDate = @EndDate,
                            Status = 'active'
                    WHEN NOT MATCHED THEN
                        INSERT (UserID, PlanID, StartDate, EndDate, Status)
                        VALUES (@UserID, @PlanID, @StartDate, @EndDate, 'active')
                    OUTPUT INSERTED.*;
                `);

            // Create notification for user about successful activation
            await transaction.request()
                .input('UserID', req.user.id)
                .input('Title', 'Gói dịch vụ đã được kích hoạt')
                .input('Message', `Gói ${plan.Name} đã được kích hoạt thành công. Chào mừng bạn đến với dịch vụ của chúng tôi!`)
                .input('Type', 'payment')
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type)
                    VALUES (@UserID, @Title, @Message, @Type)
                `);

            // Get user info for admin notification
            const userResult = await transaction.request()
                .input('UserID', req.user.id)
                .query(`
                    SELECT FirstName, LastName, Email FROM Users WHERE UserID = @UserID
                `);

            const user = userResult.recordset[0];

            await transaction.commit();

            // PayOS auto-activation: No admin notifications needed for PayOS payments
            // (Admin notifications are only for manual payment methods like bank transfer)

            // Return success
            res.status(201).json({
                success: true,
                data: {
                    payment: payment,
                    membership: membershipResult.recordset[0],
                    plan: plan
                },
                message: 'Gói dịch vụ đã được kích hoạt thành công'
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing payment',
            error: error.message
        });
    }
});

// Get user's payment history
router.get('/history', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID || req.user.id)
            .query(`
                SELECT 
                    p.*,
                    mp.Name as PlanName,
                    mp.Description as PlanDescription,
                    mp.Duration,
                    mp.Features,
                    um.Status as MembershipStatus,
                    um.StartDate as MembershipStartDate,
                    um.EndDate as MembershipEndDate,
                    pc.ConfirmationDate,
                    pc.ConfirmationCode,
                    pc.Notes as ConfirmationNotes
                FROM Payments p
                JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
                LEFT JOIN UserMemberships um ON p.UserID = um.UserID AND p.PlanID = um.PlanID
                LEFT JOIN PaymentConfirmations pc ON p.PaymentID = pc.PaymentID
                WHERE p.UserID = @UserID
                ORDER BY p.PaymentDate DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error getting payment history:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử thanh toán'
        });
    }
});

// Get user's current membership
router.get('/membership', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT 
          um.*,
          mp.Name as PlanName,
          mp.Description as PlanDescription,
          mp.Features
        FROM UserMemberships um
        JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
        WHERE um.UserID = @UserID
        AND um.Status = 'active'
        AND um.EndDate > GETDATE()
      `);

        res.json({
            success: true,
            data: result.recordset[0] || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting membership'
        });
    }
});

// Create membership plan (admin only)
router.post('/plans', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, description, price, duration, features } = req.body;

        const result = await pool.request()
            .input('Name', name)
            .input('Description', description)
            .input('Price', price)
            .input('Duration', duration)
            .input('Features', features)
            .query(`
        INSERT INTO MembershipPlans (Name, Description, Price, Duration, Features)
        OUTPUT INSERTED.*
        VALUES (@Name, @Description, @Price, @Duration, @Features)
      `);

        res.status(201).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error creating membership plan'
        });
    }
});

// Update membership plan (admin only)
router.put('/plans/:planId', protect, authorize('admin'), async (req, res) => {
    try {
        const { planId } = req.params;
        const { name, description, price, duration, features } = req.body;

        const result = await pool.request()
            .input('PlanID', planId)
            .input('Name', name)
            .input('Description', description)
            .input('Price', price)
            .input('Duration', duration)
            .input('Features', features)
            .query(`
        UPDATE MembershipPlans
        SET Name = @Name,
            Description = @Description,
            Price = @Price,
            Duration = @Duration,
            Features = @Features
        OUTPUT INSERTED.*
        WHERE PlanID = @PlanID
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error updating membership plan'
        });
    }
});

// Process payment details and complete subscription
router.post('/process', protect, async (req, res) => {
    try {
        const {
            planId,
            cardNumber,
            cardHolder,
            expiryDate,
            cvv,
            billingAddress
        } = req.body;

        if (!planId || !cardNumber || !cardHolder || !expiryDate || !cvv) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment information'
            });
        }

        // Validate card information (simple validation for demo)
        if (cardNumber.replace(/\s/g, '').length !== 16) {
            return res.status(400).json({
                success: false,
                message: 'Invalid card number'
            });
        }

        // Start transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Get plan details
            const planResult = await transaction.request()
                .input('PlanID', planId)
                .query('SELECT * FROM MembershipPlans WHERE PlanID = @PlanID');

            if (planResult.recordset.length === 0) {
                throw new Error('Plan not found');
            }

            const plan = planResult.recordset[0];

            // Generate transaction ID
            const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

            // Create payment record with PENDING status (waiting for admin approval)
            const paymentResult = await transaction.request()
                .input('UserID', req.user.UserID || req.user.id)
                .input('PlanID', planId)
                .input('Amount', plan.Price)
                .input('PaymentMethod', 'BankTransfer') // Use allowed payment method
                .input('TransactionID', transactionId)
                .input('Status', 'pending') // PENDING - waiting for admin approval
                .query(`
                    INSERT INTO Payments (UserID, PlanID, Amount, PaymentMethod, Status, TransactionID)
                    OUTPUT INSERTED.*
                    VALUES (@UserID, @PlanID, @Amount, @PaymentMethod, @Status, @TransactionID)
                `);

            // Calculate membership dates
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.Duration);

            // Create membership record with ACTIVE status (immediate activation)
            const membershipResult = await transaction.request()
                .input('UserID', req.user.UserID || req.user.id)
                .input('PlanID', planId)
                .input('StartDate', startDate)
                .input('EndDate', endDate)
                .input('Status', 'active') // ACTIVE - immediate activation
                .query(`
                    MERGE INTO UserMemberships AS target
                    USING (SELECT @UserID AS UserID) AS source
                    ON target.UserID = source.UserID
                    WHEN MATCHED THEN
                        UPDATE SET
                            PlanID = @PlanID,
                            StartDate = @StartDate,
                            EndDate = @EndDate,
                            Status = 'active'
                    WHEN NOT MATCHED THEN
                        INSERT (UserID, PlanID, StartDate, EndDate, Status)
                        VALUES (@UserID, @PlanID, @StartDate, @EndDate, 'active')
                    OUTPUT INSERTED.*;
                `);

            // Create notification for user about successful activation
            await transaction.request()
                .input('UserID', req.user.UserID || req.user.id)
                .input('Title', 'Gói dịch vụ đã được kích hoạt')
                .input('Message', `Gói ${plan.Name} đã được kích hoạt thành công. Chào mừng bạn đến với dịch vụ của chúng tôi!`)
                .input('Type', 'payment')
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type)
                    VALUES (@UserID, @Title, @Message, @Type)
                `);

            // Get user info for admin notification
            const userResult = await transaction.request()
                .input('UserID', req.user.UserID || req.user.id)
                .query(`
                    SELECT FirstName, LastName, Email FROM Users WHERE UserID = @UserID
                `);

            const user = userResult.recordset[0];

            await transaction.commit();

            // Notify all admins about new payment (outside transaction)
            try {
                // Get all admin users
                const adminResult = await pool.request().query(`
                    SELECT UserID FROM Users WHERE Role = 'admin'
                `);

                // Create notifications for all admins
                for (const admin of adminResult.recordset) {
                    await pool.request()
                        .input('UserID', admin.UserID)
                        .input('Title', '💳 Thanh toán mới cần xác nhận')
                        .input('Message', `${user.FirstName} ${user.LastName} (${user.Email}) đã tạo đơn hàng mới cho gói ${plan.Name} với số tiền ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plan.Price)}. Vui lòng kiểm tra và xác nhận thanh toán.`)
                        .input('Type', 'payment_new')
                        .input('RelatedID', paymentResult.recordset[0].PaymentID)
                        .query(`
                            INSERT INTO Notifications (UserID, Title, Message, Type, RelatedID)
                            VALUES (@UserID, @Title, @Message, @Type, @RelatedID)
                        `);
                }

                console.log(`📢 Notified ${adminResult.recordset.length} admins about new payment from ${user.FirstName} ${user.LastName}`);
            } catch (notificationError) {
                console.error('Error notifying admins about new payment:', notificationError);
                // Don't fail the main operation if notification fails
            }

            // Mask card number for response
            const maskedCardNumber = cardNumber.replace(/\d(?=\d{4})/g, "*");

            res.status(200).json({
                success: true,
                message: 'Gói dịch vụ đã được kích hoạt thành công',
                data: {
                    payment: {
                        ...paymentResult.recordset[0],
                        cardDetails: {
                            cardHolder,
                            cardNumber: maskedCardNumber,
                            expiryDate
                        }
                    },
                    membership: membershipResult.recordset[0],
                    plan: plan,
                    status: 'active'
                }
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error processing payment',
            error: error.message
        });
    }
});

// Get payment methods
router.get('/methods', protect, async (req, res) => {
    // In a real application, you would fetch the user's saved payment methods
    // For this demo, we're returning mock data
    res.json({
        success: true,
        data: [
            {
                id: 'method_1',
                type: 'credit_card',
                brand: 'Visa',
                lastFour: '4242',
                expiryMonth: 12,
                expiryYear: 2025,
                isDefault: true
            },
            {
                id: 'method_2',
                type: 'credit_card',
                brand: 'Mastercard',
                lastFour: '5555',
                expiryMonth: 10,
                expiryYear: 2024,
                isDefault: false
            }
        ]
    });
});

// Get user's pending payments
router.get('/pending', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID || req.user.id)
            .query(`
                SELECT 
                    p.*,
                    mp.Name as PlanName,
                    mp.Description as PlanDescription,
                    mp.Duration,
                    mp.Features
                FROM Payments p
                JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
                WHERE p.UserID = @UserID AND p.Status = 'pending'
                ORDER BY p.PaymentDate DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error getting pending payments:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách thanh toán chờ xác nhận'
        });
    }
});

// Create PayOS payment link từ đây trở xuống là các API của PayOS
router.post('/payos/create', protect, async (req, res) => {
    try {
        console.log('🚀 PayOS create payment request received:');
        console.log('  - User:', req.user.Email);
        console.log('  - Body:', req.body);
        
        const { planId, amount, description } = req.body;

        // Validate input
        if (!planId || !amount) {
            console.log('❌ Validation failed: missing planId or amount');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: planId, amount'
            });
        }

        // Generate unique order code
        const orderCode = Date.now();
        console.log('📝 Generated orderCode:', orderCode);
        
        // Get plan details
        console.log('🔍 Getting plan details for planId:', planId);
        const planResult = await pool.request()
            .input('PlanID', planId)
            .query('SELECT * FROM MembershipPlans WHERE PlanID = @PlanID');

        if (planResult.recordset.length === 0) {
            console.log('❌ Plan not found for planId:', planId);
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        const plan = planResult.recordset[0];
        console.log('✅ Plan found:', plan.Name);

        // Create payment record with 'pending' status (will be auto-activated by webhook within seconds)
        console.log('💾 Creating PayOS payment record (auto-activate on webhook success)...');
        const paymentResult = await pool.request()
            .input('UserID', req.user.id)
            .input('PlanID', planId)
            .input('Amount', amount)
            .input('PaymentMethod', 'BankTransfer')
            .input('TransactionID', orderCode.toString())
            .input('Status', 'pending')
            .query(`
                INSERT INTO Payments (UserID, PlanID, Amount, PaymentMethod, Status, TransactionID)
                OUTPUT INSERTED.*
                VALUES (@UserID, @PlanID, @Amount, @PaymentMethod, @Status, @TransactionID)
            `);
        console.log('✅ PayOS payment record created:', paymentResult.recordset[0].PaymentID, '(will auto-activate on webhook success)');

        // Prepare PayOS order data
        const { PAYOS_CONFIG } = require('../config/payos.config');
        const buyerName = `${req.user.FirstName || 'User'} ${req.user.LastName || 'Unknown'}`;
        const orderData = {
            orderCode: orderCode,
            amount: amount,
            description: `${plan.Name.toString().trim().slice(0, 25)}`,
            items: [
                {
                    name: plan.Name,
                    quantity: 1,
                    price: amount
                }
            ],
            returnUrl: PAYOS_CONFIG.RETURN_URL,
            cancelUrl: PAYOS_CONFIG.CANCEL_URL,
            buyerName: buyerName,
            buyerEmail: req.user.Email,
            buyerPhone: req.user.Phone || 'N/A'
        };

        console.log('📦 PayOS order data prepared:', JSON.stringify(orderData, null, 2));

        // Create PayOS payment link
        console.log('🔗 Creating PayOS payment link...');
        const paymentLink = await payOSService.createPaymentLink(orderData);
        console.log('✅ PayOS payment link created successfully:', paymentLink?.checkoutUrl);

        res.json({
            success: true,
            data: {
                payment: paymentResult.recordset[0],
                paymentLink: paymentLink,
                checkoutUrl: paymentLink.checkoutUrl
            },
            message: 'Payment link created successfully'
        });

    } catch (error) {
        console.error('❌ Error creating PayOS payment:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error creating payment link',
            error: error.message
        });
    }
});

// PayOS webhook handler - IMPROVED VERSION
router.post('/payos/webhook', async (req, res) => {
    try {
        console.log('🎯 PayOS webhook received at:', new Date().toISOString());
        console.log('📦 Webhook payload:', JSON.stringify(req.body, null, 2));

        // Verify webhook data
        const paymentData = await payOSService.verifyWebhookData(req.body);
        console.log('✅ Verified payment data:', JSON.stringify(paymentData, null, 2));

        // Determine status
        const status = paymentData.code === '00' ? 'PAID' : 'FAILED';
        console.log(`💰 Payment status: ${status} (code: ${paymentData.code})`);

        // Update payment status
        const result = await payOSService.updatePaymentStatus(
            paymentData.orderCode.toString(),
            status,
            paymentData
        );

        console.log('✅ Payment update completed:', result?.PaymentID);

        res.json({
            success: true,
            message: 'Webhook processed successfully'
        });

    } catch (error) {
        console.error('❌ PayOS webhook error:', error);
        console.error('🔍 Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Webhook processing failed',
            error: error.message
        });
    }
});

// PayOS return handler
router.get('/payos/return', async (req, res) => {
    try {
        const { orderCode, status } = req.query;
        
        if (status === 'PAID') {
            // Redirect to success page
            res.redirect(`${process.env.CLIENT_URL}/payment/success?orderCode=${orderCode}`);
        } else {
            // Redirect to failed page
            res.redirect(`${process.env.CLIENT_URL}/payment/failed?orderCode=${orderCode}`);
        }
    } catch (error) {
        console.error('PayOS return handler error:', error);
        res.redirect(`${process.env.CLIENT_URL}/payment/error`);
    }
});

// PayOS cancel handler
router.get('/payos/cancel', async (req, res) => {
    try {
        const { orderCode } = req.query;
        
        // Update payment status to cancelled
        await payOSService.updatePaymentStatus(orderCode, 'CANCELLED');
        
        res.redirect(`${process.env.CLIENT_URL}/payment/cancelled?orderCode=${orderCode}`);
    } catch (error) {
        console.error('PayOS cancel handler error:', error);
        res.redirect(`${process.env.CLIENT_URL}/payment/error`);
    }
});

// Check PayOS payment status
router.get('/payos/status/:orderCode', protect, async (req, res) => {
    try {
        const { orderCode } = req.params;

        console.log('🔍 Checking PayOS payment status for orderCode:', orderCode);

        /* 1) Gọi PayOS lấy trạng thái */
        const paymentInfo = await payOSService.getPaymentInfo(parseInt(orderCode));
        console.log('💰 PayOS payment info:', paymentInfo?.status);

        if (paymentInfo && paymentInfo.status === 'PAID') {
            /* 2) Truy bản ghi payment */
            const paymentRes = await pool.request()
                .input('OrderCode', orderCode)
                .query(`
                    SELECT TOP (1) *
                    FROM [Payments]
                    WHERE [TransactionID] = @OrderCode
                `);

            if (paymentRes.recordset.length) {
                const payment = paymentRes.recordset[0];
                console.log('📄 Found payment record:', payment.PaymentID, 'Status:', payment.Status);

                /* 3) Cập nhật Payments.Status nếu còn pending */
                if (payment.Status === 'pending') {
                    await pool.request()
                        .input('Status', 'confirmed')
                        .input('OrderCode', orderCode)
                        .query(`
                            UPDATE [Payments]
                            SET Status = @Status
                            WHERE [TransactionID] = @OrderCode
                        `);
                    console.log('✅ Payment status updated → confirmed');

                    /* 🆕 FALLBACK: GỬI EMAIL KHI UPDATE STATUS */
                    try {
                        console.log('📧 Triggering email fallback mechanism...');
                        
                        // Lấy thông tin chi tiết để gửi email
                        const emailDataResult = await pool.request()
                            .input('PaymentID', payment.PaymentID)
                            .query(`
                                SELECT 
                                    p.*,
                                    u.FirstName, u.LastName, u.Email, u.PhoneNumber,
                                    mp.Name as PlanName, mp.Description as PlanDescription, 
                                    mp.Duration, mp.Features, mp.Price
                                FROM Payments p
                                INNER JOIN Users u ON p.UserID = u.UserID
                                INNER JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
                                WHERE p.PaymentID = @PaymentID
                            `);

                        if (emailDataResult.recordset.length > 0) {
                            const emailData = emailDataResult.recordset[0];
                            
                            const user = {
                                FirstName: emailData.FirstName,
                                LastName: emailData.LastName,
                                Email: emailData.Email,
                                PhoneNumber: emailData.PhoneNumber
                            };

                            const plan = {
                                Name: emailData.PlanName,
                                Description: emailData.PlanDescription,
                                Duration: emailData.Duration,
                                Features: emailData.Features,
                                Price: emailData.Price
                            };

                            const { sendPaymentInvoiceEmail } = require('../utils/email.util');
                            
                            console.log(`📧 Sending fallback invoice email to: ${user.Email}`);
                            
                            await sendPaymentInvoiceEmail({
                                user,
                                payment: emailData,
                                plan,
                                orderCode
                            });

                            console.log('✅ Fallback invoice email sent successfully!');
                        }
                    } catch (emailError) {
                        console.error('⚠️ Fallback email failed:', emailError);
                        // Không throw error
                    }
                }

                /* 4) Kiểm tra / tạo UserMemberships */
                const memRes = await pool.request()
                    .input('UserID', payment.UserID)
                    .input('PlanID', payment.PlanID)
                    .input('Today', new Date())
                    .query(`
                        SELECT TOP (1) *
                        FROM [UserMemberships]
                        WHERE UserID = @UserID
                          AND PlanID = @PlanID
                          AND Status = 'active'
                          AND EndDate >= @Today
                    `);

                if (!memRes.recordset.length) {
                    // 🔧 THÊM: Lấy thông tin plan Duration
                    const planRes = await pool.request()
                        .input('PlanID', payment.PlanID)
                        .query('SELECT Duration FROM MembershipPlans WHERE PlanID = @PlanID');
                    
                    const planDuration = planRes.recordset[0]?.Duration || 30; // fallback 30 ngày
                    
                    const startDate = new Date();
                    const endDate = new Date(startDate);
                    // 🆕 SỬA: Sử dụng plan.Duration thay vì hardcode 1 tháng
                    endDate.setDate(endDate.getDate() + planDuration);
                    
                    console.log(`📅 Creating membership with ${planDuration} days duration`);

                    await pool.request()
                        .input('UserID', payment.UserID)
                        .input('PlanID', payment.PlanID)
                        .input('StartDate', startDate)
                        .input('EndDate', endDate)
                        .input('Status', 'active')
                        .input('CreatedAt', new Date())
                        .query(`
                            INSERT INTO [UserMemberships]
                              (UserID, PlanID, StartDate, EndDate, Status, CreatedAt)
                            VALUES
                              (@UserID, @PlanID, @StartDate, @EndDate, @Status, @CreatedAt)
                        `);

                    console.log('✅ UserMembership inserted');
                }

                /* 5) ĐỔI ROLE GUEST → MEMBER */
                await pool.request()
                    .input('UserID', payment.UserID)
                    .query(`
                        UPDATE [Users]
                        SET Role = 'member'
                        WHERE UserID = @UserID
                          AND Role   = 'guest'
                    `);
                console.log('✅ User role updated → member');
            }
        }

        /* 6) Trả kết quả cho client */
        res.json({
            success: true,
            data: paymentInfo,
            emailSent: true  // Báo cho client biết email đã được gửi
        });
    } catch (err) {
        console.error('❌ Error checking PayOS payment status:', err);
        res.status(500).json({
            success: false,
            message: 'Error checking payment status'
        });
    }
});

// 🆕 THÊM ENDPOINT TEST EMAIL BILL
router.get('/test-invoice-email/:paymentId', protect, async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        console.log('🧪 Testing invoice email for paymentId:', paymentId);
        
        // Kiểm tra và tạo membership nếu chưa có
        const membershipCheck = await pool.request()
            .input('PaymentID', paymentId)
            .query(`
                SELECT p.UserID, p.PlanID
                FROM Payments p
                LEFT JOIN UserMemberships um ON p.UserID = um.UserID 
                    AND p.PlanID = um.PlanID 
                    AND um.Status = 'active'
                WHERE p.PaymentID = @PaymentID AND um.MembershipID IS NULL
            `);

        // Tạo membership nếu chưa có
        if (membershipCheck.recordset.length > 0) {
            const { UserID, PlanID } = membershipCheck.recordset[0];
            
            console.log('⚠️ No active membership found, creating one for test...');
            
            const planRes = await pool.request()
                .input('PlanID', PlanID)
                .query('SELECT Duration FROM MembershipPlans WHERE PlanID = @PlanID');
            
            const planDuration = planRes.recordset[0]?.Duration || 30;
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + planDuration);
            
            await pool.request()
                .input('UserID', UserID)
                .input('PlanID', PlanID)
                .input('StartDate', startDate)
                .input('EndDate', endDate)
                .input('Status', 'active')
                .query(`
                    INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status, CreatedAt)
                    VALUES (@UserID, @PlanID, @StartDate, @EndDate, @Status, GETDATE())
                `);
            
            console.log(`✅ Created test membership with ${planDuration} days duration`);
        }
        
        // Bây giờ query với đầy đủ data
        const paymentDetailResult = await pool.request()
            .input('PaymentID', paymentId)
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

        if (paymentDetailResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        const paymentDetail = paymentDetailResult.recordset[0];
        
        // 🆕 THÊM: Debug logging
        console.log('🔍 Test endpoint - Payment detail data:');
        console.log('  - FormattedEndDate:', paymentDetail.FormattedEndDate);
        console.log('  - MembershipEndDate:', paymentDetail.MembershipEndDate);
        console.log('  - PlanDuration:', paymentDetail.Duration);
        
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

        // Import email utility
        const { sendPaymentInvoiceEmail } = require('../utils/email.util');
        
        // Gửi email test với membership data
        await sendPaymentInvoiceEmail({
            user,
            payment: paymentDetail, // Bây giờ đã có FormattedEndDate và MembershipEndDate
            plan,
            orderCode: paymentDetail.TransactionID
        });

        res.json({
            success: true,
            message: 'Test invoice email sent successfully',
            data: {
                recipient: user.Email,
                orderCode: paymentDetail.TransactionID,
                amount: paymentDetail.Amount,
                planName: plan.Name,
                membershipEndDate: paymentDetail.FormattedEndDate || 'Not found' // 🆕 THÊM debug info
            }
        });

    } catch (error) {
        console.error('❌ Error sending test invoice email:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending test email',
            error: error.message
        });
    }
});

// 🆕 THÊM ENDPOINT TEST EMAIL SERVICE
router.post('/test-email-service', protect, async (req, res) => {
    try {
        const { verifyMailConnection, sendPaymentInvoiceEmail } = require('../utils/email.util');
        
        console.log('🧪 Testing email service...');
        const emailOk = await verifyMailConnection();
        
        if (emailOk) {
            // Test gửi email thực
            const testUser = {
                FirstName: 'Test',
                LastName: 'User',
                Email: req.user.Email,
                PhoneNumber: '0123456789'
            };
            
            const testPayment = {
                PaymentID: 'TEST-001',
                Amount: 99000,
                PaymentDate: new Date(),
                TransactionID: 'TEST-TX-001'
            };
            
            const testPlan = {
                Name: 'Gói Test',
                Description: 'Đây là gói test email',
                Duration: 30,
                Features: 'Tính năng test email',
                Price: 99000
            };
            
            await sendPaymentInvoiceEmail({
                user: testUser,
                payment: testPayment,
                plan: testPlan,
                orderCode: 'TEST-ORDER-001'
            });
            
            return res.json({
                success: true,
                emailServiceWorking: true,
                message: 'Email service is working - Test email sent successfully!'
            });
        } else {
            return res.json({
                success: false,
                emailServiceWorking: false,
                message: 'Email service has connection issues'
            });
        }
    } catch (error) {
        console.error('❌ Email test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Email test failed',
            error: error.message
        });
    }
});

// �� THÊM ENDPOINT TEST NHIỀU SMTP
router.post('/test-smtp-list', async (req, res) => {
    try {
        const { testSMTPConnections } = require('../utils/email.util');
        const smtpConfigs = req.body.smtpConfigs;
        if (!Array.isArray(smtpConfigs) || smtpConfigs.length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng truyền vào mảng cấu hình smtpConfigs' });
        }
        const results = await testSMTPConnections(smtpConfigs);
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi test SMTP', error: error.message });
    }
});

module.exports = router; 