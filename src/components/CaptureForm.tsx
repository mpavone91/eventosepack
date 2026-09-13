"use client";

import { useState } from "react";
import Link from "next/link";
import { createPublicLead } from "@/lib/actions";

export default function CaptureForm({ eventId }: { eventId: string }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    note: "",
  });
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="text-center space-y-2 py-10">
        <p className="text-2xl">✓</p>
        <p className="font-medium">¡Gracias! Tus datos se han enviado.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setError("Debes aceptar el uso de tus datos para continuar");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await createPublicLead(eventId, form);
    setSaving(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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

      <label className="flex items-start gap-2 text-xs text-gray-500 pt-1">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Acepto que estos datos se usen para que la empresa organizadora del
          stand me contacte. Puedes consultar la{" "}
          <Link href="/privacy" className="underline">
            política de privacidad
          </Link>
          .
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-brand-lime text-brand-ink py-3 font-semibold hover:bg-brand-lime-hover transition disabled:opacity-50"
      >
        {saving ? "Enviando..." : "Enviar mis datos"}
      </button>
    </form>
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
