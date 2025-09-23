const express = require('express');
const router = express.Router();
const { searchJobs, getJobRecommendations, testMLService } = require('../controllers/jobController');

// Job search route
router.post('/search', searchJobs);

// Job recommendations route
router.post('/recommendations', getJobRecommendations);

// Test ML service route (for debugging)
router.get('/test-ml-service', testMLService);

module.exports = router;
