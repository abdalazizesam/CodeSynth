const express = require('express');
const { getCodeReview, getAIImprovement } = require('../controllers/codeReviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/analyze', protect, getCodeReview);
router.post('/improve', protect, getAIImprovement);

module.exports = router;