// Single source of truth for player document verification.
const BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE';
const PASSPORT = 'PASSPORT';
const NATIONAL_ID = 'NATIONAL_ID';

// The document types a player may submit toward verification.
const REQUIRED_DOC_TYPES = [BIRTH_CERTIFICATE, PASSPORT, NATIONAL_ID];

/**
 * Pure verification rule: a player is auto-verified once their APPROVED
 * documents include a birth certificate PLUS one photo ID (passport OR national
 * ID). This decision drives real trust in the platform, so it is isolated here
 * and covered by unit tests (test/unit/verification.test.ts).
 *
 * REGRESSION GUARD: an earlier version required passport AND national ID, which
 * made verification effectively unreachable (issue K12). The test suite asserts
 * that EITHER photo ID (not both) is sufficient, so that bug cannot come back.
 */
const isPlayerVerifiable = (approvedDocTypes: any[] = []) => {
  const types = new Set(approvedDocTypes);
  const hasBirthCert = types.has(BIRTH_CERTIFICATE);
  const hasPhotoId = types.has(PASSPORT) || types.has(NATIONAL_ID);
  return hasBirthCert && hasPhotoId;
};

module.exports = { REQUIRED_DOC_TYPES, BIRTH_CERTIFICATE, PASSPORT, NATIONAL_ID, isPlayerVerifiable };
