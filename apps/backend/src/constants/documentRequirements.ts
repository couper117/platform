// Single source of truth for which document types a player must have
// APPROVED before they're auto-verified. Keep in sync with the DocType enum.
const REQUIRED_DOC_TYPES = ['BIRTH_CERTIFICATE', 'PASSPORT', 'NATIONAL_ID'];

module.exports = { REQUIRED_DOC_TYPES };
