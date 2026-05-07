ALTER TABLE orders ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method payment_method;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status payment_status NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(20) NOT NULL DEFAULT 'standard';
