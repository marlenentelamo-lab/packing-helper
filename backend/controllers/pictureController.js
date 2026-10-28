const pool = require('../db/db');
const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = (buffer, folderPath) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folderPath },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

exports.getPictures = async (req, res) => {
  const { folder_id } = req.query;
  if (!folder_id) return res.status(400).json({ error: 'folder_id is required' });

  try {
    const result = await pool.query(
      `SELECT p.* FROM pictures p
       JOIN picture_folders f ON f.id = p.folder_id
       WHERE f.id = $1
         AND (
           EXISTS (SELECT 1 FROM moves m WHERE m.id = f.move_id AND m.owner_user_id = $2)
           OR EXISTS (SELECT 1 FROM trips t WHERE t.id = f.trip_id AND t.owner_user_id = $2)
         )`,
      [folder_id, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadPictures = async (req, res) => {
  const { folder_id } = req.body;
  if (!folder_id) return res.status(400).json({ error: 'folder_id is required' });
  if (!req.files?.length) return res.status(400).json({ error: 'No images uploaded' });

  try {
    const folder = await pool.query(
      `SELECT f.id FROM picture_folders f
       WHERE f.id = $1
         AND (
           EXISTS (SELECT 1 FROM moves m WHERE m.id = f.move_id AND m.owner_user_id = $2)
           OR EXISTS (SELECT 1 FROM trips t WHERE t.id = f.trip_id AND t.owner_user_id = $2)
         )`,
      [folder_id, req.user.id]
    );
    if (!folder.rows.length) return res.status(404).json({ error: 'Folder not found' });

    const saved = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, `packing-helper/folder-${folder_id}`);
      const row = await pool.query(
        `INSERT INTO pictures (folder_id, cloudinary_url, cloudinary_public_id)
         VALUES ($1, $2, $3) RETURNING *`,
        [folder_id, result.secure_url, result.public_id]
      );
      saved.push(row.rows[0]);
    }
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};