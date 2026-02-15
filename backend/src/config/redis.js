const redis = require('redis');
const pino = require('pino')();

const client = redis.createClient({
  url: process.env.REDIS_URL
});

client.on('error', (err) => {
  pino.error('Redis Client Error:', err);
});

client.on('connect', () => {
  pino.info('🔗 Redis connected');
});

(async () => {
  await client.connect();
})();

module.exports = client;
