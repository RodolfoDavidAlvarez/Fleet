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
  const isProduction = process.env.VERCEL || process.env.NODE_ENV === "production";

  for (const [index, file] of files.entries()) {
    if (index > 2) break; // keep it lightweight for mobile uploads
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let optimized: Buffer;
    let thumb: Buffer;
    
    try {
      optimized = await sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer();
      thumb = await sharp(buffer).rotate().resize({ width: 480, withoutEnlargement: true }).webp({ quality: 68 }).toBuffer();
    } catch (error) {
      console.error("Failed to process image with sharp:", error);
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    const key = `repairs/${randomUUID()}.webp`;

    try {
      const { error } = await supabase.storage.from(bucketName).upload(key, optimized, {
        contentType: "image/webp",
        upsert: true,
      });
      if (error) {
        console.error("Supabase upload error:", error);
        throw error;
      }
      const { data } = supabase.storage.from(bucketName).getPublicUrl(key);
      const publicUrl = data?.publicUrl || null;

      // store thumbnail next to it for quick previews
      const thumbKey = key.replace(".webp", "-thumb.webp");
      const { error: thumbErr } = await supabase.storage.from(bucketName).upload(thumbKey, thumb, {
        contentType: "image/webp",
        upsert: true,
      });
      if (thumbErr) {
        console.error("Supabase thumbnail upload error:", thumbErr);
        throw thumbErr;
      }
      const { data: thumbData } = supabase.storage.from(bucketName).getPublicUrl(thumbKey);

      uploaded.push({
        url: publicUrl || "",
        thumbUrl: thumbData?.publicUrl || publicUrl || "",
      });
      continue;
    } catch (error) {
      console.error("Supabase storage upload failed:", error);
      
      // Only use local storage fallback in development (not in Vercel/production)
      if (!isProduction) {
        try {
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
          continue;
        } catch (localError) {
          console.error("Local storage fallback also failed:", localError);
        }
      }
      
      // In production, if Supabase fails, we must throw an error
      throw new Error(`Failed to upload image to storage: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return uploaded;
}
