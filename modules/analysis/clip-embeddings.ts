import axios from "axios";
import { VideoAnalysis, QueryResult } from "../data/types";

// URL for the Python CLIP service
const CLIP_SERVICE_URL =
  process.env.CLIP_SERVICE_URL || "http://localhost:5000";

/**
 * Generate embedding for a single image
 * @param imageUrl URL of the image to analyze
 * @returns Embedding vector as an array of numbers
 */
async function getImageEmbedding(imageUrl: string): Promise<number[]> {
  try {
    console.log(`Getting embedding for image: ${imageUrl}`);

    // Call the Python CLIP service
    const response = await axios.post(`${CLIP_SERVICE_URL}/encode_image`, {
      image_url: imageUrl,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get embedding: ${response.statusText}`);
    }

    return response.data.embedding;
  } catch (error) {
    console.error(`Error generating embedding for ${imageUrl}:`, error);
    throw error;
  }
}

/**
 * Check if an image contains humans using the improved Python endpoint
 * @param imageUrl URL of the image to check
 * @returns Boolean indicating if humans were detected
 */
async function detectHuman(imageUrl: string): Promise<boolean> {
  try {
    console.log(`Detecting humans in image: ${imageUrl}`);

    // Call the comprehensive human detection endpoint
    const response = await axios.post(`${CLIP_SERVICE_URL}/detect_humans`, {
      image_url: imageUrl,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to detect humans: API error`);
    }

    // Log detailed results for debugging
    if (response.data.scores) {
      const scores = response.data.scores;
      console.log(`Human vs Nature scores:`);
      console.log(`  Max human: ${scores.max_human.toFixed(3)}`);
      console.log(`  Max nature: ${scores.max_nature.toFixed(3)}`);
      console.log(`  Avg human: ${scores.avg_human.toFixed(3)}`);
      console.log(`  Avg nature: ${scores.avg_nature.toFixed(3)}`);
      console.log(`  Ratio: ${scores.ratio.toFixed(2)}`);
    }

    // Simply return the already-computed result
    return response.data.has_human;
  } catch (error) {
    console.error(`Error detecting humans in ${imageUrl}:`, error);
    return false; // Default to false on error
  }
}

/**
 * Generate embedding for a video (average of frame embeddings)
 * @param imageUrls URLs of video frames to analyze
 * @returns Object containing embedding vector and human detection result
 */
export async function generateVideoEmbedding(
  imageUrls: string[]
): Promise<{ embedding: number[]; hasHuman: boolean }> {
  console.log(`Generating embedding for ${imageUrls.length} frames`);

  // Process each frame
  const results = await Promise.all(
    imageUrls.map(async (url) => {
      try {
        const embedding = await getImageEmbedding(url);
        const hasHuman = await detectHuman(url);
        return { embedding, hasHuman };
      } catch (error) {
        console.error(`Failed to process frame ${url}:`, error);
        // Skip this frame rather than using zeroes
        throw error;
      }
    })
  );

  // Filter out failed frames
  const validResults = results.filter(
    (r) => r && r.embedding && r.embedding.length > 0
  );

  if (validResults.length === 0) {
    throw new Error("No valid frames could be processed");
  }

  // Average the embeddings
  const embeddingSize = validResults[0].embedding.length;
  const avgEmbedding = Array(embeddingSize).fill(0);

  for (const result of validResults) {
    for (let i = 0; i < embeddingSize; i++) {
      avgEmbedding[i] += result.embedding[i] / validResults.length;
    }
  }

  // Count human frames
  const humanFrameCount = validResults.filter((r) => r.hasHuman).length;
  const humanPercentage = humanFrameCount / validResults.length;

  // Consider a video to have humans if at least 40% of frames have humans
  // This is more conservative than before (60%) since our per-frame detection is stricter
  const hasHuman = humanPercentage > 0.4;

  // Additional logging to help with debugging
  console.log(
    `Human frames: ${humanFrameCount}/${validResults.length} (${(
      humanPercentage * 100
    ).toFixed(1)}%)`
  );
  console.log(`Video contains humans: ${hasHuman ? "YES" : "NO"}`);

  return {
    embedding: avgEmbedding,
    hasHuman,
  };
}

/**
 * Calculate cosine similarity between two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Similarity score between 0 and 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get text embedding for a search query
 * @param text Text to encode
 * @returns Embedding vector as an array of numbers
 */
async function getTextEmbedding(text: string): Promise<number[]> {
  try {
    console.log(`Getting embedding for text: "${text}"`);

    // Call the Python CLIP service
    const response = await axios.post(`${CLIP_SERVICE_URL}/encode_text`, {
      text: text,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get text embedding: ${response.statusText}`);
    }

    return response.data.embedding;
  } catch (error) {
    console.error(`Error generating text embedding for "${text}":`, error);
    throw error;
  }
}

/**
 * Search videos by text query
 * @param text Natural language search query
 * @param analysisData Analysis data for all videos
 * @param filterHumans Whether to filter out videos containing humans
 * @param topK Number of results to return
 * @returns Array of search results with video IDs and similarity scores
 */
export async function searchVideosByText(
  text: string,
  analysisData: { [videoId: number]: VideoAnalysis },
  filterHumans: boolean = true,
  topK: number = 20
): Promise<QueryResult[]> {
  console.log(`Searching for videos matching: "${text}"`);

  // Get embedding for the search query
  const queryEmbedding = await getTextEmbedding(text);

  // Calculate similarity for each video
  const results: QueryResult[] = [];

  for (const [videoIdStr, analysis] of Object.entries(analysisData)) {
    const videoId = Number(videoIdStr);

    // Skip videos without embeddings
    if (!analysis.embedding) continue;

    // Skip videos with humans if requested
    if (filterHumans && analysis.hasHuman) continue;

    // Calculate similarity
    const similarity = cosineSimilarity(queryEmbedding, analysis.embedding);

    results.push({ videoId, similarity });
  }

  // Sort by similarity (highest first) and take top K
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}
