const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');

// Create quit plan
router.post('/', protect, async (req, res) => {
    try {
        const { startDate, targetDate, reason, motivationLevel, detailedPlan } = req.body;
        const userId = req.user.id || req.user.UserID;

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
            .input('UserID', userId)
            .input('StartDate', startDate)
            .input('TargetDate', targetDate)
            .input('Reason', reason)
            .input('MotivationLevel', motivationLevel || 5)
            .input('DetailedPlan', detailedPlan || null)
            .query(`
                INSERT INTO QuitPlans (UserID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status)
                OUTPUT INSERTED.*
                VALUES (@UserID, @StartDate, @TargetDate, @Reason, @MotivationLevel, @DetailedPlan, 'active')
            `);

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

// Get user's current quit plan
router.get('/current', protect, async (req, res) => {
    try {
        const userId = req.user.id || req.user.UserID;
        
        const result = await pool.request()
            .input('UserID', userId)
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
        const userId = req.user.id || req.user.UserID;

        const result = await pool.request()
            .input('PlanID', planId)
            .input('UserID', userId)
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
        const userId = req.user.id || req.user.UserID;

        const result = await pool.request()
            .input('PlanID', planId)
            .input('UserID', userId)
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

// Get all quit plans (for user)
router.get('/', protect, async (req, res) => {
    try {
        console.log('🔍 Getting quit plans for user:', req.user.id || req.user.UserID);
        
        // Use the correct property name - try both for compatibility
        const userId = req.user.id || req.user.UserID;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID not found in request'
            });
        }

        const result = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT qp.*, u.FirstName, u.LastName, u.Email
                FROM QuitPlans qp
                JOIN Users u ON qp.UserID = u.UserID
                WHERE qp.UserID = @UserID
                AND qp.Status = 'active'
                ORDER BY qp.CreatedAt DESC
            `);

        console.log('✅ Query result:', {
            userId: userId,
            recordCount: result.recordset.length,
            records: result.recordset
        });

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('❌ Error getting quit plans:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting quit plans',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


module.exports = router; 