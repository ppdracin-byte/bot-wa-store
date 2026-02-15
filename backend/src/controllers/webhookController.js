const crypto = require('crypto');
const OrderProcessor = require('../services/orderProcessor');

const orderProcessor = new OrderProcessor();

exports.handleVIPReseller = async (req, res) => {
  try {
    // Verify webhook signature if needed
    const data = req.body;
    
    console.log('VIP Reseller Webhook:', data);
    
    if (data.ref_id && data.status) {
      await orderProcessor.handleWebhook('vip', {
        ref_id: data.ref_id,
        status: data.status,
        message: data.message || ''
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.handleMedanPedia = async (req, res) => {
  try {
    const data = req.body;
    
    console.log('Medan Pedia Webhook:', data);
    
    if (data.ref_id && data.status) {
      await orderProcessor.handleWebhook('medan', {
        ref_id: data.ref_id,
        status: data.status,
        message: data.message || ''
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
