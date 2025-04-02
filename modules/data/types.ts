import { Video as PexelsVideo } from "pexels";

// Video data from Pexels
export interface VideoData extends PexelsVideo {
  orientation: "portrait" | "landscape";
}

// Analysis data for a single video
export interface VideoAnalysis {
  brightness: number;
  dominantColor: [number, number, number];
}

// All analysis data stored as object with videoId as keys
export type AnalysisData = {
  [videoId: number]: VideoAnalysis;
};

// Single cluster with quality score
export interface Cluster {
  videoIds: number[];
  quality: number; // Lower is better (closer to 0 means better color match)
}

// Clusters of video IDs with quality scores
export interface ClustersData {
  portrait: Cluster[];
  landscape: Cluster[];
}
