# TikTok Automation with Semantic Analysis

A project for creating TikTok-style montages based on semantic similarity in video atmosphere, mood, and content.

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
npx ts-node scripts/montage-from-query.ts "forest with sunlight" portrait
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
# TiktokVideoAutomation
