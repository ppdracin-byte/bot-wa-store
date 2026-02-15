// backend/src/config/providers.js
module.exports = {
  vipReseller: {
    name: 'VIP Reseller',
    apiId: process.env.VIP_RESELLER_API_ID,
    apiKey: process.env.VIP_RESELLER_API_KEY,
    sign: process.env.VIP_RESELLER_SIGN,
    baseURL: process.env.VIP_RESELLER_BASE_URL,
    enabled: true
  },
  medanPedia: {
    name: 'Medan Pedia',
    apiId: process.env.MEDAN_PEDIA_API_ID,
    apiKey: process.env.MEDAN_PEDIA_API_KEY,
    baseURL: process.env.MEDAN_PEDIA_BASE_URL,
    enabled: true
  }
};
