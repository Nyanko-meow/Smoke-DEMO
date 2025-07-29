// server/src/routes/notificationRoutes.js
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { pool, sql } = require('../config/database');

// GET /api/notifications
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          NotificationID, Type, Title, Message,
          AppointmentID, CancellationRequestID,
          IsRead, CreatedAt
        FROM Notifications
        WHERE UserID = @userId
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

// PUT /api/notifications/:id/read
router.put('/:notificationId/read', protect, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const result = await pool.request()
      .input('notificationId', sql.Int, notificationId)
      .input('userId',         sql.Int, userId)
      .query(`
        UPDATE Notifications
        SET IsRead = 1
        OUTPUT INSERTED.NotificationID, INSERTED.IsRead
        WHERE NotificationID = @notificationId AND UserID = @userId
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error marking notification as read' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE Notifications
        SET IsRead = 1
        OUTPUT INSERTED.NotificationID
        WHERE UserID = @userId AND IsRead = 0
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error marking all as read' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:notificationId', protect, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const result = await pool.request()
      .input('notificationId', sql.Int, notificationId)
      .input('userId',         sql.Int, userId)
      .query(`
        DELETE FROM Notifications
        OUTPUT DELETED.NotificationID
        WHERE NotificationID = @notificationId AND UserID = @userId
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error deleting notification' });
  }
});

// POST /api/notifications  (dành cho hệ thống tạo notif)
router.post('/', protect, async (req, res) => {
  try {
    const { title, message, type, appointmentId, cancellationRequestId } = req.body;
    const userId = req.user.id;

    const request = pool.request()
      .input('userId', sql.Int, userId)
      .input('title',  sql.NVarChar, title)
      .input('message',sql.NVarChar, message)
      .input('type',   sql.NVarChar, type);

    if (appointmentId) {
      request.input('appointmentId', sql.Int, appointmentId);
    }
    if (cancellationRequestId) {
      request.input('cancellationRequestId', sql.Int, cancellationRequestId);
    }

    const result = await request.query(`
      INSERT INTO Notifications 
        (UserID, Title, Message, Type, AppointmentID, CancellationRequestID)
      OUTPUT INSERTED.*
      VALUES 
        (@userId, @title, @message, @type, 
         ${appointmentId ? '@appointmentId' : 'NULL'}, 
         ${cancellationRequestId ? '@cancellationRequestId' : 'NULL'})
    `);

    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating notification' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS UnreadCount
        FROM Notifications
        WHERE UserID = @userId AND IsRead = 0
      `);

    res.json({
      success: true,
      data: { unreadCount: result.recordset[0].UnreadCount }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error getting unread count' });
  }
});

module.exports = router;
