import { generateVideoEmbedding } from "../modules/analysis/clip-embeddings";
import {
  loadVideosJson,
  loadAnalysisJson,
  saveAnalysisJson,
} from "../modules/data/videos";
import { VideoAnalysis } from "../modules/data/types";

async function main() {
  const videos = loadVideosJson();
  const analysisData = loadAnalysisJson();

  // Filter videos that don't have embeddings yet
  const videosWithoutEmbeddings = videos.filter(
    (video) => !analysisData[video.id]?.embedding
  );

  console.log(
    `Generating embeddings for ${videosWithoutEmbeddings.length} videos...`
  );

  let count = 0;
  for (const video of videosWithoutEmbeddings) {
    count++;
    console.log(
      `Processing video ${count}/${videosWithoutEmbeddings.length}: ${video.id}`
    );

    // Skip videos without preview images
    if (!video.video_pictures || video.video_pictures.length === 0) {
      console.error(`No preview images for video ${video.id}`);
      continue;
    }

    try {
      const imageUrls = video.video_pictures
        .map((pic) => pic.picture)
        .slice(0, 1);

      // Get or create base analysis
      let videoAnalysis: VideoAnalysis = analysisData[video.id] || {};

      // Generate embedding
      console.log(`Generating embeddings for video ${video.id}`);
      const { embedding, hasHuman } = await generateVideoEmbedding(imageUrls);

      // Update with embedding
      videoAnalysis.embedding = embedding;
      videoAnalysis.hasHuman = hasHuman;

      // Store the complete analysis
      analysisData[video.id] = videoAnalysis;

      console.log(`Embedding generated for video ${video.id}`);
      console.log(`Contains humans: ${hasHuman ? "Yes" : "No"}`);

      // Save periodically (every 5 videos) to avoid losing progress
      if (count % 5 === 0) {
        saveAnalysisJson(analysisData);
        console.log(`Progress saved after ${count} videos`);
      }
    } catch (error) {
      console.error(`Error processing video ${video.id}:`, error);
    }
  }

  // Final save
  saveAnalysisJson(analysisData);
  console.log(`Embeddings generated for ${count} videos`);
}

main().catch(console.error);
