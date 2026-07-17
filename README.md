# PaperBuddy — School Fee Management SaaS

PaperBuddy is a multi-tenant Software-as-a-Service (SaaS) platform built for modern school fee management. It features a complete multi-tenancy design, reactive state management, dynamic accountant permission settings, and a fully simulated payment sandbox.

---

## 🚀 Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React (Vite) | JavaScript, fast hot module replacement |
| **State** | TanStack Query + Zustand | Server-state caching and global client-state persistence |
| **Styling** | Tailwind CSS | Curated premium glassmorphic and soft pastel design tokens |
| **Database** | PostgreSQL (Prisma ORM) | Multi-tenant indexing with `school_id` isolation |
| **Excel Parser** | SheetJS (`xlsx`) | Fast spreadsheet parsing for bulk student registration |

---

## 📁 Repository Structure

```text
/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema layouts (Prisma)
│   │   └── seed.js         # Comprehensive demo mock dataset
│   ├── src/
│   │   ├── controllers/    # Express controllers (auth, admin, student, accountant)
│   │   ├── middlewares/    # verifyJWT & attachSchoolScope middlewares
│   │   └── routes/         # Express routing sub-modules
│   ├── server.js           # Express main server config
│   ├── verify.js           # Multi-tenancy isolation test script
│   └── .env                # Port, Database URL, and JWT secrets
│
└── frontend/
    ├── src/
    │   ├── components/     # Reusable layout components (Header.jsx)
    │   ├── screens/        # Dashboard interfaces (Login, Admin, Accountant, Student)
    │   ├── store/          # Zustand state store (authStore.js)
    │   ├── App.jsx         # React query wrapper, routes routing definitions
    │   ├── index.css       # Tailwind base, scrollbars, and print rules
    │   └── api.js          # Unified HTTP client interceptor
    ├── tailwind.config.js  # Color tokens and premium shadow settings
    └── index.html          # Google fonts mapping
```

---

## 🛠️ Local Startup Instructions

### 1. Database Connection & Migration
Open `/backend/.env` and update the `DATABASE_URL` with your local PostgreSQL or Neon database connection string:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/paperbuddy?schema=public"
```

Then, run the migrations and seed the mock data in your terminal:
```bash
# Inside the /backend directory:
npx prisma db push
node prisma/seed.js
```
*Note: Seeding creates a rich dataset with mock schools, students, transactions, and pending cheques to test all dashboard elements immediately.*

### 2. Launch Backend Dev Server
```bash
# Inside the /backend directory:
npm run dev
```
The backend server will run on `http://localhost:5000`.

### 3. Launch Frontend React Server
```bash
# In a new terminal window inside the /frontend directory:
npm run dev
```
The Vite development server will run on `http://localhost:5173`. Open it in your web browser.

---

## 🔑 Sandboxed Demo Credentials
Use these quick-fill credentials directly on the login screen to inspect individual role views:

| Role | Username / Email | Password | Features to Test |
|---|---|---|---|
| **Super Admin** | `superadmin@paperbuddy.com` | `SuperAdmin123!` | Onboard schools, toggle suspension, platform analytics |
| **School Admin** | `admin@greenwood.com` | `Admin123!` | Excel bulk upload, fee creation, configure accountant perms |
| **Accountant** | `accountant@greenwood.com` | `Accountant123!` | Log cash/cheque, clear pending cheques in queue |
| **Student** | `student@greenwood.com` | `Student123!` | View pending bills, pay with simulated checkout, print invoices |

---

## 💡 Pitch Notes for Hackathon Presentation
- **Multi-Tenant Isolation**: Enforced at the application level using a custom `attachSchoolScope` middleware. SQL query statements are automatically restricted to the JWT token's `schoolId`, preventing cross-tenant leakage.
- **Dynamic Accountant Permissions**: Instead of fixed privileges, the administrator toggles checkbox values that update a JSON permission map in the DB. The frontend immediately updates layout components (buttons, panels) in real time.
- **Payment Abstraction**: The simulated checkoutmodal handles all loader states and receipt prints. Swapping Stripe or Razorpay in production only requires updating the single backend checkout endpoint.
