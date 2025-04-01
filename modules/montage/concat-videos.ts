import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";

ffmpeg.setFfmpegPath(ffmpegPath as string);
ffmpeg.setFfprobePath(ffprobePath.path);

// Склейка заранее подготовленных видео
export async function concatVideos(
  videoPaths: string[],
  output = "final.mp4",
  outputDir: string
) {
  return new Promise((resolve, reject) => {
    const merged = ffmpeg();

    videoPaths.forEach((path) => merged.input(path));

    merged
      .on("error", reject)
      .on("end", () => {
        console.log(`Видео успешно объединены в ${output}`);
        resolve(output);
      })
      .mergeToFile(output, outputDir);
  });
}
