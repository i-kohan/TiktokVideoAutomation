// Video data from Pexels
export interface VideoData {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: {
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }[];
  video_pictures: {
    id: number;
    picture: string;
    nr: number;
  }[];
  orientation: "portrait" | "landscape";
}

// Analysis data for a single video
export interface VideoAnalysis {
  brightness: number;
  dominantColor: [number, number, number];
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
  combinedScore?: number; // Combined semantic + visual score
  semanticScore?: number; // Original semantic score
}

// UI-specific types
export interface SearchParams {
  primaryQuery: string;
  relatedPrompts: string;
  orientation: "portrait" | "landscape";
  maxVideos: number;
  minSimilarity: number;
}

export interface SearchResponse {
  results: (QueryResult & {
    video?: VideoData;
    analysis?: VideoAnalysis;
  })[];
  message?: string;
}

export interface SelectedVideo {
  videoId: number;
  video: VideoData;
  score: number;
  order: number;
}

export interface MontageRequest {
  videoIds: number[];
  name: string;
  orientation: "portrait" | "landscape";
}

export interface MontageResponse {
  success: boolean;
  message: string;
  outputPath?: string;
}

export interface ProcessingStatus {
  status: "idle" | "searching" | "processing" | "complete" | "error";
  message?: string;
  progress?: number;
}
