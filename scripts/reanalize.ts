import { analyzeColors } from "../modules/analysis/analyze-colors";
import { loadVideosJson, saveVideosJson } from "../modules/data/videos";

async function main() {
  const videos = loadVideosJson();

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const newAnalysis = await analyzeColors(video.filePath);

    videos[i].analysisData.brightness = newAnalysis.brightness;
    videos[i].analysisData.dominantColor = newAnalysis.dominantColor;
  }

  saveVideosJson(videos);
}

main().catch(console.error);
