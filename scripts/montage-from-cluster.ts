import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { loadClustersJson } from "../modules/data/clusters";
import { loadVideosJson } from "../modules/data/videos";
import { VideoData } from "../modules/data/types";

// Define the montage script path
const MONTAGE_SCRIPT_PATH = path.join(__dirname, "montage.ts");

const execPromise = promisify(exec);

// Function to run a script
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
  // Get optional cluster index and orientation from command line
  const clusterIndex = parseInt(process.argv[2]) || 0; // Default to first cluster
  const orientation = (process.argv[3] || "portrait") as
    | "portrait"
    | "landscape";

  // Validate orientation
  if (orientation !== "portrait" && orientation !== "landscape") {
    console.error("Invalid orientation. Use 'portrait' or 'landscape'");
    process.exit(1);
  }

  console.log(
    `Generating montage for ${orientation} cluster #${clusterIndex + 1}`
  );

  // Load data
  console.log("Loading clusters and videos...");
  const clusters = loadClustersJson();
  const videos = loadVideosJson();

  // Create a map for quick video lookup
  const videoMap = new Map<number, VideoData>();
  videos.forEach((video) => videoMap.set(video.id, video));

  // Get the specified orientation clusters
  const orientationClusters = clusters[orientation];

  if (orientationClusters.length === 0) {
    console.error(`No ${orientation} clusters found!`);
    console.error("Run 'cluster-videos.ts' first to create clusters");
    process.exit(1);
  }

  // If cluster index is out of range, use the first one
  const actualIndex =
    clusterIndex < orientationClusters.length ? clusterIndex : 0;
  const targetCluster = orientationClusters[actualIndex];

  if (!targetCluster || targetCluster.videoIds.length === 0) {
    console.error(`Cluster #${clusterIndex + 1} is empty or doesn't exist`);
    console.error(`Available clusters: ${orientationClusters.length}`);
    process.exit(1);
  }

  // Get video IDs from the cluster
  const videoIds = targetCluster.videoIds;
  console.log(
    `Using cluster with ${
      videoIds.length
    } videos, quality score: ${targetCluster.quality.toFixed(3)}`
  );

  // Verify videos exist
  const validVideoIds = videoIds.filter((id: number) => videoMap.has(id));
  if (validVideoIds.length === 0) {
    console.error("No valid videos found in this cluster");
    process.exit(1);
  }

  // Create output filename
  const theme =
    targetCluster.theme || `${orientation}-cluster-${actualIndex + 1}`;
  const cleanTheme = theme.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const outputName = `montage-${cleanTheme}`;

  // Run montage script with these IDs
  console.log(`Creating montage with ${validVideoIds.length} videos`);

  try {
    // Construct arguments for montage script
    const args = [
      `--ids=${validVideoIds.join(",")}`,
      `--output=${outputName}`,
      `--orientation=${orientation}`,
    ];

    await runScript(MONTAGE_SCRIPT_PATH, args);
    console.log(`Montage created successfully: ${outputName}.mp4`);
  } catch (error: any) {
    console.error("Failed to create montage:", error);
    process.exit(1);
  }
}

main().catch((error: any) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
