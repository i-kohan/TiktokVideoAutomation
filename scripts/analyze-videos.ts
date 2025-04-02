import { analyzeColors } from "../modules/analysis/analyze-colors";
import { VideoData, VideoAnalysis } from "../modules/data/types";
import {
  loadVideosJson,
  loadAnalysisJson,
  saveAnalysisJson,
} from "../modules/data/videos";

async function main() {
  const videos = loadVideosJson();
  const analysisData = loadAnalysisJson();
  const analyzedIds = new Set(Object.keys(analysisData).map(Number));

  const notAnalyzedVideos = videos.filter(
    (video) => !analyzedIds.has(video.id)
  );

  console.log(`Анализируем ${notAnalyzedVideos.length} видео...`);

  for (const video of notAnalyzedVideos) {
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
