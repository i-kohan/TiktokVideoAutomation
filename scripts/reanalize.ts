import { analyzeColors } from "../modules/analysis/analyze-colors";
import { AnalysisData, VideoAnalysis } from "../modules/data/types";
import { loadVideosJson, saveAnalysisJson } from "../modules/data/videos";

async function main() {
  const videos = loadVideosJson();

  console.log(`Анализируем ${videos.length} видео...`);

  const analysisData: AnalysisData = {};

  for (const video of videos) {
    console.log(`Анализ видео: ${video.id}`);

    // Get preview images from video
    if (!video.video_pictures || video.video_pictures.length === 0) {
      console.error(`Нет превью для видео ${video.id}`);
      continue;
    }

    try {
      const imageUrls = video.video_pictures.map((pic) => pic.picture);
      const analysis = await analyzeColors(imageUrls);

      const videoAnalysis: VideoAnalysis = {
        brightness: analysis.brightness,
        dominantColor: analysis.dominantColor as [number, number, number],
      };

      analysisData[video.id] = videoAnalysis;
      console.log("Анализ завершен:", { videoId: video.id, ...videoAnalysis });
    } catch (error) {
      console.error(`Ошибка при анализе видео ${video.id}:`, error);
    }
  }

  saveAnalysisJson(analysisData);
}

main().catch(console.error);
