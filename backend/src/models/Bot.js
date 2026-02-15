const db = require('../config/database');

class Bot {
  static async findAll() {
    const result = await db.query('SELECT * FROM bots ORDER BY created_at DESC');
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM bots WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create({ name, phone_number }) {
    const result = await db.query(
      'INSERT INTO bots (name, phone_number, status) VALUES ($1, $2, $3) RETURNING *',
      [name, phone_number, 'inactive']
    );
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const result = await db.query(
      'UPDATE bots SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM bots WHERE id = $1', [id]);
    return { success: true };
  }
}

module.exports = Bot;
