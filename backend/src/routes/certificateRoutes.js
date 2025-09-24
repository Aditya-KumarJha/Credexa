const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { importCertificateFromUrl } = require('../controllers/certificateController');

const router = express.Router();

router.use(protect);
router.post('/import-url', importCertificateFromUrl);

module.exports = router;
