export type Rating = "hot" | "warm" | "cold";

// `salesforce` coincide con los valores estándar del campo Rating de Lead en Salesforce.
export const RATINGS: {
  value: Rating;
  label: string;
  salesforce: string;
  className: string;
}[] = [
  { value: "hot", label: "Caliente", salesforce: "Hot", className: "bg-red-500 text-white" },
  { value: "warm", label: "Templado", salesforce: "Warm", className: "bg-amber-400 text-brand-ink" },
  { value: "cold", label: "Frío", salesforce: "Cold", className: "bg-sky-500 text-white" },
];

export const RATING_BY_VALUE = Object.fromEntries(
  RATINGS.map((r) => [r.value, r]),
) as Record<Rating, (typeof RATINGS)[number]>;

export function isRating(v: unknown): v is Rating {
  return v === "hot" || v === "warm" || v === "cold";
}

export const DEFAULT_TAGS = [
  "Decision maker",
  "Muy interesado",
  "Cliente",
  "Distribuidor",
  "Proveedor",
];

export function cleanTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const tag = String(t).trim().slice(0, 40);
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      out.push(tag);
    }
  }
  return out.slice(0, 20);
}
