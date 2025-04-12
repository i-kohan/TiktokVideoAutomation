# TikTok Video Automation

This project provides tools for creating TikTok-ready video montages by:

1. Fetching videos from Pexels API
2. Analyzing videos for semantic content and visual properties
3. Clustering similar videos together
4. Creating montages from the best clusters

## Setup

1. Install dependencies:

```bash
npm install
```

2. Run the Python CLIP service:

```bash
cd python-clip-service
pip install -r requirements.txt
python clip_service.py
```

## Usage

### 1. Fetch videos

```bash
npx ts-node scripts/fetch-videos.ts
```

Searches for videos matching a query and saves them to your local database.

### 2. Generate embeddings

```bash
npx ts-node scripts/generate-embeddings.ts
```

Creates CLIP embeddings for all fetched videos, which enable semantic searching.

### 3. Analyze video colors

```bash
npx ts-node scripts/analyze-videos.ts
```

Extracts color information (dominant color and brightness) from all videos.

### 4. Create video clusters

You have two options:

#### Option A: Basic clustering

```bash
npx ts-node scripts/create-search-cluster.ts "forest fog" portrait 5 "Foggy Forest"
```

Arguments:

- Search query: What to search for
- Orientation: "portrait" or "landscape"
- Max videos: Maximum number of videos in the cluster
- Cluster name: Name for the cluster

#### Option B: Enhanced clustering (recommended)

```bash
npx ts-node scripts/enhanced-search-cluster.ts "forest fog" "misty woods,morning fog" portrait 5 "Foggy Forest" 0.8
```

Arguments:

- Primary query: Main search term
- Related prompts: Comma-separated list of related terms (no spaces between terms)
- Orientation: "portrait" or "landscape"
- Max videos: Maximum number of videos in the cluster
- Cluster name: Name for the cluster
- Minimum similarity: Threshold for including videos (0.0-1.0, higher is more strict)

The enhanced clustering provides better results by:

- Using multiple related prompts to find videos that match a more specific concept
- Filtering by minimum similarity threshold to ensure strong matches
- Matching videos by color and brightness for visual coherence

### 5. Create a montage

```bash
npx ts-node scripts/montage-cluster.ts 0 portrait
```

Arguments:

- Cluster index: The index of the cluster to use
- Orientation: "portrait" or "landscape"

This will download, trim, convert and combine the videos in the specified cluster into a montage suitable for TikTok.

## Project Structure

This project consists of two main parts:

1. **Python CLIP Service**: A REST API service that provides video analysis using OpenAI's CLIP model
2. **TypeScript TikTok Automation**: The main application for creating video montages

## Prerequisites

- Node.js 14+ and npm
- Python 3.7+ (for the CLIP service)
- Docker and Docker Compose (optional, but recommended)

## Getting Started

### Step 1: Set Up the CLIP Service

The CLIP service is located in the `python-clip-service` directory. You can run it using Docker:

```bash
cd python-clip-service
docker-compose up -d
```

Or run it directly with Python:

```bash
cd python-clip-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install git+https://github.com/openai/CLIP.git
python clip_service.py
```

See the [CLIP Service README](python-clip-service/README.md) for more details.

### Step 2: Install Node.js Dependencies

```bash
npm install
```

### Step 3: Generate Embeddings for Videos

First, fetch videos from Pexels (if you haven't already):

```bash
npx ts-node scripts/fetch-videos.ts
```

Then, generate embeddings for all videos:

```bash
npx ts-node scripts/generate-embeddings.ts
```

This will:

- Process each video
- Generate CLIP embeddings
- Analyze colors
- Detect human presence
- Store all analysis in your `analysis.json` file

### Step 4: Search Videos by Theme

Search your video collection using natural language:

```bash
npx ts-node scripts/search-videos.ts "foggy mountain landscape"
```

### Step 5: Create Themed Montages

Create montages directly from a search query:

```bash
npx ts-node scripts/montage-cluster.ts "forest with sunlight" portrait
```

## Example Searches

You can search for videos using natural language descriptions like:

- "Peaceful ocean waves"
- "Foggy mountain landscape"
- "Abstract colorful patterns"
- "Serene forest with sunlight through trees"
- "Rainy urban streets with neon reflections"

## How It Works

This project uses CLIP (Contrastive Language-Image Pretraining) to understand the semantic meaning of both images and text. By creating embeddings for videos and then comparing them to text descriptions, we can find videos that match specific moods or atmospheres.

The process works as follows:

1. Each video is processed to extract frame images
2. CLIP generates embeddings for each frame
3. The embeddings are averaged to create a video embedding
4. When searching, your text query is converted to an embedding
5. Videos are ranked by similarity to your query
6. The most similar videos are selected for the montage

## Environment Variables

- `CLIP_SERVICE_URL`: URL of the CLIP service (default: http://localhost:5000)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
