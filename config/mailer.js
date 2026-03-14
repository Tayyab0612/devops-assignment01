const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendPasswordResetEmail(toEmail, toName, resetURL) {
  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"/></head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',sans-serif;">
    <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
      <div style="background:linear-gradient(135deg,#6366f1,#7c3aed);padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:1.8rem;">🛒 ShopZone</h1>
      </div>
      <div style="padding:36px 40px;">
        <h2 style="color:#1e293b;margin:0 0 12px;">Reset your password</h2>
        <p style="color:#64748b;line-height:1.7;margin:0 0 28px;">
          Hi <strong>${toName}</strong>,<br/>
          We received a request to reset your ShopZone password. Click the button below — this link expires in <strong>1 hour</strong>.
        </p>
        <a href="${resetURL}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:1rem;">
          Reset My Password
        </a>
        <p style="color:#94a3b8;font-size:.85rem;margin:28px 0 0;line-height:1.6;">
          If you didn't request this, you can safely ignore this email.<br/>
          <a href="${resetURL}" style="color:#6366f1;word-break:break-all;">${resetURL}</a>
        </p>
      </div>
      <div style="background:#f8fafc;padding:16px;text-align:center;color:#94a3b8;font-size:.8rem;border-top:1px solid #e2e8f0;">
        © ${new Date().getFullYear()} ShopZone. All rights reserved.
      </div>
    </div>
  </body>
  </html>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: 'Reset your ShopZone password',
    html
  });
}

module.exports = { sendPasswordResetEmail };
