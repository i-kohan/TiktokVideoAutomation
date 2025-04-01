import fs from "fs";
import { analyzeVideoDeep } from "./video-analysis.js";

const videos = JSON.parse(fs.readFileSync("videos.json", "utf-8"));

for (let i = 0; i < videos.length; i++) {
  const video = videos[i];
  const newAnalysis = await analyzeVideoDeep(video.filePath);

  videos[i].brightness = newAnalysis.brightness;
  videos[i].dominantColor = newAnalysis.dominantColor;

  console.log(`Видео обновлено: ${video.filePath}`);
}

fs.writeFileSync("videos_updated.json", JSON.stringify(videos, null, 2));
