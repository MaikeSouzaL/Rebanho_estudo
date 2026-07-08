'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Estende a interface global para incluir o evento beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Detecta se é iOS (iPhone/iPad) para mostrar instrução manual
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone === true);
    
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Impede o mini-infobar padrão do navegador
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt && !isIOS) return null;

  return (
    <AnimatePresence>
      {(deferredPrompt || (isIOS && !showIOSPrompt)) && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-sm rounded-2xl border border-gold/30 bg-surface p-4 shadow-glow sm:bottom-8"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-2xl">
              📖
            </div>
            <div className="flex-1">
              <h4 className="font-serif font-bold text-ink">Instalar EBD Foco</h4>
              <p className="mt-1 text-sm text-ink-muted">
                Instale o app para ter acesso offline a todas as lições, XP e anotações.
              </p>
              
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeferredPrompt(null);
                    setIsIOS(false);
                  }}
                  className="flex-1 rounded-full px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-2"
                >
                  Agora não
                </button>
                {deferredPrompt ? (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="flex-1 rounded-full bg-gold px-4 py-2 text-sm font-bold text-bg hover:brightness-110"
                  >
                    Instalar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowIOSPrompt(true)}
                    className="flex-1 rounded-full bg-gold px-4 py-2 text-sm font-bold text-bg hover:brightness-110"
                  >
                    Como instalar
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {showIOSPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-end bg-black/60 p-4 pb-10"
          onClick={() => setShowIOSPrompt(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-gold/30 bg-surface p-6 shadow-glow"
          >
            <h4 className="font-serif text-lg font-bold text-ink mb-4 text-center">Instalar no iPhone/iPad</h4>
            <ol className="list-decimal pl-5 text-sm text-ink-muted space-y-3 mb-6">
              <li>Toque no botão <strong>Compartilhar</strong> (o quadrado com uma seta para cima) na barra inferior do Safari.</li>
              <li>Role para baixo e toque em <strong>Adicionar à Tela de Início</strong> (ícone de um quadrado com um sinal de +).</li>
              <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
            </ol>
            <button
              onClick={() => {
                setShowIOSPrompt(false);
                setIsIOS(false);
              }}
              className="w-full rounded-full bg-surface-2 py-3 text-sm font-semibold text-ink"
            >
              Entendi
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
