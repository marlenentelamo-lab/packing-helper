const pool = require('../db/db');

const ownedTask = `(
  EXISTS (SELECT 1 FROM moves m WHERE m.id = t.move_id AND m.owner_user_id = $1)
  OR EXISTS (SELECT 1 FROM trips tr WHERE tr.id = t.trip_id AND tr.owner_user_id = $1)
)`;

async function getTasks(req, res) {
  const { move_id, trip_id } = req.query;

  if (move_id && trip_id) {
    return res.status(400).json({ error: "Provide only one of move_id or trip_id, not both" });
  }

  try {
    let result;

    if (move_id) {
      result = await pool.query(
        `SELECT t.* FROM tasks t WHERE ${ownedTask} AND t.move_id = $2 ORDER BY t.id`,
        [req.user.id, move_id]
      );
    } else if (trip_id) {
      result = await pool.query(
        `SELECT t.* FROM tasks t WHERE ${ownedTask} AND t.trip_id = $2 ORDER BY t.id`,
        [req.user.id, trip_id]
      );
    } else {
      result = await pool.query(
        `SELECT t.* FROM tasks t WHERE ${ownedTask} ORDER BY t.due_date, t.id`,
        [req.user.id]
      );
    }

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get tasks" });
  }
}

async function getTask(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT t.* FROM tasks t WHERE t.id = $2 AND ${ownedTask}`,
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get task" });
  }
}

async function createTask(req, res) {
  const { task_name, due_date, completion_status, move_id, trip_id } = req.body;

  if (!move_id && !trip_id) {
    return res.status(400).json({ error: "move_id or trip_id is required" });
  }

  if (move_id && trip_id) {
    return res.status(400).json({ error: "Provide only one of move_id or trip_id, not both" });
  }

  try {
    const parentTable = move_id ? "moves" : "trips";
    const parentId = move_id || trip_id;
    const parent = await pool.query(
      `SELECT id FROM ${parentTable} WHERE id = $1 AND owner_user_id = $2`,
      [parentId, req.user.id]
    );
    if (parent.rows.length === 0) {
      return res.status(404).json({ error: "Move or trip not found" });
    }

    const result = await pool.query(
      `INSERT INTO tasks (task_name, due_date, completion_status, move_id, trip_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [task_name, due_date, completion_status ?? false, move_id ?? null, trip_id ?? null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create task" });
  }
}

async function updateTask(req, res) {
  const { id } = req.params;
  const { task_name, due_date, completion_status, move_id, trip_id } = req.body;
  const hasMoveId = Object.hasOwn(req.body, "move_id");
  const hasTripId = Object.hasOwn(req.body, "trip_id");

  if (hasMoveId && hasTripId && move_id && trip_id) {
    return res.status(400).json({ error: "Provide only one of move_id or trip_id, not both" });
  }

  try {
    const existingResult = await pool.query(
      `SELECT t.* FROM tasks t WHERE t.id = $2 AND ${ownedTask}`,
      [req.user.id, id]
    );
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const existing = existingResult.rows[0];
    let nextMoveId = existing.move_id;
    let nextTripId = existing.trip_id;
    if (hasMoveId && move_id) {
      nextMoveId = move_id;
      nextTripId = null;
    } else if (hasTripId && trip_id) {
      nextMoveId = null;
      nextTripId = trip_id;
    } else if (hasMoveId && !move_id && !existing.trip_id) {
      nextMoveId = null;
    } else if (hasTripId && !trip_id && !existing.move_id) {
      nextTripId = null;
    }

    if ((!nextMoveId && !nextTripId) || (nextMoveId && nextTripId)) {
      return res.status(400).json({ error: "Task must belong to exactly one move or trip" });
    }

    const parentTable = nextMoveId ? "moves" : "trips";
    const parentId = nextMoveId || nextTripId;
    const parent = await pool.query(
      `SELECT id FROM ${parentTable} WHERE id = $1 AND owner_user_id = $2`,
      [parentId, req.user.id]
    );
    if (parent.rows.length === 0) {
      return res.status(404).json({ error: "Move or trip not found" });
    }

    const result = await pool.query(
      `UPDATE tasks AS t
       SET task_name = $1, due_date = $2, completion_status = $3,
           move_id = $4, trip_id = $5
       WHERE t.id = $6 AND (
         EXISTS (SELECT 1 FROM moves m WHERE m.id = t.move_id AND m.owner_user_id = $7)
         OR EXISTS (SELECT 1 FROM trips tr WHERE tr.id = t.trip_id AND tr.owner_user_id = $7)
       )
       RETURNING *`,
      [
        task_name ?? existing.task_name,
        due_date ?? existing.due_date,
        completion_status ?? existing.completion_status,
        nextMoveId,
        nextTripId,
        id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update task" });
  }
}

async function deleteTask(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM tasks t WHERE t.id = $2 AND ${ownedTask} RETURNING t.id`,
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete task" });
  }
}

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
};