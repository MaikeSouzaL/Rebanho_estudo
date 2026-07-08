'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Tela de apresentação (como um app nativo) — mostra a identidade da
 * Igreja Pentecostal O Rebanho de Jesus Cristo antes da Home.
 * Aparece 1x por sessão; toque para pular.
 * Logo: public/igreja/logo.png (fallback: monograma dourado).
 */
export function SplashScreen() {
  const [visivel, setVisivel] = useState(false);
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem('ebd:splashVisto')) return;
    setVisivel(true);
    const t = setTimeout(() => dispensar(), 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispensar = () => {
    sessionStorage.setItem('ebd:splashVisto', '1');
    setVisivel(false);
  };

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          onClick={dispensar}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050d17] px-8"
          role="dialog"
          aria-label="Apresentação"
        >
          {/* brilho suave atrás da logo */}
          <div
            className="pointer-events-none absolute h-72 w-72 rounded-full bg-gold/15 blur-3xl"
            aria-hidden
          />

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 160, delay: 0.1 }}
            className="relative"
          >
            {logoOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/igreja/logo.png"
                alt="Igreja Pentecostal O Rebanho de Jesus Cristo"
                className="h-44 w-44 rounded-full object-contain drop-shadow-[0_0_30px_rgba(201,162,75,0.25)] sm:h-52 sm:w-52"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <div className="flex h-44 w-44 items-center justify-center rounded-full border-2 border-gold/60 bg-surface/40 sm:h-52 sm:w-52">
                <span className="font-serif text-5xl font-bold text-gold">R</span>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="eyebrow mb-2">Igreja Pentecostal</p>
            <h1 className="font-serif text-3xl font-bold leading-tight text-ink sm:text-4xl">
              O Rebanho de <span className="text-gold">Jesus Cristo</span>
            </h1>
            <p className="mt-2 text-sm text-ink-muted">Escola Bíblica Dominical · desde 1990</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="absolute bottom-10 flex flex-col items-center gap-3"
          >
            <span className="h-1 w-24 overflow-hidden rounded-full bg-surface-2">
              <motion.span
                className="block h-full bg-gold"
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
              />
            </span>
            <p className="text-[11px] text-ink-muted/70">toque para entrar</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
