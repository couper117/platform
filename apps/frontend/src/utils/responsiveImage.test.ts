import { describe, it, expect } from 'vitest';
import { responsiveImage, FULL_BLEED } from './responsiveImage';

describe('responsiveImage', () => {
  it('returns an empty src for empty or invalid input', () => {
    expect(responsiveImage('')).toEqual({ src: '' });
    expect(responsiveImage(null as any)).toEqual({ src: '' });
  });

  it('passes an unknown host through with no srcSet (no 4× refetch)', () => {
    const r = responsiveImage('https://example.com/a.jpg');
    expect(r.src).toBe('https://example.com/a.jpg');
    expect(r.srcSet).toBeUndefined();
  });

  it('builds an Unsplash srcSet and a mid-scale default src (never the 1920)', () => {
    const r = responsiveImage('https://images.unsplash.com/photo-123?q=80');
    expect(r.srcSet).toContain('640w');
    expect(r.srcSet).toContain('1920w');
    expect(r.sizes).toBe(FULL_BLEED);
    expect(r.src).toContain('w=1280'); // mid candidate
    expect(r.src).not.toContain('w=1920');
    expect(r.src).toContain('auto=format');
  });

  it('injects a Cloudinary transform segment after /upload/', () => {
    const r = responsiveImage('https://res.cloudinary.com/demo/image/upload/v1/pic.jpg');
    expect(r.src).toContain('/upload/f_auto,q_auto,c_limit,w_1280/');
    expect(r.srcSet).toContain('/upload/f_auto,q_auto,c_limit,w_640/');
  });

  it('honours custom widths and sizes', () => {
    const r = responsiveImage('https://images.unsplash.com/photo-1', { widths: [400, 800], sizes: '50vw' });
    expect(r.sizes).toBe('50vw');
    expect(r.srcSet).toContain('400w');
    expect(r.srcSet).toContain('800w');
  });
});
