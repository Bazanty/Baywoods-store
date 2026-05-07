-- =============================================================
-- Baywoods Store — Product Seed: New Balance 9060
-- Run in Supabase SQL Editor
-- =============================================================

-- 1. Ensure "shoes" category exists
INSERT INTO categories (id, name, slug, description, image_url, sort_order, is_active)
VALUES (
  'cat-shoes-001',
  'Shoes',
  'shoes',
  'Premium sneakers and footwear',
  'https://res.cloudinary.com/dltbrta8h/image/upload/w_600,h_400,c_fill/baywoods/products/ehapznmndefezengyr4v.jpg',
  1,
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- Get the category ID for shoes
DO $$
DECLARE
  v_cat_id UUID;

  v_prod_burg UUID := gen_random_uuid();
  v_prod_olive UUID := gen_random_uuid();
  v_prod_white UUID := gen_random_uuid();

  -- Variant IDs (Burgundy)
  v_burg_38 UUID; v_burg_39 UUID; v_burg_40 UUID; v_burg_41 UUID;
  v_burg_42 UUID; v_burg_43 UUID; v_burg_44 UUID; v_burg_45 UUID;

  -- Variant IDs (Olive)
  v_olive_38 UUID; v_olive_39 UUID; v_olive_40 UUID; v_olive_41 UUID;
  v_olive_42 UUID; v_olive_43 UUID; v_olive_44 UUID; v_olive_45 UUID;

  -- Variant IDs (White)
  v_white_38 UUID; v_white_39 UUID; v_white_40 UUID; v_white_41 UUID;
  v_white_42 UUID; v_white_43 UUID; v_white_44 UUID; v_white_45 UUID;

BEGIN
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'shoes';

  -- =============================================================
  -- PRODUCT 1: New Balance 9060 — Burgundy
  -- =============================================================
  INSERT INTO products (id, category_id, name, slug, description, short_description, base_price, sku, is_active, is_featured)
  VALUES (
    v_prod_burg,
    v_cat_id,
    'New Balance 9060 Burgundy',
    'nb-9060-burgundy',
    'The New Balance 9060 in Burgundy delivers a bold, tonal look with rich maroon suede and mesh panels. Built on the chunky ABZORB midsole for superior cushioning, this silhouette blends retro runner DNA with modern streetwear edge. The layered upper combines suede overlays with breathable mesh, while the sculpted outsole adds height and grip. A statement sneaker that pairs effortlessly with joggers, jeans, or shorts.',
    'Bold burgundy runner with ABZORB cushioning and suede-mesh upper.',
    12500,
    'NB-9060-BURG',
    TRUE,
    TRUE
  );

  -- Images (4 unique angles)
  INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES
    (v_prod_burg, 'https://res.cloudinary.com/dltbrta8h/image/upload/v1774986170/baywoods/products/caken6p6lnxjvzdyh9ob.jpg', 0, TRUE),
    (v_prod_burg, 'https://res.cloudinary.com/dltbrta8h/image/upload/v1774986268/baywoods/products/fb6j9s115rkrqyeka5hk.jpg', 1, FALSE),
    (v_prod_burg, 'https://res.cloudinary.com/dltbrta8h/image/upload/v1774986169/baywoods/products/mym5ckdqp1tjl7yuqixg.jpg', 2, FALSE),
    (v_prod_burg, 'https://res.cloudinary.com/dltbrta8h/image/upload/v1774986271/baywoods/products/oeeya8e1ypwsd9ltws0z.jpg', 3, FALSE);

  -- Variants: 8 sizes, each with Color + Size options
  v_burg_38 := gen_random_uuid(); v_burg_39 := gen_random_uuid();
  v_burg_40 := gen_random_uuid(); v_burg_41 := gen_random_uuid();
  v_burg_42 := gen_random_uuid(); v_burg_43 := gen_random_uuid();
  v_burg_44 := gen_random_uuid(); v_burg_45 := gen_random_uuid();

  INSERT INTO product_variants (id, product_id, name, sku, sort_order, is_active) VALUES
    (v_burg_38, v_prod_burg, 'Burgundy / 38', 'NB9060-BRG-38', 0, TRUE),
    (v_burg_39, v_prod_burg, 'Burgundy / 39', 'NB9060-BRG-39', 1, TRUE),
    (v_burg_40, v_prod_burg, 'Burgundy / 40', 'NB9060-BRG-40', 2, TRUE),
    (v_burg_41, v_prod_burg, 'Burgundy / 41', 'NB9060-BRG-41', 3, TRUE),
    (v_burg_42, v_prod_burg, 'Burgundy / 42', 'NB9060-BRG-42', 4, TRUE),
    (v_burg_43, v_prod_burg, 'Burgundy / 43', 'NB9060-BRG-43', 5, TRUE),
    (v_burg_44, v_prod_burg, 'Burgundy / 44', 'NB9060-BRG-44', 6, TRUE),
    (v_burg_45, v_prod_burg, 'Burgundy / 45', 'NB9060-BRG-45', 7, TRUE);

  INSERT INTO variant_options (variant_id, option_name, option_value) VALUES
    (v_burg_38, 'Color', 'Burgundy'), (v_burg_38, 'Color Hex', '#722F37'), (v_burg_38, 'Size', '38'),
    (v_burg_39, 'Color', 'Burgundy'), (v_burg_39, 'Color Hex', '#722F37'), (v_burg_39, 'Size', '39'),
    (v_burg_40, 'Color', 'Burgundy'), (v_burg_40, 'Color Hex', '#722F37'), (v_burg_40, 'Size', '40'),
    (v_burg_41, 'Color', 'Burgundy'), (v_burg_41, 'Color Hex', '#722F37'), (v_burg_41, 'Size', '41'),
    (v_burg_42, 'Color', 'Burgundy'), (v_burg_42, 'Color Hex', '#722F37'), (v_burg_42, 'Size', '42'),
    (v_burg_43, 'Color', 'Burgundy'), (v_burg_43, 'Color Hex', '#722F37'), (v_burg_43, 'Size', '43'),
    (v_burg_44, 'Color', 'Burgundy'), (v_burg_44, 'Color Hex', '#722F37'), (v_burg_44, 'Size', '44'),
    (v_burg_45, 'Color', 'Burgundy'), (v_burg_45, 'Color Hex', '#722F37'), (v_burg_45, 'Size', '45');

  -- Inventory
  INSERT INTO inventory (product_id, quantity, reserved, reorder_threshold) VALUES
    (v_prod_burg, 20, 0, 3);

  -- =============================================================
  -- PRODUCT 2: New Balance 9060 — Olive
  -- =============================================================
  INSERT INTO products (id, category_id, name, slug, description, short_description, base_price, sku, is_active, is_featured)
  VALUES (
    v_prod_olive,
    v_cat_id,
    'New Balance 9060 Olive',
    'nb-9060-olive',
    'The New Balance 9060 in Olive brings earthy, muted tones to the iconic chunky runner. Sage green mesh panels are framed by cream suede overlays, sitting atop a sculpted off-white ABZORB midsole. The nature-inspired palette makes it one of the most versatile colorways in the 9060 lineup — equally at home with earth tones, neutrals, or contrast fits. Comfortable enough for all-day wear with the same premium cushioning system.',
    'Earthy olive runner with cream suede overlays and ABZORB midsole.',
    12500,
    'NB-9060-OLV',
    TRUE,
    TRUE
  );

  INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES
    (v_prod_olive, 'https://res.cloudinary.com/dltbrta8h/image/upload/v1774986203/baywoods/products/ehapznmndefezengyr4v.jpg', 0, TRUE),
    (v_prod_olive, 'https://res.cloudinary.com/dltbrta8h/image/upload/v1774986404/baywoods/products/el4dxusvytq3iuvvvvlz.jpg', 1, FALSE),
    (v_prod_olive, 'https://res.cloudinary.com/dltbrta8h/image/upload/v1774986166/baywoods/products/otyrqw5rokdlpfberz5o.jpg', 2, FALSE),
    (v_prod_olive, 'https://res.cloudinary.com/dltbrta8h/image/upload/v1774986268/baywoods/products/x0ycexlradsjaaiq9bei.jpg', 3, FALSE);

  v_olive_38 := gen_random_uuid(); v_olive_39 := gen_random_uuid();
  v_olive_40 := gen_random_uuid(); v_olive_41 := gen_random_uuid();
  v_olive_42 := gen_random_uuid(); v_olive_43 := gen_random_uuid();
  v_olive_44 := gen_random_uuid(); v_olive_45 := gen_random_uuid();

  INSERT INTO product_variants (id, product_id, name, sku, sort_order, is_active) VALUES
    (v_olive_38, v_prod_olive, 'Olive / 38', 'NB9060-OLV-38', 0, TRUE),
    (v_olive_39, v_prod_olive, 'Olive / 39', 'NB9060-OLV-39', 1, TRUE),
    (v_olive_40, v_prod_olive, 'Olive / 40', 'NB9060-OLV-40', 2, TRUE),
    (v_olive_41, v_prod_olive, 'Olive / 41', 'NB9060-OLV-41', 3, TRUE),
    (v_olive_42, v_prod_olive, 'Olive / 42', 'NB9060-OLV-42', 4, TRUE),
    (v_olive_43, v_prod_olive, 'Olive / 43', 'NB9060-OLV-43', 5, TRUE),
    (v_olive_44, v_prod_olive, 'Olive / 44', 'NB9060-OLV-44', 6, TRUE),
    (v_olive_45, v_prod_olive, 'Olive / 45', 'NB9060-OLV-45', 7, TRUE);

  INSERT INTO variant_options (variant_id, option_name, option_value) VALUES
    (v_olive_38, 'Color', 'Olive'), (v_olive_38, 'Color Hex', '#A3B18A'), (v_olive_38, 'Size', '38'),
    (v_olive_39, 'Color', 'Olive'), (v_olive_39, 'Color Hex', '#A3B18A'), (v_olive_39, 'Size', '39'),
    (v_olive_40, 'Color', 'Olive'), (v_olive_40, 'Color Hex', '#A3B18A'), (v_olive_40, 'Size', '40'),
    (v_olive_41, 'Color', 'Olive'), (v_olive_41, 'Color Hex', '#A3B18A'), (v_olive_41, 'Size', '41'),
    (v_olive_42, 'Color', 'Olive'), (v_olive_42, 'Color Hex', '#A3B18A'), (v_olive_42, 'Size', '42'),
    (v_olive_43, 'Color', 'Olive'), (v_olive_43, 'Color Hex', '#A3B18A'), (v_olive_43, 'Size', '43'),
    (v_olive_44, 'Color', 'Olive'), (v_olive_44, 'Color Hex', '#A3B18A'), (v_olive_44, 'Size', '44'),
    (v_olive_45, 'Color', 'Olive'), (v_olive_45, 'Color Hex', '#A3B18A'), (v_olive_45, 'Size', '45');

  INSERT INTO inventory (product_id, quantity, reserved, reorder_threshold) VALUES
    (v_prod_olive, 18, 0, 3);

  -- =============================================================
  -- PRODUCT 3: New Balance 9060 — Triple White
  -- =============================================================
  INSERT INTO products (id, category_id, name, slug, description, short_description, base_price, sku, is_active, is_featured)
  VALUES (
    v_prod_white,
    v_cat_id,
    'New Balance 9060 Triple White',
    'nb-9060-triple-white',
    'The New Balance 9060 in Triple White is the cleanest iteration of this chunky runner. An all-white leather, suede, and mesh upper sits on a tonal white ABZORB midsole, creating a seamless monochrome look. The sculpted sole unit adds height and comfort without the visual weight. A go-to for minimal fits, summer rotations, and anyone who wants a premium chunky sneaker that goes with literally everything.',
    'Clean all-white chunky runner with leather-suede-mesh upper.',
    12500,
    'NB-9060-WHT',
    TRUE,
    TRUE
  );

  INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES
    (v_prod_white, 'https://res.cloudinary.com/dltbrta8h/image/upload/v1774986263/baywoods/products/epaf8ujayb7cbrs282pu.jpg', 0, TRUE),
    (v_prod_white, 'https://res.cloudinary.com/dltbrta8h/image/upload/v1774986163/baywoods/products/h1v2hoavffowbjcpsupp.jpg', 1, FALSE),
    (v_prod_white, 'https://res.cloudinary.com/dltbrta8h/image/upload/v1774986305/baywoods/products/hxo7ftflvjkahw9t929s.jpg', 2, FALSE),
    (v_prod_white, 'https://res.cloudinary.com/dltbrta8h/image/upload/v1774986281/baywoods/products/n63muhb9n0lrlbowavo5.jpg', 3, FALSE);

  v_white_38 := gen_random_uuid(); v_white_39 := gen_random_uuid();
  v_white_40 := gen_random_uuid(); v_white_41 := gen_random_uuid();
  v_white_42 := gen_random_uuid(); v_white_43 := gen_random_uuid();
  v_white_44 := gen_random_uuid(); v_white_45 := gen_random_uuid();

  INSERT INTO product_variants (id, product_id, name, sku, sort_order, is_active) VALUES
    (v_white_38, v_prod_white, 'White / 38', 'NB9060-WHT-38', 0, TRUE),
    (v_white_39, v_prod_white, 'White / 39', 'NB9060-WHT-39', 1, TRUE),
    (v_white_40, v_prod_white, 'White / 40', 'NB9060-WHT-40', 2, TRUE),
    (v_white_41, v_prod_white, 'White / 41', 'NB9060-WHT-41', 3, TRUE),
    (v_white_42, v_prod_white, 'White / 42', 'NB9060-WHT-42', 4, TRUE),
    (v_white_43, v_prod_white, 'White / 43', 'NB9060-WHT-43', 5, TRUE),
    (v_white_44, v_prod_white, 'White / 44', 'NB9060-WHT-44', 6, TRUE),
    (v_white_45, v_prod_white, 'White / 45', 'NB9060-WHT-45', 7, TRUE);

  INSERT INTO variant_options (variant_id, option_name, option_value) VALUES
    (v_white_38, 'Color', 'White'), (v_white_38, 'Color Hex', '#FFFFFF'), (v_white_38, 'Size', '38'),
    (v_white_39, 'Color', 'White'), (v_white_39, 'Color Hex', '#FFFFFF'), (v_white_39, 'Size', '39'),
    (v_white_40, 'Color', 'White'), (v_white_40, 'Color Hex', '#FFFFFF'), (v_white_40, 'Size', '40'),
    (v_white_41, 'Color', 'White'), (v_white_41, 'Color Hex', '#FFFFFF'), (v_white_41, 'Size', '41'),
    (v_white_42, 'Color', 'White'), (v_white_42, 'Color Hex', '#FFFFFF'), (v_white_42, 'Size', '42'),
    (v_white_43, 'Color', 'White'), (v_white_43, 'Color Hex', '#FFFFFF'), (v_white_43, 'Size', '43'),
    (v_white_44, 'Color', 'White'), (v_white_44, 'Color Hex', '#FFFFFF'), (v_white_44, 'Size', '44'),
    (v_white_45, 'Color', 'White'), (v_white_45, 'Color Hex', '#FFFFFF'), (v_white_45, 'Size', '45');

  INSERT INTO inventory (product_id, quantity, reserved, reorder_threshold) VALUES
    (v_prod_white, 22, 0, 3);

  RAISE NOTICE 'Seeded 3 products: NB 9060 Burgundy, Olive, Triple White';
END $$;
