'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import type { Bloco } from '@/lib/blocks';
import type { Passo } from '@/lib/schema';
import { assetUrl } from '@/lib/blocks';
import { alternativaCorreta, parseReferencia } from '@/lib/refs';
import { HighlightableText } from './HighlightableText';
import { useReader } from './ReaderContext';

/** Chip/rótulo de referência clicável — abre o versículo no bottom sheet. */
function RefButton({ referencia, chip = false }: { referencia: string; chip?: boolean }) {
  const { abrirVersiculo } = useReader();
  const ref = parseReferencia(referencia);
  const cls = chip
    ? 'mr-2 inline-block rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-sm font-medium text-gold-soft transition-colors hover:bg-gold hover:text-bg'
    : 'font-medium text-gold underline decoration-gold/40 decoration-dotted underline-offset-4 transition-colors hover:text-gold-soft hover:decoration-solid';
  if (!ref) return <span className={cls}>{referencia}</span>;
  return (
    <button type="button" onClick={() => abrirVersiculo(ref)} className={cls} title={`Ler ${referencia}`}>
      {referencia}
    </button>
  );
}

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/** Galeria de imagens do slide de origem, renderizada após o parágrafo `apos`.
 *  1 imagem = largura cheia; 2+ = grade lado a lado (como no PPTX). */
function GaleriaImagens({
  imagens,
  apos,
}: {
  imagens: { src: string; apos: number; alt?: string }[];
  apos: number;
}) {
  const doPonto = imagens.filter((im) => im.apos === apos);
  if (doPonto.length === 0) return null;
  return (
    <div
      className={clsx(
        'grid gap-3',
        doPonto.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1',
      )}
    >
      {doPonto.map((im) => (
        <div key={im.src} className="overflow-hidden rounded-xl border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetUrl(im.src)}
            alt={im.alt ?? ''}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            onError={(e) => ((e.currentTarget.parentElement!.style.display = 'none'))}
          />
        </div>
      ))}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow mb-3">{children}</p>;
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-xl2 border border-line bg-surface/80 p-6 shadow-card backdrop-blur-sm sm:p-8',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ Capa */
function CapaView({ bloco }: { bloco: Extract<Bloco, { tipo: 'capa' }> }) {
  const img = assetUrl(bloco.imagem);
  return (
    <div className="relative overflow-hidden rounded-xl2 border border-line shadow-card">
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => ((e.currentTarget.style.display = 'none'))}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20" />
      <div className="relative flex min-h-[62vh] flex-col justify-end gap-4 p-7 sm:p-10">
        <span
          className="pointer-events-none absolute right-4 top-2 font-serif text-[9rem] leading-none text-gold/15 sm:text-[13rem]"
          aria-hidden
        >
          {bloco.numero.toString().padStart(2, '0')}
        </span>
        <Eyebrow>Lição {bloco.numero.toString().padStart(2, '0')} · EBD em Foco</Eyebrow>
        <h1 className="font-serif text-4xl font-bold leading-tight text-ink drop-shadow-md sm:text-5xl">
          {bloco.titulo}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-gold-soft backdrop-blur-sm">
            {bloco.tema}
          </span>
          <span className="rounded-full border border-line bg-surface/70 px-3 py-1 text-ink-muted backdrop-blur-sm">
            {bloco.referenciaBase}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Texto Áureo */
function TextoAureoView({ bloco }: { bloco: Extract<Bloco, { tipo: 'textoAureo' }> }) {
  return (
    <Card className="relative">
      <span className="pointer-events-none absolute left-4 top-0 font-serif text-7xl text-gold/25" aria-hidden>
        &ldquo;
      </span>
      <Eyebrow>Texto Áureo</Eyebrow>
      <HighlightableText
        as="blockquote"
        paraKey="texto-aureo#0"
        className="font-serif text-2xl font-light text-ink sm:text-[1.7rem]"
      >
        {bloco.texto}
      </HighlightableText>
      <p className="mt-4">
        <RefButton referencia={bloco.referencia} />
      </p>
    </Card>
  );
}

/* -------------------------------------------------------- Verdade Prática */
function VerdadePraticaView({ bloco }: { bloco: Extract<Bloco, { tipo: 'verdadePratica' }> }) {
  return (
    <Card>
      <Eyebrow>Verdade Prática</Eyebrow>
      <HighlightableText paraKey="verdade-pratica#0" className="font-serif text-xl text-ink sm:text-2xl">
        {bloco.texto}
      </HighlightableText>
    </Card>
  );
}

/* --------------------------------------------------------------- Objetivos */
function ObjetivosView({ bloco }: { bloco: Extract<Bloco, { tipo: 'objetivos' }> }) {
  return (
    <Card>
      <Eyebrow>Objetivos da Lição</Eyebrow>
      <ul className="space-y-4">
        {bloco.itens.map((item, i) => (
          <li key={i} className="flex gap-4">
            <span className="mt-0.5 select-none font-serif text-lg font-bold text-gold">
              {ROMANOS[i]}
            </span>
            <HighlightableText paraKey={`objetivos#${i}`} className="text-ink">
              {item}
            </HighlightableText>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ----------------------------------------------------------- Leitura Bíblica */
function LeituraView({ bloco }: { bloco: Extract<Bloco, { tipo: 'leitura' }> }) {
  return (
    <Card>
      <Eyebrow>Leitura Bíblica em Classe</Eyebrow>
      <h2 className="mb-5 font-serif text-2xl font-bold text-ink">{bloco.referencia}</h2>
      <div className="space-y-3">
        {bloco.versiculos.map((v) => (
          <div key={v.numero} className="flex gap-2">
            <sup className="mt-2 shrink-0 text-xs font-bold text-gold">{v.numero}</sup>
            <HighlightableText paraKey={`leitura#${v.numero}`} className="verse text-ink">
              {v.texto}
            </HighlightableText>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* --------------------------------------------------------------- Introdução */
/** Trilha de progresso dentro de um subtópico/introdução dividido em passos. */
function PassosIndicador({ atual, total }: { atual: number; total: number }) {
  if (total <= 1) return null;
  return (
    <div
      className="mb-4 flex items-center gap-1.5"
      role="img"
      aria-label={`Passo ${atual + 1} de ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={clsx(
            'h-1.5 rounded-full transition-all duration-300',
            i === atual ? 'w-6 bg-gold' : i < atual ? 'w-1.5 bg-gold/50' : 'w-1.5 bg-line',
          )}
        />
      ))}
    </div>
  );
}

/** Conteúdo de UM passo: parágrafos com as imagens do slide intercaladas,
 *  seguidos dos versículos citados. `paraBase` é o id do bloco — assim as
 *  anotações do professor ficam ancoradas ao passo certo. */
function PassoConteudo({ passo, paraBase }: { passo: Passo; paraBase: string }) {
  return (
    <>
      <div className="space-y-4 text-ink">
        {passo.paragrafos.map((p, i) => (
          <div key={i} className="space-y-4">
            <HighlightableText paraKey={`${paraBase}#${i}`}>{p}</HighlightableText>
            <GaleriaImagens imagens={passo.imagens} apos={i} />
          </div>
        ))}
      </div>

      {passo.versiculosDestaque.length > 0 && (
        <div className="mt-6 space-y-3">
          {passo.versiculosDestaque.map((v, i) =>
            v.texto ? (
              <figure key={i} className="rounded-xl border-l-2 border-gold/60 bg-bg-2/60 p-4">
                <HighlightableText
                  as="blockquote"
                  paraKey={`${paraBase}#vd${i}`}
                  className="verse italic text-ink"
                >
                  {v.texto}
                </HighlightableText>
                <figcaption className="mt-2 text-sm font-medium text-gold">{v.referencia}</figcaption>
              </figure>
            ) : (
              <RefButton key={i} referencia={v.referencia} chip />
            ),
          )}
        </div>
      )}
    </>
  );
}

function IntroducaoView({ bloco }: { bloco: Extract<Bloco, { tipo: 'introducao' }> }) {
  return (
    <Card>
      <Eyebrow>Introdução</Eyebrow>
      <PassosIndicador atual={bloco.indicePasso} total={bloco.totalPassos} />
      <PassoConteudo passo={bloco.passo} paraBase={bloco.id} />
    </Card>
  );
}

/* ----------------------------------------------------- Capítulo (divisória) */
function CapituloView({ bloco }: { bloco: Extract<Bloco, { tipo: 'capitulo' }> }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl2 border border-line bg-gradient-to-b from-surface/70 to-bg-2 p-10 text-center shadow-card">
      <span className="font-serif text-7xl font-bold text-gold/80">{bloco.numeroRomano}</span>
      <div className="my-4 h-px w-16 bg-gold/40" />
      <h2 className="max-w-md font-serif text-2xl font-bold uppercase leading-snug tracking-wide text-ink">
        {bloco.titulo}
      </h2>
    </div>
  );
}

/* --------------------------------------------------------------- Subtópico */
function SubtopicoView({ bloco }: { bloco: Extract<Bloco, { tipo: 'subtopico' }> }) {
  return (
    <Card>
      <Eyebrow>
        Ponto {bloco.codigo}
        {bloco.totalPassos > 1 && (
          <span className="ml-2 font-normal normal-case tracking-normal text-ink-muted">
            passo {bloco.indicePasso + 1} de {bloco.totalPassos}
          </span>
        )}
      </Eyebrow>
      <h2 className="mb-4 font-serif text-2xl font-bold leading-snug text-ink">{bloco.titulo}</h2>
      <PassosIndicador atual={bloco.indicePasso} total={bloco.totalPassos} />
      <PassoConteudo passo={bloco.passo} paraBase={bloco.id} />
    </Card>
  );
}

/* --------------------------------------------------------------- Conclusão */
function ConclusaoView({ bloco }: { bloco: Extract<Bloco, { tipo: 'conclusao' }> }) {
  return (
    <Card>
      <Eyebrow>Conclusão</Eyebrow>
      <HighlightableText paraKey="conclusao#0" className="font-serif text-lg text-ink sm:text-xl">
        {bloco.texto}
      </HighlightableText>
    </Card>
  );
}

/* ----------------------------------------------------------------- Revisão */
function RevisaoView({ bloco }: { bloco: Extract<Bloco, { tipo: 'revisao' }> }) {
  const { respostasQuiz } = useReader();
  const respondidas = Object.keys(respostasQuiz).length;
  const acertos = Object.values(respostasQuiz).filter((r) => r.correta).length;
  const comAlternativas = bloco.itens.filter((q) => q.alternativas?.length).length;

  return (
    <Card>
      <Eyebrow>Revisando o Conteúdo</Eyebrow>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-ink-muted">Teste o que você aprendeu.</p>
        {respondidas > 0 && (
          <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-sm font-semibold text-gold-soft">
            {acertos}/{comAlternativas} acertos
          </span>
        )}
      </div>
      <ol className="space-y-4">
        {bloco.itens.map((item, i) => (
          <PerguntaRevisao
            key={i}
            indice={i}
            pergunta={item.pergunta}
            resposta={item.resposta}
            alternativas={item.alternativas}
          />
        ))}
      </ol>
    </Card>
  );
}

function PerguntaRevisao({
  indice,
  pergunta,
  resposta,
  alternativas,
}: {
  indice: number;
  pergunta: string;
  resposta: string;
  alternativas?: string[];
}) {
  const { respostasQuiz, responderQuiz } = useReader();
  const registrada = respostasQuiz[indice];
  const [revelado, setRevelado] = useState(false);

  const escolher = (alt: string) => {
    if (registrada) return; // 1ª tentativa é a que vale
    responderQuiz(indice, alt, alternativaCorreta(alt, resposta));
  };

  return (
    <li className="rounded-xl border border-line bg-bg-2/40 p-4">
      <p className="mb-3 font-medium text-ink">
        <span className="mr-2 text-gold">{indice + 1}.</span>
        {pergunta}
      </p>

      {alternativas && (
        <div className="mb-3 grid gap-2">
          {alternativas.map((alt) => {
            const escolhida = registrada?.escolha === alt;
            const correta = alternativaCorreta(alt, resposta);
            const mostrar = !!registrada || revelado;
            return (
              <button
                key={alt}
                type="button"
                onClick={() => escolher(alt)}
                disabled={!!registrada}
                className={clsx(
                  'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  mostrar && correta && 'border-success/60 bg-success/15 text-ink',
                  mostrar && escolhida && !correta && 'border-red-400/50 bg-red-500/10 text-ink',
                  !(mostrar && (correta || escolhida)) &&
                    'border-line bg-surface enabled:hover:bg-surface-2',
                  registrada && 'cursor-default',
                )}
              >
                {alt}
                {mostrar && correta && <span className="float-right text-success">✓</span>}
                {mostrar && escolhida && !correta && <span className="float-right text-red-300">✗</span>}
              </button>
            );
          })}
        </div>
      )}

      {registrada && alternativas && (
        <p className={clsx('mb-2 text-sm', registrada.correta ? 'text-success' : 'text-red-300')}>
          {registrada.correta ? '+15 XP — resposta certa!' : `A resposta certa é: ${resposta}`}
        </p>
      )}

      {!alternativas && (
        <>
          <button
            type="button"
            onClick={() => setRevelado((r) => !r)}
            className="text-sm font-medium text-gold hover:underline"
          >
            {revelado ? 'Ocultar resposta' : 'Revelar resposta'}
          </button>
          {revelado && <p className="mt-2 rounded-lg bg-surface p-3 text-sm text-ink">{resposta}</p>}
        </>
      )}
    </li>
  );
}

/* --------------------------------------------------------------- Dispatcher */
export function BlocoView({ bloco }: { bloco: Bloco }) {
  switch (bloco.tipo) {
    case 'capa':
      return <CapaView bloco={bloco} />;
    case 'textoAureo':
      return <TextoAureoView bloco={bloco} />;
    case 'verdadePratica':
      return <VerdadePraticaView bloco={bloco} />;
    case 'objetivos':
      return <ObjetivosView bloco={bloco} />;
    case 'leitura':
      return <LeituraView bloco={bloco} />;
    case 'introducao':
      return <IntroducaoView bloco={bloco} />;
    case 'capitulo':
      return <CapituloView bloco={bloco} />;
    case 'subtopico':
      return <SubtopicoView bloco={bloco} />;
    case 'conclusao':
      return <ConclusaoView bloco={bloco} />;
    case 'revisao':
      return <RevisaoView bloco={bloco} />;
  }
}
