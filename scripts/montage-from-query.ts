import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { searchVideosByText } from "../modules/analysis/clip-embeddings";
import { loadAnalysisJson, loadVideosJson } from "../modules/data/videos";
import { saveClustersJson } from "../modules/data/clusters";
import { VideoData, Cluster, ClustersData } from "../modules/data/types";

// Define the montage-from-cluster script path
const MONTAGE_FROM_CLUSTER_SCRIPT = path.join(
  __dirname,
  "montage-from-cluster.ts"
);

const execPromise = promisify(exec);

/**
 * Run a TypeScript script with arguments
 */
async function runScript(
  scriptPath: string,
  args: string[] = []
): Promise<void> {
  const command = `npx ts-node "${scriptPath}" ${args.join(" ")}`;
  console.log(`Running: ${command}`);

  try {
    const { stdout, stderr } = await execPromise(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error: any) {
    console.error(`Error running script: ${error.message}`);
    throw error;
  }
}

async function main() {
  // 1. Get query and orientation from command line
  const query = process.argv[2];
  const orientation = process.argv[3] || "portrait";

  if (!query) {
    console.error("Please provide a search query as the first argument");
    console.error(
      "Example: npx ts-node scripts/montage-from-query.ts 'forest with fog' portrait"
    );
    process.exit(1);
  }

  if (orientation !== "portrait" && orientation !== "landscape") {
    console.error("Invalid orientation. Use 'portrait' or 'landscape'");
    process.exit(1);
  }

  console.log(
    `\n=== Creating montage for query: "${query}" (${orientation}) ===\n`
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
    .slice(0, 5); // Top 5 videos

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
  const cluster: Cluster = {
    videoIds: matchingVideos.map((result) => result.videoId),
    quality: qualityScore,
    theme: query,
  };

  // Save as a temporary clusters file
  const clustersData: ClustersData = {
    portrait: orientation === "portrait" ? [cluster] : [],
    landscape: orientation === "landscape" ? [cluster] : [],
  };

  console.log("Saving temporary cluster...");
  saveClustersJson(clustersData);

  // 6. Generate montage from the cluster
  console.log("\nGenerating montage...");
  try {
    await runScript(MONTAGE_FROM_CLUSTER_SCRIPT, [
      "0", // First cluster (index 0)
      orientation,
    ]);

    console.log(`\n✅ Montage created successfully for query: "${query}"`);
  } catch (error) {
    console.error("Failed to create montage:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
