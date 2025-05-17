const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');

// Get user's notifications
router.get('/', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT *
        FROM Notifications
        WHERE UserID = @UserID
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
            message: 'Error getting notifications'
        });
    }
});

// Mark notification as read
router.put('/:notificationId/read', protect, async (req, res) => {
    try {
        const { notificationId } = req.params;

        const result = await pool.request()
            .input('NotificationID', notificationId)
            .input('UserID', req.user.UserID)
            .query(`
        UPDATE Notifications
        SET IsRead = 1
        OUTPUT INSERTED.*
        WHERE NotificationID = @NotificationID AND UserID = @UserID
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
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
            message: 'Error marking notification as read'
        });
    }
});

// Mark all notifications as read
router.put('/read-all', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        UPDATE Notifications
        SET IsRead = 1
        OUTPUT INSERTED.*
        WHERE UserID = @UserID AND IsRead = 0
      `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error marking notifications as read'
        });
    }
});

// Delete notification
router.delete('/:notificationId', protect, async (req, res) => {
    try {
        const { notificationId } = req.params;

        const result = await pool.request()
            .input('NotificationID', notificationId)
            .input('UserID', req.user.UserID)
            .query(`
        DELETE FROM Notifications
        OUTPUT DELETED.*
        WHERE NotificationID = @NotificationID AND UserID = @UserID
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
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
            message: 'Error deleting notification'
        });
    }
});

// Create notification (system use)
router.post('/', protect, async (req, res) => {
    try {
        const { title, message, type } = req.body;

        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .input('Title', title)
            .input('Message', message)
            .input('Type', type)
            .query(`
        INSERT INTO Notifications (UserID, Title, Message, Type)
        OUTPUT INSERTED.*
        VALUES (@UserID, @Title, @Message, @Type)
      `);

        res.status(201).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error creating notification'
        });
    }
});

// Get unread notification count
router.get('/unread-count', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
        SELECT COUNT(*) as UnreadCount
        FROM Notifications
        WHERE UserID = @UserID AND IsRead = 0
      `);

        res.json({
            success: true,
            data: {
                unreadCount: result.recordset[0].UnreadCount
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error getting unread notification count'
        });
    }
});

module.exports = router; 