import { Video as PexelsVideo } from "pexels";

export interface VideoData extends PexelsVideo {
  filePath: string;
  orientation: "landscape" | "portrait";
  analysisData: {
    brightness: number;
    dominantColor: number[];
  };
}

export type ClustersData = {
  portrait: VideoData[][];
  landscape: VideoData[][];
};
