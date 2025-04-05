import { searchVideosByText } from "../modules/analysis/clip-embeddings";
import { loadAnalysisJson, loadVideosJson } from "../modules/data/videos";
import { saveClustersJson } from "../modules/data/clusters";
import { VideoData, QueryResult } from "../modules/data/types";
import path from "path";

// Map of video IDs to the actual videos
const videoMap = new Map<number, VideoData>();

// Create a cluster from search results
function createClusterFromSearchResults(results: QueryResult[], theme: string) {
  // Calculate average quality - closer to 1 is better
  const avgQuality =
    results.reduce((sum: number, r: QueryResult) => sum + r.similarity, 0) /
    results.length;

  return {
    videoIds: results.map((r: QueryResult) => r.videoId),
    quality: 1 - avgQuality, // Convert to our quality metric where lower is better
    theme,
  };
}

// Group videos by orientation
function groupByOrientation(videoIds: number[]) {
  const portrait: number[] = [];
  const landscape: number[] = [];

  for (const videoId of videoIds) {
    const video = videoMap.get(videoId);
    if (!video) continue;

    if (video.orientation === "portrait") {
      portrait.push(videoId);
    } else {
      landscape.push(videoId);
    }
  }

  return { portrait, landscape };
}

async function main() {
  // Check if we have a query
  const searchQuery = process.argv[2];
  if (!searchQuery) {
    console.error("Please provide a search query as an argument");
    console.error(
      "Example: npx ts-node scripts/search-videos.ts 'mountain landscape'"
    );
    process.exit(1);
  }

  // Load data
  const videos = loadVideosJson();
  const analysisData = loadAnalysisJson();

  // Map videos for easy lookup
  videos.forEach((video) => videoMap.set(video.id, video));

  // Check if we have embeddings
  const videosWithEmbeddings = videos.filter(
    (v) => !!analysisData[v.id]?.embedding
  );
  console.log(`Found ${videosWithEmbeddings.length} videos with embeddings`);

  if (videosWithEmbeddings.length === 0) {
    console.error(
      "No videos with embeddings found. Run 'generate-embeddings.ts' first."
    );
    process.exit(1);
  }

  // Search videos
  console.log(`Searching for videos matching: "${searchQuery}"`);
  const searchResults = await searchVideosByText(searchQuery, analysisData);

  // Print results
  console.log(`Found ${searchResults.length} videos matching "${searchQuery}"`);

  // Group by orientation
  const resultIds = searchResults.map((r) => r.videoId);
  const { portrait, landscape } = groupByOrientation(resultIds);

  console.log(`Portrait videos: ${portrait.length}`);
  console.log(`Landscape videos: ${landscape.length}`);

  // Create clusters
  const portraitCluster = createClusterFromSearchResults(
    searchResults.filter((r) => portrait.includes(r.videoId)),
    searchQuery
  );

  const landscapeCluster = createClusterFromSearchResults(
    searchResults.filter((r) => landscape.includes(r.videoId)),
    searchQuery
  );

  // Save as a cluster file
  const clustersData = {
    portrait: portraitCluster.videoIds.length > 0 ? [portraitCluster] : [],
    landscape: landscapeCluster.videoIds.length > 0 ? [landscapeCluster] : [],
  };

  // Create a clean filename from the search query
  const filename = searchQuery.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const outputPath = path.join(__dirname, `../../data/search-${filename}.json`);

  saveClustersJson(clustersData, outputPath);
  console.log(`Saved search results to ${outputPath}`);

  // Print top results
  console.log("\nTop matches:");
  for (let i = 0; i < Math.min(5, searchResults.length); i++) {
    const { videoId, similarity } = searchResults[i];
    const video = videoMap.get(videoId);
    console.log(`${i + 1}. Video ID: ${videoId}`);
    console.log(`   Similarity: ${Math.round(similarity * 100)}%`);
    console.log(`   URL: ${video?.url || "Unknown"}`);
    console.log(`   Orientation: ${video?.orientation || "Unknown"}`);
    console.log();
  }
}

main().catch(console.error);
