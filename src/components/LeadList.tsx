"use client";

import { useMemo, useState, useTransition } from "react";
import { deleteLead } from "@/lib/actions";
import SwipeableRow from "@/components/SwipeableRow";
import EditLeadDialog from "@/components/EditLeadDialog";
import { RATING_BY_VALUE, isRating } from "@/lib/leadMeta";

export type Lead = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  note: string | null;
  capture_method: string;
  rating?: string | null;
  tags?: string[] | null;
  created_at: string;
  captured_by_name?: string | null;
};

// Minúsculas y sin tildes: "jose" encuentra "José".
function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function searchText(lead: Lead) {
  return norm(
    [
      lead.first_name,
      lead.last_name,
      lead.email,
      lead.company,
      lead.phone,
      lead.phone?.replace(/\D/g, ""),
      lead.note,
      ...(lead.tags ?? []),
      lead.captured_by_name,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

const METHOD_LABEL: Record<string, string> = {
  manual: "Manual",
  card_scan: "Tarjeta",
  qr_self: "QR (auto)",
};

export default function LeadList({
  eventId,
  leads,
  tagSuggestions = [],
}: {
  eventId: string;
  leads: Lead[];
  tagSuggestions?: string[];
}) {
  const [, startTransition] = useTransition();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [query, setQuery] = useState("");

  const indexed = useMemo(
    () => leads.map((lead) => ({ lead, text: searchText(lead) })),
    [leads],
  );
  const words = norm(query).split(/\s+/).filter(Boolean);
  const visible = words.length
    ? indexed
        .filter(({ text }) => words.every((w) => text.includes(w)))
        .map(({ lead }) => lead)
    : leads;

  if (!leads.length) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        Todavía no hay leads en este evento.
      </p>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 bg-white/95 px-4 pb-2 pt-1 backdrop-blur">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar en ${leads.length} leads: nombre, email, empresa…`}
            enterKeyHint="search"
            autoComplete="off"
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-brand-dark"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Borrar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 text-lg leading-none text-gray-400"
            >
              ×
            </button>
          )}
        </div>
        {words.length > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            {visible.length === 1 ? "1 resultado" : `${visible.length} resultados`}
          </p>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-2 sm:hidden">
        Toca un lead para editarlo, o desliza a la izquierda para eliminarlo.
      </p>
      {words.length > 0 && visible.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-6">
          Ningún lead coincide con «{query.trim()}».
        </p>
      )}
      <ul className="space-y-2">
        {visible.map((lead) => {
          const name = [lead.first_name, lead.last_name]
            .filter(Boolean)
            .join(" ");
          return (
            <li key={lead.id}>
              <SwipeableRow
                onClick={() => setEditingLead(lead)}
                onDelete={() =>
                  startTransition(() => {
                    deleteLead(eventId, lead.id);
                  })
                }
              >
                <div className="border border-gray-200 rounded-xl px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {name || "(sin nombre)"}
                      </p>
                      {lead.company && (
                        <p className="text-sm text-gray-500 truncate">
                          {lead.company}
                        </p>
                      )}
                      {lead.email && (
                        <p className="text-sm text-gray-500 truncate">
                          {lead.email}
                        </p>
                      )}
                      {lead.phone && (
                        <p className="text-sm text-gray-500 truncate">
                          {lead.phone}
                        </p>
                      )}
                      {!!lead.tags?.length && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lead.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-medium rounded-full bg-brand-dark/10 text-brand-dark px-2 py-0.5"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {lead.note && (
                        <p className="text-sm text-gray-400 mt-1 italic truncate">
                          {lead.note}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {isRating(lead.rating) && (
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${RATING_BY_VALUE[lead.rating].className}`}
                        >
                          {RATING_BY_VALUE[lead.rating].label}
                        </span>
                      )}
                      <span className="text-[10px] uppercase tracking-wide text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                        {METHOD_LABEL[lead.capture_method] ??
                          lead.capture_method}
                      </span>
                      {lead.captured_by_name && (
                        <span className="text-[10px] text-gray-400">
                          {lead.captured_by_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </SwipeableRow>
            </li>
          );
        })}
      </ul>

      <EditLeadDialog
        eventId={eventId}
        lead={editingLead}
        tagSuggestions={tagSuggestions}
        onClose={() => setEditingLead(null)}
      />
    </>
  );
}
