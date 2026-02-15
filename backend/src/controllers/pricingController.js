const PricingService = require('../services/pricingService');
const ProductSync = require('../jobs/syncProducts');

exports.getRules = async (req, res) => {
  try {
    const rules = await PricingService.getPricingRules();
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateRule = async (req, res) => {
  try {
    const { category } = req.params;
    const { type, value } = req.body;
    
    if (!type || !value) {
      return res.status(400).json({ success: false, error: 'Type and value required' });
    }

    const rule = await PricingService.updatePricingRule(category, type, parseFloat(value));
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.manualSync = async (req, res) => {
  try {
    const sync = new ProductSync();
    await sync.syncAll();
    res.json({ success: true, message: 'Sync completed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProfitReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await PricingService.getProfitReport(
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    );
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

