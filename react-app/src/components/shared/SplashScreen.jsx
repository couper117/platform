import React from 'react';
import Loader from './Loader';

/**
 * App splash — the first thing painted on a cold start, particularly when launched
 * from the home screen as an installed PWA.
 *
 * `delay={0}` because unlike a route change this IS the first paint: there is nothing
 * behind it to flash against, and waiting 180ms to show anything would just be 180ms
 * of blank white.
 *
 * It carries the wordmark, which the route loader deliberately does not — a cold
 * start is the one moment where saying whose app this is earns its place.
 *
 * The version this replaces was a rotated red tile, a second offset blue tile, three
 * lines of tracked-out copy and a tricolour bar, held for a fixed 1200ms whether the
 * app was ready or not.
 */
const SplashScreen = () => (
  <Loader fullscreen brand delay={0} label="Starting RwaSport" />
);

export default SplashScreen;
