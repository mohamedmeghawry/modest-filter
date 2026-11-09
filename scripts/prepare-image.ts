// One photo conversion for every model (Jev, Opus): JPEG, longest side at most
// 1568 px. Jev accepts only PNG/JPEG at 280-1568 px; Claude downsizes anything
// larger to about the same size anyway. Sending the same pixels to both is
// what makes the Jev vs Opus comparison fair (docs/attribute-sources.md).
// sharp ships with Next.js (not a direct dependency of this repo).
import sharp from "sharp";

/** JPEG buffer, or null when the file is not a decodable image (e.g. a saved HTML page). */
export async function prepareImage(file: string): Promise<Buffer | null> {
  try {
    return await sharp(file)
      .rotate() // respect EXIF orientation
      .resize(1568, 1568, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer();
  } catch {
    return null;
  }
}
