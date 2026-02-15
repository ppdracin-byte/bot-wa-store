const db = require('../config/database');

class Order {
  static async findAll(filters = {}) {
    let query = `
      SELECT o.*, p.name as product_name, u.phone as user_phone, u.name as user_name
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND o.status = $${params.length}`;
    }

    if (filters.user_id) {
      params.push(filters.user_id);
      query += ` AND o.user_id = $${params.length}`;
    }

    if (filters.startDate && filters.endDate) {
      params.push(filters.startDate, filters.endDate);
      query += ` AND o.created_at BETWEEN $${params.length - 1} AND $${params.length}`;
    }

    query += ' ORDER BY o.created_at DESC LIMIT 100';

    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT o.*, p.name as product_name, p.buy_price, u.phone as user_phone
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = $1 OR o.order_code = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(data) {
    const result = await db.query(
      `INSERT INTO orders 
       (bot_id, user_id, product_id, target_id, quantity, total_price, buy_price, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') 
       RETURNING *`,
      [data.bot_id, data.user_id, data.product_id, data.target_id, 
       data.quantity, data.total_price, data.buy_price]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status, notes = null) {
    const result = await db.query(
      `UPDATE orders 
       SET status = $1, notes = COALESCE($2, notes), updated_at = NOW(),
           completed_at = CASE WHEN $1 = 'success' THEN NOW() ELSE completed_at END
       WHERE id = $3 
       RETURNING *`,
      [status, notes, id]
    );
    return result.rows[0];
  }

  static async getStats() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COALESCE(SUM(CASE WHEN status = 'success' THEN total_price END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'success' THEN (total_price - (buy_price * quantity)) END), 0) as total_profit
      FROM orders
      WHERE created_at >= CURRENT_DATE
    `);
    return result.rows[0];
  }

  static async getRecent(limit = 10) {
    const result = await db.query(`
      SELECT o.*, p.name as product_name, u.phone as user_phone
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT $1
    `, [limit]);
    return result.rows;
  }
}

module.exports = Order;
