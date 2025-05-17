const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');

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

module.exports = router; 