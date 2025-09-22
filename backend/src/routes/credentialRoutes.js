const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  createCredential,
  listCredentials,
  updateCredential,
  deleteCredential,
  anchorCredentialController,
  verifyCredentialController,
  generateCredentialHashController,
} = require('../controllers/credentialController');

const router = express.Router();

// --- NEW PUBLIC BLOCKCHAIN ROUTE ---
// This route is public so anyone (like an employer) can verify a credential hash
// It is placed BEFORE the protect middleware
router.get('/verify/:hash', verifyCredentialController);

// All routes below this line require user authentication
router.use(protect);

// --- EXISTING DATABASE ROUTES (UNCHANGED) ---
router.get('/', protect, listCredentials);
router.post('/',protect,  createCredential);
router.put('/:id', updateCredential);
router.delete('/:id', deleteCredential);

router.post('/anchor', anchorCredentialController);

router.post('/:id/generate-hash', generateCredentialHashController);

module.exports = router;