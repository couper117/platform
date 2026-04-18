# RwaSport — System Architecture & Implementation Plan

## 1. Overview
RwaSport is a comprehensive, mobile-first digital ecosystem designed to digitize and manage the entire sports landscape in Rwanda, from professional leagues to school-based competitions (Amashuri Kagame Cup - AKC3).

## 2. Core Features
- **Administrative Hierarchy:** Multi-tier RBAC (Superadmin, Federation, League, Match Reporter).
- **Match Center:** Real-time score updates via Pusher, match scheduling, and event logging (goals, cards, subs).
- **Team Portal:** Secure roster management and document verification (ID, Passport, Medical).
- **AKC3 (Interschool Module):** Dedicated ecosystem for school competitions with bulk CSV player registration.
- **Monetization Engine:** Subscription-based team verification and dynamic ad-banner slots.

## 3. Technology Stack
- **Backend:** Node.js, Express.js, Prisma ORM, PostgreSQL (Supabase).
- **Frontend:** React (Vite), Tailwind CSS, TanStack Query, Zustand.
- **Infrastructure:** Vercel (Serverless), Cloudinary (Media Storage), Pusher (Real-time).

## 4. Implementation Methodology
- Developed using a "mobile-first" responsive design strategy.
- Implemented as a Progressive Web App (PWA) for native app-like experience.
- Service-oriented architecture with clear separation of concerns between Admin, Team, and Public layers.
