"use client";

import { useState } from "react";
import { updateLead } from "@/lib/actions";
import type { Lead } from "@/components/LeadList";

export default function EditLeadDialog({
  eventId,
  lead,
  onClose,
}: {
  eventId: string;
  lead: Lead | null;
  onClose: () => void;
}) {
  if (!lead) return null;

  return (
    <EditLeadForm
      key={lead.id}
      eventId={eventId}
      lead={lead}
      onClose={onClose}
    />
  );
}

function EditLeadForm({
  eventId,
  lead,
  onClose,
}: {
  eventId: string;
  lead: Lead;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    first_name: lead.first_name ?? "",
    last_name: lead.last_name ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    company: lead.company ?? "",
    note: lead.note ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateLead(eventId, lead.id, form);
    setSaving(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Editar lead</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-brand-dark text-xl leading-none"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Nombre"
                value={form.first_name}
                onChange={(v) => setForm({ ...form, first_name: v })}
              />
              <Field
                label="Apellido"
                value={form.last_name}
                onChange={(v) => setForm({ ...form, last_name: v })}
              />
            </div>
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
            <Field
              label="Teléfono"
              type="tel"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
            <Field
              label="Empresa"
              value={form.company}
              onChange={(v) => setForm({ ...form, company: v })}
            />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Nota
              </label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-dark"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-brand-lime text-brand-ink py-3 font-semibold hover:bg-brand-lime-hover transition disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-dark"
      />
    </div>
  );
}
