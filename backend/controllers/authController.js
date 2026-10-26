const bcrypt = require("bcryptjs");
const pool = require("../db");

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
