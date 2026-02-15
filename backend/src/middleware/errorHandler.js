const { 
  default: makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const Pino = require('pino');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const User = require('../models/User');

class WhatsAppService {
  constructor(orderProcessor) {
    this.sessions = new Map();
    this.orderProcessor = orderProcessor;
  }

  async initializeAllBots() {
    try {
      const result = await db.query(
        "SELECT * FROM bots WHERE status IN ('active', 'connected', 'disconnected')"
      );
      const bots = result.rows;

      for (const bot of bots) {
        await this.connectBot(bot);
      }

      console.log(`✅ Initialized ${bots.length} bot(s)`);
    } catch (error) {
      console.error('❌ Error initializing bots:', error);
    }
  }

  async connectBot(botData) {
    const { id, phone_number, name } = botData;
    
    const sessionDir = path.join(__dirname, '../../sessions', `bot_${id}`);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger: Pino({ level: 'silent' }),
      printQRInTerminal: true,
      auth: state,
      browser: ['WhatsApp Store Bot', 'Chrome', '1.0.0'],
      generateHighQualityLinkPreview: true
    });

    this.sessions.set(id, {
      socket: sock,
      info: botData,
      status: 'connecting'
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`📱 Bot ${name} - QR Code ready`);
        await this.updateBotStatus(id, 'qr_ready');
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        await this.updateBotStatus(id, 'disconnected');
        
        if (shouldReconnect) {
          console.log(`🔄 Bot ${name} reconnecting...`);
          setTimeout(() => this.connectBot(botData), 5000);
        }
      } else if (connection === 'open') {
        console.log(`✅ Bot ${name} connected!`);
        await this.updateBotStatus(id, 'connected');
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
      if (m.type === 'notify') {
        for (const msg of m.messages) {
          if (!msg.key.fromMe && msg.message) {
            await this.handleIncomingMessage(id, msg);
          }
        }
      }
    });

    return sock;
  }

  async handleIncomingMessage(botId, msg) {
    try {
      const messageText = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text || '';
      const sender = msg.key.remoteJid;
      const senderNumber = sender.split('@')[0];

      console.log(`[Bot ${botId}] 💬 ${senderNumber}: ${messageText}`);

      const command = this.parseCommand(messageText);

      switch (command.type) {
        case 'menu':
          await this.sendMenu(botId, sender);
          break;
        case 'price':
          await this.sendPriceList(botId, sender, command.data);
          break;
        case 'order':
          await this.processOrder(botId, sender, command.data, msg);
          break;
        case 'status':
          await this.checkOrderStatus(botId, sender, command.data);
          break;
        case 'deposit':
          await this.processDeposit(botId, sender, command.data);
          break;
        case 'balance':
          await this.checkBalance(botId, sender);
          break;
        default:
          await this.sendWelcome(botId, sender);
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
    }
  }

  parseCommand(text) {
    const lowerText = text.toLowerCase().trim();
    
    if (['menu', 'help', 'start', 'halo', 'hi', 'hai'].includes(lowerText)) {
      return { type: 'menu' };
    }

    if (['saldo', 'balance', 'cek saldo'].includes(lowerText)) {
      return { type: 'balance' };
    }

    const priceMatch = lowerText.match(/^(harga|price|cek)\s+(\w+)$/);
    if (priceMatch) {
      return { type: 'price', data: { productCode: priceMatch[2] } };
    }

    const orderMatch = lowerText.match(/^(?:order\s+)?(\w+)[\s.]+(\d+)(?:\s+(\d+))?$/);
    if (orderMatch) {
      return { 
        type: 'order', 
        data: { 
          productCode: orderMatch[1], 
          targetId: orderMatch[2],
          quantity: orderMatch[3] || 1
        } 
      };
    }

    const statusMatch = lowerText.match(/^status\s+(\w+)$/);
    if (statusMatch) {
      return { type: 'status', data: { orderId: statusMatch[1] } };
    }

    const depositMatch = lowerText.match(/^deposit\s+(\d+)$/);
    if (depositMatch) {
      return { type: 'deposit', data: { amount: parseInt(depositMatch[1]) } };
    }

    return { type: 'unknown' };
  }

  async sendWelcome(botId, to) {
    const text = `👋 *Selamat Datang di Store Bot!*

🤖 Bot otomatis untuk pembelian:
• Diamond Game (ML, FF, PUBG, dll)
• Pulsa All Operator
• Paket Data Internet
• Sosmed (Followers, Likes, dll)

📌 *Cara Order:*
Ketik: \`<kode>.<id_target>\`
Contoh: \`ML5.123456789\` atau \`order ML5 123456789\`

💰 *Cek Harga:*
Ketik: \`harga <kode>\`
Contoh: \`harga ML5\`

📋 *Menu Lengkap:*
Ketik: \`MENU\`

💡 *Butuh Bantuan?*
Hubungi admin jika ada kendala.`;

    await this.sendMessage(botId, to, text);
  }

  async sendMenu(botId, to) {
    const text = `📋 *DAFTAR MENU*

1️⃣ *Cek Harga Produk*
   Ketik: \`harga <kode>\`
   Contoh: \`harga ML5\`

2️⃣ *Order Produk*
   Format: \`<kode>.<id_target>\`
   Contoh: \`ML5.12345678\`
   
   Atau: \`order <kode> <id_target>\`
   Contoh: \`order ML5 12345678\`

3️⃣ *Cek Status Order*
   Ketik: \`status <kode_order>\`
   Contoh: \`status ABC123\`

4️⃣ *Cek Saldo*
   Ketik: \`saldo\` atau \`balance\`

5️⃣ *Deposit Saldo*
   Ketik: \`deposit <jumlah>\`
   Contoh: \`deposit 50000\`

⚡ *Proses Otomatis 24 Jam*
🚀 *Cepat, Aman, Terpercaya*`;

    await this.sendMessage(botId, to, text);
  }

  async sendPriceList(botId, to, { productCode }) {
    try {
      const result = await db.query(
        `SELECT p.*, c.name as category_name, c.code as category_code
         FROM products p 
         JOIN categories c ON p.category_id = c.id 
         WHERE (p.code = $1 OR p.provider_code = $1) AND p.status = 'active'`,
        [productCode.toUpperCase()]
      );

      if (result.rows.length === 0) {
        await this.sendMessage(botId, to, 
          `❌ Produk *${productCode}* tidak ditemukan.\n\n` +
          `Ketik *MENU* untuk bantuan.`
        );
        return;
      }

      const product = result.rows[0];
      
      const text = `💎 *${product.name}*

📂 Kategori: ${product.category_name}
💰 Harga: Rp ${product.sell_price.toLocaleString('id-ID')}
📊 Status: ${product.is_available ? '✅ Tersedia' : '❌ Stok Habis'}
📦 Min: ${product.min_order} | Max: ${product.max_order}

📝 *Deskripsi:* ${product.description || 'Tidak ada deskripsi'}

Untuk order, ketik:
\`${product.code}.<id_target>\`
Contoh: \`${product.code}.12345678\``;

      await this.sendMessage(botId, to, text);
    } catch (error) {
      console.error('Error fetching price:', error);
      await this.sendMessage(botId, to, '❌ Terjadi kesalahan. Coba lagi nanti.');
    }
  }

  async processOrder(botId, to, { productCode, targetId, quantity }) {
    try {
      // Get or create user
      const user = await User.getOrCreateByPhone(to.split('@')[0], 'Customer');

      // Find product
      const productResult = await db.query(
        `SELECT p.*, c.code as category_code 
         FROM products p 
         JOIN categories c ON p.category_id = c.id 
         WHERE (p.code = $1 OR p.provider_code = $1) AND p.status = $2`,
        [productCode.toUpperCase(), 'active']
      );

      if (productResult.rows.length === 0) {
        await this.sendMessage(botId, to, `❌ Produk *${productCode}* tidak tersedia.`);
        return;
      }

      const product = productResult.rows[0];
      const totalPrice = product.sell_price * quantity;

      // Check balance
      if (user.balance < totalPrice) {
        const shortfall = totalPrice - user.balance;
        await this.sendMessage(botId, to, 
          `❌ *Saldo Tidak Mencukupi!*\n\n` +
          `💰 Total: Rp ${totalPrice.toLocaleString('id-ID')}\n` +
          `💳 Saldo Anda: Rp ${user.balance.toLocaleString('id-ID')}\n` +
          `❗ Kurang: Rp ${shortfall.toLocaleString('id-ID')}\n\n` +
          `Silakan deposit terlebih dahulu.\n` +
          `Ketik: deposit <jumlah>\n` +
          `Contoh: deposit 50000`
        );
        return;
      }

      // Create order
      const orderResult = await db.query(
        `INSERT INTO orders 
         (bot_id, user_id, product_id, target_id, quantity, total_price, buy_price, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW()) 
         RETURNING *`,
        [botId, user.id, product.id, targetId, quantity, totalPrice, product.buy_price]
      );

      const order = orderResult.rows[0];

      // Deduct balance
      await db.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [totalPrice, user.id]
      );

      // Add to queue
      await this.orderProcessor.addOrder({
        orderId: order.id,
        productCode: product.provider_code,
        targetId,
        quantity,
        provider: product.provider,
        category: product.category_code
      });

      await this.sendMessage(botId, to,
        `✅ *ORDER BERHASIL!*\n\n` +
        `🆔 Order ID: *${order.order_code}*\n` +
        `📦 Produk: ${product.name}\n` +
        `🎯 Target: ${targetId}\n` +
        `🔢 Jumlah: ${quantity}\n` +
        `💰 Total: Rp ${totalPrice.toLocaleString('id-ID')}\n` +
        `⏳ Status: *Menunggu Proses*\n\n` +
        `Anda akan menerima notifikasi saat order selesai.\n` +
        `Cek status: status ${order.order_code}`
      );

    } catch (error) {
      console.error('Error processing order:', error);
      await this.sendMessage(botId, to, '❌ Terjadi kesalahan saat memproses order.');
    }
  }

  async checkOrderStatus(botId, to, { orderId }) {
    try {
      const result = await db.query(
        `SELECT o.*, p.name as product_name 
         FROM orders o 
         JOIN products p ON o.product_id = p.id 
         WHERE o.order_code = $1 OR o.id::text = $1`,
        [orderId]
      );

      if (result.rows.length === 0) {
        await this.sendMessage(botId, to, `❌ Order *${orderId}* tidak ditemukan.`);
        return;
      }

      const order = result.rows[0];
      const statusEmoji = {
        'pending': '⏳',
        'processing': '🔄',
        'success': '✅',
        'failed': '❌',
        'cancelled': '🚫'
      };

      await this.sendMessage(botId, to,
        `📋 *STATUS ORDER*\n\n` +
        `🆔 Order ID: ${order.order_code}\n` +
        `📦 Produk: ${order.product_name}\n` +
        `🎯 Target: ${order.target_id}\n` +
        `${statusEmoji[order.status] || '❓'} Status: *${order.status.toUpperCase()}*\n` +
        `📝 Catatan: ${order.notes || '-'}\n` +
        `🕐 Waktu: ${new Date(order.created_at).toLocaleString('id-ID')}`
      );

    } catch (error) {
      console.error('Error checking status:', error);
      await this.sendMessage(botId, to, '❌ Terjadi kesalahan saat cek status.');
    }
  }

  async checkBalance(botId, to) {
    try {
      const result = await db.query('SELECT balance FROM users WHERE phone = $1', [to.split('@')[0]]);
      const balance = result.rows[0]?.balance || 0;

      await this.sendMessage(botId, to,
        `💳 *SALDO ANDA*\n\n` +
        `Rp ${balance.toLocaleString('id-ID')}\n\n` +
        `Untuk deposit, ketik:\n` +
        `deposit <jumlah>\n` +
        `Contoh: deposit 100000`
      );
    } catch (error) {
      console.error('Error checking balance:', error);
    }
  }

  async processDeposit(botId, to, { amount }) {
    if (amount < 10000) {
      await this.sendMessage(botId, to, '❌ Minimal deposit Rp 10.000');
      return;
    }

    await this.sendMessage(botId, to,
      `💰 *REQUEST DEPOSIT*\n\n` +
      `Jumlah: Rp ${amount.toLocaleString('id-ID')}\n\n` +
      `Silakan transfer ke rekening berikut:\n\n` +
      `🏦 *Bank BCA*\n` +
      `No Rek: 1234567890\n` +
      `A/N: PT STORE DIGITAL\n\n` +
      `💡 *Wajib:*\n` +
      `• Transfer sesuai nominal (termasuk kode unik)\n` +
      `• Simpan bukti transfer\n` +
      `• Konfirmasi ke admin setelah transfer\n\n` +
      `Deposit akan diproses 1x24 jam.`
    );
  }

  async sendMessage(botId, to, text) {
    const session = this.sessions.get(botId);
    if (!session || !session.socket) {
      console.error(`❌ Bot ${botId} not connected`);
      return;
    }

    try {
      await session.socket.sendMessage(to, { text });
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  }

  async updateBotStatus(botId, status) {
    try {
      await db.query(
        'UPDATE bots SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, botId]
      );
      
      if (this.sessions.has(botId)) {
        this.sessions.get(botId).status = status;
      }
    } catch (error) {
      console.error('Error updating bot status:', error);
    }
  }

  async disconnectBot(botId) {
    const session = this.sessions.get(botId);
    if (session && session.socket) {
      await session.socket.logout();
      this.sessions.delete(botId);
    }
  }

  async disconnectAll() {
    for (const [id, session] of this.sessions) {
      if (session.socket) {
        await session.socket.logout();
      }
    }
    this.sessions.clear();
  }

  getAllSessions() {
    return Array.from(this.sessions.entries()).map(([id, data]) => ({
      id,
      status: data.status,
      phone: data.info.phone_number,
      name: data.info.name
    }));
  }

  getSessionStatus(botId) {
    const session = this.sessions.get(botId);
    return session ? {
      status: session.status,
      is_connected: session.status === 'connected'
    } : null;
  }
}

module.exports = WhatsAppService;
