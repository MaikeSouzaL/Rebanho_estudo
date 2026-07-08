import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { licaoSchema } from '../src/lib/schema.ts';

/**
 * Validação standalone do conteúdo (Sistema A → Sistema B).
 * Uso: npm run validate:content
 * Sai com código 1 se qualquer licao-NN.json não bater com o schema.
 */
const dir = join(process.cwd(), 'content', 'licoes');
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));

let ok = true;
for (const f of files) {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(dir, f), 'utf-8'));
  } catch (e) {
    ok = false;
    console.error(`❌ ${f} — JSON malformado: ${(e as Error).message}`);
    continue;
  }
  const res = licaoSchema.safeParse(raw);
  if (!res.success) {
    ok = false;
    console.error(`❌ ${f} — inválido:`);
    console.error(JSON.stringify(res.error.format(), null, 2));
  } else {
    const l = res.data;
    const nSub = l.capitulos.reduce((n, c) => n + c.subtopicos.length, 0);
    console.log(
      `✅ ${f} — "${l.titulo}" | ${l.capitulos.length} cap., ${nSub} subtópicos, ` +
        `${l.leituraBiblica.versiculos.length} versículos, ${l.revisao.length} perguntas`,
    );
  }
}
console.log(files.length ? '' : 'Nenhum arquivo em content/licoes.');
process.exit(ok ? 0 : 1);
