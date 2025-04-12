"use client";

import { useState } from "react";
import { SearchParams } from "@/types";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [params, setParams] = useState<SearchParams>({
    primaryQuery: "",
    relatedPrompts: "",
    orientation: "portrait",
    maxVideos: 10,
    minSimilarity: 0.3,
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
    const { name, value } = e.target;

    if (name === "maxVideos" || name === "minSimilarity") {
      setParams({
        ...params,
        [name]: parseFloat(value),
      });
    } else {
      setParams({
        ...params,
        [name]: value,
      });
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
            max="20"
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
            min="0.1"
            max="0.9"
            step="0.05"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
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
