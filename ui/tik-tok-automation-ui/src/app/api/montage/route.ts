import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { MontageRequest, MontageResponse } from "@/types";

const execAsync = promisify(exec);

// Base path to the main project
const BASE_PATH = path.resolve(process.cwd(), "..", "..");

export async function POST(request: NextRequest) {
  try {
    const params = (await request.json()) as MontageRequest;

    // Validate required parameters
    if (!params.videoIds || params.videoIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No videos selected for montage",
        },
        { status: 400 }
      );
    }

    // Create a custom cluster for these specific videos
    const createClusterPath = path.join(
      BASE_PATH,
      "data",
      "custom-cluster.json"
    );

    // First load existing clusters to copy the structure
    const clustersJsonPath = path.join(BASE_PATH, "data", "clusters.json");
    let clusters;

    try {
      const clustersJson = await fs.readFile(clustersJsonPath, "utf-8");
      clusters = JSON.parse(clustersJson);
    } catch (error) {
      // Create new structure if it doesn't exist
      clusters = {
        portrait: [],
        landscape: [],
      };
    }

    // Add a new custom cluster with the selected videos
    const newCluster = {
      videoIds: params.videoIds,
      quality: 0.2, // Just a placeholder quality score
      theme: params.name || "Custom Montage",
    };

    // Add to the appropriate orientation array
    const orientationKey = params.orientation || "portrait";
    clusters[orientationKey].push(newCluster);

    // Save the updated clusters
    await fs.writeFile(clustersJsonPath, JSON.stringify(clusters, null, 2));

    // Get the index of the new cluster
    const clusterIndex = clusters[orientationKey].length - 1;

    // Run the montage script
    const command = `cd ${BASE_PATH} && npx ts-node scripts/montage-cluster.ts ${clusterIndex} ${orientationKey}`;

    console.log(`Executing: ${command}`);

    // Run the command
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes("DeprecationWarning")) {
      console.error("Montage error:", stderr);
      return NextResponse.json(
        {
          success: false,
          message: `Error creating montage: ${stderr}`,
        },
        { status: 500 }
      );
    }

    // Look for the output file path in the command output
    const outputPathMatch = stdout.match(/Монтаж успешно создан: (.+\.mp4)/);
    const outputPath = outputPathMatch ? outputPathMatch[1] : undefined;

    const response: MontageResponse = {
      success: true,
      message: "Montage created successfully",
      outputPath,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Server error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
