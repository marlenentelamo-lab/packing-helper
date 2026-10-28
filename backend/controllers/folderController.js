const pool = require('../db/db');
const cloudinary = require('../config/cloudinary');

const ownedFolder = `(
  EXISTS (
    SELECT 1 FROM moves m
    WHERE m.id = f.move_id AND m.owner_user_id = $2
  )
  OR EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = f.trip_id AND t.owner_user_id = $2
  )
)`;

exports.getFolders = async (req, res) => {
  const { move_id, trip_id } = req.query;

  if ((move_id && trip_id) || (!move_id && !trip_id)) {
    return res
      .status(400)
      .json({ error: 'Provide exactly one of move_id or trip_id' });
  }

  const column = move_id ? 'move_id' : 'trip_id';
  const value = move_id || trip_id;

  try {
    const result = await pool.query(
      `SELECT f.*, COUNT(p.id)::int AS picture_count
       FROM picture_folders f
       LEFT JOIN pictures p ON p.folder_id = f.id
       WHERE f.${column} = $1 AND ${ownedFolder}
       GROUP BY f.id
       ORDER BY f.created_at ASC`,
      [value, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFolderById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT f.* FROM picture_folders f
       WHERE f.id = $1 AND ${ownedFolder}`,
      [id, req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createFolder = async (req, res) => {
  const { folder_name, move_id, trip_id } = req.body;

  if (!folder_name || !folder_name.trim()) {
    return res.status(400).json({ error: 'folder_name is required' });
  }
  if ((move_id && trip_id) || (!move_id && !trip_id)) {
    return res
      .status(400)
      .json({ error: 'Provide exactly one of move_id or trip_id' });
  }

  try {
    const parentTable = move_id ? 'moves' : 'trips';
    const parentId = move_id || trip_id;
    const parent = await pool.query(
      `SELECT id FROM ${parentTable} WHERE id = $1 AND owner_user_id = $2`,
      [parentId, req.user.id]
    );
    if (!parent.rows.length) {
      return res.status(404).json({ error: 'Move or trip not found' });
    }

    const result = await pool.query(
      `INSERT INTO picture_folders (folder_name, move_id, trip_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [folder_name.trim(), move_id || null, trip_id || null]
    );
    res.status(201).json({ ...result.rows[0], picture_count: 0 });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(404).json({ error: 'Move or trip not found' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.updateFolder = async (req, res) => {
  const { id } = req.params;
  const { folder_name } = req.body;

  if (!folder_name || !folder_name.trim()) {
    return res.status(400).json({ error: 'folder_name is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE picture_folders
       SET folder_name = $3
       WHERE id = $1
         AND (
           EXISTS (SELECT 1 FROM moves m WHERE m.id = picture_folders.move_id AND m.owner_user_id = $2)
           OR EXISTS (SELECT 1 FROM trips t WHERE t.id = picture_folders.trip_id AND t.owner_user_id = $2)
         )
       RETURNING *`,
      [id, req.user.id, folder_name.trim()]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteFolder = async (req, res) => {
  const { id } = req.params;

  try {
    const folder = await pool.query(
      `SELECT f.id FROM picture_folders f
       WHERE f.id = $1 AND ${ownedFolder}`,
      [id, req.user.id]
    );
    if (!folder.rows.length) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const pics = await pool.query(
      `SELECT cloudinary_public_id FROM pictures
       WHERE folder_id = $1 AND cloudinary_public_id IS NOT NULL`,
      [id]
    );
    const publicIds = pics.rows.map((r) => r.cloudinary_public_id);

    for (let i = 0; i < publicIds.length; i += 100) {
      await cloudinary.api.delete_resources(publicIds.slice(i, i + 100));
    }

    await pool.query(
      `DELETE FROM picture_folders f
       WHERE f.id = $1
         AND (
           EXISTS (SELECT 1 FROM moves m WHERE m.id = f.move_id AND m.owner_user_id = $2)
           OR EXISTS (SELECT 1 FROM trips t WHERE t.id = f.trip_id AND t.owner_user_id = $2)
         )`,
      [id, req.user.id]
    );
    res.json({ message: 'Folder deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};