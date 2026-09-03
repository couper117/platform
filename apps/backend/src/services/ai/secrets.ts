/**
 * Encryption for provider API keys held in the database.
 *
 * An API key an administrator types into the console has to be stored somewhere,
 * and a Setting row is plain text by construction. Anyone with a read replica, a
 * backup file or a `SELECT * FROM "Setting"` would otherwise walk away with a
 * live billing credential. So the value is sealed here before it is written and
 * opened only inside the server process that is about to make the call.
 *
 * AES-256-GCM, not AES-CBC: the tag makes a tampered ciphertext fail loudly
 * instead of decrypting to rubbish that then gets sent to a third party as a
 * credential.
 *
 * THE KEY IS NOT IN THE DATABASE. It is derived from AI_SECRET_KEY, or from
 * JWT_SECRET when that is not set, so the secret that opens the store lives only
 * in the environment — the same place the API key would live if it had been
 * configured that way in the first place. A dump of the database on its own is
 * therefore not enough to read anything.
 *
 * CONSEQUENCE WORTH KNOWING: rotating JWT_SECRET without setting AI_SECRET_KEY
 * makes every stored key unreadable. That is not silent — decryptSecret returns
 * null, the resolver falls through to the environment variable, and the admin
 * console shows the key as "needs re-entering" rather than pretending it works.
 */

const crypto = require('crypto');
const env = require('../../config/env');

const ALGORITHM = 'aes-256-gcm';
/** Marks a value as sealed, and versions the scheme so it can be changed later. */
const PREFIX = 'enc.v1:';
const SALT = 'rnsp.ai.secrets.v1';

let cachedKey = null;
let cachedMaterial = null;

const derivedKey = () => {
  const material = env.AI_SECRET_KEY || env.JWT_SECRET;
  if (!material) throw new Error('Cannot seal AI credentials: neither AI_SECRET_KEY nor JWT_SECRET is set.');
  // scrypt is deliberately slow, so it is derived once per process rather than
  // per call — the input is a long random secret, not a password being guessed.
  if (cachedKey && cachedMaterial === material) return cachedKey;
  cachedKey = crypto.scryptSync(material, SALT, 32);
  cachedMaterial = material;
  return cachedKey;
};

/** Whether a stored value went through encryptSecret (vs. a legacy plain value). */
const isSealed = (value) => typeof value === 'string' && value.startsWith(PREFIX);

/** Seal a credential for storage. Returns `enc.v1:<iv>.<tag>.<ciphertext>`, base64url. */
const encryptSecret = (plaintext) => {
  if (typeof plaintext !== 'string' || plaintext === '') return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey(), iv);
  const sealed = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64url')}.${tag.toString('base64url')}.${sealed.toString('base64url')}`;
};

/**
 * Open a sealed credential. Returns null on anything that does not open cleanly
 * — a rotated secret, a truncated row, a tampered ciphertext — so a caller can
 * fall back to the environment instead of sending a corrupted key upstream.
 */
const decryptSecret = (stored) => {
  if (typeof stored !== 'string' || stored === '') return null;
  if (!isSealed(stored)) return stored; // pre-encryption row, still usable

  try {
    const [ivPart, tagPart, dataPart] = stored.slice(PREFIX.length).split('.');
    if (!ivPart || !tagPart || !dataPart) return null;

    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey(), Buffer.from(ivPart, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch (error) {
    console.warn('[ai] A stored API key could not be decrypted — it will be treated as unset.');
    return null;
  }
};

/**
 * What the console is allowed to show: enough to recognise which key is in place,
 * never enough to use it. The last four characters only, and never for a key so
 * short that four characters would be most of it.
 */
const maskSecret = (plaintext) => {
  if (typeof plaintext !== 'string' || plaintext === '') return null;
  if (plaintext.length <= 8) return '•'.repeat(plaintext.length);
  return `${'•'.repeat(8)}${plaintext.slice(-4)}`;
};

module.exports = { encryptSecret, decryptSecret, maskSecret, isSealed };
