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
  const { modoProfessor, ferramentaAtiva, setFerramentaAtiva, limparDesenhos, desenhos } = useReader();

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
              onClick={() => setFerramentaAtiva(ferramentaAtiva === 'caneta' ? null : 'caneta')}
              className={clsx(
                'flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-transform active:scale-95 sm:h-8',
                ferramentaAtiva === 'caneta'
                  ? 'bg-gold text-bg shadow-lg'
                  : 'border border-line bg-bg-2/50 text-ink hover:bg-surface'
              )}
              aria-label="Ferramenta: Caneta (desenho livre)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31l123.31-123.3A16,16,0,0,0,227.31,73.37ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l12.69-12.69,44.69,44.69Z"></path>
              </svg>
              Caneta
            </button>

            <button
              type="button"
              onClick={() => setFerramentaAtiva(ferramentaAtiva === 'borracha' ? null : 'borracha')}
              className={clsx(
                'flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-transform active:scale-95 sm:h-8',
                ferramentaAtiva === 'borracha'
                  ? 'bg-ink text-bg shadow-lg'
                  : 'border border-line bg-bg-2/50 text-ink hover:bg-surface'
              )}
              aria-label="Ferramenta: Borracha (apagar desenhos)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M226.83,74.83l-45.66-45.66a16,16,0,0,0-22.63,0L22.63,165.05a16,16,0,0,0,0,22.62l45.66,45.66a16,16,0,0,0,22.63,0L180.59,143.66l46.24-46.24A16,16,0,0,0,226.83,74.83ZM79.6,222.05L33.94,176.39l67.88-67.88L147.48,154.17Zm135.91-135.91L169.27,132.38,123.61,86.72l45.66-45.66,46.24,46.24Z"></path>
              </svg>
              Borracha
            </button>

            <AnimatePresence>
              {ferramentaAtiva === 'caneta' && desenhos.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, width: 0, scale: 0.8 }}
                  animate={{ opacity: 1, width: 'auto', scale: 1 }}
                  exit={{ opacity: 0, width: 0, scale: 0.8 }}
                  type="button"
                  onClick={limparDesenhos}
                  className="flex h-9 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full bg-red-500/10 px-3.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/20 active:scale-95 sm:h-8"
                  aria-label="Limpar desenhos da tela"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
                  </svg>
                  Limpar Tela
                </motion.button>
              )}
            </AnimatePresence>
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
