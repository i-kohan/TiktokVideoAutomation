import axios from "axios";
import fs from "fs";
import path from "path";
import { createClient } from "pexels";

import dotenv from "dotenv";

dotenv.config();

const client = createClient(process.env.PEXELS_API_KEY);

export async function searchVideos(
  query,
  perPage = 1,
  page = 1,
  orientation = "portrait"
) {
  const result = await client.videos.search({
    query,
    per_page: perPage,
    orientation,
    page,
  });

  return result;
}

export async function downloadVideo(url, outputFolder = "videos") {
  const filename = url.split("/").pop().split("?")[0] + ".mp4";
  const filePath = path.join(outputFolder, filename);

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
  }

  if (fs.existsSync(filePath)) {
    console.log(`Видео уже скачано: ${filename}`);
    return filePath;
  }

  const response = await axios.get(url, { responseType: "stream" });
  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => {
      console.log(`Скачано новое видео: ${filePath}`);
      resolve(filePath);
    });
    writer.on("error", reject);
  });
}
