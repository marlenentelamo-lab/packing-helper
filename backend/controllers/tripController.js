const pool = require('../db/db');

async function getTrips(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM trips WHERE owner_user_id = $1 ORDER BY trip_date",
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get trips" });
  }
}

async function getTrip(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM trips WHERE id = $1 AND owner_user_id = $2",
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get trip" });
  }
}

async function createTrip(req, res) {
  const { name, trip_date } = req.body;

  if (!name || !trip_date) {
    return res.status(400).json({ error: "name and trip_date are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO trips (name, trip_date, owner_user_id) VALUES ($1, $2, $3) RETURNING *",
      [name, trip_date, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create trip" });
  }
}

async function updateTrip(req, res) {
  const { id } = req.params;
  const { name, trip_date, completion_status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE trips
       SET name = COALESCE($1, name),
           trip_date = COALESCE($2, trip_date),
           completion_status = COALESCE($3, completion_status)
       WHERE id = $4 AND owner_user_id = $5
       RETURNING *`,
      [name ?? null, trip_date ?? null, completion_status ?? null, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update trip" });
  }
}

async function deleteTrip(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM trips WHERE id = $1 AND owner_user_id = $2 RETURNING id",
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete trip" });
  }
}

module.exports = {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip
};