const express = require('express');
const router = express.Router();
const { searchJobs, getJobRecommendations, testMLService, createJob, listMyJobs } = require('../controllers/jobController');
const { protect } = require('../middlewares/authMiddleware');

// Job search route
router.post('/search', searchJobs);

// Job recommendations route
router.post('/recommendations', getJobRecommendations);

// Test ML service route (for debugging)
router.get('/test-ml-service', testMLService);

// Employer job posting routes (protected)
router.post('/', protect, createJob);
router.get('/mine', protect, listMyJobs);

module.exports = router;
