import requests

url = "http://localhost:8001/api/v1/ai/vision/detect"

# Create a small dummy image for testing the POST endpoint
from PIL import Image
import io

img = Image.new('RGB', (224, 224), color = 'red')
img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='JPEG')
img_bytes = img_byte_arr.getvalue()

files = {'image': ('test.jpg', img_bytes, 'image/jpeg')}

try:
    response = requests.post(url, files=files)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
