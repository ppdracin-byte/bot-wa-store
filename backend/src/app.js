require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const pino = require('pino')();

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const WhatsAppService = require('./services/whatsappService');
const OrderProcessor = require('./services/orderProcessor');
const ProductSync = require('./jobs/syncProducts');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  pino.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling
app.use(errorHandler);

// Global services
let waService;
let orderProcessor;

// Initialize services
async function initialize() {
  try {
    // Start Order Processor
    orderProcessor = new OrderProcessor();
    await orderProcessor.start();
    pino.info('✅ Order Processor started');

    // Initialize WhatsApp Bots
    waService = new WhatsAppService(orderProcessor);
    await waService.initializeAllBots();
    pino.info('✅ WhatsApp Service initialized');

    // Schedule product sync every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      pino.info('🔄 Running scheduled product sync...');
      try {
        const sync = new ProductSync();
        await sync.syncAll();
      } catch (error) {
        pino.error('Sync error:', error);
      }
    });

    // Start server
    app.listen(PORT, () => {
      pino.info(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    pino.error('❌ Initialization error:', error);
    process.exit(1);
  }
}

initialize();

// Graceful shutdown
process.on('SIGTERM', async () => {
  pino.info('SIGTERM received, shutting down gracefully');
  if (waService) {
    await waService.disconnectAll();
  }
  process.exit(0);
});

module.exports = { waService, orderProcessor };
