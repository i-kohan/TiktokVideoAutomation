import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import fs from "fs";
import path from "path";

ffmpeg.setFfmpegPath(ffmpegPath as string);
ffmpeg.setFfprobePath(ffprobePath.path);

// Склейка заранее подготовленных видео с использованием фильтра concat
export async function concatVideos(
  videoPaths: string[],
  output = "final.mp4",
  outputDir: string
): Promise<string> {
  // Проверяем, что все видеофайлы существуют
  for (const videoPath of videoPaths) {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Файл не существует: ${videoPath}`);
    }
  }

  if (videoPaths.length === 0) {
    throw new Error("Не переданы видео для склейки");
  }

  console.log(`📦 Склеиваем ${videoPaths.length} видео в ${output}`);

  // Создаем временный файл списка видео для concat demuxer
  const listFile = path.join(outputDir, "concat_list.txt");
  const fileContent = videoPaths
    .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
    .join("\n");

  fs.writeFileSync(listFile, fileContent);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listFile)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions("-c copy") // Copy streams without re-encoding for speed
      .on("start", (commandLine) => {
        console.log(`🎬 Запуск FFmpeg: ${commandLine}`);
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          console.log(`⏳ Прогресс: ${Math.round(progress.percent)}%`);
        }
      })
      .on("error", (err) => {
        console.error("❌ Ошибка FFmpeg:", err.message);
        // Удаляем временный файл списка
        try {
          fs.unlinkSync(listFile);
        } catch (e) {
          // Игнорируем ошибки при удалении
        }
        reject(err);
      })
      .on("end", () => {
        console.log(`✅ Видео успешно объединены в ${output}`);

        // Удаляем временный файл списка
        try {
          fs.unlinkSync(listFile);
        } catch (e) {
          // Игнорируем ошибки при удалении
        }

        resolve(output);
      })
      .save(output);
  });
}
