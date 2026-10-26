const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/authMiddleware');

const {
    getTrips,
    getTrip,
    createTrip,
    updateTrip,
    deleteTrip
} = require('../controllers/tripController');

router.use(ensureAuth);
router.get("/trips", getTrips);

router.get("/trips/:id", getTrip);

router.post("/trips", createTrip);

router.put("/trips/:id", updateTrip);

router.delete("/trips/:id", deleteTrip);

module.exports = router;