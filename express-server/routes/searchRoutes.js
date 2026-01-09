const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticateToken } = require('../middleware/auth');

//search operations require authentication
router.use(authenticateToken);

// GET /api/search/:query - Search files
router.get('/:query', fileController.searchFiles);

module.exports = router;
