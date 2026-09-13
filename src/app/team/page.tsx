import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createTeamMember } from "@/lib/actions";

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myProfile } = await supabase
    .from("epack_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (myProfile?.role !== "manager") redirect("/");

  const { data: members } = await supabase
    .from("epack_profiles")
    .select("user_id, name, email, role, created_at")
    .order("created_at", { ascending: true });

  return (
    <main className="flex-1 mx-auto w-full max-w-lg px-4 py-6 space-y-6">
      <header className="space-y-1">
        <Link href="/" className="text-sm text-gray-500">
          ← Volver
        </Link>
        <h1 className="text-xl font-semibold">Equipo</h1>
        <p className="text-xs text-gray-500">
          Da de alta a tu compañero con su email y un PIN — podrá entrar
          directamente con eso, sin registrarse.
        </p>
      </header>

      <section>
        <div className="space-y-2">
          {members?.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
            >
              <div>
                <p className="font-medium">{m.name || m.email}</p>
                <p className="text-xs text-gray-500">{m.email}</p>
              </div>
              <span className="text-xs font-medium rounded-full bg-gray-100 px-2.5 py-1">
                {m.role === "manager" ? "Manager" : "Comercial"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-500 mb-3">
          Añadir compañero
        </h2>
        <form action={createTeamMember} className="space-y-3">
          <input
            name="name"
            required
            placeholder="Nombre"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <input
            name="pin"
            required
            inputMode="numeric"
            pattern="\d{4,6}"
            placeholder="PIN (4-6 dígitos)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button className="w-full rounded-lg bg-black text-white py-2.5 text-sm font-medium">
            Crear acceso
          </button>
        </form>
      </section>
    </main>
  );
}
