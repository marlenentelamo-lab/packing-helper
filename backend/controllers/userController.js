const bcrypt = require("bcryptjs");
const pool = require("../db/db");

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    const userId = req.user.id;

    const { rows } = await pool.query(
      `UPDATE users
       SET name = $1,
           email = $2,
           password_hash = COALESCE($3, password_hash)
       WHERE id = $4
       RETURNING id, name, email`,
      [name, email, passwordHash, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const updatedUser = rows[0];

    res.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(400).json({
        message: "That email is already registered.",
      });
    }

    res.status(500).json({
      message: "Could not update profile.",
    });
  }
};