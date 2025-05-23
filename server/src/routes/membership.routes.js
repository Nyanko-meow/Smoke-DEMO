const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');

// Get all membership plans
router.get('/plans', async (req, res) => {
    try {
        console.log('Fetching membership plans from SQL database...');

        const result = await pool.request().query(`
            SELECT * FROM MembershipPlans
            ORDER BY Price ASC
        `);

        console.log('Successfully fetched data from SQL database');

        res.json({
            success: true,
            data: result.recordset,
            message: 'Đã lấy được dữ liệu từ SQL thành công'
        });
    } catch (error) {
        console.error('Error fetching membership plans:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving membership plans'
        });
    }
});

// Get user's current membership
router.get('/current', protect, async (req, res) => {
    try {
        // First check for active memberships
        let result = await pool.request()
            .input('UserID', req.user.id)
            .query(`
                SELECT um.*, mp.*
                FROM UserMemberships um
                JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                WHERE um.UserID = @UserID AND um.Status = 'active'
                AND um.EndDate > GETDATE()
                ORDER BY um.EndDate DESC
            `);

        // If no active membership, check for pending memberships
        if (result.recordset.length === 0) {
            result = await pool.request()
                .input('UserID', req.user.id)
                .query(`
                    SELECT um.*, mp.*
                    FROM UserMemberships um
                    JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                    WHERE um.UserID = @UserID AND um.Status = 'pending'
                    ORDER BY um.CreatedAt DESC
                `);
        }

        if (result.recordset.length === 0) {
            return res.json({
                success: true,
                data: null,
                message: 'No active or pending membership'
            });
        }

        // Check if any active membership is about to expire (within 3 days)
        const membership = result.recordset[0];
        if (membership.Status === 'active') {
            const endDate = new Date(membership.EndDate);
            const now = new Date();
            const daysUntilExpiration = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiration <= 3) {
                // Send notification about upcoming expiration
                await pool.request()
                    .input('UserID', req.user.id)
                    .input('Title', 'Membership Expiring Soon')
                    .input('Message', `Your ${membership.Name} membership will expire in ${daysUntilExpiration} day(s). Consider renewing to maintain your benefits.`)
                    .input('Type', 'membership')
                    .query(`
                        INSERT INTO Notifications (UserID, Title, Message, Type)
                        VALUES (@UserID, @Title, @Message, @Type)
                    `);
            }
        }

        res.json({
            success: true,
            data: membership
        });
    } catch (error) {
        console.error('Error fetching user membership:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving current membership'
        });
    }
});

// Purchase a membership plan
router.post('/purchase', protect, async (req, res) => {
    try {
        const { planId, paymentMethod } = req.body;

        if (!planId) {
            return res.status(400).json({
                success: false,
                message: 'Plan ID is required'
            });
        }

        // Validate payment method
        if (!['BankTransfer', 'Cash'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method. Must be BankTransfer or Cash'
            });
        }

        // Get plan details
        const planResult = await pool.request()
            .input('PlanID', planId)
            .query(`SELECT * FROM MembershipPlans WHERE PlanID = @PlanID`);

        if (planResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Membership plan not found'
            });
        }

        const plan = planResult.recordset[0];

        // Start transaction
        const transaction = new pool.Transaction();
        await transaction.begin();

        try {
            // Calculate start and end dates
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.Duration);

            // Create payment record with pending status
            const paymentResult = await transaction.request()
                .input('UserID', req.user.id)
                .input('PlanID', planId)
                .input('Amount', plan.Price)
                .input('PaymentMethod', paymentMethod)
                .input('Status', 'pending') // Payment is pending confirmation
                .input('TransactionID', 'TRX-' + Date.now())
                .input('Note', `Payment for ${plan.Name} plan via ${paymentMethod}`)
                .query(`
                    INSERT INTO Payments (UserID, PlanID, Amount, PaymentMethod, Status, TransactionID, Note)
                    OUTPUT INSERTED.*
                    VALUES (@UserID, @PlanID, @Amount, @PaymentMethod, @Status, @TransactionID, @Note)
                `);

            const payment = paymentResult.recordset[0];

            // Create membership record with pending status
            // (Will be activated when payment is confirmed)
            const membershipResult = await transaction.request()
                .input('UserID', req.user.id)
                .input('PlanID', planId)
                .input('StartDate', startDate)
                .input('EndDate', endDate)
                .input('Status', 'pending') // Membership is pending until payment confirmation
                .query(`
                    INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status)
                    OUTPUT INSERTED.*
                    VALUES (@UserID, @PlanID, @StartDate, @EndDate, @Status)
                `);

            await transaction.commit();

            // Send notification to user
            await pool.request()
                .input('UserID', req.user.id)
                .input('Title', 'Payment Submitted')
                .input('Message', `Your payment for the ${plan.Name} plan is pending confirmation.`)
                .input('Type', 'payment')
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type)
                    VALUES (@UserID, @Title, @Message, @Type)
                `);

            // For demo purposes only:
            // In a real system, payments would be confirmed by an admin
            // TEMPORARY AUTO-CONFIRMATION (remove this in production)
            if (process.env.NODE_ENV === 'development' || process.env.AUTO_CONFIRM_PAYMENTS === 'true') {
                setTimeout(async () => {
                    try {
                        console.log(`[DEMO] Auto-confirming payment for user ${req.user.id}`);
                        await confirmPayment(payment.PaymentID, req.user.id);
                    } catch (error) {
                        console.error('Error in auto-confirmation:', error);
                    }
                }, 10000); // Auto-confirm after 10 seconds in development
            }

            res.status(201).json({
                success: true,
                data: {
                    membership: membershipResult.recordset[0],
                    payment: payment
                },
                message: 'Payment submitted and pending confirmation'
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error processing membership purchase:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing membership purchase'
        });
    }
});

// Function to confirm a payment (will be called by admin in the future)
async function confirmPayment(paymentId, confirmedByUserId) {
    const transaction = new pool.Transaction();

    try {
        await transaction.begin();

        // Get payment details
        const paymentResult = await transaction.request()
            .input('PaymentID', paymentId)
            .query(`
                SELECT p.*, u.UserID, u.Role, um.MembershipID, um.Status as MembershipStatus
                FROM Payments p
                JOIN Users u ON p.UserID = u.UserID
                LEFT JOIN UserMemberships um ON p.UserID = um.UserID AND um.Status = 'pending'
                WHERE p.PaymentID = @PaymentID
            `);

        if (paymentResult.recordset.length === 0) {
            await transaction.rollback();
            throw new Error('Payment not found');
        }

        const payment = paymentResult.recordset[0];

        // Update payment status to confirmed
        await transaction.request()
            .input('PaymentID', paymentId)
            .query(`
                UPDATE Payments
                SET Status = 'confirmed'
                WHERE PaymentID = @PaymentID
            `);

        // Create payment confirmation record
        await transaction.request()
            .input('PaymentID', paymentId)
            .input('ConfirmedBy', confirmedByUserId)
            .input('Status', 'confirmed')
            .input('Notes', 'Payment confirmed')
            .query(`
                INSERT INTO PaymentConfirmations (PaymentID, ConfirmedBy, Status, Notes)
                VALUES (@PaymentID, @ConfirmedBy, @Status, @Notes)
            `);

        // Update membership status to active
        if (payment.MembershipID) {
            await transaction.request()
                .input('MembershipID', payment.MembershipID)
                .query(`
                    UPDATE UserMemberships
                    SET Status = 'active'
                    WHERE MembershipID = @MembershipID
                `);
        }

        // Update user role to member if they're a guest
        if (payment.Role === 'guest') {
            await transaction.request()
                .input('UserID', payment.UserID)
                .query(`
                    UPDATE Users
                    SET Role = 'member'
                    WHERE UserID = @UserID AND Role = 'guest'
                `);
        }

        // Send notification to user
        await transaction.request()
            .input('UserID', payment.UserID)
            .input('Title', 'Payment Confirmed')
            .input('Message', 'Your payment has been confirmed. Your membership is now active.')
            .input('Type', 'payment')
            .query(`
                INSERT INTO Notifications (UserID, Title, Message, Type)
                VALUES (@UserID, @Title, @Message, @Type)
            `);

        await transaction.commit();
        console.log(`Payment ${paymentId} confirmed successfully`);
        return true;
    } catch (error) {
        await transaction.rollback();
        console.error('Error confirming payment:', error);
        throw error;
    }
}

// Admin endpoint to confirm payment (for future use)
router.post('/confirm-payment/:paymentId', protect, async (req, res) => {
    try {
        const { paymentId } = req.params;

        // Check if user is admin (uncomment when admin roles are implemented)
        // if (req.user.Role !== 'admin') {
        //     return res.status(403).json({
        //         success: false,
        //         message: 'Only admins can confirm payments'
        //     });
        // }

        // For now, allow any user to confirm payments in demo mode
        console.log(`[DEMO] User ${req.user.id} confirming payment ${paymentId}`);

        await confirmPayment(paymentId, req.user.id);

        res.json({
            success: true,
            message: 'Payment confirmed successfully'
        });
    } catch (error) {
        console.error('Error in payment confirmation endpoint:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error confirming payment'
        });
    }
});

// Get user membership history
router.get('/history', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.id)
            .query(`
                SELECT um.*, mp.Name as PlanName, mp.Price, p.PaymentMethod, p.TransactionID
                FROM UserMemberships um
                JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                LEFT JOIN Payments p ON um.UserID = p.UserID AND 
                    p.CreatedAt BETWEEN DATEADD(MINUTE, -5, um.CreatedAt) AND DATEADD(MINUTE, 5, um.CreatedAt)
                WHERE um.UserID = @UserID
                ORDER BY um.CreatedAt DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error fetching membership history:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving membership history'
        });
    }
});

// Cancel membership
router.put('/cancel', protect, async (req, res) => {
    try {
        const transaction = new pool.Transaction();
        await transaction.begin();

        try {
            // First get membership details
            const membershipResult = await transaction.request()
                .input('UserID', req.user.id)
                .query(`
                    SELECT um.*, mp.Price, mp.Name
                    FROM UserMemberships um
                    JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                    WHERE um.UserID = @UserID AND um.Status = 'active'
                `);

            if (membershipResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'No active membership found'
                });
            }

            const membership = membershipResult.recordset[0];

            // Calculate refund amount (50% of price)
            const refundAmount = membership.Price * 0.5;

            // Update membership status
            await transaction.request()
                .input('UserID', req.user.id)
                .query(`
                    UPDATE UserMemberships
                    SET Status = 'cancelled'
                    WHERE UserID = @UserID AND Status = 'active'
                `);

            // Record the refund
            await transaction.request()
                .input('UserID', req.user.id)
                .input('Amount', refundAmount)
                .input('Notes', `50% refund for cancelled ${membership.Name} membership`)
                .query(`
                    INSERT INTO Payments (UserID, Amount, PaymentMethod, Status, Note)
                    VALUES (@UserID, @Amount, 'Refund', 'confirmed', @Notes)
                `);

            // Update user role back to guest
            await transaction.request()
                .input('UserID', req.user.id)
                .query(`
                    UPDATE Users
                    SET Role = 'guest'
                    WHERE UserID = @UserID AND Role = 'member'
                `);

            // Send cancellation notification
            await transaction.request()
                .input('UserID', req.user.id)
                .input('Title', 'Membership Cancelled')
                .input('Message', `Your ${membership.Name} membership has been cancelled. A refund of $${refundAmount.toFixed(2)} (50% of your payment) will be processed.`)
                .input('Type', 'membership')
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type)
                    VALUES (@UserID, @Title, @Message, @Type)
                `);

            await transaction.commit();

            res.json({
                success: true,
                message: 'Membership cancelled successfully',
                data: {
                    refundAmount: refundAmount.toFixed(2)
                }
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error cancelling membership:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling membership'
        });
    }
});

// Function to check for expired memberships and downgrade users
// This would ideally be run by a scheduled task
async function checkExpiredMemberships() {
    const transaction = new pool.Transaction();

    try {
        await transaction.begin();

        // Find expired memberships
        const expiredResult = await transaction.request()
            .query(`
                SELECT um.*, u.UserID, u.Email, u.Role, mp.Name as PlanName
                FROM UserMemberships um
                JOIN Users u ON um.UserID = u.UserID
                JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                WHERE um.Status = 'active'
                AND um.EndDate < GETDATE()
            `);

        console.log(`Found ${expiredResult.recordset.length} expired memberships`);

        // Process each expired membership
        for (const membership of expiredResult.recordset) {
            // Update membership status
            await transaction.request()
                .input('MembershipID', membership.MembershipID)
                .query(`
                    UPDATE UserMemberships
                    SET Status = 'expired'
                    WHERE MembershipID = @MembershipID
                `);

            // Update user role to guest
            if (membership.Role === 'member') {
                await transaction.request()
                    .input('UserID', membership.UserID)
                    .query(`
                        UPDATE Users
                        SET Role = 'guest'
                        WHERE UserID = @UserID
                    `);
            }

            // Send expiration notification
            await transaction.request()
                .input('UserID', membership.UserID)
                .input('Title', 'Membership Expired')
                .input('Message', `Your ${membership.PlanName} membership has expired. Your account has been reverted to Guest status.`)
                .input('Type', 'membership')
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type)
                    VALUES (@UserID, @Title, @Message, @Type)
                `);

            console.log(`Processed expired membership for user ${membership.UserID}`);
        }

        await transaction.commit();
        return expiredResult.recordset.length;
    } catch (error) {
        await transaction.rollback();
        console.error('Error checking expired memberships:', error);
        throw error;
    }
}

// Endpoint to manually trigger membership expiration check (for testing)
// In production, this should be a scheduled task
router.post('/check-expired', protect, async (req, res) => {
    try {
        // Check if user is admin (uncomment when admin roles are implemented)
        // if (req.user.Role !== 'admin') {
        //     return res.status(403).json({
        //         success: false,
        //         message: 'Only admins can perform this action'
        //     });
        // }

        const count = await checkExpiredMemberships();

        res.json({
            success: true,
            message: `Processed ${count} expired memberships`
        });
    } catch (error) {
        console.error('Error in expired membership check:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error checking expired memberships'
        });
    }
});

// For demo purposes only - simulating periodic expiration checks
// In a real app, this should be done with a proper scheduler
if (process.env.NODE_ENV === 'development') {
    // Check for expired memberships every hour
    setInterval(async () => {
        try {
            console.log("Running scheduled membership expiration check");
            const count = await checkExpiredMemberships();
            console.log(`Processed ${count} expired memberships`);
        } catch (error) {
            console.error("Error in scheduled expiration check:", error);
        }
    }, 60 * 60 * 1000); // 1 hour
}

module.exports = router; 