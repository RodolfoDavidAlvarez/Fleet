import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { createServerClient } from "./supabase";

type StoredImage = {
  url: string;
  thumbUrl: string;
};

const bucketName = process.env.SUPABASE_STORAGE_BUCKET || process.env.SUPABASE_UPLOAD_BUCKET || "public";

export async function optimizeAndStoreImages(files: File[]): Promise<StoredImage[]> {
  if (!files || files.length === 0) return [];

  const supabase = createServerClient();
  const uploaded: StoredImage[] = [];

  for (const [index, file] of files.entries()) {
    if (index > 2) break; // keep it lightweight for mobile uploads
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const optimized = await sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer();
    const thumb = await sharp(buffer).rotate().resize({ width: 480, withoutEnlargement: true }).webp({ quality: 68 }).toBuffer();

    const key = `repairs/${randomUUID()}.webp`;

    let publicUrl: string | null = null;
    try {
      const { error } = await supabase.storage.from(bucketName).upload(key, optimized, {
        contentType: "image/webp",
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucketName).getPublicUrl(key);
      publicUrl = data?.publicUrl || null;

      // store thumbnail next to it for quick previews
      const thumbKey = key.replace(".webp", "-thumb.webp");
      const { error: thumbErr } = await supabase.storage.from(bucketName).upload(thumbKey, thumb, {
        contentType: "image/webp",
        upsert: true,
      });
      if (thumbErr) throw thumbErr;
      const { data: thumbData } = supabase.storage.from(bucketName).getPublicUrl(thumbKey);

      uploaded.push({
        url: publicUrl || "",
        thumbUrl: thumbData?.publicUrl || publicUrl || "",
      });
      continue;
    } catch (error) {
      console.warn("Supabase storage unavailable, falling back to local storage", error);
    }

    // Fallback to local public storage (useful in dev/sandbox)
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "repairs");
    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = `${randomUUID()}.webp`;
    const thumbFilename = filename.replace(".webp", "-thumb.webp");
    await fs.writeFile(path.join(uploadsDir, filename), optimized);
    await fs.writeFile(path.join(uploadsDir, thumbFilename), thumb);

    uploaded.push({
      url: `/uploads/repairs/${filename}`,
      thumbUrl: `/uploads/repairs/${thumbFilename}`,
    });
  }

  return uploaded;
}
