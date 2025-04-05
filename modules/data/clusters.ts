import fs from "fs";
import path from "path";

import { CLUSTERS_JSON } from "./constants";
import { ClustersData } from "./types";

export function loadClustersJson(
  filePath: string = CLUSTERS_JSON
): ClustersData {
  if (!fs.existsSync(filePath)) {
    return { portrait: [], landscape: [] };
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function saveClustersJson(
  data: ClustersData,
  filePath: string = CLUSTERS_JSON
) {
  // Ensure directory exists
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
