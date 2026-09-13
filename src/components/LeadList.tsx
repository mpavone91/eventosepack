"use client";

import { useState, useTransition } from "react";
import { deleteLead } from "@/lib/actions";
import SwipeableRow from "@/components/SwipeableRow";
import EditLeadDialog from "@/components/EditLeadDialog";

export type Lead = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  note: string | null;
  capture_method: string;
  created_at: string;
  captured_by_name?: string | null;
};

const METHOD_LABEL: Record<string, string> = {
  manual: "Manual",
  card_scan: "Tarjeta",
  qr_self: "QR (auto)",
};

export default function LeadList({
  eventId,
  leads,
}: {
  eventId: string;
  leads: Lead[];
}) {
  const [, startTransition] = useTransition();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  if (!leads.length) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        Todavía no hay leads en este evento.
      </p>
    );
  }

  return (
    <>
      <p className="text-xs text-gray-400 mb-2 sm:hidden">
        Toca un lead para editarlo, o desliza a la izquierda para eliminarlo.
      </p>
      <ul className="space-y-2">
        {leads.map((lead) => {
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
                      {lead.note && (
                        <p className="text-sm text-gray-400 mt-1 italic truncate">
                          {lead.note}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
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
        onClose={() => setEditingLead(null)}
      />
    </>
  );
}
