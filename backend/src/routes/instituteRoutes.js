const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  searchColleges,
  updateUserInstitute,
  getUserInstitute,
  addManualInstitute
} = require('../controllers/instituteController');

// Apply authentication middleware to all routes
router.use(protect);

// GET /api/institute/search - Search colleges for autocomplete
router.get('/search', searchColleges);

// GET /api/institute - Get user's current institute
router.get('/', getUserInstitute);

// POST /api/institute - Update user's institute
router.post('/', updateUserInstitute);

// POST /api/institute/manual - Add manual institute (pending approval)
router.post('/manual', addManualInstitute);

module.exports = router;