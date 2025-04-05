import { loadVideosJson, loadAnalysisJson } from "../modules/data/videos";
import { saveClustersJson } from "../modules/data/clusters";
import { VideoData, ClustersData } from "../modules/data/types";
import { cosineSimilarity } from "../modules/analysis/clip-embeddings";

// Maximum number of clusters to create per orientation
const MAX_CLUSTERS = 5;
// Maximum number of videos per cluster
const MAX_VIDEOS_PER_CLUSTER = 5;

/**
 * Cluster videos by semantic similarity using a simplified K-means approach
 * @param videos Array of videos to cluster
 * @param analysisData Analysis data containing embeddings
 * @param orientation Orientation of videos to cluster ('portrait' or 'landscape')
 * @returns Array of clusters with video IDs and quality scores
 */
function clusterVideosByEmbedding(
  videos: VideoData[],
  analysisData: any,
  orientation: "portrait" | "landscape"
) {
  // Filter videos by orientation and make sure they have embeddings
  const filteredVideos = videos.filter(
    (video) =>
      video.orientation === orientation &&
      analysisData[video.id]?.embedding &&
      !analysisData[video.id]?.hasHuman // Optional: filter out videos with humans
  );

  console.log(`Clustering ${filteredVideos.length} ${orientation} videos...`);

  if (filteredVideos.length === 0) {
    console.log(`No ${orientation} videos found with embeddings`);
    return [];
  }

  // If we have 5 or fewer videos, just create one cluster
  if (filteredVideos.length <= MAX_VIDEOS_PER_CLUSTER) {
    return [
      {
        videoIds: filteredVideos.map((v) => v.id),
        quality: 0, // Best quality
        theme: `${orientation} videos`,
      },
    ];
  }

  // Initialize clusters with random centroids from the videos
  const clusterCount = Math.min(
    MAX_CLUSTERS,
    Math.floor(filteredVideos.length / 2)
  );

  // Shuffle videos to get random initial centroids
  const shuffled = [...filteredVideos];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Take first N as initial centroids
  const initialCentroids = shuffled
    .slice(0, clusterCount)
    .map((video) => analysisData[video.id].embedding);

  // Initialize clusters
  let clusters = initialCentroids.map((centroid, index) => ({
    centroid,
    videoIds: [] as number[], // Explicitly define as number array to fix TypeScript error
    quality: 0,
    theme: `${orientation} cluster ${index + 1}`,
  }));

  // K-means iterations (simplified)
  for (let iteration = 0; iteration < 5; iteration++) {
    // Reset video assignments
    clusters.forEach((cluster) => (cluster.videoIds = []));

    // Assign each video to the nearest centroid
    for (const video of filteredVideos) {
      const embedding = analysisData[video.id].embedding;

      // Find closest centroid
      let bestClusterIndex = 0;
      let bestSimilarity = -1;

      for (let i = 0; i < clusters.length; i++) {
        const similarity = cosineSimilarity(embedding, clusters[i].centroid);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestClusterIndex = i;
        }
      }

      // Assign to best cluster
      clusters[bestClusterIndex].videoIds.push(video.id);
    }

    // Update centroids
    for (const cluster of clusters) {
      if (cluster.videoIds.length === 0) continue;

      // Average all embeddings in the cluster
      const embeddingSize = analysisData[cluster.videoIds[0]].embedding.length;
      const newCentroid = Array(embeddingSize).fill(0);

      for (const videoId of cluster.videoIds) {
        const embedding = analysisData[videoId].embedding;
        for (let i = 0; i < embeddingSize; i++) {
          newCentroid[i] += embedding[i] / cluster.videoIds.length;
        }
      }

      cluster.centroid = newCentroid;
    }
  }

  // Calculate quality for each cluster (average similarity to centroid)
  for (const cluster of clusters) {
    if (cluster.videoIds.length === 0) {
      cluster.quality = 1; // Worst quality for empty clusters
      continue;
    }

    // Calculate average similarity to centroid
    let totalSimilarity = 0;
    for (const videoId of cluster.videoIds) {
      const similarity = cosineSimilarity(
        analysisData[videoId].embedding,
        cluster.centroid
      );
      totalSimilarity += similarity;
    }

    const avgSimilarity = totalSimilarity / cluster.videoIds.length;
    cluster.quality = 1 - avgSimilarity; // Convert to our quality metric (lower is better)
  }

  // Sort clusters by quality (best first)
  clusters.sort((a, b) => a.quality - b.quality);

  // Filter out empty clusters
  clusters = clusters.filter((c) => c.videoIds.length > 0);

  // Limit number of videos per cluster to the best ones
  for (const cluster of clusters) {
    if (cluster.videoIds.length <= MAX_VIDEOS_PER_CLUSTER) continue;

    // Calculate similarity of each video to the centroid
    const videosWithSimilarity = cluster.videoIds.map((videoId) => {
      const similarity = cosineSimilarity(
        analysisData[videoId].embedding,
        cluster.centroid
      );
      return { videoId, similarity };
    });

    // Sort by similarity (highest first) and take top MAX_VIDEOS_PER_CLUSTER
    videosWithSimilarity.sort((a, b) => b.similarity - a.similarity);
    cluster.videoIds = videosWithSimilarity
      .slice(0, MAX_VIDEOS_PER_CLUSTER)
      .map((v) => v.videoId);
  }

  return clusters;
}

async function main() {
  // Load data
  console.log("Loading videos and analysis data...");
  const videos = loadVideosJson();
  const analysisData = loadAnalysisJson();

  console.log(`Loaded ${videos.length} videos`);

  // Create clusters for portrait and landscape
  const portraitClusters = clusterVideosByEmbedding(
    videos,
    analysisData,
    "portrait"
  );
  const landscapeClusters = clusterVideosByEmbedding(
    videos,
    analysisData,
    "landscape"
  );

  // Create clusters data
  const clustersData: ClustersData = {
    portrait: portraitClusters,
    landscape: landscapeClusters,
  };

  // Save clusters
  console.log("Saving clusters...");
  saveClustersJson(clustersData);

  // Print summary
  console.log("\n=== Clustering Summary ===");
  console.log(`Created ${portraitClusters.length} portrait clusters`);
  portraitClusters.forEach((cluster, i) => {
    console.log(
      `  Portrait Cluster ${i + 1}: ${
        cluster.videoIds.length
      } videos, quality: ${cluster.quality.toFixed(3)}`
    );
  });

  console.log(`Created ${landscapeClusters.length} landscape clusters`);
  landscapeClusters.forEach((cluster, i) => {
    console.log(
      `  Landscape Cluster ${i + 1}: ${
        cluster.videoIds.length
      } videos, quality: ${cluster.quality.toFixed(3)}`
    );
  });

  console.log(
    "\nClustering complete! Run 'npx ts-node scripts/montage-from-cluster.ts' to create montages"
  );
}

main().catch(console.error);
