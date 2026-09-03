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

## AI provider credentials

The AI assistant calls a third-party provider, which means an API key and an
outbound flow of data. Both are handled deliberately.

**The key.** It may be set as a server environment variable (`GEMINI_API_KEY` and
the other `*_API_KEY` variables in `.env.example`) or typed into
**Admin > AI Assistant**. A key entered in the console is encrypted with
AES-256-GCM before it reaches the `Setting` table, under a key derived from
`AI_SECRET_KEY` — or from `JWT_SECRET` when that is unset — so a database dump
alone does not yield a usable credential. It is never returned to a browser: the
console is served only the last four characters. The generic settings endpoints
refuse to read or write anything under `ai.`, so the credential cannot be
extracted or replaced with a plaintext value through them. Only `ai.configure`
(Super Admin) reaches any of it.

Note that rotating `JWT_SECRET` without a separate `AI_SECRET_KEY` set makes
stored AI keys unreadable. That fails visibly — the console reports the key as
needing re-entry and the server falls back to the environment variable.

**The data.** Each question is answered against a context assembled from what
the public site already publishes: clubs, fixtures, scores, standings, venues,
competitions, news, and senior players' sporting details. Identity and licence
numbers, dates of birth, telephone numbers, e-mail addresses, user accounts,
documents, payments and contact-form messages are never included. The Amashuri
school athletes are excluded in full — they are children (Law N° 058/2021 art. 9),
and publishing a page on our own site is not the same permission as transmitting
the record to a processor abroad. Questions and answers are not stored.

Where no data may leave Rwanda at all, select the **Ollama (self-hosted)**
provider and point it at a machine you control; no key is needed and no request
leaves your network.
