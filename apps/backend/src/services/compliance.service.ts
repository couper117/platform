/**
 * Where the platform actually stands against Law N° 058/2021.
 *
 * docs/DATA_PROTECTION.md §6 lists what is outstanding, and a document nobody
 * opens is a document nobody acts on. Everything here that can be counted is
 * counted from the database rather than restated from prose — a consent backlog,
 * an overdue data-subject request and a retention debt are facts, and they change
 * without anyone editing the markdown.
 *
 * The items that genuinely need a person — registering with the NCSA, appointing
 * a DPO, signing processor contracts — cannot be computed, so they are reported
 * as configuration: set, or not set. That is the honest distinction, and it stops
 * a checklist implying the platform has done something it has not.
 */

const prisma = require('../config/db');
const env = require('../config/env');
const { RETENTION_DAYS } = require('./privacy.service');

const daysAgo = (n) => new Date(Date.now() - n * 86400000);

/** ok = nothing to do · action = someone must act · blocked = unlawful as configured */
const STATUS = { OK: 'ok', ACTION: 'action', BLOCKED: 'blocked' };

/**
 * Data residency (arts. 48–50).
 *
 * The boot check in dataResidency.service.ts already refuses to start a
 * production server that would put personal data offshore without a certificate.
 * This reports the same configuration so it can be seen before a deploy rather
 * than discovered by a server that will not come up.
 */
const residency = () => {
  const declared = env.DATA_RESIDENCY || null;
  const certificate = env.NCSA_REGISTRATION_NUMBER || null;
  const storage = env.STORAGE_DRIVER;

  const notes = [];
  if (storage === 'local') {
    notes.push('Media is stored on the application host, not Cloudinary — one offshore processor fewer.');
  } else {
    notes.push('Media goes to Cloudinary, which is offshore and needs a processor contract (art. 49).');
  }

  let status = STATUS.ACTION;
  let summary;
  if (!declared) {
    summary = 'Not declared. Production will refuse to start until DATA_RESIDENCY is set.';
  } else if (declared === 'rwanda') {
    status = STATUS.OK;
    summary = 'Declared as Rwanda. No cross-border transfer to authorise.';
  } else if (certificate) {
    status = STATUS.OK;
    summary = `Offshore, with certificate ${certificate} on file.`;
  } else {
    status = STATUS.BLOCKED;
    summary = 'Offshore with no NCSA certificate — art. 50 does not permit this.';
  }

  return {
    key: 'residency',
    article: 'arts. 48-50',
    title: 'Where personal data is stored',
    status,
    summary,
    detail: { declared, certificate: certificate ? 'on file' : null, storageDriver: storage },
    notes,
  };
};

/** Registration and the DPO (arts. 29, 40) — both need a person, not a query. */
const registration = () => ({
  key: 'registration',
  article: 'arts. 29, 40',
  title: 'Registration and Data Protection Officer',
  status: env.NCSA_REGISTRATION_NUMBER ? STATUS.OK : STATUS.ACTION,
  summary: env.NCSA_REGISTRATION_NUMBER
    ? `Registered: ${env.NCSA_REGISTRATION_NUMBER}.`
    : 'Not registered with the NCSA, and no DPO recorded.',
  notes: [
    'privacy@rwasport.rw appears in the public notice and on every roster form sent to a school — it must reach the DPO.',
    'Terms of reference and the filing checklist: docs/privacy/DPO-AND-REGISTRATION.md',
  ],
});

/** Consent for children already on the roster (art. 9). */
const consent = async () => {
  const outstanding = await prisma.akcPlayer.count({
    where: { guardianConsent: false, active: true },
  });
  return {
    key: 'consent',
    article: 'art. 9',
    title: "Guardian consent for registered children",
    status: outstanding === 0 ? STATUS.OK : STATUS.ACTION,
    summary: outstanding === 0
      ? 'Every registered athlete has recorded guardian consent.'
      : `${outstanding} athlete${outstanding === 1 ? '' : 's'} without recorded consent. They are withheld from published team sheets until it arrives.`,
    detail: { outstanding },
  };
};

/** Data-subject requests and the statutory clock (arts. 18-24). */
const dataSubjectRequests = async () => {
  const now = new Date();
  const [open, overdue] = await Promise.all([
    prisma.dataSubjectRequest.count({ where: { status: { in: ['RECEIVED', 'IN_PROGRESS'] } } }),
    prisma.dataSubjectRequest.count({
      where: { status: { in: ['RECEIVED', 'IN_PROGRESS'] }, dueAt: { lt: now } },
    }),
  ]);
  return {
    key: 'dsr',
    article: 'arts. 18-24',
    title: 'Data-subject requests',
    status: overdue > 0 ? STATUS.BLOCKED : (open > 0 ? STATUS.ACTION : STATUS.OK),
    summary: overdue > 0
      ? `${overdue} request${overdue === 1 ? '' : 's'} past the thirty-day deadline.`
      : open > 0
        ? `${open} open, none overdue.`
        : 'Nothing outstanding.',
    detail: { open, overdue },
  };
};

/**
 * Personal data kept past its purpose (art. 52).
 *
 * Counted rather than asserted: the retention schedule lives in
 * privacy.service.ts and `npm run privacy:purge` enforces it, but nothing said
 * whether it had been run lately. This is the answer.
 */
const retention = async () => {
  const [visitors, activity, tokens, contacts] = await Promise.all([
    prisma.activityLog.count({ where: { createdAt: { lt: daysAgo(RETENTION_DAYS.visitorLogs) }, sessionId: { not: null } } }),
    prisma.activityLog.count({ where: { createdAt: { lt: daysAgo(RETENTION_DAYS.activityLogs) } } }),
    prisma.refreshToken.count({ where: { expiresAt: { lt: daysAgo(RETENTION_DAYS.refreshTokens) } } }),
    prisma.contact.count({ where: { createdAt: { lt: daysAgo(RETENTION_DAYS.contactMessages) } } }),
  ]);
  const total = visitors + activity + tokens + contacts;
  return {
    key: 'retention',
    article: 'art. 52',
    title: 'Data kept past its purpose',
    status: total === 0 ? STATUS.OK : STATUS.ACTION,
    summary: total === 0
      ? 'Nothing is being kept beyond its retention period.'
      : `${total} row${total === 1 ? '' : 's'} are past retention. Run \`npm run privacy:purge:apply\`.`,
    detail: { visitorLogs: visitors, activityLogs: activity, refreshTokens: tokens, contactMessages: contacts, schedule: RETENTION_DAYS },
  };
};

/** Everything, with a single overall reading. */
const complianceStatus = async () => {
  const items = [
    residency(),
    registration(),
    await consent(),
    await dataSubjectRequests(),
    await retention(),
  ];

  const counts = items.reduce((acc, i) => ({ ...acc, [i.status]: (acc[i.status] || 0) + 1 }), {});
  const overall = counts[STATUS.BLOCKED] ? STATUS.BLOCKED : counts[STATUS.ACTION] ? STATUS.ACTION : STATUS.OK;

  return { overall, counts, items, checkedAt: new Date().toISOString() };
};

module.exports = { complianceStatus, STATUS };
