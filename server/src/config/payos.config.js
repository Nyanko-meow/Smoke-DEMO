const PayOS = require("@payos/node");

// PayOS configuration với thông tin kênh thanh toán
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || "7f23105c-0e69-414e-b6f7-c46d2b23f788";
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || "fa59a931-943c-47a6-960b-27d2e67aa024";
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || "84c65b5eeae320a84fdf0bc6c44864dfa14950adbdf42189ceb2a7793241b03a";

// Tạo instance PayOS
const payOS = new PayOS(
    PAYOS_CLIENT_ID,
    PAYOS_API_KEY,
    PAYOS_CHECKSUM_KEY
);

// PayOS constants
const PAYOS_CONFIG = {
    RETURN_URL: process.env.PAYOS_RETURN_URL || "http://localhost:3000/membership",
    CANCEL_URL: process.env.PAYOS_CANCEL_URL || "http://localhost:3000/payment-failed",
    WEBHOOK_URL: process.env.PAYOS_WEBHOOK_URL || "http://localhost:4000/api/payment/payos/webhook"
};

module.exports = { 
    payOS, 
    PAYOS_CONFIG,
    PAYOS_CLIENT_ID,
    PAYOS_API_KEY,
    PAYOS_CHECKSUM_KEY
}; 