'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  type Perfil,
  type ProgressoLicao,
  lerPerfil,
  lerTodosProgressos,
  salvarPerfil,
} from '@/lib/store';

/** Resumo serializável passado pelo Server Component. */
export interface LicaoResumo {
  id: string;
  numero: number;
  titulo: string;
  totalBlocos: number;
}

/* ------------------------------------------------------------- Saudação */
export function Saudacao() {
  const [nome, setNome] = useState<string | null>(null);
  useEffect(() => {
    setNome(lerPerfil()?.nome ?? null);
  }, []);
  if (!nome) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-1 text-sm text-ink-muted"
    >
      Olá, <span className="font-semibold text-gold-soft">{nome}</span> 👋
    </motion.p>
  );
}

/* ------------------------------------------------- Painel de estatísticas */
export function PainelStats({ licoes }: { licoes: LicaoResumo[] }) {
  const [stats, setStats] = useState<{ xp: number; concluidas: number; acertoPct: number | null }>({
    xp: 0,
    concluidas: 0,
    acertoPct: null,
  });

  useEffect(() => {
    void lerTodosProgressos().then((todos) => {
      const xp = todos.reduce((n, t) => n + t.xp, 0);
      const concluidas = todos.filter((t) => t.licaoConcluida).length;
      const respostas = todos.flatMap((t) => Object.values(t.quiz));
      const acertoPct =
        respostas.length > 0
          ? Math.round((respostas.filter((r) => r.correta).length / respostas.length) * 100)
          : null;
      setStats({ xp, concluidas, acertoPct });
    });
  }, []);

  const itens = [
    { icone: '✦', valor: `${stats.xp}`, rotulo: 'XP total' },
    { icone: '📖', valor: `${stats.concluidas}/${licoes.length}`, rotulo: 'Lições concluídas' },
    { icone: '🎯', valor: stats.acertoPct === null ? '—' : `${stats.acertoPct}%`, rotulo: 'Acertos no quiz' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {itens.map((s, i) => (
        <motion.div
          key={s.rotulo}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.08 }}
          className="rounded-xl2 border border-line bg-surface/60 p-4 text-center backdrop-blur-md"
        >
          <p className="text-xl font-bold text-gold-soft sm:text-2xl">
            <span aria-hidden className="mr-1">{s.icone}</span>
            {s.valor}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-muted sm:text-xs">{s.rotulo}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------ Status + progresso nos cards */
export function StatusBadge({ licao }: { licao: LicaoResumo }) {
  const [p, setP] = useState<ProgressoLicao | null>(null);
  useEffect(() => {
    void lerTodosProgressos().then((todos) => {
      setP(todos.find((t) => t.licaoId === licao.id) ?? null);
    });
  }, [licao.id]);

  const pct = p ? Math.round((p.concluidos.length / licao.totalBlocos) * 100) : 0;
  const status = !p || p.concluidos.length === 0 ? 'novo' : p.licaoConcluida ? 'concluido' : 'andamento';

  return (
    <span
      className={
        'absolute left-3 top-3 flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm ' +
        (status === 'concluido'
          ? 'border-success/60 bg-bg/75 text-success'
          : status === 'andamento'
            ? 'border-gold/40 bg-bg/75 text-gold-soft'
            : 'border-line bg-bg/75 text-ink-muted')
      }
    >
      {status === 'concluido' && '✓ Concluído'}
      {status === 'andamento' && `${pct}% · Em andamento`}
      {status === 'novo' && 'Novo'}
    </span>
  );
}

export function XpDaLicao({ licaoId }: { licaoId: string }) {
  const [xp, setXp] = useState(0);
  useEffect(() => {
    void lerTodosProgressos().then((todos) => {
      setXp(todos.find((t) => t.licaoId === licaoId)?.xp ?? 0);
    });
  }, [licaoId]);
  if (xp === 0) return null;
  return <span className="font-semibold text-gold-soft">✦ {xp} XP</span>;
}

/* -------------------------------------------- Continuar de onde parou */
export function ContinuarBanner({ licoes }: { licoes: LicaoResumo[] }) {
  const [alvo, setAlvo] = useState<{ licao: LicaoResumo; pct: number } | null>(null);

  useEffect(() => {
    void lerTodosProgressos().then((todos) => {
      const emAndamento = todos
        .filter((t) => t.concluidos.length > 0 && !t.licaoConcluida)
        .sort((a, b) => b.atualizadoEm - a.atualizadoEm)[0];
      if (!emAndamento) return;
      const licao = licoes.find((l) => l.id === emAndamento.licaoId);
      if (!licao) return;
      setAlvo({ licao, pct: Math.round((emAndamento.concluidos.length / licao.totalBlocos) * 100) });
    });
  }, [licoes]);

  if (!alvo) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
      <Link
        href={`/licao/${alvo.licao.id}`}
        className="group flex items-center gap-4 rounded-xl2 border border-gold/30 bg-gradient-to-r from-surface to-surface-2 p-5 shadow-card transition-transform hover:-translate-y-0.5"
      >
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
          <svg viewBox="0 0 44 44" className="h-14 w-14 -rotate-90">
            <circle cx="22" cy="22" r="19" fill="none" stroke="var(--color-border)" strokeWidth="4" />
            <circle
              cx="22"
              cy="22"
              r="19"
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(alvo.pct / 100) * 119.4} 119.4`}
            />
          </svg>
          <span className="absolute text-xs font-bold text-gold-soft">{alvo.pct}%</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Continuar de onde parou</p>
          <p className="truncate font-serif text-lg font-bold text-ink">
            Lição {alvo.licao.numero.toString().padStart(2, '0')} · {alvo.licao.titulo}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform group-hover:scale-105">
          Continuar →
        </span>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------ Onboarding */
export function Onboarding() {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [maisCampos, setMaisCampos] = useState(false);
  const [opc, setOpc] = useState<Omit<Perfil, 'nome'>>({});

  useEffect(() => {
    if (!lerPerfil()) setAberto(true);
  }, []);

  const salvar = () => {
    const n = nome.trim();
    if (!n) return;
    salvarPerfil({ nome: n, ...opc });
    setAberto(false);
    // atualiza saudação/blocos que leram o perfil no mount
    window.dispatchEvent(new Event('ebd:perfil'));
    location.reload();
  };

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-bg/85 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="w-full max-w-md rounded-t-2xl border border-b-0 border-line bg-surface p-7 shadow-glow sm:rounded-xl2 sm:border-b"
            role="dialog"
            aria-label="Boas-vindas"
          >
            <p className="eyebrow mb-2">Bem-vindo à EBD em Foco</p>
            <h2 className="font-serif text-2xl font-bold text-ink">Como podemos te chamar?</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Só o nome é necessário. Tudo fica salvo apenas no seu aparelho.
            </p>

            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && salvar()}
              placeholder="Seu nome"
              autoFocus
              className="mt-5 w-full rounded-xl border border-line bg-bg-2/60 p-3.5 text-ink placeholder:text-ink-muted/60 focus:border-gold/50 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => setMaisCampos((m) => !m)}
              className="mt-3 text-sm text-gold hover:underline"
            >
              {maisCampos ? '− Menos campos' : '+ Idade, congregação, professor, turma (opcional)'}
            </button>

            <AnimatePresence>
              {maisCampos && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 grid grid-cols-2 gap-2.5">
                    {(
                      [
                        ['idade', 'Idade'],
                        ['congregacao', 'Congregação'],
                        ['professor', 'Professor'],
                        ['turma', 'Turma'],
                      ] as const
                    ).map(([campo, rotulo]) => (
                      <input
                        key={campo}
                        value={opc[campo] ?? ''}
                        onChange={(e) => setOpc((o) => ({ ...o, [campo]: e.target.value }))}
                        placeholder={rotulo}
                        className="rounded-xl border border-line bg-bg-2/60 p-3 text-sm text-ink placeholder:text-ink-muted/60 focus:border-gold/50 focus:outline-none"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={salvar}
              disabled={!nome.trim()}
              className="mt-5 w-full rounded-full bg-gold py-3 font-semibold text-bg transition-transform enabled:hover:brightness-105 enabled:active:scale-[0.99] disabled:opacity-40"
            >
              Começar a estudar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
