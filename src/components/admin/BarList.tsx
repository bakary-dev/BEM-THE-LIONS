/** Barres horizontales mono-série : une seule teinte, valeurs en texte, info-bulle native au survol. */
export function BarList({ title, data, emptyLabel = "Aucune donnée" }: { title: string; data: { label: string; value: number }[]; emptyLabel?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <figure className="card p-5">
      <figcaption className="mb-4 text-sm font-bold uppercase tracking-wider text-mist-300">{title}</figcaption>
      {data.length === 0 ? (
        <p className="text-sm text-mist-500">{emptyLabel}</p>
      ) : (
        <ul className="space-y-3">
          {data.map((d) => (
            <li key={d.label} title={`${d.label} : ${d.value} (${Math.round((d.value / Math.max(1, total)) * 100)} %)`} className="group">
              <div className="mb-1 flex justify-between gap-2 text-sm">
                <span className="truncate text-mist-300">{d.label}</span>
                <span className="font-semibold tabular-nums text-white">{d.value}</span>
              </div>
              <div className="h-2.5 rounded bg-white/5">
                <div className="h-full rounded bg-gold transition-all group-hover:bg-gold-300" style={{ width: `${(d.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
