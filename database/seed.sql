-- Optional seed data for testing

-- Sample products (will be replaced by sync)
INSERT INTO products (provider, provider_code, code, name, category_id, buy_price, sell_price, status) VALUES
('vip', '1', 'VIP_1', 'Instagram Followers 1000', '11111111-1111-1111-1111-111111111111', 50000, 55000, 'active'),
('vip', '2', 'VIP_2', 'TikTok Views 10K', '11111111-1111-1111-1111-111111111111', 25000, 27500, 'active'),
('medan', '101', 'MP_101', 'Mobile Legends 100 Diamonds', '22222222-2222-2222-2222-222222222222', 12000, 12800, 'active'),
('medan', '102', 'MP_102', 'Free Fire 100 Diamonds', '22222222-2222-2222-2222-222222222222', 11000, 11700, 'active'),
('medan', '201', 'MP_201', 'Pulsa Telkomsel 10K', '33333333-3333-3333-3333-333333333333', 10500, 11000, 'active'),
('medan', '301', 'MP_301', 'Token PLN 20K', '44444444-4444-4444-4444-444444444444', 20000, 20500, 'active');

-- Sample bot
INSERT INTO bots (name, phone_number, status) VALUES 
('Bot Utama', '6281234567890', 'inactive');
