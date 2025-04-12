import { cosineSimilarity } from "../modules/analysis/clip-embeddings";
import { loadAnalysisJson, loadVideosJson } from "../modules/data/videos";
import { VideoData } from "../modules/data/types";
import fs from "fs";
import path from "path";

// Video IDs from the last cluster in clusters.json
const videoIds = [
  28870591, 29549015, 28870593, 28870590, 28870585, 28870587, 28870592,
  29308780, 28870600, 28870598,
];

// Test query
const testQuery = "majestic mountain peaks aerial view";

// Create a dummy query embedding (512-dimensional vector with some non-zero values)
const dummyQueryEmbedding = Array(512)
  .fill(0)
  .map((_, i) => {
    // Create some non-zero values in a pattern
    if (i % 10 === 0) return 0.1;
    if (i % 7 === 0) return -0.05;
    if (i % 3 === 0) return 0.02;
    return 0;
  });

// Load clusters.json
function loadClustersJson() {
  const filePath = path.join(process.cwd(), "data", "clusters.json");
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  }
  return [];
}

// Get embedding stats and sample values
function getEmbeddingStats(embedding: number[] | undefined): string {
  if (!embedding || !Array.isArray(embedding)) {
    return "Invalid embedding (undefined or not an array)";
  }

  const length = embedding.length;
  const sum = embedding.reduce((acc, val) => acc + Math.abs(val), 0);
  const nonZeroCount = embedding.filter((v) => v !== 0).length;
  const min = Math.min(...embedding);
  const max = Math.max(...embedding);
  const avg = sum / length;

  // Get some sample values
  const samples = embedding.slice(0, 10).map((v) => v.toFixed(6));

  return `Stats: length=${length}, sum=${sum.toFixed(
    6
  )}, nonZero=${nonZeroCount}, min=${min.toFixed(6)}, max=${max.toFixed(
    6
  )}, avg=${avg.toFixed(6)}\nSamples: [${samples.join(", ")}${
    length > 10 ? ", ..." : ""
  }]`;
}

// Calculate cosine similarity with detailed debugging
function debugCosineSimilarity(
  a: number[],
  b: number[]
): { similarity: number; debug: string } {
  if (!a || !b) {
    return { similarity: 0, debug: "One or both embeddings are missing" };
  }

  if (a.length !== b.length) {
    return {
      similarity: 0,
      debug: `Embedding lengths don't match: ${a.length} vs ${b.length}`,
    };
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  const sampleProducts: number[] = [];

  for (let i = 0; i < a.length; i++) {
    const product = a[i] * b[i];
    if (i < 10) {
      sampleProducts.push(product);
    }

    dotProduct += product;
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const sqrtNormA = Math.sqrt(normA);
  const sqrtNormB = Math.sqrt(normB);

  if (normA === 0)
    return { similarity: 0, debug: "First embedding has zero norm" };
  if (normB === 0)
    return { similarity: 0, debug: "Second embedding has zero norm" };

  const similarity = dotProduct / (sqrtNormA * sqrtNormB);

  const debug = `
  Dot product: ${dotProduct.toFixed(6)}
  Norm A: ${sqrtNormA.toFixed(6)}
  Norm B: ${sqrtNormB.toFixed(6)}
  Sample products: [${sampleProducts.map((p) => p.toFixed(6)).join(", ")}${
    a.length > 10 ? ", ..." : ""
  }]
  Final similarity: ${similarity.toFixed(6)}
  `;

  return { similarity, debug };
}

// Check if a video is in the latest cluster
function isInLatestCluster(videoId: number, clusters: any[]): boolean {
  if (!clusters || clusters.length === 0) return false;
  const latestCluster = clusters[clusters.length - 1];
  if (!latestCluster || !latestCluster.videos) return false;
  return latestCluster.videos.some((v: any) => v.videoId === videoId);
}

// Main function
async function main() {
  try {
    console.log("Starting script...");

    console.log("Loading data...");
    const analysisData = loadAnalysisJson();
    console.log(
      `Loaded analysis data for ${Object.keys(analysisData).length} videos`
    );

    const videos = loadVideosJson();
    console.log(`Loaded ${videos.length} videos`);

    const clusters = loadClustersJson();
    console.log(`Loaded ${clusters.length} clusters`);

    const videoMap = new Map<number, VideoData>();
    videos.forEach((video) => videoMap.set(video.id, video));
    console.log(`Created video map with ${videoMap.size} entries`);

    console.log(`Using dummy query embedding for: "${testQuery}"`);
    console.log(
      `Dummy embedding stats: ${getEmbeddingStats(dummyQueryEmbedding)}`
    );

    // Latest cluster info
    const latestCluster =
      clusters.length > 0 ? clusters[clusters.length - 1] : null;
    if (latestCluster) {
      console.log(`\n=== Latest Cluster Info ===`);
      console.log(`Name: ${latestCluster.name}`);
      console.log(`Query: ${latestCluster.query}`);
      console.log(`Video count: ${latestCluster.videos?.length || 0}`);
    }

    let nonZeroCount = 0;
    let zeroCount = 0;

    // Debug each video
    for (const videoId of videoIds) {
      console.log(`\nProcessing video ${videoId}...`);

      const analysis = analysisData[videoId];
      if (!analysis) {
        console.log(`ERROR: No analysis data found for video ${videoId}`);
        continue;
      }

      const video = videoMap.get(videoId);
      if (!video) {
        console.log(`ERROR: Video ${videoId} not found in videos.json`);
        continue;
      }

      console.log(`URL: ${video.url}`);
      console.log(`Dimensions: ${video.width}x${video.height}`);
      console.log(`Duration: ${video.duration}s`);

      // Check if the video has an embedding
      if (!analysis.embedding) {
        console.log(
          `ERROR: No embedding found in analysis data for video ${videoId}`
        );
        zeroCount++;
        continue;
      }

      console.log(`Embedding stats: ${getEmbeddingStats(analysis.embedding)}`);

      // Calculate similarity with detailed debugging
      const { similarity, debug } = debugCosineSimilarity(
        dummyQueryEmbedding,
        analysis.embedding
      );
      console.log(`Similarity calculation details: ${debug}`);

      if (similarity === 0) {
        console.log(`WARNING: Zero similarity detected for video ${videoId}`);
        zeroCount++;
      } else {
        console.log(
          `OK: Non-zero similarity (${similarity.toFixed(
            6
          )}) for video ${videoId}`
        );
        nonZeroCount++;
      }
    }

    console.log("\n=== SUMMARY ===");
    console.log(`Total videos checked: ${videoIds.length}`);
    console.log(`Videos with non-zero similarity: ${nonZeroCount}`);
    console.log(`Videos with zero similarity: ${zeroCount}`);
  } catch (error) {
    console.error("Script failed with error:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
}

main();
