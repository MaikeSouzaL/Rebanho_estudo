import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

/**
 * Gera out/sw.js após o `next build`.
 *
 * PRECACHE EM DUAS CAMADAS (importante!):
 *  - ESSENCIAL (app shell: HTML, JS, CSS, fontes, manifest, ícones) vai em
 *    `addAll`, que é tudo-ou-nada: se falhar, a instalação falha e é certo
 *    tentar de novo depois.
 *  - PESADO (imagens das lições e os 66 livros da Bíblia, ~13 MB) vai em
 *    `Promise.allSettled`: um arquivo que falhe NÃO derruba a instalação
 *    inteira. Sem isso, um único 404/timeout deixaria o app sem offline.
 *
 * Runtime: cache-first para estáticos, network-first para navegações
 * (pega atualizações quando há internet, cai no cache quando não há).
 */
const OUT = join(process.cwd(), 'out');

function listar(dir) {
  const urls = [];
  for (const nome of readdirSync(dir)) {
    const abs = join(dir, nome);
    if (statSync(abs).isDirectory()) urls.push(...listar(abs));
    else urls.push('/' + relative(OUT, abs).replaceAll('\\', '/'));
  }
  return urls;
}

function bytes(url) {
  try {
    return statSync(join(OUT, url.replace(/^\//, ''))).size;
  } catch {
    return 0;
  }
}

const tudo = listar(OUT).filter(
  (u) =>
    !u.endsWith('.map') &&
    !u.endsWith('sw.js') &&
    !u.endsWith('.txt') && // payloads RSC não são necessários offline
    !u.includes('/_next/static/chunks/pages/'),
);

// rotas limpas: "/licao/licao-01/index.html" → também "/licao/licao-01/"
const rotas = tudo
  .filter((u) => u.endsWith('/index.html') || u === '/index.html')
  .map((u) => u.replace(/index\.html$/, ''));

const ehPesado = (u) =>
  u.startsWith('/licoes/') || u.startsWith('/biblia/') || u.startsWith('/home/');

const essencial = [...new Set([...tudo.filter((u) => !ehPesado(u)), ...rotas])];
const pesado = tudo.filter(ehPesado);

const versao = createHash('sha256')
  .update([...essencial, ...pesado].join('|'))
  .digest('hex')
  .slice(0, 10);

const sw = `/* gerado por scripts/gen-sw.mjs — não editar à mão */
const CACHE = 'ebd-foco-${versao}';
const ESSENCIAL = ${JSON.stringify(essencial)};
const PESADO = ${JSON.stringify(pesado)};

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      // app shell: obrigatório
      await c.addAll(ESSENCIAL);
      // conteúdo pesado: tolerante a falhas individuais
      await Promise.allSettled(PESADO.map((u) => c.add(u)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('/'))),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
          return res;
        }),
    ),
  );
});
`;

writeFileSync(join(OUT, 'sw.js'), sw, 'utf-8');

const mb = (arr) => (arr.reduce((n, u) => n + bytes(u), 0) / 1048576).toFixed(2);
console.log(
  `sw.js gerado (${versao}): shell ${essencial.length} arq / ${mb(essencial)} MB · ` +
    `conteúdo ${pesado.length} arq / ${mb(pesado)} MB`,
);
