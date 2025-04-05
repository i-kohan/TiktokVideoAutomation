import path from "path";
import fs from "fs";
import { loadVideosJson } from "../modules/data/videos";
import { loadClustersJson } from "../modules/data/clusters";
import { VideoData } from "../modules/data/types";
import { downloadVideo } from "../modules/pexels/download";
import { trimVideo } from "../modules/montage/trim-video";
import { convertVideo } from "../modules/montage/convert-video";
import { concatVideos } from "../modules/montage/concat-videos";
import {
  TEMP_TRIMMED_DIR,
  TEMP_CONVERTED_DIR,
  MONTAGE_OUTPUT_DIR,
} from "../modules/data/constants";

// Убедиться, что директории существуют
async function ensureDirectoriesExist(): Promise<void> {
  [TEMP_TRIMMED_DIR, TEMP_CONVERTED_DIR, MONTAGE_OUTPUT_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Создает монтаж из видео в указанном кластере
 */
async function main() {
  // Загружаем кластеры и видео
  console.log("Загрузка кластеров и видео...");
  const clusters = loadClustersJson();
  const videos = loadVideosJson();

  // Получаем ориентацию из командной строки
  const orientation = process.argv[3] || "portrait";

  // Проверяем ориентацию
  if (orientation !== "portrait" && orientation !== "landscape") {
    console.error(
      "Неверная ориентация. Используйте 'portrait' или 'landscape'"
    );
    process.exit(1);
  }

  // Получаем индекс кластера из командной строки
  const clusterIndex = process.argv[2]
    ? parseInt(process.argv[2])
    : clusters[orientation].length - 1;

  console.log(
    `\n=== Создание монтажа из ${orientation} кластера #${clusterIndex} ===\n`
  );

  // Создаем карту для быстрого поиска видео
  const videoMap = new Map<number, VideoData>();
  videos.forEach((video) => videoMap.set(video.id, video));

  // Получаем кластеры для указанной ориентации
  const orientationClusters =
    orientation === "portrait" ? clusters.portrait : clusters.landscape;

  // Проверяем, есть ли кластеры
  if (!orientationClusters || orientationClusters.length === 0) {
    console.error(`Кластеры с ориентацией ${orientation} не найдены!`);
    console.error(
      "Сначала создайте кластеры с помощью 'create-search-cluster.ts' или 'cluster-videos.ts'"
    );
    process.exit(1);
  }

  // Проверяем, существует ли запрошенный кластер
  if (clusterIndex < 0 || clusterIndex >= orientationClusters.length) {
    console.error(`Индекс кластера ${clusterIndex} вне допустимого диапазона.`);
    console.error(
      `Доступные ${orientation} кластеры: ${orientationClusters.length}`
    );
    process.exit(1);
  }

  // Получаем запрошенный кластер
  const cluster = orientationClusters[clusterIndex];

  // Проверяем, есть ли в кластере видео
  if (!cluster.videoIds || cluster.videoIds.length === 0) {
    console.error(`Выбранный кластер пуст (нет видео).`);
    process.exit(1);
  }

  // Выводим информацию о кластере
  console.log(`\nКластер: ${cluster.theme || `Кластер #${clusterIndex}`}`);
  console.log(`Количество видео: ${cluster.videoIds.length}`);
  console.log(
    `Оценка качества: ${cluster.quality.toFixed(3)} (чем ниже, тем лучше)`
  );

  // Проверяем существование видео
  const validVideoIds = cluster.videoIds.filter((id: number) =>
    videoMap.has(id)
  );
  if (validVideoIds.length === 0) {
    console.error("В этом кластере не найдено действительных видео.");
    process.exit(1);
  }

  // Создаем имя выходного файла из темы кластера
  const theme = cluster.theme || `${orientation}-cluster-${clusterIndex}`;
  const cleanTheme = theme.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const outputName = `montage-${cleanTheme}`;
  const outputPath = path.join(MONTAGE_OUTPUT_DIR, `${outputName}.mp4`);

  // Выводим подробную информацию о видео в кластере
  console.log("\nВидео в этом кластере:");
  validVideoIds.forEach((id: number, index: number) => {
    const video = videoMap.get(id);
    console.log(`${index + 1}. ID: ${id}, URL: ${video?.url || "Неизвестно"}`);
  });

  // Создаем монтаж
  console.log(`\nСоздание монтажа из ${validVideoIds.length} видео...`);
  try {
    // Подготавливаем директории
    await ensureDirectoriesExist();

    // Обрабатываем каждое видео
    console.log("\n1. Подготовка видео...");

    // Скачивание и обрезка
    const trimmedVideoPaths: string[] = [];
    for (const videoId of validVideoIds) {
      const video = videoMap.get(videoId);
      if (!video) continue;

      // Выбираем видеофайл с наивысшим качеством
      const highestQualityFile = video.video_files.reduce((a, b) =>
        a.width && b.width ? (a.width > b.width ? a : b) : a
      );

      // Пути к файлам
      const trimmedPath = path.join(TEMP_TRIMMED_DIR, `trimmed_${videoId}.mp4`);

      // Скачиваем и обрезаем
      console.log(`\n📥 Скачивание видео ${videoId}...`);
      const downloadedPath = await downloadVideo(highestQualityFile.link);

      console.log(`✂️ Обрезка видео до 5 секунд: ${videoId}`);
      await trimVideo(downloadedPath, trimmedPath);

      trimmedVideoPaths.push(trimmedPath);
    }

    // Конвертация
    console.log("\n2. Конвертация видео...");
    const convertedVideoPaths: string[] = [];
    for (const trimmedPath of trimmedVideoPaths) {
      const convertedPath = path.join(
        TEMP_CONVERTED_DIR,
        `converted_${path.basename(trimmedPath)}`
      );

      console.log(`🔄 Конвертация видео: ${path.basename(trimmedPath)}`);
      await convertVideo(trimmedPath, convertedPath);

      convertedVideoPaths.push(convertedPath);
    }

    // Склейка
    console.log("\n3. Склейка видео...");
    await concatVideos(convertedVideoPaths, outputPath, MONTAGE_OUTPUT_DIR);

    console.log(`\n✅ Монтаж успешно создан: ${outputPath}`);
  } catch (error) {
    console.error("❌ Произошла ошибка при создании монтажа:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Необработанная ошибка:", error);
  process.exit(1);
});
