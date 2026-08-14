# Auto Parts E-Commerce Store

## Goal
Build a full-featured auto parts e-commerce website with an industrial rugged design, product catalog, shopping cart, and checkout flow. Shopify was skipped, so the store will run on Lovable Cloud (database + auth) and use offline payment (cash on delivery / bank transfer / pay in store), with no online payment provider.

## Design Direction
- **Style:** Industrial rugged — dark garage-inspired palette with metallic gold accents.
- **Palette:** `#1a1a1a` (near-black), `#d4af37` (gold/brass), `#4a4a4a` (steel gray), `#f5f5f5` (light concrete).
- **Typography:** Bold, condensed display headings (Bebas Neue / Barlow vibe) paired with a clean sans-serif body.
- **Layout:** Hero + card grid for the catalog, clean product detail, slide-out cart, multi-step checkout.

## Technical Stack
- TanStack Start (routing, SSR, server functions)
- Tailwind CSS v4 with custom design tokens in `src/styles.css`
- Lovable Cloud (PostgreSQL, auth)
- Built-in payments (Stripe or Paddle, determined by eligibility check after site build)

## Database Schema
1. `categories` — auto part categories (e.g., Brakes, Engine, Suspension).
2. `products` — SKU, name, description, price, stock, category relation, image, fitment data.
3. `cart_items` — anonymous/guest cart line items.
4. `orders` and `order_items` — placed orders (after checkout).
5. `profiles` — user accounts linked to Cloud auth.

## Build Steps
1. **Design system** — update `src/styles.css` with industrial rugged tokens and custom variants.
2. **Seed data** — create migrations with sample auto parts categories and products.
3. **Core routes**
   - `/` — home/hero + featured categories + featured products.
   - `/products` — product catalog with search, filters, pagination.
   - `/products/$slug` — product detail with add-to-cart.
   - `/cart` — cart page/slide-out with quantity updates.
   - `/checkout` — checkout flow (shipping + payment).
   - `/auth` — sign in / sign up.
   - `/orders` — order history (authenticated).
4. **Cart logic** — server functions for add, update, remove; persist in Lovable Cloud; support guest cart.
5. **Auth** — email/password + Google sign-in via Lovable Cloud.
6. **Checkout & payments** — re-run `recommend_payment_provider`, enable the recommended provider, create checkout session, webhook/order creation.
7. **Polish** — responsive layout, animations, SEO meta on every route.

## Out of Scope for First Version
- Advanced inventory management (multi-location, backorders).
- Real-time shipping rate calculation (use flat-rate or free-threshold shipping).
- Product reviews.

## Next Action
Build the design system, database schema, and seeded products, then implement the storefront routes.
