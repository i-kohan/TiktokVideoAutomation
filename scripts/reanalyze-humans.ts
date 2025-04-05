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

  // Filter to videos that currently have humans detected
  // (prioritizing fixing false positives)
  const videosToReanalyze = videos.filter(
    (video) =>
      analysisData[video.id]?.embedding &&
      analysisData[video.id]?.hasHuman === true
  );

  console.log(
    `Reanalyzing human detection for ${videosToReanalyze.length} videos currently marked as having humans...`
  );

  let count = 0;
  let changedCount = 0;

  for (const video of videosToReanalyze) {
    count++;
    console.log(
      `\n[${count}/${videosToReanalyze.length}] Analyzing video ${video.id}: ${video.url}`
    );

    // Skip videos without preview images
    if (!video.video_pictures || video.video_pictures.length === 0) {
      console.error(`No preview images for video ${video.id}`);
      continue;
    }

    try {
      // For faster analysis, use a subset of frames
      // Use at most 5 frames for quick reanalysis
      const imageUrls = video.video_pictures
        .slice(0, Math.min(5, video.video_pictures.length))
        .map((pic) => pic.picture);

      const oldHasHuman = analysisData[video.id].hasHuman;

      // Generate human detection only (reuse existing embedding)
      console.log(
        `Reanalyzing humans for video ${video.id} (using Python service)`
      );
      const { hasHuman } = await generateVideoEmbedding(imageUrls);

      // Update human detection result
      analysisData[video.id].hasHuman = hasHuman;

      console.log(`\nResults for video ${video.id}:`);
      console.log(
        `Old classification: ${oldHasHuman ? "✓ Has humans" : "✗ No humans"}`
      );
      console.log(
        `New classification: ${hasHuman ? "✓ Has humans" : "✗ No humans"}`
      );

      // Track how many classifications changed
      if (oldHasHuman !== hasHuman) {
        changedCount++;
        console.log(
          `★ Classification CHANGED! (${changedCount} changes so far) ★`
        );
      }

      // Save periodically (every 3 videos) to avoid losing progress
      if (count % 3 === 0) {
        saveAnalysisJson(analysisData);
        console.log(`Progress saved after ${count} videos`);
      }
    } catch (error) {
      console.error(`Error processing video ${video.id}:`, error);
    }
  }

  // Final save
  saveAnalysisJson(analysisData);
  console.log(`\n=== Summary ===`);
  console.log(`Human detection reanalyzed for ${count} videos`);
  console.log(`Changed classifications: ${changedCount}`);
  if (changedCount > 0) {
    console.log(
      `Success rate: Fixed ${((changedCount / count) * 100).toFixed(
        1
      )}% of videos!`
    );
  }
}

main().catch(console.error);
