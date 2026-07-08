'use client';

import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import type { Anotacao, CorMarcaTexto } from '@/lib/store';
import { CORES_MARCA, IconeBalao } from './HighlightableText';
import { useReader } from './ReaderContext';

/**
 * Ferramentas globais do Modo Professor:
 * - ProfessorSelecao: escuta `selectionchange` no documento (com debounce) e
 *   mostra UMA toolbar flutuante sobre a seleção. Funciona no celular: o
 *   usuário usa a seleção nativa (toque longo + pegadores) e a toolbar
 *   acompanha; os botões têm alvo de toque grande e não roubam a seleção.
 * - EditorBalao: bottom sheet único para escrever/editar o lembrete.
 */

/** Offset do (container,offset) da Selection relativo ao texto puro do elemento. */
function offsetNoElemento(root: HTMLElement, container: Node, offset: number): number {
  let total = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node === container) return total + offset;
    total += (node.textContent ?? '').length;
  }
  return total;
}

interface SelecaoAtiva {
  paraKey: string;
  texto: string; // texto puro do parágrafo
  inicio: number;
  fim: number;
  x: number;
  y: number; // topo da seleção (viewport)
  abaixo: boolean; // renderizar abaixo (seleção rente ao topo)
  mobile: boolean; // tela estreita → barra ancorada na base (sem clamp)
}

export function ProfessorSelecao() {
  const { modoProfessor, ferramentaAtiva, setFerramentaAtiva } = useReader();

  return (
    <AnimatePresence>
      {modoProfessor && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-x-0 bottom-[108px] z-50 flex justify-center px-3"
        >
          <div className="flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-2.5 shadow-glow">
            {(Object.keys(CORES_MARCA) as CorMarcaTexto[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFerramentaAtiva(ferramentaAtiva === c ? null : c)}
                className={clsx(
                  'h-8 w-8 rounded-full ring-1 ring-black/20 transition-transform active:scale-90 sm:h-7 sm:w-7',
                  CORES_MARCA[c].chip,
                  ferramentaAtiva === c ? 'scale-110 ring-2 ring-white shadow-lg' : ''
                )}
                aria-label={`Ferramenta: ${CORES_MARCA[c].nome}`}
              />
            ))}
            <span className="mx-0.5 h-6 w-px bg-line" aria-hidden />
            <button
              type="button"
              onClick={() => setFerramentaAtiva(ferramentaAtiva === 'balao' ? null : 'balao')}
              className={clsx(
                'flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-transform active:scale-95 sm:h-8',
                ferramentaAtiva === 'balao'
                  ? 'bg-gold text-bg shadow-lg'
                  : 'border border-line bg-bg-2/50 text-ink hover:bg-surface'
              )}
              aria-label="Ferramenta: Balão de anotação"
            >
              <IconeBalao className="h-4 w-4" /> Balão
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------------ */

export function EditorBalao({
  alvo,
  fechar,
}: {
  alvo: { anotacao: Anotacao; trecho: string } | null;
  fechar: () => void;
}) {
  const { anotacoes, atualizarAnotacao, removerAnotacao, modoProfessor } = useReader();
  const [rascunho, setRascunho] = useState('');

  // anotação "viva" (cor pode mudar enquanto o editor está aberto)
  const viva = alvo ? (anotacoes.find((a) => a.id === alvo.anotacao.id) ?? alvo.anotacao) : null;

  useEffect(() => {
    if (alvo) setRascunho(alvo.anotacao.nota);
  }, [alvo]);

  const salvar = () => {
    if (!viva) return;
    atualizarAnotacao(viva.id, { nota: rascunho });
    fechar();
  };

  return (
    <AnimatePresence>
      {alvo && viva && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={fechar}
          />
          {!modoProfessor ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 bottom-8 z-50 mx-auto max-w-sm rounded-2xl border border-gold/30 bg-surface p-6 shadow-glow sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2"
              role="dialog"
              aria-label="Lembrete do professor"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold">
                  <IconeBalao className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-lg font-bold text-ink">Lembrete</h3>
              </div>
              <p className="mb-4 line-clamp-3 rounded-lg bg-bg-2/60 p-3 text-sm italic text-ink-muted">
                “{alvo.trecho}”
              </p>
              <div className="mb-6 max-h-[40vh] overflow-y-auto whitespace-pre-wrap text-base text-ink">
                {viva.nota}
              </div>
              <button
                type="button"
                onClick={fechar}
                className="w-full rounded-full bg-surface-2 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2/80"
              >
                Fechar
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-2xl border border-b-0 border-line bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-glow"
              role="dialog"
              aria-label="Anotação do professor"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
              <div className="mb-3 flex items-center justify-between">
                <p className="eyebrow">Balão do professor</p>
                <div className="flex gap-2">
                  {(Object.keys(CORES_MARCA) as CorMarcaTexto[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => atualizarAnotacao(viva.id, { cor: c })}
                      className={clsx(
                        'h-6 w-6 rounded-full ring-1 ring-black/20 transition-transform hover:scale-110',
                        CORES_MARCA[c].chip,
                        viva.cor === c && 'ring-2 ring-gold',
                      )}
                      aria-label={`Cor ${CORES_MARCA[c].nome}`}
                    />
                  ))}
                </div>
              </div>
              <p className="mb-3 line-clamp-2 rounded-lg bg-bg-2/60 p-2.5 text-sm italic text-ink-muted">
                “{alvo.trecho}”
              </p>
              <textarea
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value)}
                placeholder="O que você quer lembrar de falar sobre este trecho?"
                rows={3}
                autoFocus
                className="w-full resize-none rounded-xl border border-line bg-bg-2/60 p-3 text-base text-ink placeholder:text-ink-muted/60 focus:border-gold/50 focus:outline-none"
              />
              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    removerAnotacao(viva.id);
                    fechar();
                  }}
                  className="rounded-full px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10"
                >
                  Excluir
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={fechar}
                    className="rounded-full border border-line px-4 py-2.5 text-sm text-ink hover:bg-surface-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={salvar}
                    className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-bg hover:brightness-105"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
