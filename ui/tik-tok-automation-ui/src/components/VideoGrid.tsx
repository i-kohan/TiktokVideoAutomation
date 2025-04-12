"use client";

import React, { useState } from "react";
import { QueryResult, SelectedVideo } from "@/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface VideoGridProps {
  results: QueryResult[];
  onCreateMontage: (selectedVideos: SelectedVideo[]) => void;
  isProcessing: boolean;
}

export default function VideoGrid({
  results,
  onCreateMontage,
  isProcessing,
}: VideoGridProps) {
  const [selectedVideos, setSelectedVideos] = useState<SelectedVideo[]>([]);
  const [montageName, setMontageName] = useState("Custom Montage");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSelectVideo = (result: QueryResult) => {
    if (!result.video) return;

    // Check if already selected
    const isSelected = selectedVideos.some((v) => v.videoId === result.videoId);

    if (isSelected) {
      // Remove if already selected
      setSelectedVideos(
        selectedVideos.filter((v) => v.videoId !== result.videoId)
      );
    } else {
      // Add to selection with next order number
      setSelectedVideos([
        ...selectedVideos,
        {
          videoId: result.videoId,
          video: result.video,
          score: result.combinedScore || result.similarity,
          order: selectedVideos.length,
        },
      ]);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      // Reorder selected videos
      const oldIndex = selectedVideos.findIndex((v) => v.videoId === active.id);
      const newIndex = selectedVideos.findIndex((v) => v.videoId === over.id);

      const newSelectedVideos = [...selectedVideos];
      const [movedItem] = newSelectedVideos.splice(oldIndex, 1);
      newSelectedVideos.splice(newIndex, 0, movedItem);

      // Update order numbers
      const updatedVideos = newSelectedVideos.map((video, index) => ({
        ...video,
        order: index,
      }));

      setSelectedVideos(updatedVideos);
    }
  };

  const handleCreateMontage = () => {
    if (selectedVideos.length > 0) {
      onCreateMontage(selectedVideos);
    }
  };

  // Sort selected videos by order for display
  const sortedSelectedVideos = [...selectedVideos].sort(
    (a, b) => a.order - b.order
  );

  return (
    <div className="space-y-8">
      {results.length > 0 ? (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Search Results
              </h3>
              <p className="text-sm text-gray-500">
                Click on videos to select them for your montage
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {results.map((result) => (
                <div
                  key={result.videoId}
                  className={`relative border rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 ${
                    selectedVideos.some((v) => v.videoId === result.videoId)
                      ? "border-indigo-500 ring-2 ring-indigo-500"
                      : "border-gray-200"
                  }`}
                  onClick={() => handleSelectVideo(result)}
                >
                  {result.video?.video_pictures?.[0]?.picture && (
                    <img
                      src={result.video.video_pictures[0].picture}
                      alt={`Video ${result.videoId}`}
                      className="w-full aspect-video object-cover"
                    />
                  )}
                  <div className="p-2 bg-white">
                    <p className="text-xs font-medium truncate">
                      ID: {result.videoId}
                    </p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        Similarity:{" "}
                        {(result.combinedScore || result.similarity).toFixed(2)}
                      </span>
                      {result.analysis && (
                        <span className="flex items-center">
                          <span
                            className="inline-block w-3 h-3 rounded-full mr-1"
                            style={{
                              backgroundColor: `rgb(${result.analysis.dominantColor.join(
                                ","
                              )})`,
                            }}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedVideos.some((v) => v.videoId === result.videoId) && (
                    <div className="absolute top-2 right-2 bg-indigo-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                      {selectedVideos.find((v) => v.videoId === result.videoId)
                        ?.order + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Selected Videos
              </h3>
              <p className="text-sm text-gray-500">
                Drag to reorder. These videos will be included in your montage.
              </p>
            </div>

            {selectedVideos.length > 0 ? (
              <div className="p-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortedSelectedVideos.map((video) => video.videoId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {sortedSelectedVideos.map((selected) => (
                        <SortableVideoItem
                          key={selected.videoId}
                          video={selected}
                          onRemove={() =>
                            handleSelectVideo({
                              videoId: selected.videoId,
                              similarity: selected.score,
                              video: selected.video,
                            })
                          }
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <div className="mt-4">
                  <label
                    htmlFor="montageName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Montage Name
                  </label>
                  <input
                    type="text"
                    id="montageName"
                    value={montageName}
                    onChange={(e) => setMontageName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={handleCreateMontage}
                  disabled={selectedVideos.length === 0 || isProcessing}
                  className="mt-4 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Creating Montage..." : "Create Montage"}
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No videos selected. Click on videos above to select them.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">Search for videos to see results here</p>
        </div>
      )}
    </div>
  );
}

interface SortableVideoItemProps {
  video: SelectedVideo;
  onRemove: () => void;
}

function SortableVideoItem({ video, onRemove }: SortableVideoItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: video.videoId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-200"
      {...attributes}
    >
      <div
        className="cursor-move mr-2 p-2 rounded hover:bg-gray-200 text-gray-500"
        {...listeners}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="flex-shrink-0 h-10 w-16 mr-3">
        {video.video?.video_pictures?.[0]?.picture && (
          <img
            src={video.video.video_pictures[0].picture}
            alt={`Video ${video.videoId}`}
            className="h-full w-full object-cover rounded"
          />
        )}
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium truncate">Order: {video.order + 1}</p>
        <p className="text-xs text-gray-500 truncate">
          ID: {video.videoId} • Score: {video.score.toFixed(2)}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="ml-2 p-1 text-gray-400 hover:text-red-500"
        title="Remove"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
