import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { licaoSchema, type Licao } from './schema';

/**
 * Carregador de conteúdo (Sistema B). Lê os `licao-NN.json` de /content/licoes,
 * valida contra o schema Zod e devolve Lições tipadas. Roda em build-time
 * (Server Components / generateStaticParams). JSON inválido lança e QUEBRA o build
 * — exatamente como o Master Prompt exige. Adicionar lição = novo JSON validado.
 */
const CONTENT_DIR = join(process.cwd(), 'content', 'licoes');

export function getLicaoIds(): string[] {
  return readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}

export function getLicao(id: string): Licao {
  const path = join(CONTENT_DIR, `${id}.json`);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    throw new Error(`Falha ao ler/parsear ${id}.json: ${(e as Error).message}`);
  }
  const result = licaoSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Lição inválida (${id}.json) — corrija o JSON:\n` +
        JSON.stringify(result.error.format(), null, 2),
    );
  }
  return result.data;
}

export function getAllLicoes(): Licao[] {
  return getLicaoIds()
    .map(getLicao)
    .sort((a, b) => a.numero - b.numero);
}
