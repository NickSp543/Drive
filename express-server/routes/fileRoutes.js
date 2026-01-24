const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const permissionRoutes = require("./permissionRoutes");
const { authenticateToken } = require('../middleware/auth');

// All file operations require authentication
router.use(authenticateToken);

router.use("/:id/permissions", permissionRoutes);

// GET /api/files - Get all files
router.get('/', fileController.getFiles);

// POST /api/files - Create new file
router.post('/', fileController.createFile);


// GET /api/files/:id - Get specific file
router.get('/:id', fileController.getFileById);

// PATCH /api/files/:id - Update file
router.patch('/:id', fileController.updateFile);

// DELETE /api/files/:id - Delete file
router.delete('/:id', fileController.deleteFile);

module.exports = router;