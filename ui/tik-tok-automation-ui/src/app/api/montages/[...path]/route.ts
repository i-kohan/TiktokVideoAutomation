import { NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";

// Base path to the main project
const BASE_PATH = path.resolve(process.cwd(), "..", "..");
const MONTAGE_DIR = path.join(BASE_PATH, "data", "montages");

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = path.join(MONTAGE_DIR, ...params.path);

    // Security check to prevent directory traversal
    const normalizedFilePath = path.normalize(filePath);
    if (!normalizedFilePath.startsWith(MONTAGE_DIR)) {
      return new Response("Invalid path", { status: 400 });
    }

    // Read the file
    const file = await fs.readFile(filePath);

    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "application/octet-stream";

    switch (ext) {
      case ".mp4":
        contentType = "video/mp4";
        break;
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".png":
        contentType = "image/png";
        break;
      // Add more file types as needed
    }

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${path.basename(
          filePath
        )}"`,
      },
    });
  } catch (error) {
    console.error("Error serving montage file:", error);
    return new Response("File not found", { status: 404 });
  }
}
