import fs from "fs";
import path from "path";

import { VideoData, AnalysisData } from "./types";

const VIDEOS_JSON = path.join(__dirname, "../../data/videos.json");
const ANALYSIS_JSON = path.join(__dirname, "../../data/analysis.json");

// Videos data
export function loadVideosJson(): VideoData[] {
  if (!fs.existsSync(VIDEOS_JSON)) return [];
  return JSON.parse(fs.readFileSync(VIDEOS_JSON, "utf-8"));
}

export function saveVideosJson(data: VideoData[]) {
  fs.writeFileSync(VIDEOS_JSON, JSON.stringify(data, null, 2));
}

// Analysis data
export function loadAnalysisJson(): AnalysisData {
  if (!fs.existsSync(ANALYSIS_JSON)) return {};
  return JSON.parse(fs.readFileSync(ANALYSIS_JSON, "utf-8"));
}

export function saveAnalysisJson(data: AnalysisData) {
  fs.writeFileSync(ANALYSIS_JSON, JSON.stringify(data, null, 2));
}
