import { searchVideosByText } from "../modules/analysis/clip-embeddings";
import { loadAnalysisJson, loadVideosJson } from "../modules/data/videos";
import { saveClustersJson, loadClustersJson } from "../modules/data/clusters";
import { VideoData, Cluster, ClustersData } from "../modules/data/types";

/**
 * Create a cluster from search results
 *
 * This script searches for videos matching a query and creates a new cluster
 * of the most similar videos. It saves the cluster to the clusters file.
 */
async function main() {
  // 1. Get search query and options from command line
  const query = process.argv[2];
  const orientation = process.argv[3] || "portrait";
  const maxVideos = parseInt(process.argv[4] || "5");
  const clusterName = process.argv[5] || query;

  if (!query) {
    console.error("Please provide a search query as the first argument");
    console.error(
      "Usage: npx ts-node scripts/create-search-cluster.ts 'search query' [orientation] [max videos] [cluster name]"
    );
    console.error(
      "Example: npx ts-node scripts/create-search-cluster.ts 'forest at night' portrait 5 'Dark Forest'"
    );
    process.exit(1);
  }

  if (orientation !== "portrait" && orientation !== "landscape") {
    console.error("Invalid orientation. Use 'portrait' or 'landscape'");
    process.exit(1);
  }

  console.log(
    `\n=== Creating cluster for query: "${query}" (${orientation}) ===\n`
  );

  // 2. Load videos and analysis data
  console.log("Loading data...");
  const videos = loadVideosJson();
  const analysisData = loadAnalysisJson();

  // Create map for quick lookup
  const videoMap = new Map<number, VideoData>();
  videos.forEach((video) => videoMap.set(video.id, video));

  // 3. Search for videos matching the query
  console.log(`\nSearching for videos matching: "${query}"...`);
  const searchResults = await searchVideosByText(query, analysisData, true, 30);

  if (searchResults.length === 0) {
    console.error("No videos found matching your query");
    process.exit(1);
  }

  // 4. Filter videos by orientation
  console.log(`\nFiltering ${orientation} videos...`);
  const matchingVideos = searchResults
    .filter((result) => {
      const video = videoMap.get(result.videoId);
      return video && video.orientation === orientation;
    })
    .slice(0, maxVideos);

  if (matchingVideos.length === 0) {
    console.error(`No ${orientation} videos found matching your query`);
    process.exit(1);
  }

  // 5. Create a cluster from the search results
  console.log(`\nCreating a cluster with ${matchingVideos.length} videos...`);

  // Calculate average similarity for quality score
  const avgSimilarity =
    matchingVideos.reduce((sum, result) => sum + result.similarity, 0) /
    matchingVideos.length;

  // Lower quality score is better (0 is perfect)
  const qualityScore = 1 - avgSimilarity;

  // Create the cluster
  const newCluster: Cluster = {
    videoIds: matchingVideos.map((result) => result.videoId),
    quality: qualityScore,
    theme: clusterName,
  };

  // 6. Add to existing clusters
  console.log("\nAdding to existing clusters...");
  let clusters: ClustersData;

  try {
    // Try to load existing clusters
    clusters = loadClustersJson();
    console.log("Loaded existing clusters");
  } catch (error) {
    // Create new clusters if none exist
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

  // 7. Print a summary
  console.log("\n=== Cluster Creation Summary ===");
  console.log(`Query: "${query}"`);
  console.log(`Cluster name: "${clusterName}"`);
  console.log(`Orientation: ${orientation}`);
  console.log(`Videos in cluster: ${newCluster.videoIds.length}`);
  console.log(
    `Quality score: ${newCluster.quality.toFixed(3)} (lower is better)`
  );
  console.log(`Video IDs: ${newCluster.videoIds.join(", ")}`);

  // Print number of clusters
  const portraitCount = clusters.portrait.length;
  const landscapeCount = clusters.landscape.length;
  console.log(
    `\nTotal clusters: ${
      portraitCount + landscapeCount
    } (${portraitCount} portrait, ${landscapeCount} landscape)`
  );

  // Find the index of the new cluster
  const clusterIndex =
    orientation === "portrait"
      ? clusters.portrait.length - 1
      : clusters.landscape.length - 1;

  console.log(`\nCluster saved as ${orientation} cluster #${clusterIndex}`);
  console.log(`To create a montage from this cluster, run:`);
  console.log(
    `npx ts-node scripts/montage-from-cluster.ts ${clusterIndex} ${orientation}`
  );
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
