"use client";

import { useState, useTransition } from "react";
import { setEventMembers } from "@/lib/actions";

type Rep = { user_id: string; name: string | null; email: string | null };

export default function EventMembers({
  eventId,
  reps,
  assigned,
}: {
  eventId: string;
  reps: Rep[];
  assigned: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(assigned));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(userId: string) {
    const next = new Set(selected);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    const previous = selected;
    setSelected(next);
    setError(null);
    startTransition(async () => {
      const result = await setEventMembers(eventId, [...next]);
      if (result?.error) {
        setSelected(previous);
        setError(result.error);
      }
    });
  }

  return (
    <section className="rounded-xl border border-gray-200 p-4 space-y-3">
      <div>
        <h2 className="text-sm font-medium text-gray-500">
          Comerciales en este evento
        </h2>
        <p className="text-xs text-gray-400">
          Solo las marcadas verán este evento y sus leads.
        </p>
      </div>
      {reps.length ? (
        <div className="space-y-2">
          {reps.map((rep) => {
            const on = selected.has(rep.user_id);
            return (
              <button
                key={rep.user_id}
                type="button"
                onClick={() => toggle(rep.user_id)}
                disabled={pending}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left transition disabled:opacity-60 ${
                  on ? "border-brand-dark bg-brand-dark/5" : "border-gray-200"
                }`}
              >
                <span>
                  <span className="block text-sm font-medium">
                    {rep.name || rep.email}
                  </span>
                  <span className="block text-xs text-gray-500">{rep.email}</span>
                </span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md border text-sm font-bold ${
                    on
                      ? "bg-brand-lime border-brand-lime text-brand-ink"
                      : "border-gray-300 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Aún no hay comerciales. Dalos de alta en Equipo.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
