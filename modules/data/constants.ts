import path from "path";

export const VIDEOS_DIR = path.join(__dirname, "../../data/videos");
export const FRAMES_DIR = path.join(__dirname, "../../data/frames");

export const VIDEOS_JSON = path.join(__dirname, "../../data/videos.json");
export const CLUSTERS_JSON = path.join(__dirname, "../../data/clusters.json");

// Montage-specific paths
export const TEMP_TRIMMED_DIR = path.join(__dirname, "../../data/temp/trimmed");
export const TEMP_CONVERTED_DIR = path.join(
  __dirname,
  "../../data/temp/converted"
);
export const MONTAGE_OUTPUT_DIR = path.join(__dirname, "../../data/montage");
