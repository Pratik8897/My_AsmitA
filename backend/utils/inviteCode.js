const crypto = require("crypto");

const randomString = (bytes = 16) => crypto.randomBytes(bytes).toString("hex");

const generatePassCode = () => String(Math.floor(100000 + Math.random() * 900000)); // 6 digit

const generateQrCodeToken = () => `qr_${randomString(12)}`;

module.exports = {
  generatePassCode,
  generateQrCodeToken,
};

