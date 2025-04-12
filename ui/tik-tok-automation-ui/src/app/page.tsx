"use client";

import { useState } from "react";
import SearchForm from "@/components/SearchForm";
import VideoGrid from "@/components/VideoGrid";
import {
  SearchParams,
  SearchResponse,
  QueryResult,
  SelectedVideo,
  MontageResponse,
  ProcessingStatus,
} from "@/types";
import axios from "axios";

export default function Home() {
  const [searchResults, setSearchResults] = useState<QueryResult[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: "idle",
  });
  const [montageResult, setMontageResult] = useState<MontageResponse | null>(
    null
  );

  const handleSearch = async (params: SearchParams) => {
    try {
      setProcessingStatus({
        status: "searching",
        message: "Searching for videos...",
      });

      const response = await axios.post<SearchResponse>("/api/search", params);

      setSearchResults(response.data.results);
      setProcessingStatus({
        status: "idle",
      });
    } catch (error) {
      console.error("Search error:", error);
      setProcessingStatus({
        status: "error",
        message: axios.isAxiosError(error)
          ? `Error: ${error.response?.data?.message || error.message}`
          : "An unknown error occurred",
      });
    }
  };

  const handleCreateMontage = async (selectedVideos: SelectedVideo[]) => {
    try {
      setProcessingStatus({
        status: "processing",
        message: "Creating montage...",
      });

      const videoIds = selectedVideos.map((video) => video.videoId);

      // Get the orientation from the first video
      const orientation = selectedVideos[0]?.video?.orientation || "portrait";

      const response = await axios.post<MontageResponse>("/api/montage", {
        videoIds,
        name: "Custom Montage",
        orientation,
      });

      setMontageResult(response.data);
      setProcessingStatus({
        status: "complete",
        message: "Montage created successfully!",
      });
    } catch (error) {
      console.error("Montage error:", error);
      setProcessingStatus({
        status: "error",
        message: axios.isAxiosError(error)
          ? `Error: ${error.response?.data?.message || error.message}`
          : "An unknown error occurred",
      });
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              TikTok Video Montage Creator
            </h1>
            <p className="mt-2 text-gray-600">
              Search for videos, select the ones you like, and create a
              TikTok-ready montage
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <SearchForm
                onSearch={handleSearch}
                isLoading={processingStatus.status === "searching"}
              />

              {/* Status/Message display */}
              {processingStatus.status !== "idle" && (
                <div
                  className={`mt-4 p-4 rounded-md ${
                    processingStatus.status === "error"
                      ? "bg-red-50 text-red-700"
                      : processingStatus.status === "complete"
                      ? "bg-green-50 text-green-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  <p className="text-sm font-medium">
                    {processingStatus.status === "searching" && "🔍 "}
                    {processingStatus.status === "processing" && "⚙️ "}
                    {processingStatus.status === "complete" && "✅ "}
                    {processingStatus.status === "error" && "❌ "}
                    {processingStatus.message}
                  </p>

                  {/* Show montage download link if available */}
                  {processingStatus.status === "complete" &&
                    montageResult?.outputPath && (
                      <div className="mt-2">
                        <a
                          href={`/montages/${montageResult.outputPath
                            .split("/")
                            .pop()}`}
                          download
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Download Montage
                        </a>
                      </div>
                    )}
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              <VideoGrid
                results={searchResults}
                onCreateMontage={handleCreateMontage}
                isProcessing={processingStatus.status === "processing"}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
