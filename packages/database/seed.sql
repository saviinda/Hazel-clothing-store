-- Clear Existing Data (Optional/Safe reset)
TRUNCATE public.orders, public.customers, public.products, public.categories, public.content CASCADE;

-- 1. Seed Categories
INSERT INTO public.categories (id, name, slug, image_url, is_active) VALUES
('d1a3b1a8-8b9a-4f51-b0e6-b31cfcf3dc8a', 'Dresses', 'dresses', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=80', true),
('a2f1c8a1-2d7c-4a3b-b2cb-2821dfcf3821', 'Tops', 'tops', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&auto=format&fit=crop&q=80', true),
('f3c4e5a2-9b2f-4c8d-b3e1-872bcda567a1', 'Jeans', 'jeans', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop&q=80', true);

-- 2. Seed Products (10 Fashion Products)
INSERT INTO public.products (id, name, price, description, sizes, colors, material, stock_qty, images, category_id, is_active, is_featured) VALUES
-- Dresses
('p1000000-0000-0000-0000-000000000001', 'Blush Linen Midi Dress', 4200.00, 'A beautiful lightweight midi dress made of 100% pure linen. Perfect for Sri Lankan hot weather. Features adjustable straps and a comfortable fit.', ARRAY['S', 'M', 'L'], ARRAY['Dusty Rose', 'Soft Blush'], 'Linen', 25, ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80'], 'd1a3b1a8-8b9a-4f51-b0e6-b31cfcf3dc8a', true, true),
('p1000000-0000-0000-0000-000000000002', 'Floral Puff Sleeve Dress', 4900.00, 'Feminine and elegant floral dress with puff sleeves. Ideal for daytime outings and dates.', ARRAY['S', 'M', 'L'], ARRAY['Blue Floral', 'White Floral'], 'Georgette', 15, ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80'], 'd1a3b1a8-8b9a-4f51-b0e6-b31cfcf3dc8a', true, true),
('p1000000-0000-0000-0000-000000000003', 'Summer Wrap Dress', 3800.00, 'Classic wrap dress with tie closure. Easy to adjust and incredibly flattering.', ARRAY['S', 'M', 'L', 'XL'], ARRAY['Sage Green', 'Lemon Yellow'], 'Viscose Rayon', 10, ARRAY['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80'], 'd1a3b1a8-8b9a-4f51-b0e6-b31cfcf3dc8a', true, false),
('p1000000-0000-0000-0000-000000000004', 'Sleek Black Maxi Dress', 5500.00, 'Minimalist black maxi dress with side slit. Versatile design suitable for dressing up or down.', ARRAY['S', 'M', 'L'], ARRAY['Midnight Black'], 'Cotton Ribbed', 18, ARRAY['https://images.unsplash.com/photo-1539008835657-9e8e96802317?w=800&auto=format&fit=crop&q=80'], 'd1a3b1a8-8b9a-4f51-b0e6-b31cfcf3dc8a', true, false),

-- Tops
('p1000000-0000-0000-0000-000000000005', 'Classic White Crop Top', 2100.00, 'Essential ribbed cotton crop top. A wardrobe staple that pairs with anything.', ARRAY['S', 'M'], ARRAY['White', 'Oatmeal'], 'Ribbed Cotton', 30, ARRAY['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80'], 'a2f1c8a1-2d7c-4a3b-b2cb-2821dfcf3821', true, false),
('p1000000-0000-0000-0000-000000000006', 'Ribbed Square Neck Top', 2400.00, 'Flattering square neck top with short sleeves. Super soft texture.', ARRAY['S', 'M', 'L'], ARRAY['Mocha Brown', 'Black', 'Emerald Green'], 'Ribbed Cotton', 22, ARRAY['https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&auto=format&fit=crop&q=80'], 'a2f1c8a1-2d7c-4a3b-b2cb-2821dfcf3821', true, true),
('p1000000-0000-0000-0000-000000000007', 'Off-Shoulder Linen Blouse', 3200.00, 'Cute off-shoulder linen blouse with elasticated neckline. Adds a breezy bohemian vibe.', ARRAY['S', 'M', 'L'], ARRAY['Ivory White', 'Blush Pink'], 'Linen Blend', 12, ARRAY['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80'], 'a2f1c8a1-2d7c-4a3b-b2cb-2821dfcf3821', true, false),

-- Jeans
('p1000000-0000-0000-0000-000000000008', 'High-Waist Mom Jeans', 5800.00, 'Authentic denim feel mom jeans. Comfortable through the hips with a tapered leg.', ARRAY['26', '28', '30', '32'], ARRAY['Light Wash Denim', 'Dark Wash Denim'], '100% Cotton Denim', 8, ARRAY['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80'], 'f3c4e5a2-9b2f-4c8d-b3e1-872bcda567a1', true, true),
('p1000000-0000-0000-0000-000000000009', 'Sleek Straight Leg Jeans', 6200.00, 'Modern straight leg silhouette. Features a high rise and slight stretch for comfort.', ARRAY['26', '28', '30', '32'], ARRAY['Mid Wash Denim', 'Charcoal Black'], '99% Cotton, 1% Elastane', 15, ARRAY['https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=800&auto=format&fit=crop&q=80'], 'f3c4e5a2-9b2f-4c8d-b3e1-872bcda567a1', true, false),
('p1000000-0000-0000-0000-000000000010', 'Retro Wide Leg Jeans', 6500.00, 'Vintage-inspired wide leg jeans. Sits high on the waist with a relaxed wide profile.', ARRAY['28', '30', '32'], ARRAY['Retro Light Denim'], '100% Cotton Denim', 6, ARRAY['https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&auto=format&fit=crop&q=80'], 'f3c4e5a2-9b2f-4c8d-b3e1-872bcda567a1', true, true);

-- 3. Seed Homepage content (Hero Banner, Banners, Testimonials)
INSERT INTO public.content (section_key, data) VALUES
('hero_banner', '{
  "title": "EMBRACE YOUR UNIQUE STYLE",
  "subtitle": "Discover modern silhouettes and feminine tones designed for you.",
  "cta_text": "SHOP NEW ARRIVALS",
  "cta_link": "/shop",
  "image_url": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80"
}'),
('trust_bar', '{
  "items": [
    {"title": "Island-wide Delivery", "subtitle": "Flat rate island-wide"},
    {"title": "Easy Bank Transfer", "subtitle": "Verify receipts in 2 hours"},
    {"title": "Feminine Fits", "subtitle": "Sizes S to XL tailored for you"}
  ]
}'),
('testimonials', '{
  "reviews": [
    {"name": "Shenali D.", "comment": "Absolutely love the Linen Midi Dress! The fabric is perfect for Colombo weather and the fit is spot on.", "rating": 5},
    {"name": "Ishini W.", "comment": "Bought the Mom Jeans and White Crop Top. Both look exactly like the photos on their Instagram. Shipping was super fast!", "rating": 5},
    {"name": "Sanduni P.", "comment": "Order procedure was very easy. Just uploaded my bank receipt and order status updated on the tracking link in 1 hour.", "rating": 5}
  ]
}');

-- 4. Seed Customer Profiles
INSERT INTO public.customers (id, name, email, phone, address) VALUES
('c1111111-1111-1111-1111-111111111111', 'Minoli Perera', 'minoli@gmail.com', '0771234567', '{"street": "45 Galle Road", "city": "Colombo 03", "postal_code": "00300"}'),
('c2222222-2222-2222-2222-222222222222', 'Avanthi De Silva', 'avanthi@yahoo.com', '0719876543', '{"street": "12/A Kandy Road", "city": "Kiribathgoda", "postal_code": "11600"}');

-- 5. Seed Mock Orders (With status history)
INSERT INTO public.orders (id, customer_id, items, total_amount, payment_status, order_status, shipping_address, created_at, status_updated_at, status_history) VALUES
-- Order 1: Pending payment
('o1000000-0000-0000-0000-000000000001', 'c1111111-1111-1111-1111-111111111111', '[
  {"product_id": "p1000000-0000-0000-0000-000000000001", "name": "Blush Linen Midi Dress", "price": 4200.00, "qty": 1, "size": "M", "color": "Soft Blush"}
]', 4200.00, 'Pending', 'Pending Payment', '{"name": "Minoli Perera", "phone": "0771234567", "street": "45 Galle Road", "city": "Colombo 03", "postal_code": "00300"}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', ARRAY[
  '{"status": "Pending Payment", "updated_at": "2026-06-09T12:00:00Z", "updated_by": "system"}'::jsonb
]),

-- Order 2: Payment Receipt Uploaded (needs verification)
('o1000000-0000-0000-0000-000000000002', 'c2222222-2222-2222-2222-222222222222', '[
  {"product_id": "p1000000-0000-0000-0000-000000000005", "name": "Classic White Crop Top", "price": 2100.00, "qty": 2, "size": "S", "color": "White"},
  {"product_id": "p1000000-0000-0000-0000-000000000008", "name": "High-Waist Mom Jeans", "price": 5800.00, "qty": 1, "size": "28", "color": "Light Wash Denim"}
]', 10000.00, 'Uploaded', 'Payment Verification', '{"name": "Avanthi De Silva", "phone": "0719876543", "street": "12/A Kandy Road", "city": "Kiribathgoda", "postal_code": "11600"}', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours', ARRAY[
  '{"status": "Pending Payment", "updated_at": "2026-06-10T07:48:34Z", "updated_by": "system"}'::jsonb,
  '{"status": "Payment Verification", "updated_at": "2026-06-10T08:48:34Z", "updated_by": "customer"}'::jsonb
]),

-- Order 3: Completed Order
('o1000000-0000-0000-0000-000000000003', 'c1111111-1111-1111-1111-111111111111', '[
  {"product_id": "p1000000-0000-0000-0000-000000000006", "name": "Ribbed Square Neck Top", "price": 2400.00, "qty": 1, "size": "S", "color": "Black"}
]', 2400.00, 'Verified', 'Completed', '{"name": "Minoli Perera", "phone": "0771234567", "street": "45 Galle Road", "city": "Colombo 03", "postal_code": "00300"}', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days', ARRAY[
  '{"status": "Pending Payment", "updated_at": "2026-06-05T10:00:00Z", "updated_by": "system"}'::jsonb,
  '{"status": "Payment Verification", "updated_at": "2026-06-05T11:00:00Z", "updated_by": "customer"}'::jsonb,
  '{"status": "Processing", "updated_at": "2026-06-05T13:00:00Z", "updated_by": "admin"}'::jsonb,
  '{"status": "Completed", "updated_at": "2026-06-08T16:00:00Z", "updated_by": "admin"}'::jsonb
]);
