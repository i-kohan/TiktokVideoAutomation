import { Video as PexelsVideo } from "pexels";

// Video data from Pexels
export interface VideoData extends PexelsVideo {
  orientation: "portrait" | "landscape";
}

// Analysis data for a single video
export interface VideoAnalysis {
  brightness?: number;
  dominantColor?: [number, number, number];
  embedding?: number[]; // CLIP embedding vector
  hasHuman?: boolean; // Whether humans were detected
}

// All analysis data stored as object with videoId as keys
export type AnalysisData = {
  [videoId: number]: VideoAnalysis;
};

// Single cluster with quality score
export interface Cluster {
  videoIds: number[];
  quality: number; // Lower is better (closer to 0 means better color match)
  theme?: string; // Theme of the cluster (if created from a text query)
}

// Clusters of video IDs with quality scores
export interface ClustersData {
  portrait: Cluster[];
  landscape: Cluster[];
}

// Query result for semantic search
export interface QueryResult {
  videoId: number;
  similarity: number; // 0-1 score, higher is more similar
}
