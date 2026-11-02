"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTeamMember, type TeamMemberState } from "@/lib/actions";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-dark";

export default function TeamMemberForm() {
  const [state, action, pending] = useActionState<TeamMemberState, FormData>(
    createTeamMember,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input name="name" required placeholder="Nombre" className={inputClass} />
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className={inputClass}
      />
      <input
        name="pin"
        required
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        placeholder="PIN (4 dígitos)"
        className={`${inputClass} tracking-widest`}
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-700">{state.success}</p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-lg bg-brand-lime text-brand-ink py-2.5 text-sm font-semibold hover:bg-brand-lime-hover transition disabled:opacity-50"
      >
        {pending ? "Creando..." : "Crear acceso"}
      </button>
    </form>
  );
}
