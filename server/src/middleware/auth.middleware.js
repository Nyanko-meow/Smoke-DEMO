const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { isUserActivated } = require('../database/db.utils');

// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET not set. Using default value for development only.');
    process.env.JWT_SECRET = 'smokeking_secret_key_ultra_secure_2024';
}

// Protect routes middleware
const auth = async (req, res, next) => {
    try {
        // Get token from header
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('Token from Authorization header:', token.substring(0, 10) + '...');
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
            console.log('Token from cookies:', token.substring(0, 10) + '...');
        }

        // Check if token exists
        if (!token) {
            console.log('No auth token provided in request:', {
                headers: req.headers.authorization ? 'Has Authorization header' : 'No Authorization header',
                cookies: req.cookies ? 'Has cookies' : 'No cookies'
            });
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token verified successfully, user ID:', decoded.id);

            // Get user from database
            const result = await pool.request()
                .input('UserID', decoded.id)
                .query('SELECT UserID, Email, FirstName, LastName, Role FROM Users WHERE UserID = @UserID');

            if (result.recordset.length === 0) {
                console.log('User not found in database, ID:', decoded.id);
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Add user to request object
            req.user = result.recordset[0];

            // Important: Make sure 'id' is available for compatibility
            req.user.id = req.user.UserID;

            console.log('User authenticated:', {
                id: req.user.id,
                email: req.user.Email,
                role: req.user.Role
            });

            next();
        } catch (error) {
            console.error('Token verification error:', error.message);

            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired, please login again'
                });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token format'
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in authentication'
        });
    }
};

// Require active account
const requireActivated = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Bạn cần đăng nhập để truy cập trang này'
            });
        }

        // DISABLED: Activation check
        // const isActivated = await isUserActivated(req.user.UserID);
        // if (!isActivated) {
        //     return res.status(403).json({
        //         success: false,
        //         message: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt tài khoản.',
        //         requireActivation: true
        //     });
        // }

        // Always consider the user activated
        console.log('Bypassing activation check - allowing access');

        next();
    } catch (error) {
        console.error('Activation check error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ, vui lòng thử lại sau'
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.Role)) {
            console.log('Unauthorized role access. User role:', req.user.Role, 'Required roles:', roles);
            return res.status(403).json({
                success: false,
                message: `Bạn không có quyền truy cập tính năng này`
            });
        }
        next();
    };
};

module.exports = {
    auth,
    protect: auth, // alias for compatibility
    requireActivated,
    authorize
}; 