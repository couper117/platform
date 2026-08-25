# Data protection impact assessment — Amashuri Games athlete register

**Law N° 058/2021, art. 15** requires an impact assessment where processing is
likely to result in a high risk to the rights and freedoms of data subjects.

This processing qualifies on the clearest grounds available: it is **large-scale
processing of children's personal data**, including **sensitive data** (health, in
the form of disability information), by a **public body**.

> **Status: DRAFT — requires sign-off.** Sections 1–6 describe the system as
> built and can be verified against the code. Section 7 (residual risk
> acceptance) needs a decision by the controller and, once appointed, the DPO.
> Prepared 22 August 2026. Review annually, or on any change to §2.

---

## 1. Who is involved

| Role | Who |
|---|---|
| Controller | RwaSport / Rwanda National Sports Platform, under the Ministry of Sports |
| Data Protection Officer | **Not yet appointed** — see `docs/privacy/DPO.md` |
| Processors | Hosting, media, messaging, payments — see `docs/privacy/PROCESSORS.md` |
| Supervisory authority | National Cyber Security Authority (NCSA) |

---

## 2. What is processed, and why

**Purpose.** To run inter-school sports competitions: confirm an athlete is
eligible for their age category, produce fixtures, team sheets and results, verify
submitted documents, and contact a parent or guardian in an emergency.

**Necessity.** Each field is tied to a purpose:

| Data | Why it is necessary | Could the purpose be met without it? |
|---|---|---|
| Full name | Identify the athlete on a team sheet | No |
| Date of birth | Age-category eligibility (U13–U20) | No — the competition is age-graded |
| Gender | Gender-category eligibility | No |
| Nationality | Eligibility for national competition | No |
| Class | Confirm the athlete attends the school they play for | Partly — retained because it is the school's own check |
| Student code | Bind a registration to the school's own record; prevent duplicate registration | Yes in principle, but it is the only reliable school-side key |
| Guardian name + phone | Record consent; emergency contact | No |
| ID / birth-certificate reference | Verify the declared age | No |
| Disability information | Run inclusive categories | No, for those categories only |

**Scale.** Potentially every secondary and TVET school in Rwanda. The design
assumes thousands of athletes, the overwhelming majority of them minors.

**Lawful basis (art. 46).** Consent of a holder of parental responsibility for
under-16s (art. 9), together with the public-interest duty of organising national
school sport. Sensitive data relies on the same consent plus art. 11 safeguards.

---

## 3. Risks identified

| # | Risk | Who is harmed | Likelihood before controls | Severity |
|---|---|---|---|---|
| R1 | Children's identifying data published on the open web | Athletes | **Occurred** — three endpoints were public | High |
| R2 | Disability status disclosed | Athletes with disabilities | Was possible via R1 | High |
| R3 | Data processed with no lawful basis (no guardian consent) | Athletes | **Occurred** — every pre-existing record | High |
| R4 | Guardian phone numbers misused, or reachable by a stranger | Parents/guardians | Was possible via R1 | High |
| R5 | A school coordinator sees another school's children | Athletes | Medium | High |
| R6 | Personal data stored outside Rwanda without authorisation | All subjects | **Present** — see §6 | High |
| R7 | Data kept indefinitely with no purpose | All subjects | **Occurred** — nothing expired | Medium |
| R8 | Data subject unable to exercise their rights | All subjects | **Occurred** — no mechanism | Medium |
| R9 | Consent recorded against the wrong child | Athletes | Medium | High |
| R10 | Breach not reported within 48 hours | All subjects | Medium | High |
| R11 | Bulk import creates duplicate or wrong-age records | Athletes | Medium | Low |

---

## 4. Controls in place

| Risk | Control | Where |
|---|---|---|
| R1, R2, R4 | Public responses projected to name, gender, age category, position, jersey. Athlete listing behind auth. | `privacy.service.ts`, `schools.controller.ts`, `players.controller.ts` |
| R3 | Registration refuses an under-16 without a named guardian and explicit consent; unknown age treated as a child | `import.rules.ts` |
| R3 | Athletes awaiting consent are withheld from published team sheets | `publiclyVisibleAthleteWhere` |
| R3 | Backfill: pre-filled consent form per school, import that only updates | `consentBackfill.service.ts` |
| R5 | Coordinator portal scoped to `req.user.akcSchoolId`; a wrong-school form is refused, not re-homed | `routes/akc3/school.ts`, `roster.controller.ts` |
| R6 | Boot refuses a production start that stores data offshore without a declared NCSA certificate | `dataResidency.service.ts` |
| R7 | Declared retention periods, enforced by a scheduled purge | `RETENTION_DAYS`, `scripts/purge-expired-data.mjs` |
| R8 | Request intake (no account needed), 30-day clock, overdue register, self-service export | `routes/privacy.routes.ts` |
| R9 | Consent matched on athlete id; a name mismatch is refused as a possibly re-sorted form | `consentBackfill.service.ts` |
| R10 | Documented 48h/72h procedure; audit log records actor, action and IP | `docs/DATA_PROTECTION.md` §5 |
| R11 | Validate-then-commit, duplicate detection, age checks, atomic write | `import.service.ts` |

Every control above is covered by unit tests in `apps/backend/test/unit/`.

---

## 5. Residual risk

| # | Residual | Why it remains |
|---|---|---|
| R6 | **High** | The technical guard stops a silent offshore deployment. It cannot obtain the certificate. Unresolved until §6 of `DATA_PROTECTION.md` is closed. |
| R3 | **Medium, falling** | New registrations are safe. Historic records remain until each school returns its consent form; they are suppressed from publication meanwhile. |
| R8 | **Medium** | The request endpoint cannot verify identity. Disclosing a child's record to someone claiming to be a parent would itself be a breach — verification is a manual step that must not be skipped. |
| R10 | **Medium** | The procedure is written; nobody is yet accountable for executing it within 48 hours. Closes when the DPO is appointed. |
| R7 | **Low** | Periods are enforced only if the purge is actually scheduled. Confirm the cron exists in each environment. |

---

## 6. Consultation

Art. 15 expects the DPO's advice. **Not obtained — no DPO is appointed.** This
assessment should be reviewed by the DPO as their first substantive act, and by
the Ministry's legal function.

Where residual risk stays high after controls, art. 16 requires **prior
consultation with the supervisory authority**. R6 is high. Consult the NCSA before
processing continues on offshore infrastructure.

---

## 7. Decision

To be completed by the controller.

- [ ] Residual risks accepted, with reasons recorded
- [ ] R6 resolved: hosted in Rwanda, **or** NCSA certificate obtained and recorded in `NCSA_REGISTRATION_NUMBER`
- [ ] NCSA consulted on R6 (art. 16) if it remains high
- [ ] DPO appointed and this assessment reviewed
- [ ] Review date set

| | Name | Role | Date | Signature |
|---|---|---|---|---|
| Prepared by | | | | |
| Reviewed by | | DPO | | |
| Approved by | | Controller | | |
