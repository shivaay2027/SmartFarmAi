import os, json, sys, io
from PIL import Image
from google import genai
from google.genai import types as genai_types

try:
    with open('main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    prompt = content.split('GEMINI_PROMPT = """')[1].split('"""')[0].strip()

    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    pil_img = Image.open(r'C:\Users\91975\.gemini\antigravity\brain\b53538d8-f1a2-4d0f-a4d8-b89914c3a2c7\disease_detect_top_v2_1773241644751.png').convert('RGB')
    buf = io.BytesIO()
    pil_img.save(buf, format='JPEG', quality=85)
    jpeg_bytes = buf.getvalue()

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[
            genai_types.Part.from_bytes(data=jpeg_bytes, mime_type='image/jpeg'),
            prompt,
        ],
        config=genai_types.GenerateContentConfig(temperature=0.1, max_output_tokens=1024)
    )
    print('RAW OUTPUT START:')
    print(response.text)
    print('RAW OUTPUT END')
except Exception as e:
    print(f'SCRIPT ERROR: {e}')
