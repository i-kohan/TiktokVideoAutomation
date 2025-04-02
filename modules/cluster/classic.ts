import {
  ClustersData,
  VideoData,
  VideoAnalysis,
  AnalysisData,
  Cluster,
} from "../data/types";

const MAX_CLUSTER_SIZE = 5;
const QUALITY_THRESHOLD = 0.03; // Stricter threshold for better quality
const MAX_CLUSTERS = 20; // Limit total number of clusters
const MIN_CLUSTER_DISTANCE = 0.1; // Minimum distance between cluster centers

// Функция расчета дистанции с учетом разных масштабов значений
function calculateDistance(a: VideoAnalysis, b: VideoAnalysis): number {
  // Нормализуем цветовые компоненты к диапазону 0-1
  const colorDiff = Math.sqrt(
    a.dominantColor.reduce(
      (sum: number, c: number, i: number) =>
        sum + ((c - b.dominantColor[i]) / 255) ** 2,
      0
    )
  );

  // Яркость уже нормализована к 0-1
  const brightnessDiff = Math.abs(a.brightness - b.brightness);

  // Комбинируем с весами для баланса между цветом и яркостью
  return colorDiff * 0.7 + brightnessDiff * 0.3;
}

// Расчет качества кластера (среднее расстояние между всеми видео)
function calculateClusterQuality(
  videoIds: number[],
  analysisData: AnalysisData
): number {
  let totalDistance = 0;
  let pairCount = 0;

  for (let i = 0; i < videoIds.length; i++) {
    for (let j = i + 1; j < videoIds.length; j++) {
      totalDistance += calculateDistance(
        analysisData[videoIds[i]],
        analysisData[videoIds[j]]
      );
      pairCount++;
    }
  }

  return pairCount > 0 ? totalDistance / pairCount : 0;
}

// Проверка на дубликаты кластеров
function isDuplicateCluster(
  cluster: Cluster,
  existingClusters: Cluster[]
): boolean {
  const sortedIds = [...cluster.videoIds].sort((a, b) => a - b);
  return existingClusters.some((existing) => {
    const existingSorted = [...existing.videoIds].sort((a, b) => a - b);
    return JSON.stringify(sortedIds) === JSON.stringify(existingSorted);
  });
}

// Проверка минимального расстояния до существующих кластеров
function isTooCloseToExisting(
  cluster: Cluster,
  existingClusters: Cluster[],
  analysisData: AnalysisData
): boolean {
  return existingClusters.some((existing) => {
    const distance = calculateDistance(
      analysisData[cluster.videoIds[0]], // Используем первый элемент как центр кластера
      analysisData[existing.videoIds[0]]
    );
    return distance < MIN_CLUSTER_DISTANCE;
  });
}

// Простая функция кластеризации с улучшенным порогом
function clusterVideos(
  videos: VideoData[],
  analysisData: AnalysisData,
  threshold = QUALITY_THRESHOLD
): Cluster[] {
  const clusters: Cluster[] = [];

  // Сортируем видео по качеству их ближайших соседей
  const sortedVideos = videos
    .map((video) => {
      const distances = videos
        .map((otherVideo) => ({
          id: otherVideo.id,
          distance: calculateDistance(
            analysisData[video.id],
            analysisData[otherVideo.id]
          ),
        }))
        .sort((a, b) => a.distance - b.distance);

      const closestVideos = distances
        .slice(0, MAX_CLUSTER_SIZE)
        .map((d) => d.id);

      return {
        video,
        quality: calculateClusterQuality(closestVideos, analysisData),
      };
    })
    .sort((a, b) => a.quality - b.quality);

  // Создаем кластеры, начиная с лучших видео
  for (const { video, quality } of sortedVideos) {
    if (clusters.length >= MAX_CLUSTERS) break;

    const distances = videos
      .map((otherVideo) => ({
        id: otherVideo.id,
        distance: calculateDistance(
          analysisData[video.id],
          analysisData[otherVideo.id]
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

    const closestVideos = distances.slice(0, MAX_CLUSTER_SIZE).map((d) => d.id);

    const cluster: Cluster = {
      videoIds: closestVideos,
      quality,
    };

    // Добавляем кластер только если:
    // 1. Его качество лучше порога
    // 2. Это не дубликат существующего кластера
    // 3. Он достаточно далеко от существующих кластеров
    if (
      cluster.quality <= threshold &&
      !isDuplicateCluster(cluster, clusters) &&
      !isTooCloseToExisting(cluster, clusters, analysisData)
    ) {
      clusters.push(cluster);
    }
  }

  return clusters.sort((a, b) => a.quality - b.quality);
}

// Кластеризация с учетом ориентации
export function clusterByOrientation(
  videos: VideoData[],
  analysisData: AnalysisData,
  threshold = QUALITY_THRESHOLD
): ClustersData {
  const byOrientation = {
    portrait: videos.filter((v) => v.orientation === "portrait"),
    landscape: videos.filter((v) => v.orientation === "landscape"),
  };

  return {
    portrait: clusterVideos(byOrientation.portrait, analysisData, threshold),
    landscape: clusterVideos(byOrientation.landscape, analysisData, threshold),
  };
}
