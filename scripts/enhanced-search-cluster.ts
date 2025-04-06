import { searchVideosByText } from "../modules/analysis/clip-embeddings";
import { loadAnalysisJson, loadVideosJson } from "../modules/data/videos";
import { saveClustersJson, loadClustersJson } from "../modules/data/clusters";
import {
  VideoData,
  Cluster,
  ClustersData,
  VideoAnalysis,
} from "../modules/data/types";

/**
 * Enhanced cluster creation script with the following improvements:
 * 1. Multi-prompt search - uses multiple related prompts for more precise matching
 * 2. Color matching - considers color harmony alongside semantic similarity
 * 3. Minimum similarity threshold - filters out videos below a certain similarity score
 */

// Color utility functions
function rgbDistance(
  color1: [number, number, number],
  color2: [number, number, number]
): number {
  // Calculate Euclidean distance between two RGB colors
  return (
    Math.sqrt(
      Math.pow(color1[0] - color2[0], 2) +
        Math.pow(color1[1] - color2[1], 2) +
        Math.pow(color1[2] - color2[2], 2)
    ) / 441.67
  ); // Normalized to 0-1 (max possible distance is sqrt(255^2 * 3))
}

function brightnessDistance(b1: number, b2: number): number {
  return Math.abs(b1 - b2);
}

// Calculate combined score (semantic similarity + visual similarity)
function calculateCombinedScore(
  semanticSimilarity: number,
  videoAnalysis: VideoAnalysis,
  referenceAnalysis: VideoAnalysis,
  semanticWeight: number = 0.6,
  colorWeight: number = 0.3,
  brightnessWeight: number = 0.1
): number {
  // If no color data, just return semantic similarity
  if (!videoAnalysis.dominantColor || !referenceAnalysis.dominantColor) {
    return semanticSimilarity;
  }

  // Calculate color distance (lower is better)
  const colorDistance = rgbDistance(
    videoAnalysis.dominantColor,
    referenceAnalysis.dominantColor
  );
  const colorSimilarity = 1 - colorDistance;

  // Calculate brightness distance (lower is better)
  const brightnessSimilarity =
    1 -
    brightnessDistance(
      videoAnalysis.brightness || 0.5,
      referenceAnalysis.brightness || 0.5
    );

  // Combine scores with weights
  return (
    semanticSimilarity * semanticWeight +
    colorSimilarity * colorWeight +
    brightnessSimilarity * brightnessWeight
  );
}

async function main() {
  // Get command line arguments
  const primaryQuery = process.argv[2];
  const relatedPrompts = process.argv[3] ? process.argv[3].split(",") : [];
  const orientation = process.argv[4] || "portrait";
  const maxVideos = parseInt(process.argv[5] || "5");
  const clusterName = process.argv[6] || primaryQuery;
  const minSimilarity = parseFloat(process.argv[7] || "0.75"); // Minimum semantic similarity threshold

  if (!primaryQuery) {
    console.error(
      "Please provide a primary search query as the first argument"
    );
    console.error(
      "Usage: npx ts-node scripts/enhanced-search-cluster.ts 'primary query' 'related1,related2' [orientation] [max videos] [cluster name] [min similarity]"
    );
    console.error(
      "Example: npx ts-node scripts/enhanced-search-cluster.ts 'forest fog' 'misty woods,morning fog' portrait 5 'Foggy Forest' 0.8"
    );
    process.exit(1);
  }

  if (orientation !== "portrait" && orientation !== "landscape") {
    console.error("Invalid orientation. Use 'portrait' or 'landscape'");
    process.exit(1);
  }

  console.log(
    `\n=== Creating enhanced cluster for query: "${primaryQuery}" (${orientation}) ===\n`
  );

  if (relatedPrompts.length > 0) {
    console.log(`Using related prompts: ${relatedPrompts.join(", ")}`);
  }

  console.log(`Minimum similarity threshold: ${minSimilarity}`);

  // Load videos and analysis data
  console.log("Loading data...");
  const videos = loadVideosJson();
  const analysisData = loadAnalysisJson();

  // Create map for quick lookup
  const videoMap = new Map<number, VideoData>();
  videos.forEach((video) => videoMap.set(video.id, video));

  // Step a: Search for videos matching the primary query
  console.log(
    `\nSearching for videos matching primary query: "${primaryQuery}"...`
  );
  const primaryResults = await searchVideosByText(
    primaryQuery,
    analysisData,
    true,
    50
  );

  // Filter by minimum similarity threshold
  const filteredPrimaryResults = primaryResults.filter(
    (result) => result.similarity >= minSimilarity
  );

  console.log(
    `Found ${filteredPrimaryResults.length} videos above similarity threshold ${minSimilarity}`
  );

  if (filteredPrimaryResults.length === 0) {
    console.error(
      "No videos found matching your primary query with sufficient similarity"
    );
    process.exit(1);
  }

  // Step b: If we have related prompts, search for those too and find intersections
  let finalCandidates = filteredPrimaryResults;

  if (relatedPrompts.length > 0) {
    console.log("\nSearching for videos matching related prompts...");

    // Array to track how many times each video appears across all prompts
    const videoFrequency = new Map<number, number>();
    filteredPrimaryResults.forEach((result) =>
      videoFrequency.set(result.videoId, 1)
    );

    // Search for each related prompt
    for (const prompt of relatedPrompts) {
      console.log(`Searching for: "${prompt}"`);
      const relatedResults = await searchVideosByText(
        prompt,
        analysisData,
        true,
        30
      );

      // Count matching videos that are already in our candidates
      relatedResults
        .filter((result) => result.similarity >= minSimilarity)
        .forEach((result) => {
          if (videoFrequency.has(result.videoId)) {
            videoFrequency.set(
              result.videoId,
              videoFrequency.get(result.videoId)! + 1
            );
          }
        });
    }

    // Get videos that match at least 2 prompts (primary + at least 1 related)
    const multiMatchVideos = Array.from(videoFrequency.entries())
      .filter(([_, count]) => count >= 2)
      .map(([videoId, _]) => videoId);

    if (multiMatchVideos.length >= 3) {
      console.log(
        `Found ${multiMatchVideos.length} videos matching multiple prompts`
      );

      // Filter primary results to only include multi-matching videos
      finalCandidates = filteredPrimaryResults.filter((result) =>
        multiMatchVideos.includes(result.videoId)
      );
    } else {
      console.log(
        "Not enough videos match multiple prompts, using primary results"
      );
    }
  }

  // Step c: Filter by orientation and limit results
  console.log(`\nFiltering ${orientation} videos...`);
  const orientationFiltered = finalCandidates.filter((result) => {
    const video = videoMap.get(result.videoId);
    return video && video.orientation === orientation;
  });

  if (orientationFiltered.length === 0) {
    console.error(`No ${orientation} videos found matching your criteria`);
    process.exit(1);
  }

  // Step d: Apply color matching if we have enough candidates
  console.log("\nApplying color and visual harmony matching...");

  const withCombinedScores = [];

  // If we have enough videos, use the first one as a reference for color matching
  if (orientationFiltered.length >= 2) {
    // Get reference video (highest semantic similarity)
    const referenceVideoId = orientationFiltered[0].videoId;
    const referenceAnalysis = analysisData[referenceVideoId];

    console.log(
      `Using video ${referenceVideoId} as reference for color matching`
    );

    // Add combined scores for all videos
    for (const result of orientationFiltered) {
      const videoAnalysis = analysisData[result.videoId];
      const combinedScore = calculateCombinedScore(
        result.similarity,
        videoAnalysis,
        referenceAnalysis
      );

      withCombinedScores.push({
        ...result,
        combinedScore,
        semanticScore: result.similarity,
      });
    }

    // Sort by combined score
    withCombinedScores.sort((a, b) => b.combinedScore - a.combinedScore);

    console.log("Videos ranked by combined semantic + visual similarity:");
    withCombinedScores.slice(0, 10).forEach((result, i) => {
      console.log(
        `  ${i + 1}. Video ${
          result.videoId
        }: combined=${result.combinedScore.toFixed(
          3
        )}, semantic=${result.semanticScore.toFixed(3)}`
      );
    });
  } else {
    // Not enough videos for color matching
    withCombinedScores.push(
      ...orientationFiltered.map((r) => ({
        ...r,
        combinedScore: r.similarity,
        semanticScore: r.similarity,
      }))
    );
  }

  // Take the top videos based on combined score
  const bestMatches = withCombinedScores.slice(0, maxVideos);

  // Calculate average similarity for quality score
  const avgCombinedScore =
    bestMatches.reduce((sum, result) => sum + result.combinedScore, 0) /
    bestMatches.length;

  // Create the cluster
  const newCluster: Cluster = {
    videoIds: bestMatches.map((result) => result.videoId),
    quality: 1 - avgCombinedScore, // Lower is better in our quality metric
    theme: clusterName,
  };

  // Add to existing clusters
  console.log(`\nCreating cluster with ${bestMatches.length} videos...`);
  let clusters: ClustersData;

  try {
    clusters = loadClustersJson();
  } catch (error) {
    console.log("No existing clusters found, creating new clusters file");
    clusters = {
      portrait: [],
      landscape: [],
    };
  }

  // Add the new cluster
  if (orientation === "portrait") {
    clusters.portrait.push(newCluster);
  } else {
    clusters.landscape.push(newCluster);
  }

  // Save the updated clusters
  saveClustersJson(clusters);

  // Print a summary
  console.log("\n=== Enhanced Cluster Creation Summary ===");
  console.log(`Primary Query: "${primaryQuery}"`);
  if (relatedPrompts.length > 0) {
    console.log(`Related Prompts: ${relatedPrompts.join(", ")}`);
  }
  console.log(`Cluster name: "${clusterName}"`);
  console.log(`Orientation: ${orientation}`);
  console.log(`Videos in cluster: ${newCluster.videoIds.length}`);
  console.log(
    `Quality score: ${newCluster.quality.toFixed(3)} (lower is better)`
  );
  console.log(`Minimum similarity threshold: ${minSimilarity}`);

  // Print videos in the cluster with their scores
  console.log("\nVideos in this cluster:");
  bestMatches.forEach((result, i) => {
    const video = videoMap.get(result.videoId);
    console.log(`${i + 1}. ID: ${result.videoId}`);
    console.log(`   Combined Score: ${result.combinedScore.toFixed(3)}`);
    console.log(`   Semantic Score: ${result.semanticScore.toFixed(3)}`);
    console.log(`   URL: ${video?.url || "Unknown"}`);
  });

  // Find the index of the new cluster
  const clusterIndex =
    orientation === "portrait"
      ? clusters.portrait.length - 1
      : clusters.landscape.length - 1;

  console.log(`\nCluster saved as ${orientation} cluster #${clusterIndex}`);
  console.log(`To create a montage from this cluster, run:`);
  console.log(
    `npx ts-node scripts/montage-cluster.ts ${clusterIndex} ${orientation}`
  );
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
