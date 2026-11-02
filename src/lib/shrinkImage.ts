// Reduce la foto en el propio móvil antes de subirla: de 3-8 MB a ~150-300 KB.
// Para leer una tarjeta bastan ~1280 px de lado largo, y la subida por la red
// de una feria es lo que más tarda. Si algo falla, devuelve la foto original.
export async function shrinkImage(
  file: File,
  maxSide = 1280,
  quality = 0.8,
): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}
