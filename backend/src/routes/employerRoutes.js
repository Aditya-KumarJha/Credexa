const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getAnalytics } = require('../controllers/employerController');

// All routes require authentication (employer role can be enforced later if needed)
router.use(protect);

// GET /api/employer/analytics
router.get('/analytics', getAnalytics);

module.exports = router;
