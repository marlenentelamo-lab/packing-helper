const express = require('express');
const { ensureAuth } = require('../middleware/authMiddleware');
const {
  getFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
} = require('../controllers/folderController');

const router = express.Router();

router.use(ensureAuth);
router.get('/', getFolders);          // GET    /picture-folders?move_id=1 or ?trip_id=1
router.get('/:id', getFolderById);    // GET    /picture-folders/:id
router.post('/', createFolder);       // POST   /picture-folders
router.put('/:id', updateFolder);     // PUT    /picture-folders/:id
router.delete('/:id', deleteFolder);  // DELETE /picture-folders/:id

module.exports = router;