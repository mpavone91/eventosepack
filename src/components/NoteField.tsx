"use client";

import { useLayoutEffect, useRef } from "react";

// Textarea que crece sola con el texto (mín. 3 líneas, máx. ~10 y luego scroll interno).
export default function NoteField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + 2, 240)}px`;
  }, [value]);

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        Nota
      </label>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Qué le interesa, próximos pasos…"
        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-brand-dark"
      />
    </div>
  );
}
