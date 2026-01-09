const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

router.route('/')
  .post(controller.registerUser); // Registration  public
router.route('/tokens')
  .post(controller.login); // Login  public
router.route('/by-username/:username')
  .get(authenticateToken, controller.getUserByUsername); // Lookup user by username  requires the authentication
router.route('/:id')
  .get(authenticateToken, controller.getUser); // User info requires the authentication

module.exports = router;