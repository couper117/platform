import { useEffect, useState } from 'react';

/**
 * PWA install control. RwaSport is a mobile-first installable web app; this
 * captures the browser's `beforeinstallprompt` so a real "Install app" button
 * can trigger it on demand (Android/Chromium). iOS never fires that event, so
 * we detect it to show a "Add to Home Screen" hint instead.
 */
export default function usePwaInstall() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(
    () => typeof window !== 'undefined' &&
      (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator?.standalone === true)
  );

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return false;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferred(null);
    return outcome === 'accepted';
  };

  const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator?.standalone;

  return { canInstall: !!deferred, installed, install, isIos };
}
