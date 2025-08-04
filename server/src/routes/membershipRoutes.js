const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');
const crypto = require('crypto');

// Get all membership plans
router.get('/plans', async (req, res) => {
    try {
        console.log('Fetching membership plans from SQL database...');

        const result = await pool.request()
            .query('SELECT * FROM MembershipPlans ORDER BY Price ASC');

        console.log('Successfully fetched data from SQL database');

        res.json({
            success: true,
            data: result.recordset,
            message: 'Đã lấy được dữ liệu từ SQL thành công'
        });
    } catch (err) {
        console.error('Error fetching plans:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch membership plans'
        });
    }
});

// Purchase a membership plan
router.post('/purchase', auth, async (req, res) => {
    const { planId, paymentMethod = 'BankTransfer' } = req.body;
    const userId = req.user.UserID || req.user.id;

    console.log('Purchase request from user:', userId, 'for plan:', planId, 'with method:', paymentMethod);

    if (!planId) {
        return res.status(400).json({
            success: false,
            message: 'Plan ID is required'
        });
    }

    // Validate paymentMethod
    if (!['BankTransfer', 'Cash'].includes(paymentMethod)) {
        return res.status(400).json({
            success: false,
            message: 'Payment method must be either BankTransfer or Cash'
        });
    }

    try {
        // Check if user already has pending payments
        const existingPendingResult = await pool.request()
            .input('userId', userId)
            .query(`
                SELECT COUNT(*) as pendingCount
                FROM Payments
                WHERE UserID = @userId AND Status = 'pending'
            `);

        if (existingPendingResult.recordset[0].pendingCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã có thanh toán đang được xử lý. Vui lòng chờ trong giây lát.'
            });
        }

        // Start a transaction
        const transaction = await pool.transaction();
        await transaction.begin();

        try {
            // Get plan details from database
            const planResult = await transaction.request()
                .input('planId', planId)
                .query('SELECT * FROM MembershipPlans WHERE PlanID = @planId');

            if (planResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Plan not found'
                });
            }

            const plan = planResult.recordset[0];

            // Calculate start and end dates
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.Duration);

            // Get user information
            const userResult = await transaction.request()
                .input('userId', userId)
                .query('SELECT Role FROM Users WHERE UserID = @userId');

            if (userResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = userResult.recordset[0];

            // Generate transaction ID
            const transactionId = 'TXN' + Date.now() + crypto.randomBytes(4).toString('hex').toUpperCase();

            console.log('Creating payment record for transaction:', transactionId);

            // Create payment record according to the schema.sql structure
            const paymentResult = await transaction.request()
                .input('userId', userId)
                .input('planId', planId)
                .input('amount', plan.Price)
                .input('paymentMethod', paymentMethod)
                .input('status', 'active')
                .input('transactionId', transactionId)
                .input('startDate', startDate)
                .input('endDate', endDate)
                .input('note', `Đăng ký gói ${plan.Name} cho ${plan.Duration} ngày`)
                .query(`
                    INSERT INTO Payments (
                        UserID, PlanID, Amount, PaymentMethod, Status, 
                        TransactionID, StartDate, EndDate, Note
                    )
                    OUTPUT INSERTED.PaymentID
                    VALUES (
                        @userId, @planId, @amount, @paymentMethod, @status,
                        @transactionId, @startDate, @endDate, @note
                    )
                `);

            const paymentId = paymentResult.recordset[0].PaymentID;

            console.log('Payment created with ID:', paymentId);

            // Create membership record with ACTIVE status (immediate activation)
            const membershipResult = await transaction.request()
                .input('userId', userId)
                .input('planId', planId)
                .input('startDate', startDate)
                .input('endDate', endDate)
                .query(`
                    INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status)
                    OUTPUT INSERTED.MembershipID
                    VALUES (@userId, @planId, @startDate, @endDate, 'active')
                `);

            const membershipId = membershipResult.recordset[0].MembershipID;

            console.log('Membership created with ID (active status):', membershipId);

            // DO NOT create payment confirmation record automatically
            // Admin will create this when they confirm the payment

            // DO NOT update user role automatically
            // This will happen when admin confirms the payment

            await transaction.commit();
            console.log('Transaction committed successfully - payment submitted for admin approval');

            res.json({
                success: true,
                message: 'Gói dịch vụ đã được kích hoạt thành công!',
                plan: plan.Name,
                validUntil: endDate,
                transactionId: transactionId,
                data: {
                    membershipDetails: {
                        id: membershipId,
                        planId: planId,
                        planName: plan.Name,
                        startDate: startDate,
                        endDate: endDate,
                        status: 'active'
                    },
                    paymentDetails: {
                        id: paymentId,
                        amount: plan.Price,
                        method: paymentMethod,
                        status: 'active'
                    }
                }
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Database error during purchase:', error);
            throw error;
        }
    } catch (err) {
        console.error('Error purchasing plan:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to purchase membership plan. ' + err.message,
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Get user's current membership
router.get('/current', auth, async (req, res) => {
    try {
        // Get user ID from auth middleware
        const userId = req.user.UserID || req.user.id;

        console.log('Fetching membership for user:', userId);

        // Query for active memberships with payment information
        const result = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    m.*, 
                    p.Name, p.Description, p.Price, p.Features,
                    py.PaymentID, py.PaymentMethod, py.TransactionID, py.Status as PaymentStatus,
                    pc.ConfirmationCode, pc.ConfirmationDate
                FROM UserMemberships m
                JOIN MembershipPlans p ON m.PlanID = p.PlanID
                LEFT JOIN Payments py ON m.UserID = py.UserID AND m.PlanID = py.PlanID
                LEFT JOIN PaymentConfirmations pc ON py.PaymentID = pc.PaymentID
                WHERE m.UserID = @UserID AND m.Status IN ('active', 'pending_cancellation') AND m.EndDate > GETDATE()
                ORDER BY m.EndDate DESC
            `);

        // Return appropriate response
        if (result.recordset.length === 0) {
            return res.json({
                success: true,
                hasMembership: false,
                message: 'No active membership found'
            });
        }

        res.json({
            success: true,
            hasMembership: true,
            membership: result.recordset[0]
        });
    } catch (err) {
        console.error('Error fetching user membership:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch membership details',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Get user's current membership (without auth requirement - for testing only)
router.get('/current/test', async (req, res) => {
    try {
        // Send a test response without authentication
        res.json({
            success: true,
            message: 'This is a test endpoint that doesn\'t require authentication',
            data: {
                test: true,
                message: 'To use the real endpoint, make sure you include a valid authentication token'
            }
        });
    } catch (err) {
        console.error('Error in test route:', err);
        res.status(500).json({
            success: false,
            message: 'Server error in test route'
        });
    }
});

// Get payment history for the user
router.get('/payment-history', auth, async (req, res) => {
    try {
        const userId = req.user.UserID || req.user.id;

        const result = await pool.request()
            .input('userId', userId)
            .query(`
                SELECT 
                    p.PaymentID, p.Amount, p.PaymentMethod, p.TransactionID, 
                    p.Status as PaymentStatus, p.PaymentDate, p.StartDate, p.EndDate,
                    mp.PlanID, mp.Name as PlanName, mp.Price as PlanPrice, mp.Duration as PlanDuration,
                    pc.ConfirmationCode, pc.ConfirmationDate
                FROM Payments p
                JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
                LEFT JOIN PaymentConfirmations pc ON p.PaymentID = pc.PaymentID
                WHERE p.UserID = @userId
                ORDER BY p.PaymentDate DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error('Error fetching payment history:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment history',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

module.exports = router; 