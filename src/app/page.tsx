import Link from 'next/link';
import { getAllLicoes } from '@/lib/content';
import { assetUrl, buildBlocos, textoDoBloco } from '@/lib/blocks';
import type { Licao } from '@/lib/schema';
import { BuscaBox, type ItemBusca } from '@/components/home/BuscaBox';
import {
  ContinuarBanner,
  Onboarding,
  PainelStats,
  Saudacao,
  StatusBadge,
  XpDaLicao,
  type LicaoResumo,
} from '@/components/home/HomeClient';

function LicaoCard({ licao, resumo }: { licao: Licao; resumo: LicaoResumo }) {
  const capa = assetUrl(licao.capa.imagem);
  const nSub = licao.capitulos.reduce((n, c) => n + c.subtopicos.length, 0);

  return (
    <Link
      href={`/licao/${licao.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl2 border border-line bg-surface/70 shadow-card transition-transform duration-300 hover:-translate-y-1 hover:shadow-glow"
    >
      {/* Capa com título sobre a imagem */}
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-surface-2 to-bg-2">
        {capa && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capa}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.06]"
          />
        )}
        {/* scrim para o título — agora com alpha REAL (tokens rgb + <alpha-value>) */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/35 to-bg/5" />
        <span
          className="pointer-events-none absolute right-3 top-1 font-serif text-7xl font-bold text-ink/10"
          aria-hidden
        >
          {licao.numero.toString().padStart(2, '0')}
        </span>
        <StatusBadge licao={resumo} />

        <div className="absolute inset-x-0 bottom-0 p-5 pb-3">
          <p className="eyebrow mb-1">Lição {licao.numero.toString().padStart(2, '0')}</p>
          <h3 className="font-serif text-[1.35rem] font-bold leading-snug text-ink drop-shadow">
            {licao.titulo}
          </h3>
        </div>
      </div>

      {/* Corpo */}
      <div className="flex flex-1 flex-col gap-3 p-5 pt-3">
        <p className="text-sm text-ink-muted">{licao.capa.tema}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
          <span className="rounded-full bg-bg-2/60 px-2 py-1">{licao.referenciaBase}</span>
          <span>· {licao.tempoEstimadoMin} min</span>
          <span>· {nSub} tópicos</span>
          <XpDaLicao licaoId={licao.id} />
        </div>

        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gold/15 px-3.5 py-2 text-xs font-semibold text-gold-soft transition-colors group-hover:bg-gold group-hover:text-bg">
          Estudar agora →
        </span>
      </div>
    </Link>
  );
}

export default function Home() {
  const licoes = getAllLicoes();
  const resumos: LicaoResumo[] = licoes.map((l) => ({
    id: l.id,
    numero: l.numero,
    titulo: l.titulo,
    totalBlocos: buildBlocos(l).length,
  }));

  // Índice de busca (build-time): um item por bloco, com texto corrido.
  const indiceBusca: ItemBusca[] = licoes.flatMap((l) =>
    buildBlocos(l).map((b) => ({
      licaoId: l.id,
      numero: l.numero,
      titulo: l.titulo,
      blocoId: b.id,
      rotulo: b.rotulo,
      texto: textoDoBloco(b),
    })),
  );

  return (
    <main className="min-h-screen">
      <Onboarding />

      {/* ============================== HERO ============================== */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-[center_30%]"
          style={{ backgroundImage: 'url(/home/hero.webp)' }}
          aria-hidden
        />
        {/* a foto já tem o topo escurecido embutido; overlays leves apenas p/ ancorar o texto */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg/35 via-bg/25 to-bg" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/55 via-bg/20 to-transparent" aria-hidden />

        <div className="hero-text relative mx-auto w-full max-w-5xl px-5 pb-8 pt-12 sm:px-8 sm:pb-10 sm:pt-16">
          <Saudacao />

          <div className="mb-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/igreja/logo.png"
              alt="Logo da Igreja Pentecostal O Rebanho de Jesus Cristo"
              className="h-12 w-12 rounded-full border border-gold/40 bg-[#050d17] object-contain sm:h-14 sm:w-14"
            />
            <p className="eyebrow !mb-0">Igreja Pentecostal · desde 1990</p>
          </div>

          <h1 className="font-serif text-4xl font-bold leading-tight text-ink drop-shadow-md sm:text-6xl">
            O Rebanho de <span className="text-gold">Jesus Cristo</span>
          </h1>
          <p className="mt-3 max-w-xl text-ink-muted sm:text-lg">
            Escola Bíblica Dominical — a lição da semana como um aplicativo: leitura fluida,
            narração, marca-texto do professor e quiz com XP. Tudo offline.
          </p>

          <div className="mt-6">
            <BuscaBox indice={indiceBusca} />
          </div>

          <div className="mt-6">
            <PainelStats licoes={resumos} />
          </div>
        </div>
      </header>

      {/* ============================ CONTEÚDO ============================ */}
      <div className="mx-auto w-full max-w-5xl px-5 pb-12 sm:px-8">
        <ContinuarBanner licoes={resumos} />

        <section>
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-bold text-ink">Lições do trimestre</h2>
            <span className="text-sm text-ink-muted">{licoes.length} disponível(is)</span>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {licoes.map((licao, i) => (
              <LicaoCard key={licao.id} licao={licao} resumo={resumos[i]} />
            ))}
          </div>
        </section>

        <footer className="mt-16 border-t border-line pt-6 text-xs text-ink-muted">
          Conteúdo da lição: <span className="text-ink">EBD em Foco</span> (ebdemfoco.com) · uso
          privado para estudo. Bíblia em domínio público.
        </footer>
      </div>
    </main>
  );
}
