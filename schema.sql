-- =============================================================
-- Baywoods E-Commerce — PostgreSQL Schema
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE user_role       AS ENUM ('customer', 'admin', 'staff');
CREATE TYPE order_status    AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status  AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payment_method  AS ENUM ('card', 'bank_transfer', 'paypal', 'crypto', 'cash_on_delivery');
CREATE TYPE address_type    AS ENUM ('shipping', 'billing', 'both');
CREATE TYPE discount_type   AS ENUM ('percentage', 'fixed');

-- =============================================================
-- USERS
-- =============================================================

CREATE TABLE users (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash TEXT          NOT NULL,
    first_name    VARCHAR(100)  NOT NULL,
    last_name     VARCHAR(100)  NOT NULL,
    phone         VARCHAR(30),
    role          user_role     NOT NULL DEFAULT 'customer',
    is_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_role     ON users (role);
CREATE INDEX idx_users_active   ON users (is_active) WHERE is_active = TRUE;

-- =============================================================
-- ADDRESSES
-- =============================================================

CREATE TABLE addresses (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type           address_type NOT NULL DEFAULT 'shipping',
    full_name      VARCHAR(200) NOT NULL,
    phone          VARCHAR(30),
    line1          VARCHAR(255) NOT NULL,
    line2          VARCHAR(255),
    city           VARCHAR(100) NOT NULL,
    state          VARCHAR(100),
    postal_code    VARCHAR(20)  NOT NULL,
    country_code   CHAR(2)      NOT NULL,   -- ISO 3166-1 alpha-2
    is_default     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses (user_id);

-- =============================================================
-- CATEGORIES
-- =============================================================

CREATE TABLE categories (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID          REFERENCES categories (id) ON DELETE SET NULL,
    name        VARCHAR(150)  NOT NULL,
    slug        VARCHAR(160)  NOT NULL UNIQUE,
    description TEXT,
    image_url   TEXT,
    sort_order  SMALLINT      NOT NULL DEFAULT 0,
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent   ON categories (parent_id);
CREATE INDEX idx_categories_slug     ON categories (slug);
CREATE INDEX idx_categories_active   ON categories (is_active) WHERE is_active = TRUE;

-- =============================================================
-- PRODUCTS
-- =============================================================

CREATE TABLE products (
    id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id       UUID           REFERENCES categories (id) ON DELETE SET NULL,
    name              VARCHAR(255)   NOT NULL,
    slug              VARCHAR(270)   NOT NULL UNIQUE,
    description       TEXT,
    short_description VARCHAR(500),
    base_price        NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
    compare_price     NUMERIC(12, 2) CHECK (compare_price >= 0),  -- crossed-out / original price
    sku               VARCHAR(100)   UNIQUE,
    weight_kg         NUMERIC(8, 3),
    is_active         BOOLEAN        NOT NULL DEFAULT TRUE,
    is_featured       BOOLEAN        NOT NULL DEFAULT FALSE,
    meta_title        VARCHAR(255),
    meta_description  VARCHAR(500),
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category   ON products (category_id);
CREATE INDEX idx_products_slug       ON products (slug);
CREATE INDEX idx_products_sku        ON products (sku);
CREATE INDEX idx_products_active     ON products (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_featured   ON products (is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_price      ON products (base_price);

-- =============================================================
-- PRODUCT VARIANTS  (size, color, etc.)
-- =============================================================

CREATE TABLE product_variants (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID           NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    name        VARCHAR(200)   NOT NULL,     -- e.g. "Blue / XL"
    sku         VARCHAR(100)   UNIQUE,
    price       NUMERIC(12, 2) CHECK (price >= 0),  -- NULL = inherit from product
    weight_kg   NUMERIC(8, 3),
    sort_order  SMALLINT       NOT NULL DEFAULT 0,
    is_active   BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants (product_id);
CREATE INDEX idx_variants_sku     ON product_variants (sku);

-- Variant option axes stored as key-value rows (e.g. Size=XL, Color=Blue)
CREATE TABLE variant_options (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id   UUID        NOT NULL REFERENCES product_variants (id) ON DELETE CASCADE,
    option_name  VARCHAR(80) NOT NULL,    -- "Size", "Color"
    option_value VARCHAR(80) NOT NULL     -- "XL", "Blue"
);

CREATE INDEX idx_variant_options_variant ON variant_options (variant_id);

-- =============================================================
-- PRODUCT IMAGES
-- =============================================================

CREATE TABLE product_images (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    variant_id  UUID        REFERENCES product_variants (id) ON DELETE CASCADE,
    url         TEXT        NOT NULL,
    alt_text    VARCHAR(255),
    sort_order  SMALLINT    NOT NULL DEFAULT 0,
    is_primary  BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_product_images_product ON product_images (product_id);
CREATE INDEX idx_product_images_variant ON product_images (variant_id);

-- =============================================================
-- INVENTORY
-- =============================================================

CREATE TABLE inventory (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id        UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    variant_id        UUID        UNIQUE REFERENCES product_variants (id) ON DELETE CASCADE,
    -- variant_id NULL = inventory for base product (no variants)
    quantity          INTEGER     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved          INTEGER     NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    reorder_threshold INTEGER     NOT NULL DEFAULT 5,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_reserved_lte_quantity CHECK (reserved <= quantity)
);

CREATE INDEX idx_inventory_product ON inventory (product_id);

-- =============================================================
-- COUPONS
-- =============================================================

CREATE TABLE coupons (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    code           VARCHAR(50)   NOT NULL UNIQUE,
    description    VARCHAR(255),
    discount_type  discount_type NOT NULL,
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    minimum_order  NUMERIC(12,2) NOT NULL DEFAULT 0,
    max_uses       INTEGER,                               -- NULL = unlimited
    used_count     INTEGER       NOT NULL DEFAULT 0,
    per_user_limit SMALLINT      NOT NULL DEFAULT 1,
    is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
    starts_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    expires_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code   ON coupons (code);
CREATE INDEX idx_coupons_active ON coupons (is_active, expires_at);

-- =============================================================
-- ORDERS
-- =============================================================

CREATE TABLE orders (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID           REFERENCES users (id) ON DELETE SET NULL,
    status           order_status   NOT NULL DEFAULT 'pending',
    -- Address snapshot at time of order (intentionally denormalised)
    shipping_name    VARCHAR(200)   NOT NULL,
    shipping_line1   VARCHAR(255)   NOT NULL,
    shipping_line2   VARCHAR(255),
    shipping_city    VARCHAR(100)   NOT NULL,
    shipping_state   VARCHAR(100),
    shipping_postal  VARCHAR(20)    NOT NULL,
    shipping_country CHAR(2)        NOT NULL,
    shipping_phone   VARCHAR(30),
    -- Totals
    subtotal         NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    shipping_cost    NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_amount       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total            NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    coupon_id        UUID           REFERENCES coupons (id) ON DELETE SET NULL,
    notes            TEXT,
    tracking_number  VARCHAR(150),
    shipped_at       TIMESTAMPTZ,
    delivered_at     TIMESTAMPTZ,
    cancelled_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user    ON orders (user_id);
CREATE INDEX idx_orders_status  ON orders (status);
CREATE INDEX idx_orders_created ON orders (created_at DESC);
CREATE INDEX idx_orders_coupon  ON orders (coupon_id);

-- =============================================================
-- ORDER ITEMS
-- =============================================================

CREATE TABLE order_items (
    id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     UUID           NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id   UUID           REFERENCES products (id) ON DELETE SET NULL,
    variant_id   UUID           REFERENCES product_variants (id) ON DELETE SET NULL,
    -- Product snapshot at time of order
    product_name VARCHAR(255)   NOT NULL,
    variant_name VARCHAR(200),
    sku          VARCHAR(100),
    unit_price   NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity     SMALLINT       NOT NULL CHECK (quantity > 0),
    line_total   NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX idx_order_items_order   ON order_items (order_id);
CREATE INDEX idx_order_items_product ON order_items (product_id);

-- =============================================================
-- PAYMENTS
-- =============================================================

CREATE TABLE payments (
    id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id          UUID           NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
    status            payment_status NOT NULL DEFAULT 'pending',
    method            payment_method NOT NULL,
    amount            NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency          CHAR(3)        NOT NULL DEFAULT 'USD',  -- ISO 4217
    provider_tx_id    VARCHAR(255)   UNIQUE,                  -- gateway transaction ID
    provider_response JSONB,                                  -- raw gateway payload
    paid_at           TIMESTAMPTZ,
    refunded_at       TIMESTAMPTZ,
    refund_amount     NUMERIC(12, 2) CHECK (refund_amount >= 0),
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order    ON payments (order_id);
CREATE INDEX idx_payments_status   ON payments (status);
CREATE INDEX idx_payments_provider ON payments (provider_tx_id);

-- =============================================================
-- REVIEWS
-- =============================================================

CREATE TABLE reviews (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    user_id     UUID        REFERENCES users (id) ON DELETE SET NULL,
    order_id    UUID        REFERENCES orders (id) ON DELETE SET NULL,
    rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title       VARCHAR(200),
    body        TEXT,
    is_verified BOOLEAN     NOT NULL DEFAULT FALSE,  -- verified purchase
    is_approved BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, user_id)                     -- one review per user per product
);

CREATE INDEX idx_reviews_product  ON reviews (product_id);
CREATE INDEX idx_reviews_user     ON reviews (user_id);
CREATE INDEX idx_reviews_approved ON reviews (is_approved, product_id) WHERE is_approved = TRUE;

-- =============================================================
-- UPDATED_AT TRIGGER
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
