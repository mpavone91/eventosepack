import { NextRequest, NextResponse } from "next/server";

function extractField(text: string, regex: RegExp) {
  const match = text.match(regex);
  return match ? match[0].trim() : "";
}

function guessFields(rawText: string) {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const email = extractField(
    rawText,
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  );
  const phone = extractField(
    rawText,
    /(\+?\d[\d\s().-]{7,}\d)/,
  );

  const emailLine = lines.find((l) => l.includes(email));
  const phoneLine = lines.find((l) => l.includes(phone));

  const remaining = lines.filter(
    (l) => l !== emailLine && l !== phoneLine,
  );

  // Heuristic: first remaining line that looks like "Name Surname" (letters + spaces,
  // no digits, 2-4 words) is the person's name. A later line with common company
  // suffixes or being short/uppercase is guessed as the company.
  const nameRegex = /^[A-Za-zÀ-ÿ'’.\s-]{4,40}$/;
  const companySuffix = /(s\.?l\.?|s\.?a\.?|inc\.?|corp|ltd|group|studio|labs?)\b/i;

  let name = "";
  let company = "";

  for (const line of remaining) {
    const words = line.split(/\s+/);
    if (!name && nameRegex.test(line) && words.length >= 2 && words.length <= 4) {
      name = line;
      continue;
    }
    if (!company && (companySuffix.test(line) || (name && line !== name))) {
      company = line;
    }
  }

  if (!company) {
    company = remaining.find((l) => l !== name) ?? "";
  }

  const [first_name = "", ...rest] = name.split(/\s+/);
  const last_name = rest.join(" ");

  return {
    first_name,
    last_name,
    email,
    phone,
    company,
    raw_text: rawText,
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OCR no configurado: falta OCR_SPACE_API_KEY en el servidor." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Falta la imagen" }, { status: 400 });
  }

  const ocrForm = new FormData();
  ocrForm.append("apikey", apiKey);
  ocrForm.append("language", "spa");
  ocrForm.append("isOverlayRequired", "false");
  ocrForm.append("OCREngine", "2");
  ocrForm.append("scale", "true");
  ocrForm.append("file", file, "card.jpg");

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    body: ocrForm,
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `Error del servicio OCR (${response.status})` },
      { status: 502 },
    );
  }

  const data = await response.json();

  if (data.IsErroredOnProcessing) {
    return NextResponse.json(
      { error: data.ErrorMessage?.join?.(", ") ?? "Error al procesar la imagen" },
      { status: 502 },
    );
  }

  const rawText: string = data.ParsedResults?.[0]?.ParsedText ?? "";
  if (!rawText.trim()) {
    return NextResponse.json(
      { error: "No se detectó texto en la imagen" },
      { status: 422 },
    );
  }

  return NextResponse.json(guessFields(rawText));
}
