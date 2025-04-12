export interface VideoData {
  id: number;
  url: string;
  orientation: "portrait" | "landscape";
  video_pictures?: {
    picture: string;
  }[];
}

export interface SearchParams {
  primaryQuery: string;
  relatedPrompts: string;
  orientation: "portrait" | "landscape";
  maxVideos: number;
  minSimilarity: number;
  filterHumans: boolean;
}

export interface QueryResult {
  videoId: number;
  similarity: number;
  video?: VideoData;
  analysis?: {
    dominantColor: [number, number, number];
    brightness: number;
    hasHuman?: boolean;
  };
}

export interface SearchResponse {
  results: QueryResult[];
  message: string;
}

export interface MontageRequest {
  videoIds: number[];
  name?: string;
  orientation?: "portrait" | "landscape";
}

export interface MontageResponse {
  success: boolean;
  message: string;
  outputPath?: string;
}
