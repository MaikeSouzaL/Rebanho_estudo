'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { Bloco } from '@/lib/blocks';
import { textoDoBloco } from '@/lib/blocks';
import { BlocoView } from './BlockViews';
import { ReaderContext } from './ReaderContext';
import { EditorBalao, ProfessorSelecao } from './ProfessorTools';
import { DrawingCanvas } from './DrawingCanvas';
import { VersiculoSheet } from './VersiculoSheet';
import type { RefParsed } from '@/lib/refs';
import { gerarNarracao } from '@/lib/narrador';
import {
  type Anotacao,
  type CorMarcaTexto,
  type Desenho,
  type ProgressoLicao,
  XP_ACERTO_QUIZ,
  XP_BLOCO,
  XP_CONCLUSAO,
  excluirAnotacao,
  lerAnotacoes,
  lerDesenhos,
  excluirDesenho,
  salvarDesenho,
  lerModoProfessor,
  lerProgresso,
  novoId,
  progressoVazio,
  salvarAnotacao,
  salvarModoProfessor,
  salvarProgresso,
} from '@/lib/store';

export function LessonReader({
  id,
  numero,
  titulo,
  blocos,
}: {
  id: string;
  numero: number;
  titulo: string;
  blocos: Bloco[];
}) {
  const [indice, setIndice] = useState(0);
  const [direcao, setDirecao] = useState(1);
  const [pronto, setPronto] = useState(false);
  const [progresso, setProgresso] = useState<ProgressoLicao>(() => progressoVazio(id));
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [desenhos, setDesenhos] = useState<Desenho[]>([]);
  const [modoProfessor, setModoProfessor] = useState(false);
  const [ferramentaAtiva, setFerramentaAtiva] = useState<CorMarcaTexto | 'caneta' | null>(null);
  const [celebrar, setCelebrar] = useState(false);
  const [ganhoXp, setGanhoXp] = useState<number | null>(null);
  const [editorBalao, setEditorBalao] = useState<{ anotacao: Anotacao; trecho: string } | null>(null);
  const [versiculoAberto, setVersiculoAberto] = useState<RefParsed | null>(null);
  const [leitura, setLeitura] = useState<'parado' | 'gerando' | 'tocando'>('parado');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Fonte de verdade SÍNCRONA para mutações — evita closures com estado velho
   *  (ex.: "Entendi" seguido de navegação sobrescrevendo o XP recém-ganho). */
  const progressoRef = useRef(progresso);

  const total = blocos.length;
  const bloco = blocos[indice];
  const ehUltimo = indice === total - 1;
  const pct = Math.round(((indice + 1) / total) * 100);
  const concluidos = new Set(progresso.concluidos);

  // ---------------------------------------------------------- carregar
  useEffect(() => {
    let vivo = true;
    (async () => {
      const [p, a, d] = await Promise.all([lerProgresso(id), lerAnotacoes(id), lerDesenhos(id)]);
      if (!vivo) return;
      progressoRef.current = p;
      setProgresso(p);
      setAnotacoes(a);
      setDesenhos(d);
      setModoProfessor(lerModoProfessor());
      // deep-link da busca (#b=blocoId) tem prioridade; senão, continua de onde parou
      const alvoHash = decodeURIComponent(window.location.hash.replace(/^#b=/, ''));
      const idxHash = alvoHash ? blocos.findIndex((b) => b.id === alvoHash) : -1;
      setIndice(idxHash >= 0 ? idxHash : Math.min(p.ultimoIndice, total - 1));
      setPronto(true);
    })();
    return () => {
      vivo = false;
    };
  }, [id, total]);

  // ---------------------------------------------------------- persistir
  const persistir = useCallback((p: ProgressoLicao) => {
    progressoRef.current = p;
    setProgresso(p);
    void salvarProgresso(p);
  }, []);

  const registrarXp = useCallback((quanto: number) => {
    setGanhoXp(quanto);
    setTimeout(() => setGanhoXp(null), 1400);
  }, []);

  // ---------------------------------------------------------- navegação
  const irPara = useCallback(
    (novo: number, dir: number) => {
      const alvo = Math.max(0, Math.min(total - 1, novo));
      setDirecao(dir);
      setIndice(alvo);
      persistir({ ...progressoRef.current, ultimoIndice: alvo });
    },
    [total, persistir],
  );

  /** Trava anti-toque acidental: no Modo Professor, se há texto selecionado,
   *  o primeiro toque em navegação só LIMPA a seleção — não muda de bloco. */
  const travaSelecao = useCallback((): boolean => {
    if (!modoProfessor) return false;
    const s = window.getSelection();
    if (s && !s.isCollapsed) {
      s.removeAllRanges();
      return true;
    }
    return false;
  }, [modoProfessor]);

  const proximo = useCallback(() => {
    if (travaSelecao()) return;
    irPara(indice + 1, 1);
  }, [irPara, indice, travaSelecao]);
  const anterior = useCallback(() => {
    if (travaSelecao()) return;
    irPara(indice - 1, -1);
  }, [irPara, indice, travaSelecao]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [indice]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && (alvo.tagName === 'TEXTAREA' || alvo.tagName === 'INPUT')) return;
      if (e.key === 'ArrowRight') proximo();
      else if (e.key === 'ArrowLeft') anterior();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [proximo, anterior]);

  // ---------------------------------------------------------- "Entendi"
  const entendi = () => {
    if (travaSelecao()) return;
    const p = { ...progressoRef.current };
    let ganho = 0;
    if (!p.concluidos.includes(bloco.id)) {
      p.concluidos = [...p.concluidos, bloco.id];
      ganho += XP_BLOCO;
    }
    if (ehUltimo && !p.licaoConcluida && p.concluidos.length >= total) {
      p.licaoConcluida = true;
      ganho += XP_CONCLUSAO;
      setCelebrar(true);
    }
    if (ganho > 0) {
      p.xp += ganho;
      registrarXp(ganho);
    }
    persistir(p);
    if (!ehUltimo) irPara(indice + 1, 1);
    else if (p.licaoConcluida && !celebrar) setCelebrar(true);
  };

  // ---------------------------------------------------------- quiz
  const responderQuiz = useCallback(
    (i: number, escolha: string, correta: boolean) => {
      const atual = progressoRef.current;
      if (atual.quiz[i]) return; // 1ª tentativa vale
      const p = { ...atual, quiz: { ...atual.quiz, [i]: { escolha, correta } } };
      if (correta) {
        p.xp += XP_ACERTO_QUIZ;
        registrarXp(XP_ACERTO_QUIZ);
      }
      persistir(p);
    },
    [persistir, registrarXp],
  );

  // ---------------------------------------------------------- anotações
  const criarAnotacao = useCallback(
    (paraKey: string, inicio: number, fim: number, cor: CorMarcaTexto, nota: string): Anotacao => {
      const a: Anotacao = { id: novoId(), licaoId: id, paraKey, inicio, fim, cor, nota, criadaEm: Date.now() };
      setAnotacoes((prev) => [...prev, a]);
      void salvarAnotacao(a);
      return a;
    },
    [id],
  );

  const atualizarAnotacao = useCallback((aid: string, patch: Partial<Pick<Anotacao, 'cor' | 'nota'>>) => {
    setAnotacoes((prev) => {
      const prox = prev.map((a) => (a.id === aid ? { ...a, ...patch } : a));
      const alvo = prox.find((a) => a.id === aid);
      if (alvo) void salvarAnotacao(alvo);
      return prox;
    });
  }, []);

  const removerAnotacao = useCallback((aid: string) => {
    setAnotacoes((prev) => prev.filter((a) => a.id !== aid));
    void excluirAnotacao(aid);
  }, []);

  const criarDesenho = useCallback((blocoId: string, path: string, cor: string): Desenho => {
    const d: Desenho = { id: novoId(), licaoId: id, blocoId, path, cor, criadaEm: Date.now() };
    setDesenhos((prev) => [...prev, d]);
    void salvarDesenho(d);
    return d;
  }, [id]);

  const removerDesenho = useCallback((did: string) => {
    setDesenhos((prev) => prev.filter((d) => d.id !== did));
    void excluirDesenho(did);
  }, []);

  const limparDesenhos = useCallback(() => {
    const blocoAtualId = blocos[indice].id;
    setDesenhos((prev) => {
      const paraRemover = prev.filter(d => d.blocoId === blocoAtualId);
      paraRemover.forEach(d => void excluirDesenho(d.id));
      return prev.filter(d => d.blocoId !== blocoAtualId);
    });
  }, [indice, blocos]);

  const abrirEditor = useCallback((anotacao: Anotacao, trecho: string) => {
    setEditorBalao({ anotacao, trecho });
  }, []);

  const abrirVersiculo = useCallback((ref: RefParsed) => {
    setVersiculoAberto(ref);
  }, []);

  // --------------------------- narração (Gemini TTS + fallback do aparelho)
  const pararLeitura = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src.startsWith('blob:')) URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setLeitura('parado');
  }, []);

  const falarComDispositivo = useCallback(
    (texto: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setLeitura('parado');
        return;
      }
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = 'pt-BR';
      u.rate = 0.95;
      u.onend = () => setLeitura('parado');
      u.onerror = () => setLeitura('parado');
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      setLeitura('tocando');
    },
    [],
  );

  const alternarLeitura = useCallback(async () => {
    if (leitura !== 'parado') {
      pararLeitura();
      return;
    }
    const texto = textoDoBloco(bloco);
    setLeitura('gerando');
    const ac = new AbortController();
    abortRef.current = ac;
    // 1ª opção: voz profissional (Gemini TTS, com cache offline em IndexedDB)
    const wav = await gerarNarracao(texto, ac.signal);
    if (ac.signal.aborted) return;
    if (wav) {
      const audio = new Audio(URL.createObjectURL(wav));
      audioRef.current = audio;
      audio.onended = () => pararLeitura();
      audio.onerror = () => pararLeitura();
      try {
        await audio.play();
        setLeitura('tocando');
        return;
      } catch {
        /* autoplay bloqueado → cai para o dispositivo */
      }
    }
    // fallback: voz do próprio aparelho (offline)
    falarComDispositivo(texto);
  }, [leitura, bloco, pararLeitura, falarComDispositivo]);

  // trocar de bloco ou sair da página interrompe a leitura
  useEffect(() => {
    pararLeitura();
  }, [indice, pararLeitura]);
  useEffect(() => () => pararLeitura(), [pararLeitura]);

  const alternarProfessor = () => {
    const novo = !modoProfessor;
    setModoProfessor(novo);
    salvarModoProfessor(novo);
    if (!novo) setFerramentaAtiva(null);
  };

  const quizTotal = blocos.find((b) => b.tipo === 'revisao');
  const nAlternativas =
    quizTotal?.tipo === 'revisao' ? quizTotal.itens.filter((q) => q.alternativas?.length).length : 0;
  const acertos = Object.values(progresso.quiz).filter((r) => r.correta).length;

  return (
    <ReaderContext.Provider
      value={{
        modoProfessor,
        anotacoes,
        criarAnotacao,
        atualizarAnotacao,
        removerAnotacao,
        abrirEditor,
        abrirVersiculo,
        desenhos,
        criarDesenho,
        removerDesenho,
        limparDesenhos,
        responderQuiz,
        respostasQuiz: progresso.quiz,
        ferramentaAtiva,
        setFerramentaAtiva,
      }}
    >
      <div className="flex h-[100dvh] flex-col bg-gradient-to-b from-bg to-bg-2">
        {/* Barra superior */}
        <header className="z-20 flex items-center gap-3 border-b border-line px-4 py-3 backdrop-blur-sm sm:px-6">
          <Link
            href="/"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label="Voltar para o início"
          >
            ←
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">
              Lição {numero.toString().padStart(2, '0')} · {titulo}
            </p>
            <p className="text-xs text-ink-muted">
              {bloco.rotulo} · {indice + 1}/{total}
            </p>
          </div>

          {/* XP */}
          <div className="relative shrink-0">
            <motion.span
              key={progresso.xp}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-bold text-gold-soft"
            >
              ✦ {progresso.xp} XP
            </motion.span>
            <AnimatePresence>
              {ganhoXp && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: -16 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 text-xs font-bold text-gold"
                >
                  +{ganhoXp}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Ouvir o bloco — narração profissional (Gemini) com fallback local */}
          <button
            type="button"
            onClick={() => void alternarLeitura()}
            aria-pressed={leitura !== 'parado'}
            title={
              leitura === 'parado'
                ? 'Ouvir este bloco (narração)'
                : leitura === 'gerando'
                  ? 'Preparando narração…'
                  : 'Parar narração'
            }
            className={clsx(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm transition-colors',
              leitura !== 'parado'
                ? 'border-gold bg-gold text-bg'
                : 'border-line text-ink-muted hover:bg-surface hover:text-ink',
            )}
          >
            {leitura === 'gerando' ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-bg border-t-transparent" aria-hidden />
            ) : leitura === 'tocando' ? (
              '■'
            ) : (
              '🔊'
            )}
          </button>

          {/* Modo Professor */}
          <button
            type="button"
            onClick={alternarProfessor}
            aria-pressed={modoProfessor}
            title="Modo Professor: selecione um trecho para destacar e anotar"
            className={clsx(
              'shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
              modoProfessor
                ? 'border-gold bg-gold text-bg'
                : 'border-line text-ink-muted hover:bg-surface hover:text-ink',
            )}
          >
            ✎ Professor
          </button>
        </header>

        {/* Dica do Modo Professor */}
        <AnimatePresence>
          {modoProfessor && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-gold/20 bg-gold/10 px-4 py-0 text-center text-xs text-gold-soft sm:px-6 [&:not(:empty)]:py-1.5"
            >
              Selecione uma cor e toque em um parágrafo para pintá-lo. Toque novamente onde pintou para escrever um lembrete.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Barra de progresso */}
        <div className="h-1 w-full bg-surface/60">
          <motion.div
            className="h-full bg-gold"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </div>

        {/* Conteúdo */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 relative">
          <div className="mx-auto w-full max-w-2xl relative">
            <motion.div
              key={bloco.id + (pronto ? '-p' : '')}
              initial={{ opacity: 0, x: direcao * 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <BlocoView bloco={bloco} />
            </motion.div>
            {/* O DrawingCanvas precisa cobrir o tamanho exato do bloco para os desenhos casarem.
                Como ele usa absolute inset-0, ele vai cobrir a div max-w-2xl relativa. */}
            <DrawingCanvas blocoId={bloco.id} />
          </div>
        </div>

        {/* Navegação inferior */}
        <nav className="z-20 border-t border-line px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
            <button
              type="button"
              onClick={anterior}
              disabled={indice === 0}
              className="flex items-center gap-1 rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Voltar
            </button>

            <button
              type="button"
              onClick={entendi}
              className={clsx(
                'flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-transform active:scale-[0.98]',
                concluidos.has(bloco.id)
                  ? 'bg-success/90 text-bg'
                  : 'bg-gold text-bg hover:brightness-105',
              )}
            >
              {concluidos.has(bloco.id) ? '✓ Concluído' : ehUltimo ? 'Concluir lição' : 'Entendi'}
            </button>

            <button
              type="button"
              onClick={proximo}
              disabled={ehUltimo}
              className="flex items-center gap-1 rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próximo →
            </button>
          </div>
        </nav>

        {/* Ferramentas do Modo Professor (toolbar de seleção + editor de balão) */}
        <ProfessorSelecao />
        <EditorBalao alvo={editorBalao} fechar={() => setEditorBalao(null)} />

        {/* Versículo clicável — abre sem sair da lição */}
        <VersiculoSheet referencia={versiculoAberto} fechar={() => setVersiculoAberto(null)} />

        {/* Celebração de conclusão */}
        <AnimatePresence>
          {celebrar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-6 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.8, y: 24 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 240 }}
                className="w-full max-w-sm rounded-xl2 border border-gold/30 bg-surface p-8 text-center shadow-glow"
              >
                <motion.div
                  initial={{ rotate: -12, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 10, delay: 0.15 }}
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold bg-gold/15 text-4xl"
                >
                  🏅
                </motion.div>
                <p className="eyebrow mb-1">Lição concluída</p>
                <h2 className="font-serif text-2xl font-bold text-ink">Parabéns!</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Você completou <span className="text-ink">“{titulo}”</span>.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl border border-line bg-bg-2/60 p-3">
                    <p className="text-2xl font-bold text-gold">✦ {progresso.xp}</p>
                    <p className="text-xs text-ink-muted">XP ganho</p>
                  </div>
                  <div className="rounded-xl border border-line bg-bg-2/60 p-3">
                    <p className="text-2xl font-bold text-success">
                      {acertos}/{nAlternativas}
                    </p>
                    <p className="text-xs text-ink-muted">Quiz</p>
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCelebrar(false)}
                    className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm text-ink hover:bg-surface-2"
                  >
                    Rever lição
                  </button>
                  <Link
                    href="/"
                    className="flex-1 rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-bg hover:brightness-105"
                  >
                    Início
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ReaderContext.Provider>
  );
}
