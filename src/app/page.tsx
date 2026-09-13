import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createEvent, signOut } from "@/lib/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: events }, { data: profiles }, { data: myProfile }] =
    await Promise.all([
      supabase
        .from("epack_events")
        .select("id, name, created_at, user_id, epack_leads(count)")
        .order("created_at", { ascending: false }),
      supabase.from("epack_profiles").select("user_id, name"),
      supabase
        .from("epack_profiles")
        .select("role")
        .eq("user_id", user?.id ?? "")
        .single(),
    ]);

  const isManager = myProfile?.role === "manager";
  const nameByUserId = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.name]),
  );

  return (
    <main className="flex-1 mx-auto w-full max-w-lg px-4 py-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">EventoSePack</h1>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {isManager && (
            <Link
              href="/team"
              className="text-sm text-gray-500 hover:text-black"
            >
              Equipo
            </Link>
          )}
          <form action={signOut}>
            <button className="text-sm text-gray-500 hover:text-black">
              Salir
            </button>
          </form>
        </div>
      </header>

      <section>
        <h2 className="text-sm font-medium text-gray-500 mb-2">Eventos</h2>
        <div className="space-y-2">
          {events?.length ? (
            events.map((event) => {
              const count = Array.isArray(event.epack_leads)
                ? (event.epack_leads[0]?.count ?? 0)
                : 0;
              const creatorName = nameByUserId.get(event.user_id);
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:border-black transition"
                >
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.created_at).toLocaleDateString("es-ES")}
                      {creatorName ? ` · creado por ${creatorName}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold rounded-full bg-black text-white px-2.5 py-1 min-w-8 text-center">
                    {count}
                  </span>
                </Link>
              );
            })
          ) : (
            <p className="text-sm text-gray-500 py-6 text-center">
              Aún no hay eventos. Crea el primero abajo.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-500 mb-2">
          Nuevo evento
        </h2>
        <form action={createEvent} className="flex gap-2">
          <input
            name="name"
            required
            placeholder="Ej. Feria Madrid 2026"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium">
            Crear
          </button>
        </form>
      </section>

      <p className="text-center text-xs text-gray-400">
        <Link href="/privacy" className="underline">
          Política de privacidad
        </Link>
      </p>
    </main>
  );
}
