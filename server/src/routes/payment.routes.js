const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');
const { updateUserRole } = require('../database/db.utils');

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

        // Start transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
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

            // Get plan details
            const planResult = await transaction.request()
                .input('PlanID', planId)
                .query('SELECT * FROM MembershipPlans WHERE PlanID = @PlanID');

            if (planResult.recordset.length === 0) {
                throw new Error('Plan not found');
            }

            const plan = planResult.recordset[0];

            // Create or update membership
            const membershipResult = await transaction.request()
                .input('UserID', req.user.UserID)
                .input('PlanID', planId)
                .input('StartDate', new Date())
                .input('EndDate', new Date(Date.now() + plan.Duration * 24 * 60 * 60 * 1000))
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

            await transaction.commit();

            res.status(201).json({
                success: true,
                data: {
                    payment: paymentResult.recordset[0],
                    membership: membershipResult.recordset[0]
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
            message: 'Error processing payment'
        });
    }
});

// Get user's payment history
router.get('/history', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT 
          p.*,
          mp.Name as PlanName,
          mp.Description as PlanDescription
        FROM Payments p
        LEFT JOIN UserMemberships um ON p.UserID = um.UserID
        LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
        WHERE p.UserID = @UserID
        ORDER BY p.PaymentDate DESC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting payment history'
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

            // In a real application, process payment through a payment gateway here
            // This is a mock payment processing
            const isPaymentSuccessful = true; // Simulating successful payment
            const transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

            if (!isPaymentSuccessful) {
                throw new Error('Payment processing failed');
            }

            // Create payment record
            const paymentResult = await transaction.request()
                .input('UserID', req.user.UserID)
                .input('Amount', plan.Price)
                .input('PaymentMethod', 'credit_card')
                .input('TransactionID', transactionId)
                .query(`
                    INSERT INTO Payments (UserID, Amount, PaymentMethod, Status, TransactionID)
                    OUTPUT INSERTED.*
                    VALUES (@UserID, @Amount, @PaymentMethod, 'completed', @TransactionID)
                `);

            // Create or update membership
            const startDate = new Date();
            const endDate = new Date(Date.now() + plan.Duration * 24 * 60 * 60 * 1000);

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

            // Create notification
            await transaction.request()
                .input('UserID', req.user.UserID)
                .input('Title', 'Payment Successful')
                .input('Message', `Your payment of ${plan.Price} for ${plan.Name} plan has been processed successfully.`)
                .input('Type', 'payment')
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type)
                    VALUES (@UserID, @Title, @Message, @Type)
                `);

            // Update user role to member if they're currently a guest
            if (req.user.Role === 'guest') {
                await updateUserRole(req.user.UserID, 'member');
            }

            await transaction.commit();

            // Mask card number for response
            const maskedCardNumber = cardNumber.replace(/\d(?=\d{4})/g, "*");

            res.status(200).json({
                success: true,
                message: 'Payment processed successfully',
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
                    membershipEndDate: endDate
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

module.exports = router; 