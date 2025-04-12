# TikTok Video Montage Creator UI

A web interface for creating TikTok-ready video montages by selecting and arranging videos based on semantic search and visual coherence.

## Features

- Search for videos using natural language queries
- Use related prompts to refine search results
- Filter by similarity threshold for better matches
- View video thumbnails with their similarity scores and dominant colors
- Select and reorder videos for your montage
- Create and download video montages

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- The main TikTok Automation project running (backend)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open your browser to [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter a primary search query (e.g., "ocean sunset")
2. Optionally add related prompts (e.g., "golden hour,beach sunset") to refine results
3. Select an orientation (portrait for TikTok)
4. Click "Search Videos"
5. Select videos you want to include in your montage
6. Drag to reorder the selected videos if needed
7. Click "Create Montage"
8. Download the finished montage

## Configuration

The UI connects to the main TikTok Automation backend through API routes that execute the CLI commands from the main project.

See `src/app/api/search/route.ts` and `src/app/api/montage/route.ts` for implementation details.

## Project Structure

- `/src/app/` - Next.js app directory
- `/src/app/api/` - API routes to connect with backend
- `/src/components/` - React components
- `/src/types/` - TypeScript type definitions

## Technologies Used

- Next.js 14
- React 19
- TailwindCSS
- dnd-kit for drag and drop
- Axios for API requests

## License

This project is licensed under the MIT License.
