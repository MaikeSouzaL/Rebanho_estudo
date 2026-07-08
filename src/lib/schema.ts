import { z } from 'zod';

/**
 * ============================================================================
 * SCHEMA DA LIÇÃO — a peça-chave do projeto (Master Prompt §3).
 *
 * O App NUNCA parseia PowerPoint em runtime. O Sistema A (extração) produz um
 * `licao-NN.json` que obedece a este schema; o App só consome JSON validado.
 * Todo JSON é validado contra este schema no build (Zod). Inválido = build falha.
 * ============================================================================
 */

/** Uma referência bíblica destacada. `texto` pode ser null e ser resolvido
 *  em runtime pela fonte bíblica empacotada (Bíblia de domínio público). */
export const versiculoDestaqueSchema = z.object({
  referencia: z.string().min(1),
  texto: z.string().nullable().default(null),
});

/** Um versículo da leitura bíblica em classe. */
export const versiculoSchema = z.object({
  numero: z.number().int().positive(),
  texto: z.string().min(1),
});

/** Imagem posicionada no fluxo do texto — fiel ao slide de origem do PPTX.
 *  `apos` = índice do parágrafo após o qual a imagem aparece (0-based). */
export const imagemPosicionadaSchema = z.object({
  src: z.string().min(1), // "licao-01/i1-antioquia.webp"
  apos: z.number().int().min(0),
  alt: z.string().optional(),
});

/** Um subtópico (I.1, I.2, …) dentro de um capítulo. */
export const subtopicoSchema = z.object({
  codigo: z.string().min(1), // "I.1"
  titulo: z.string().min(1),
  paragrafos: z.array(z.string().min(1)).min(1),
  versiculosDestaque: z.array(versiculoDestaqueSchema).default([]),
  /** Imagens do(s) slide(s) de origem, posicionadas junto aos parágrafos. */
  imagens: z.array(imagemPosicionadaSchema).default([]),
  /** OPCIONAL, autoria nova (não é extração). Vazio = não exibe no Modo Professor. */
  notasProfessor: z.array(z.string().min(1)).default([]),
});

/** Um capítulo (I, II, III). */
export const capituloSchema = z.object({
  numeroRomano: z.string().min(1), // "I"
  titulo: z.string().min(1),
  subtopicos: z.array(subtopicoSchema).min(1),
});

/** Uma pergunta de revisão. Se `alternativas` existir → quiz de múltipla escolha. */
export const revisaoItemSchema = z.object({
  pergunta: z.string().min(1),
  resposta: z.string().min(1),
  alternativas: z.array(z.string().min(1)).min(2).optional(),
});

/** Status inicial no JSON; o status real é derivado do progresso local (IndexedDB). */
export const statusSchema = z.enum(['novo', 'em-andamento', 'concluido']);

/** A lição completa. */
export const licaoSchema = z.object({
  id: z.string().min(1), // "licao-01"
  numero: z.number().int().positive(),
  titulo: z.string().min(1),
  subtitulo: z.string().nullable().default(null),
  referenciaBase: z.string().min(1), // "Atos 13.1-12"
  tempoEstimadoMin: z.number().int().positive(),
  status: statusSchema.default('novo'),

  capa: z.object({
    imagem: z.string().min(1).optional(),
    tema: z.string().min(1),
  }),

  textoAureo: z.object({
    texto: z.string().min(1),
    referencia: z.string().min(1),
  }),

  verdadePratica: z.string().min(1),

  objetivos: z.array(z.string().min(1)).min(1),

  leituraBiblica: z.object({
    referencia: z.string().min(1),
    versiculos: z.array(versiculoSchema).min(1),
  }),

  introducao: z.array(z.string().min(1)).min(1),

  /** Imagens dos slides da introdução, posicionadas por parágrafo. */
  imagensIntroducao: z.array(imagemPosicionadaSchema).default([]),

  capitulos: z.array(capituloSchema).min(1),

  conclusao: z.string().min(1),

  revisao: z.array(revisaoItemSchema).min(1),

  referenciasBiblicas: z.array(z.string().min(1)).default([]),
});

// ---- Tipos inferidos (fonte única de verdade para o App) --------------------
export type Licao = z.infer<typeof licaoSchema>;
export type Capitulo = z.infer<typeof capituloSchema>;
export type Subtopico = z.infer<typeof subtopicoSchema>;
export type Versiculo = z.infer<typeof versiculoSchema>;
export type ImagemPosicionada = z.infer<typeof imagemPosicionadaSchema>;
export type VersiculoDestaque = z.infer<typeof versiculoDestaqueSchema>;
export type RevisaoItem = z.infer<typeof revisaoItemSchema>;
export type LicaoStatus = z.infer<typeof statusSchema>;

/** Valida dados desconhecidos e retorna uma Lição tipada (lança em erro). */
export function parseLicao(data: unknown): Licao {
  return licaoSchema.parse(data);
}
