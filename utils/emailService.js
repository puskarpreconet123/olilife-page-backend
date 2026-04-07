const nodemailer = require("nodemailer");

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS  // Gmail App Password (not account password)
    }
  });
}

async function sendOtpEmail(to, otp) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Olilife" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Olilife verification code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f5f5dc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="display:inline-block;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#1b5e20,#4caf50);color:#fff;font-size:1.4rem;line-height:48px;text-align:center;">🌿</span>
          <h2 style="margin:12px 0 4px;color:#1b5e20;">Verify your email</h2>
          <p style="margin:0;color:rgba(62,39,35,0.7);font-size:0.9rem;">Use the code below to complete your Olilife signup.</p>
        </div>
        <div style="text-align:center;background:#fff;border-radius:14px;padding:28px 20px;box-shadow:0 4px 16px rgba(27,94,32,0.1);">
          <p style="margin:0 0 8px;font-size:0.82rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(62,39,35,0.5);">One-time code</p>
          <div style="font-size:2.4rem;font-weight:800;letter-spacing:0.18em;color:#1b5e20;">${otp}</div>
          <p style="margin:14px 0 0;font-size:0.82rem;color:rgba(62,39,35,0.55);">Expires in <strong>2 minutes</strong></p>
        </div>
        <p style="margin:20px 0 0;text-align:center;font-size:0.78rem;color:rgba(62,39,35,0.45);">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  });
}

async function sendPasswordResetEmail(to, otp) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Olilife" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your Olilife password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f5f5dc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="display:inline-block;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#1b5e20,#4caf50);color:#fff;font-size:1.4rem;line-height:48px;text-align:center;">🔐</span>
          <h2 style="margin:12px 0 4px;color:#1b5e20;">Reset your password</h2>
          <p style="margin:0;color:rgba(62,39,35,0.7);font-size:0.9rem;">Use the code below to set a new password for your Olilife account.</p>
        </div>
        <div style="text-align:center;background:#fff;border-radius:14px;padding:28px 20px;box-shadow:0 4px 16px rgba(27,94,32,0.1);">
          <p style="margin:0 0 8px;font-size:0.82rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(62,39,35,0.5);">One-time code</p>
          <div style="font-size:2.4rem;font-weight:800;letter-spacing:0.18em;color:#1b5e20;">${otp}</div>
          <p style="margin:14px 0 0;font-size:0.82rem;color:rgba(62,39,35,0.55);">Expires in <strong>10 minutes</strong></p>
        </div>
        <p style="margin:20px 0 0;text-align:center;font-size:0.78rem;color:rgba(62,39,35,0.45);">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `
  });
}

module.exports = { sendOtpEmail, sendPasswordResetEmail };
