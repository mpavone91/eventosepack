import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import AddLeadDialog from "@/components/AddLeadDialog";
import EventQr from "@/components/EventQr";
import LeadList from "@/components/LeadList";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("epack_events")
    .select("id, name, slug, created_at")
    .eq("id", id)
    .single();

  if (!event) notFound();

  const [{ data: leads }, { data: profiles }] = await Promise.all([
    supabase
      .from("epack_leads")
      .select(
        "id, first_name, last_name, email, phone, company, note, capture_method, created_at, created_by",
      )
      .eq("event_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("epack_profiles").select("user_id, name"),
  ]);

  const nameByUserId = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.name]),
  );
  const leadsWithCapturer = (leads ?? []).map((lead) => ({
    ...lead,
    captured_by_name: lead.created_by
      ? (nameByUserId.get(lead.created_by) ?? null)
      : null,
  }));

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const captureUrl = `${protocol}://${host}/capture/${event.slug}`;

  return (
    <main className="flex-1 mx-auto w-full max-w-lg px-4 py-6 space-y-6">
      <header className="space-y-1">
        <Link href="/" className="text-sm text-gray-500">
          ← Volver
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{event.name}</h1>
          <span className="text-lg font-semibold rounded-full bg-black text-white px-3 py-1">
            {leads?.length ?? 0}
          </span>
        </div>
        <p className="text-xs text-gray-500">leads capturados</p>
      </header>

      <div className="grid grid-cols-1 gap-3">
        <AddLeadDialog eventId={event.id} />
        <EventQr url={captureUrl} />
      </div>

      <section>
        <h2 className="text-sm font-medium text-gray-500 mb-2">Leads</h2>
        <LeadList eventId={event.id} leads={leadsWithCapturer} />
      </section>
    </main>
  );
}
