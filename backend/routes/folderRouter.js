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
router.get('/', getFolders);          
router.get('/:id', getFolderById);    
router.post('/', createFolder);       
router.put('/:id', updateFolder);    
router.delete('/:id', deleteFolder);  

module.exports = router;