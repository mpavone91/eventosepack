"use client";

import { useRef, useState } from "react";
import { createLead } from "@/lib/actions";
import LeadQualifier from "@/components/LeadQualifier";
import NoteField from "@/components/NoteField";
import { shrinkImage } from "@/lib/shrinkImage";
import type { Rating } from "@/lib/leadMeta";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  note: string;
};

const EMPTY: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company: "",
  note: "",
};

export default function AddLeadDialog({
  eventId,
  tagSuggestions = [],
}: {
  eventId: string;
  tagSuggestions?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"manual" | "scan">("manual");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [rating, setRating] = useState<Rating | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [captureMethod, setCaptureMethod] = useState<"manual" | "card_scan">(
    "manual",
  );
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setForm(EMPTY);
    setRating(null);
    setTags([]);
    setCaptureMethod("manual");
    setTab("manual");
    setScanError(null);
    setSaveError(null);
  }

  function closeDialog() {
    setOpen(false);
    reset();
  }

  async function handleFile(file: File) {
    setScanning(true);
    setScanError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const image = await shrinkImage(file);
      const body = new FormData();
      body.append("image", image, "tarjeta.jpg");
      const res = await fetch("/api/ocr", {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        setScanError(data.error ?? "No se pudo leer la tarjeta");
        return;
      }
      setForm((prev) => ({
        first_name: data.first_name ?? "",
        last_name: data.last_name ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        company: data.company ?? "",
        note: prev.note,
      }));
      setCaptureMethod("card_scan");
    } catch (error) {
      setScanError(
        error instanceof DOMException && error.name === "AbortError"
          ? "Está tardando demasiado (mala cobertura). Rellénalo a mano o prueba otra vez."
          : "Error de red al leer la tarjeta",
      );
    } finally {
      clearTimeout(timer);
      setScanning(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const result = await createLead(eventId, {
      ...form,
      rating,
      tags,
      capture_method: captureMethod,
    });
    setSaving(false);
    if (result?.error) {
      setSaveError(result.error);
      return;
    }
    closeDialog();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-brand-lime text-brand-ink py-3 font-semibold hover:bg-brand-lime-hover transition"
      >
        + Añadir lead
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[92dvh] overflow-y-auto overscroll-contain">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Nuevo lead</h2>
                <button
                  onClick={closeDialog}
                  className="text-gray-400 hover:text-brand-dark text-xl leading-none"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>

              <div className="flex rounded-lg bg-gray-100 p-1 text-sm font-medium">
                <button
                  className={`flex-1 rounded-md py-1.5 ${tab === "manual" ? "bg-white shadow" : "text-gray-500"}`}
                  onClick={() => setTab("manual")}
                >
                  Manual
                </button>
                <button
                  className={`flex-1 rounded-md py-1.5 ${tab === "scan" ? "bg-white shadow" : "text-gray-500"}`}
                  onClick={() => setTab("scan")}
                >
                  Escanear tarjeta
                </button>
              </div>

              {tab === "scan" && (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={scanning}
                    className="w-full rounded-lg border-2 border-dashed border-gray-300 py-6 text-sm text-gray-500 hover:border-brand-dark disabled:opacity-50"
                  >
                    {scanning
                      ? "Leyendo tarjeta..."
                      : "Toca para abrir la cámara o elegir una foto"}
                  </button>
                  {scanError && (
                    <p className="text-sm text-red-600">{scanError}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Revisa y corrige los campos si algo no se detectó bien.
                  </p>
                </div>
              )}

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
                <NoteField
                  value={form.note}
                  onChange={(v) => setForm({ ...form, note: v })}
                />
              </div>

              <LeadQualifier
                rating={rating}
                tags={tags}
                suggestions={tagSuggestions}
                onRatingChange={setRating}
                onTagsChange={setTags}
              />

              <p className="text-xs text-gray-400">
                Confirmo que esta persona ha entregado sus datos voluntariamente
                tras hablar en el stand.
              </p>

              {saveError && <p className="text-sm text-red-600">{saveError}</p>}

              <div className="sticky bottom-0 -mx-4 -mb-4 border-t border-gray-100 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-xl bg-brand-lime text-brand-ink py-3 font-semibold hover:bg-brand-lime-hover transition disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar lead"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
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
