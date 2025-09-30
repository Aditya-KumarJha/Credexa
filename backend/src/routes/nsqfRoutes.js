const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getUserSkillProfile,
  getSkillProgress,
  getSkillRecommendations,
  getUserSkillRankings,
  getNSQFLevelInfo,
  getSkillDomainLeaderboard,
  getSkillStatistics
} = require('../controllers/nsqfController');

// All routes require authentication
router.use(protect);

// User's skill profile and progress routes
router.get('/profile', getUserSkillProfile);
router.get('/progress/:skillDomain', getSkillProgress);
router.get('/recommendations', getSkillRecommendations);
router.get('/rankings', getUserSkillRankings);

// NSQF level information routes
router.get('/levels/:level', getNSQFLevelInfo);

// Leaderboard and statistics routes
router.get('/leaderboard/:skillDomain', getSkillDomainLeaderboard);
router.get('/statistics', getSkillStatistics);

module.exports = router;
