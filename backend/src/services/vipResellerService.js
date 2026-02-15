// backend/src/services/vipResellerService.js
const axios = require('axios');
const crypto = require('crypto');
const pino = require('pino')();

class VIPResellerService {
  constructor() {
    this.apiKey = process.env.VIP_RESELLER_API_KEY;
    this.apiId = process.env.VIP_RESELLER_API_ID;
    this.sign = process.env.VIP_RESELLER_SIGN;
    this.baseURL = process.env.VIP_RESELLER_BASE_URL;
  }

  // Generate signature
  generateSign() {
    return crypto.createHash('md5')
      .update(this.apiId + this.apiKey)
      .digest('hex');
  }

  async getBalance() {
    try {
      const response = await axios.post(`${this.baseURL}/profile`, {
        key: this.apiKey,
        sign: this.generateSign()
      });
      return {
        success: true,
        balance: response.data.data.balance,
        currency: 'IDR'
      };
    } catch (error) {
      pino.error('VIP Reseller getBalance error:', error.message);
      throw new Error(`Gagal cek saldo: ${error.message}`);
    }
  }

  async getServices() {
    try {
      const response = await axios.post(`${this.baseURL}/services`, {
        key: this.apiKey,
        sign: this.generateSign()
      });

      if (!response.data.data) {
        throw new Error('No data returned from API');
      }

      // Transform to standard format
      return response.data.data.map(service => ({
        id: service.id,
        code: `VIP_${service.id}`,
        name: service.name,
        category: service.category,
        price: parseFloat(service.price),
        min: parseInt(service.min) || 1,
        max: parseInt(service.max) || 1000,
        status: service.status === '1' ? 'available' : 'unavailable',
        provider: 'vip',
        note: service.note || ''
      }));

    } catch (error) {
      pino.error('VIP Reseller getServices error:', error.message);
      throw new Error(`Gagal mengambil layanan: ${error.message}`);
    }
  }

  async placeOrder({ sku, target, quantity = 1, customComments = '' }) {
    try {
      const response = await axios.post(`${this.baseURL}/order`, {
        key: this.apiKey,
        sign: this.generateSign(),
        service: sku,
        target: target,
        quantity: parseInt(quantity),
        custom_comments: customComments
      });

      if (response.data.result !== true) {
        throw new Error(response.data.message || 'Order gagal');
      }

      return {
        success: true,
        id: response.data.data.id,
        status: 'pending',
        data: response.data.data
      };

    } catch (error) {
      pino.error('VIP Reseller placeOrder error:', error.message);
      throw new Error(`Order gagal: ${error.message}`);
    }
  }

  async checkOrderStatus(orderId) {
    try {
      const response = await axios.post(`${this.baseURL}/status`, {
        key: this.apiKey,
        sign: this.generateSign(),
        id: orderId
      });

      const data = response.data.data;
      
      return {
        success: true,
        id: orderId,
        status: this.mapStatus(data.status),
        startCount: data.start_count,
        remains: data.remains,
        message: data.message || ''
      };

    } catch (error) {
      pino.error('VIP Reseller checkOrderStatus error:', error.message);
      throw new Error(`Cek status gagal: ${error.message}`);
    }
  }

  mapStatus(vipStatus) {
    const statusMap = {
      'Pending': 'pending',
      'Processing': 'processing',
      'In Progress': 'processing',
      'Completed': 'success',
      'Success': 'success',
      'Canceled': 'failed',
      'Error': 'failed',
      'Partial': 'partial'
    };
    return statusMap[vipStatus] || 'unknown';
  }
}

module.exports = VIPResellerService;
