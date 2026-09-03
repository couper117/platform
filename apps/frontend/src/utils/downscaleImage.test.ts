import { describe, it, expect } from 'vitest';
import { fitWithin } from './downscaleImage';

/**
 * The arithmetic behind the avatar upload's browser-side resize.
 *
 * Only the dimension maths is tested here: the rest of `downscaleImage` is a
 * canvas, an image decoder and `toBlob`, none of which jsdom implements, and a
 * test that mocked all three would be testing the mocks. This function is where
 * a bug would actually live — an off-by-one that produces a zero-height canvas
 * throws at `drawImage`, and a scale applied to the wrong edge silently crops.
 */
describe('fitWithin', () => {
  it('leaves an image already within the limit untouched', () => {
    expect(fitWithin(300, 200, 512)).toEqual({ width: 300, height: 200 });
  });

  it('leaves an image exactly at the limit untouched', () => {
    expect(fitWithin(512, 512, 512)).toEqual({ width: 512, height: 512 });
  });

  it('scales by the LONGEST edge, so nothing is cropped', () => {
    // Landscape: width is the constraint.
    expect(fitWithin(4000, 3000, 512)).toEqual({ width: 512, height: 384 });
    // Portrait — the common case for a phone photograph — height is.
    expect(fitWithin(3000, 4000, 512)).toEqual({ width: 384, height: 512 });
  });

  it('keeps the aspect ratio within a rounding of a pixel', () => {
    const { width, height } = fitWithin(4032, 3024, 512);
    expect(Math.abs(width / height - 4032 / 3024)).toBeLessThan(0.01);
  });

  it('never rounds an extreme panorama down to a zero-size canvas', () => {
    // 10000x3 scaled to 512 would give a height of 0.15 — a canvas of height 0
    // throws on drawImage, which is the failure this guard exists for.
    expect(fitWithin(10000, 3, 512)).toEqual({ width: 512, height: 1 });
  });

  it('treats a degenerate zero-size image as nothing to do', () => {
    expect(fitWithin(0, 0, 512)).toEqual({ width: 0, height: 0 });
  });
});
