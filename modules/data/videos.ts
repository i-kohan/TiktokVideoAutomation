import fs from "fs";

import { VIDEOS_JSON } from "./constants";
import { VideoData } from "./types";

export function loadVideosJson(): VideoData[] {
  if (!fs.existsSync(VIDEOS_JSON)) return [];
  return JSON.parse(fs.readFileSync(VIDEOS_JSON, "utf-8"));
}

export function saveVideosJson(data: VideoData[]) {
  fs.writeFileSync(VIDEOS_JSON, JSON.stringify(data, null, 2));
}
