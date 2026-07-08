'use client';

import { useEffect } from 'react';

/** Registra o service worker (produção). Em dev o /sw.js não existe — silencioso. */
export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
