// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

const botRoutes = require('./botRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const webhookRoutes = require('./webhookRoutes');
const userRoutes = require('./userRoutes');
const pricingRoutes = require('./pricingRoutes');

router.use('/bots', botRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/users', userRoutes);
router.use('/pricing', pricingRoutes);

module.exports = router;
