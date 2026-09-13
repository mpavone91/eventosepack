import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CaptureForm from "@/components/CaptureForm";

export default async function CapturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("epack_events")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!event) notFound();

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold">{event.name}</h1>
          <p className="text-sm text-gray-500">
            Déjanos tus datos y te contactaremos
          </p>
        </div>
        <CaptureForm eventId={event.id} />
      </div>
    </main>
  );
}
