// utils/email.util.js
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { pool } = require('../config/database');

dotenv.config();

/* ===================================================================
 *  DATE HELPERS  (ƯU TIÊN STRING, TRÁNH LỆCH TZ)
 * =================================================================== */
const buildPaymentDateFromSql = (raw) => {
  if (!raw) return 'Chưa xác định';

  // 1) String dạng 'yyyy-MM-dd HH:mm:ss(.fff)'
  if (typeof raw === 'string') {
    const m = raw.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (m) {
      const [, y, mo, d, h, mi] = m;
      return `lúc ${h}:${mi} ${d} tháng ${mo}, ${y}`;
    }
    return 'Chưa xác định';
  }

  // 2) Không khuyến khích: nếu raw là Date ⇒ dùng UTC getters để tránh lệch
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    const h  = String(raw.getUTCHours()).padStart(2, '0');
    const mi = String(raw.getUTCMinutes()).padStart(2, '0');
    const d  = String(raw.getUTCDate()).padStart(2, '0');
    const mo = String(raw.getUTCMonth() + 1).padStart(2, '0');
    const y  = raw.getUTCFullYear();
    return `lúc ${h}:${mi} ${d} tháng ${mo}, ${y}`;
  }

  // 3) Fallback parse
  const dt = new Date(raw);
  if (!isNaN(dt.getTime())) {
    const h  = String(dt.getUTCHours()).padStart(2, '0');
    const mi = String(dt.getUTCMinutes()).padStart(2, '0');
    const d  = String(dt.getUTCDate()).padStart(2, '0');
    const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const y  = dt.getUTCFullYear();
    return `lúc ${h}:${mi} ${d} tháng ${mo}, ${y}`;
  }
  return 'Chưa xác định';
};

const formatDateDDMMYYYY = (raw) => {
  if (!raw) return 'Chưa xác định';

  if (typeof raw === 'string') {
    const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const [, y, mo, d] = m;
      return `${d}/${mo}/${y}`;
    }
  }

  const d = new Date(raw);
  if (isNaN(d.getTime())) return 'Chưa xác định';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/**
 * Lấy ngày hết hạn hiển thị:
 */
const pickExpiry = async (payment, plan) => {
  // 1) Có sẵn trong payment
  if (payment?.MembershipEndDate)
    return formatDateDDMMYYYY(payment.MembershipEndDate);
  if (payment?.UserMembershipEndDate)
    return formatDateDDMMYYYY(payment.UserMembershipEndDate);
  if (payment?.FormattedEndDate) return payment.FormattedEndDate;

  // 2) Query UserMemberships
  try {
    const rs = await pool
      .request()
      .input('UserID', payment.UserID)
      .input('PlanID', payment.PlanID)
      .query(`
        SELECT TOP (1) EndDate
        FROM UserMemberships
        WHERE UserID = @UserID AND PlanID = @PlanID AND Status = 'active'
        ORDER BY EndDate DESC
      `);

    if (rs.recordset.length) {
      const endDate = rs.recordset[0].EndDate;
      const f = formatDateDDMMYYYY(endDate);
      if (f) return f;
    }
  } catch (err) {
    console.error('⚠️ pickExpiry query UserMemberships error:', err.message);
  }

  // 3) Fallback PaymentDate + Duration
  if (payment?.PaymentDate && plan?.Duration) {
    let base;
    if (typeof payment.PaymentDate === 'string') {
      const m = payment.PaymentDate.match(/(\d{4})-(\d{2})-(\d{2})/);
      base = m
        ? new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
        : new Date(payment.PaymentDate);
    } else {
      base = new Date(payment.PaymentDate);
    }

    if (!isNaN(base.getTime())) {
      base.setDate(base.getDate() + plan.Duration);
      return formatDateDDMMYYYY(base);
    }
  }
  return 'Chưa xác định';
};

/* ===================================================================
 *  NODEMAILER TRANSPORT
 * =================================================================== */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'wibuclient@gmail.com',
    pass: process.env.SMTP_PASS || 'zvhw mkkm yrgl zpqf', // TODO: move to ENV
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
  debug: true,
  logger: true,
});

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

/* ===================================================================
 *  TOKEN
 * =================================================================== */
const generateActivationToken = () => crypto.randomBytes(32).toString('hex');

/* ===================================================================
 *  EMAILS
 * =================================================================== */
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
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              🔓 Kích hoạt tài khoản
            </a>
          </div>
          <p style="color: #999; font-size: 14px; line-height: 1.5;">
            Nếu nút không hoạt động, copy link sau vào trình duyệt:<br>
            <span style="background: #f1f3f4; padding: 5px; border-radius: 4px; word-break: break-all;">${activationUrl}</span>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
            <strong>SmokeKing Team</strong><br>Đồng hành cùng bạn trên hành trình cai thuốc lá! 💪
          </p>
        </div>
      </div>`;

    await transporter.sendMail({
      from: 'SmokeKing <wibuclient@gmail.com>',
      to: user.Email,
      subject: '[SmokeKing] 🚭 Kích hoạt tài khoản của bạn',
      html,
    });

    console.log('✅ Activation email sent to:', user.Email);
    return true;
  } catch (error) {
    console.error('❌ Failed to send activation email:', error);
    throw error;
  }
};

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
            Tài khoản của bạn đã được kích hoạt thành công! Chào mừng bạn đến với cộng đồng <strong>SmokeKing</strong>.
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
               style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              🔑 Đăng nhập ngay
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
            <strong>SmokeKing Team</strong><br>Chúng tôi tin bạn sẽ thành công! 💪
          </p>
        </div>
      </div>`;

    await transporter.sendMail({
      from: 'SmokeKing <wibuclient@gmail.com>',
      to: user.Email,
      subject: '[SmokeKing] 🎉 Chào mừng bạn đến với SmokeKing!',
      html,
    });

    console.log('✅ Welcome email sent to:', user.Email);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    throw error;
  }
};

const sendPaymentInvoiceEmail = async ({ user, payment, plan, orderCode }) => {
  try {
    console.log('📧 sendPaymentInvoiceEmail start');
    const ok = await verifyMailConnection();
    if (!ok) throw new Error('Email connection not available');

    const rawDate =
      payment.PaymentDateStr ||
      payment.PaymentDateSql ||
      (typeof payment.PaymentDate === 'string' ? payment.PaymentDate : payment.PaymentDate);

    const formattedDate = buildPaymentDateFromSql(rawDate);

    const formattedAmount = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(payment.Amount);

    const formattedExpiryDate = await pickExpiry(payment, plan);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🧾 HÓA ĐƠN THANH TOÁN</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">SmokeKing - Đồng hành cùng bạn cai thuốc lá</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">👤 Thông tin khách hàng</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <p style="margin: 5px 0; color: #333;"><strong>Họ tên:</strong> ${user.FirstName} ${user.LastName}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${user.Email}</p>
              ${user.PhoneNumber ? `<p style="margin: 5px 0; color: #333;"><strong>Số điện thoại:</strong> ${user.PhoneNumber}</p>` : ''}
            </div>
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">📋 Chi tiết hóa đơn</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <p style="margin: 5px 0; color: #333;"><strong>Mã đơn hàng:</strong> <span style="background: #e3f2fd; padding: 3px 8px; border-radius: 4px; font-family: monospace;">${orderCode || payment.TransactionID}</span></p>
              <p style="margin: 5px 0; color: #333;"><strong>Ngày thanh toán:</strong> ${formattedDate}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Phương thức:</strong> PayOS - Thanh toán online</p>
              <p style="margin: 5px 0; color: #333;"><strong>Trạng thái:</strong> <span style="background: #c8e6c9; color: #2e7d32; padding: 3px 8px; border-radius: 4px; font-weight: bold;">✅ Đã thanh toán</span></p>
            </div>
          </div>

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

          <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">💳 TỔNG THANH TOÁN</h2>
            <p style="color: white; font-size: 32px; font-weight: bold; margin: 10px 0 0 0;">${formattedAmount}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              🚀 Truy cập dịch vụ ngay
            </a>
          </div>

          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800;">
            <h3 style="color: #e65100; margin: 0 0 10px 0;">📞 Hỗ trợ khách hàng</h3>
            <p style="color: #bf360c; margin: 5px 0;">Nếu bạn có bất kỳ thắc mắc nào về hóa đơn này, vui lòng liên hệ:</p>
            <p style="color: #bf360c; margin: 5px 0;"><strong>Email:</strong> support@smokeking.vn</p>
            <p style="color: #bf360c; margin: 5px 0;"><strong>Hotline:</strong> 1900-xxxx</p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <div style="text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              <strong>SmokeKing Team</strong><br>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ! 💚
            </p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
              Đây là email tự động, vui lòng không reply trực tiếp.
            </p>
          </div>
        </div>
      </div>`;

    await transporter.sendMail({
      from: 'SmokeKing <wibuclient@gmail.com>',
      to: user.Email,
      subject: `[SmokeKing] 🧾 Hóa đơn thanh toán #${orderCode || payment.TransactionID} - ${plan.Name}`,
      html,
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

/* ===================================================================
 *  MULTI SMTP TEST
 * =================================================================== */
const testSMTPConnections = async (smtpConfigs) => {
  const nodemailer2 = require('nodemailer');
  const results = [];
  for (const config of smtpConfigs) {
    try {
      const t = nodemailer2.createTransport(config);
      await t.verify();
      results.push({
        config: { ...config, auth: { ...config.auth, pass: '***' } },
        success: true,
        message: 'Kết nối thành công!',
      });
    } catch (error) {
      results.push({
        config: { ...config, auth: { ...config.auth, pass: '***' } },
        success: false,
        message: error.message,
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
  sendPaymentInvoiceEmail,
  testSMTPConnections,
  // optional exports
  buildPaymentDateFromSql,
  formatDateDDMMYYYY,
  pickExpiry,
};
