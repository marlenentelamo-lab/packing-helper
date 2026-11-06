const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const pool = require("../db/db");
const passwordResetMailer = require("../services/passwordResetMailer");

const PASSWORD_RESET_TTL_MINUTES = 30;
const PASSWORD_RESET_MESSAGE =
  "If an account exists for that email, a password reset link has been sent.";

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

exports.signup = async (req, res) => {
  const { name, email, password, password_hash } = req.body;
  const plainPassword = password ?? password_hash;

  if (!name || !email || !plainPassword) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  if (plainPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  try {
    const passwordHash = await bcrypt.hash(plainPassword, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name.trim(), email.trim().toLowerCase(), passwordHash]
    );

    res.status(201).json({ user: publicUser(rows[0]), message: "Account created." });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "That email is already registered." });
    }

    console.error("Signup failed:", error);
    res.status(500).json({ message: "Could not create account." });
  }
};

exports.login = async (req, res) => {
  const { username, email, password, password_hash } = req.body;
  const loginPassword = password ?? password_hash;
  const loginEmail = (email || username || "").trim().toLowerCase();

  if (!loginEmail || !loginPassword) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const { rows } = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1",
      [loginEmail]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(loginPassword, user.password_hash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    req.session.user = publicUser(user);
    res.json({ user: req.session.user, message: "Logged in successfully." });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Could not log in." });
  }
};

exports.requestPasswordReset = async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const { rows } = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );
    const user = rows[0];

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 minute'))
         ON CONFLICT (user_id) DO UPDATE
         SET token_hash = EXCLUDED.token_hash,
             expires_at = EXCLUDED.expires_at,
             created_at = NOW()`,
        [user.id, tokenHash, PASSWORD_RESET_TTL_MINUTES]
      );

      try {
        await passwordResetMailer.sendPasswordResetEmail(user.email, token);
      } catch (error) {
        await pool.query(
          "DELETE FROM password_reset_tokens WHERE user_id = $1 AND token_hash = $2",
          [user.id, tokenHash]
        );
        console.error("Password reset email failed:", error);
        return res.status(503).json({ message: "Could not send a reset email. Please try again later." });
      }
    }

    return res.json({ message: PASSWORD_RESET_MESSAGE });
  } catch (error) {
    console.error("Password reset request failed:", error);
    return res.status(500).json({ message: "Could not process the password reset request." });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body || {};
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({ message: "This password reset link is invalid or expired." });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  let client;
  let transactionStarted = false;

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const { rows } = await client.query(
      `SELECT user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND expires_at > NOW()
       FOR UPDATE`,
      [tokenHash]
    );
    const resetToken = rows[0];

    if (!resetToken) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(400).json({ message: "This password reset link is invalid or expired." });
    }

    const updatedUser = await client.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id",
      [passwordHash, resetToken.user_id]
    );
    if (updatedUser.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(400).json({ message: "This password reset link is invalid or expired." });
    }

    await client.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [resetToken.user_id]);
    await client.query("COMMIT");
    transactionStarted = false;
    return res.json({ message: "Password has been reset. You can now log in." });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Password reset rollback failed:", rollbackError);
      }
    }
    console.error("Password reset failed:", error);
    return res.status(500).json({ message: "Could not reset the password." });
  } finally {
    client?.release();
  }
};

exports.logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout failed:", error);
      return res.status(500).json({ message: "Could not log out." });
    }

    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully." });
  });
};

exports.currentUser = (req, res) => {
  res.json({ user: req.session.user || null });
};
