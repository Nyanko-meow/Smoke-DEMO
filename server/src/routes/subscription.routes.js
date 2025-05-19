const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');
const { updateUserRole } = require('../database/db.utils');

/**
 * @route GET /api/subscriptions/plans
 * @desc Get all available subscription plans with details
 * @access Public
 */
router.get('/plans', async (req, res) => {
    try {
        const result = await pool.request()
            .query(`
                SELECT 
                    PlanID,
                    Name,
                    Description,
                    Price,
                    Duration,
                    Features,
                    CreatedAt
                FROM MembershipPlans
                ORDER BY Price ASC
            `);

        const plans = result.recordset.map(plan => {
            // Parse features if it's a JSON string
            let features = plan.Features;
            if (typeof features === 'string') {
                try {
                    features = JSON.parse(features);
                } catch (e) {
                    // If not valid JSON, leave as is
                }
            }

            return {
                ...plan,
                Features: features,
                DurationInDays: plan.Duration,
                // Add formatted duration text
                DurationText: plan.Duration === 30 ? '1 tháng' :
                    plan.Duration === 90 ? '3 tháng' :
                        plan.Duration === 180 ? '6 tháng' :
                            plan.Duration === 365 ? '1 năm' :
                                `${plan.Duration} ngày`
            };
        });

        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subscription plans'
        });
    }
});

/**
 * @route GET /api/subscriptions/plans/:planId
 * @desc Get details of a specific subscription plan
 * @access Public
 */
router.get('/plans/:planId', async (req, res) => {
    try {
        const { planId } = req.params;

        const result = await pool.request()
            .input('PlanID', planId)
            .query(`
                SELECT 
                    PlanID,
                    Name,
                    Description,
                    Price,
                    Duration,
                    Features,
                    CreatedAt
                FROM MembershipPlans
                WHERE PlanID = @PlanID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found'
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
            message: 'Error fetching subscription plan details'
        });
    }
});

/**
 * @route POST /api/subscriptions/subscribe
 * @desc Subscribe to a plan 
 * @access Private
 */
router.post('/subscribe', protect, async (req, res) => {
    try {
        const { planId, paymentMethod = 'credit_card' } = req.body;

        if (!planId) {
            return res.status(400).json({
                success: false,
                message: 'Plan ID is required'
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
                throw new Error('Subscription plan not found');
            }

            const plan = planResult.recordset[0];
            const amount = plan.Price;

            // Generate a mock transaction ID
            const transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

            // Create payment record
            const paymentResult = await transaction.request()
                .input('UserID', req.user.UserID)
                .input('Amount', amount)
                .input('PaymentMethod', paymentMethod)
                .input('TransactionID', transactionId)
                .query(`
                    INSERT INTO Payments (UserID, Amount, PaymentMethod, Status, TransactionID)
                    OUTPUT INSERTED.*
                    VALUES (@UserID, @Amount, @PaymentMethod, 'completed', @TransactionID)
                `);

            // Calculate end date based on plan duration
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + (plan.Duration * 24 * 60 * 60 * 1000));

            // Create or update membership
            const membershipResult = await transaction.request()
                .input('UserID', req.user.UserID)
                .input('PlanID', planId)
                .input('StartDate', startDate)
                .input('EndDate', endDate)
                .query(`
                    MERGE INTO UserMemberships AS target
                    USING (SELECT @UserID AS UserID) AS source
                    ON target.UserID = source.UserID AND target.Status = 'active'
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

            // Create notification for the user
            await transaction.request()
                .input('UserID', req.user.UserID)
                .input('Title', 'Subscription Activated')
                .input('Message', `Your subscription to ${plan.Name} has been activated successfully.`)
                .input('Type', 'subscription')
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type)
                    VALUES (@UserID, @Title, @Message, @Type)
                `);

            // Update user role to member if they're currently a guest
            if (req.user.Role === 'guest') {
                await updateUserRole(req.user.UserID, 'member');
            }

            await transaction.commit();

            res.status(201).json({
                success: true,
                data: {
                    payment: paymentResult.recordset[0],
                    membership: membershipResult.recordset[0],
                    plan: plan
                },
                message: `Successfully subscribed to ${plan.Name}`
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error processing subscription',
            error: error.message
        });
    }
});

/**
 * @route GET /api/subscriptions/active
 * @desc Get user's active subscription
 * @access Private
 */
router.get('/active', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT 
                    um.*,
                    mp.Name as PlanName,
                    mp.Description as PlanDescription,
                    mp.Price as PlanPrice,
                    mp.Features as PlanFeatures,
                    DATEDIFF(day, GETDATE(), um.EndDate) as DaysRemaining
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
            message: 'Error fetching active subscription'
        });
    }
});

/**
 * @route POST /api/subscriptions/cancel
 * @desc Cancel user's active subscription
 * @access Private
 */
router.post('/cancel', protect, async (req, res) => {
    try {
        // Start transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Get current active subscription
            const currentSubResult = await transaction.request()
                .input('UserID', req.user.UserID)
                .query(`
                    SELECT 
                        um.*,
                        mp.Name as PlanName
                    FROM UserMemberships um
                    JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                    WHERE um.UserID = @UserID
                    AND um.Status = 'active'
                    AND um.EndDate > GETDATE()
                `);

            if (currentSubResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No active subscription found'
                });
            }

            const currentSub = currentSubResult.recordset[0];

            // Update subscription status to cancelled
            await transaction.request()
                .input('MembershipID', currentSub.MembershipID)
                .query(`
                    UPDATE UserMemberships
                    SET Status = 'cancelled'
                    WHERE MembershipID = @MembershipID
                `);

            // Create notification for the user
            await transaction.request()
                .input('UserID', req.user.UserID)
                .input('Title', 'Subscription Cancelled')
                .input('Message', `Your subscription to ${currentSub.PlanName} has been cancelled. You will have access until the end of your current billing period.`)
                .input('Type', 'subscription')
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type)
                    VALUES (@UserID, @Title, @Message, @Type)
                `);

            await transaction.commit();

            res.json({
                success: true,
                message: 'Subscription cancelled successfully',
                data: {
                    endDate: currentSub.EndDate
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
            message: 'Error cancelling subscription',
            error: error.message
        });
    }
});

/**
 * @route POST /api/subscriptions/renew
 * @desc Renew an existing subscription
 * @access Private
 */
router.post('/renew', protect, async (req, res) => {
    try {
        const { paymentMethod = 'credit_card' } = req.body;

        // Start transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Get current active subscription
            const currentSubResult = await transaction.request()
                .input('UserID', req.user.UserID)
                .query(`
                    SELECT 
                        um.*,
                        mp.Name as PlanName,
                        mp.Price as PlanPrice,
                        mp.Duration as PlanDuration
                    FROM UserMemberships um
                    JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                    WHERE um.UserID = @UserID
                    AND um.Status = 'active'
                    ORDER BY um.EndDate DESC
                `);

            if (currentSubResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No active subscription found to renew'
                });
            }

            const currentSub = currentSubResult.recordset[0];
            const planId = currentSub.PlanID;
            const amount = currentSub.PlanPrice;
            const duration = currentSub.PlanDuration;

            // Generate a mock transaction ID for renewal
            const transactionId = `renewal_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

            // Create payment record for renewal
            const paymentResult = await transaction.request()
                .input('UserID', req.user.UserID)
                .input('Amount', amount)
                .input('PaymentMethod', paymentMethod)
                .input('TransactionID', transactionId)
                .query(`
                    INSERT INTO Payments (UserID, Amount, PaymentMethod, Status, TransactionID)
                    OUTPUT INSERTED.*
                    VALUES (@UserID, @Amount, @PaymentMethod, 'completed', @TransactionID)
                `);

            // Calculate new end date based on current end date or current date (whichever is later)
            const now = new Date();
            const currentEndDate = new Date(currentSub.EndDate);
            const startDate = currentEndDate > now ? currentEndDate : now;
            const endDate = new Date(startDate.getTime() + (duration * 24 * 60 * 60 * 1000));

            // Update membership with new end date
            const membershipResult = await transaction.request()
                .input('MembershipID', currentSub.MembershipID)
                .input('EndDate', endDate)
                .query(`
                    UPDATE UserMemberships
                    SET EndDate = @EndDate,
                        Status = 'active'
                    OUTPUT INSERTED.*
                    WHERE MembershipID = @MembershipID
                `);

            // Create notification for the user
            await transaction.request()
                .input('UserID', req.user.UserID)
                .input('Title', 'Subscription Renewed')
                .input('Message', `Your subscription to ${currentSub.PlanName} has been renewed successfully until ${endDate.toISOString().split('T')[0]}.`)
                .input('Type', 'subscription')
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type)
                    VALUES (@UserID, @Title, @Message, @Type)
                `);

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: 'Subscription renewed successfully',
                data: {
                    payment: paymentResult.recordset[0],
                    membership: membershipResult.recordset[0],
                    nextRenewal: endDate
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
            message: 'Error renewing subscription',
            error: error.message
        });
    }
});

/**
 * @route POST /api/subscriptions/check-expiration
 * @desc Check for expired subscriptions and update user roles
 * @access Private (Admin only)
 */
router.post('/check-expiration', protect, async (req, res) => {
    try {
        // This would typically be a scheduled job, but we're exposing it as an endpoint for testing
        const result = await pool.request()
            .query(`
                -- Find expired memberships
                DECLARE @ExpiredMemberships TABLE (
                    UserID INT,
                    MembershipID INT
                );
                
                -- Insert expired memberships into temp table
                INSERT INTO @ExpiredMemberships (UserID, MembershipID)
                SELECT 
                    um.UserID,
                    um.MembershipID
                FROM UserMemberships um
                WHERE um.Status = 'active'
                AND um.EndDate < GETDATE();
                
                -- Update expired memberships
                UPDATE um
                SET Status = 'expired'
                FROM UserMemberships um
                JOIN @ExpiredMemberships e ON um.MembershipID = e.MembershipID;
                
                -- Count number of users affected
                SELECT COUNT(*) as ExpiredCount FROM @ExpiredMemberships;
                
                -- Update user roles for users with no active memberships
                UPDATE u
                SET Role = 'guest'
                FROM Users u
                WHERE u.Role = 'member'
                AND NOT EXISTS (
                    SELECT 1 FROM UserMemberships um
                    WHERE um.UserID = u.UserID
                    AND um.Status = 'active'
                    AND um.EndDate > GETDATE()
                );
            `);

        const expiredCount = result.recordset[0].ExpiredCount;

        res.json({
            success: true,
            message: `Successfully processed expired subscriptions`,
            data: {
                expiredCount
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error checking subscription expiration',
            error: error.message
        });
    }
});

/**
 * @route GET /api/subscriptions/member-status
 * @desc Check if the user is a member based on subscription status
 * @access Private
 */
router.get('/member-status', protect, async (req, res) => {
    try {
        // Check if user has Role = 'member'
        const isRoleMember = req.user.Role === 'member';

        // Check if user has active subscription
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT COUNT(*) as hasActiveSub 
                FROM UserMemberships 
                WHERE UserID = @UserID 
                AND Status = 'active' 
                AND EndDate > GETDATE()
            `);

        const hasActiveSubscription = result.recordset[0].hasActiveSub > 0;

        res.json({
            success: true,
            isMember: isRoleMember,
            hasActiveSubscription: hasActiveSubscription,
            message: isRoleMember ?
                'Bạn là thành viên có đăng ký gói dịch vụ' :
                'Bạn chưa đăng ký gói dịch vụ nào'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra trạng thái thành viên'
        });
    }
});

module.exports = router; 