# EBD em Foco — PWA de Estudo Bíblico Interativo

Aplicativo (PWA) que transforma a lição da Escola Bíblica Dominical em uma
experiência de estudo fluida: leitura por cartões, versículos clicáveis,
marca-texto do professor com balões de anotação, quiz com XP e funcionamento
**100% offline**.

> **Uso privado (turma/igreja).** O conteúdo das lições pertence à
> **EBD em Foco** (ebdemfoco.com). Este app não deve ser publicado ou
> monetizado sem autorização do detentor dos direitos.
> O texto bíblico das referências clicáveis é a **Bíblia Portuguesa Mundial**
> (ebible.org, id `porbrbsl`) — tradução em **domínio público**.

---

## Arquitetura: DOIS sistemas, não um

| | **Sistema A — Extração** | **Sistema B — O App** |
|---|---|---|
| Quando roda | Build-time, 1× por lição | Runtime, no navegador |
| O que faz | `.pptx` → **JSON limpo** + imagens WebP | Lê JSON validado e renderiza |
| Complexidade | Alta e "suja" | Baixa, previsível |

**O App nunca parseia PowerPoint.** Adicionar uma lição = produzir um
`licao-NN.json` válido + imagens, e pronto. O coração do projeto é o
**schema Zod** em `src/lib/schema.ts` — JSON inválido **quebra o build**.

## Rodando

```bash
npm install
npm run dev              # http://localhost:3000
npm run build            # export estático em /out + gera sw.js (PWA)
npm run validate:content # valida todos os content/licoes/*.json
```

Hospedagem: qualquer servidor estático (Vercel/Netlify/Cloudflare Pages).
Sem backend.

## Estrutura

```
content/licoes/licao-01.json   ← conteúdo validado (Sistema A → B)
public/licoes/licao-01/*.webp  ← imagens da lição (otimizadas)
public/biblia/*.json           ← Bíblia offline (domínio público)
public/home/hero.webp          ← imagem do hero da Home
public/icons/                  ← ícones do PWA (logo do material)
src/lib/schema.ts              ← ★ SCHEMA Zod (a peça-chave)
src/lib/content.ts             ← loader + validação no build
src/lib/blocks.ts              ← lição → sequência de blocos/cartões
src/lib/refs.ts                ← detecção de referências bíblicas
src/lib/biblia.ts              ← resolvedor offline de versículos
src/lib/store.ts               ← IndexedDB (progresso/XP/anotações) + perfil
src/components/reader/         ← reader, blocos, professor, versículos
src/components/home/           ← home, busca, stats, onboarding
scripts/gen-sw.mjs             ← gera o service worker com precache
```

## Como adicionar a próxima lição (Sistema A, manual na Fase 1)

1. **Extraia o texto do PPTX.** Um `.pptx` é um zip de XML; extraia os slides
   preservando **integralmente** títulos, parágrafos, versículos, objetivos,
   perguntas e a ordem pedagógica. Ignore slides vazios de exportação e o
   slide final de propaganda.
2. **Monte o `content/licoes/licao-NN.json`** seguindo o schema
   (`src/lib/schema.ts`). Use o `licao-01.json` como gabarito. Pontos-chave:
   - `capitulos[].subtopicos[].paragrafos` — o texto na ordem de leitura;
   - `versiculosDestaque` — citações bíblicas do slide (com `texto`) ou só a
     referência (`texto: null` → resolvida pela Bíblia offline);
   - `imagens: [{ src, apos, alt }]` — cada imagem entra **após o parágrafo
     `apos`**, fiel ao slide de origem; idem `imagensIntroducao`;
   - `revisao[].alternativas` (opcional) habilita múltipla escolha no quiz.
3. **Extraia e otimize as imagens** de conteúdo para
   `public/licoes/licao-NN/*.webp` (≤1280px, qualidade ~80). Descarte logos,
   setas, ícones decorativos e slides de anúncio.
4. **Valide:** `npm run validate:content` (ou apenas `npm run build` — a
   validação roda no build e falha se o JSON estiver errado).
5. Se a lição citar livros bíblicos ainda não empacotados, adicione-os a
   `src/lib/refs.ts` (mapa `LIVROS`/`NOME_LIVRO`) e gere o JSON do livro em
   `public/biblia/` a partir do VPL do ebible.org (id `porbrbsl`).

Zero mudança estrutural no app — o motor de importação automática (IA +
revisão humana) chega na Fase 3.

## Funcionalidades (Fase 1 + extras)

- **Modo Aluno:** navegação por cartões, "Entendi"/Voltar/Próximo, barra de
  progresso, retomada automática, onboarding só com nome (localStorage).
- **Versículos clicáveis:** tocar em "At 11.26" abre o texto num bottom sheet
  sem sair da lição — offline, via Bíblia empacotada.
- **Modo Professor:** marca-texto (4 cores) + balões de anotação ("o que
  falar sobre este trecho"), com seleção nativa também no celular; tudo
  persistido em IndexedDB.
- **Gamificação sóbria:** XP (+10 bloco, +15 acerto, +50 conclusão),
  celebração com medalha, painel de estatísticas na Home.
- **Quiz:** múltipla escolha com correção imediata (1ª tentativa vale) ou
  pergunta→revelar.
- **Busca offline** por palavra/versículo/personagem, com link direto para o
  bloco.
- **Leitura em voz alta** (Web Speech API — voz do próprio dispositivo).
- **PWA:** instalável, precache completo (lições, imagens, Bíblia), navegação
  network-first com fallback offline.

## Roadmap

- **Fase 2:** Modo Apresentação (Data Show): tela limpa, fonte enorme, alto
  contraste, navegação por teclado; revisão com respostas reveladas uma a uma.
- **Fase 3:** Motor de importação PPTX→JSON assistido por IA + revisão humana.
- **Fase 4 (opcional):** sync professor→alunos ao vivo via Supabase Realtime
  (exige internet; não contamina o núcleo offline).
