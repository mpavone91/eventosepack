import type { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { RATING_BY_VALUE, isRating } from "@/lib/leadMeta";

const METHOD_LABEL: Record<string, string> = {
  manual: "Manual",
  card_scan: "Tarjeta",
  qr_self: "QR (auto)",
};

// Las primeras columnas usan los nombres de campo de Lead en Salesforce para que el
// Data Import Wizard las mapee solas. Salesforce exige Last Name y Company.
const COLUMNS = [
  "First Name",
  "Last Name",
  "Company",
  "Email",
  "Phone",
  "Rating",
  "Lead Source",
  "Description",
  "Evento",
  "Etiquetas",
  "Captado por",
  "Método",
  "Fecha",
] as const;

function csvCell(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function fileSafe(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "leads"
  );
}

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/events/[id]/export">,
) {
  const { id } = await ctx.params;
  const format = request.nextUrl.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  const { data: me } = await supabase
    .from("epack_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (me?.role !== "manager") {
    return new Response("Solo el manager puede exportar", { status: 403 });
  }

  const { data: event } = await supabase
    .from("epack_events")
    .select("id, name")
    .eq("id", id)
    .single();
  if (!event) return new Response("Evento no encontrado", { status: 404 });

  const [{ data: leads, error }, { data: profiles }] = await Promise.all([
    supabase
      .from("epack_leads")
      .select(
        "first_name, last_name, email, phone, company, note, rating, tags, capture_method, created_at, created_by",
      )
      .eq("event_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("epack_profiles").select("user_id, name"),
  ]);
  if (error) return new Response(error.message, { status: 500 });

  const nameById = new Map((profiles ?? []).map((p) => [p.user_id, p.name]));

  const rows = (leads ?? []).map((l) => [
    l.first_name ?? "",
    l.last_name ?? "",
    l.company ?? "",
    l.email ?? "",
    l.phone ?? "",
    isRating(l.rating) ? RATING_BY_VALUE[l.rating].salesforce : "",
    "Trade Show",
    l.note ?? "",
    event.name,
    ((l.tags as string[] | null) ?? []).join("; "),
    l.created_by ? (nameById.get(l.created_by) ?? "") : "",
    METHOD_LABEL[l.capture_method] ?? l.capture_method,
    new Date(l.created_at).toLocaleString("es-ES", { timeZone: "Europe/Madrid" }),
  ]);

  const base = `leads-${fileSafe(event.name)}`;

  if (format === "csv") {
    const csv = [COLUMNS as readonly string[], ...rows]
      .map((r) => r.map(csvCell).join(","))
      .join("\r\n");
    return new Response("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${base}-salesforce.csv"`,
      },
    });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Leads");
  sheet.addRow([...COLUMNS]);
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  rows.forEach((r) => sheet.addRow(r));
  sheet.columns.forEach((col) => {
    let max = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      max = Math.max(max, String(cell.value ?? "").length + 2);
    });
    col.width = Math.min(max, 50);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${base}.xlsx"`,
    },
  });
}
