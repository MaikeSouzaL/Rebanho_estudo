'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { RefParsed } from '@/lib/refs';
import { NOME_TRADUCAO, resolverReferencia, type VersiculoResolvido } from '@/lib/biblia';
import { gerarNarracao } from '@/lib/narrador';

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
  const [leitura, setLeitura] = useState<'parado' | 'carregando_audio' | 'tocando'>('parado');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!referencia) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
      setLeitura('parado');
      return;
    }
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

  const alternarLeitura = async () => {
    if (typeof window === 'undefined') return;
    
    // Parar leitura atual
    if (leitura === 'tocando' || leitura === 'carregando_audio') {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
      setLeitura('parado');
      return;
    }

    const textoInteiro = versiculos.map((v) => v.texto).join(' ');
    if (!textoInteiro) return;

    setLeitura('carregando_audio');
    
    abortRef.current = new AbortController();
    
    try {
      // 1. Tentar gerar com IA
      const blob = await gerarNarracao(textoInteiro, abortRef.current.signal);
      
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = new Audio(url);
        audioRef.current = a;
        a.onended = () => {
          setLeitura('parado');
          URL.revokeObjectURL(url);
        };
        a.onerror = () => {
          setLeitura('parado');
          URL.revokeObjectURL(url);
        };
        await a.play();
        setLeitura('tocando');
        return;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        return; // Foi cancelado pelo usuário
      }
      console.warn('Falha na IA, caindo para nativo', e);
    }

    // 2. Fallback para TTS Nativo
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(textoInteiro);
      u.lang = 'pt-BR';
      u.rate = 0.95;
      u.onend = () => setLeitura('parado');
      u.onerror = () => setLeitura('parado');
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      setLeitura('tocando');
    } else {
      setLeitura('parado');
    }
  };

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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-50 flex flex-col bg-bg shadow-glow"
            role="dialog"
            aria-label={`Versículo ${referencia.raw}`}
          >
            <header className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={fechar}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:bg-surface hover:text-ink"
                aria-label="Voltar"
              >
                ←
              </button>
              <div className="flex-1 text-center">
                <p className="text-sm font-medium text-ink">
                  {referencia.livroLabel} {referencia.capitulo}.{referencia.versiculos}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-gold">Bíblia Sagrada</p>
              </div>
              <button
                type="button"
                onClick={alternarLeitura}
                disabled={estado !== 'ok'}
                aria-pressed={leitura !== 'parado'}
                title={leitura !== 'parado' ? 'Parar narração' : 'Ouvir versículo'}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:opacity-50 relative ${
                  leitura !== 'parado'
                    ? 'border-gold bg-gold text-bg'
                    : 'border-line text-ink-muted hover:bg-surface hover:text-ink'
                }`}
              >
                {leitura === 'carregando_audio' && (
                   <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-bg animate-spin" />
                )}
                {leitura === 'tocando' ? '■' : '🔊'}
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 sm:px-8 sm:py-8 max-w-3xl mx-auto w-full">

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

            <p className="mt-8 border-t border-line pt-4 text-xs text-ink-muted text-center pb-8">
              {NOME_TRADUCAO} — tradução em domínio público.
            </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
