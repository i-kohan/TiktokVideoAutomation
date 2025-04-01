import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import getColors from "get-image-colors";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

const extractFrame = (videoPath, outputPath, time) =>
  new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({ timestamps: [time], filename: outputPath })
      .on("end", () => resolve(outputPath))
      .on("error", reject);
  });

const analyzeFrame = async (framePath) => {
  const colors = await getColors(framePath);
  const dominantColor = colors[0].rgb();
  const brightness = dominantColor.reduce((a, b) => a + b) / 3;
  return { dominantColor, brightness };
};

export const analyzeVideoDeep = async (videoPath) => {
  const timestamps = ["10%", "50%", "90%"]; // берём кадры с начала, середины и конца
  const analyses = [];

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
};
