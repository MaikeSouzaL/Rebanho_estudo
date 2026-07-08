import { segmentarReferencias } from '@/lib/refs';
import { clsx } from 'clsx';

/**
 * Renderiza um parágrafo destacando referências bíblicas.
 * Por ora as referências são realçadas visualmente; no passo do "popover de
 * versículo" elas viram botões que abrem o texto sem sair da lição.
 */
export function RichText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const segmentos = segmentarReferencias(children);
  return (
    <p className={clsx('leading-relaxed', className)}>
      {segmentos.map((s, i) =>
        s.tipo === 'ref' ? (
          <span
            key={i}
            data-ref={s.ref.raw}
            className="whitespace-nowrap font-medium text-gold underline decoration-gold/40 decoration-dotted underline-offset-4"
          >
            {s.valor}
          </span>
        ) : (
          <span key={i}>{s.valor}</span>
        ),
      )}
    </p>
  );
}
