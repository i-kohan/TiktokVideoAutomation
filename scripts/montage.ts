import fs from "fs";
import path from "path";
import { loadClustersJson } from "../modules/data/clusters";
import {
  TEMP_TRIMMED_DIR,
  TEMP_CONVERTED_DIR,
  MONTAGE_OUTPUT_DIR,
} from "../modules/data/constants";
import { concatVideos } from "../modules/montage/concat-videos";
import { convertVideo } from "../modules/montage/convert-video";
import { trimVideo } from "../modules/montage/trim-video";
import { downloadVideo } from "../modules/pexels/download";
import { loadVideosJson } from "../modules/data/videos";

interface ProcessingPaths {
  trimmed: string[];
  converted: string[];
  final: string;
}

async function ensureDirectoryExists(dir: string): Promise<void> {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function setupDirectories(): Promise<void> {
  await Promise.all([
    ensureDirectoryExists(TEMP_TRIMMED_DIR),
    ensureDirectoryExists(TEMP_CONVERTED_DIR),
    ensureDirectoryExists(MONTAGE_OUTPUT_DIR),
  ]);
}

function selectBestClustersVideos(
  limit: number = 5,
  numClusters: number = 2
): number[][] {
  const clusters = loadClustersJson().portrait;

  if (clusters.length === 0) {
    throw new Error("No clusters found for portrait videos");
  }

  if (clusters.length < numClusters) {
    console.warn(
      `⚠️ Запрошено ${numClusters} кластеров, но найдено только ${clusters.length}`
    );
    numClusters = clusters.length;
  }

  // Выбираем лучшие кластеры (с наименьшим качеством)
  const bestClusters = clusters.slice(0, numClusters);

  return bestClusters.map((cluster, index) => {
    console.log(
      `🎯 Выбран кластер ${index + 1} с качеством: ${cluster.quality}`
    );
    return cluster.videoIds.slice(0, limit);
  });
}

async function processTrimming(videoIds: number[]): Promise<string[]> {
  const trimmedVideos: string[] = [];
  const videos = loadVideosJson();
  const videoMap = new Map(videos.map((v) => [v.id, v]));

  for (let i = 0; i < videoIds.length; i++) {
    const videoId = videoIds[i];
    const video = videoMap.get(videoId);

    if (!video) {
      console.error(`❌ Видео не найдено: ${videoId}`);
      continue;
    }

    // Get highest quality video file
    const highestQualityFile = video.video_files.reduce((a, b) =>
      a.width && b.width ? (a.width > b.width ? a : b) : a
    );

    const trimmedPath = path.join(TEMP_TRIMMED_DIR, `trimmed_${videoId}.mp4`);

    console.log(`📥 Скачивание видео: ${videoId}`);
    const filePath = await downloadVideo(highestQualityFile.link);

    console.log(`✂️ Обрезка видео до 5 секунд: ${filePath}`);
    await trimVideo(filePath, trimmedPath);
    trimmedVideos.push(trimmedPath);
  }

  return trimmedVideos;
}

async function processConversion(trimmedPaths: string[]): Promise<string[]> {
  const convertedVideos: string[] = [];

  for (let i = 0; i < trimmedPaths.length; i++) {
    const input = trimmedPaths[i];
    const output = path.join(
      TEMP_CONVERTED_DIR,
      `converted_${path.basename(input)}`
    );

    console.log(`🔄 Конвертация видео ${input}...`);
    await convertVideo(input, output);
    convertedVideos.push(output);
  }

  return convertedVideos;
}

async function createMontage(
  paths: ProcessingPaths,
  index: number
): Promise<void> {
  console.log(`🎬 Создание монтажа ${index + 1}...`);
  const outputPath = path.join(MONTAGE_OUTPUT_DIR, `final_${index + 1}.mp4`);
  await concatVideos(paths.converted, outputPath, path.dirname(outputPath));
  console.log(`✅ Монтаж ${index + 1} успешно завершен!`);
}

async function processCluster(
  videoIds: number[],
  index: number
): Promise<void> {
  console.log(`\n🔄 Обработка кластера ${index + 1}...`);
  console.log("📋 ID видео для обработки:", videoIds);

  if (videoIds.length === 0) {
    throw new Error(`No videos selected for montage ${index + 1}`);
  }

  // Пути для обработки видео
  const paths: ProcessingPaths = {
    trimmed: await processTrimming(videoIds),
    converted: [],
    final: path.join(MONTAGE_OUTPUT_DIR, `final_${index + 1}.mp4`),
  };

  // Конвертация и монтаж
  paths.converted = await processConversion(paths.trimmed);
  await createMontage(paths, index);
}

async function main() {
  try {
    // Подготовка директорий
    await setupDirectories();

    // Выбор видео из лучших кластеров
    const selectedVideoIds = selectBestClustersVideos();

    // Обработка каждого кластера
    for (let i = 0; i < selectedVideoIds.length; i++) {
      await processCluster(selectedVideoIds[i], i);
    }

    console.log("\n✨ Все монтажи успешно созданы!");
  } catch (error) {
    console.error("❌ Произошла ошибка:", error);
    process.exit(1);
  }
}

main();
