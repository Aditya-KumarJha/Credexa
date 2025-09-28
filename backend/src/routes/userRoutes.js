const express = require("express");
const router = express.Router();
const multer = require("multer");
const { 
  getUserProfile,
  updateUserProfile,
  verifyEmailUpdate,       
  resendEmailUpdateOtp,    
  generateLinkChallenge,
  linkWalletAddress,
  searchLearners,
  getPublicProfile,
  getUserCredentials,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/me", protect, getUserProfile);
router.put("/me", protect, upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
]), updateUserProfile);

router.post("/me/verify-email", protect, verifyEmailUpdate);
router.post("/me/resend-verify-email", protect, resendEmailUpdateOtp);

router.post("/me/generate-link-challenge", protect, generateLinkChallenge);
router.post("/me/link-wallet", protect, linkWalletAddress);

// Employer/public endpoints
router.get("/search", searchLearners); // public search for learners by q/skills
router.get("/:id/public-profile", getPublicProfile); // public profile view for learner
router.get("/:id/credentials", protect, getUserCredentials); // get student credentials for institute dashboard

module.exports = router;

