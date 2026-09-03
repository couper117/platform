/**
 * Reading and bending a club's colour.
 *
 * These two were private to utils/crest, which is where the first thing that
 * needed them lived. The player hero paints a whole band in a club's colour and
 * has to answer the same two questions — what colour does text go on top, and how
 * do I get a darker version of this for the strip underneath — so they live here
 * and crest imports them rather than keeping a second copy.
 */

/**
 * Black or white, whichever is legible on `hex`.
 *
 * A luminance threshold rather than a contrast ratio: the answer is only ever one
 * of two colours, so the question is which side of the middle the background sits
 * on. Falls back to white on anything it cannot parse, because the colours this is
 * asked about are club colours, and those are dark far more often than not.
 */
export const readableOn = (hex?: string | null) => {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return '#ffffff';
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#0b0b0f' : '#ffffff';
};

/**
 * Move `hex` toward black (t < 0) or white (t > 0) by a fraction of the distance.
 * `shade('#0B6E3F', -0.25)` is a quarter of the way to black.
 */
export const shade = (hex?: string | null, t = 0) => {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return hex || '';
  const out = [0, 2, 4]
    .map((i) => {
      const v = parseInt(h.slice(i, i + 2), 16);
      const target = t < 0 ? 0 : 255;
      return Math.round(v + (target - v) * Math.abs(t));
    })
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
  return `#${out}`;
};

/** `hex` as `r, g, b` so it can be dropped into an rgba() with its own alpha. */
export const rgbTriplet = (hex?: string | null) => {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return '0, 0, 0';
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ');
};
