import { VideoData } from "../modules/data/types";
import { loadVideosJson, saveVideosJson } from "../modules/data/videos";
import { searchVideos } from "../modules/pexels/search";

const query = "forest fog esthetic";
const videosCount = 10;
const page = 1;

async function main() {
  const existingVideos = loadVideosJson();
  const existingIds = existingVideos.map((v: VideoData) => v.id);

  const searchResult = await searchVideos(query, {
    perPage: videosCount,
    page,
    orientation: "portrait",
  });

  if ("error" in searchResult) {
    console.error(searchResult.error);
    return;
  }

  for (const video of searchResult.videos) {
    if (existingIds.includes(video.id)) {
      console.log(`Видео уже добавлено: ${video.id}`);
      continue;
    }

    const videoData: VideoData = {
      ...video,
      orientation: video.width > video.height ? "landscape" : "portrait",
    };

    existingVideos.push(videoData);
    console.log("Видео добавлено в JSON:", videoData);
  }

  saveVideosJson(existingVideos);
}

main().catch(console.error);
