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
            // Create payment record with pending status
            const paymentResult = await transaction.request()
                .input('UserID', req.user.id)
                .input('PlanID', planId)
                .input('Amount', amount)
                .input('PaymentMethod', paymentMethod)
                .input('TransactionID', transactionId || `TX-${Date.now()}`)
                .input('Status', 'pending')
                .query(`
                    INSERT INTO Payments (UserID, PlanID, Amount, PaymentMethod, Status, TransactionID)
                    OUTPUT INSERTED.*
                    VALUES (@UserID, @PlanID, @Amount, @PaymentMethod, @Status, @TransactionID)
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

            // Calculate dates
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.Duration);

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

// Create PayOS payment link
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

// PayOS webhook handler
router.post('/payos/webhook', async (req, res) => {
    try {
        console.log('PayOS webhook received:', req.body);

        // Verify webhook data
        const paymentData = await payOSService.verifyWebhookData(req.body);
        
        console.log('Verified payment data:', paymentData);

        // Update payment status
        await payOSService.updatePaymentStatus(
            paymentData.orderCode.toString(),
            paymentData.code === '00' ? 'PAID' : 'FAILED',
            paymentData
        );

        res.json({
            success: true,
            message: 'Webhook processed successfully'
        });

    } catch (error) {
        console.error('PayOS webhook error:', error);
        res.status(500).json({
            success: false,
            message: 'Webhook processing failed'
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
        
        const paymentInfo = await payOSService.getPaymentInfo(parseInt(orderCode));

        if(paymentInfo != null && paymentInfo.status == "PAID"){
            const paymentResult = await pool.request()
                .input('OrderCode', orderCode)
                .query('SELECT TOP(1) * FROM [Payments] WHERE [TransactionID] = @OrderCode');
            if(paymentResult != null && paymentResult.recordset[0]){
                const payment = paymentResult.recordset[0];
                const transactionDateStr = paymentInfo.transactions[0].transactionDateTime;
                const paymentDate = new Date(payment.PaymentDate);
                const transactionDate = new Date(transactionDateStr);
                if(payment.Status == "pending") {
                    const result  = await pool.request()
                        .input('Status', "confirmed")
                        .input('OrderCode', orderCode)
                        .query('UPDATE [Payments] SET Status = @Status WHERE [TransactionID] = @OrderCode');
                }
            }
        }
        res.json({
            success: true,
            data: paymentInfo
        });
    } catch (error) {
        console.error('Error checking PayOS payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking payment status'
        });
    }
});



module.exports = router; 