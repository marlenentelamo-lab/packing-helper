const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { ensureAuth } = require('../middleware/authMiddleware');

router.use(ensureAuth);
router.get('/', notificationController.getAll);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;