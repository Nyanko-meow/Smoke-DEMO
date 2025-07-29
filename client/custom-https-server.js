const fs = require("fs");
const https = require("https");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const app = express();

// Cấu hình SSL
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, "ssl", "smokeking.wibu.me.key")),
  cert: fs.readFileSync(path.join(__dirname, "ssl", "smokeking.wibu.me.crt")),
  ca: fs.readFileSync(path.join(__dirname, "ssl", "smokeking.wibu.me.ca")), // Nếu bạn có .pem thì thay .ca
};

// Proxy tất cả request đến React dev server đang chạy tại localhost:3000
app.use(
  "/",
  createProxyMiddleware({
    target: "http://localhost:3000",
    changeOrigin: true,
    secure: false,
  })
);

// Khởi chạy server HTTPS tại port 8443
https.createServer(sslOptions, app).listen(443, () => {
  console.log("✅ HTTPS proxy server running at https://smokeking.wibu.me:443");
});
