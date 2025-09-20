const express = require("express");
const router = express.Router();
const multer = require("multer");
const { 
  getUserProfile,
  updateUserProfile,
  verifyEmailUpdate,       
  resendEmailUpdateOtp,    
  generateLinkChallenge,
  linkWalletAddress 
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/me", protect, getUserProfile);
router.put("/me", protect, upload.single('profilePic'), updateUserProfile);

router.post("/me/verify-email", protect, verifyEmailUpdate);
router.post("/me/resend-verify-email", protect, resendEmailUpdateOtp);

router.post("/me/generate-link-challenge", protect, generateLinkChallenge);
router.post("/me/link-wallet", protect, linkWalletAddress);

module.exports = router;

