"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  capture_method: "manual" | "card_scan";
};

export async function createLead(eventId: string, input: LeadInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("epack_leads").insert({
    event_id: eventId,
    first_name: input.first_name || null,
    last_name: input.last_name || null,
    email: input.email || null,
    phone: input.phone || null,
    company: input.company || null,
    note: input.note || null,
    capture_method: input.capture_method,
    consent: true,
  });

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
