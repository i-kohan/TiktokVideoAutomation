import fs from "fs";
import { searchVideos, downloadVideo } from "./pexel.js";
import { analyzeVideoDeep } from "./video-analysis.js";

const VIDEOS_JSON = "videos.json";

function loadVideosJson() {
  if (!fs.existsSync(VIDEOS_JSON)) return [];
  return JSON.parse(fs.readFileSync(VIDEOS_JSON, "utf-8"));
}

function saveVideosJson(data) {
  fs.writeFileSync(VIDEOS_JSON, JSON.stringify(data, null, 2));
}

async function main(query = "forest fog esthetic", videosCount = 10, page = 1) {
  const existingVideos = loadVideosJson();
  const existingIds = existingVideos.map((v) => v.id);

  const searchResult = await searchVideos(query, videosCount, page);

  for (const video of searchResult.videos) {
    if (existingIds.includes(video.id)) {
      console.log(`Видео уже проанализировано: ${video.id}`);
      continue;
    }

    const bestFile = video.video_files.reduce((a, b) =>
      a.width < b.width ? a : b
    );
    const filePath = await downloadVideo(bestFile.link);

    const analysis = await analyzeVideoDeep(filePath);

    const videoData = {
      id: video.id,
      url: bestFile.link,
      filePath,
      duration: video.duration,
      width: bestFile.width,
      height: bestFile.height,
      orientation: bestFile.width > bestFile.height ? "landscape" : "portrait",
      brightness: analysis.brightness,
      dominantColor: analysis.dominantColor,
    };

    existingVideos.push(videoData);
    console.log("Видео добавлено в JSON:", videoData);
  }

  saveVideosJson(existingVideos);
}

main("forest fog esthetic", 10, 5).catch(console.error);
