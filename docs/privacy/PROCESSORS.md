# Processor register and contract requirements

**Law N° 058/2021, art. 49:** a transfer of personal data to a processor must be
governed by a **written contract**. **Art. 48 and 50** additionally govern where
that processor holds the data.

> **Status: none of these contracts are in place.** Every row below is a live
> transfer of personal data — including children's — to a third party, currently
> under that provider's standard terms rather than a contract that meets art. 49.

---

## 1. Register

| Processor | What it processes | Personal data | Where | Contract |
|---|---|---|---|---|
| **Supabase** | Primary database | Everything: athletes, players, guardians, accounts, audit logs | `eu-central-1` — **Frankfurt** | ❌ |
| **Vercel** | Frontend + serverless API | Request data, IP addresses, session identifiers | Global edge | ❌ |
| **Cloudinary** | Media and document storage | Photos, logos, **verification documents** (birth certificates, IDs) | Outside Rwanda | ❌ |
| **Pusher** | Real-time score push | Match events; no athlete identifiers required | Outside Rwanda | ❌ |
| **Flutterwave** | Payments | Payer name, contact, transaction reference | Rwanda / regional | ❌ |
| **SMTP provider** | Transactional email | Recipient address, message content | Depends on provider | ❌ |

Cloudinary is the sharpest of these: `STORAGE_DRIVER=cloudinary` is the default, so
**children's birth certificates and identity documents leave Rwanda by default**.
Setting `STORAGE_DRIVER=local` keeps them on the application's own disk, which
removes one offshore processor at the cost of needing durable storage.

---

## 2. What each contract must contain (art. 49)

A data processing agreement here should bind the processor to:

1. **Process only on documented instruction** from the controller, including as to
   transfers outside Rwanda.
2. **Confidentiality** — everyone with access is under a duty of confidence.
3. **Security** — appropriate technical and organisational measures (art. 47).
4. **Sub-processors** — no engagement without prior written authorisation, and the
   same obligations flowed down.
5. **Assistance with data subject rights** — the processor helps the controller
   answer access, rectification, erasure, objection and portability requests
   within the statutory 30 days (arts. 18–24).
6. **Breach notification to the controller within 48 hours** of awareness
   (art. 43) — this is the clause most standard terms will not meet, and it is the
   one that determines whether the controller can hit its own 48-hour deadline.
7. **Assistance with impact assessments** and prior consultation (arts. 15–16).
8. **Deletion or return** of all personal data at the end of the service, and
   deletion of copies, unless retention is legally required.
9. **Audit** — make available the information needed to demonstrate compliance,
   and allow inspection.
10. **Location** — state where data is stored and processed, and commit to notify
    before that changes.

---

## 3. Actions

- [ ] Decide per processor: replace with an in-country service, or contract and
      register the transfer.
- [ ] Execute a written DPA with each processor retained, covering §2.
- [ ] For each transfer outside Rwanda, record the art. 48 ground relied on and
      the art. 50 certificate covering it.
- [ ] Set `STORAGE_DRIVER=local` unless a Cloudinary DPA is in place — verification
      documents are the highest-sensitivity payload the platform holds.
- [ ] Record each executed contract in this table with its date and reference.
- [ ] Re-check this register whenever a new third-party service is added.
