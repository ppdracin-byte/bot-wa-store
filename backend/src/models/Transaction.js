const db = require('../config/database');

class Transaction {
  static async findAll(filters = {}) {
    let query = `
      SELECT t.*, u.phone as user_phone, u.name as user_name
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND t.status = $${params.length}`;
    }

    if (filters.type) {
      params.push(filters.type);
      query += ` AND t.type = $${params.length}`;
    }

    query += ' ORDER BY t.created_at DESC LIMIT 100';

    const result = await db.query(query, params);
    return result.rows;
  }

  static async create(data) {
    const result = await db.query(
      `INSERT INTO transactions (user_id, type, amount, method, reference_id, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [data.user_id, data.type, data.amount, data.method, 
       data.reference_id, data.status || 'pending', data.notes]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status, notes = null) {
    const result = await db.query(
      'UPDATE transactions SET status = $1, notes = COALESCE($2, notes), updated_at = NOW() WHERE id = $3 RETURNING *',
      [status, notes, id]
    );
    return result.rows[0];
  }
}

module.exports = Transaction;
