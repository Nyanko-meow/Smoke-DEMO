const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { protect } = require('../middleware/auth.middleware');
const {
    createUser,
    loginUser,
    checkFailedLoginAttempts,
    generateRefreshToken,
    verifyRefreshToken
} = require('../database/db.utils');
const { registerValidation, loginValidation } = require('../middleware/validator.middleware');
const { body, validationResult } = require('express-validator');

// Register user
router.post('/register', registerValidation, async (req, res) => {
    try {
        const { email, password, firstName, lastName, role = 'member', phoneNumber, address } = req.body;

        const user = await createUser({
            email,
            password,
            firstName,
            lastName,
            role,
            phoneNumber,
            address
        });

        // Generate token
        const token = jwt.sign(
            { id: user.UserID },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.UserID,
                email: user.Email,
                firstName: user.FirstName,
                lastName: user.LastName,
                role: user.Role
            }
        });
    } catch (error) {
        console.error(error);
        if (error.message === 'User already exists') {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Lỗi trong quá trình đăng ký'
        });
    }
});

// Login user
router.post('/login', loginValidation, async (req, res) => {
    try {
        const { email, password, rememberMe = false } = req.body;

        // Get IP address
        const ipAddress = req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            'unknown';

        // Get user agent
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Check for too many failed login attempts
        const tooManyAttempts = await checkFailedLoginAttempts(email, ipAddress);
        if (tooManyAttempts) {
            return res.status(429).json({
                success: false,
                message: 'Quá nhiều lần đăng nhập không thành công. Vui lòng thử lại sau 30 phút.'
            });
        }

        // Login user
        const user = await loginUser(email, password, ipAddress, userAgent);

        // Generate access token (short-lived)
        const token = jwt.sign(
            { id: user.UserID },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '1h' }
        );

        // Generate refresh token (long-lived)
        const refreshToken = await generateRefreshToken(user.UserID);

        // Set cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };

        // If remember me is checked, set longer expiry for refresh token
        if (rememberMe) {
            cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        } else {
            cookieOptions.maxAge = 24 * 60 * 60 * 1000; // 1 day
        }

        res.cookie('token', token, {
            ...cookieOptions,
            maxAge: 60 * 60 * 1000 // 1 hour
        });

        res.cookie('refreshToken', refreshToken, cookieOptions);

        // Send response
        res.json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user.UserID,
                email: user.Email,
                firstName: user.FirstName,
                lastName: user.LastName,
                role: user.Role,
                avatar: user.Avatar
            }
        });
    } catch (error) {
        console.error(error);

        if (error.message === 'INVALID_CREDENTIALS') {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi trong quá trình đăng nhập'
        });
    }
});

// Get current user
router.get('/me', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query('SELECT UserID, Email, FirstName, LastName, Role, PhoneNumber, Address, Avatar FROM Users WHERE UserID = @UserID');

        res.json({
            success: true,
            user: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin người dùng'
        });
    }
});

// Change password
router.put('/change-password', [
    protect,
    body('currentPassword')
        .notEmpty()
        .withMessage('Vui lòng nhập mật khẩu hiện tại'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
        .matches(/\d/)
        .withMessage('Mật khẩu mới phải chứa ít nhất một số'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
], async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get current user with password
        const result = await pool.request()
            .input('UserID', req.user.UserID)
            .query('SELECT * FROM Users WHERE UserID = @UserID');

        const user = result.recordset[0];

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.Password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Mật khẩu hiện tại không đúng'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await pool.request()
            .input('UserID', req.user.UserID)
            .input('Password', hashedPassword)
            .query(`
                UPDATE Users
                SET Password = @Password, UpdatedAt = GETDATE()
                WHERE UserID = @UserID
            `);

        res.json({
            success: true,
            message: 'Mật khẩu đã được cập nhật thành công'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật mật khẩu'
        });
    }
});

// Refresh access token
router.post('/refresh-token', async (req, res) => {
    try {
        // Get refresh token from cookie or request body
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token không tìm thấy'
            });
        }

        // Verify refresh token
        const user = await verifyRefreshToken(refreshToken);

        // Generate new access token
        const token = jwt.sign(
            { id: user.UserID },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '1h' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000 // 1 hour
        });

        res.json({
            success: true,
            token,
            user: {
                id: user.UserID,
                email: user.Email,
                firstName: user.FirstName,
                lastName: user.LastName,
                role: user.Role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(401).json({
            success: false,
            message: 'Refresh token không hợp lệ hoặc đã hết hạn'
        });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    try {
        // Get user ID from token if available
        let userId;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            const token = req.headers.authorization.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            } catch (error) {
                // Token is invalid, continue with logout anyway
            }
        }

        // If user ID is available, clear refresh token in database
        if (userId) {
            await pool.request()
                .input('UserID', userId)
                .query(`
                    UPDATE Users
                    SET RefreshToken = NULL, RefreshTokenExpiry = NULL
                    WHERE UserID = @UserID
                `);
        }

        // Clear cookies
        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0)
        });

        res.cookie('refreshToken', '', {
            httpOnly: true,
            expires: new Date(0)
        });

        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng xuất'
        });
    }
});

module.exports = router; 