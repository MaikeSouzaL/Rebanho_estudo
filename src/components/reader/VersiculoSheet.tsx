'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { RefParsed } from '@/lib/refs';
import { NOME_TRADUCAO, resolverReferencia, type VersiculoResolvido } from '@/lib/biblia';

/**
 * Bottom sheet de versículo: tocar em "At 11.26" abre o texto AQUI,
 * sem sair da lição (Master Prompt §4). Fonte: Bíblia em domínio público,
 * empacotada no app — funciona offline.
 */
export function VersiculoSheet({
  referencia,
  fechar,
}: {
  referencia: RefParsed | null;
  fechar: () => void;
}) {
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'indisponivel'>('carregando');
  const [versiculos, setVersiculos] = useState<VersiculoResolvido[]>([]);

  useEffect(() => {
    if (!referencia) return;
    let vivo = true;
    setEstado('carregando');
    void resolverReferencia(referencia).then((v) => {
      if (!vivo) return;
      if (v) {
        setVersiculos(v);
        setEstado('ok');
      } else {
        setEstado('indisponivel');
      }
    });
    return () => {
      vivo = false;
    };
  }, [referencia]);

  return (
    <AnimatePresence>
      {referencia && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={fechar}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[75dvh] max-w-lg overflow-y-auto rounded-t-2xl border border-b-0 border-line bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-glow"
            role="dialog"
            aria-label={`Versículo ${referencia.raw}`}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Bíblia · offline</p>
                <h2 className="font-serif text-2xl font-bold text-ink">
                  {referencia.livroLabel} {referencia.capitulo}.{referencia.versiculos}
                </h2>
              </div>
              <button
                type="button"
                onClick={fechar}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {estado === 'carregando' && (
              <div className="space-y-2.5" aria-hidden>
                {[90, 100, 70].map((w, i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-surface-2" style={{ width: `${w}%` }} />
                ))}
              </div>
            )}

            {estado === 'ok' && (
              <div className="space-y-3">
                {versiculos.map((v) => (
                  <p key={v.numero} className="verse leading-relaxed text-ink">
                    <sup className="mr-1.5 align-super text-xs font-bold text-gold">{v.numero}</sup>
                    {v.texto}
                  </p>
                ))}
              </div>
            )}

            {estado === 'indisponivel' && (
              <p className="rounded-xl bg-bg-2/60 p-4 text-sm text-ink-muted">
                Este texto não está no pacote offline do aplicativo. ({referencia.raw})
              </p>
            )}

            <p className="mt-5 border-t border-line pt-3 text-[11px] text-ink-muted">
              {NOME_TRADUCAO} — tradução em domínio público.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
