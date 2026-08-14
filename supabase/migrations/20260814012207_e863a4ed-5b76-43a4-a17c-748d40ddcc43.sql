-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly viewable" ON public.categories FOR SELECT USING (true);

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  brand TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  sale_price NUMERIC(10,2) CHECK (sale_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  fitment TEXT,
  warranty TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly viewable" ON public.products FOR SELECT USING (true);
CREATE INDEX products_category_idx ON public.products(category_id);

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ CARTS ============
CREATE TABLE public.carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT ALL ON public.carts TO service_role;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Carts are managed by their session owner" ON public.carts FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cart items are managed by their cart owner" ON public.cart_items FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX cart_items_cart_idx ON public.cart_items(cart_id);

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE DEFAULT ('AP-' || upper(substr(md5(gen_random_uuid()::text), 1, 8))),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_postal_code TEXT,
  notes TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash_on_delivery', 'bank_transfer', 'pay_in_store')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'shipped', 'completed', 'cancelled')),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can add items to an order" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view items of own orders" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id IS NOT NULL AND o.user_id = auth.uid())
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);

-- ============ SEED CATEGORIES ============
INSERT INTO public.categories (name, slug, description, icon, sort_order) VALUES
('Brakes', 'brakes', 'Pads, rotors, calipers and brake lines for confident stopping power.', 'disc', 1),
('Engine', 'engine', 'Internal engine components, gaskets, belts and timing parts.', 'cog', 2),
('Suspension', 'suspension', 'Shocks, struts, springs and control arms for a planted ride.', 'move-vertical', 3),
('Filters', 'filters', 'Oil, air, fuel and cabin filters to keep everything clean.', 'filter', 4),
('Electrical', 'electrical', 'Batteries, alternators, starters, sensors and wiring.', 'zap', 5),
('Exhaust', 'exhaust', 'Mufflers, headers, catalytic converters and full systems.', 'wind', 6),
('Lighting', 'lighting', 'Headlights, tail lights, LED bulbs and light bars.', 'lightbulb', 7),
('Fluids & Oils', 'fluids-oils', 'Motor oil, coolant, brake fluid and additives.', 'droplet', 8);

-- ============ SEED PRODUCTS ============
INSERT INTO public.products (category_id, sku, name, slug, description, brand, price, sale_price, stock, fitment, warranty, is_featured) VALUES
((SELECT id FROM public.categories WHERE slug='brakes'), 'BRK-1001', 'Ceramic Brake Pad Set - Front', 'ceramic-brake-pad-set-front', 'Low-dust ceramic compound front brake pads with chamfered edges and slotted design for quiet, fade-resistant braking. Includes shims and lubricant.', 'TorqueLine', 89.99, 74.99, 42, 'Fits most 2012-2022 sedans and crossovers', '2 year / 24,000 mi', true),
((SELECT id FROM public.categories WHERE slug='brakes'), 'BRK-1002', 'Drilled & Slotted Rotor Pair', 'drilled-slotted-rotor-pair', 'Cross-drilled and slotted vented rotors with a zinc-coated finish that resists rust and sheds heat fast under repeated hard stops.', 'TorqueLine', 179.99, NULL, 26, 'Front axle, 320mm - verify with VIN', '2 year / 24,000 mi', true),
((SELECT id FROM public.categories WHERE slug='brakes'), 'BRK-1003', 'Remanufactured Brake Caliper', 'remanufactured-brake-caliper', 'Fully rebuilt caliper with new seals, pistons and hardware. Pressure tested and ready to bolt on.', 'IronCore', 124.50, NULL, 14, 'Driver side front, common domestic trucks', '1 year unlimited', false),
((SELECT id FROM public.categories WHERE slug='brakes'), 'BRK-1004', 'Stainless Braided Brake Line Kit', 'stainless-braided-brake-line-kit', 'DOT-compliant stainless braided lines that eliminate pedal sponginess and hold up to high heat.', 'IronCore', 149.00, 129.00, 9, 'Universal 4-line kit with fittings', '1 year unlimited', false),

((SELECT id FROM public.categories WHERE slug='engine'), 'ENG-2001', 'Timing Belt & Water Pump Kit', 'timing-belt-water-pump-kit', 'Complete interference-engine service kit: HNBR timing belt, tensioner, idlers, water pump and gasket. Everything for one job in one box.', 'ForgeWorks', 249.00, 219.00, 18, '4-cylinder interference engines, 2005-2018', '3 year / 36,000 mi', true),
((SELECT id FROM public.categories WHERE slug='engine'), 'ENG-2002', 'Multi-Layer Steel Head Gasket', 'multi-layer-steel-head-gasket', 'MLS head gasket rated for boosted applications, with laser-cut sealing beads for repeatable clamp load.', 'ForgeWorks', 96.75, NULL, 31, 'Turbocharged 2.0L platforms', '1 year unlimited', false),
((SELECT id FROM public.categories WHERE slug='engine'), 'ENG-2003', 'Serpentine Belt - EPDM', 'serpentine-belt-epdm', 'EPDM construction runs quieter and lasts up to twice as long as standard neoprene belts.', 'ForgeWorks', 32.99, NULL, 88, '6-rib, 2180mm - check routing diagram', '2 year / 24,000 mi', false),
((SELECT id FROM public.categories WHERE slug='engine'), 'ENG-2004', 'Aluminum Radiator - Dual Core', 'aluminum-radiator-dual-core', 'TIG-welded dual-core aluminum radiator that drops coolant temps significantly on towing and track duty.', 'IronCore', 289.00, 259.00, 7, 'Full-size trucks 1999-2013', '3 year / 36,000 mi', true),

((SELECT id FROM public.categories WHERE slug='suspension'), 'SUS-3001', 'Gas Shock Absorber - Rear Pair', 'gas-shock-absorber-rear-pair', 'Nitrogen gas-charged twin-tube shocks that restore factory ride control and cut body roll.', 'RoadGrip', 158.00, NULL, 24, 'Rear axle, most mid-size SUVs', '2 year / 24,000 mi', false),
((SELECT id FROM public.categories WHERE slug='suspension'), 'SUS-3002', 'Complete Strut Assembly', 'complete-strut-assembly', 'Preassembled strut with coil spring, mount and bearing. No spring compressor needed - bolt it in and go.', 'RoadGrip', 199.99, 174.99, 16, 'Front, 2010-2020 compact cars', '2 year / 24,000 mi', true),
((SELECT id FROM public.categories WHERE slug='suspension'), 'SUS-3003', 'Front Lower Control Arm', 'front-lower-control-arm', 'Stamped-steel control arm with pressed-in ball joint and bushings installed, ready for alignment.', 'RoadGrip', 112.00, NULL, 21, 'Driver side front, common sedans', '1 year unlimited', false),
((SELECT id FROM public.categories WHERE slug='suspension'), 'SUS-3004', 'Polyurethane Sway Bar Bushing Kit', 'polyurethane-sway-bar-bushing-kit', 'Greasable poly bushings that sharpen steering response and outlast rubber originals.', 'RoadGrip', 44.50, 38.00, 54, 'Universal 28mm sway bars', '1 year unlimited', false),

((SELECT id FROM public.categories WHERE slug='filters'), 'FLT-4001', 'Premium Oil Filter', 'premium-oil-filter', 'Synthetic media oil filter with silicone anti-drainback valve rated for extended-interval synthetic oil.', 'PureFlow', 14.99, NULL, 140, 'Most 4 and 6 cylinder engines', '1 year unlimited', false),
((SELECT id FROM public.categories WHERE slug='filters'), 'FLT-4002', 'High-Flow Engine Air Filter', 'high-flow-engine-air-filter', 'Washable, reusable cotton-gauze air filter that increases airflow and pays for itself over time.', 'PureFlow', 59.99, 49.99, 63, 'Panel style - verify dimensions', 'Lifetime', true),
((SELECT id FROM public.categories WHERE slug='filters'), 'FLT-4003', 'Charcoal Cabin Air Filter', 'charcoal-cabin-air-filter', 'Activated-charcoal cabin filter that traps pollen, dust and road odors before they reach the vents.', 'PureFlow', 24.95, NULL, 97, 'Most 2008+ passenger vehicles', '1 year unlimited', false),
((SELECT id FROM public.categories WHERE slug='filters'), 'FLT-4004', 'Inline Fuel Filter', 'inline-fuel-filter', 'Steel-cased inline fuel filter with pleated micro-glass media to protect injectors and the fuel pump.', 'PureFlow', 21.50, NULL, 72, '5/16in inline, universal', '1 year unlimited', false),

((SELECT id FROM public.categories WHERE slug='electrical'), 'ELE-5001', 'AGM Deep Cycle Battery - Group 48', 'agm-deep-cycle-battery-group-48', 'Sealed AGM battery with 760 CCA, strong vibration resistance and excellent recovery for start-stop vehicles.', 'VoltEdge', 229.00, 199.00, 20, 'Group 48 (H6) tray', '3 year free replacement', true),
((SELECT id FROM public.categories WHERE slug='electrical'), 'ELE-5002', 'Remanufactured Alternator 150A', 'remanufactured-alternator-150a', 'Rebuilt 150-amp alternator with new bearings, brushes and regulator. Bench tested for output and noise.', 'VoltEdge', 218.75, NULL, 12, 'Verify pulley and connector', '2 year / 24,000 mi', false),
((SELECT id FROM public.categories WHERE slug='electrical'), 'ELE-5003', 'High-Torque Starter Motor', 'high-torque-starter-motor', 'Gear-reduction starter that cranks faster and draws less current, ideal for high-compression builds.', 'VoltEdge', 189.00, NULL, 15, 'Common V8 applications', '2 year / 24,000 mi', false),
((SELECT id FROM public.categories WHERE slug='electrical'), 'ELE-5004', 'Upstream Oxygen Sensor', 'upstream-oxygen-sensor', 'Direct-fit heated O2 sensor with OE connector and pre-loaded anti-seize. Clears lean and rich codes.', 'VoltEdge', 78.40, 68.40, 38, 'Bank 1 Sensor 1, most 2004+ vehicles', '1 year unlimited', false),

((SELECT id FROM public.categories WHERE slug='exhaust'), 'EXH-6001', 'Stainless Performance Muffler', 'stainless-performance-muffler', 'Straight-through 304 stainless muffler with a deep tone and minimal interior drone.', 'HeatWave', 164.00, 144.00, 19, '2.5in center in / center out', '3 year / 36,000 mi', true),
((SELECT id FROM public.categories WHERE slug='exhaust'), 'EXH-6002', 'Ceramic Coated Header', 'ceramic-coated-header', 'Equal-length ceramic-coated header that lowers underhood temps and frees up midrange power.', 'HeatWave', 379.00, NULL, 6, 'Popular 4-cylinder platforms', '1 year unlimited', false),
((SELECT id FROM public.categories WHERE slug='exhaust'), 'EXH-6003', 'Direct-Fit Catalytic Converter', 'direct-fit-catalytic-converter', 'EPA-compliant direct-fit converter with flanges and hardware included for a bolt-on repair.', 'HeatWave', 342.50, NULL, 8, 'Verify emissions compliance for your state', '5 year / 50,000 mi', false),

((SELECT id FROM public.categories WHERE slug='lighting'), 'LGT-7001', 'LED Headlight Conversion Kit', 'led-headlight-conversion-kit', 'Plug-and-play 6000K LED headlight kit with copper-braid heat sinks and a focused beam pattern that keeps glare down.', 'BeamLine', 119.99, 99.99, 47, 'H11 / 9005 - check bulb size', '2 year / 24,000 mi', true),
((SELECT id FROM public.categories WHERE slug='lighting'), 'LGT-7002', 'Smoked LED Tail Light Pair', 'smoked-led-tail-light-pair', 'Sequential LED tail lights with a smoked lens and sealed housings rated for weather and wash bays.', 'BeamLine', 289.00, 249.00, 11, 'Popular truck applications 2015-2021', '1 year unlimited', false),
((SELECT id FROM public.categories WHERE slug='lighting'), 'LGT-7003', '20in Dual-Row LED Light Bar', 'dual-row-led-light-bar-20in', 'IP68-rated dual-row light bar with a combo spot/flood pattern and included wiring harness with switch.', 'BeamLine', 149.00, NULL, 33, 'Universal with brackets', '2 year / 24,000 mi', false),

((SELECT id FROM public.categories WHERE slug='fluids-oils'), 'FLD-8001', 'Full Synthetic Motor Oil 5W-30 - 5qt', 'full-synthetic-motor-oil-5w30-5qt', 'Full synthetic 5W-30 with a strong additive package for wear protection and deposit control on long intervals.', 'PureFlow', 39.99, 34.99, 120, 'API SP / dexos1 Gen 3', 'N/A', true),
((SELECT id FROM public.categories WHERE slug='fluids-oils'), 'FLD-8002', 'DOT 4 Brake Fluid - 32oz', 'dot-4-brake-fluid-32oz', 'High dry boiling point DOT 4 fluid for street and track use. Sealed foil liner keeps moisture out.', 'IronCore', 18.99, NULL, 86, 'DOT 3 and DOT 4 systems', 'N/A', false),
((SELECT id FROM public.categories WHERE slug='fluids-oils'), 'FLD-8003', 'Extended Life Coolant - 1 Gal', 'extended-life-coolant-1-gal', 'Prediluted 50/50 extended-life coolant, phosphate free and safe for aluminum radiators and heater cores.', 'ForgeWorks', 26.50, NULL, 74, 'Most modern gas and diesel engines', 'N/A', false);