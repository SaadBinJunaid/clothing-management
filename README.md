# My Clothing Store

A small React + Firebase website for a clothing seller who takes orders in Instagram DMs.

It has two sides:

- **A shop page for customers** — a simple list of products (name, price, image). No cart,
  no checkout: customers message the seller on Instagram, exactly like today.
- **An admin dashboard for the seller** — record Instagram orders by hand, track who has paid
  and who has not, manage products and stock, and turn customer-facing stock numbers on or off.

Read `PROJECT_PLAN.md` for the full plan, the data model, and the reasoning behind each decision.

---

## 1. What you need

- Node.js 18 or newer
- A free Firebase project (https://console.firebase.google.com)

## 2. Run the app

```bash
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173). Without Firebase keys the app
still starts and explains what is missing.

## 3. Connect Firebase (once)

1. Create a Firebase project.
2. **Build → Authentication → Get started → Email/Password → Enable.**
3. **Build → Authentication → Users → Add user**: create the seller's admin account
   (for example `seller@example.com`). This is the only login in the app.
4. **Build → Firestore Database → Create database.** Start in production mode.
5. **Authentication → Users** is where you would add or reset the seller's password.
6. **Project settings → Your apps → Web app → SDK setup and configuration**: copy the config
   values into a new `.env` file in this folder (copy `.env.example` and fill in your own values —
   never type them into `.env.example` itself, that file is the shared template):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...   # optional, see note below
```

`measurementId` (looks like `G-XXXXXXXXXX`) is only shown if you switched on Google Analytics for
the project. It is **optional**: this app does not use Analytics, so leaving it empty changes
nothing. It is only read into the config in `src/firebase.js` in case you add Analytics later.

7. Restart `npm run dev` so Vite picks up the new `.env`.

The `.env` file is already listed in `.gitignore`. Never put service-account private keys or
passwords in it.

## 4. Publish the security rules (important)

Open `firestore.rules`, then either:

- **Firebase console → Firestore Database → Rules**: paste the file contents and press Publish, or
- with the Firebase CLI: `firebase deploy --only firestore:rules`

These rules are what actually protect the seller's data. Hiding buttons in React is not security:
the database itself must refuse to hand orders to anyone who is not signed in.

Quick way to prove it works: log out, open the app, and use the browser console to try
`firestore` reads — signed-out users get "permission denied" for `orders`, while `products`
and the stock visibility setting stay readable so the shop page works for visitors.

## 5. Day-to-day use

1. Open the site and click **Admin login**.
2. **Products and stock** tab: add a product (name, price, optional image URL, stock).
   Use **Customer stock visibility** to decide whether shoppers see stock numbers.
3. **Instagram orders** tab: after a customer messages you, click in the order
   (name, contact, product, quantity). The total is suggested from price × quantity and can be
   edited if you agreed a different price.
4. When the money arrives, press **Mark paid**. Payment status and order status are separate on
   purpose: finishing an order never marks it as paid.
5. Saving an order lowers that product's stock, and an order for more items than you have is
   refused.

## 6. Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the app for local development |
| `npm run build` | Build the production version into `dist/` |
| `npm run preview` | Serve the built version locally |
| `npm run lint` | Check the code for mistakes |
| `npm run check` | Render checks: runs 38 tests that need no Firebase project |

## 7. Which files do what

```
src/
  firebase.js            reads .env and starts Firebase (auth + firestore)
  services/              all database code, one file per topic
    products.js          add / edit / delete products, update stock
    orders.js            save orders (with stock checking), update the two statuses
    settings.js          the stock visibility switch
    validation.js        little helpers that check user input
  pages/
    ShopPage.jsx         customer page
    AdminLoginPage.jsx   email + password login
    AdminDashboardPage.jsx  the seller's two tabs
  components/
    SiteHeader.jsx       store name and navigation
    ProductCard.jsx      one product on the shop page
    admin/               OrderForm, OrdersTable, ProductForm, ProductsList, StockVisibilityToggle
checks/
  render-checks.jsx      optional tests (npm run check)
firestore.rules          security rules to publish in Firebase
.env.example             template for your Firebase keys
```

## 8. What this project deliberately does not do

No cart, checkout, online payments, automatic Instagram integration, customer accounts,
discounts, reviews, chatbots, loyalty programme or analytics — the assignment is only
"let customers see the clothes" plus "let the seller manage DM orders, payment status and stock".
