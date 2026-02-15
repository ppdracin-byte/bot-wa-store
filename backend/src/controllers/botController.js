const Bot = require('../models/Bot');
const WhatsAppService = require('../services/whatsappService');

const waService = new WhatsAppService();

exports.getAllBots = async (req, res) => {
  try {
    const bots = await Bot.findAll();
    const sessions = waService.getAllSessions();
    
    // Merge bot data with session status
    const botsWithStatus = bots.map(bot => {
      const session = sessions.find(s => s.id === bot.id);
      return {
        ...bot,
        connection_status: session?.status || 'disconnected',
        is_connected: session?.status === 'connected'
      };
    });

    res.json({ success: true, data: botsWithStatus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createBot = async (req, res) => {
  try {
    const { name, phone_number } = req.body;
    
    if (!name || !phone_number) {
      return res.status(400).json({ success: false, error: 'Name and phone number required' });
    }

    const bot = await Bot.create({ name, phone_number });
    res.json({ success: true, data: bot, message: 'Bot created. Connect to start.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBotStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const session = waService.getSessionStatus(id);
    
    res.json({ 
      success: true, 
      data: session || { status: 'disconnected', is_connected: false }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.connectBot = async (req, res) => {
  try {
    const { id } = req.params;
    const bot = await Bot.findById(id);
    
    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    await waService.connectBot(bot);
    res.json({ success: true, message: 'Connection initiated. Check QR code in terminal.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.disconnectBot = async (req, res) => {
  try {
    const { id } = req.params;
    await waService.disconnectBot(id);
    await Bot.updateStatus(id, 'disconnected');
    
    res.json({ success: true, message: 'Bot disconnected' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteBot = async (req, res) => {
  try {
    const { id } = req.params;
    await waService.disconnectBot(id);
    await Bot.delete(id);
    
    res.json({ success: true, message: 'Bot deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
