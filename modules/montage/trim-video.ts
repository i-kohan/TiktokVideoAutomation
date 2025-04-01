import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";

ffmpeg.setFfmpegPath(ffmpegPath as string);
ffmpeg.setFfprobePath(ffprobePath.path);

export function trimVideo(input: string, output: string, duration = 5) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(input, (err, metadata) => {
      if (err) return reject(err);

      const originalDuration = metadata.format.duration;
      const finalDuration = Math.min(duration, originalDuration ?? 0);

      ffmpeg(input)
        .setStartTime(0)
        .setDuration(finalDuration)
        .outputOptions(["-c copy"]) // сохраняем качество оригинала
        .save(output)
        .on("end", () => resolve(output))
        .on("error", reject);
    });
  });
}
