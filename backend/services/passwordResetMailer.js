const nodemailer = require("nodemailer");

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT = "587", SMTP_USER, SMTP_PASS } = process.env;
  const port = Number(SMTP_PORT);
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must be configured.");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

exports.sendPasswordResetEmail = async (email, token) => {
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    throw new Error("FRONTEND_URL must be configured to send password reset links.");
  }

  const frontend = new URL(frontendUrl);
  if (
    !["http:", "https:"].includes(frontend.protocol) ||
    frontend.username ||
    frontend.password
  ) {
    throw new Error("FRONTEND_URL must be an HTTP or HTTPS URL without credentials.");
  }

  const resetUrl = new URL("/reset-password", frontend);
  resetUrl.searchParams.set("token", token);
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await getTransporter().sendMail({
    from,
    to: email,
    subject: "Reset your Packing Helper password",
    text: `Use this link to reset your password. It expires in 30 minutes:\n\n${resetUrl}`,
    html: `<p>Use this link to reset your Packing Helper password. It expires in 30 minutes:</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });
};
