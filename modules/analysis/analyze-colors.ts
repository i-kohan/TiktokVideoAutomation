import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import getColors from "get-image-colors";
import path from "path";

ffmpeg.setFfmpegPath(ffmpegPath as string);
ffmpeg.setFfprobePath(ffprobePath.path);

const extractFrame = (videoPath: string, outputPath: string, time: string) =>
  new Promise((resolve, reject) => {
    const outputDir = path.dirname(outputPath);
    const outputFilename = path.basename(outputPath);

    ffmpeg(videoPath)
      .screenshots({
        timestamps: [time],
        filename: outputFilename,
        folder: outputDir,
      })
      .on("end", () => resolve(outputPath))
      .on("error", reject);
  });

const analyzeFrame = async (framePath: string) => {
  const colors = await getColors(framePath);
  const dominantColor = colors[0].rgb();
  const brightness = dominantColor.reduce((a, b) => a + b) / 3;
  return { dominantColor, brightness };
};

export async function analyzeColors(videoPath: string) {
  const timestamps = ["10%", "50%", "90%"]; // берём кадры с начала, середины и конца
  const analyses: { dominantColor: number[]; brightness: number }[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const framePath = `${videoPath}_frame_${i}.jpg`;
    await extractFrame(videoPath, framePath, timestamps[i]);
    const analysis = await analyzeFrame(framePath);
    analyses.push(analysis);
  }

  // Средняя яркость и средний цвет по всем кадрам
  const avgBrightness =
    analyses.reduce((sum, a) => sum + a.brightness, 0) / analyses.length;
  const avgColor = analyses
    .reduce(
      (avg, a) => avg.map((v, idx) => v + a.dominantColor[idx]),
      [0, 0, 0]
    )
    .map((v) => v / analyses.length);

  return {
    videoPath,
    brightness: avgBrightness,
    dominantColor: avgColor,
    framesAnalyzed: analyses.length,
  };
}
