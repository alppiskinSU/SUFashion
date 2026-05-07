# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Frontend and backend are independent — run each in a separate terminal.

**Frontend** (`frontend/`):
```bash
npm run dev      # Vite dev server (HMR)
npm run build    # Production build
npm run lint     # ESLint check
```

**Backend** (`backend/`):
```bash
npm run dev      # nodemon auto-reload
npm start        # production
```

There are no tests configured in either package.

## Architecture

This is a fashion e-commerce app (SUFashion) with a split frontend/backend, both backed by the same Supabase project.

```
frontend/   React 19 + Vite + React Router v7 + Tailwind CSS
backend/    Express.js (CommonJS, port 3000)
supabase-sql/  Schema SQL files (not migrations — apply manually)
atelier_su/ Design system documentation (DESIGN.md)
```

### Frontend

- `src/pages/` — one file per route (Home, Collections, ProductDetail, Checkout, OrderConfirmation, OrderTracking, Search, Login, Signup, About)
- `src/components/` — grouped by page/feature: `home/`, `collections/`, `layout/`, `ui/`
- `src/contexts/CartContext.jsx` — global cart state via React Context
- `src/utils/supabase.js` — Supabase client (anon key, reads `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`)

The frontend talks directly to Supabase for reads (products, reviews) and to the Express backend (`/api/*`) for writes and privileged operations.

### Backend

`server.js` mounts six route files:

| Route prefix | File | Purpose |
|---|---|---|
| `/api/products` | productRoutes.js | Product listing/detail |
| `/api/auth` | authRoutes.js | Auth helpers |
| `/api/cart` | cartRoutes.js | Cart CRUD |
| `/api/orders` | orderRoutes.js | Order placement/tracking |
| `/api/reviews` | reviewRoutes.js | Review submission |
| `/api/invoice` | invoiceRoutes.js | Invoice generation + email (Nodemailer) |

`backend/db.js` initializes a Supabase client with the **service role key** — this bypasses RLS and is only used server-side.

### Database (Supabase/PostgreSQL)

Core tables: `products`, `profiles`, `orders`, `cart_items`, `reviews`, `credit_cards`, `invoices`.

Key design decisions:
- **RLS is the primary authorization layer.** Policies enforce that users only see their own orders, cart items, invoices, and profile.
- **Guest cart support:** `cart_items` has a nullable `user_id` and a `session_id` for unauthenticated users.
- **Invoice auto-numbering:** A DB trigger generates `INV-YYYYMMDD-XXXXX` format on insert.
- **Profile auto-creation:** A trigger creates a `profiles` row on `auth.users` insert.
- **Credit card tokens** are stored encrypted with `pgp_sym_encrypt` (pgcrypto extension).

The `supabase-sql/` files contain the DDL and RLS policies. Apply them via the Supabase SQL editor — there is no migration runner.

## Environment Variables

**Frontend** (`.env` in `frontend/`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

**Backend** (`.env` in `backend/`):
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3000
```

## Design System Rules

The UI follows a strict editorial/brutalist aesthetic documented in `atelier_su/DESIGN.md`. When making any UI changes:

- **0px border-radius everywhere** — no rounded corners, no pills
- **No 1px borders** — use background color shifts (`surface` → `surface-container` → `surface-container-highest`) to define sections
- **Color palette:** background `#fcf9f8`, primary/text `#161717` (not pure black), accent yellow `#ffde59`
- **Typography:** Playfair Display / Noto Serif for headings, Outfit / Plus Jakarta Sans for body
- **Transitions:** always use `cubic-bezier(0.22, 1, 0.36, 1)`
- **Shadows:** "ghost shadow" only — `0px 24px 48px rgba(28, 28, 27, 0.06)`
- **Icons:** Lucide React at 1px stroke-weight
- **Section spacing:** 7rem (`space-28` in Tailwind) between major sections
- **CTA buttons** (Add to Cart): `#ffde59` background — this is a deliberate design choice, not an accident
- The `QuickLookDrawer` component slides in from the right as a side drawer, not a modal
