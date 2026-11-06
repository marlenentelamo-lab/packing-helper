const assert = require("node:assert/strict");
const { afterEach, beforeEach, test } = require("node:test");
const nodemailer = require("nodemailer");
const { sendPasswordResetEmail } = require("../services/passwordResetMailer");

const originalCreateTransport = nodemailer.createTransport;
const environmentKeys = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "FRONTEND_URL",
];
let originalEnvironment;
let sentMessage;

beforeEach(() => {
  originalEnvironment = Object.fromEntries(
    environmentKeys.map((key) => [key, process.env[key]])
  );
  Object.assign(process.env, {
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "587",
    SMTP_USER: "mailer@example.com",
    SMTP_PASS: "test-password",
    SMTP_FROM: "Packing Helper <no-reply@example.com>",
    FRONTEND_URL: "https://app.example.com",
  });
  nodemailer.createTransport = () => ({
    sendMail: async (message) => {
      sentMessage = message;
    },
  });
});

afterEach(() => {
  nodemailer.createTransport = originalCreateTransport;
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("sends a reset link to the configured frontend", async () => {
  const token = "a".repeat(64);
  await sendPasswordResetEmail("person@example.com", token);

  assert.equal(sentMessage.to, "person@example.com");
  assert.equal(sentMessage.from, "Packing Helper <no-reply@example.com>");
  assert.match(sentMessage.text, new RegExp(`https://app\\.example\\.com/reset-password\\?token=${token}`));
  assert.match(sentMessage.html, new RegExp(`href="https://app\\.example\\.com/reset-password\\?token=${token}"`));
});

test("does not attempt delivery without SMTP configuration", async () => {
  delete process.env.SMTP_PASS;
  await assert.rejects(
    sendPasswordResetEmail("person@example.com", "a".repeat(64)),
    /SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS/
  );
});
