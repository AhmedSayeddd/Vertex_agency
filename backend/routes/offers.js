const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/offersController');

// All public — no auth middleware
router.get('/',              ctrl.getOffers);
router.get('/:id',           ctrl.getOfferById);
router.patch('/:id/status',  ctrl.toggleOfferStatus);

module.exports = router;
