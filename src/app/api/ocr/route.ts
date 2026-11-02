import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Haiku 5.5: el modelo más rápido. Sin thinking y effort bajo para mínima latencia:
// leer una tarjeta no necesita razonar.
const MODEL = "claude-haiku-5-5";

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
  const supported = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const mediaType = supported.includes(file.type) ? file.type : "image/jpeg";

  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 25_000 });

  let text = "";
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                data: base64,
              },
            },
            { type: "text", text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });
    for (const block of response.content) {
      if (block.type === "text") text += block.text;
    }
  } catch (error) {
    const detail =
      error instanceof Anthropic.APIError
        ? `${error.status ?? ""} ${error.message}`
        : String(error);
    console.error("OCR error:", detail);
    return NextResponse.json(
      { error: "El servicio de IA no respondió. Prueba otra vez o rellénalo a mano." },
      { status: 502 },
    );
  }

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
