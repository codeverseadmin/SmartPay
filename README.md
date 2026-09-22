# SMARTPAY — Merchant Payment Collection & Reconciliation

> **Collect smarter. Reconcile faster.**

SmartPay is a production-quality web application prototype for merchant payment collection and reconciliation. It helps Indian SMBs create payment plans, generate UPI QR codes, track collections against invoices, and streamline manual payment reconciliation without external payment gateways.

---

## ⚡ Quick Start

### Zero Configuration — Works Out of the Box!
SmartPay features an intelligent **Dual-Mode Data Layer**:
- If MongoDB is running or `MONGODB_URI` is configured, it connects to MongoDB.
- If external MongoDB is not detected, it seamlessly runs on a high-performance **local persistent JSON store** (`.data/smartpay-db.json`) with zero external software required!

### 1. Install Dependencies

```bash
cd smartpay-app
npm install
```

### 2. Configure Environment (Optional)

```bash
cp .env.local.example .env.local
```

`.env.local`:
```env
# Optional: defaults to local persistent store if MongoDB is not running
MONGODB_URI=mongodb://localhost:27017/smartpay
JWT_SECRET=smartpay-pilot-secret-jwt-key-2024-secure
```

### 3. Run Development Server

```bash
npm run dev
```

App runs at: `http://localhost:3000`

### 4. Seed Demo Data

```bash
curl -X POST http://localhost:3000/api/seed
```
*(Or in PowerShell)*:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/seed" -Method POST
```

### 5. Login Credentials

Visit `http://localhost:3000/login` (or click **"Fill Demo Credentials"** on the login page):
```
Email:    demo@smartpay.local
Password: demo123
```

---

## 🎯 ₹5,000 End-to-End Pilot Workflow

1. **Sign In**: Login to the dashboard with demo credentials.
2. **Dashboard Overview**: Check KPIs (Today's Collections, Pending, Active, Completed) and recent invoices.
3. **Create Collection**: Click **"New Collection"** (`/create`).
   - Customer: `TechnoWorld Ltd` (+91 98765 43210)
   - Total Amount: `₹5,000`
   - Strategy: **Smart Split** with Max Payment Amount: `₹1,999`
4. **Preview Payment Plan**:
   - Payment 1: `₹1,999`
   - Payment 2: `₹1,999`
   - Payment 3: `₹1,002`
   - *Sum = ₹5,000 (100% accurate, zero rounding drift)*
5. **Generate Collection**: Submit form to create collection and navigate to detail page.
6. **Customer Payment View**: Click **"Customer Payment Link"** (`/pay/[id]`) to view public QR code and UPI deep link.
7. **Progressive Reconciliation**:
   - Merchant clicks **"Mark as Received"** on Payment 1 → Status moves to **PARTIAL** (40%).
   - Merchant clicks **"Mark as Received"** on Payment 2 → Progress updates to 80%.
   - Merchant clicks **"Mark as Received"** on Payment 3 → Status transitions to **PAID** (100%) with green badge.
8. **Customer View Auto-Update**: Refreshing `/pay/[id]` displays the **"🎉 All Payments Complete!"** receipt screen.
9. **Analytics**: Visit `/analytics` to see updated collection charts, strategy breakdown, and KPI metrics.

---

## 📱 Application Routes & Pages

| Route | Purpose | Access |
|---|---|---|
| `/` | Modern SaaS Landing page with hero, value props, pilot badge | Public |
| `/login` | Merchant authentication with one-click demo credentials | Public |
| `/dashboard` | Executive KPI cards, collection volume charts, recent invoices | Authenticated |
| `/create` | 3-step wizard (Invoice details → Strategy → Review & QR) | Authenticated |
| `/collections` | Searchable & filterable collection list (Status, search) | Authenticated |
| `/collections/[id]` | Collection detail, payment part timeline, reconciliation modal, audit log | Authenticated |
| `/pay/[collectionId]` | Public customer checkout with UPI QR, UPI intent buttons, live progress | Public |
| `/analytics` | Business analytics, daily collection chart, status distribution | Authenticated |
| `/settings` | Merchant business profile, UPI ID, default limits, strategy preferences | Authenticated |

---

## 🏗 Architecture & Engineering

```
smartpay-app/
├── app/
│   ├── (public pages: /, /login, /pay/[collectionId])
│   ├── (dashboard shell: /dashboard, /create, /collections, /analytics, /settings)
│   └── api/
│       ├── auth/login/route.ts
│       ├── collections/route.ts
│       ├── collections/[id]/route.ts
│       ├── analytics/route.ts
│       ├── settings/route.ts
│       └── seed/route.ts
├── components/
│   ├── AppShell.tsx                # Responsive sidebar + bottom mobile nav + header
│   └── ui/                         # Design system components
├── lib/
│   ├── auth.ts                     # JWT signing & verification (jose)
│   ├── business/
│   │   ├── splitEngine.ts          # Smart split & custom split algorithms
│   │   ├── upi.ts                  # Standard UPI deep-link URI generator
│   │   └── reconciliation.ts       # Status transitions & financial calculations
│   └── db/
│       ├── mongoose.ts             # Dual-mode database connection manager
│       ├── localStore.ts           # Zero-config local persistent document database
│       └── models/                 # User, Invoice, PaymentPart, Customer proxies
```

---

## ⚠ Pilot Scope & Financial Safety

This application is an MVP prototype built to validate merchant demand and collection workflows:
- **No external PG integration**: Eliminates dependencies on Razorpay, Cashfree, or bank APIs.
- **Merchant-Confirmed**: All payments are explicitly labeled *"Merchant-Confirmed"* and audited with timestamps.
- **Valid UPI URIs**: Generated QR codes adhere to NPCI UPI URI standards (`upi://pay?pa=...&am=...&cu=INR`).
