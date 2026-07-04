/**
 * Client-side image compression using canvas → WebP.
 * Scales the image down to `maxWidth` (default 1600px), preserving aspect ratio.
 * If the source is already smaller than maxWidth, its dimensions are kept, but
 * the output is still re-encoded as WebP for consistent format.
 */
export async function compressImage(
  file: File | Blob,
  opts?: { maxWidth?: number; quality?: number },
): Promise<Blob> {
  const maxWidth = opts?.maxWidth ?? 1600;
  const quality = opts?.quality ?? 0.8;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxWidth / img.width);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/webp",
        quality,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
