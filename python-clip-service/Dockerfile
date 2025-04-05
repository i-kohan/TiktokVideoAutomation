FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install CLIP
RUN pip install --no-cache-dir git+https://github.com/openai/CLIP.git

# Copy application code
COPY clip_service.py .
COPY test_clip_service.py .

# Create model cache directory
RUN mkdir -p models

# Expose the port
EXPOSE 5000

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["python", "clip_service.py"] 