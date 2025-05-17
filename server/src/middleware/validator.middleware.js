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
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
        .matches(/\d/)
        .withMessage('Mật khẩu phải chứa ít nhất một số'),
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
        .isIn(['member', 'coach', 'admin'])
        .withMessage('Vai trò không hợp lệ'),
    validateRequest
];

// Validation rules for user login
const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Vui lòng cung cấp địa chỉ email hợp lệ')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Vui lòng nhập mật khẩu'),
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