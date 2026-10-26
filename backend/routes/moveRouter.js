const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/authMiddleware');

const {
    getMoves,
    getMove,
    createMove,
    updateMove,
    deleteMove
} = require('../controllers/moveController');

router.use(ensureAuth);
router.get("/moves", getMoves);

router.get("/moves/:id", getMove);

router.post("/moves", createMove);

router.put("/moves/:id", updateMove);

router.delete("/moves/:id", deleteMove);

module.exports = router;