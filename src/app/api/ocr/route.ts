import { NextRequest, NextResponse } from "next/server";

const MODEL = "claude-haiku-4-5-20251001";

const EXTRACTION_PROMPT = `Esta imagen es una tarjeta de visita (business card). Extrae los datos de la persona y responde ÚNICAMENTE con un objeto JSON, sin texto adicional ni bloques de código, con esta forma exacta:

{"first_name": "", "last_name": "", "email": "", "phone": "", "company": ""}

Reglas:
- "first_name"/"last_name": el nombre de la persona (no el de la empresa). Si solo hay un nombre completo, ponlo todo en "first_name" y deja "last_name" vacío.
- "company": el nombre de la empresa/organización (no el cargo).
- "email" y "phone": tal como aparecen, sin inventar datos.
- Si un campo no aparece en la imagen o no estás seguro, déjalo como cadena vacía "".
- No incluyas el cargo/puesto en ningún campo.`;

function stripCodeFence(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return match ? match[1] : trimmed;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OCR no configurado: falta ANTHROPIC_API_KEY en el servidor." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Falta la imagen" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: EXTRACTION_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return NextResponse.json(
      { error: `Error del servicio de IA (${response.status}): ${detail.slice(0, 200)}` },
      { status: 502 },
    );
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? "";

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(stripCodeFence(text));
  } catch {
    return NextResponse.json(
      { error: "No se pudo interpretar la respuesta de la IA" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    first_name: parsed.first_name ?? "",
    last_name: parsed.last_name ?? "",
    email: parsed.email ?? "",
    phone: parsed.phone ?? "",
    company: parsed.company ?? "",
  });
}
