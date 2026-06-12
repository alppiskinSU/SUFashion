# Step 7 — Security & Concurrency (Features 16 & 17)

**Final demo:** Explain these protections verbally. Do not open this file during the live demo (course rule: no presentation documents). Use it as a personal study guide only.

**One-liner to open Step 7:**  
"We protect sensitive flows with authentication, role separation, database RLS, HTTP hardening, and input validation; for concurrency we use atomic stock updates and rollbacks so multiple users cannot oversell the same product."

---

## Feature 16 — Security Awareness & Defensive Programming

### 1. Authentication (passwords & sessions)

- Registration and login go through **Supabase Auth**. Passwords are **never stored in plain text**; Supabase hashes them server-side.
- Protected API routes require a **JWT** in the `Authorization: Bearer <token>` header.
- `authMiddleware` (`backend/middleware/authMiddleware.js`) validates the token on every protected request; invalid/missing token → **401**.

### 2. Role-based access control (privilege separation)

Three roles must not be mixed:

| Role | Examples of what they can do |
|------|------------------------------|
| `customer` | Browse, cart, checkout, wishlist, own orders/refunds |
| `product_manager` | Categories, products, stock, deliveries, approve reviews |
| `sales_manager` | Pricing, discounts, invoices, revenue charts, refund approval |

**Backend:** `requireRole('sales_manager', ...)` on routes — wrong role → **403**.  
**Frontend:** `RequireAdmin` guards `/admin`; `BlockAdmin` keeps managers off the customer storefront.

### 3. Database — Row Level Security (RLS)

- Tables such as `profiles`, `orders`, `credit_cards`, `invoices`, `cart_items`, `reviews` have **RLS enabled** (see `supabase-sql/*.sql`).
- Logged-in users can only access **their own rows** (e.g. own cards, own cart).
- The backend uses the **service role key** only on the server (`.env`, never shipped to the browser). Admin operations run with elevated privileges in a controlled way.

### 4. Session isolation (no service-role leak)

- Login/refresh uses a **dedicated anon Supabase client** (`supabaseAuth` in `authRoutes.js`).
- If login ran on the shared service-role client, the session would attach to that client and later DB queries could run under the **wrong user context** (RLS bypass risk).

### 5. HTTP-layer hardening (`server.js`)

- **Helmet** — security headers (XSS mitigation, MIME sniffing, etc.).
- **CORS** — only allowed frontend origins (default `http://localhost:5173`).
- **Rate limiting** on `/api/auth` — max 10 requests/minute per IP (brute-force protection on login/register).

### 6. Input validation & sanitization

- **Register:** `sanitize()` trims strings; email format check; minimum password length (`authRoutes.js`).
- **Checkout:** card number (16 digits), expiry (MM/YY, not expired), CVV — validated on the client before submit (`Checkout.jsx`).
- **Card data is not sent to the order API** — only shipping/contact fields go to the backend (mock payment; reduces exposure of PAN/CVV).

### 7. Sensitive data handling

- **Passwords:** Supabase Auth (hashed).
- **Credit cards:** `credit_cards` table stores only `last4`, brand, expiry in clear form; sensitive token field designed for **pgcrypto** encryption (`supabase-sql/credit_cards.sql`).
- **Invoices:** PDF generation and email; access restricted by auth + role on invoice routes.
- **Secrets:** `.env` is in `.gitignore`; `SUPABASE_SERVICE_ROLE_KEY` and SMTP credentials stay on the server.

### 8. Business-rule defenses (defensive programming)

- **Refunds:** only the order owner (`order.user_id === req.user.id`); only `delivered` orders; **30-day window**; duplicate pending/approved refund blocked (`refundRoutes.js`).
- **Order status:** only allowed transitions (e.g. `processing` → `shipped` → `delivered`); terminal states cannot be changed (`ALLOWED_TRANSITIONS` in `orderRoutes.js`).
- **Reviews:** purchasers only; comments need product-manager approval before public display.
- **Ownership checks** on orders/refunds so users cannot act on another customer's data.

---

## Feature 17 — Concurrency

### 1. Atomic stock decrement (main demo point)

**Problem:** Two customers checkout the last unit of Product B at the same time. Both might read `quantity = 1` and both succeed without protection → **overselling**.

**Solution:** Conditional update in `orderRoutes.js`:

```js
.update({ quantity: newQty })
.eq('id', product_id)
.gte('quantity', quantity)  // only succeeds if stock is STILL >= requested qty
```

- If another request consumed stock first, `updatedRows` is empty → **409** / "stock changed, try again".
- Same pattern in **batch checkout** (`POST /api/orders/batch`).

**Demo tie-in:** "Step 3 bought Product B when stock was 1; this guard ensures two simultaneous checkouts cannot both succeed."

### 2. Batch order rollback

- Multi-item checkout loops over products. If step 4 fails after stock was decremented, **`rollbackStocks()`** restores previous quantities.
- Prevents **partial orders with wrong inventory** under failure.

### 3. Double-submit protection

- Checkout sets `submitting` flag — rapid double-clicks on "Place Order" do not fire duplicate requests (`Checkout.jsx`).

### 4. Token refresh mutex (`authFetch.js`)

- Many parallel API calls getting **401** could each trigger a refresh and **invalidate the refresh token**.
- A single in-flight `_refreshPromise` ensures only **one refresh at a time**; others await the same result.

### 5. Duplicate refund guard

- Before creating a refund, the API checks for existing `pending` or `approved` refund on the same order → **409** if duplicate.

### 6. Architecture note

- **Node/Express** handles many concurrent HTTP connections.
- **PostgreSQL (Supabase)** provides transactional consistency; our critical path adds **application-level optimistic locking** on stock via conditional `UPDATE`.

---

## Suggested verbal flow (~2–3 minutes)

1. **Security:** Auth + JWT, three roles separated on API and UI, RLS in DB, helmet/CORS/rate limit, validated inputs, secrets in `.env`.
2. **Concurrency:** Atomic stock with `.gte(quantity)`, rollback on batch failure, double-submit and refresh mutex as extra guards.
3. **Optional:** Point to `orderRoutes.js` or `server.js` in the repo if the TA asks for code — do not read from this markdown during the demo.

---

## File map (where comments were added)

| File | Topic |
|------|--------|
| `backend/routes/orderRoutes.js` | Atomic stock, rollback, status transitions |
| `backend/middleware/authMiddleware.js` | JWT auth, role checks |
| `backend/server.js` | Helmet, CORS, rate limit |
| `backend/routes/authRoutes.js` | Sanitization, isolated auth client |
| `frontend/src/lib/authFetch.js` | Refresh mutex |
