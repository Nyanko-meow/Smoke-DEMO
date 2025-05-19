const express = require('express');
const router = express.Router();
const { sql, pool } = require('../config/database');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/smoking-status
 * @desc    Get user's smoking status
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.request()
            .input('userID', sql.Int, req.user.id)
            .query(`
                SELECT * FROM SmokingStatus 
                WHERE UserID = @userID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Smoking status not found' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error getting smoking status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   POST /api/smoking-status
 * @desc    Create or update user's smoking status
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
    const { cigarettesPerDay, cigarettePrice, smokingFrequency } = req.body;

    // Validate input
    if (!cigarettesPerDay || !cigarettePrice || !smokingFrequency) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        // Check if the user already has a smoking status
        const existingStatus = await pool.request()
            .input('userID', sql.Int, req.user.id)
            .query(`
                SELECT StatusID FROM SmokingStatus
                WHERE UserID = @userID
            `);

        if (existingStatus.recordset.length > 0) {
            // Update existing record
            await pool.request()
                .input('userID', sql.Int, req.user.id)
                .input('cigarettesPerDay', sql.Int, cigarettesPerDay)
                .input('cigarettePrice', sql.Decimal(10, 2), cigarettePrice)
                .input('smokingFrequency', sql.NVarChar(50), smokingFrequency)
                .query(`
                    UPDATE SmokingStatus
                    SET CigarettesPerDay = @cigarettesPerDay,
                        CigarettePrice = @cigarettePrice,
                        SmokingFrequency = @smokingFrequency,
                        LastUpdated = GETDATE()
                    WHERE UserID = @userID
                `);

            return res.json({ message: 'Smoking status updated successfully' });
        } else {
            // Insert new record
            await pool.request()
                .input('userID', sql.Int, req.user.id)
                .input('cigarettesPerDay', sql.Int, cigarettesPerDay)
                .input('cigarettePrice', sql.Decimal(10, 2), cigarettePrice)
                .input('smokingFrequency', sql.NVarChar(50), smokingFrequency)
                .query(`
                    INSERT INTO SmokingStatus (UserID, CigarettesPerDay, CigarettePrice, SmokingFrequency)
                    VALUES (@userID, @cigarettesPerDay, @cigarettePrice, @smokingFrequency)
                `);

            return res.status(201).json({ message: 'Smoking status created successfully' });
        }
    } catch (error) {
        console.error('Error saving smoking status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 