/**
 * Referências bíblicas — detecção, normalização e canonicalização.
 * Usado para (1) tornar "At 13.2" clicável no texto e (2) resolver o versículo
 * na Bíblia de domínio público empacotada (offline).
 */

/**
 * Abreviações (e nomes) → chave canônica do livro. Cobre os 66 livros.
 *
 * As chaves aqui já vêm no formato produzido por `limparChaveLivro`:
 * minúsculas, sem espaços e sem pontos (acentos são preservados).
 *
 * CONFLITO Jo (João) × Jó (livro de Jó):
 *   - `jo`  → 'joao'  (uso esmagadoramente mais comum nas lições: "Jo 1.5", "Jo 3.16")
 *   - `jó`  → 'jo'    (com acento — é assim que a lição escreve o livro de Jó)
 *   - `job` → 'jo'    (alternativa sem acento, para quem digita "Job 1.1")
 * O arquivo do livro de Jó é `public/biblia/jo.json` e o de João é `joao.json`,
 * portanto não há colisão de nomes de arquivo.
 */
export const LIVROS: Record<string, string> = {
  // --- Antigo Testamento ---
  gn: 'genesis',
  gen: 'genesis',
  genesis: 'genesis',
  'gênesis': 'genesis',
  ex: 'exodo',
  exo: 'exodo',
  exodo: 'exodo',
  'êxodo': 'exodo',
  lv: 'levitico',
  lev: 'levitico',
  levitico: 'levitico',
  'levítico': 'levitico',
  nm: 'numeros',
  num: 'numeros',
  numeros: 'numeros',
  'números': 'numeros',
  dt: 'deuteronomio',
  deut: 'deuteronomio',
  deuteronomio: 'deuteronomio',
  'deuteronômio': 'deuteronomio',
  js: 'josue',
  jos: 'josue',
  josue: 'josue',
  'josué': 'josue',
  jz: 'juizes',
  juizes: 'juizes',
  'juízes': 'juizes',
  rt: 'rute',
  rute: 'rute',
  '1sm': '1samuel',
  '1sam': '1samuel',
  '1samuel': '1samuel',
  '2sm': '2samuel',
  '2sam': '2samuel',
  '2samuel': '2samuel',
  '1rs': '1reis',
  '1re': '1reis',
  '1reis': '1reis',
  '2rs': '2reis',
  '2re': '2reis',
  '2reis': '2reis',
  '1cr': '1cronicas',
  '1cro': '1cronicas',
  '1cronicas': '1cronicas',
  '1crônicas': '1cronicas',
  '2cr': '2cronicas',
  '2cro': '2cronicas',
  '2cronicas': '2cronicas',
  '2crônicas': '2cronicas',
  ed: 'esdras',
  esd: 'esdras',
  esdras: 'esdras',
  ne: 'neemias',
  nee: 'neemias',
  neemias: 'neemias',
  et: 'ester',
  est: 'ester',
  ester: 'ester',
  'jó': 'jo',
  job: 'jo',
  sl: 'salmos',
  sal: 'salmos',
  slm: 'salmos',
  ps: 'salmos',
  salmo: 'salmos',
  salmos: 'salmos',
  pv: 'proverbios',
  prov: 'proverbios',
  proverbios: 'proverbios',
  'provérbios': 'proverbios',
  ec: 'eclesiastes',
  ecl: 'eclesiastes',
  eclesiastes: 'eclesiastes',
  ct: 'cantares',
  cant: 'cantares',
  cantares: 'cantares',
  cantico: 'cantares',
  canticos: 'cantares',
  'cântico': 'cantares',
  'cânticos': 'cantares',
  is: 'isaias',
  isa: 'isaias',
  isaias: 'isaias',
  'isaías': 'isaias',
  jr: 'jeremias',
  jer: 'jeremias',
  jeremias: 'jeremias',
  lm: 'lamentacoes',
  lam: 'lamentacoes',
  lamentacoes: 'lamentacoes',
  'lamentações': 'lamentacoes',
  ez: 'ezequiel',
  eze: 'ezequiel',
  ezequiel: 'ezequiel',
  dn: 'daniel',
  dan: 'daniel',
  daniel: 'daniel',
  os: 'oseias',
  ose: 'oseias',
  oseias: 'oseias',
  'oséias': 'oseias',
  jl: 'joel',
  joel: 'joel',
  am: 'amos',
  amos: 'amos',
  'amós': 'amos',
  ob: 'obadias',
  obd: 'obadias',
  obadias: 'obadias',
  jn: 'jonas',
  jon: 'jonas',
  jonas: 'jonas',
  mq: 'miqueias',
  miq: 'miqueias',
  miqueias: 'miqueias',
  'miquéias': 'miqueias',
  na: 'naum',
  naum: 'naum',
  hc: 'habacuque',
  hab: 'habacuque',
  habacuque: 'habacuque',
  sf: 'sofonias',
  sof: 'sofonias',
  sofonias: 'sofonias',
  ag: 'ageu',
  ageu: 'ageu',
  zc: 'zacarias',
  zac: 'zacarias',
  zacarias: 'zacarias',
  ml: 'malaquias',
  mal: 'malaquias',
  malaquias: 'malaquias',

  // --- Novo Testamento ---
  mt: 'mateus',
  mat: 'mateus',
  mateus: 'mateus',
  mc: 'marcos',
  mr: 'marcos',
  mar: 'marcos',
  marcos: 'marcos',
  lc: 'lucas',
  luc: 'lucas',
  lucas: 'lucas',
  jo: 'joao',
  joao: 'joao',
  'joão': 'joao',
  at: 'atos',
  ats: 'atos',
  atos: 'atos',
  rm: 'romanos',
  rom: 'romanos',
  romanos: 'romanos',
  '1co': '1corintios',
  '1cor': '1corintios',
  '1corintios': '1corintios',
  '1coríntios': '1corintios',
  '2co': '2corintios',
  '2cor': '2corintios',
  '2corintios': '2corintios',
  '2coríntios': '2corintios',
  gl: 'galatas',
  gal: 'galatas',
  galatas: 'galatas',
  'gálatas': 'galatas',
  ef: 'efesios',
  efe: 'efesios',
  efesios: 'efesios',
  'efésios': 'efesios',
  fp: 'filipenses',
  fl: 'filipenses',
  flp: 'filipenses',
  filipenses: 'filipenses',
  cl: 'colossenses',
  col: 'colossenses',
  colossenses: 'colossenses',
  '1ts': '1tessalonicenses',
  '1tes': '1tessalonicenses',
  '1tess': '1tessalonicenses',
  '1tessalonicenses': '1tessalonicenses',
  '2ts': '2tessalonicenses',
  '2tes': '2tessalonicenses',
  '2tess': '2tessalonicenses',
  '2tessalonicenses': '2tessalonicenses',
  '1tm': '1timoteo',
  '1ti': '1timoteo',
  '1tim': '1timoteo',
  '1timoteo': '1timoteo',
  '1timóteo': '1timoteo',
  '2tm': '2timoteo',
  '2ti': '2timoteo',
  '2tim': '2timoteo',
  '2timoteo': '2timoteo',
  '2timóteo': '2timoteo',
  tt: 'tito',
  tit: 'tito',
  tito: 'tito',
  fm: 'filemom',
  flm: 'filemom',
  filemom: 'filemom',
  filemon: 'filemom',
  'filêmon': 'filemom',
  hb: 'hebreus',
  heb: 'hebreus',
  hebreus: 'hebreus',
  tg: 'tiago',
  tia: 'tiago',
  tiago: 'tiago',
  '1pe': '1pedro',
  '1pd': '1pedro',
  '1ped': '1pedro',
  '1pedro': '1pedro',
  '2pe': '2pedro',
  '2pd': '2pedro',
  '2ped': '2pedro',
  '2pedro': '2pedro',
  '1jo': '1joao',
  '1jn': '1joao',
  '1joao': '1joao',
  '1joão': '1joao',
  '2jo': '2joao',
  '2jn': '2joao',
  '2joao': '2joao',
  '2joão': '2joao',
  '3jo': '3joao',
  '3jn': '3joao',
  '3joao': '3joao',
  '3joão': '3joao',
  jd: 'judas',
  jud: 'judas',
  judas: 'judas',
  ap: 'apocalipse',
  apoc: 'apocalipse',
  apocalipse: 'apocalipse',
};

/** Nome de exibição por chave canônica (66 livros). */
export const NOME_LIVRO: Record<string, string> = {
  // Antigo Testamento
  genesis: 'Gênesis',
  exodo: 'Êxodo',
  levitico: 'Levítico',
  numeros: 'Números',
  deuteronomio: 'Deuteronômio',
  josue: 'Josué',
  juizes: 'Juízes',
  rute: 'Rute',
  '1samuel': '1 Samuel',
  '2samuel': '2 Samuel',
  '1reis': '1 Reis',
  '2reis': '2 Reis',
  '1cronicas': '1 Crônicas',
  '2cronicas': '2 Crônicas',
  esdras: 'Esdras',
  neemias: 'Neemias',
  ester: 'Ester',
  jo: 'Jó',
  salmos: 'Salmos',
  proverbios: 'Provérbios',
  eclesiastes: 'Eclesiastes',
  cantares: 'Cantares',
  isaias: 'Isaías',
  jeremias: 'Jeremias',
  lamentacoes: 'Lamentações',
  ezequiel: 'Ezequiel',
  daniel: 'Daniel',
  oseias: 'Oseias',
  joel: 'Joel',
  amos: 'Amós',
  obadias: 'Obadias',
  jonas: 'Jonas',
  miqueias: 'Miqueias',
  naum: 'Naum',
  habacuque: 'Habacuque',
  sofonias: 'Sofonias',
  ageu: 'Ageu',
  zacarias: 'Zacarias',
  malaquias: 'Malaquias',
  // Novo Testamento
  mateus: 'Mateus',
  marcos: 'Marcos',
  lucas: 'Lucas',
  joao: 'João',
  atos: 'Atos',
  romanos: 'Romanos',
  '1corintios': '1 Coríntios',
  '2corintios': '2 Coríntios',
  galatas: 'Gálatas',
  efesios: 'Efésios',
  filipenses: 'Filipenses',
  colossenses: 'Colossenses',
  '1tessalonicenses': '1 Tessalonicenses',
  '2tessalonicenses': '2 Tessalonicenses',
  '1timoteo': '1 Timóteo',
  '2timoteo': '2 Timóteo',
  tito: 'Tito',
  filemom: 'Filemom',
  hebreus: 'Hebreus',
  tiago: 'Tiago',
  '1pedro': '1 Pedro',
  '2pedro': '2 Pedro',
  '1joao': '1 João',
  '2joao': '2 João',
  '3joao': '3 João',
  judas: 'Judas',
  apocalipse: 'Apocalipse',
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
