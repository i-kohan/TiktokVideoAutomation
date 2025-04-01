import { clusterByOrientation } from "../modules/cluster/classic";
import { loadVideosJson } from "../modules/data/videos";
import { saveClustersJson } from "../modules/data/clusters";

async function main() {
  const videos = loadVideosJson();

  const threshold = 30; // Подбери порог, как обсуждали ранее
  const clustered = clusterByOrientation(videos, threshold);

  saveClustersJson(clustered);

  console.log("✅ Кластеризация с учетом ориентации завершена.");
  console.log(`📌 Портретных кластеров: ${clustered.portrait.length}`);
  console.log(`📌 Альбомных кластеров: ${clustered.landscape.length}`);
}

main().catch(console.error);
