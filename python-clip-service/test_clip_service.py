import requests
import json
import sys
import time

# Base URL for the CLIP service
BASE_URL = "http://localhost:5000"

def test_health():
    """Test the health endpoint"""
    print("\n📊 Testing health endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status code: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_text_embedding(text="a beautiful sunset over mountains"):
    """Test the text embedding endpoint"""
    print(f"\n📝 Testing text embedding with: '{text}'")
    
    try:
        response = requests.post(
            f"{BASE_URL}/encode_text",
            json={"text": text}
        )
        
        print(f"Status code: {response.status_code}")
        data = response.json()
        
        # Print embedding dimensions but not the full embedding
        if "embedding" in data:
            embedding_len = len(data["embedding"])
            print(f"Embedding dimensions: {embedding_len}")
            # Just show the first few values
            print(f"First few values: {data['embedding'][:5]}")
            data["embedding"] = f"[{embedding_len} values]"
        
        print(json.dumps(data, indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_image_embedding(image_url="https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg"):
    """Test the image embedding endpoint with a sample image"""
    print(f"\n🖼️ Testing image embedding with URL: {image_url}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/encode_image",
            json={"image_url": image_url}
        )
        
        print(f"Status code: {response.status_code}")
        data = response.json()
        
        # Print embedding dimensions but not the full embedding
        if "embedding" in data:
            embedding_len = len(data["embedding"])
            print(f"Embedding dimensions: {embedding_len}")
            # Just show the first few values
            print(f"First few values: {data['embedding'][:5]}")
            data["embedding"] = f"[{embedding_len} values]"
        
        print(json.dumps(data, indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_human_detection(image_url="https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg"):
    """Test human detection in an image"""
    print(f"\n👤 Testing human detection with URL: {image_url}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/encode_image",
            json={"image_url": image_url, "detect_humans": True}
        )
        
        print(f"Status code: {response.status_code}")
        data = response.json()
        
        # Don't print the full embedding
        if "embedding" in data:
            embedding_len = len(data["embedding"])
            data["embedding"] = f"[{embedding_len} values]"
        
        print(json.dumps(data, indent=2))
        
        # Check if humans were detected
        if "has_human" in data:
            print(f"Human detected: {'Yes' if data['has_human'] else 'No'}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_similarity(image_url="https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg", 
                   text="mountains with snow"):
    """Test similarity between an image and text"""
    print(f"\n🔍 Testing similarity between image and text:")
    print(f"Image: {image_url}")
    print(f"Text: '{text}'")
    
    try:
        response = requests.post(
            f"{BASE_URL}/similarity",
            json={"image_url": image_url, "text": text}
        )
        
        print(f"Status code: {response.status_code}")
        data = response.json()
        
        print(json.dumps(data, indent=2))
        
        if "similarity" in data:
            similarity = data["similarity"]
            print(f"Similarity: {similarity:.4f} ({similarity*100:.1f}%)")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def run_all_tests():
    """Run all tests"""
    start = time.time()
    
    print("🧪 Starting CLIP service tests...")
    
    tests = [
        ("Health check", test_health),
        ("Text embedding", test_text_embedding),
        ("Image embedding", test_image_embedding),
        ("Human detection", test_human_detection),
        ("Similarity", test_similarity)
    ]
    
    results = []
    
    for name, test_func in tests:
        print(f"\n{'='*60}")
        print(f"Running test: {name}")
        print(f"{'='*60}")
        
        success = test_func()
        results.append((name, success))
    
    # Print summary
    print("\n\n📋 Test Summary:")
    print("="*60)
    
    all_pass = True
    for name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        all_pass = all_pass and success
    
    print("="*60)
    print(f"Total time: {time.time() - start:.2f} seconds")
    print(f"Overall status: {'✅ ALL TESTS PASSED' if all_pass else '❌ SOME TESTS FAILED'}")
    
    return all_pass

if __name__ == "__main__":
    # If specific test is specified, run it
    if len(sys.argv) > 1:
        test_name = sys.argv[1].lower()
        
        if test_name == "health":
            test_health()
        elif test_name == "text":
            test_text_embedding()
        elif test_name == "image":
            test_image_embedding()
        elif test_name == "human":
            test_human_detection()
        elif test_name == "similarity":
            test_similarity()
        else:
            print(f"Unknown test: {test_name}")
            print("Available tests: health, text, image, human, similarity")
    else:
        # Run all tests
        run_all_tests() 