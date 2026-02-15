// backend/src/services/orderProcessor.js
const Queue = require('bull');
const db = require('../config/database');
const VIPResellerService = require('./vipResellerService');
const MedanPediaService = require('./medanPediaService');
const pino = require('pino')();

class OrderProcessor {
  constructor() {
    this.orderQueue = new Queue('order processing', process.env.REDIS_URL);
    this.providers = {
      'vip': new VIPResellerService(),
      'medan': new MedanPediaService()
    };
  }

  async start() {
    this.orderQueue.process(async (job) => {
      return await this.processOrder(job.data);
    });

    this.orderQueue.on('completed', (job, result) => {
      pino.info(`✅ Order ${job.data.orderId} completed`);
    });

    this.orderQueue.on('failed', (job, err) => {
      pino.error(`❌ Order ${job.data.orderId} failed:`, err.message);
    });
  }

  async addOrder(orderData) {
    const job = await this.orderQueue.add(orderData, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100
    });
    return job.id;
  }

  async processOrder({ orderId, productCode, targetId, quantity, provider }) {
    try {
      await db.query("UPDATE orders SET status = 'processing' WHERE id = $1", [orderId]);

      const providerService = this.providers[provider] || this.providers['vip'];
      
      // Extract SKU from product code (remove provider prefix)
      const sku = productCode.replace(/^(VIP_|MP_)/, '');

      const providerOrder = await providerService.placeOrder({
        sku: sku,
        target: targetId,
        quantity: quantity
      });

      await db.query(
        `UPDATE orders 
         SET provider_ref = $1, provider_order_id = $2, status = 'processing' 
         WHERE id = $3`,
        [provider, providerOrder.id, orderId]
      );

      // Start polling
      this.pollOrderStatus(orderId, provider, providerOrder.id);

      return { success: true, providerOrderId: providerOrder.id };

    } catch (error) {
      await db.query(
        "UPDATE orders SET status = 'failed', notes = $1 WHERE id = $2",
        [error.message, orderId]
      );
      
      await this.notifyCustomer(orderId, 'failed', error.message);
      throw error;
    }
  }

  async pollOrderStatus(orderId, provider, providerOrderId) {
    const providerService = this.providers[provider];
    const maxAttempts = 60; // 60 attempts = 10 minutes (10s interval)
    
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      try {
        const status = await providerService.checkOrderStatus(providerOrderId);
        
        if (status.status === 'success') {
          await this.completeOrder(orderId, status);
          return;
        } else if (status.status === 'failed') {
          await this.failOrder(orderId, status.message);
          return;
        }
      } catch (error) {
        pino.error(`Polling error order ${orderId}:`, error.message);
      }
    }

    // Timeout
    await db.query(
      "UPDATE orders SET status = 'manual_check', notes = 'Timeout - perlu cek manual' WHERE id = $1",
      [orderId]
    );
  }

  async completeOrder(orderId, providerData) {
    await db.query(
      `UPDATE orders 
       SET status = 'success', completed_at = NOW(), provider_data = $1 
       WHERE id = $2`,
      [JSON.stringify(providerData), orderId]
    );

    await this.notifyCustomer(orderId, 'success');
  }

  async failOrder(orderId, reason) {
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );
    const order = orderResult.rows[0];

    // Refund
    await db.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [order.total_price, order.user_id]
    );

    await db.query(
      "UPDATE orders SET status = 'failed', notes = $1 WHERE id = $2",
      [reason, orderId]
    );

    await this.notifyCustomer(orderId, 'failed', reason);
  }

  async notifyCustomer(orderId, status, message = '') {
    try {
      const result = await db.query(
        `SELECT o.*, u.phone, p.name as product_name 
         FROM orders o 
         JOIN users u ON o.user_id = u.id 
         JOIN products p ON o.product_id = p.id 
         WHERE o.id = $1`,
        [orderId]
      );

      if (result.rows.length === 0) return;
      
      const order = result.rows[0];
      
      // This would need WhatsApp service instance to send message
      // Implementation depends on your architecture
      pino.info(`Notification: Order ${order.order_code} is ${status}`);
      
    } catch (error) {
      pino.error('Notification error:', error);
    }
  }
}

module.exports = OrderProcessor;
