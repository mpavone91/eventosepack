import { RATINGS } from "@/lib/leadMeta";

type ReportLead = {
  rating?: string | null;
  tags?: string[] | null;
  captured_by_name?: string | null;
  capture_method: string;
};

export default function EventReport({
  eventId,
  leads,
}: {
  eventId: string;
  leads: ReportLead[];
}) {
  const total = leads.length;
  const unrated = leads.filter(
    (l) => !RATINGS.some((r) => r.value === l.rating),
  ).length;

  const byPerson = new Map<string, number>();
  const byTag = new Map<string, number>();
  for (const l of leads) {
    const who =
      l.capture_method === "qr_self"
        ? "QR autorregistro"
        : (l.captured_by_name ?? "Sin asignar");
    byPerson.set(who, (byPerson.get(who) ?? 0) + 1);
    for (const t of l.tags ?? []) byTag.set(t, (byTag.get(t) ?? 0) + 1);
  }
  const people = [...byPerson.entries()].sort((a, b) => b[1] - a[1]);
  const tags = [...byTag.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const segments = [
    ...RATINGS.map((r) => ({
      label: r.label,
      className: r.className,
      count: leads.filter((l) => l.rating === r.value).length,
    })),
    { label: "Sin valorar", className: "bg-gray-300 text-brand-ink", count: unrated },
  ];

  return (
    <section className="rounded-xl border border-gray-200 p-4 space-y-4">
      <h2 className="text-sm font-medium text-gray-500">Informe</h2>

      <div>
        <p className="text-xs text-gray-500 mb-1">Valoración de los {total} leads</p>
        {total > 0 && (
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
            {segments.map((s) =>
              s.count ? (
                <div
                  key={s.label}
                  className={s.className}
                  style={{ width: `${(s.count / total) * 100}%` }}
                />
              ) : null,
            )}
          </div>
        )}
        <div className="grid grid-cols-4 gap-2 mt-2">
          {segments.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-semibold">{s.count}</p>
              <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
                <span className={`inline-block h-2 w-2 rounded-full ${s.className}`} />
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {people.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Por quién se captaron</p>
          <ul className="space-y-1">
            {people.map(([who, n]) => (
              <li key={who} className="flex justify-between text-sm">
                <span>{who}</span>
                <span className="font-semibold">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <a
          href={`/events/${eventId}/export`}
          className="rounded-lg bg-brand-dark text-white py-2 text-center text-sm font-semibold"
        >
          Descargar Excel
        </a>
        <a
          href={`/events/${eventId}/export?format=csv`}
          className="rounded-lg border border-brand-dark text-brand-dark py-2 text-center text-sm font-semibold"
        >
          CSV Salesforce
        </a>
      </div>

      {tags.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Etiquetas más usadas</p>
          <div className="flex flex-wrap gap-1">
            {tags.map(([t, n]) => (
              <span
                key={t}
                className="text-xs rounded-full bg-brand-dark/10 text-brand-dark px-2 py-0.5"
              >
                {t} · {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
