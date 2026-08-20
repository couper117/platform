# Security notes

## Secrets must not live in a cloud-synced folder

This repository currently sits under **OneDrive**
(`C:\Users\recon\OneDrive\Desktop\rnsp3`). `apps/backend/.env` is correctly
**gitignored** (only `.env.example` is committed — verified), so secrets are not
in git. But a synced folder is its own exposure: OneDrive copies `.env` — the
live **database password and JWT secret** — into a third-party cloud account
*and its file-version history*, where it is outside your control.

This is issue **M15** in the register (status: *partial* — documented here, not
yet fully closed because remediation is operational).

### Do this

1. **Rotate the exposed secrets** (they have been syncing to OneDrive):
   - Change the PostgreSQL password and update `DATABASE_URL` / `DIRECT_DATABASE_URL`.
   - Generate a fresh `JWT_SECRET` (≥ 32 chars). This invalidates existing
     sessions/refresh tokens — expected.

2. **Get secrets out of the synced tree.** Pick one:
   - **Move the repo off OneDrive** — e.g. `C:\dev\rnsp3`. Simplest and cleanest.
   - **Keep the repo, move only the secrets** — instead of a synced `.env`, set
     the sensitive values as real environment variables for the shell that runs
     the backend (so no secret sits in the synced file). `config/env.ts` reads
     from `process.env`, so exported vars take precedence.

3. **Never commit `.env`.** It is gitignored; keep it that way. `.env.example`
   documents the keys with placeholders only.

4. **In production**, use the host's secret store (Vercel project env vars,
   Supabase connection settings) — never a file in the deployment.

## What is already in place

- JWT access + rotating refresh tokens; refresh tokens stored **SHA-256 hashed**.
- `bcrypt` (cost 12) password hashing.
- Helmet, an explicit CORS allowlist, and tiered rate-limiting (stricter on auth).
- Zod validation on mutating routes.
- Payments: the Flutterwave webhook verifies the provider's `verif-hash`
  signature with a constant-time compare and **fails closed** when unconfigured.
- `.env` gitignored; env validated at boot (fails fast on missing critical vars).

## Reporting

For a real deployment, add a contact here (email / security.txt) for responsible
disclosure.
