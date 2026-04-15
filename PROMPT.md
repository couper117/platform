# RNSP — Full-Stack Rebuild Prompt
## React (Vite) Frontend + Express.js Backend
### Rwanda National Sports Platform

---

## 🎯 PROJECT OVERVIEW

You are building **RNSP (Rwanda National Sports Platform)** — a full-stack, production-grade sports management platform for Rwanda. The backend is **Express.js with PostgreSQL (or MySQL)**. The frontend is **React (Vite) with Tailwind CSS**. The system manages national sports leagues, fixtures, live scores, standings, teams, players, documents, news, and an integrated interschool competition module called **AKC3 (Amashuri Kagame Cup)**.

The live PHP system already exists. Your job is to rebuild it completely using modern JavaScript full-stack architecture — keeping every single feature, improving the UI/UX, and making it production-ready.

---

## 🏗️ TECH STACK

### Backend
```
Runtime:     Node.js 20+
Framework:   Express.js 4.x
Database:    PostgreSQL 15+ (or MySQL 8+)
ORM:         Prisma (preferred) or Sequelize
Auth:        JWT (access token 15min + refresh token 7d, stored in httpOnly cookies)
File Upload: Multer + Sharp (image compression/resize)
Real-time:   Socket.IO (live match scores, live events feed)
Email:       Nodemailer (SMTP)
Validation:  Zod
Security:    Helmet, express-rate-limit, cors, bcrypt (cost factor 12)
Docs:        Swagger (OpenAPI 3.0)
```

### Frontend
```
Framework:   React 18 + Vite 5
Routing:     React Router v6 (file-based via convention)
State:       Zustand (global) + React Query / TanStack Query v5 (server state)
Styling:     Tailwind CSS v3 + shadcn/ui components
Fonts:       Bebas Neue (display) + DM Sans (body) — Google Fonts
Animations:  Framer Motion 11
Icons:       Lucide React + custom SVG sports icons
Charts:      Recharts (standings, stats)
Real-time:   Socket.IO client
Forms:       React Hook Form + Zod
Image:       Next/Image equivalent via lazy loading + blur placeholder
```

### Infrastructure
```
API Base:    /api/v1/
Port:        Backend 5000, Frontend 5173 (dev)
Auth Header: Bearer <JWT> OR httpOnly cookie
CORS:        Configured for frontend origin
Static:      /uploads/ served by Express (production: CDN)
```

---

## 📁 PROJECT STRUCTURE

```
rnsp/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js            # Database connection (Prisma client)
│   │   │   ├── env.js           # Validated env vars (zod)
│   │   │   ├── cors.js          # CORS config
│   │   │   └── socket.js        # Socket.IO setup
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verify, role check
│   │   │   ├── upload.js        # Multer config (images + docs)
│   │   │   ├── validate.js      # Zod request validation
│   │   │   ├── rateLimit.js     # Rate limiting per route
│   │   │   └── errorHandler.js  # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── sports.routes.js
│   │   │   ├── leagues.routes.js
│   │   │   ├── teams.routes.js
│   │   │   ├── players.routes.js
│   │   │   ├── fixtures.routes.js
│   │   │   ├── results.routes.js
│   │   │   ├── standings.routes.js
│   │   │   ├── news.routes.js
│   │   │   ├── documents.routes.js
│   │   │   ├── transfers.routes.js
│   │   │   ├── venues.routes.js
│   │   │   ├── federations.routes.js
│   │   │   ├── users.routes.js
│   │   │   ├── settings.routes.js