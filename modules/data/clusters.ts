import fs from "fs";

import { CLUSTERS_JSON } from "./constants";
import { ClustersData } from "./types";

export function loadClustersJson(): ClustersData {
  return JSON.parse(fs.readFileSync(CLUSTERS_JSON, "utf-8"));
}

export function saveClustersJson(data: ClustersData) {
  fs.writeFileSync(CLUSTERS_JSON, JSON.stringify(data, null, 2));
}
