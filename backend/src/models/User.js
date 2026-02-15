const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findAll() {
    const result = await db.query(
      'SELECT id, phone, name, email, balance, level, status, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByPhone(phone) {
    const result = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
    return result.rows[0];
  }

  static async create({ phone, name, password, level = 'member' }) {
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const result = await db.query(
      'INSERT INTO users (phone, name, password, level, balance) VALUES ($1, $2, $3, $4, 0) RETURNING *',
      [phone, name, hashedPassword, level]
    );
    return result.rows[0];
  }

  static async updateBalance(id, amount) {
    const result = await db.query(
      'UPDATE users SET balance = balance + $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [amount, id]
    );
    return result.rows[0];
  }

  static async getOrCreateByPhone(phone, name = 'Customer') {
    let user = await this.findByPhone(phone);
    if (!user) {
      user = await this.create({ phone, name });
    }
    return user;
  }

  static async getStats() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as new_today,
        COALESCE(SUM(balance), 0) as total_balance
      FROM users
    `);
    return result.rows[0];
  }
}

module.exports = User;
