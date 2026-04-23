<div align="center">

# Olilife — Backend API

**Express + MongoDB REST API powering the Olilife wellness platform.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?style=for-the-badge&logo=mongodb)](https://mongoosejs.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-orange?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io/)

Frontend repo: [olilife-page-frontend](https://github.com/puskarpreconet123/olilife-page-frontend) · Live: [olilife-page-frontend.onrender.com](https://olilife-page-frontend.onrender.com/)

</div>

---

## Overview

This is the REST API backend for [Olilife](https://olilife-page-frontend.onrender.com/). It handles:

- **OTP-based email verification** for signup
- **JWT authentication** via HTTP-only cookies and Bearer tokens
- **User profile & diet plan persistence** in MongoDB
- **Transactional emails** — OTP codes, password resets, and diet chart PDFs via Gmail + Nodemailer
- **Admin panel API** — user management, analytics, and data export

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Database | MongoDB via Mongoose 8 |
| Auth | JWT (cookie + Bearer) + bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| PDF generation | html-pdf-node |
| Dev server | Nodemon |

---

## Project Structure

```
server/
├── controllers/
│   ├── authController.js     # OTP signup, login, logout, password reset
│   ├── userController.js     # Profile CRUD, diet plan save/clear, email chart
│   └── adminController.js    # User management, analytics, export
├── middleware/
│   └── authMiddleware.js     # protect (JWT) + adminOnly guards
├── models/
│   ├── User.js               # Main user schema with embedded profile & diet plan
│   ├── PendingVerification.js# Temporary OTP store for signup flow
│   └── PasswordResetOtp.js   # Temporary OTP store for password reset
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   └── adminRoutes.js
├── scripts/                  # One-off admin / seeding utilities
│   ├── createAdmin.js
│   ├── checkAdmin.js
│   ├── backfill-roles.js
│   ├── seedUsers.js
│   └── test-admin-api.js
├── utils/
│   └── emailService.js       # OTP, password reset, and diet chart email templates
└── server.js                 # App entry point
```

---

## API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/send-otp` | — | Send a 6-digit OTP to the provided email to begin signup |
| `POST` | `/verify-otp` | — | Verify OTP and create the user account |
| `POST` | `/login` | — | Login with email + password; sets JWT cookie |
| `POST` | `/logout` | — | Clears the JWT cookie |
| `GET` | `/me` | `protect` | Returns the currently authenticated user |
| `POST` | `/forgot-password` | — | Sends a password-reset OTP to the user's email |
| `POST` | `/reset-password` | — | Verifies reset OTP and updates the password |

### User — `/api/user`

All routes require a valid JWT (`protect` middleware).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/profile` | Fetch the user's saved profile and diet plan |
| `PUT` | `/profile` | Update profile fields and/or mark onboarding complete |
| `PUT` | `/diet` | Save a generated diet plan to the user's account |
| `DELETE` | `/diet` | Clear the saved diet plan |
| `POST` | `/send-diet-email` | Email the user's saved diet chart as HTML + PDF attachment |

### Admin — `/api/admin`

All routes require `protect` + `adminOnly` (role: `"admin"`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | Paginated list of all users |
| `GET` | `/users/search` | Search users by email |
| `GET` | `/users/:userId` | Full user details including profile and diet |
| `DELETE` | `/users/:userId` | Delete a user account |
| `POST` | `/users/:userId/send-diet` | Email a user's diet chart (admin-triggered) |
| `GET` | `/export/user/:userId` | Export a single user's data as JSON |
| `GET` | `/export/all-users` | Export all users' data as JSON |
| `GET` | `/analytics` | Platform stats (total users, onboarding rate, etc.) |

### Health Check

```
GET /api/health  →  { "status": "ok" }
```

---

## Data Models

### User

```js
{
  email:              String (unique, required),
  password:           String (bcrypt hashed),
  role:               "user" | "admin",
  onboardingComplete: Boolean,
  createdAt:          Date,

  profile: {
    age, gender, height, heightUnit,
    weight, activityLevel, goal,
    dietPreference,        // "veg" | "non-veg"
    diabeticStatus,        // "non-diabetic" | "pre-diabetic" | "diabetic"
    hasAllergies, allergyList, customAllergy,
    chronicConditions      // ["none", "liver", "kidney", "lung", "heart", "thyroid", "digestive"]
  },

  savedDietPlan: {
    meals,             // meal array generated by the frontend engine
    inputSignature,    // hash used to detect when inputs change
    generatedAt        // Date
  }
}
```

### PendingVerification / PasswordResetOtp

Temporary documents that store a bcrypt-hashed OTP with a short TTL (2 min for signup, 10 min for password reset). Cleaned up automatically on verification.

---

## Auth Flow

```
Signup
  POST /auth/send-otp   →  OTP sent to email, stored in PendingVerification
  POST /auth/verify-otp →  OTP verified, User created, JWT cookie set

Login
  POST /auth/login      →  Password checked, JWT cookie set (httpOnly)

Authenticated requests
  All protected routes read the JWT from:
    1. Authorization: Bearer <token>  (mobile / non-cookie clients)
    2. Cookie: jwt=<token>            (browser clients)

Password Reset
  POST /auth/forgot-password →  OTP emailed (10-min TTL)
  POST /auth/reset-password  →  OTP verified, new password saved
```

---

## Email Service

Three transactional emails are sent via Gmail SMTP (`utils/emailService.js`):

| Trigger | Template | Attachment |
|---------|----------|-----------|
| Signup OTP | Branded HTML with 6-digit code | — |
| Password reset | Branded HTML with reset code | — |
| Diet chart | Full meal plan in styled HTML | PDF (A4, generated server-side) |

The diet chart email renders the complete 5-meal plan into an HTML table, converts it to an A4 PDF using `html-pdf-node`, and attaches it to the email — so users can print or store it offline.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A running MongoDB instance (local or Atlas)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) enabled

### Installation

```bash
git clone https://github.com/puskarpreconet123/olilife-page-backend.git
cd olilife-page-backend
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/olilife
JWT_SECRET=your_super_secret_key_here
CLIENT=http://localhost:5173

EMAIL_USER=your.gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

> `EMAIL_PASS` must be a Gmail **App Password**, not your account password. Generate one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).

### Run

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:5000` and connects to MongoDB before accepting traffic.

---

## Admin Scripts

One-off utilities in `/scripts` — run with `node scripts/<file>.js`:

| Script | Purpose |
|--------|---------|
| `createAdmin.js` | Promote an existing user to `admin` role |
| `checkAdmin.js` | Verify an account's current role |
| `backfill-roles.js` | Set `role: "user"` on any documents missing the field |
| `seedUsers.js` | Insert sample user records for testing |
| `test-admin-api.js` | Quick smoke-test of admin API endpoints |

---

## Deployment

The server is designed to run as a standalone Node process. On Render:

1. **Build command:** `npm install`
2. **Start command:** `npm start`
3. Set all environment variables from the table above in the Render dashboard

CORS is configured to accept requests from `process.env.CLIENT` — set this to your frontend's production URL.

---

## License

MIT © [Olilife / Preconet India](https://preconetindia.com)
