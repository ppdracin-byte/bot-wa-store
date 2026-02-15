// backend/src/services/pricingService.js
const db = require('../config/database');

class PricingService {
  // Profit rules configuration
  static PROFIT_RULES = {
    sosmed: { type: 'percentage', value: 10 },      // 10%
    game: { type: 'percentage', value: 6 },         // 6%
    pulsa: { type: 'fixed', value: 500 },           // +500
    ppob: { type: 'fixed', value: 500 },            // +500
    default: { type: 'percentage', value: 10 }      // fallback 10%
  };

  // Calculate sell price based on category
  static calculateSellPrice(buyPrice, categoryCode) {
    const rule = this.PROFIT_RULES[categoryCode.toLowerCase()] || this.PROFIT_RULES.default;
    
    let sellPrice;
    if (rule.type === 'percentage') {
      sellPrice = buyPrice + (buyPrice * (rule.value / 100));
    } else {
      sellPrice = buyPrice + rule.value;
    }
    
    // Round to nearest 100
    return Math.ceil(sellPrice / 100) * 100;
  }

  // Get all pricing rules (for admin panel)
  static async getPricingRules() {
    try {
      const result = await db.query('SELECT * FROM pricing_rules ORDER BY category');
      return result.rows;
    } catch (error) {
      // Return default if table not exists
      return Object.entries(this.PROFIT_RULES).map(([category, rule]) => ({
        category,
        type: rule.type,
        value: rule.value,
        is_active: true
      }));
    }
  }

  // Update pricing rule (admin only)
  static async updatePricingRule(category, type, value) {
    const query = `
      INSERT INTO pricing_rules (category, type, value, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (category) 
      DO UPDATE SET type = $2, value = $3, updated_at = NOW()
      RETURNING *
    `;
    
    const result = await db.query(query, [category, type, value]);
    
    // Update in-memory rules
    this.PROFIT_RULES[category] = { type, value };
    
    return result.rows[0];
  }

  // Bulk update prices after sync
  static async updateProductPrices(products, categoryCode) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      for (const product of products) {
        const sellPrice = this.calculateSellPrice(
          parseFloat(product.price), 
          categoryCode
        );
        
        await client.query(`
          INSERT INTO products (
            provider, provider_code, code, name, 
            buy_price, sell_price, category_id, 
            min_order, max_order, status, last_sync
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          ON CONFLICT (provider, provider_code) 
          DO UPDATE SET 
            name = EXCLUDED.name,
            buy_price = EXCLUDED.buy_price,
            sell_price = EXCLUDED.sell_price,
            min_order = EXCLUDED.min_order,
            max_order = EXCLUDED.max_order,
            status = EXCLUDED.status,
            last_sync = NOW()
        `, [
          product.provider,
          product.id,
          product.code || `${product.provider}_${product.id}`,
          product.name,
          parseFloat(product.price),
          sellPrice,
          product.category_id,
          product.min || 1,
          product.max || 1000,
          product.status === 'available' ? 'active' : 'inactive'
        ]);
      }
      
      await client.query('COMMIT');
      return { success: true, count: products.length };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get profit report
  static async getProfitReport(startDate, endDate) {
    const query = `
      SELECT 
        p.category_id,
        c.name as category_name,
        COUNT(o.id) as total_orders,
        SUM(o.total_price) as total_revenue,
        SUM(o.buy_price * o.quantity) as total_cost,
        SUM(o.total_price - (o.buy_price * o.quantity)) as total_profit
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE o.status = 'success'
        AND o.completed_at BETWEEN $1 AND $2
      GROUP BY p.category_id, c.name
      ORDER BY total_profit DESC
    `;
    
    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  }
}

module.exports = PricingService;
