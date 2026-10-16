# PROJECT_PLAN.md — Instagram Clothing Seller (React + Firebase)

This is the working plan for the project. It is updated at the end of each phase.

---

## 1. Original Assignment Summary

A seller sells clothes through Instagram. Orders arrive as direct messages (DMs), and the
seller is losing track of who paid and who did not. The seller wants:

1. A simple website where customers can see the clothes being sold.
2. A way to manage the orders that currently arrive through Instagram DMs.
3. Firebase as the backend (suggested by the seller's cousin).
4. Customers being able to see stock levels, but only sometimes (seller-controlled).

The seller records orders manually today. This project keeps that manual process but gives it
a proper structure: a customer-facing product listing and a seller-facing admin dashboard.

## 2. Problems to Solve

| # | Problem | Solution in this project |
|---|---------|--------------------------|
| 1 | Orders live in Instagram DMs, so they are easy to lose or forget | A dashboard where each DM order is saved as a record in Cloud Firestore |
| 2 | The seller does not know who paid and who did not | Each order has an explicit `paymentStatus` field (`Paid` / `Unpaid`) the seller can flip |
| 3 | Order progress (waiting, being made, done) is unclear | Each order has a separate `orderStatus` field (`Pending` / `Processing` / `Completed`) |
| 4 | Customers cannot see what is for sale | A public shop page that lists products from Firestore |
| 5 | Stock should be visible only sometimes | One global stock-visibility switch stored in Firestore, controlled by the seller |
| 6 | Anyone could change order/product data if rules are weak | Firebase Authentication for admin login + restrictive Firestore security rules |

## 3. Functional Requirements

### A. Customer-facing shop page
- List clothing products (name, price, image when available).
- Show stock quantity per product only when the seller has enabled stock visibility.
- No cart, no checkout, no customer login — the customer just browses and contacts the seller.

### B. Admin login
- Email/password login through Firebase Authentication.
- Only a signed-in admin can open the dashboard, read orders, and write products/orders.
- Protection is enforced by Firestore security rules, not by hiding buttons in React.

### C. Instagram order management (manual entry)
- Add an order by hand: customer name, customer contact, source (defaults to `Instagram`),
  product, quantity, total amount, payment status, order status.
- View all saved orders (newest first).
- Update `paymentStatus` (Paid / Unpaid) independently of `orderStatus`.
- Orders persist in Firestore (survive refresh).
- Completing an order must NOT change its payment status (separate fields, separate updates).
- No automatic Instagram/DM integration.

### D. Product and stock management
- Add a product, edit a product, update its stock quantity.
- Toggle stock visibility for customers (global switch, stored in Firestore).
- Reject invalid quantities (negative, zero, non-numeric, more than available stock).
- Hiding stock from customers does not disable internal stock tracking.

## 4. Assumptions and Scope Limitations

Assumptions made where the brief was ambiguous (documented here rather than silently built):

1. **Stock visibility = one global switch.** "Customers see stock only sometimes" is read as a
   single seller-controlled on/off setting stored in `settings/stockVisibility`. If the seller
   later wants per-product visibility, the field can move onto each product.
2. **Placing an order reduces stock.** When the seller records an order, the quantity is checked
   against available stock and stock is decremented in the same atomic Firestore transaction
   (so two orders can never sell the same last item). This is what makes "orders cannot exceed
   stock" meaningful over time. The seller can still edit stock quantities manually
   (corrections, new deliveries).
3. **Total amount is auto-calculated but editable** (`price × quantity`), because the seller may
   have agreed on a different price in the DM. `0` is allowed (e.g. "price on DM").
4. **One admin account.** The seller is the only administrator. "Authorized admin" = the single
   email/password account created in Firebase Authentication. Customers never get accounts.
5. **Currency** is displayed as `$`; no multi-currency support (out of scope).
6. **Product fields are minimal:** name, price, optional image URL, stock quantity. Images are
   referenced by URL ("images when available"); no file-upload/storage setup, which would add an
   unnecessary service.
7. **Products can be deleted** (removing a mistaken test product is basic product management).
   Orders cannot be deleted or structurally edited — only their two status fields change, exactly
   as the assignment specifies.
8. **No Firebase credentials are invented.** Configuration comes from a `.env` file
   (see `.env.example`). Without it the app shows a clear setup message instead of crashing.

### Explicitly NOT built (strict scope rules)
Shopping cart, checkout page, online payment gateway, automatic Instagram integration, customer
authentication, coupons/discounts, reviews/ratings, chatbots, loyalty programs, analytics
dashboards, multi-vendor features, order cancellation workflows, extra libraries beyond
`firebase`.

## 5. Proposed React Components and Pages

Navigation is deliberately simple: `App.jsx` keeps a `page` state (`'shop' | 'login' | 'admin'`)
and renders the matching page. No router library — one less dependency to learn.

| File | Responsibility |
|------|----------------|
| `src/App.jsx` | Holds the current page + logged-in admin user; renders header and the active page |
| `src/pages/ShopPage.jsx` | Customer page: loads products + stock-visibility setting, renders the grid |
| `src/pages/AdminLoginPage.jsx` | Email/password form, calls Firebase `signInWithEmailAndPassword` |
| `src/pages/AdminDashboardPage.jsx` | Admin shell with two tabs: Orders and Products |
| `src/components/SiteHeader.jsx` | Store name + nav buttons (Shop, Admin / Log out) |
| `src/components/ProductCard.jsx` | One product on the shop page (image, name, price, optional stock line) |
| `src/components/admin/OrderForm.jsx` | Form to manually add an Instagram order |
| `src/components/admin/OrdersTable.jsx` | Lists orders; buttons to flip payment status / advance order status |
| `src/components/admin/ProductForm.jsx` | Add / edit a product (name, price, image URL, stock) |
| `src/components/admin/ProductsList.jsx` | Lists products with stock editing + visibility/delete controls |
| `src/components/admin/StockVisibilityToggle.jsx` | The seller's show/hide stock switch |

### Supporting (non-component) files

| File | Responsibility |
|------|----------------|
| `src/firebase.js` | Reads Firebase config from `.env`, initializes and exports `auth` + `db` |
| `src/services/products.js` | Firestore operations for products (add, update, stock, visibility, delete) |
| `src/services/orders.js` | Firestore operations for orders (add with stock check, status updates) |
| `src/services/settings.js` | Firestore operations for the stock-visibility setting |
| `firestore.rules` | Security rules protecting admin-only data |
| `.env.example` | Template listing the Firebase keys that must be filled in |

## 6. Firebase Data Model

### Firestore collections

```
products/{productId}
  name            string   product name, e.g. "Linen Summer Dress"
  price           number   price in USD, >= 0
  imageUrl        string   optional image URL ("" when unavailable)
  stockQuantity   number   internal stock count, integer >= 0
  createdAt       timestamp  server creation time

orders/{orderId}
  customerName    string   who ordered (from the DM)
  customerContact string   Instagram handle / phone / email — free text
  source          string   where the order came from; always "Instagram" for now
  productId       string   stable reference to a product in `products`
  productName     string   copy of the name at order time (kept so history stays readable)
  quantity        number   how many items, integer >= 1
  totalAmount     number   agreed total, >= 0
  paymentStatus   string   "Paid" | "Unpaid"   ← independent of orderStatus
  orderStatus     string   "Pending" | "Processing" | "Completed"
  createdAt       timestamp  server creation time

settings/stockVisibility
  visible         boolean  true = customers see stock on the shop page
  updatedAt       timestamp  when the seller last flipped the switch
```

Key design points:
- `paymentStatus` and `orderStatus` are **separate fields** updated by separate functions, so
  completing an order never implies it was paid.
- Orders store both `productId` (stable ID) and `productName` (snapshot), so an order stays
  understandable even if the product is renamed or deleted.
- No payment card data is ever stored. An order record never proves payment — the seller flips
  `paymentStatus` manually after seeing the money arrive.

### Firestore security rules (summary — full file in `firestore.rules`)
- `products` and `settings`: **public read** (customers must browse), **write only when signed in**,
  with field validation (names are strings, stock/price >= 0).
- `orders`: **read and write only when signed in** — customers and anonymous visitors can never
  read orders.
- No collection is left open for write without validation.

### Firebase Authentication
- Email/password sign-in for the single admin account (created once in the Firebase console).

## 7. Proposed Folder Structure

```
clothing-store/
├── PROJECT_PLAN.md          ← this file
├── README.md                ← setup steps for Firebase, admin account and rules
├── .env.example             ← Firebase keys template (real .env is git-ignored)
├── firestore.rules          ← security rules to deploy
├── index.html
├── package.json
├── checks/
│   └── render-checks.jsx    ← optional render/behaviour checks (npm run check, no Firebase needed)
└── src/
    ├── main.jsx             ← React entry point
    ├── App.jsx              ← page switching + auth state
    ├── index.css            ← global styles
    ├── firebase.js          ← Firebase init (config from .env)
    ├── services/
    │   ├── products.js
    │   ├── orders.js
    │   └── settings.js
    ├── pages/
    │   ├── ShopPage.jsx
    │   ├── AdminLoginPage.jsx
    │   └── AdminDashboardPage.jsx
    └── components/
        ├── SiteHeader.jsx
        ├── ProductCard.jsx
        └── admin/
            ├── OrderForm.jsx
            ├── OrdersTable.jsx
            ├── ProductForm.jsx
            ├── ProductsList.jsx
            └── StockVisibilityToggle.jsx
```

## 8. Step-by-Step Implementation Phases

Followed in order, per the assignment's workflow:

- **Step 1 — Inspect project.** Done: fresh Vite + React 19 (JS) template, nothing to preserve.
- **Step 2 — This plan.** Done; reviewed against the assignment before coding.
- **Step 3 — Setup.** Done: installed `firebase` (the only added dependency), added `.env.example`.
- **Step 4 — Basic structure + simple UI (Phase 1 CSS).** Done: pages/components with minimal
  styling — plain headings, basic forms, simple tables.
- **Step 5 — Core functionality (Phase 2).** Done: product listing, product management, order
  entry, order listing, status updates, stock editing, visibility toggle.
- **Step 6 — Firebase connection.** Done: services + Firestore reads/writes, live data via listeners.
- **Step 7 — Auth + security rules.** Done: admin login, guarded dashboard in `App.jsx`, `firestore.rules`.
- **Step 8 — Testing.** Done as far as possible: lint + build + 38 render/behaviour checks pass;
  the Firestore-dependent checks need a project. See section 9 for results and section 12 for the
  errors that were found and fixed.
- **Step 9 — Final CSS (Phase 3).** Done: clean, professional, responsive design only.
- **Step 10 — Final review.** Done against the acceptance criteria; see sections 11 and 12.

## 9. Testing Checklist

Items marked 🔑 need a real Firebase project (see README section 3–4). Everything else has been
run and is recorded below.

Static / local (executed):
- [x] `npm run lint` passes with no errors.
- [x] `npm run build` completes without errors.
- [x] `npm run check` — 38 render/behaviour checks pass (`checks/render-checks.jsx`). This
      actually executes every component with `react-dom/server` and verifies: every component
      renders, stock is shown/hidden exactly as the switch says, the header only offers admin
      actions when logged in, the order form contains both status lists separately, the input
      helpers reject bad values, and the services refuse unknown statuses / invalid stock.
- [x] App renders the shop page with a clear "Firebase is not set up yet" notice when `.env`
      is missing (no crash) — checked both with and without a (temporary, then deleted) fake
      `.env`, to make sure importing Firebase with real-looking keys does not break rendering.

Shop page 🔑
- [ ] Products added by the admin appear for a logged-out visitor.
- [x] With stock visibility OFF, no stock numbers are shown to customers (verified in
      `npm run check` with `showStock={false}`).
- [x] With stock visibility ON, each product shows its stock quantity (verified in
      `npm run check`, including "Out of stock" at zero).

Admin login 🔑
- [ ] Wrong password is rejected with a readable error.
- [ ] Correct credentials open the dashboard.
- [ ] A logged-out visitor cannot see orders/products data (rules deny it, not just hidden UI).

Orders 🔑
- [ ] A manually entered order appears in the list and survives a page refresh.
- [ ] Payment toggle flips Paid ↔ Unpaid without touching order status.
- [ ] Order status advances Pending → Processing → Completed without touching payment status.
- [ ] An order with quantity larger than available stock is rejected with a message.
- [ ] Adding an order decreases the product's stock by the ordered quantity.

Products 🔑
- [ ] Add / edit product works; invalid (negative, non-numeric) stock or price is rejected.
- [ ] Stock visibility switch persists after refresh and affects the shop page.
- [x] Invalid input is refused before anything reaches Firestore (verified in `npm run check`:
      negative and fractional stock, unknown payment/order statuses).

Security 🔑
- [ ] `firestore.rules` deployed; a signed-out client cannot read `orders` or write any collection.

**Why some boxes stay unticked:** no Firebase project credentials were supplied, and the
assignment says not to invent them. The code paths behind those boxes are written and reviewed,
but they can only be proven by the seller once `.env` exists and the rules are published.
Nothing in this project is claimed to work until it has been run.

## 10. Final CSS Improvement Phase (Phase 3)

Done, after the local checklist items passed:
- [x] Cohesive clothing-store look: design values in `:root` (colours, spacing, radius, shadows),
      serif headings, max-width container, soft background.
- [x] Shop page: welcome banner, responsive product grid (`auto-fill` + `minmax`), 4:5 image
      area, "No image" placeholder, hover lift on cards.
- [x] Admin dashboard: white panels, two-column form grid that collapses on small screens,
      readable tables with sticky-looking headers, pill status badges (green = done, amber =
      waiting, blue = busy), styled stock-visibility switch.
- [x] Responsive behaviour for phone widths plus visible keyboard focus outlines.
- [x] No new business features added during this phase (the only markup change was a
      presentational welcome banner on the shop page).

## 11. Completion Criteria

Verified locally (`lint`, `build`, `npm run check`) or written and awaiting Firebase keys 🔑:

- [x] Customers can view products (names, prices, images) on the shop page — code + render checks;
      [ ] 🔑 see them with real data.
- [x] Seller can log in and reach the admin dashboard; strangers cannot — login page, guarded
      render, restrictive rules; [ ] 🔑 proven with a real Firebase project.
- [x] Seller can manually add Instagram orders; records are written to Firestore and displayed
      from live listeners (so they survive a refresh); [ ] 🔑 confirmed end to end.
- [x] Payment status and order status are tracked as separate fields with separate update
      functions — completing an order never marks it paid.
- [x] Products, stock quantities, and stock visibility are all manageable, with invalid values
      refused.
- [x] Firestore security rules written and commented; [ ] 🔑 deployed and attacked, to confirm.
- [x] Core functionality tested where possible; limitations reported honestly.
- [x] Final CSS clean, professional, responsive.
- [x] Code stays beginner-readable with useful comments, small components, clear names.
- [x] No out-of-scope features added.

## 12. Progress Log

**Step 1 — Inspect (done).** Existing folder was a fresh Vite + React 19 template in JavaScript.
Nothing had been built yet, so nothing needed preserving. No `.env` and no Firebase config existed.

**Steps 2–3 — Plan and setup (done).** Wrote this plan first. Installed `firebase` (the only new
dependency) and added `.env.example`; `.env` plus service-account files are git-ignored.
Verified with a throwaway Node script that Firebase throws at import time on an empty config —
which is why `src/firebase.js` only initialises when keys are present and the pages show a
friendly setup notice otherwise.

**Steps 4–6 — Structure, simple UI, functionality, Firebase (done).** Created the pages and
components listed above with deliberately plain Phase 1 CSS, plus the three service files that
hold all Firestore code. Data is loaded with `onSnapshot` listeners, so the shop and dashboard
update themselves and orders survive a refresh.

**Step 7 — Auth and rules (done).** `AdminLoginPage` uses Firebase email/password sign-in; `App`
only renders the dashboard for a real signed-in user; `firestore.rules` makes products/settings
public-read and everything else admin-only, with field validation.

**Step 8 — Testing (done as far as possible).** `npm run lint` clean, `npm run build` succeeds,
and `npm run check` runs 38 passing render/behaviour checks. Three lint errors found during this
step were fixed properly rather than silenced: an unused import, a setState-in-effect in `App`
(now derived from `auth !== null`), and a props-into-state effect in `ProductForm` (now uses the
React `key` remount pattern). One correctness fix: order saving moved from a batch to a
`runTransaction` so two orders cannot oversell the same last item.

**Step 9 — Final CSS (done).** Replaced the Phase 1 stylesheet with the organised Phase 3
stylesheet described in section 10.

**Step 10 — Final review (done).** Checked every feature against the acceptance criteria. The
only outstanding work is the 🔑 list above, which needs a Firebase project.

### Remaining issues / honest limitations
- No Firebase credentials were provided, so nothing that touches a live database has been
  executed: signing in, reading products, saving orders, updating statuses and the deployed
  rules are all still to be proven by the seller. Run `npm run dev` after filling in `.env`.
- `npm run build` warns that the JavaScript bundle is over 500 kB, which is normal for the
  Firebase SDK in a small app; it is a note, not an error. Code-splitting was not added because
  it would make the code harder to follow for no benefit at this size.
- Images are stored as URLs. Uploading files would need Firebase Storage, which the assignment
  does not ask for.
