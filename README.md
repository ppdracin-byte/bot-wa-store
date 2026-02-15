# WhatsApp Store Bot

Sistem otomatis untuk penjualan produk digital (game, pulsa, sosmed) via WhatsApp dengan integrasi VIP Reseller dan Medan Pedia.

## Fitur

- 🤖 **Multi WhatsApp Bot** - Kelola banyak nomor WhatsApp
- 🔄 **Auto Sync** - Sinkronisasi produk otomatis dari provider
- 💰 **Pricing Rules** - Atur profit: Sosmed 10%, Game 6%, Pulsa/PPOB +Rp 500
- ⚡ **Auto Order** - Pemrosesan order otomatis ke provider
- 📊 **Dashboard** - Monitoring lengkap via web panel
- 🔔 **Notifikasi** - Update status ke customer via WhatsApp

## Tech Stack

- **Backend**: Node.js, Express, Baileys (WhatsApp Web)
- **Frontend**: Next.js 14, Tailwind CSS
- **Database**: PostgreSQL
- **Queue**: Redis + Bull
- **Container**: Docker & Docker Compose

## Quick Start

### 1. Clone & Setup

```bash
git clone <repository>
cd whatsapp-store-bot
chmod +x setup.sh
./setup.sh
