import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

/**
 * Gera out/sw.js após o `next build`:
 * - PRECACHE de tudo que o app precisa offline (páginas, chunks, imagens,
 *   Bíblia, manifest) — "todas as lições disponíveis offline" (§9).
 * - Runtime: cache-first para estáticos, network-first para navegações,
 *   com atualização automática quando houver internet (nova versão do SW).
 */
const OUT = join(process.cwd(), 'out');

function listar(dir) {
  const urls = [];
  for (const nome of readdirSync(dir)) {
    const abs = join(dir, nome);
    if (statSync(abs).isDirectory()) {
      urls.push(...listar(abs));
    } else {
      urls.push('/' + relative(OUT, abs).replaceAll('\\', '/'));
    }
  }
  return urls;
}

const tudo = listar(OUT).filter(
  (u) =>
    !u.endsWith('.map') &&
    !u.endsWith('sw.js') &&
    !u.endsWith('.txt') && // payloads RSC não são necessários offline
    !u.includes('/_next/static/chunks/pages/'), // legado pages-router não usado
);

// páginas HTML viram rotas limpas ("/licao/licao-01/index.html" → também "/licao/licao-01/")
const rotas = tudo
  .filter((u) => u.endsWith('/index.html') || u === '/index.html')
  .map((u) => u.replace(/index\.html$/, ''));

const precache = [...new Set([...tudo, ...rotas])];
const versao = createHash('sha256').update(precache.join('|')).digest('hex').slice(0, 10);

const sw = `/* gerado por scripts/gen-sw.mjs — não editar à mão */
const CACHE = 'ebd-foco-${versao}';
const PRECACHE = ${JSON.stringify(precache)};

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  if (req.mode === 'navigate') {
    // navegação: rede primeiro (pega atualizações), cache como fallback offline
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('/'))
        )
    );
    return;
  }

  // estáticos: cache primeiro (rápido/offline), rede como complemento
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
          return res;
        })
    )
  );
});
`;

writeFileSync(join(OUT, 'sw.js'), sw, 'utf-8');
const kb = Math.round(precache.length);
console.log(`sw.js gerado: cache ebd-foco-${versao}, ${kb} entradas no precache`);
