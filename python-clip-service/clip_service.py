import torch
import clip
import os
import base64
from io import BytesIO
from PIL import Image
from flask import Flask, request, jsonify
import numpy as np
import requests

app = Flask(__name__)

# Load environment variables with defaults
HOST = os.environ.get('HOST', '0.0.0.0')
PORT = int(os.environ.get('PORT', 5000))
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
MODEL_NAME = os.environ.get('MODEL_NAME', 'ViT-B/32')
MODEL_CACHE_DIR = os.environ.get('MODEL_CACHE_DIR', 'models')

# Check if CUDA is available and set device
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Make sure the model cache directory exists
os.makedirs(MODEL_CACHE_DIR, exist_ok=True)

# Load the CLIP model
model, preprocess = clip.load(MODEL_NAME, device=device)
print(f"Model loaded: {MODEL_NAME}")

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        "status": "ok",
        "model": MODEL_NAME,
        "device": device,
        "config": {
            "host": HOST,
            "port": PORT,
            "debug": DEBUG,
            "model_cache_dir": MODEL_CACHE_DIR
        }
    })

@app.route('/detect_humans', methods=['POST'])
def detect_humans_endpoint():
    """Comprehensive human detection endpoint that makes better decisions"""
    if 'image_url' not in request.json and 'image_base64' not in request.json:
        return jsonify({"error": "No image provided"}), 400
    
    try:
        # Get image
        if 'image_url' in request.json:
            response = requests.get(request.json['image_url'])
            image = Image.open(BytesIO(response.content)).convert('RGB')
        else:
            image_data = base64.b64decode(request.json['image_base64'])
            image = Image.open(BytesIO(image_data)).convert('RGB')
        
        # Process the image
        image_input = preprocess(image).unsqueeze(0).to(device)
        
        # Define prompts for different categories
        human_prompts = [
            "a clear photo of a human person",
            "a photo showing a person's full body",
            "a person standing in the foreground",
            "humans walking in the scene",
            "a close-up photo of a human face",
        ]
        
        nature_prompts = [
            "a nature scene without any people",
            "an empty landscape",
            "mountains with no humans present",
            "a forest with no people",
            "an uninhabited beach",
        ]
        
        # Prepare all prompts
        all_prompts = human_prompts + nature_prompts
        text_tokens = clip.tokenize(all_prompts).to(device)
        
        # Get similarities for all prompts
        with torch.no_grad():
            logits_per_image, _ = model(image_input, text_tokens)
            similarities = logits_per_image.softmax(dim=-1).cpu().numpy()[0]
        
        # Get scores for human and nature categories
        human_scores = similarities[:len(human_prompts)]
        nature_scores = similarities[len(human_prompts):]
        
        # Calculate metrics
        max_human_score = float(np.max(human_scores))
        max_nature_score = float(np.max(nature_scores))
        avg_human_score = float(np.mean(human_scores))
        avg_nature_score = float(np.mean(nature_scores))
        
        # Apply multiple criteria for human detection
        ratio = avg_human_score / avg_nature_score if avg_nature_score > 0 else 999
        
        # Determine if humans are present using strict criteria
        has_human = (
            max_human_score > 0.65 and  # High confidence in human presence
            avg_human_score > avg_nature_score * 1.25  # Human scores significantly higher than nature
        )
        
        # Return detailed results for transparency
        return jsonify({
            "has_human": bool(has_human),
            "scores": {
                "max_human": max_human_score,
                "max_nature": max_nature_score,
                "avg_human": avg_human_score,
                "avg_nature": avg_nature_score,
                "ratio": ratio
            },
            "human_prompts": [
                {"prompt": prompt, "score": float(score)} 
                for prompt, score in zip(human_prompts, human_scores)
            ],
            "nature_prompts": [
                {"prompt": prompt, "score": float(score)} 
                for prompt, score in zip(nature_prompts, nature_scores)
            ]
        })
    
    except Exception as e:
        print(f"Error in detect_humans: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to detect humans: {str(e)}"}), 500

@app.route('/encode_image', methods=['POST'])
def encode_image():
    """Encode an image to CLIP embedding"""
    if 'image_url' in request.json:
        # Download image from URL
        url = request.json['image_url']
        try:
            response = requests.get(url)
            image = Image.open(BytesIO(response.content)).convert('RGB')
        except Exception as e:
            return jsonify({"error": f"Failed to download image: {str(e)}"}), 400
    elif 'image_base64' in request.json:
        # Decode base64 image
        try:
            image_data = base64.b64decode(request.json['image_base64'])
            image = Image.open(BytesIO(image_data)).convert('RGB')
        except Exception as e:
            return jsonify({"error": f"Failed to decode image: {str(e)}"}), 400
    else:
        return jsonify({"error": "No image provided. Send either image_url or image_base64"}), 400

    # Process the image
    try:
        # Preprocess and encode
        image_input = preprocess(image).unsqueeze(0).to(device)
        with torch.no_grad():
            image_features = model.encode_image(image_input)
        
        # Convert to normalized numpy array
        image_embedding = image_features.cpu().numpy()[0].tolist()
        
        result = {
            "embedding": image_embedding,
            "dimensions": len(image_embedding)
        }
            
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Failed to process image: {str(e)}"}), 500

@app.route('/encode_text', methods=['POST'])
def encode_text():
    """Encode text to CLIP embedding"""
    if 'text' not in request.json:
        return jsonify({"error": "No text provided"}), 400
    
    text = request.json['text']
    
    try:
        # Tokenize and encode
        text_tokens = clip.tokenize([text]).to(device)
        with torch.no_grad():
            text_features = model.encode_text(text_tokens)
        
        # Convert to normalized numpy array
        text_embedding = text_features.cpu().numpy()[0].tolist()
        
        return jsonify({
            "embedding": text_embedding,
            "dimensions": len(text_embedding)
        })
    except Exception as e:
        return jsonify({"error": f"Failed to process text: {str(e)}"}), 500

@app.route('/similarity', methods=['POST'])
def calculate_similarity():
    """Calculate similarity between image and text"""
    if 'image_url' not in request.json and 'image_base64' not in request.json:
        return jsonify({"error": "No image provided"}), 400
    
    if 'text' not in request.json:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        # Get image
        if 'image_url' in request.json:
            response = requests.get(request.json['image_url'])
            image = Image.open(BytesIO(response.content)).convert('RGB')
        else:
            image_data = base64.b64decode(request.json['image_base64'])
            image = Image.open(BytesIO(image_data)).convert('RGB')
        
        # Get text
        text = request.json['text']
        
        # Process inputs
        image_input = preprocess(image).unsqueeze(0).to(device)
        text_tokens = clip.tokenize([text]).to(device)
        
        # Calculate similarity
        with torch.no_grad():
            logits_per_image, logits_per_text = model(image_input, text_tokens)
            similarity = logits_per_image.softmax(dim=-1).cpu().numpy()[0][0].item()
        
        return jsonify({
            "similarity": similarity,
            "text": text
        })
    except Exception as e:
        return jsonify({"error": f"Failed to calculate similarity: {str(e)}"}), 500

if __name__ == '__main__':
    # Run the Flask app
    print(f"Starting CLIP service on {HOST}:{PORT}")
    print(f"Debug mode: {DEBUG}")
    print(f"Model: {MODEL_NAME}")
    print(f"Model cache directory: {MODEL_CACHE_DIR}")
    app.run(host=HOST, port=PORT, debug=DEBUG) 