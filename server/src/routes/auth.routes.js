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
    verifyRefreshToken,
    activateUserAccount,
    updateUserRole,
    regenerateActivationToken,
    isUserActivated
} = require('../database/db.utils');
const { registerValidation, loginValidation } = require('../middleware/validator.middleware');
const { body, validationResult } = require('express-validator');
const {
    generateActivationToken,
    sendActivationEmail,
    sendWelcomeEmail
} = require('../utils/email.util');

// Register user
router.post('/register', registerValidation, async (req, res) => {
    try {
        const {
            email,
            password,
            firstName,
            lastName,
            role = 'guest',
            phoneNumber,
            address,
            requireActivation = true
        } = req.body;

        // Check if at least one identifier (email or phone) is provided
        if (!email && !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp email hoặc số điện thoại'
            });
        }

        console.log('Registering new user:', email || phoneNumber);

        // Generate activation token if email verification required
        let activationToken = null;
        if (requireActivation && email) {
            activationToken = generateActivationToken();
        }

        // Create user
        const user = await createUser({
            email,
            password,
            firstName,
            lastName,
            role,
            phoneNumber,
            address,
            requireActivation: requireActivation && email // Only require activation for email registration
        }, activationToken);

        console.log('User created successfully:', user);

        // Send activation email if required and email is provided
        if (requireActivation && email && activationToken) {
            // Send activation email
            await sendActivationEmail(user, activationToken);
            console.log('Activation email requested for:', email);

            // Return success without token for now since account needs activation
            return res.status(201).json({
                success: true,
                message: 'Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản.',
                requireActivation: true,
                user: {
                    id: user.UserID,
                    email: user.Email,
                    phoneNumber: user.PhoneNumber,
                    firstName: user.FirstName,
                    lastName: user.LastName
                }
            });
        }

        // If activation is not required or registration is by phone, proceed with auto login
        // Get IP address and user agent
        const ipAddress = req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            'unknown';

        const userAgent = req.headers['user-agent'] || 'unknown';

        // Generate access token (short-lived)
        const token = jwt.sign(
            {
                id: user.UserID,
                email: user.Email,
                phoneNumber: user.PhoneNumber,
                role: user.Role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '1h' }
        );
        console.log('Token generated successfully');

        // Generate refresh token (long-lived)
        const refreshToken = await generateRefreshToken(user.UserID);
        console.log('Refresh token generated successfully');

        // Set cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };

        res.cookie('token', token, {
            ...cookieOptions,
            maxAge: 60 * 60 * 1000 // 1 hour
        });

        res.cookie('refreshToken', refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        console.log('Cookies set successfully');

        // Record login in history
        await pool.request()
            .input('UserID', user.UserID)
            .input('IPAddress', ipAddress)
            .input('UserAgent', userAgent)
            .query(`
                INSERT INTO LoginHistory (UserID, IPAddress, UserAgent, Status)
                VALUES (@UserID, @IPAddress, @UserAgent, 'success')
            `);
        console.log('Login history recorded successfully');

        // Update last login timestamp
        await pool.request()
            .input('UserID', user.UserID)
            .query(`
                UPDATE Users 
                SET LastLoginAt = GETDATE() 
                WHERE UserID = @UserID
            `);
        console.log('Last login timestamp updated successfully');

        // Send welcome email if email is provided
        if (email) {
            await sendWelcomeEmail(user);
        }

        res.status(201).json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user.UserID,
                email: user.Email,
                phoneNumber: user.PhoneNumber,
                firstName: user.FirstName,
                lastName: user.LastName,
                role: user.Role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.message === 'Email đã được sử dụng') {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }
        if (error.message === 'Số điện thoại đã được sử dụng') {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại đã được sử dụng'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Lỗi trong quá trình đăng ký',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Login user
router.post('/login', loginValidation, async (req, res) => {
    try {
        const { email, phoneNumber, password, rememberMe = false } = req.body;

        console.log('Login attempt for user:', email || phoneNumber);

        // Get IP address
        const ipAddress = req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            'unknown';

        // Get user agent
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Check for too many failed login attempts
        const identifier = email || phoneNumber;
        const tooManyAttempts = await checkFailedLoginAttempts(identifier, ipAddress);
        if (tooManyAttempts) {
            console.log('Too many failed login attempts for:', identifier);
            return res.status(429).json({
                success: false,
                message: 'Quá nhiều lần đăng nhập không thành công. Vui lòng thử lại sau 30 phút.'
            });
        }

        // Attempt to login user
        const user = await loginUser({ email, phoneNumber, password }, ipAddress, userAgent);

        // Generate access token (short-lived)
        const token = jwt.sign(
            {
                id: user.UserID,
                email: user.Email,
                phoneNumber: user.PhoneNumber,
                role: user.Role
            },
            process.env.JWT_SECRET,
            { expiresIn: rememberMe ? '7d' : (process.env.JWT_EXPIRE || '1h') }
        );

        // Generate refresh token (long-lived)
        const refreshToken = await generateRefreshToken(user.UserID);

        // Set cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };

        res.cookie('token', token, {
            ...cookieOptions,
            maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000 // 7 days or 1 hour
        });

        res.cookie('refreshToken', refreshToken, {
            ...cookieOptions,
            maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000 // 30 days or 7 days
        });

        res.json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user.UserID,
                email: user.Email,
                phoneNumber: user.PhoneNumber,
                firstName: user.FirstName,
                lastName: user.LastName,
                role: user.Role
            }
        });
    } catch (error) {
        console.error('Login error:', error);

        if (error.message === 'INVALID_CREDENTIALS') {
            return res.status(401).json({
                success: false,
                message: 'Email/số điện thoại hoặc mật khẩu không đúng'
            });
        }

        if (error.message === 'EMAIL_OR_PHONE_REQUIRED') {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp email hoặc số điện thoại'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi trong quá trình đăng nhập',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

        console.log('Refresh token request received');

        if (!refreshToken) {
            console.log('No refresh token found');
            return res.status(401).json({
                success: false,
                message: 'Refresh token không tìm thấy'
            });
        }

        console.log('Verifying refresh token');
        // Verify refresh token
        const user = await verifyRefreshToken(refreshToken);
        console.log('Refresh token verified for user:', user.Email);

        // Generate new access token
        const token = jwt.sign(
            {
                id: user.UserID,
                email: user.Email,
                role: user.Role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '1h' }
        );
        console.log('New access token generated');

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000 // 1 hour
        });
        console.log('Cookie set with new token');

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
        console.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            message: 'Refresh token không hợp lệ hoặc đã hết hạn',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// Get activation status
router.get('/activation-status', protect, async (req, res) => {
    try {
        const status = await isUserActivated(req.user.UserID);

        res.json({
            success: true,
            isActivated: status,
            role: req.user.Role
        });
    } catch (error) {
        console.error('Error checking activation status:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra trạng thái kích hoạt tài khoản'
        });
    }
});

// Activate account
router.get('/activate/:token', async (req, res) => {
    try {
        const { token } = req.params;
        console.log('Activating account with token:', token);

        // Activate account
        const user = await activateUserAccount(token);
        console.log('Account activated successfully for:', user.Email);

        // Send welcome email
        await sendWelcomeEmail(user);
        console.log('Welcome email sent');

        // Generate token for auto login after activation
        const jwtToken = jwt.sign(
            {
                id: user.UserID,
                email: user.Email,
                role: user.Role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '1h' }
        );

        // Generate refresh token
        const refreshToken = await generateRefreshToken(user.UserID);

        // Set cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };

        res.cookie('token', jwtToken, {
            ...cookieOptions,
            maxAge: 60 * 60 * 1000 // 1 hour
        });

        res.cookie('refreshToken', refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Record login
        const ipAddress = req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        await pool.request()
            .input('UserID', user.UserID)
            .input('IPAddress', ipAddress)
            .input('UserAgent', userAgent)
            .query(`
                INSERT INTO LoginHistory (UserID, IPAddress, UserAgent, Status)
                VALUES (@UserID, @IPAddress, @UserAgent, 'success')
            `);

        // Update last login timestamp
        await pool.request()
            .input('UserID', user.UserID)
            .query(`
                UPDATE Users 
                SET LastLoginAt = GETDATE() 
                WHERE UserID = @UserID
            `);

        res.json({
            success: true,
            message: 'Tài khoản đã kích hoạt thành công',
            token: jwtToken,
            refreshToken,
            user: {
                id: user.UserID,
                email: user.Email,
                firstName: user.FirstName,
                lastName: user.LastName,
                role: user.Role
            }
        });
    } catch (error) {
        console.error('Account activation error:', error);
        res.status(400).json({
            success: false,
            message: 'Token kích hoạt không hợp lệ hoặc đã hết hạn',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Resend activation email
router.post('/resend-activation', [
    body('email')
        .isEmail()
        .withMessage('Vui lòng cung cấp địa chỉ email hợp lệ')
        .normalizeEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email } = req.body;
        console.log('Resending activation email for:', email);

        // Generate new activation token
        const activationToken = generateActivationToken();
        console.log('New activation token generated');

        // Update activation token in database
        const user = await regenerateActivationToken(email, activationToken);
        console.log('Activation token updated in database');

        // Send activation email
        await sendActivationEmail(user, activationToken);
        console.log('Activation email sent');

        res.json({
            success: true,
            message: 'Email kích hoạt đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.'
        });
    } catch (error) {
        console.error('Resend activation error:', error);

        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản với email này'
            });
        }

        if (error.message === 'Account already activated') {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản này đã được kích hoạt'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi khi gửi lại email kích hoạt',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update user role
router.put('/role', protect, [
    body('role')
        .isIn(['guest', 'member', 'coach', 'admin'])
        .withMessage('Vai trò không hợp lệ'),
    body('userId')
        .optional()
        .isNumeric()
        .withMessage('ID người dùng không hợp lệ')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { role, userId } = req.body;

        // Only admins can update other users' roles
        if (userId && req.user.Role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền cập nhật vai trò của người dùng khác'
            });
        }

        // Update current user's role or specified user if admin
        const targetUserId = userId || req.user.UserID;

        console.log(`Updating role to '${role}' for user ID:`, targetUserId);
        const updatedUser = await updateUserRole(targetUserId, role);
        console.log('Role updated successfully:', updatedUser);

        res.json({
            success: true,
            message: 'Vai trò đã được cập nhật thành công',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update role error:', error);

        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        if (error.message === 'Invalid role specified') {
            return res.status(400).json({
                success: false,
                message: 'Vai trò không hợp lệ'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật vai trò',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 