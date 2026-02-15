// backend/src/routes/pricingRoutes.js
const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');
const { authenticate } = require('../middleware/auth');

router.get('/rules', authenticate, pricingController.getRules);
router.put('/rules/:category', authenticate, pricingController.updateRule);
router.post('/sync', authenticate, pricingController.manualSync);
router.get('/report', authenticate, pricingController.getProfitReport);

module.exports = router;
