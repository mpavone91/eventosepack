import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type DuplicateMatch = {
  name: string;
  company: string | null;
  event_name: string | null;
  same_event: boolean;
  captured_by: string | null;
  created_at: string;
  reason: "email" | "teléfono" | "nombre y empresa";
};

function phoneKey(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : null;
}

function norm(s: string | null | undefined) {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

// Valor literal para un filtro .or() de PostgREST: escapa comodines de ILIKE y lo
// entrecomilla para que comas o paréntesis no rompan el filtro.
function literal(s: string) {
  const escaped = s.replace(/[\\%_]/g, (c) => `\\${c}`).replace(/"/g, '\\"');
  return `"${escaped}"`;
}

// Busca leads ya registrados (en cualquier evento, por cualquier comercial) con el
// mismo email, el mismo teléfono o el mismo nombre+empresa. Usa service_role porque
// cada comercial solo puede leer sus propios leads; devuelve un resumen mínimo.
export async function findDuplicateLeads(input: {
  eventId: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
}): Promise<DuplicateMatch[]> {
  const email = input.email?.trim();
  const phone = phoneKey(input.phone);
  const fullName = norm(`${input.first_name ?? ""} ${input.last_name ?? ""}`);
  const company = norm(input.company);
  const byName = fullName.includes(" ") && company.length > 1;

  const filters: string[] = [];
  if (email) filters.push(`email.ilike.${literal(email)}`);
  if (phone) filters.push(`phone.ilike.%${phone.slice(-4)}%`);
  if (byName && input.last_name?.trim()) {
    filters.push(`last_name.ilike.${literal(input.last_name.trim())}`);
  }
  if (!filters.length) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("epack_leads")
    .select(
      "first_name, last_name, email, phone, company, event_id, created_by, created_at, epack_events(name)",
    )
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data?.length) return [];

  const matches: (DuplicateMatch & { created_by_id: string | null })[] = [];
  for (const l of data) {
    let reason: DuplicateMatch["reason"] | null = null;
    if (email && l.email && l.email.trim().toLowerCase() === email.toLowerCase()) {
      reason = "email";
    } else if (phone && phoneKey(l.phone) === phone) {
      reason = "teléfono";
    } else if (
      byName &&
      norm(`${l.first_name ?? ""} ${l.last_name ?? ""}`) === fullName &&
      norm(l.company) === company
    ) {
      reason = "nombre y empresa";
    }
    if (!reason) continue;
    const ev = l.epack_events as { name?: string } | { name?: string }[] | null;
    matches.push({
      name: [l.first_name, l.last_name].filter(Boolean).join(" ") || "(sin nombre)",
      company: l.company,
      event_name: (Array.isArray(ev) ? ev[0]?.name : ev?.name) ?? null,
      same_event: l.event_id === input.eventId,
      captured_by: null,
      created_by_id: l.created_by,
      created_at: l.created_at,
      reason,
    });
  }
  if (!matches.length) return [];

  const ids = [...new Set(matches.map((m) => m.created_by_id).filter(Boolean))] as string[];
  if (ids.length) {
    const { data: profiles } = await admin
      .from("epack_profiles")
      .select("user_id, name")
      .in("user_id", ids);
    const nameById = new Map((profiles ?? []).map((p) => [p.user_id, p.name]));
    for (const m of matches) {
      m.captured_by = m.created_by_id ? (nameById.get(m.created_by_id) ?? null) : "QR autorregistro";
    }
  } else {
    for (const m of matches) m.captured_by = "QR autorregistro";
  }

  // Primero los del mismo evento; máximo 3 para no saturar el aviso.
  return matches
    .sort((a, b) => Number(b.same_event) - Number(a.same_event))
    .slice(0, 3)
    .map((m) => ({
      name: m.name,
      company: m.company,
      event_name: m.event_name,
      same_event: m.same_event,
      captured_by: m.captured_by,
      created_at: m.created_at,
      reason: m.reason,
    }));
}
