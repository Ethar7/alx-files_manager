const express = require('express');
const router = express.Router();
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController'); // Add this line

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect); // Add this line
router.get('/disconnect', AuthController.getDisconnect); // Add this line
router.get('/users/me', UsersController.getMe); // Add this line

module.exports = router;
