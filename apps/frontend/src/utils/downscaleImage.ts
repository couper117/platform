/**
 * Shrink a chosen image in the browser before it is uploaded.
 *
 * WHY. A photograph off a modern phone is 3–12MB, and the avatar it becomes is
 * rendered at 40 pixels. Sending the original costs a reporter on a district
 * ground's mobile connection a minute of upload for an image the server is about
 * to resize to 256px and throw the rest away — and anything over the 8MB limit
 * fails outright, after the wait.
 *
 * So the browser does the throwing away, before the request. A 12MB camera JPEG
 * becomes roughly 40KB of WebP, which uploads in a moment on 3G.
 *
 * THIS IS NOT A VALIDATION LAYER. The server still resizes, still enforces its
 * own limit, and still refuses a non-image — a client that skips this step, or
 * lies about what it sent, changes nothing about what is stored. This exists to
 * make the common path fast, not to make the server trust the browser.
 */

export type DownscaleOptions = {
  /** Longest edge of the result, in pixels. */
  maxEdge?: number;
  /** WebP quality, 0–1. */
  quality?: number;
  type?: string;
};

/**
 * The dimension arithmetic, separated so it can be tested without a canvas.
 *
 * An image already smaller than `maxEdge` is returned untouched rather than
 * scaled up: enlarging it would add bytes and no detail. Rounding is to whole
 * pixels because a canvas cannot be 133.33 wide, and `Math.max(1, …)` guards the
 * degenerate 1px-tall image that would otherwise round to a zero-size canvas and
 * throw.
 */
export const fitWithin = (width: number, height: number, maxEdge: number) => {
  const longest = Math.max(width, height);
  if (!longest || longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

/**
 * Returns a smaller File, or the original if the browser cannot help.
 *
 * EVERY FAILURE PATH RETURNS THE ORIGINAL. A missing canvas, a `toBlob` that
 * hands back null, an image the decoder refuses, an OffscreenCanvas tainted by
 * something exotic — none of those are reasons to stop a reporter uploading
 * their photograph. They only mean the upload is bigger than it needed to be,
 * and the server handles that case anyway.
 */
const downscaleImage = async (file: File, options: DownscaleOptions = {}): Promise<File> => {
  const { maxEdge = 512, quality = 0.85, type = 'image/webp' } = options;

  if (typeof document === 'undefined' || !file?.type?.startsWith('image/')) return file;
  // An SVG has no intrinsic pixels to resample and rasterising one here would
  // silently change what the reporter chose.
  if (file.type === 'image/svg+xml') return file;

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('decode failed'));
      img.src = url;
    });

    const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight, maxEdge);
    if (width === image.naturalWidth && height === image.naturalHeight && file.size < 512 * 1024) {
      // Already small in both senses. Re-encoding would only lose a generation.
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), type, quality);
    });
    if (!blob) return file;

    // Keep the original stem so the media record and any download read sensibly.
    const stem = file.name.replace(/\.[^.]+$/, '') || 'photo';
    const ext = type === 'image/webp' ? 'webp' : 'jpg';
    return new File([blob], `${stem}.${ext}`, { type: blob.type || type });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
};

export default downscaleImage;
