const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { createUser } = require('../database/db.utils');
const { profileUpdateValidation } = require('../middleware/validator.middleware');

// Get user profile
router.get('/profile', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT u.UserID, u.Email, u.FirstName, u.LastName, u.Role, u.PhoneNumber, u.Address, u.Avatar,
               m.MembershipID, m.Status as MembershipStatus,
               mp.Name as PlanName, mp.Description as PlanDescription
        FROM Users u
        LEFT JOIN UserMemberships m ON u.UserID = m.UserID
        LEFT JOIN MembershipPlans mp ON m.PlanID = mp.PlanID
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
            message: 'Lỗi khi lấy thông tin người dùng'
        });
    }
});

// Update user profile
router.put('/profile', protect, profileUpdateValidation, async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, address } = req.body;

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('FirstName', firstName)
            .input('LastName', lastName)
            .input('PhoneNumber', phoneNumber || null)
            .input('Address', address || null)
            .query(`
        UPDATE Users
        SET FirstName = @FirstName,
            LastName = @LastName,
            PhoneNumber = @PhoneNumber,
            Address = @Address,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.FirstName, INSERTED.LastName, 
               INSERTED.Role, INSERTED.PhoneNumber, INSERTED.Address, INSERTED.Avatar
        WHERE UserID = @UserID
      `);

        res.json({
            success: true,
            message: 'Thông tin đã được cập nhật thành công',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thông tin người dùng'
        });
    }
});

// Update avatar
router.put('/avatar', protect, async (req, res) => {
    try {
        const { avatar } = req.body;

        if (!avatar) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đường dẫn ảnh đại diện'
            });
        }

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('Avatar', avatar)
            .query(`
        UPDATE Users
        SET Avatar = @Avatar,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.UserID, INSERTED.Avatar
        WHERE UserID = @UserID
      `);

        res.json({
            success: true,
            message: 'Ảnh đại diện đã được cập nhật',
            data: {
                avatar: result.recordset[0].Avatar
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật ảnh đại diện'
        });
    }
});

// Get user's smoking status
router.get('/smoking-status', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query('SELECT * FROM SmokingStatus WHERE UserID = @UserID');

        res.json({
            success: true,
            data: result.recordset[0] || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting smoking status'
        });
    }
});

// Update smoking status
router.put('/smoking-status', protect, async (req, res) => {
    try {
        const { cigarettesPerDay, cigarettePrice, smokingFrequency } = req.body;

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('CigarettesPerDay', cigarettesPerDay)
            .input('CigarettePrice', cigarettePrice)
            .input('SmokingFrequency', smokingFrequency)
            .query(`
        MERGE INTO SmokingStatus AS target
        USING (SELECT @UserID AS UserID) AS source
        ON target.UserID = source.UserID
        WHEN MATCHED THEN
          UPDATE SET
            CigarettesPerDay = @CigarettesPerDay,
            CigarettePrice = @CigarettePrice,
            SmokingFrequency = @SmokingFrequency,
            LastUpdated = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (UserID, CigarettesPerDay, CigarettePrice, SmokingFrequency)
          VALUES (@UserID, @CigarettesPerDay, @CigarettePrice, @SmokingFrequency)
        OUTPUT INSERTED.*;
      `);

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error updating smoking status'
        });
    }
});

// Get user's achievements
router.get('/achievements', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT a.*, ua.EarnedDate
        FROM UserAchievements ua
        JOIN Achievements a ON ua.AchievementID = a.AchievementID
        WHERE ua.UserID = @UserID
        ORDER BY ua.EarnedDate DESC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting achievements'
        });
    }
});

// Get user's progress
router.get('/progress', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT *
        FROM ProgressTracking
        WHERE UserID = @UserID
        ORDER BY Date DESC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting progress'
        });
    }
});

// Admin only routes
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.request()
            .query(`
        SELECT UserID, Email, FirstName, LastName, Role, CreatedAt
        FROM Users
        ORDER BY CreatedAt DESC
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting users'
        });
    }
});

// Add new user (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { email, password, firstName, lastName, role = 'member', phoneNumber, address, avatar } = req.body;

        const user = await createUser({
            email,
            password,
            firstName,
            lastName,
            role,
            phoneNumber,
            address,
            avatar
        });

        res.status(201).json({
            success: true,
            message: 'User added successfully',
            data: user
        });
    } catch (error) {
        console.error(error);
        if (error.message === 'User already exists') {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error adding user'
        });
    }
});

module.exports = router; 