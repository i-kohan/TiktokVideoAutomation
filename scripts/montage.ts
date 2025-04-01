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
import { VideoData } from "../modules/data/types";

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

function selectBestClusterVideos(limit: number = 5): VideoData[] {
  const clusters = loadClustersJson().portrait;
  clusters.sort((a, b) => b.length - a.length);
  return clusters[0].slice(0, limit);
}

async function processTrimming(videos: VideoData[]): Promise<string[]> {
  const trimmedVideos: string[] = [];

  for (let i = 0; i < videos.length; i++) {
    const input = videos[i].filePath;
    const trimmedPath = path.join(TEMP_TRIMMED_DIR, `trimmed_${i}.mp4`);

    console.log(`✂️ Обрезка видео до 5 секунд: ${input}`);
    await trimVideo(input, trimmedPath);
    trimmedVideos.push(trimmedPath);
  }

  return trimmedVideos;
}

async function processConversion(trimmedPaths: string[]): Promise<string[]> {
  const convertedVideos: string[] = [];

  for (let i = 0; i < trimmedPaths.length; i++) {
    const input = trimmedPaths[i];
    const output = path.join(TEMP_CONVERTED_DIR, `converted_${i}.mp4`);

    console.log(`🔄 Конвертация видео ${input}...`);
    await convertVideo(input, output);
    convertedVideos.push(output);
  }

  return convertedVideos;
}

async function createMontage(paths: ProcessingPaths): Promise<void> {
  console.log("🎬 Создание финального монтажа...");
  await concatVideos(paths.converted, paths.final, path.dirname(paths.final));
  console.log("✅ Монтаж успешно завершен!");
}

async function main() {
  // Подготовка директорий
  await setupDirectories();

  // Выбор лучших видео из кластера
  const selectedVideos = selectBestClusterVideos();
  console.log(
    "📋 Видео для обработки и склейки:",
    selectedVideos.map((v) => v.filePath)
  );

  // Пути для обработки видео
  const paths: ProcessingPaths = {
    trimmed: await processTrimming(selectedVideos),
    converted: [],
    final: path.join(MONTAGE_OUTPUT_DIR, "final.mp4"),
  };

  // Конвертация и монтаж
  paths.converted = await processConversion(paths.trimmed);
  await createMontage(paths);
}

main().catch((error) => {
  console.error("❌ Произошла ошибка:", error);
  process.exit(1);
});
