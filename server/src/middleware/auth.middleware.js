const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { isUserActivated } = require('../database/db.utils');

// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET not set. Using default value for development only.');
    process.env.JWT_SECRET = 'smokeking_secret_key_ultra_secure_2024';
}

const protect = async (req, res, next) => {
    try {
        let token;

        // Check header, cookies, or request body for token
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('Found token in Authorization header');
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
            console.log('Found token in cookies');
        } else if (req.body && req.body.token) {
            token = req.body.token;
            console.log('Found token in request body');
        }

        if (!token) {
            console.log('No token found in request');
            return res.status(401).json({
                success: false,
                message: 'Bạn cần đăng nhập để truy cập trang này'
            });
        }

        try {
            // Verify token
            console.log('Verifying token...');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token verified successfully:', decoded);

            // Check if token is expired
            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded.exp && decoded.exp < currentTime) {
                console.log('Token expired. Current time:', new Date(currentTime * 1000), 'Expires:', new Date(decoded.exp * 1000));
                return res.status(401).json({
                    success: false,
                    message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
                });
            }

            // Get user from database
            console.log('Getting user from database, UserID:', decoded.id);
            const result = await pool.request()
                .input('UserID', decoded.id)
                .query('SELECT UserID, Email, FirstName, LastName, Role, IsActive FROM Users WHERE UserID = @UserID');

            if (result.recordset.length === 0) {
                console.log('User not found in database');
                return res.status(401).json({
                    success: false,
                    message: 'Người dùng không tồn tại'
                });
            }

            const user = result.recordset[0];
            console.log('User found:', user.Email);

            // Check if account is activated
            if (!user.IsActive) {
                console.log('User account not activated');
                return res.status(403).json({
                    success: false,
                    message: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt tài khoản.',
                    requireActivation: true
                });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('Token verification error:', error.message);

            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token không hợp lệ, vui lòng đăng nhập lại',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

            return res.status(401).json({
                success: false,
                message: 'Không được phép truy cập, vui lòng đăng nhập lại',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ, vui lòng thử lại sau',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

        const isActivated = await isUserActivated(req.user.UserID);
        if (!isActivated) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt tài khoản.',
                requireActivation: true
            });
        }

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
    protect,
    requireActivated,
    authorize
}; 