import os
import glob
import urllib.request
import json
import uuid
import time

sample_files = ['images/sample_plant_1.jpg'] + glob.glob('images/*.jpg') + glob.glob('public/images/*.png')
sample_file = next((f for f in sample_files if os.path.exists(f)), None)
if not sample_file:
    raise FileNotFoundError("No sample image found in images/ or public/images/")

boundary = uuid.uuid4().hex
with open(sample_file, 'rb') as f:
    img_data = f.read()

parts = []
parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="files"; filename="sample_plant_1.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode('utf-8'))
parts.append(img_data)
parts.append(f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="threshold"\r\n\r\n0.60\r\n--{boundary}--\r\n'.encode('utf-8'))

body = b''.join(parts)
req = urllib.request.Request(
    'http://127.0.0.1:8000/api/segment-batch',
    data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

for attempt in range(10):
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print('API Status:', data.get('status'))
            print('Latency ms:', data.get('latency_ms'))
            print('Total leaves detected:', data.get('total_leaves'))
            res0 = data['results'][0]
            print('Leaves in result:', res0.get('leaf_count'))
            print('Has annotated_image:', bool(res0.get('annotated_image')))
            break
    except Exception as e:
        if attempt < 9:
            time.sleep(1.5)
        else:
            raise e
