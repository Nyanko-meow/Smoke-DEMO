const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

// Tạo một transporter
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: process.env.MAIL_PORT || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
        user: process.env.MAIL_USER || 'test@example.com',
        pass: process.env.MAIL_PASSWORD || 'your-password'
    }
});

// Kiểm tra kết nối email khi khởi động
const verifyMailConnection = async () => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('Skipping email verification in development mode');
        return;
    }

    try {
        await transporter.verify();
        console.log('Email service is ready');
    } catch (error) {
        console.error('Email service error:', error);
    }
};

// Tạo token kích hoạt
const generateActivationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Gửi email kích hoạt
const sendActivationEmail = async (user, token) => {
    // Nếu môi trường là development, không thực sự gửi email
    if (process.env.NODE_ENV !== 'production') {
        console.log('Email will not be sent in development mode');
        console.log(`Activation URL would be: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate/${token}`);
        return true;
    }

    const activationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate/${token}`;

    try {
        const info = await transporter.sendMail({
            from: `"SmokingCessation" <${process.env.MAIL_FROM || 'noreply@smokingcessation.com'}>`,
            to: user.Email,
            subject: "Kích hoạt tài khoản của bạn",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #333;">Xin chào ${user.FirstName},</h2>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại ứng dụng hỗ trợ cai thuốc lá của chúng tôi.</p>
                    <p>Để kích hoạt tài khoản của bạn, vui lòng nhấp vào nút bên dưới:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${activationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Kích hoạt tài khoản</a>
                    </div>
                    <p>Hoặc bạn có thể copy và paste đường dẫn sau vào trình duyệt:</p>
                    <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">${activationUrl}</p>
                    <p>Đường dẫn này sẽ hết hạn sau 24 giờ.</p>
                    <p>Nếu bạn không yêu cầu tạo tài khoản, vui lòng bỏ qua email này.</p>
                    <hr style="border: 1px solid #e0e0e0; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #777;">© ${new Date().getFullYear()} Smoking Cessation. Tất cả các quyền được bảo lưu.</p>
                </div>
            `
        });

        console.log('Activation email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending activation email:', error);
        return false;
    }
};

// Gửi email xác nhận kích hoạt thành công
const sendWelcomeEmail = async (user) => {
    // Nếu môi trường là development, không thực sự gửi email
    if (process.env.NODE_ENV !== 'production') {
        console.log('Welcome email will not be sent in development mode');
        return true;
    }

    try {
        const info = await transporter.sendMail({
            from: `"SmokingCessation" <${process.env.MAIL_FROM || 'noreply@smokingcessation.com'}>`,
            to: user.Email,
            subject: "Chào mừng đến với ứng dụng hỗ trợ cai thuốc lá",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #333;">Chào mừng ${user.FirstName}!</h2>
                    <p>Tài khoản của bạn đã được kích hoạt thành công.</p>
                    <p>Bạn đã sẵn sàng để bắt đầu hành trình cai thuốc lá của mình. Hãy đăng nhập và thiết lập hồ sơ của bạn để nhận được sự hỗ trợ phù hợp nhất.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Đăng nhập ngay</a>
                    </div>
                    <p>Chúng tôi luôn sẵn sàng hỗ trợ bạn trong suốt quá trình cai thuốc lá.</p>
                    <hr style="border: 1px solid #e0e0e0; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #777;">© ${new Date().getFullYear()} Smoking Cessation. Tất cả các quyền được bảo lưu.</p>
                </div>
            `
        });

        console.log('Welcome email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
};

module.exports = {
    verifyMailConnection,
    generateActivationToken,
    sendActivationEmail,
    sendWelcomeEmail
}; 