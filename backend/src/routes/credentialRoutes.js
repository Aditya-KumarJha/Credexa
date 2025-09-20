const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  createCredential,
  listCredentials,
  updateCredential,
  deleteCredential,
} = require('../controllers/credentialController');

const router = express.Router();

// All routes require auth
router.use(protect);

router.get('/', listCredentials);
router.post('/', createCredential);
router.put('/:id', updateCredential);
router.delete('/:id', deleteCredential);

module.exports = router;
