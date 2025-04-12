import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { SearchParams, SearchResponse } from "@/types";

const execAsync = promisify(exec);

// Base path to the main project
const BASE_PATH = path.resolve(process.cwd(), "..", "..");

// Path to load videos and analysis data
const VIDEOS_JSON_PATH = path.join(BASE_PATH, "data", "videos.json");
const ANALYSIS_JSON_PATH = path.join(BASE_PATH, "data", "analysis.json");

export async function POST(request: NextRequest) {
  try {
    const params = (await request.json()) as SearchParams;

    // Validate required parameters
    if (!params.primaryQuery) {
      return NextResponse.json(
        {
          results: [],
          message: "Primary query is required",
        },
        { status: 400 }
      );
    }

    // Format the related prompts for the command
    const relatedPromptsArg = params.relatedPrompts
      ? params.relatedPrompts.replace(/\s+/g, "")
      : "";

    // Execute the enhanced search cluster script but redirect output
    // We'll parse the results ourselves from JSON files
    const scriptPath = path.join(
      BASE_PATH,
      "scripts",
      "enhanced-search-cluster.ts"
    );

    // Build the command
    const command = `cd ${BASE_PATH} && npx ts-node ${scriptPath} "${
      params.primaryQuery
    }" "${relatedPromptsArg}" ${params.orientation} ${
      params.maxVideos || 10
    } "temp-search" ${params.minSimilarity || 0.3}`;

    console.log(`Executing: ${command}`);

    // Run the command
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes("DeprecationWarning")) {
      console.error("Search error:", stderr);
      return NextResponse.json(
        {
          results: [],
          message: `Error executing search: ${stderr}`,
        },
        { status: 500 }
      );
    }

    // Now load the videos and analysis data directly
    const videosJson = await fs.readFile(VIDEOS_JSON_PATH, "utf-8");
    const analysisJson = await fs.readFile(ANALYSIS_JSON_PATH, "utf-8");

    const videos = JSON.parse(videosJson);
    const analysis = JSON.parse(analysisJson);

    // Load the clusters json to get the latest results
    const clustersJsonPath = path.join(BASE_PATH, "data", "clusters.json");
    const clustersJson = await fs.readFile(clustersJsonPath, "utf-8");
    const clusters = JSON.parse(clustersJson);

    // Get the most recently added cluster from the correct orientation
    const latestCluster =
      clusters[params.orientation][clusters[params.orientation].length - 1];

    if (!latestCluster) {
      return NextResponse.json(
        {
          results: [],
          message: "No results found",
        },
        { status: 404 }
      );
    }

    // Extract output from the command and parse the results
    const commandOutput = stdout.toString();
    console.log("Command output:", commandOutput);

    // Map the cluster results to the format expected by the UI
    const results = latestCluster.videoIds.map(
      (videoId: number, index: number) => {
        // Find the video in the videos array
        const video = videos.find((v: any) => v.id === videoId);

        // Look for the similarity in the command output
        // This is a bit of a hack, but it works for now
        const semanticScoreMatch = commandOutput.match(
          new RegExp(`Video ${videoId}.*?Semantic Score: (0\\.\\d+)`, "s")
        );
        const combinedScoreMatch = commandOutput.match(
          new RegExp(`Video ${videoId}.*?Combined Score: (0\\.\\d+)`, "s")
        );

        const semanticScore = semanticScoreMatch
          ? parseFloat(semanticScoreMatch[1])
          : 0;
        const combinedScore = combinedScoreMatch
          ? parseFloat(combinedScoreMatch[1])
          : 0;

        return {
          videoId,
          similarity: semanticScore,
          semanticScore,
          combinedScore,
          video,
          analysis: analysis[videoId],
        };
      }
    );

    return NextResponse.json({
      results,
      message: `Found ${results.length} videos matching your query`,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        results: [],
        message: `Server error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
