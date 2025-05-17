const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');

// Get coach's profile
router.get('/profile', protect, authorize('coach'), async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT u.*, 
               (SELECT COUNT(*) FROM Consultations c WHERE c.CoachID = u.UserID) as TotalConsultations,
               (SELECT COUNT(*) FROM Consultations c WHERE c.CoachID = u.UserID AND c.Status = 'completed') as CompletedConsultations
        FROM Users u
        WHERE u.UserID = @UserID
      `);

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting coach profile'
        });
    }
});

// Get coach's consultations
router.get('/consultations', protect, authorize('coach'), async (req, res) => {
    try {
        const result = await pool.request()
            .input('CoachID', req.user.UserID)
            .query(`
        SELECT 
          c.*,
          u.FirstName as UserFirstName,
          u.LastName as UserLastName,
          u.Email as UserEmail
        FROM Consultations c
        JOIN Users u ON c.UserID = u.UserID
        WHERE c.CoachID = @CoachID
        ORDER BY c.Date DESC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting consultations'
        });
    }
});

// Schedule consultation
router.post('/consultations', protect, async (req, res) => {
    try {
        const { coachId, date, notes } = req.body;

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('CoachID', coachId)
            .input('Date', date)
            .input('Notes', notes)
            .query(`
        INSERT INTO Consultations (UserID, CoachID, Date, Status, Notes)
        OUTPUT INSERTED.*
        VALUES (@UserID, @CoachID, @Date, 'scheduled', @Notes)
      `);

        res.status(201).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error scheduling consultation'
        });
    }
});

// Update consultation status
router.put('/consultations/:consultationId', protect, authorize('coach'), async (req, res) => {
    try {
        const { consultationId } = req.params;
        const { status, notes } = req.body;

        const result = await pool.request()
            .input('ConsultationID', consultationId)
            .input('CoachID', req.user.UserID)
            .input('Status', status)
            .input('Notes', notes)
            .query(`
        UPDATE Consultations
        SET Status = @Status,
            Notes = @Notes
        OUTPUT INSERTED.*
        WHERE ConsultationID = @ConsultationID AND CoachID = @CoachID
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
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
            message: 'Error updating consultation'
        });
    }
});

// Get coach's clients
router.get('/clients', protect, authorize('coach'), async (req, res) => {
    try {
        const result = await pool.request()
            .input('CoachID', req.user.UserID)
            .query(`
        SELECT DISTINCT
          u.UserID,
          u.FirstName,
          u.LastName,
          u.Email,
          (SELECT COUNT(*) FROM Consultations c 
           WHERE c.UserID = u.UserID AND c.CoachID = @CoachID) as ConsultationCount,
          (SELECT MAX(Date) FROM Consultations c 
           WHERE c.UserID = u.UserID AND c.CoachID = @CoachID) as LastConsultation
        FROM Users u
        JOIN Consultations c ON u.UserID = c.UserID
        WHERE c.CoachID = @CoachID
        ORDER BY LastConsultation DESC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting clients'
        });
    }
});

// Get client's progress
router.get('/clients/:userId/progress', protect, authorize('coach'), async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.request()
            .input('UserID', userId)
            .input('CoachID', req.user.UserID)
            .query(`
        SELECT 
          pt.*,
          qp.Status as PlanStatus,
          qp.StartDate as PlanStartDate,
          qp.TargetDate as PlanTargetDate
        FROM ProgressTracking pt
        LEFT JOIN QuitPlans qp ON pt.UserID = qp.UserID AND qp.Status = 'active'
        WHERE pt.UserID = @UserID
        AND EXISTS (
          SELECT 1 FROM Consultations c 
          WHERE c.UserID = pt.UserID AND c.CoachID = @CoachID
        )
        ORDER BY pt.Date DESC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting client progress'
        });
    }
});

// Get available coaches
router.get('/available', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .query(`
        SELECT 
          u.UserID,
          u.FirstName,
          u.LastName,
          u.Email,
          (SELECT COUNT(*) FROM Consultations c 
           WHERE c.CoachID = u.UserID AND c.Status = 'completed') as CompletedConsultations,
          (SELECT AVG(CAST(f.Rating as FLOAT)) FROM Feedback f 
           WHERE f.UserID = u.UserID) as AverageRating
        FROM Users u
        WHERE u.Role = 'coach'
        ORDER BY AverageRating DESC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting available coaches'
        });
    }
});

module.exports = router; 