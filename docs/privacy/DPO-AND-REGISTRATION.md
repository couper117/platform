# Data Protection Officer and NCSA registration

Two obligations that need a person and an application, not code.

---

## Part 1 — Data Protection Officer (art. 40)

### Why it is mandatory here

Art. 40 requires a DPO where the controller is a public or private body, where
processing involves large-scale systematic monitoring, or where sensitive data is
processed at scale. This platform meets it on two independent counts: it operates
under the Ministry of Sports, and it processes health data (disability information)
for a large number of schoolchildren.

**No DPO is appointed.** `privacy@rwasport.rw` appears in the public privacy notice
and in the roster form sent to every school; it must route to a real person before
those go out at scale.

### Terms of reference

The DPO is required by art. 40 to:

1. Inform and advise the controller, processors and staff of their obligations.
2. Monitor compliance with the law and with internal policy, including the
   assignment of responsibilities and staff training.
3. Advise on data protection impact assessments and monitor their performance
   (arts. 15–16).
4. Cooperate with the supervisory authority and act as its contact point.

They must have professional qualities and expert knowledge of data protection law
and practice, must be able to act without instruction on how to perform the role,
and must be reachable by data subjects.

### First 90 days

| | Task | Reference |
|---|---|---|
| 1 | Review and sign off the DPIA | `DPIA.md` §6 |
| 2 | Take a decision on data residency — the highest residual risk | `DATA_PROTECTION.md` §6.1 |
| 3 | File the NCSA registration | Part 2 below |
| 4 | Execute processor contracts | `PROCESSORS.md` |
| 5 | Own the 48-hour breach procedure and rehearse it once | `DATA_PROTECTION.md` §5 |
| 6 | Confirm the retention purge is scheduled in every environment | `npm run privacy:purge` |
| 7 | Drive the consent backfill to zero | `/admin/consent/backlog` |
| 8 | Brief school coordinators on handling children's data | — |

### Appointment checklist

- [ ] Person named, in post, with the independence art. 40 requires
- [ ] Contact details published in the privacy notice
- [ ] `privacy@rwasport.rw` routes to them
- [ ] Communicated to the NCSA as part of registration
- [ ] Named in `DATA_PROTECTION.md` §1

---

## Part 2 — Registration with the NCSA (art. 29)

Data controllers and data processors must register with the supervisory authority.
The authority issues a certificate within 30 days. **The same certificate is what
art. 50 requires before personal data may be stored outside Rwanda** — so this
registration is also the gate on §6.1 of `DATA_PROTECTION.md`, and on whether the
application will start in production at all.

Apply through the Data Protection and Privacy Office: <https://dpo.gov.rw/>

### What the application needs, and where it already exists

| Required | Source in this repository |
|---|---|
| Controller identity and contact | `DATA_PROTECTION.md` §1 |
| DPO identity and contact | Part 1 above — **outstanding** |
| Purposes of processing | `DATA_PROTECTION.md` §1, table |
| Categories of data subject | Schoolchildren, players, coordinators, staff, site visitors |
| Categories of personal data, incl. sensitive | `DATA_PROTECTION.md` §1; `privacy.service.ts` |
| Recipients | `PROCESSORS.md` §1 |
| Transfers outside Rwanda, and safeguards | `PROCESSORS.md` §1 — **the answer is currently "yes, without safeguards"** |
| Retention periods | `RETENTION_DAYS` in `privacy.service.ts` |
| Security measures | `DATA_PROTECTION.md` §2 and §5; `DPIA.md` §4 |

The record of processing activities required by art. 17 is already written and is
most of the application. What is missing is a named DPO and a decision on transfers.

### Sequence

1. Appoint the DPO.
2. Decide residency: host in Rwanda, or apply for authorisation to store offshore.
3. File the registration, attaching the RoPA.
4. On receipt, set `NCSA_REGISTRATION_NUMBER` in the production environment — the
   server checks it at boot.
5. Record the certificate number and expiry in `DATA_PROTECTION.md` §6.1 and diary
   the renewal.

### Until then

Processing children's personal data on offshore infrastructure without the
certificate is the exposure. Penalties under arts. 53 and 62–63 run to
RWF 2–5 million or 1% of annual turnover administratively, and up to 5% of turnover
criminally, with asset seizure and closure available. The practical mitigation
available today is to move the database and document storage in-country
(`STORAGE_DRIVER=local` removes one offshore processor immediately), or to pause
offshore processing until the certificate is in hand.
