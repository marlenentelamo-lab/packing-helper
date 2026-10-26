// routes/pictureRouter.js
const express = require('express');
const { uploadPictures, getPictures } = require('../controllers/pictureController');
const { ensureAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();
router.use(ensureAuth);
router.get('/', getPictures);
router.post('/', upload.array('images', 10), uploadPictures);
module.exports = router;