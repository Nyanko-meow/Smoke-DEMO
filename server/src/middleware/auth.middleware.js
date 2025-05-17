const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const protect = async (req, res, next) => {
    try {
        let token;

        // Check header, cookies, or request body for token
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (req.body && req.body.token) {
            token = req.body.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Bạn cần đăng nhập để truy cập trang này'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if token is expired
            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded.exp && decoded.exp < currentTime) {
                return res.status(401).json({
                    success: false,
                    message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
                });
            }

            // Get user from database
            const result = await pool.request()
                .input('UserID', decoded.id)
                .query('SELECT UserID, Email, FirstName, LastName, Role FROM Users WHERE UserID = @UserID');

            if (result.recordset.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Người dùng không tồn tại'
                });
            }

            req.user = result.recordset[0];
            next();
        } catch (error) {
            console.error('Token verification error:', error.message);

            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token không hợp lệ, vui lòng đăng nhập lại'
                });
            }

            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
                });
            }

            return res.status(401).json({
                success: false,
                message: 'Không được phép truy cập, vui lòng đăng nhập lại'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ, vui lòng thử lại sau'
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.Role)) {
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
    authorize
}; 