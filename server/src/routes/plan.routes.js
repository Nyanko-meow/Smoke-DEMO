const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');

// Create quit plan
router.post('/', protect, async (req, res) => {
    try {
        const { startDate, targetDate, reason, motivationLevel, detailedPlan } = req.body;

        // Validate motivation level
        if (motivationLevel && (motivationLevel < 1 || motivationLevel > 10)) {
            return res.status(400).json({
                success: false,
                message: 'Motivation level must be between 1 and 10'
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const target = new Date(targetDate);
        const now = new Date();

        if (start < now) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be in the past'
            });
        }

        if (target <= start) {
            return res.status(400).json({
                success: false,
                message: 'Target date must be after start date'
            });
        }

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('StartDate', startDate)
            .input('TargetDate', targetDate)
            .input('Reason', reason)
            .input('MotivationLevel', motivationLevel || 5) // Default to 5 if not provided
            .input('DetailedPlan', detailedPlan || null)
            .query(`
        INSERT INTO QuitPlans (UserID, StartDate, TargetDate, Reason, MotivationLevel, Status)
        OUTPUT INSERTED.*
        VALUES (@UserID, @StartDate, @TargetDate, @Reason, @MotivationLevel, 'active')
      `);

        // If detailed plan is provided, store it in a separate table or as JSON
        if (detailedPlan) {
            await pool.request()
                .input('PlanID', result.recordset[0].PlanID)
                .input('DetailedPlan', JSON.stringify(detailedPlan))
                .query(`
            UPDATE QuitPlans
            SET DetailedPlan = @DetailedPlan
            WHERE PlanID = @PlanID
          `);
        }

        res.status(201).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error creating quit plan'
        });
    }
});

// Get user's quit plan
router.get('/current', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT *
        FROM QuitPlans
        WHERE UserID = @UserID
        AND Status = 'active'
        ORDER BY CreatedAt DESC
      `);

        res.json({
            success: true,
            data: result.recordset[0] || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting quit plan'
        });
    }
});

// Update quit plan
router.put('/:planId', protect, async (req, res) => {
    try {
        const { planId } = req.params;
        const { startDate, targetDate, reason, status } = req.body;

        const result = await pool.request()
            .input('PlanID', planId)
            .input('UserID', req.user.UserID)
            .input('StartDate', startDate)
            .input('TargetDate', targetDate)
            .input('Reason', reason)
            .input('Status', status)
            .query(`
        UPDATE QuitPlans
        SET StartDate = @StartDate,
            TargetDate = @TargetDate,
            Reason = @Reason,
            Status = @Status
        OUTPUT INSERTED.*
        WHERE PlanID = @PlanID AND UserID = @UserID
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Quit plan not found'
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
            message: 'Error updating quit plan'
        });
    }
});

// Get quit plan progress
router.get('/:planId/progress', protect, async (req, res) => {
    try {
        const { planId } = req.params;

        const result = await pool.request()
            .input('PlanID', planId)
            .input('UserID', req.user.UserID)
            .query(`
        SELECT 
          qp.*,
          DATEDIFF(day, qp.StartDate, GETDATE()) as DaysElapsed,
          DATEDIFF(day, qp.StartDate, qp.TargetDate) as TotalDays,
          (SELECT COUNT(*) FROM ProgressTracking pt 
           WHERE pt.UserID = qp.UserID 
           AND pt.Date BETWEEN qp.StartDate AND GETDATE()) as DaysTracked,
          (SELECT SUM(CigarettesSmoked) FROM ProgressTracking pt 
           WHERE pt.UserID = qp.UserID 
           AND pt.Date BETWEEN qp.StartDate AND GETDATE()) as TotalCigarettesSmoked,
          (SELECT SUM(MoneySpent) FROM ProgressTracking pt 
           WHERE pt.UserID = qp.UserID 
           AND pt.Date BETWEEN qp.StartDate AND GETDATE()) as TotalMoneySpent
        FROM QuitPlans qp
        WHERE qp.PlanID = @PlanID AND qp.UserID = @UserID
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Quit plan not found'
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
            message: 'Error getting quit plan progress'
        });
    }
});

// Get all quit plans (for admin)
router.get('/', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT qp.*, u.FirstName, u.LastName, u.Email
        FROM QuitPlans qp
        JOIN Users u ON qp.UserID = u.UserID
        WHERE qp.UserID = @UserID
        ORDER BY qp.CreatedAt DESC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting quit plans'
        });
    }
});

module.exports = router; 