const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

// Cấu hình nodemailer với TLS port 465 - sử dụng thật thay vì mock
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for SSL/TLS on port 465
    auth: {
        user: 'wibuclient@gmail.com',
        pass: 'zvhw mkkm yrgl zpqf', // App password
    },
    tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
    },
    connectionTimeout: 60000, // 60 giây
    greetingTimeout: 30000,   // 30 giây
    socketTimeout: 60000,     // 60 giây
    debug: true, // Enable debug logs
    logger: true // Enable logs
});

// Verify connection on startup
const verifyMailConnection = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email transporter is ready to send messages (TLS 465)');
        return true;
    } catch (error) {
        console.log('❌ Email transporter verification failed:', error);
        return false;
    }
};

// Tạo token kích hoạt
const generateActivationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Gửi email kích hoạt
const sendActivationEmail = async (user, token) => {
    try {
        const activationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate/${token}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🚭 SmokeKing</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Chào mừng bạn đến với hành trình cai thuốc lá!</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-bottom: 20px;">Xin chào ${user.FirstName} ${user.LastName}!</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                        Cảm ơn bạn đã đăng ký tài khoản tại <strong>SmokeKing</strong>. 
                        Để hoàn tất quá trình đăng ký, vui lòng click vào nút bên dưới để kích hoạt tài khoản:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${activationUrl}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 25px; 
                                  font-weight: bold;
                                  display: inline-block;
                                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                            🔓 Kích hoạt tài khoản
                        </a>
                    </div>
                    
                    <p style="color: #999; font-size: 14px; line-height: 1.5;">
                        Nếu nút không hoạt động, bạn có thể copy link sau vào trình duyệt:<br>
                        <span style="background: #f1f3f4; padding: 5px; border-radius: 4px; word-break: break-all;">${activationUrl}</span>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
                        <strong>SmokeKing Team</strong><br>
                        Đồng hành cùng bạn trên hành trình cai thuốc lá! 💪
                    </p>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: 'SmokeKing <wibuclient@gmail.com>',
            to: user.Email,
            subject: '[SmokeKing] 🚭 Kích hoạt tài khoản của bạn',
            html
        });

        console.log('✅ Activation email sent to:', user.Email);
        return true;
    } catch (error) {
        console.error('❌ Failed to send activation email:', error);
        throw error;
    }
};

// Gửi email chào mừng
const sendWelcomeEmail = async (user) => {
    try {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Chào mừng đến với SmokeKing!</h1>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #333;">Xin chào ${user.FirstName} ${user.LastName}!</h2>
                    
                    <p style="color: #666; line-height: 1.6;">
                        Tài khoản của bạn đã được kích hoạt thành công! Chào mừng bạn đến với cộng đồng <strong>SmokeKing</strong> - 
                        nơi đồng hành cùng bạn trên hành trình cai thuốc lá.
                    </p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">🚀 Bắt đầu hành trình của bạn:</h3>
                        <ul style="color: #666; line-height: 1.8;">
                            <li>📊 Theo dõi tiến trình cai thuốc</li>
                            <li>👩‍⚕️ Tư vấn với coach chuyên nghiệp</li>
                            <li>🏆 Nhận huy hiệu thành tích</li>
                            <li>👥 Tham gia cộng đồng hỗ trợ</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                           style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 25px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            🔑 Đăng nhập ngay
                        </a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
                        <strong>SmokeKing Team</strong><br>
                        Chúng tôi tin bạn sẽ thành công! 💪
                    </p>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: 'SmokeKing <wibuclient@gmail.com>',
            to: user.Email,
            subject: '[SmokeKing] 🎉 Chào mừng bạn đến với SmokeKing!',
            html
        });

        console.log('✅ Welcome email sent to:', user.Email);
        return true;
    } catch (error) {
        console.error('❌ Failed to send welcome email:', error);
        throw error;
    }
};

// 🆕 THÊM FUNCTION GỬI EMAIL BILL THANH TOÁN
const sendPaymentInvoiceEmail = async ({ user, payment, plan, orderCode }) => {
    try {
        console.log('📧 Starting sendPaymentInvoiceEmail process...');
        console.log('  - Recipient:', user.Email);
        console.log('  - Order Code:', orderCode);
        console.log('  - Plan:', plan.Name);
        console.log('  - Amount:', payment.Amount);

        // Verify connection trước khi gửi
        const connectionOk = await verifyMailConnection();
        if (!connectionOk) {
            throw new Error('Email connection not available');
        }

        // 🆕 CÁCH FIX MỚI: Lấy thời gian gốc từ database mà không convert timezone
        console.log('🕐 Original payment date from DB:', payment.PaymentDate);
        
        // Cách 1: Parse datetime string trực tiếp (không auto-convert timezone)
        const paymentDateStr = payment.PaymentDate.toString();
        const paymentDateParts = paymentDateStr.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
        
        let formattedDate;
        if (paymentDateParts) {
            const [, year, month, day, hour, minute] = paymentDateParts;
            formattedDate = `lúc ${hour}:${minute} ${day} tháng ${month}, ${year}`;
            console.log('🕐 Manual formatted date:', formattedDate);
        } else {
            // Fallback: Sử dụng thời gian UTC mà không convert
            const paymentDate = new Date(payment.PaymentDate);
            const year = paymentDate.getUTCFullYear();
            const month = paymentDate.getUTCMonth() + 1;
            const day = paymentDate.getUTCDate();
            const hour = paymentDate.getUTCHours();
            const minute = paymentDate.getUTCMinutes();
            
            formattedDate = `lúc ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${day} tháng ${month}, ${year}`;
            console.log('🕐 UTC formatted date (fallback):', formattedDate);
        }

        const formattedAmount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(payment.Amount);

        // 🆕 SỬ DỤNG EndDate TỪ DATABASE thay vì tính toán
        let formattedExpiryDate;
        
        if (payment.FormattedEndDate) {
            // Đã có sẵn format từ database
            formattedExpiryDate = payment.FormattedEndDate;
            console.log('📅 Using EndDate from database:', formattedExpiryDate);
        } else if (payment.MembershipEndDate) {
            // Parse EndDate từ database
            const endDateStr = payment.MembershipEndDate.toString();
            const endDateParts = endDateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
            
            if (endDateParts) {
                const [, year, month, day] = endDateParts;
                formattedExpiryDate = `${day}/${month}/${year}`;
            } else {
                const endDate = new Date(payment.MembershipEndDate);
                formattedExpiryDate = `${endDate.getDate().toString().padStart(2, '0')}/${(endDate.getMonth() + 1).toString().padStart(2, '0')}/${endDate.getFullYear()}`;
            }
            console.log('📅 Parsed EndDate from database:', formattedExpiryDate);
        } else {
            // Fallback: Tính toán từ PaymentDate + Duration (chỉ khi không có data từ UserMemberships)
            console.log('⚠️ No membership EndDate found, calculating from PaymentDate + Duration');
            const paymentDateParts = paymentDateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
            
            if (paymentDateParts && plan.Duration) {
                const [, year, month, day] = paymentDateParts;
                const paymentDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                const expiryDate = new Date(paymentDate);
                expiryDate.setDate(expiryDate.getDate() + plan.Duration);
                formattedExpiryDate = `${expiryDate.getDate().toString().padStart(2, '0')}/${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear()}`;
            } else {
                formattedExpiryDate = 'Chưa xác định';
            }
        }
        
        console.log('📅 Final expiry date for email:', formattedExpiryDate);

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🧾 HÓA ĐƠN THANH TOÁN</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">SmokeKing - Đồng hành cùng bạn cai thuốc lá</p>
                </div>
                
                <!-- Bill Content -->
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <!-- Customer Info -->
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">👤 Thông tin khách hàng</h2>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                            <p style="margin: 5px 0; color: #333;"><strong>Họ tên:</strong> ${user.FirstName} ${user.LastName}</p>
                            <p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${user.Email}</p>
                            ${user.PhoneNumber ? `<p style="margin: 5px 0; color: #333;"><strong>Số điện thoại:</strong> ${user.PhoneNumber}</p>` : ''}
                        </div>
                    </div>

                    <!-- Invoice Details -->
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">📋 Chi tiết hóa đơn</h2>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                            <p style="margin: 5px 0; color: #333;"><strong>Mã đơn hàng:</strong> <span style="background: #e3f2fd; padding: 3px 8px; border-radius: 4px; font-family: monospace;">${orderCode || payment.TransactionID}</span></p>
                            <p style="margin: 5px 0; color: #333;"><strong>Ngày thanh toán:</strong> ${formattedDate}</p>
                            <p style="margin: 5px 0; color: #333;"><strong>Phương thức:</strong> PayOS - Thanh toán online</p>
                            <p style="margin: 5px 0; color: #333;"><strong>Trạng thái:</strong> <span style="background: #c8e6c9; color: #2e7d32; padding: 3px 8px; border-radius: 4px; font-weight: bold;">✅ Đã thanh toán</span></p>
                        </div>
                    </div>

                    <!-- Package Details -->
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">📦 Thông tin gói dịch vụ</h2>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                            <h3 style="color: #667eea; margin: 0 0 10px 0; font-size: 20px;">${plan.Name}</h3>
                            <p style="margin: 5px 0; color: #666; line-height: 1.6;">${plan.Description}</p>
                            <div style="margin-top: 15px;">
                                <p style="margin: 5px 0; color: #333;"><strong>💰 Giá gói:</strong> <span style="font-size: 18px; color: #4caf50; font-weight: bold;">${formattedAmount}</span></p>
                                <p style="margin: 5px 0; color: #333;"><strong>⏰ Thời hạn:</strong> ${plan.Duration} ngày</p>
                                <p style="margin: 5px 0; color: #333;"><strong>📅 Có hiệu lực đến:</strong> ${formattedExpiryDate}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Total Amount Box -->
                    <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
                        <h2 style="color: white; margin: 0; font-size: 24px;">💳 TỔNG THANH TOÁN</h2>
                        <p style="color: white; font-size: 32px; font-weight: bold; margin: 10px 0 0 0;">${formattedAmount}</p>
                    </div>

                    <!-- Action Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 25px; 
                                  font-weight: bold;
                                  display: inline-block;
                                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                            🚀 Truy cập dịch vụ ngay
                        </a>
                    </div>

                    <!-- Support Info -->
                    <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800;">
                        <h3 style="color: #e65100; margin: 0 0 10px 0;">📞 Hỗ trợ khách hàng</h3>
                        <p style="color: #bf360c; margin: 5px 0;">Nếu bạn có bất kỳ thắc mắc nào về hóa đơn này, vui lòng liên hệ:</p>
                        <p style="color: #bf360c; margin: 5px 0;"><strong>Email:</strong> support@smokeking.vn</p>
                        <p style="color: #bf360c; margin: 5px 0;"><strong>Hotline:</strong> 1900-xxxx</p>
                    </div>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <!-- Footer -->
                    <div style="text-align: center;">
                        <p style="color: #666; font-size: 14px; margin: 0;">
                            <strong>SmokeKing Team</strong><br>
                            Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ! 💚
                        </p>
                        <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                            Đây là email tự động, vui lòng không reply trực tiếp.
                        </p>
                    </div>
                </div>
            </div>
        `;

        console.log('📤 Sending email via transporter...');
        
        await transporter.sendMail({
            from: 'SmokeKing <wibuclient@gmail.com>',
            to: user.Email,
            subject: `[SmokeKing] 🧾 Hóa đơn thanh toán #${orderCode || payment.TransactionID} - ${plan.Name}`,
            html
        });

        console.log('✅ Payment invoice email sent successfully to:', user.Email);
        return true;
    } catch (error) {
        console.error('❌ Failed to send payment invoice email:', error);
        console.error('🔍 Error details:', error.message);
        console.error('🔍 Error stack:', error.stack);
        throw error;
    }
};

// 🆕 THÊM FUNCTION TEST NHIỀU SMTP
const testSMTPConnections = async (smtpConfigs) => {
    const nodemailer = require('nodemailer');
    const results = [];
    for (const config of smtpConfigs) {
        try {
            const transporter = nodemailer.createTransport(config);
            await transporter.verify();
            results.push({
                config: { ...config, auth: { ...config.auth, pass: '***' } },
                success: true,
                message: 'Kết nối thành công!'
            });
        } catch (error) {
            results.push({
                config: { ...config, auth: { ...config.auth, pass: '***' } },
                success: false,
                message: error.message
            });
        }
    }
    return results;
};

module.exports = {
    verifyMailConnection,
    generateActivationToken,
    sendActivationEmail,
    sendWelcomeEmail,
    sendPaymentInvoiceEmail, // 🆕 Export function mới
    testSMTPConnections // 🆕 Export function test nhiều SMTP
}; 