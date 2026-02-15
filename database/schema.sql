-- database/schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pricing Rules (for profit configuration)
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users/Customers
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) DEFAULT 'Customer',
    email VARCHAR(100),
    balance DECIMAL(12,2) DEFAULT 0,
    level VARCHAR(20) DEFAULT 'member',
    parent_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products (synced from providers)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id),
    provider VARCHAR(20) NOT NULL,
    provider_code VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    buy_price DECIMAL(12,2) NOT NULL,
    sell_price DECIMAL(12,2) NOT NULL,
    min_order INTEGER DEFAULT 1,
    max_order INTEGER DEFAULT 1000,
    status VARCHAR(20) DEFAULT 'active',
    is_available BOOLEAN DEFAULT true,
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_code)
);

-- Bots
CREATE TABLE bots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    api_key VARCHAR(100) UNIQUE DEFAULT uuid_generate_v4(),
    status VARCHAR(20) DEFAULT 'inactive',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code VARCHAR(20) UNIQUE DEFAULT upper(substring(md5(random()::text), 1, 8)),
    bot_id UUID REFERENCES bots(id),
    user_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    target_id VARCHAR(100) NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_price DECIMAL(12,2) NOT NULL,
    buy_price DECIMAL(12,2) NOT NULL,
    provider VARCHAR(20),
    provider_order_id VARCHAR(100),
    provider_data JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    method VARCHAR(50),
    reference_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    proof_image VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (id, name, code, icon, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Sosial Media', 'sosmed', '📱', 'Layanan Sosial Media'),
('22222222-2222-2222-2222-222222222222', 'Game', 'game', '🎮', 'Top Up Game'),
('33333333-3333-3333-3333-333333333333', 'Pulsa', 'pulsa', '💬', 'Isi Ulang Pulsa'),
('44444444-4444-4444-4444-444444444444', 'PPOB', 'ppob', '⚡', 'Pembayaran Tagihan'),
('55555555-5555-5555-5555-555555555555', 'Lainnya', 'default', '📦', 'Layanan Lainnya');

-- Insert default pricing rules
INSERT INTO pricing_rules (category, type, value) VALUES
('sosmed', 'percentage', 10),
('game', 'percentage', 6),
('pulsa', 'fixed', 500),
('ppob', 'fixed', 500),
('default', 'percentage', 10);

-- Indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_code ON orders(order_code);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_provider ON products(provider, provider_code);
CREATE INDEX idx_users_phone ON users(phone);
