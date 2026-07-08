'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Busca local (Master Prompt §4): por palavra, versículo, tema, personagem,
 * pergunta… Indexa as lições no build (index vem serializado do servidor) e
 * roda 100% no cliente — funciona offline. Resultado leva direto ao bloco.
 */
export interface ItemBusca {
  licaoId: string;
  numero: number;
  titulo: string;
  blocoId: string;
  rotulo: string;
  texto: string;
}

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function BuscaBox({ indice }: { indice: ItemBusca[] }) {
  const [termo, setTermo] = useState('');

  const resultados = useMemo(() => {
    const t = normalizar(termo.trim());
    if (t.length < 2) return [];
    return indice
      .map((item) => {
        const alvo = normalizar(item.texto);
        const pos = alvo.indexOf(t);
        return pos >= 0 ? { item, pos } : null;
      })
      .filter((r): r is { item: ItemBusca; pos: number } => r !== null)
      .slice(0, 8)
      .map(({ item, pos }) => {
        const ini = Math.max(0, pos - 40);
        const trecho =
          (ini > 0 ? '…' : '') + item.texto.slice(ini, pos + termo.length + 60).trim() + '…';
        return { item, trecho };
      });
  }, [termo, indice]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-2.5 backdrop-blur-md transition-colors focus-within:border-gold/50">
        <span aria-hidden className="text-ink-muted">⌕</span>
        <input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar palavra, versículo, personagem…"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none"
          aria-label="Buscar nas lições"
        />
        {termo && (
          <button
            type="button"
            onClick={() => setTermo('')}
            className="text-ink-muted hover:text-ink"
            aria-label="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      <AnimatePresence>
        {resultados.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl2 border border-line bg-surface shadow-glow"
          >
            {resultados.map(({ item, trecho }, i) => (
              <li key={`${item.licaoId}-${item.blocoId}-${i}`} className="border-b border-line last:border-0">
                <Link
                  href={`/licao/${item.licaoId}/#b=${encodeURIComponent(item.blocoId)}`}
                  className="block px-4 py-3 transition-colors hover:bg-surface-2"
                  onClick={() => setTermo('')}
                >
                  <p className="text-xs font-semibold text-gold">
                    Lição {item.numero.toString().padStart(2, '0')} · {item.rotulo}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{trecho}</p>
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {termo.trim().length >= 2 && resultados.length === 0 && (
        <p className="absolute inset-x-0 top-full z-40 mt-2 rounded-xl2 border border-line bg-surface px-4 py-3 text-sm text-ink-muted shadow-glow">
          Nada encontrado para “{termo.trim()}”.
        </p>
      )}
    </div>
  );
}
