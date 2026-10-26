const pool = require('../db');

async function getMoves(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM moves WHERE owner_user_id = $1 ORDER BY target_date",
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get moves" });
  }
}

async function getMove(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM moves WHERE id = $1 AND owner_user_id = $2",
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Move not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get move" });
  }
}

async function createMove(req, res) {
  const { name, target_date } = req.body;

  if (!name || !target_date) {
    return res.status(400).json({ error: "name and target_date are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO moves (name, target_date, owner_user_id) VALUES ($1, $2, $3) RETURNING *",
      [name, target_date, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create move" });
  }
}

async function updateMove(req, res) {
  const { id } = req.params;
  const { name, target_date, completion_status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE moves
       SET name = COALESCE($1, name),
           target_date = COALESCE($2, target_date),
           completion_status = COALESCE($3, completion_status)
       WHERE id = $4 AND owner_user_id = $5
       RETURNING *`,
      [name ?? null, target_date ?? null, completion_status ?? null, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Move not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update move" });
  }
}

async function deleteMove(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM moves WHERE id = $1 AND owner_user_id = $2 RETURNING id",
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Move not found" });
    }

    res.json({ message: "Move deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete move" });
  }
}

module.exports = {
  getMoves,
  getMove,
  createMove,
  updateMove,
  deleteMove
};