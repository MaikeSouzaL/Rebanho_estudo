/**
 * Referências bíblicas — detecção, normalização e canonicalização.
 * Usado para (1) tornar "At 13.2" clicável no texto e (2) resolver o versículo
 * na Bíblia de domínio público empacotada (offline).
 */

/** Abreviações (e nomes) → chave canônica do livro. Expandir conforme novas lições. */
export const LIVROS: Record<string, string> = {
  at: 'atos',
  atos: 'atos',
  mt: 'mateus',
  mateus: 'mateus',
  rm: 'romanos',
  romanos: 'romanos',
  '1co': '1corintios',
  '1cor': '1corintios',
  jo: 'joao',
  joao: 'joao',
  lc: 'lucas',
  mc: 'marcos',
};

/** Nome de exibição por chave canônica. */
export const NOME_LIVRO: Record<string, string> = {
  atos: 'Atos',
  mateus: 'Mateus',
  romanos: 'Romanos',
  '1corintios': '1 Coríntios',
  joao: 'João',
  lucas: 'Lucas',
  marcos: 'Marcos',
};

/**
 * Detecta referências no formato "At 13.2", "1Co 12.28", "1 Co 12.28",
 * "Mt 28.19,20", "Atos 13.1-12". Captura livro, capítulo e a expressão de versículos.
 */
export const REGEX_REFERENCIA =
  /((?:[1-3]\s?)?[A-Za-zÀ-ÿ]{2,6})\s(\d+)[.:](\d+(?:\s?[-–—,]\s?\d+)*)/g;

export interface RefParsed {
  raw: string; // "1Co 12.28"
  livroKey: string | null; // "1corintios" (ou null se desconhecido)
  livroLabel: string; // "1 Coríntios" ou o texto original
  capitulo: number;
  versiculos: string; // "12" | "19,20" | "1-12"
}

function limparChaveLivro(bruto: string): string {
  return bruto.toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
}

export function parseReferencia(raw: string): RefParsed | null {
  const m = new RegExp(`^${REGEX_REFERENCIA.source}$`).exec(raw.trim());
  if (!m) return null;
  const chave = limparChaveLivro(m[1]);
  const livroKey = LIVROS[chave] ?? null;
  return {
    raw: raw.trim(),
    livroKey,
    livroLabel: livroKey ? NOME_LIVRO[livroKey] : m[1],
    capitulo: Number(m[2]),
    versiculos: m[3].replace(/\s/g, ''),
  };
}

export type Segmento =
  | { tipo: 'texto'; valor: string }
  | { tipo: 'ref'; valor: string; ref: RefParsed };

/** Divide um texto em segmentos, isolando as referências bíblicas para linkificação. */
export function segmentarReferencias(texto: string): Segmento[] {
  const segmentos: Segmento[] = [];
  const re = new RegExp(REGEX_REFERENCIA.source, 'g');
  let ultimo = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    if (m.index > ultimo) {
      segmentos.push({ tipo: 'texto', valor: texto.slice(ultimo, m.index) });
    }
    const ref = parseReferencia(m[0]);
    if (ref) {
      segmentos.push({ tipo: 'ref', valor: m[0], ref });
    } else {
      segmentos.push({ tipo: 'texto', valor: m[0] });
    }
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) {
    segmentos.push({ tipo: 'texto', valor: texto.slice(ultimo) });
  }
  return segmentos;
}

/** Normaliza uma resposta para comparação no quiz (sem acento/pontuação/caixa). */
export function normalizarResposta(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Uma alternativa está correta se, normalizada, é igual (ou contém) a resposta. */
export function alternativaCorreta(alternativa: string, resposta: string): boolean {
  const a = normalizarResposta(alternativa);
  const r = normalizarResposta(resposta);
  return a === r || r.includes(a) || a.includes(r);
}
