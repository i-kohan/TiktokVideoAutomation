import axios from "axios";
import sharp from "sharp";

const analyzeFrame = async (imageUrl: string) => {
  try {
    console.log(`Fetching image from URL: ${imageUrl}`);
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        Accept: "image/jpeg,image/png,image/gif",
      },
    });

    // Check content type
    const contentType = response.headers["content-type"];
    if (!contentType || !contentType.startsWith("image/")) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    console.log(`Analyzing image with content type: ${contentType}`);
    const buffer = Buffer.from(response.data);

    // Use sharp to analyze the image
    const image = sharp(buffer);
    const stats = await image.stats();

    // Get the dominant color from the histogram
    const dominantColor = stats.channels.map((channel) =>
      Math.round(channel.mean)
    );
    const brightness = dominantColor.reduce((a, b) => a + b) / 3 / 255; // Normalize to 0-1 range

    return { dominantColor, brightness };
  } catch (error) {
    console.error(`Error analyzing image ${imageUrl}:`, error);
    throw error;
  }
};

export async function analyzeColors(imageUrls: string[]) {
  if (imageUrls.length === 0) {
    throw new Error("No images provided for analysis");
  }

  console.log(`Starting analysis of ${imageUrls.length} images`);
  const analyses = await Promise.all(
    imageUrls.map(async (url) => {
      try {
        return await analyzeFrame(url);
      } catch (error) {
        console.error(`Failed to analyze image ${url}:`, error);
        // Return default values for failed analysis
        return {
          dominantColor: [128, 128, 128], // Gray as fallback
          brightness: 0.5,
        };
      }
    })
  );

  // Средняя яркость и средний цвет по всем кадрам
  const avgBrightness =
    analyses.reduce((sum, a) => sum + a.brightness, 0) / analyses.length;
  const avgColor = analyses
    .reduce(
      (avg, a) => avg.map((v, idx) => v + a.dominantColor[idx]),
      [0, 0, 0]
    )
    .map((v) => Math.round(v / analyses.length));

  return {
    brightness: avgBrightness,
    dominantColor: avgColor,
    framesAnalyzed: analyses.length,
  };
}
