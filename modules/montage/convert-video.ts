import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";

ffmpeg.setFfmpegPath(ffmpegPath as string);
ffmpeg.setFfprobePath(ffprobePath.path);

// Конвертируем видео к одному формату
export function convertVideo(input: string, output: string) {
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
