# ⚡ TaskFlow — Team Task Manager

A full-stack web application for managing projects, assigning tasks, and tracking progress with role-based access control.

**Live URL:** *https://team-task-manager-production-d07b.up.railway.app/*  
**Demo Video:** *[Add your Loom/YouTube link]*

---

## ✨ Features

### Core
- 🔐 **Authentication** — JWT-based signup/login with secure password hashing
- 📁 **Project Management** — Create, view, update, and delete projects
- 🗂 **Task Board** — Kanban-style board (Todo → In Progress → Done)
- 👥 **Team Management** — Invite members by email, assign tasks
- 📊 **Dashboard** — Task stats, overdue alerts, project progress bars
- 🔒 **Role-Based Access Control** — Two levels: Admin and Member

### RBAC Details
| Action | Admin | Project Admin | Member |
|--------|-------|---------------|--------|
| Create project | ✅ | ✅ | ✅ |
| Delete project | ✅ | ✅ | ❌ |
| Add/remove members | ✅ | ✅ | ❌ |
| Create tasks | ✅ | ✅ | ✅ |
| Update any task | ✅ | ✅ | Own only |
| Delete any task | ✅ | ✅ | Own only |
| Manage users (role) | ✅ | ❌ | ❌ |

---

## 🛠 Tech Stack

**Backend**
- Node.js + Express.js
- Prisma ORM + PostgreSQL
- JWT for authentication
- bcryptjs for password hashing
- express-validator for input validation
- helmet for security headers
- express-rate-limit for brute force protection

**Frontend**
- React 18 + Vite
- React Router v6
- Axios + React Hot Toast
- Lucide React (icons)
- date-fns (date formatting)
- Custom CSS design system (no UI framework)

---

## 🚀 Getting Started (Local)

### Prerequisites
- Node.js 18+
- npm
- PostgreSQL (local or Docker)

### Setup

```bash
# Clone
git clone https://github.com/yourusername/taskflow.git
cd taskflow

# Backend
cd backend
cp .env.example .env          # Edit DATABASE_URL for your PostgreSQL instance
npm install
npx prisma generate
npx prisma db push
node src/utils/seed.js        # Seeds demo data
npm run dev                   # Runs on :5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                   # Runs on :5173
```

### Demo Accounts (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@taskflow.com | admin123 |
| Member | sara@taskflow.com | member123 |
| Member | jake@taskflow.com | member123 |

---

## 📡 API Reference

### Auth
```
POST /api/auth/signup    — Register (name, email, password)
POST /api/auth/login     — Login (email, password) → JWT
GET  /api/auth/me        — Get current user (auth required)
```

### Projects
```
GET    /api/projects          — List my projects
POST   /api/projects          — Create project
GET    /api/projects/:id      — Get project + tasks + members
PUT    /api/projects/:id      — Update project (project admin+)
DELETE /api/projects/:id      — Delete project (project admin+)
POST   /api/projects/:id/members          — Add member by email
DELETE /api/projects/:id/members/:userId  — Remove member
```

### Tasks
```
GET    /api/tasks/project/:projectId  — List tasks (filter: status, priority)
GET    /api/tasks/:id                 — Get task detail
POST   /api/tasks                     — Create task
PUT    /api/tasks/:id                 — Update task
DELETE /api/tasks/:id                 — Delete task
```

### Dashboard & Users
```
GET   /api/dashboard       — Stats, recent/upcoming tasks, project progress
GET   /api/users           — List all users (auth required)
PATCH /api/users/:id/role  — Change user role (admin only)
```

---

## 🌐 Deployment (Railway)

1. Push to GitHub
2. Create new project on [Railway](https://railway.app)
3. Connect your GitHub repo
4. **Add a PostgreSQL plugin** — Railway auto-sets `DATABASE_URL`
5. Add remaining environment variables:
   ```
   JWT_SECRET=your-random-secret-here
   NODE_ENV=production
   ```
6. Railway auto-detects `nixpacks.toml` and builds
7. Run database migration: `npx prisma db push` (via Railway shell or add to start script)
8. Optionally seed demo data: `node src/utils/seed.js`

> **Note:** Railway's filesystem is ephemeral. Do NOT use SQLite — always pair with the PostgreSQL plugin.

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # DB models (User, Project, Task, etc.)
│   └── src/
│       ├── controllers/        # Business logic
│       ├── middleware/         # Auth & RBAC middleware
│       ├── routes/             # Express routes
│       ├── utils/seed.js       # Demo data seeder
│       └── index.js            # Entry point
├── frontend/
│   └── src/
│       ├── components/         # Layout, shared components
│       ├── contexts/           # AuthContext (React Context API)
│       ├── pages/              # Dashboard, Projects, Users, etc.
│       └── utils/api.js        # Axios instance with auth interceptor
├── railway.json
├── nixpacks.toml
└── README.md
```

---

## 🧠 Design Decisions

### PostgreSQL over SQLite
SQLite stores data in a local file, which is incompatible with Railway's ephemeral filesystem — every redeploy wipes the disk. PostgreSQL via Railway's managed plugin provides persistent storage, better concurrency, and scales naturally if the app grows. For local development, PostgreSQL can be run via Docker with a single command.

### JWT over Sessions
JWTs are stateless — no server-side session store is needed. This simplifies horizontal scaling (multiple backend instances don't need shared session storage) and fits naturally with a decoupled frontend/backend architecture. Tokens are set to expire after 7 days with a secure secret.

### Prisma ORM
Prisma provides type-safe database queries, automatic migrations, and a clean schema definition. The migration from SQLite to PostgreSQL required only a single-line change in `schema.prisma` (`provider = "postgresql"`), demonstrating Prisma's database-agnostic design.

### Role Assignment Policy
Signup always assigns the `MEMBER` role. Admin privileges can only be granted via the `PATCH /api/users/:id/role` endpoint, which requires global admin authentication. This prevents privilege escalation attacks where a malicious user sends `role: "ADMIN"` during registration.

### Rate Limiting on Auth Routes
A sliding window rate limiter (20 requests per 15 minutes) is applied to all `/api/auth` endpoints. This mitigates brute force attacks on login and prevents abuse of the signup endpoint.

---

## 🧑‍💻 Author

Built as part of a job application assignment.  
Designed and developed from scratch in ~10 hours.

> "Good software is built with care, not just code."
