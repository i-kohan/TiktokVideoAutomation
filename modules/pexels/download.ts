import axios from "axios";
import fs from "fs";
import path from "path";

import { VIDEOS_DIR } from "../data/constants";

export async function downloadVideo(url: string, outputFolder = VIDEOS_DIR) {
  const filename = url.split("/").pop()?.split("?")[0] + ".mp4";
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

  return new Promise<string>((resolve, reject) => {
    writer.on("finish", () => {
      console.log(`Скачано новое видео: ${filePath}`);
      resolve(filePath);
    });
    writer.on("error", reject);
  });
}
