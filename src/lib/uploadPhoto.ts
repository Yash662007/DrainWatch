import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function extFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

export async function savePhoto(file: File): Promise<{ url: string; buffer: Buffer }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${extFromType(file.type)}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return { url: `/uploads/${filename}`, buffer };
}
