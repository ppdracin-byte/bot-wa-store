const User = require('../models/User');
const Transaction = require('../models/Transaction');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateBalance = async (req, res) => {
  try {
    const { amount, type, notes } = req.body;
    const user = await User.updateBalance(req.params.id, amount);
    
    // Create transaction record
    await Transaction.create({
      user_id: req.params.id,
      type: type || 'manual_adjustment',
      amount: amount,
      status: 'success',
      notes: notes || 'Manual balance adjustment'
    });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await User.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
