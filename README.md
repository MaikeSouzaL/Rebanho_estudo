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
content/licoes/licao-NN.json   ← conteúdo validado (Sistema A → B)
public/licoes/licao-NN/*.webp  ← imagens da lição (otimizadas)
public/biblia/*.json           ← Bíblia offline completa: 66 livros
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
   (`src/lib/schema.ts`). Há **dois formatos** para o corpo dos subtópicos e da
   introdução — prefira o formato em passos:

   **(a) Em PASSOS — recomendado** (gabarito: `licao-02.json`). Cada slide de
   conteúdo vira um passo, ou seja, um cartão navegável próprio com o seu
   trecho de texto e as suas imagens. Dá ritmo de leitura e imagens sempre
   junto do texto a que pertencem:
   ```jsonc
   "passos": [
     {
       "paragrafos": ["1º parágrafo do slide", "2º parágrafo do slide"],
       "imagens": [{ "src": "licao-02/i12.webp", "apos": 0, "alt": "…" }],
       "versiculosDestaque": [{ "referencia": "Cl 4.10", "texto": "…" }]
     }
   ]
   ```
   A introdução usa o mesmo formato em `passosIntroducao`.

   **(b) Compacto** (gabarito: `licao-01.json`): o subtópico inteiro é um
   cartão só, com `paragrafos` + `imagens` + `versiculosDestaque` no próprio
   subtópico, e `introducao` + `imagensIntroducao` na lição.

   Regras comuns:
   - `imagens: [{ src, apos, alt }]` — a imagem entra **após o parágrafo de
     índice `apos`** (0-based) daquele passo, fiel ao slide de origem;
   - `versiculosDestaque` — citação bíblica do slide (com `texto`) ou só a
     referência (`texto: null` → resolvida pela Bíblia offline);
   - `revisao[].alternativas` (opcional) habilita múltipla escolha. **Uma das
     alternativas precisa bater com `resposta`** pela função
     `alternativaCorreta` (`src/lib/refs.ts`) — o jeito seguro é repetir o
     texto da `resposta` como uma das alternativas;
   - reaproveite o mesmo arquivo de imagem quando o PPTX repete a arte em
     vários slides (não duplique o `.webp`).
3. **Extraia e otimize as imagens** de conteúdo para
   `public/licoes/licao-NN/*.webp` (≤1280px, qualidade ~80). Descarte logos,
   setas, ícones decorativos e slides de anúncio.
4. **Valide:** `npm run validate:content` (ou apenas `npm run build` — a
   validação roda no build e falha se o JSON estiver errado).
5. A Bíblia offline já traz **os 66 livros** (`public/biblia/`), e
   `src/lib/refs.ts` mapeia as abreviações em português — normalmente não há
   nada a fazer aqui. Só mexa nesses arquivos se precisar de uma abreviação
   incomum. Atenção ao par `Jo` (João) × `Jó` (livro de Jó): o acento é o que
   os distingue.

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
- **PWA:** instalável e offline de verdade. O precache é feito em duas camadas
  (`scripts/gen-sw.mjs`): o *app shell* (~1,6 MB) vai em `addAll` — obrigatório;
  imagens e Bíblia (~13 MB) vão em `Promise.allSettled`, para que um único
  arquivo que falhe não derrube a instalação inteira. Navegação é network-first
  com fallback para o cache.

## Roadmap

- **Fase 2:** Modo Apresentação (Data Show): tela limpa, fonte enorme, alto
  contraste, navegação por teclado; revisão com respostas reveladas uma a uma.
- **Fase 3:** Motor de importação PPTX→JSON assistido por IA + revisão humana.
- **Fase 4 (opcional):** sync professor→alunos ao vivo via Supabase Realtime
  (exige internet; não contamina o núcleo offline).
