"use client";

import { useState } from "react";
import type { SearchParams } from "../types";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [params, setParams] = useState<SearchParams>({
    primaryQuery: "",
    relatedPrompts: "",
    orientation: "portrait",
    maxVideos: 20,
    minSimilarity: 0.0,
    filterHumans: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(params);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (name === "maxVideos" || name === "minSimilarity") {
      setParams((prev) => ({
        ...prev,
        [name]: parseFloat(value),
      }));
    } else if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setParams((prev) => ({
        ...prev,
        [name]: target.checked,
      }));
    } else {
      setParams((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 bg-white rounded-lg shadow"
    >
      <div>
        <label
          htmlFor="primaryQuery"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Primary Search Query
        </label>
        <input
          type="text"
          id="primaryQuery"
          name="primaryQuery"
          value={params.primaryQuery}
          onChange={handleChange}
          placeholder="e.g., 'ocean sunset'"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div>
        <label
          htmlFor="relatedPrompts"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Related Prompts (comma-separated)
        </label>
        <input
          type="text"
          id="relatedPrompts"
          name="relatedPrompts"
          value={params.relatedPrompts}
          onChange={handleChange}
          placeholder="e.g., 'beach sunset,golden hour,ocean view'"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Separate related prompts with commas, no spaces between commas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="orientation"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Orientation
          </label>
          <select
            id="orientation"
            name="orientation"
            value={params.orientation}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="maxVideos"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Max Videos
          </label>
          <input
            type="number"
            id="maxVideos"
            name="maxVideos"
            value={params.maxVideos}
            onChange={handleChange}
            min="2"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="minSimilarity"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Min Similarity
          </label>
          <input
            type="number"
            id="minSimilarity"
            name="minSimilarity"
            value={params.minSimilarity}
            onChange={handleChange}
            min="0.0"
            max="1.0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Minimum similarity score (0.0 to 1.0). 1.0 means perfect match, 0.0
            means no similarity. Try lower values (0.1-0.3) if you&apos;re not
            getting results with higher values.
          </p>
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="filterHumans"
          name="filterHumans"
          checked={params.filterHumans}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label
          htmlFor="filterHumans"
          className="ml-2 block text-sm text-gray-900"
        >
          Filter out videos with humans
        </label>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Searching..." : "Search Videos"}
        </button>
      </div>
    </form>
  );
}
