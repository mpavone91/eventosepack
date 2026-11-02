"use client";

import { useState } from "react";
import { DEFAULT_TAGS, RATINGS, type Rating } from "@/lib/leadMeta";

export default function LeadQualifier({
  rating,
  tags,
  suggestions = [],
  onRatingChange,
  onTagsChange,
}: {
  rating: Rating | null;
  tags: string[];
  suggestions?: string[];
  onRatingChange: (r: Rating | null) => void;
  onTagsChange: (t: string[]) => void;
}) {
  const [newTag, setNewTag] = useState("");

  const options: string[] = [];
  for (const t of [...DEFAULT_TAGS, ...suggestions, ...tags]) {
    if (!options.some((o) => o.toLowerCase() === t.toLowerCase())) options.push(t);
  }

  const has = (t: string) => tags.some((x) => x.toLowerCase() === t.toLowerCase());

  function toggle(t: string) {
    onTagsChange(
      has(t) ? tags.filter((x) => x.toLowerCase() !== t.toLowerCase()) : [...tags, t],
    );
  }

  function addNew() {
    const t = newTag.trim();
    if (t && !has(t)) onTagsChange([...tags, t]);
    setNewTag("");
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Valoración</p>
        <div className="grid grid-cols-3 gap-2">
          {RATINGS.map((r) => {
            const active = rating === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => onRatingChange(active ? null : r.value)}
                className={`rounded-lg py-2 text-sm font-semibold border transition ${
                  active ? `${r.className} border-transparent` : "border-gray-300 text-gray-600"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Etiquetas</p>
        <div className="flex flex-wrap gap-2">
          {options.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                has(t)
                  ? "bg-brand-dark text-white border-transparent"
                  : "border-gray-300 text-gray-600"
              }`}
            >
              {has(t) ? "✓ " : ""}
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addNew();
              }
            }}
            maxLength={40}
            placeholder="Nueva etiqueta"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-dark"
          />
          <button
            type="button"
            onClick={addNew}
            className="rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-600"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
