'use client';

import { useCallback, useEffect, useRef } from 'react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({
  minimum: 0.1,
  showSpinner: false,
  trickleSpeed: 200,
  easing: 'ease',
  speed: 400,
});

export function NavigationLoadingBar() {
  const nprogressStarted = useRef(false);

  const handleStart = useCallback(() => {
    if (!nprogressStarted.current) {
      NProgress.start();
      nprogressStarted.current = true;
    }
  }, []);

  const handleStop = useCallback(() => {
    NProgress.done();
    nprogressStarted.current = false;
  }, []);

  useEffect(() => {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      handleStart();
      return originalPushState.apply(this, args);
    };

    history.replaceState = function (...args) {
      handleStart();
      return originalReplaceState.apply(this, args);
    };

    const handlePopState = () => handleStart();

    window.addEventListener('popstate', handlePopState);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
      handleStop();
    };
  }, [handleStart, handleStop]);

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      handleStart();
      return originalFetch.apply(this, args).finally(handleStop);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [handleStart, handleStop]);

  return null;
}
