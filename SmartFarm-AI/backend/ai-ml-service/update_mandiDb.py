import json
import re

print("Loading real scraped mandis...")
with open("mandi_master_real.json", "r", encoding="utf-8") as f:
    mandi_db = json.load(f)

print(f"Loaded {len(mandi_db)} real reporting mandis.")

mandiDb_path = "d:/Minor Project/SmartFarm-AI/frontend/web-dashboard/app/prices/mandiDb.js"

with open(mandiDb_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the MANDI_DB array using regex
pattern = re.compile(r"export const MANDI_DB = \[(?:.*?\n)*?\];?", re.MULTILINE)

new_array_str = "export const MANDI_DB = [\n"
for m in mandi_db:
    # Escape single quotes in names if any
    name = m['name'].replace("'", "\\'")
    state = m['state'].replace("'", "\\'")
    district = m['district'].replace("'", "\\'")
    sub = m['sub'].replace("'", "\\'")
    
    line = f"  {{id:'{m['id']}', name:'{name}', state:'{state}', district:'{district}', sub:'{sub}', lat:{m['lat']}, lng:{m['lng']}}},\n"
    new_array_str += line
new_array_str += "];\n"

if not pattern.search(content):
    print("Could not find MANDI_DB array to replace!")
else:
    new_content = pattern.sub(new_array_str, content)
    with open(mandiDb_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully updated mandiDb.js with 100% REAL APMC data!")
