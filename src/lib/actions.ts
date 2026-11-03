"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pinToPassword } from "@/lib/pin";
import { cleanTags, isRating, type Rating } from "@/lib/leadMeta";
import { findDuplicateLeads, type DuplicateMatch } from "@/lib/duplicates";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createEvent(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("El nombre del evento es obligatorio");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("epack_events")
    .insert({ name, user_id: user.id })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect(`/events/${data.id}`);
}

export type LeadInput = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  note?: string;
  rating?: Rating | null;
  tags?: string[];
  capture_method: "manual" | "card_scan";
  // true cuando la comercial ya vio el aviso de duplicado y decide guardar igualmente.
  force?: boolean;
};

export async function createLead(
  eventId: string,
  input: LeadInput,
): Promise<{ error?: string; success?: boolean; duplicates?: DuplicateMatch[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!input.force) {
    // Solo si tiene acceso al evento (RLS); si no, el insert fallará igualmente.
    const { data: event } = await supabase
      .from("epack_events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();
    if (event) {
      const duplicates = await findDuplicateLeads({ eventId, ...input });
      if (duplicates.length) return { duplicates };
    }
  }

  const { error } = await supabase.from("epack_leads").insert({
    event_id: eventId,
    first_name: input.first_name || null,
    last_name: input.last_name || null,
    email: input.email || null,
    phone: input.phone || null,
    company: input.company || null,
    note: input.note || null,
    rating: isRating(input.rating) ? input.rating : null,
    tags: cleanTags(input.tags),
    capture_method: input.capture_method,
    consent: true,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export type LeadEditInput = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  note?: string;
  rating?: Rating | null;
  tags?: string[];
};

export async function updateLead(
  eventId: string,
  leadId: string,
  input: LeadEditInput,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("epack_leads")
    .update({
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      email: input.email || null,
      phone: input.phone || null,
      company: input.company || null,
      note: input.note || null,
      rating: isRating(input.rating) ? input.rating : null,
      tags: cleanTags(input.tags),
    })
    .eq("id", leadId);

  if (error) return { error: error.message };

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function deleteLead(eventId: string, leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("epack_leads")
    .delete()
    .eq("id", leadId);

  if (error) return { error: error.message };

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export type PublicLeadInput = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  note?: string;
};

export async function createPublicLead(
  eventId: string,
  input: PublicLeadInput,
) {
  if (!input.first_name && !input.email && !input.phone) {
    return { error: "Rellena al menos nombre, email o teléfono" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("epack_leads").insert({
    event_id: eventId,
    first_name: input.first_name || null,
    last_name: input.last_name || null,
    email: input.email || null,
    phone: input.phone || null,
    company: input.company || null,
    note: input.note || null,
    capture_method: "qr_self",
    consent: true,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("epack_events")
    .delete()
    .eq("id", eventId);

  if (error) return { error: error.message };

  revalidatePath("/");
  redirect("/");
}

async function requireManager() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("epack_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "manager") {
    throw new Error("Solo un manager puede hacer esto");
  }
}

export type TeamMemberState = { error?: string; success?: string } | null;

export async function createTeamMember(
  _prev: TeamMemberState,
  formData: FormData,
): Promise<TeamMemberState> {
  await requireManager();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const pin = String(formData.get("pin") ?? "").trim();

  if (!name || !email || !/^\d{4}$/.test(pin)) {
    return { error: "Nombre, email y un PIN de 4 dígitos son obligatorios" };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: pinToPassword(pin),
    email_confirm: true,
  });

  if (error) {
    const msg = /already.*registered|already exists/i.test(error.message)
      ? "Ya existe una cuenta con ese email"
      : error.message;
    return { error: msg };
  }

  // El perfil lo crea la app (ya no hay trigger en auth.users: ese proyecto Supabase
  // lo comparte QuantiChef y el trigger daba perfil de equipo a cualquier registro).
  // upsert para que funcione igual con o sin el trigger antiguo.
  const { error: profileError } = await admin
    .from("epack_profiles")
    .upsert(
      { user_id: data.user.id, email, name, role: "rep" },
      { onConflict: "user_id" },
    );

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: profileError.message };
  }

  revalidatePath("/team");
  return { success: `${name} ya puede entrar con su email y PIN` };
}

export async function setEventMembers(eventId: string, userIds: string[]) {
  await requireManager();
  const supabase = await createClient();

  const { data: current, error: readError } = await supabase
    .from("epack_event_members")
    .select("user_id")
    .eq("event_id", eventId);
  if (readError) return { error: readError.message };

  const wanted = new Set(userIds);
  const existing = new Set((current ?? []).map((m) => m.user_id as string));
  const toAdd = [...wanted].filter((id) => !existing.has(id));
  const toRemove = [...existing].filter((id) => !wanted.has(id));

  if (toAdd.length) {
    const { error } = await supabase
      .from("epack_event_members")
      .insert(toAdd.map((user_id) => ({ event_id: eventId, user_id })));
    if (error) return { error: error.message };
  }
  if (toRemove.length) {
    const { error } = await supabase
      .from("epack_event_members")
      .delete()
      .eq("event_id", eventId)
      .in("user_id", toRemove);
    if (error) return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
