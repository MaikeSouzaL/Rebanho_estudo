import { getLicao, getLicaoIds } from '@/lib/content';
import { buildBlocos } from '@/lib/blocks';
import { LessonReader } from '@/components/reader/LessonReader';

/** Pré-gera uma página estática por lição (necessário para `output: export`). */
export function generateStaticParams() {
  return getLicaoIds().map((id) => ({ id }));
}

export default function LicaoPage({ params }: { params: { id: string } }) {
  // Valida + carrega no build. JSON inválido lança aqui e QUEBRA o build (§3).
  const licao = getLicao(params.id);
  const blocos = buildBlocos(licao);

  return (
    <LessonReader id={licao.id} numero={licao.numero} titulo={licao.titulo} blocos={blocos} />
  );
}
