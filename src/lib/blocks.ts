import type { Licao, Passo, Versiculo, RevisaoItem } from './schema';

/**
 * Modelo de BLOCOS (Master Prompt §4): a lição vira uma sequência fluida de
 * cartões — nunca "slides". Ordem de leitura:
 * capa → textoAureo → verdadePratica → objetivos → leituraBiblica → introducao
 * → (capitulo → subtopico[]) × N → conclusao → revisao.
 *
 * GRANULARIDADE: a introdução e cada subtópico podem ser divididos em PASSOS
 * (um trecho de texto com as imagens do slide de origem). O formato compacto
 * da Lição 01 é normalizado aqui para "um passo só", de modo que o renderer
 * lide com uma única forma.
 */
export type Bloco =
  | { id: string; tipo: 'capa'; rotulo: string; titulo: string; tema: string; numero: number; referenciaBase: string; imagem?: string }
  | { id: string; tipo: 'textoAureo'; rotulo: string; texto: string; referencia: string }
  | { id: string; tipo: 'verdadePratica'; rotulo: string; texto: string }
  | { id: string; tipo: 'objetivos'; rotulo: string; itens: string[] }
  | { id: string; tipo: 'leitura'; rotulo: string; referencia: string; versiculos: Versiculo[] }
  | { id: string; tipo: 'introducao'; rotulo: string; passo: Passo; indicePasso: number; totalPassos: number }
  | { id: string; tipo: 'capitulo'; rotulo: string; numeroRomano: string; titulo: string }
  | {
      id: string;
      tipo: 'subtopico';
      rotulo: string;
      capituloRomano: string;
      codigo: string;
      titulo: string;
      passo: Passo;
      indicePasso: number;
      totalPassos: number;
    }
  | { id: string; tipo: 'conclusao'; rotulo: string; texto: string }
  | { id: string; tipo: 'revisao'; rotulo: string; itens: RevisaoItem[] };

export type BlocoTipo = Bloco['tipo'];

/** Normaliza o formato compacto (paragrafos+imagens) para a forma de passos. */
function comoPassos(
  passos: Passo[],
  compacto: { paragrafos: string[]; imagens: Passo['imagens']; versiculosDestaque: Passo['versiculosDestaque'] },
): Passo[] {
  if (passos.length > 0) return passos;
  if (compacto.paragrafos.length === 0) return [];
  return [
    {
      paragrafos: compacto.paragrafos,
      imagens: compacto.imagens,
      versiculosDestaque: compacto.versiculosDestaque,
    },
  ];
}

/** Id estável: com 1 passo mantém o id histórico (preserva anotações já salvas). */
function idDoPasso(base: string, i: number, total: number): string {
  return total > 1 ? `${base}-p${i + 1}` : base;
}

export function buildBlocos(licao: Licao): Bloco[] {
  const blocos: Bloco[] = [];

  blocos.push({
    id: 'capa',
    tipo: 'capa',
    rotulo: 'Início',
    titulo: licao.titulo,
    tema: licao.capa.tema,
    numero: licao.numero,
    referenciaBase: licao.referenciaBase,
    imagem: licao.capa.imagem,
  });
  blocos.push({
    id: 'texto-aureo',
    tipo: 'textoAureo',
    rotulo: 'Texto Áureo',
    texto: licao.textoAureo.texto,
    referencia: licao.textoAureo.referencia,
  });
  blocos.push({
    id: 'verdade-pratica',
    tipo: 'verdadePratica',
    rotulo: 'Verdade Prática',
    texto: licao.verdadePratica,
  });
  blocos.push({ id: 'objetivos', tipo: 'objetivos', rotulo: 'Objetivos', itens: licao.objetivos });
  blocos.push({
    id: 'leitura',
    tipo: 'leitura',
    rotulo: 'Leitura Bíblica',
    referencia: licao.leituraBiblica.referencia,
    versiculos: licao.leituraBiblica.versiculos,
  });

  // ---------------------------------------------------------- Introdução
  const passosIntro = comoPassos(licao.passosIntroducao, {
    paragrafos: licao.introducao,
    imagens: licao.imagensIntroducao,
    versiculosDestaque: [],
  });
  passosIntro.forEach((passo, i) => {
    blocos.push({
      id: idDoPasso('introducao', i, passosIntro.length),
      tipo: 'introducao',
      rotulo: passosIntro.length > 1 ? `Introdução ${i + 1}/${passosIntro.length}` : 'Introdução',
      passo,
      indicePasso: i,
      totalPassos: passosIntro.length,
    });
  });

  // ------------------------------------------------ Capítulos e subtópicos
  for (const cap of licao.capitulos) {
    blocos.push({
      id: `cap-${cap.numeroRomano}`,
      tipo: 'capitulo',
      rotulo: `Cap. ${cap.numeroRomano}`,
      numeroRomano: cap.numeroRomano,
      titulo: cap.titulo,
    });

    for (const sub of cap.subtopicos) {
      const passos = comoPassos(sub.passos, {
        paragrafos: sub.paragrafos,
        imagens: sub.imagens,
        versiculosDestaque: sub.versiculosDestaque,
      });
      passos.forEach((passo, i) => {
        blocos.push({
          id: idDoPasso(`sub-${sub.codigo}`, i, passos.length),
          tipo: 'subtopico',
          rotulo: passos.length > 1 ? `${sub.codigo} · ${i + 1}/${passos.length}` : sub.codigo,
          capituloRomano: cap.numeroRomano,
          codigo: sub.codigo,
          titulo: sub.titulo,
          passo,
          indicePasso: i,
          totalPassos: passos.length,
        });
      });
    }
  }

  blocos.push({ id: 'conclusao', tipo: 'conclusao', rotulo: 'Conclusão', texto: licao.conclusao });
  blocos.push({ id: 'revisao', tipo: 'revisao', rotulo: 'Revisão', itens: licao.revisao });

  return blocos;
}

/** Texto de um passo (parágrafos + versículos citados), para TTS e busca. */
function textoDoPasso(passo: Passo): string {
  const destaques = passo.versiculosDestaque
    .filter((v) => v.texto)
    .map((v) => `${v.texto} ${v.referencia}.`)
    .join(' ');
  return [passo.paragrafos.join(' '), destaques].filter(Boolean).join(' ');
}

/** Texto corrido de um bloco — usado pela leitura em voz alta (TTS) e pela busca. */
export function textoDoBloco(bloco: Bloco): string {
  switch (bloco.tipo) {
    case 'capa':
      return `Lição ${bloco.numero}. ${bloco.titulo}. ${bloco.tema}. ${bloco.referenciaBase}.`;
    case 'textoAureo':
      return `Texto Áureo: ${bloco.texto} ${bloco.referencia}.`;
    case 'verdadePratica':
      return `Verdade Prática: ${bloco.texto}`;
    case 'objetivos':
      return `Objetivos da lição: ${bloco.itens.join(' ')}`;
    case 'leitura':
      return `Leitura bíblica em classe: ${bloco.referencia}. ${bloco.versiculos
        .map((v) => `${v.numero}. ${v.texto}`)
        .join(' ')}`;
    case 'introducao':
      return `${bloco.indicePasso === 0 ? 'Introdução: ' : ''}${textoDoPasso(bloco.passo)}`;
    case 'capitulo':
      return `Capítulo ${bloco.numeroRomano}: ${bloco.titulo}`;
    case 'subtopico':
      // o título só é narrado no primeiro passo, para não repetir a cada cartão
      return `${bloco.indicePasso === 0 ? `Ponto ${bloco.codigo}: ${bloco.titulo} ` : ''}${textoDoPasso(bloco.passo)}`;
    case 'conclusao':
      return `Conclusão: ${bloco.texto}`;
    case 'revisao':
      return `Revisando o conteúdo: ${bloco.itens.map((q, i) => `Pergunta ${i + 1}: ${q.pergunta}`).join(' ')}`;
  }
}

/** Caminho público do asset de imagem (ex.: "licao-01/capa.webp" → "/licoes/licao-01/capa.webp"). */
export function assetUrl(rel: string | undefined): string | undefined {
  if (!rel) return undefined;
  return `/licoes/${rel}`;
}
