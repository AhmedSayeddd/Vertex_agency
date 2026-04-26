const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/applicationsController');

// All public — no auth middleware
router.post('/',             ctrl.createApplication);
router.get('/',              ctrl.getApplications);
router.patch('/:id/status',  ctrl.updateStatus);
router.delete('/:id',        ctrl.deleteApplication);

module.exports = router;
