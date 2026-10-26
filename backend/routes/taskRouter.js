const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/authMiddleware');

const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask
} = require('../controllers/taskController');

router.use(ensureAuth);
router.get("/tasks", getTasks);

router.get("/tasks/:id", getTask);

router.post("/tasks", createTask);

router.put("/tasks/:id", updateTask);

router.delete("/tasks/:id", deleteTask);

module.exports = router;