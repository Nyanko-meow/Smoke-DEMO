const { body, validationResult } = require('express-validator');

// Middleware to return validation errors
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Validation rules for user registration
const registerValidation = [
    body('email')
        .isEmail()
        .withMessage('Vui lòng cung cấp địa chỉ email hợp lệ')
        .custom(email => {
            // Validate gmail addresses
            if (email.toLowerCase().endsWith('@gmail.com')) {
                return true;
            }
            throw new Error('Email phải là tài khoản Gmail');
        })
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Mật khẩu phải có ít nhất 8 ký tự')
        .matches(/\d/)
        .withMessage('Mật khẩu phải chứa ít nhất một số')
        .matches(/[!@#$%^&*(),.?":{}|<>]/)
        .withMessage('Mật khẩu phải chứa ít nhất một ký tự đặc biệt'),
    body('phoneNumber')
        .optional()
        .isLength({ min: 10 })
        .withMessage('Số điện thoại phải có ít nhất 10 chữ số')
        .matches(/^\d+$/)
        .withMessage('Số điện thoại chỉ được chứa các chữ số'),
    body('firstName')
        .notEmpty()
        .withMessage('Tên không được bỏ trống')
        .trim(),
    body('lastName')
        .notEmpty()
        .withMessage('Họ không được bỏ trống')
        .trim(),
    body('role')
        .optional()
        .isIn(['guest', 'member', 'coach', 'admin'])
        .withMessage('Vai trò không hợp lệ'),
    validateRequest
];

// Validation rules for user login
const loginValidation = [
    body('email')
        .optional()
        .isEmail()
        .withMessage('Vui lòng cung cấp địa chỉ email hợp lệ')
        .normalizeEmail(),
    body('phoneNumber')
        .optional()
        .isLength({ min: 10 })
        .withMessage('Số điện thoại phải có ít nhất 10 chữ số')
        .matches(/^\d+$/)
        .withMessage('Số điện thoại chỉ được chứa các chữ số'),
    body('password')
        .notEmpty()
        .withMessage('Vui lòng nhập mật khẩu'),
    (req, res, next) => {
        // Check if at least one identifier is provided
        if (!req.body.email && !req.body.phoneNumber) {
            return res.status(400).json({
                success: false,
                errors: [{ msg: 'Vui lòng cung cấp email hoặc số điện thoại' }]
            });
        }
        next();
    },
    validateRequest
];

// Validation rules for user profile update
const profileUpdateValidation = [
    body('firstName')
        .optional()
        .notEmpty()
        .withMessage('Tên không được bỏ trống')
        .trim(),
    body('lastName')
        .optional()
        .notEmpty()
        .withMessage('Họ không được bỏ trống')
        .trim(),
    body('phoneNumber')
        .optional()
        .isMobilePhone('any')
        .withMessage('Số điện thoại không hợp lệ'),
    body('address')
        .optional()
        .trim(),
    validateRequest
];

module.exports = {
    registerValidation,
    loginValidation,
    profileUpdateValidation
}; 