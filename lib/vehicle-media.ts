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

export async function optimizeAndStoreVehicleImage(file: File): Promise<StoredImage> {
  if (!file) {
    throw new Error("No file provided");
  }

  const supabase = createServerClient();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const optimized = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 74 })
    .toBuffer();
  const thumb = await sharp(buffer)
    .rotate()
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 68 })
    .toBuffer();

  const key = `vehicles/${randomUUID()}.webp`;

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

    return {
      url: publicUrl || "",
      thumbUrl: thumbData?.publicUrl || publicUrl || "",
    };
  } catch (error) {
    console.warn("Supabase storage unavailable, falling back to local storage", error);
  }

  // Fallback to local public storage (useful in dev/sandbox)
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "vehicles");
  await fs.mkdir(uploadsDir, { recursive: true });
  const filename = `${randomUUID()}.webp`;
  const thumbFilename = filename.replace(".webp", "-thumb.webp");
  await fs.writeFile(path.join(uploadsDir, filename), optimized);
  await fs.writeFile(path.join(uploadsDir, thumbFilename), thumb);

  return {
    url: `/uploads/vehicles/${filename}`,
    thumbUrl: `/uploads/vehicles/${thumbFilename}`,
  };
}





