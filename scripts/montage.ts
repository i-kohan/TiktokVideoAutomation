import { loadClustersJson } from "../modules/data/clusters";
import { concatVideos } from "../modules/montage/concat-videos";
import { convertVideo } from "../modules/montage/convert-video";
import { trimVideo } from "../modules/montage/trim-video";

async function main() {
  const clusters = loadClustersJson().portrait;
  clusters.sort((a, b) => b.length - a.length);
  const bestCluster = clusters[0];

  const selectedVideos = bestCluster.slice(0, 5).map((v) => v.filePath);
  console.log("Видео для обработки и склейки:", selectedVideos);

  const trimmedVideos: string[] = [];
  for (let i = 0; i < selectedVideos.length; i++) {
    const input = selectedVideos[i];
    const trimmedPath = `temp/trimmed_${i}.mp4`;

    console.log(`✂️ Обрезка видео до 5 секунд: ${input}`);
    await trimVideo(input, trimmedPath);

    trimmedVideos.push(trimmedPath);
  }

  // Конвертируем видео перед склейкой
  const convertedVideos: string[] = [];
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
