import requests
import json
import time
import os
from datetime import datetime, timedelta
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

API_KEY = "579b464db66ec23bdd000001956dc4f06cd140955c9f9c9692e62578"
BASE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

# Setup robust session
session = requests.Session()
retry = Retry(connect=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
adapter = HTTPAdapter(max_retries=retry)
session.mount('http://', adapter)
session.mount('https://', adapter)

mandis = set()
print("Initiating full active Mandi scrape from Agmarknet API (last 7 days)...")

for d in range(7):
    target_date = datetime.now() - timedelta(days=d)
    date_str = target_date.strftime("%d/%m/%Y")
    
    offset = 0
    while True:
        try:
            req_url = f"{BASE_URL}?api-key={API_KEY}&format=json&limit=2500&offset={offset}&filters[arrival_date]={date_str}"
            r = session.get(req_url, timeout=30)
            if r.status_code != 200:
                print(f"Error {r.status_code} on date {date_str}, offset {offset}")
                break
                
            data = r.json()
            records = data.get("records", [])
            
            if not records:
                break
                
            for rec in records:
                state = (rec.get("state") or "").strip().title()
                district = (rec.get("district") or "").strip().title()
                market = (rec.get("market") or "").strip().title()
                if state and district and market:
                    mandis.add((state, district, market))
                    
            print(f"  [{date_str}] Offset: {offset} -> Fetched {len(records)} records. Unique mandis so far: {len(mandis)}")
            
            if len(records) < 2500:
                break
                
            offset += 2500
            time.sleep(1)
            
        except Exception as e:
            print(f"Failed at {date_str} offset {offset}: {e}")
            break

print(f"\n✅ Total unique ACTIVE mandis found with real data: {len(mandis)}")

mandi_db = []
for idx, (state, district, market) in enumerate(sorted(mandis)):
    mandi_db.append({
        "id": f"m{idx+1000}",
        "state": state,
        "district": district,
        "sub": market,
        "name": f"{market} APMC",
        "lat": 20.0,
        "lng": 77.0
    })

# We'll write to mandi_master_real.json so we can inject it into mandiDb.js later
with open("mandi_master_real.json", "w", encoding="utf-8") as f:
    json.dump(mandi_db, f)

print("Saved to mandi_master_real.json successfully!")
