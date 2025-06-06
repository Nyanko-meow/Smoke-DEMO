// Mock nodemailer để tránh lỗi khi không cài đặt gói
// const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

// Tạo một mock transporter thay vì sử dụng nodemailer
const transporter = {
    verify: async () => true,
    sendMail: async (options) => {
        console.log('MOCK EMAIL:', {
            to: options.to,
            subject: options.subject,
            text: 'Email content would be sent here'
        });
        return { messageId: 'mock-message-id-' + Date.now() };
    }
};

// Kiểm tra kết nối email khi khởi động
const verifyMailConnection = async () => {
    console.log('Mock email service is ready (no actual email will be sent)');
    return true;
};

// Tạo token kích hoạt
const generateActivationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Gửi email kích hoạt (mock)
const sendActivationEmail = async (user, token) => {
    console.log('MOCK: Activation email would be sent to:', user.Email);
    console.log(`MOCK: Activation URL would be: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate/${token}`);
    return true;
};

// Gửi email xác nhận kích hoạt thành công (mock)
const sendWelcomeEmail = async (user) => {
    console.log('MOCK: Welcome email would be sent to:', user.Email);
    return true;
};

module.exports = {
    verifyMailConnection,
    generateActivationToken,
    sendActivationEmail,
    sendWelcomeEmail
}; 