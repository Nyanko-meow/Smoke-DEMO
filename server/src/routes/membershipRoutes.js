const express = require('express');
const router = express.Router();
const sql = require('mssql');
const auth = require('../middleware/auth');

// Database configuration
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '12345',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'SMOKEKING',
    options: {
        trustServerCertificate: true,
        enableArithAbort: true,
        encrypt: false
    }
};

// Get all membership plans
router.get('/plans', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT * FROM MembershipPlans ORDER BY Price ASC`;

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching plans:', err);
        res.status(500).json({ error: 'Failed to fetch membership plans' });
    } finally {
        sql.close();
    }
});

// Purchase a membership plan
router.post('/purchase', auth, async (req, res) => {
    const { planId, paymentMethod } = req.body;
    const userId = req.user.id;

    // Start a transaction
    const transaction = new sql.Transaction();

    try {
        await transaction.begin();
        const pool = transaction.request();

        // Get plan details
        const planResult = await pool.input('planId', sql.Int, planId)
            .query('SELECT * FROM MembershipPlans WHERE PlanID = @planId');

        if (planResult.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Plan not found' });
        }

        const plan = planResult.recordset[0];

        // Calculate start and end dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.Duration);

        // Add user membership
        await pool.input('userId', sql.Int, userId)
            .input('planId', sql.Int, planId)
            .input('startDate', sql.DateTime, startDate)
            .input('endDate', sql.DateTime, endDate)
            .query(`
                INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status)
                VALUES (@userId, @planId, @startDate, @endDate, 'active')
            `);

        // Create payment record
        await pool.input('userId', sql.Int, userId)
            .input('amount', sql.Decimal(10, 2), plan.Price)
            .input('paymentMethod', sql.NVarChar(50), paymentMethod || 'Credit Card')
            .query(`
                INSERT INTO Payments (UserID, Amount, PaymentMethod, Status)
                VALUES (@userId, @amount, @paymentMethod, 'completed')
            `);

        // Update user role to member if they were a guest
        await pool.input('userId', sql.Int, userId)
            .query(`
                UPDATE Users 
                SET Role = 'member' 
                WHERE UserID = @userId AND Role = 'guest'
            `);

        await transaction.commit();

        res.json({
            success: true,
            message: 'Membership purchased successfully',
            plan: plan.Name,
            validUntil: endDate
        });

    } catch (err) {
        await transaction.rollback();
        console.error('Error purchasing plan:', err);
        res.status(500).json({ error: 'Failed to purchase membership plan' });
    } finally {
        sql.close();
    }
});

// Get user's current membership
router.get('/my-plan', auth, async (req, res) => {
    try {
        await sql.connect(config);

        const userId = req.user.id;

        const result = await sql.query`
            SELECT m.*, p.Name, p.Description, p.Price, p.Features 
            FROM UserMemberships m
            JOIN MembershipPlans p ON m.PlanID = p.PlanID
            WHERE m.UserID = ${userId} AND m.Status = 'active' AND m.EndDate > GETDATE()
            ORDER BY m.EndDate DESC
        `;

        if (result.recordset.length === 0) {
            return res.json({ hasMembership: false });
        }

        res.json({
            hasMembership: true,
            membership: result.recordset[0]
        });

    } catch (err) {
        console.error('Error fetching user plan:', err);
        res.status(500).json({ error: 'Failed to fetch membership details' });
    } finally {
        sql.close();
    }
});

module.exports = router; 