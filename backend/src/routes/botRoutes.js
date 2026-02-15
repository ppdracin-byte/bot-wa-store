// backend/src/routes/botRoutes.js
const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, botController.getAllBots);
router.post('/', authenticate, botController.createBot);
router.get('/:id/status', authenticate, botController.getBotStatus);
router.post('/:id/connect', authenticate, botController.connectBot);
router.post('/:id/disconnect', authenticate, botController.disconnectBot);
router.delete('/:id', authenticate, botController.deleteBot);

module.exports = router;
