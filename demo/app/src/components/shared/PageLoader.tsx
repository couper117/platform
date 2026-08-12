import React from 'react';
import Loader from './Loader';

/**
 * Suspense fallback for lazy route chunks.
 *
 * A thin wrapper over Loader, kept because App references it in several places
 * and a route fallback is a distinct enough job to name.
 *
 * NO WORDMARK and no copy. This appears between two screens of an app the visitor is
 * already inside — re-introducing the brand mid-navigation is noise. The old version
 * announced "Murakaza Neza / Synchronizing Data" on every route change, which was
 * both untrue and impossible to read in the time it was on screen. That copy was
 * later translated into RW/FR upstream; the translations are moot because the copy
 * itself is gone by design.
 */
const PageLoader = () => <Loader fullscreen label="Loading page" />;

export default PageLoader;
