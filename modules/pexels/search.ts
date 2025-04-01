import { createClient } from "pexels";
import dotenv from "dotenv";

dotenv.config();

const client = createClient(process.env.PEXELS_API_KEY || "");

export async function searchVideos(
  query: string,
  options: {
    perPage: number;
    page: number;
    orientation: string;
  }
) {
  return client.videos.search({
    query,
    per_page: options.perPage,
    orientation: options.orientation,
    page: options.page,
  });
}
