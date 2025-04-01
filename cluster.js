import fs from "fs";

const VIDEOS_JSON = "videos.json";

// Загружаем видео
const loadVideos = () => JSON.parse(fs.readFileSync(VIDEOS_JSON, "utf-8"));

// Функция расчета дистанции
const calculateDistance = (a, b) => {
  const colorDiff = Math.sqrt(
    a.dominantColor.reduce(
      (sum, c, i) => sum + (c - b.dominantColor[i]) ** 2,
      0
    )
  );
  const brightnessDiff = Math.abs(a.brightness - b.brightness);
  return colorDiff + brightnessDiff;
};

// Простая функция кластеризации
const clusterVideos = (videos, threshold = 30) => {
  const clusters = [];
  videos.forEach((video) => {
    let added = false;
    for (const cluster of clusters) {
      if (calculateDistance(video, cluster[0]) < threshold) {
        cluster.push(video);
        added = true;
        break;
      }
    }
    if (!added) clusters.push([video]);
  });
  return clusters;
};

// Кластеризация с учетом ориентации
const clusterByOrientation = (videos, threshold) => {
  const byOrientation = {
    portrait: videos.filter((v) => v.orientation === "portrait"),
    landscape: videos.filter((v) => v.orientation === "landscape"),
  };

  return {
    portrait: clusterVideos(byOrientation.portrait, threshold),
    landscape: clusterVideos(byOrientation.landscape, threshold),
  };
};

const saveClusters = (clusters) => {
  fs.writeFileSync("clusters.json", JSON.stringify(clusters, null, 2));
};

async function main() {
  const videos = loadVideos();

  const threshold = 30; // Подбери порог, как обсуждали ранее
  const clustered = clusterByOrientation(videos, threshold);

  saveClusters(clustered);

  console.log("✅ Кластеризация с учетом ориентации завершена.");
  console.log(`📌 Портретных кластеров: ${clustered.portrait.length}`);
  console.log(`📌 Альбомных кластеров: ${clustered.landscape.length}`);
}

main().catch(console.error);
