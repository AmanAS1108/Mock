# MOCK — Minimal Authentication Application

A minimal, production-conscious authentication demonstration application built for NEXUS AI's evaluation and verification workflows.

---

## 1. Overview & Architecture

This repository contains an isolated mock authentication system designed with a restrained human-designed UI aesthetic, secure session management, and local SQLite persistence.

- **Frontend**: React 19 + TypeScript + Vite with custom modular CSS tokens (palette: `#FFFFFF`, `#F7F9F7`, neon green accent `#2EE828`, `#171A17` text, `#E5E9E5` borders).
- **Backend**: Node.js + Express + TypeScript.
- **Database**: SQLite via `better-sqlite3`, located locally at `data/mock.db`.
- **Security**: Password hashing with `bcryptjs` (salt rounds: 10), `HttpOnly` secure cookies, session fixation prevention, same-site cookies, CSRF protection, and rate limiting.
- **Automated Testing**: Vitest test suite covering database constraints, seeding idempotency, user registration, authentication verification, and session lifecycle.

---

## 2. Default Demonstration Account

The application automatically seeds a default demonstration account on startup if it does not already exist.

| Field | Value |
|---|---|
| **Name** | `Aman` |
| **Email** | `aman@gmail.com` |
| **Password** | `123456` |

> [!NOTE]
> The password `123456` is intentionally a weak demonstration-only fixture. It is stored securely as a salted bcrypt hash in SQLite and is intended exclusively for local evaluation, not for internet-facing production environments.

A convenient **"Fill Demo"** button is provided directly on the Sign In screen to instantly populate these credentials.

---

## 3. Quick Start

### Prerequisites
- Node.js (v20+ recommended; verified on Node v24)
- npm (v10+)

### 1. Installation

From the `mock/` directory:

```bash
# Install root orchestration tools
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Environment Configuration

Copy the example configuration if needed:

```bash
cp .env.example server/.env
```

Default variables:
```env
PORT=4000
NODE_ENV=development
SESSION_SECRET=dev-local-session-secret-faed06e1-86cf-44dd-af70-47c5c55e9cae
SESSION_COOKIE_NAME=mock_session_id
CORS_ORIGIN=http://localhost:5173
DATABASE_PATH=../data/mock.db
```

### 3. Run Development Server

To launch both the backend API and frontend client concurrently:

```bash
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:4000](http://localhost:4000)
- **Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## 4. Verification and Testing

### Run Automated Tests
```bash
npm test
```
Runs 18 unit and integration tests covering:
- Schema initialization and idempotent seeding
- Unique email constraints
- Valid registration and password hashing
- Password mismatch rejection
- Sign in with default demo credentials
- Incorrect password and unknown email rejection
- Session fixation protection (session ID regeneration on login)
- Invalidation of sessions on logout and route protection

### Run Typecheck
```bash
npm run typecheck
```

### Run Production Build
```bash
npm run build
```

---

## 5. API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new account and establish session | No |
| `POST` | `/api/auth/login` | Authenticate credentials and establish session | No |
| `POST` | `/api/auth/logout` | Invalidate session and clear cookie | Yes |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/health` | Health check probe | No |

---

## 6. Project Layout

```text
mock/
├── client/                     # Frontend React + TypeScript application
│   ├── src/
│   │   ├── components/
│   │   │   ├── BrandSection.tsx    # Left-half branding panel
│   │   │   ├── SignInForm.tsx      # Default sign-in view with demo helper
│   │   │   ├── SignUpForm.tsx      # Sign-up registration view
│   │   │   └── WelcomeView.tsx     # Post-authentication profile view
│   │   ├── api.ts                  # Fetch API wrapper with cookie credentials
│   │   ├── App.tsx                 # View state management
│   │   ├── index.css               # Design system & responsive styles
│   │   └── main.tsx
│   ├── index.html
│   └── vite.config.ts
├── server/                     # Backend Express + TypeScript API
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.ts            # SQLite connection with WAL mode
│   │   │   ├── schema.ts           # Schema migration (users & sessions)
│   │   │   └── seed.ts             # Idempotent demo account seeding
│   │   ├── middleware/
│   │   │   ├── auth.ts             # Session authentication guard
│   │   │   ├── csrf.ts             # Origin / CSRF protection
│   │   │   └── rateLimiter.ts      # Brute force protection
│   │   ├── routes/
│   │   │   ├── auth.ts             # Auth endpoints
│   │   │   └── health.ts           # Health check endpoint
│   │   ├── services/
│   │   │   ├── authService.ts      # Registration & credential checks
│   │   │   └── sessionService.ts   # Session regeneration & cookies
│   │   ├── app.ts                  # Express setup
│   │   ├── config.ts               # Environment configuration
│   │   └── server.ts               # Server startup lifecycle
│   └── tests/
│       └── auth.test.ts            # Automated test suite (18 tests)
├── data/                       # Local SQLite database directory (gitignored)
│   └── .gitkeep
├── .env.example                # Safe environment variable template
├── .gitignore                  # Git ignore rules for DB, env, and node_modules
├── package.json                # Root orchestration scripts
└── README.md
```
