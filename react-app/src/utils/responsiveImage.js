/**
 * Responsive image props — never ship a 1920px hero to a 360px phone.
 *
 * Returns `{ src, srcSet, sizes }` ready to spread onto an <img>. The browser
 * then picks the narrowest candidate that covers the slot, which is the whole
 * point: a 360px screen at DPR 2 fetches the 640 or 960 variant, not 1920.
 *
 * Sources are handled per-host because each CDN has its own transform syntax:
 *
 *   • Unsplash  — resized via `w=`; `auto=format` already negotiates WebP/AVIF.
 *   • Cloudinary — resized by injecting a transform segment after `/upload/`,
 *     with `f_auto` for format negotiation and `q_auto` for quality.
 *   • Anything else — passed through untouched with no `srcSet`, so an unknown
 *     host degrades to today's behaviour rather than breaking.
 *
 * TO MOVE THE SPORT HEROES OFF UNSPLASH ENTIRELY: upload them to Cloudinary and
 * swap the URLs in src/config/sportThemes.js. This helper needs no change —
 * it already recognises Cloudinary and will transform them on sight.
 */

const DEFAULT_WIDTHS = [640, 960, 1280, 1920];

/** Full-bleed hero: the slot is always the viewport width. */
export const FULL_BLEED = '100vw';

const isUnsplash = (url) => url.includes('images.unsplash.com');
const isCloudinary = (url) => url.includes('res.cloudinary.com') && url.includes('/upload/');

const unsplashAt = (url, w) => {
  // Rewrite an existing w= rather than appending a duplicate.
  const [base, query = ''] = url.split('?');
  const params = new URLSearchParams(query);
  params.set('auto', 'format');
  params.set('fit', 'crop');
  params.set('q', params.get('q') || '75');
  params.set('w', String(w));
  return `${base}?${params.toString()}`;
};

const cloudinaryAt = (url, w) =>
  // f_auto → WebP/AVIF where supported; c_limit never upscales past the original.
  url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${w}/`);

const transform = (url, w) => {
  if (isUnsplash(url)) return unsplashAt(url, w);
  if (isCloudinary(url)) return cloudinaryAt(url, w);
  return url;
};

/**
 * @param {string} url
 * @param {{ widths?: number[], sizes?: string }} [opts]
 * @returns {{ src: string, srcSet?: string, sizes?: string }}
 */
export const responsiveImage = (url, opts = {}) => {
  if (typeof url !== 'string' || !url) return { src: '' };

  const { widths = DEFAULT_WIDTHS, sizes = FULL_BLEED } = opts;

  // Unknown host: no transform is possible, so don't advertise a srcSet that
  // would just fetch the same file four times over.
  if (!isUnsplash(url) && !isCloudinary(url)) return { src: url };

  return {
    // Mid-scale default for browsers that ignore srcSet — not the 1920.
    src: transform(url, widths[Math.floor(widths.length / 2)] ?? widths[0]),
    srcSet: widths.map((w) => `${transform(url, w)} ${w}w`).join(', '),
    sizes,
  };
};

export default responsiveImage;
