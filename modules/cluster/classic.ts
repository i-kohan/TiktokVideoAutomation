import { ClustersData, VideoData } from "../data/types";

// Функция расчета дистанции
function calculateDistance(a: VideoData, b: VideoData) {
  const colorDiff = Math.sqrt(
    a.analysisData.dominantColor.reduce(
      (sum, c, i) => sum + (c - b.analysisData.dominantColor[i]) ** 2,
      0
    )
  );
  const brightnessDiff = Math.abs(
    a.analysisData.brightness - b.analysisData.brightness
  );
  return colorDiff + brightnessDiff;
}

// Простая функция кластеризации
function clusterVideos(videos: VideoData[], threshold = 30): VideoData[][] {
  const clusters: VideoData[][] = [];
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
}

// Кластеризация с учетом ориентации
export function clusterByOrientation(
  videos: VideoData[],
  threshold = 30
): ClustersData {
  const byOrientation = {
    portrait: videos.filter((v) => v.orientation === "portrait"),
    landscape: videos.filter((v) => v.orientation === "landscape"),
  };

  return {
    portrait: clusterVideos(byOrientation.portrait, threshold),
    landscape: clusterVideos(byOrientation.landscape, threshold),
  };
}
