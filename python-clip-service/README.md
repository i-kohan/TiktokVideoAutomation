# CLIP API Service

This is a Python-based REST API service that provides CLIP (Contrastive Language-Image Pretraining) functionality for the TikTok Automation project.

## Features

- Generate embeddings for images
- Generate embeddings for text
- Calculate similarity between images and text
- Detect humans in images

## Installation

### Option 1: Docker (Recommended)

The easiest way to run the service is with Docker:

```bash
# Build and start the service
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Option 2: Manual Installation

If you prefer to run without Docker:

1. Create a Python virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
pip install git+https://github.com/openai/CLIP.git
```

3. Run the service:

```bash
python clip_service.py
```

## Testing

To verify the service is working correctly:

```bash
# Run all tests
python test_clip_service.py

# Or run specific tests
python test_clip_service.py health
python test_clip_service.py text
python test_clip_service.py image
python test_clip_service.py human
python test_clip_service.py similarity
```

## API Endpoints

### Health Check

- **URL**: `/health`
- **Method**: `GET`
- **Response**: Status information about the service

### Encode Image

- **URL**: `/encode_image`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "image_url": "https://example.com/image.jpg",
    "detect_humans": false
  }
  ```
  or
  ```json
  {
    "image_base64": "base64_encoded_image_data",
    "detect_humans": false
  }
  ```
- **Response**: Embedding vector and optional human detection

### Encode Text

- **URL**: `/encode_text`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "text": "a beautiful sunset over mountains"
  }
  ```
- **Response**: Embedding vector for the text

### Calculate Similarity

- **URL**: `/similarity`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "image_url": "https://example.com/image.jpg",
    "text": "a beautiful sunset over mountains"
  }
  ```
- **Response**: Similarity score between the image and text

## Environment Variables

- `HOST`: Host to bind the service to (default: 0.0.0.0)
- `PORT`: Port to run the service on (default: 5000)
- `DEBUG`: Enable Flask debug mode, set to "true" to enable (default: false)
- `MODEL_NAME`: CLIP model to use (default: ViT-B/32, options include ViT-B/16, RN50, etc.)
- `MODEL_CACHE_DIR`: Directory to cache model files (default: models)
- `CUDA_VISIBLE_DEVICES`: Set to "" to force CPU usage

## GPU Support

The service will automatically use a GPU if available. To run on CPU instead, set the environment variable:

```bash
export CUDA_VISIBLE_DEVICES=""
```

Or in docker-compose.yml:

```yaml
environment:
  - CUDA_VISIBLE_DEVICES=""
```
