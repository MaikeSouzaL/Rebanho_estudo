'use client';

import type { RefParsed } from './refs';

/**
 * Bíblia offline — Bíblia Portuguesa Mundial (domínio público, ebible.org).
 * Os livros ficam em /public/biblia/{livro}.json no formato
 * { "13": { "1": "texto...", "2": "..." } } e são cacheados em memória
 * (e pelo service worker, quando o PWA estiver ativo).
 */

export const NOME_TRADUCAO = 'Bíblia Portuguesa Mundial';

type Livro = Record<string, Record<string, string>>;

const cache = new Map<string, Promise<Livro | null>>();

function carregarLivro(livroKey: string): Promise<Livro | null> {
  let p = cache.get(livroKey);
  if (!p) {
    p = fetch(`/biblia/${livroKey}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Livro>) : null))
      .catch(() => null);
    cache.set(livroKey, p);
  }
  return p;
}

/** Expande a expressão de versículos: "28" | "19,20" | "1-12" → [n...]. */
export function expandirVersiculos(expr: string): number[] {
  const out: number[] = [];
  for (const parte of expr.split(',')) {
    const m = parte.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      for (let n = a; n <= b && n - a < 60; n++) out.push(n);
    } else if (/^\d+$/.test(parte)) {
      out.push(Number(parte));
    }
  }
  return out;
}

export interface VersiculoResolvido {
  numero: number;
  texto: string;
}

/** Resolve uma referência ("At 13.2") nos versículos da Bíblia empacotada. */
export async function resolverReferencia(ref: RefParsed): Promise<VersiculoResolvido[] | null> {
  if (!ref.livroKey) return null;
  const livro = await carregarLivro(ref.livroKey);
  if (!livro) return null;
  const cap = livro[String(ref.capitulo)];
  if (!cap) return null;
  const nums = expandirVersiculos(ref.versiculos);
  const out: VersiculoResolvido[] = [];
  for (const n of nums) {
    const t = cap[String(n)];
    if (t) out.push({ numero: n, texto: t });
  }
  return out.length > 0 ? out : null;
}
