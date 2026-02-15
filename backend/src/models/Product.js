const db = require('../config/database');

class Product {
  static async findAll(filters = {}) {
    let query = `
      SELECT p.*, c.name as category_name, c.code as category_code
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.provider) {
      params.push(filters.provider);
      query += ` AND p.provider = $${params.length}`;
    }

    if (filters.status) {
      params.push(filters.status);
      query += ` AND p.status = $${params.length}`;
    }

    if (filters.category) {
      params.push(filters.category);
      query += ` AND c.code = $${params.length}`;
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByCode(code) {
    const result = await db.query(
      'SELECT * FROM products WHERE code = $1 OR provider_code = $1',
      [code]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    
    const result = await db.query(
      `UPDATE products SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  }

  static async getStats() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN provider = 'vip' THEN 1 END) as vip_count,
        COUNT(CASE WHEN provider = 'medan' THEN 1 END) as medan_count
      FROM products
    `);
    return result.rows[0];
  }
}

module.exports = Product;
