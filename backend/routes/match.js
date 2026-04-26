const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/matchController');

router.post('/', ctrl.matchCandidate);

module.exports = router;
