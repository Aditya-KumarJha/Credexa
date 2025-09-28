const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  searchColleges,
  updateUserInstitute,
  getUserInstitute,
  addManualInstitute,
  getDashboardStats,
  getStudents,
  getCredentials,
  issueCredential,
  getCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  getAnalytics,
  getComplianceReport,
  getRecentActivities
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

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/activities', getRecentActivities);

// Students routes
router.get('/students', getStudents);

// Credentials routes
router.get('/credentials', getCredentials);
router.post('/credentials/issue', issueCredential);

// Courses routes
router.get('/courses', getCourses);
router.post('/courses', addCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Analytics routes
router.get('/analytics', getAnalytics);

// Compliance routes
router.get('/compliance', getComplianceReport);

module.exports = router;