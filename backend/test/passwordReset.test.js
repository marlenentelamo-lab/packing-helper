const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { beforeEach, test } = require("node:test");
const bcrypt = require("bcryptjs");

const queries = [];
let user;
let resetTokenFound = true;
let sendPasswordResetEmail;
const pool = {
  async query(text, params) {
    queries.push({ text, params });
    if (text.includes("SELECT id, email FROM users")) {
      return { rows: user ? [{ id: user.id, email: user.email }] : [] };
    }
    return { rows: [] };
  },
  async connect() {
    return {
      async query(text, params) {
        queries.push({ text, params });
        if (text.includes("SELECT user_id FROM password_reset_tokens")) {
          return { rows: resetTokenFound ? [{ user_id: 7 }] : [] };
        }
        if (text.includes("UPDATE users SET password_hash")) {
          return { rows: [{ id: 7 }] };
        }
        return { rows: [] };
      },
      release() {},
    };
  },
};

const dbPath = require.resolve("../db/db");
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: pool,
};

const mailerPath = require.resolve("../services/passwordResetMailer");
require.cache[mailerPath] = {
  id: mailerPath,
  filename: mailerPath,
  loaded: true,
  exports: {
    sendPasswordResetEmail: (...args) => sendPasswordResetEmail(...args),
  },
};

const authController = require("../controllers/authController");

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

beforeEach(() => {
  queries.length = 0;
  user = { id: 7, email: "person@example.com" };
  resetTokenFound = true;
  sendPasswordResetEmail = async () => {};
});

test("password reset requests return the same response for unknown emails", async () => {
  user = null;
  let emailSent = false;
  sendPasswordResetEmail = async () => {
    emailSent = true;
  };
  const res = responseRecorder();

  await authController.requestPasswordReset({ body: { email: "nobody@example.com" } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(emailSent, false);
  assert.equal(
    res.body.message,
    "If an account exists for that email, a password reset link has been sent."
  );
});

test("password reset requests store only a token hash and email the raw token", async () => {
  let emailArgs;
  sendPasswordResetEmail = async (...args) => {
    emailArgs = args;
  };
  const res = responseRecorder();

  await authController.requestPasswordReset({ body: { email: " PERSON@example.com " } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(emailArgs[0], user.email);
  assert.match(emailArgs[1], /^[a-f0-9]{64}$/);
  const storedToken = queries.find(({ text }) => text.includes("INSERT INTO password_reset_tokens"));
  assert.equal(storedToken.params[0], user.id);
  assert.equal(
    storedToken.params[1],
    crypto.createHash("sha256").update(emailArgs[1]).digest("hex")
  );
  assert.equal(storedToken.params.includes(emailArgs[1]), false);
});

test("a valid reset token updates the password and consumes the token", async () => {
  const token = "a".repeat(64);
  const res = responseRecorder();

  await authController.resetPassword({ body: { token, password: "new-password-123" } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "Password has been reset. You can now log in.");
  const update = queries.find(({ text }) => text.includes("UPDATE users SET password_hash"));
  assert.equal(await bcrypt.compare("new-password-123", update.params[0]), true);
  assert.equal(update.params[1], 7);
  assert.ok(queries.some(({ text }) => text === "COMMIT"));
  assert.ok(queries.some(({ text }) => text.includes("DELETE FROM password_reset_tokens")));
});

test("invalid reset tokens and short passwords are rejected", async () => {
  const invalidTokenResponse = responseRecorder();
  await authController.resetPassword({ body: { token: "invalid", password: "new-password-123" } }, invalidTokenResponse);
  assert.equal(invalidTokenResponse.statusCode, 400);

  const shortPasswordResponse = responseRecorder();
  await authController.resetPassword({ body: { token: "a".repeat(64), password: "short" } }, shortPasswordResponse);
  assert.equal(shortPasswordResponse.statusCode, 400);
  assert.equal(queries.length, 0);
});

test("expired reset tokens cannot change a password", async () => {
  resetTokenFound = false;
  const res = responseRecorder();

  await authController.resetPassword(
    { body: { token: "b".repeat(64), password: "new-password-123" } },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.ok(queries.some(({ text }) => text === "ROLLBACK"));
  assert.equal(queries.some(({ text }) => text.includes("UPDATE users SET password_hash")), false);
});
