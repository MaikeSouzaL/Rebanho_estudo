import type { Licao, Subtopico, Versiculo, RevisaoItem, ImagemPosicionada } from './schema';

/**
 * Modelo de BLOCOS (Master Prompt §4): a lição vira uma sequência fluida de
 * cartões — nunca "slides". Ordem de leitura:
 * capa → textoAureo → verdadePratica → objetivos → leituraBiblica → introducao
 * → (capitulo → subtopico[]) × 3 → conclusao → revisao.
 */
export type Bloco =
  | { id: string; tipo: 'capa'; rotulo: string; titulo: string; tema: string; numero: number; referenciaBase: string; imagem?: string }
  | { id: string; tipo: 'textoAureo'; rotulo: string; texto: string; referencia: string }
  | { id: string; tipo: 'verdadePratica'; rotulo: string; texto: string }
  | { id: string; tipo: 'objetivos'; rotulo: string; itens: string[] }
  | { id: string; tipo: 'leitura'; rotulo: string; referencia: string; versiculos: Versiculo[] }
  | { id: string; tipo: 'introducao'; rotulo: string; paragrafos: string[]; imagens: ImagemPosicionada[] }
  | { id: string; tipo: 'capitulo'; rotulo: string; numeroRomano: string; titulo: string }
  | { id: string; tipo: 'subtopico'; rotulo: string; capituloRomano: string; sub: Subtopico }
  | { id: string; tipo: 'conclusao'; rotulo: string; texto: string }
  | { id: string; tipo: 'revisao'; rotulo: string; itens: RevisaoItem[] };

export type BlocoTipo = Bloco['tipo'];

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
  blocos.push({
    id: 'introducao',
    tipo: 'introducao',
    rotulo: 'Introdução',
    paragrafos: licao.introducao,
    imagens: licao.imagensIntroducao,
  });

  for (const cap of licao.capitulos) {
    blocos.push({
      id: `cap-${cap.numeroRomano}`,
      tipo: 'capitulo',
      rotulo: `Cap. ${cap.numeroRomano}`,
      numeroRomano: cap.numeroRomano,
      titulo: cap.titulo,
    });
    for (const sub of cap.subtopicos) {
      blocos.push({
        id: `sub-${sub.codigo}`,
        tipo: 'subtopico',
        rotulo: sub.codigo,
        capituloRomano: cap.numeroRomano,
        sub,
      });
    }
  }

  blocos.push({ id: 'conclusao', tipo: 'conclusao', rotulo: 'Conclusão', texto: licao.conclusao });
  blocos.push({ id: 'revisao', tipo: 'revisao', rotulo: 'Revisão', itens: licao.revisao });

  return blocos;
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
      return `Introdução: ${bloco.paragrafos.join(' ')}`;
    case 'capitulo':
      return `Capítulo ${bloco.numeroRomano}: ${bloco.titulo}`;
    case 'subtopico':
      return `Ponto ${bloco.sub.codigo}: ${bloco.sub.titulo} ${bloco.sub.paragrafos.join(' ')} ${bloco.sub.versiculosDestaque
        .filter((v) => v.texto)
        .map((v) => `${v.texto} ${v.referencia}.`)
        .join(' ')}`;
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
