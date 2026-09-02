/**
 * A per-browser identifier for someone who has not signed in.
 *
 * The platform lets a visitor follow a team without an account, which means the
 * server needs some way to recognise the same browser next time. This is that,
 * and deliberately nothing more: a random value this browser generates for
 * itself, stored locally, sent on requests that need it.
 *
 * It is not derived from anything about the person or the device — no IP
 * address, no fingerprint, nothing an analytics vendor would call a signal.
 * Clearing site data ends it and starts a new one, which is the whole point:
 * there is nothing on the server that could link the two.
 */

const KEY = 'rnsp-anon-id';

/** Matches the shape the API accepts — opaque, and long enough not to collide. */
const generate = () => {
  const bytes = new Uint8Array(18);
  (globalThis.crypto || (window as any).msCrypto).getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * This browser's token, creating one on first use.
 *
 * Returns null when storage is unavailable — a private window, or a browser set
 * to block site data. Following then simply does not work for that visitor,
 * which is the correct outcome: there is nowhere to remember it, and inventing a
 * token per request would write rows nobody could ever read back.
 */
export const getAnonId = (): string | null => {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const fresh = generate();
    localStorage.setItem(KEY, fresh);
    return fresh;
  } catch {
    return null;
  }
};

/** Forget this browser's following history. */
export const clearAnonId = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
};

export default getAnonId;
