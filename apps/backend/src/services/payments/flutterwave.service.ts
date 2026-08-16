/**
 * Flutterwave payment provider — env-gated.
 *
 * This is the real integration surface (hosted-payment-link creation + webhook
 * signature verification), but it never *requires* credentials to run: with no
 * FLW_* env set it operates in "sandbox" mode — it mints a local placeholder link
 * and refuses to auto-verify webhooks — so development and CI work unchanged.
 *
 * TO GO LIVE: set FLW_SECRET_KEY, FLW_PUBLIC_KEY and FLW_WEBHOOK_HASH (the
 * dashboard "secret hash"). Nothing else in the app needs to change.
 *
 * Webhook auth: Flutterwave (v3) authenticates webhooks with a STATIC secret
 * hash echoed in the `verif-hash` request header — not a body HMAC — so the
 * parsed JSON body is fine and we compare hashes in constant time.
 */
const crypto = require('crypto');
const env = require('../../config/env');

const isConfigured = () => Boolean(env.FLW_SECRET_KEY);

// Constant-time string compare that never throws on length mismatch.
const safeEqual = (a: string, b: string) => {
  const ba = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
};

/**
 * Verify an incoming Flutterwave webhook. Returns true only when a hash is
 * configured AND the request's `verif-hash` header matches it. If no hash is
 * configured we return false (fail closed) — an unverifiable webhook must never
 * be trusted to move money.
 */
const verifyWebhookSignature = (req: any) => {
  if (!env.FLW_WEBHOOK_HASH) return false;
  const sent = req.headers['verif-hash'] || req.headers['verif_hash'];
  return safeEqual(sent, env.FLW_WEBHOOK_HASH);
};

/**
 * Create a hosted payment link for a pending transaction.
 * Returns { link, mode } where mode is 'live' | 'sandbox'. In sandbox mode (or on
 * any provider error) it degrades to a clearly-marked local placeholder link so
 * the caller always gets a usable response.
 */
const createPaymentLink = async ({ txRef, amount, customer, redirectUrl, meta }: any) => {
  const sandboxLink = `${env.FRONTEND_URL}/pay/sandbox/${encodeURIComponent(txRef)}`;

  if (!isConfigured()) {
    return { link: sandboxLink, mode: 'sandbox' };
  }

  try {
    const resp = await fetch(`${env.FLW_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.FLW_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount,
        currency: env.PAYMENT_CURRENCY,
        redirect_url: redirectUrl || `${env.FRONTEND_URL}/pay/callback`,
        customer,
        meta,
        customizations: { title: 'RwaSport Subscription' },
      }),
    });
    const json: any = await resp.json();
    if (!resp.ok || json.status !== 'success' || !json.data?.link) {
      console.error('[flutterwave] payment link creation failed:', json?.message || resp.status);
      return { link: sandboxLink, mode: 'sandbox' };
    }
    return { link: json.data.link, mode: 'live' };
  } catch (error: any) {
    console.error('[flutterwave] payment link request errored:', error?.message);
    return { link: sandboxLink, mode: 'sandbox' };
  }
};

module.exports = { isConfigured, verifyWebhookSignature, createPaymentLink };
