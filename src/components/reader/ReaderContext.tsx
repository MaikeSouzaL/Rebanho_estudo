'use client';

import { createContext, useContext } from 'react';
import type { Anotacao, CorMarcaTexto, Desenho } from '@/lib/store';
import type { RefParsed } from '@/lib/refs';

/**
 * Contexto do leitor: Modo Professor, anotações e quiz/XP.
 * Evita prop-drilling do LessonReader até os parágrafos.
 */
export interface ReaderCtx {
  modoProfessor: boolean;
  anotacoes: Anotacao[];
  /** cria e RETORNA a anotação (para abrir o editor do balão em seguida) */
  criarAnotacao: (paraKey: string, inicio: number, fim: number, cor: CorMarcaTexto, nota: string) => Anotacao | null;
  atualizarAnotacao: (id: string, patch: Partial<Pick<Anotacao, 'cor' | 'nota'>>) => void;
  removerAnotacao: (id: string) => void;
  /** abre o editor de balão (bottom sheet global do reader) */
  abrirEditor: (anotacao: Anotacao, trecho: string) => void;
  /** abre o versículo num bottom sheet, sem sair da lição */
  abrirVersiculo: (ref: RefParsed) => void;
  /** Desenhos feitos com a caneta */
  desenhos: Desenho[];
  criarDesenho: (blocoId: string, path: string, cor: string) => Desenho;
  removerDesenho: (id: string) => void;
  limparDesenhos: () => void;
  /** registra resposta do quiz (1ª tentativa conta ponto) */
  responderQuiz: (indice: number, escolha: string, correta: boolean) => void;
  respostasQuiz: Record<number, { escolha: string; correta: boolean }>;
  /** ferramenta ativa no modo professor */
  ferramentaAtiva: CorMarcaTexto | 'caneta' | 'borracha' | null;
  setFerramentaAtiva: (ferramenta: CorMarcaTexto | 'caneta' | 'borracha' | null) => void;
}

export const ReaderContext = createContext<ReaderCtx>({
  modoProfessor: false,
  anotacoes: [],
  criarAnotacao: () => null,
  atualizarAnotacao: () => {},
  removerAnotacao: () => {},
  abrirEditor: () => {},
  abrirVersiculo: () => {},
  desenhos: [],
  criarDesenho: () => ({} as Desenho),
  removerDesenho: () => {},
  limparDesenhos: () => {},
  responderQuiz: () => {},
  respostasQuiz: {},
  ferramentaAtiva: null,
  setFerramentaAtiva: () => {},
});

export function useReader(): ReaderCtx {
  return useContext(ReaderContext);
}
