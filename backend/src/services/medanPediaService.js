// backend/src/services/medanPediaService.js
const axios = require('axios');
const pino = require('pino')();

class MedanPediaService {
  constructor() {
    this.apiKey = process.env.MEDAN_PEDIA_API_KEY;
    this.apiId = process.env.MEDAN_PEDIA_API_ID;
    this.baseURL = process.env.MEDAN_PEDIA_BASE_URL;
  }

  async getBalance() {
    try {
      const response = await axios.post(`${this.baseURL}/profile`, {
        api_id: this.apiId,
        api_key: this.apiKey
      });
      
      return {
        success: true,
        balance: response.data.data.balance,
        currency: 'IDR'
      };
    } catch (error) {
      pino.error('Medan Pedia getBalance error:', error.message);
      throw new Error(`Gagal cek saldo: ${error.message}`);
    }
  }

  async getServices() {
    try {
      const response = await axios.post(`${this.baseURL}/services`, {
        api_id: this.apiId,
        api_key: this.apiKey
      });

      if (!response.data.data) {
        throw new Error('No data returned from API');
      }

      // Transform to standard format
      return response.data.data.map(service => ({
        id: service.id,
        code: `MP_${service.id}`,
        name: service.name,
        category: service.category || 'Lainnya',
        price: parseFloat(service.price),
        min: parseInt(service.min) || 1,
        max: parseInt(service.max) || 1000,
        status: service.status === '1' ? 'available' : 'unavailable',
        provider: 'medan',
        note: service.note || ''
      }));

    } catch (error) {
      pino.error('Medan Pedia getServices error:', error.message);
      throw new Error(`Gagal mengambil layanan: ${error.message}`);
    }
  }

  async placeOrder({ sku, target, quantity = 1, customComments = '' }) {
    try {
      const response = await axios.post(`${this.baseURL}/order`, {
        api_id: this.apiId,
        api_key: this.apiKey,
        service: sku,
        target: target,
        quantity: parseInt(quantity),
        custom_comments: customComments
      });

      if (response.data.status !== true) {
        throw new Error(response.data.message || 'Order gagal');
      }

      return {
        success: true,
        id: response.data.data.id,
        status: 'pending',
        data: response.data.data
      };

    } catch (error) {
      pino.error('Medan Pedia placeOrder error:', error.message);
      throw new Error(`Order gagal: ${error.message}`);
    }
  }

  async checkOrderStatus(orderId) {
    try {
      const response = await axios.post(`${this.baseURL}/status`, {
        api_id: this.apiId,
        api_key: this.apiKey,
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
      pino.error('Medan Pedia checkOrderStatus error:', error.message);
      throw new Error(`Cek status gagal: ${error.message}`);
    }
  }

  mapStatus(mpStatus) {
    const statusMap = {
      'pending': 'pending',
      'processing': 'processing',
      'success': 'success',
      'completed': 'success',
      'gagal': 'failed',
      'error': 'failed',
      'cancel': 'cancelled'
    };
    return statusMap[mpStatus?.toLowerCase()] || 'unknown';
  }
}

module.exports = MedanPediaService;
