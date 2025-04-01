import { analyzeColors } from "../modules/analysis/analyze-colors";
import { VideoData } from "../modules/data/types";
import { loadVideosJson, saveVideosJson } from "../modules/data/videos";
import { downloadVideo } from "../modules/pexels/download";
import { searchVideos } from "../modules/pexels/search";

const query = "forest fog esthetic";
const videosCount = 10;
const page = 1;

async function main() {
  const existingVideos = loadVideosJson();
  const existingIds = existingVideos.map((v) => v.id);

  const searchResult = await searchVideos(query, {
    perPage: videosCount,
    page,
    orientation: "portrait",
  });

  if ("error" in searchResult) {
    console.error(searchResult.error);
    return;
  }

  for (const video of searchResult.videos) {
    if (existingIds.includes(video.id)) {
      console.log(`Видео уже проанализировано: ${video.id}`);
      continue;
    }

    const lowestQualityFile = video.video_files.reduce((a, b) =>
      a.width && b.width ? (a.width < b.width ? a : b) : a
    );

    const filePath = await downloadVideo(lowestQualityFile.link);
    const analysis = await analyzeColors(filePath);

    const videoData: VideoData = {
      ...video,
      filePath,
      orientation: video.width > video.height ? "landscape" : "portrait",
      analysisData: {
        brightness: analysis.brightness,
        dominantColor: analysis.dominantColor,
      },
    };

    existingVideos.push(videoData);
    console.log("Видео добавлено в JSON:", videoData);
  }

  saveVideosJson(existingVideos);
}

main().catch(console.error);
