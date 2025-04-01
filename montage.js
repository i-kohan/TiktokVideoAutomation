import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

const CLUSTERS_JSON = "clusters.json";

function loadClusters() {
  return JSON.parse(fs.readFileSync(CLUSTERS_JSON, "utf-8"));
}

const trimVideo = (input, output, duration = 5) =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(input, (err, metadata) => {
      if (err) return reject(err);

      const originalDuration = metadata.format.duration;
      const finalDuration = Math.min(duration, originalDuration);

      ffmpeg(input)
        .setStartTime(0)
        .setDuration(finalDuration)
        .outputOptions(["-c copy"]) // сохраняем качество оригинала
        .save(output)
        .on("end", () => resolve(output))
        .on("error", reject);
    });
  });

// Конвертируем видео к одному формату
function convertVideo(input, output) {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .outputOptions([
        "-c:v libx264",
        "-c:a aac",
        "-vf scale=1080:1920,setsar=1:1,fps=30",
        "-preset fast",
        "-crf 18",
      ])
      .save(output)
      .on("end", () => resolve(output))
      .on("error", reject);
  });
}

// Склейка заранее подготовленных видео
async function concatVideos(videoPaths, output = "final.mp4") {
  return new Promise((resolve, reject) => {
    const merged = ffmpeg();

    videoPaths.forEach((path) => merged.input(path));

    merged
      .on("error", reject)
      .on("end", () => {
        console.log(`Видео успешно объединены в ${output}`);
        resolve(output);
      })
      .mergeToFile(output, "./temp");
  });
}

async function main() {
  const clusters = loadClusters().portrait;
  clusters.sort((a, b) => b.length - a.length);
  const bestCluster = clusters[0];

  const selectedVideos = bestCluster.slice(0, 5).map((v) => v.filePath);
  console.log("Видео для обработки и склейки:", selectedVideos);

  const trimmedVideos = [];
  for (let i = 0; i < selectedVideos.length; i++) {
    const input = selectedVideos[i];
    const trimmedPath = `temp/trimmed_${i}.mp4`;

    console.log(`✂️ Обрезка видео до 5 секунд: ${input}`);
    await trimVideo(input, trimmedPath);

    trimmedVideos.push(trimmedPath);
  }

  // Конвертируем видео перед склейкой
  const convertedVideos = [];
  for (let i = 0; i < trimmedVideos.length; i++) {
    const input = trimmedVideos[i];
    const output = `temp/converted_${i}.mp4`;
    console.log(`Конвертация видео ${input}...`);
    await convertVideo(input, output);
    convertedVideos.push(output);
  }
  // Теперь склеиваем конвертированные видео
  await concatVideos(convertedVideos, "final.mp4");
}

main().catch(console.error);
