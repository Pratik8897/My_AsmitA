const nodemailer = require("nodemailer");

const getSmtpConfig = () => ({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || "true").toLowerCase() === "true",
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport(getSmtpConfig());
  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  const from =
    process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@example.com";

  return getTransporter().sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendMail,
};

