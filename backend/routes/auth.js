const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Only login — no public registration
router.post('/login', authController.login);

module.exports = router;
