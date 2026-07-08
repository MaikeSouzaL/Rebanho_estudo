'use client';

import { useRef } from 'react';
import { clsx } from 'clsx';
import { segmentarReferencias } from '@/lib/refs';
import type { Anotacao, CorMarcaTexto } from '@/lib/store';
import { useReader } from './ReaderContext';

/**
 * Texto com MARCA-TEXTO + BALÕES do professor (renderização).
 * A captura de seleção é GLOBAL (ProfessorTools/ProfessorSelecao via
 * `selectionchange`) — funciona bem no celular, com os "pegadores" nativos.
 * Este componente marca o elemento com data-parakey para a toolbar achá-lo.
 */

export const CORES_MARCA: Record<CorMarcaTexto, { chip: string; mark: string; nome: string }> = {
  amarelo: { chip: 'bg-[#e8d06a]', mark: 'hl-amarelo', nome: 'Amarelo' },
  verde: { chip: 'bg-[#7fc79a]', mark: 'hl-verde', nome: 'Verde' },
  azul: { chip: 'bg-[#7fb5e8]', mark: 'hl-azul', nome: 'Azul' },
  rosa: { chip: 'bg-[#e89ab5]', mark: 'hl-rosa', nome: 'Rosa' },
};

interface Fragmento {
  inicio: number;
  fim: number;
  anotacao: Anotacao | null;
  fimDeAnotacao: Anotacao | null; // balão renderiza aqui
}

/** Divide [0,len) nos limites das anotações; a mais recente vence na sobreposição. */
function fragmentar(len: number, anotacoes: Anotacao[]): Fragmento[] {
  const pontos = new Set<number>([0, len]);
  for (const a of anotacoes) {
    pontos.add(Math.max(0, Math.min(len, a.inicio)));
    pontos.add(Math.max(0, Math.min(len, a.fim)));
  }
  const ordenados = [...pontos].sort((x, y) => x - y);
  const frags: Fragmento[] = [];
  for (let i = 0; i < ordenados.length - 1; i++) {
    const ini = ordenados[i];
    const fim = ordenados[i + 1];
    if (fim <= ini) continue;
    const cobre =
      anotacoes
        .filter((a) => a.inicio <= ini && a.fim >= fim)
        .sort((a, b) => b.criadaEm - a.criadaEm)[0] ?? null;
    const terminaAqui =
      anotacoes
        .filter((a) => a.fim === fim && a.nota.trim() !== '')
        .sort((a, b) => b.criadaEm - a.criadaEm)[0] ?? null;
    frags.push({ inicio: ini, fim, anotacao: cobre, fimDeAnotacao: terminaAqui });
  }
  return frags;
}

export function IconeBalao({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M10 2C5.6 2 2 5.1 2 9c0 2.2 1.2 4.2 3 5.5V18a.7.7 0 0 0 1.1.6l3-1.8c.3 0 .6.1.9.1 4.4 0 8-3.1 8-7S14.4 2 10 2Z" />
    </svg>
  );
}

export function HighlightableText({
  children: texto,
  paraKey,
  as = 'p',
  className,
}: {
  children: string;
  paraKey: string;
  as?: 'p' | 'blockquote';
  className?: string;
}) {
  const { modoProfessor, anotacoes, abrirEditor, abrirVersiculo, ferramentaAtiva, criarAnotacao, removerAnotacao } = useReader();
  const ref = useRef<HTMLParagraphElement | HTMLQuoteElement | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!modoProfessor) return;
    if (ferramentaAtiva === 'caneta' || ferramentaAtiva === 'borracha') return; // Caneta/Borracha actions handled by DrawingCanvas
    
    const target = e.target as HTMLElement;
    // Ignora o clique se for num link de versículo ou botão de balão existente
    if (target.closest('button')) return;

    const minhas = anotacoes.filter((a) => a.paraKey === paraKey);
    
    if (minhas.length > 0) {
      // Já está pintado. Clicar novamente abre o balão (editor) para escrever ou mudar de cor
      abrirEditor(minhas[0], texto);
    } else {
      // Não está pintado. Pinta com a ferramenta ativa (se houver alguma)
      if (ferramentaAtiva) {
        criarAnotacao(paraKey, 0, texto.length, ferramentaAtiva, '');
      }
    }
  };

  const minhas = anotacoes.filter((a) => a.paraKey === paraKey);
  const frags = fragmentar(texto.length, minhas);
  const Tag = as;

  return (
    <Tag
      ref={ref as React.RefObject<HTMLParagraphElement & HTMLQuoteElement>}
      data-parakey={paraKey}
      onClick={handleClick}
      className={clsx(
        'leading-relaxed transition-colors',
        modoProfessor && ferramentaAtiva !== 'caneta' && ferramentaAtiva !== 'borracha' && (ferramentaAtiva || minhas.length > 0) && 'cursor-pointer hover:opacity-80',
        className
      )}
    >
      {frags.map((f, i) => {
        const trecho = texto.slice(f.inicio, f.fim);
        const conteudo = segmentarReferencias(trecho).map((s, j) =>
          s.tipo === 'ref' ? (
            <button
              key={j}
              type="button"
              data-ref={s.ref.raw}
              onClick={() => abrirVersiculo(s.ref)}
              className="whitespace-nowrap font-medium text-gold underline decoration-gold/40 decoration-dotted underline-offset-4 transition-colors hover:text-gold-soft hover:decoration-solid"
              title={`Ler ${s.ref.raw}`}
            >
              {s.valor}
            </button>
          ) : (
            <span key={j}>{s.valor}</span>
          ),
        );
        return (
          <span key={i}>
            {f.anotacao ? (
              <mark className={clsx('rounded-[3px] px-0.5 text-inherit', CORES_MARCA[f.anotacao.cor].mark)}>
                {conteudo}
              </mark>
            ) : (
              conteudo
            )}
            {f.fimDeAnotacao && (
              <button
                type="button"
                onClick={() =>
                  abrirEditor(
                    f.fimDeAnotacao!,
                    texto.slice(f.fimDeAnotacao!.inicio, f.fimDeAnotacao!.fim),
                  )
                }
                className="mx-0.5 inline-flex h-5 w-5 translate-y-[3px] items-center justify-center rounded-full bg-gold/90 text-bg shadow-sm transition-transform hover:scale-110"
                aria-label={`Abrir anotação: ${f.fimDeAnotacao.nota.slice(0, 40)}`}
                title="Anotação do professor"
              >
                <IconeBalao className="h-3 w-3" />
              </button>
            )}
          </span>
        );
      })}
    </Tag>
  );
}
