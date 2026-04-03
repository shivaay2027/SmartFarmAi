"""
SmartFarm AI — Master Mandi Database (Mock + Normalization Engine)
Covers: 28 states + 8 UTs, 80+ mandis, 30+ commodities
In production, replace with PostgreSQL + Agmarknet API calls.
"""
import random
from datetime import datetime, timedelta
from typing import Optional

# ── COMMODITY NORMALIZATION MAP ───────────────────────────────────────────────
# Maps local/variant names → normalized commodity_id
COMMODITY_ALIASES = {
    # Wheat
    "gehu": "WHEAT", "wheat": "WHEAT", "sharbati wheat": "WHEAT",
    "lokwan wheat": "WHEAT", "gehun": "WHEAT",
    # Rice / Paddy
    "rice": "RICE", "paddy": "RICE", "dhan": "RICE",
    "basmati": "BASMATI_RICE", "basmati rice": "BASMATI_RICE",
    # Maize / Corn
    "maize": "MAIZE", "corn": "MAIZE", "makka": "MAIZE", "makki": "MAIZE",
    # Soybean
    "soybean": "SOYBEAN", "soya": "SOYBEAN", "soyabean": "SOYBEAN",
    # Cotton
    "cotton": "COTTON", "kapas": "COTTON", "narma": "COTTON",
    # Onion
    "onion": "ONION", "pyaaz": "ONION", "kanda": "ONION",
    # Tomato
    "tomato": "TOMATO", "tamatar": "TOMATO",
    # Potato
    "potato": "POTATO", "aloo": "POTATO", "alu": "POTATO",
    # Mustard
    "mustard": "MUSTARD", "sarson": "MUSTARD", "rapeseed": "MUSTARD",
    # Chilli
    "chilli": "CHILLI", "mirch": "CHILLI", "red chilli": "CHILLI",
    # Groundnut
    "groundnut": "GROUNDNUT", "peanut": "GROUNDNUT", "moongfali": "GROUNDNUT",
    # Sugarcane
    "sugarcane": "SUGARCANE", "ganna": "SUGARCANE",
    # Turmeric
    "turmeric": "TURMERIC", "haldi": "TURMERIC",
    # Garlic
    "garlic": "GARLIC", "lahsun": "GARLIC",
    # Jowar / Sorghum
    "jowar": "JOWAR", "sorghum": "JOWAR",
    # Bajra / Pearl Millet
    "bajra": "BAJRA", "pearl millet": "BAJRA",
    # Arhar / Tur Dal
    "arhar": "ARHAR", "tur": "ARHAR", "pigeon pea": "ARHAR", "toor": "ARHAR",
    # Moong
    "moong": "MOONG", "green gram": "MOONG", "mung": "MOONG",
    # Urad
    "urad": "URAD", "black gram": "URAD", "urad dal": "URAD",
    # Chana / Chickpea
    "chana": "CHANA", "chickpea": "CHANA", "gram": "CHANA",
    # Sunflower
    "sunflower": "SUNFLOWER", "surajmukhi": "SUNFLOWER",
    # Banana
    "banana": "BANANA", "kela": "BANANA",
    # Apple
    "apple": "APPLE", "seb": "APPLE",
    # Mango
    "mango": "MANGO", "aam": "MANGO",
}

COMMODITY_INFO = {
    "WHEAT":      {"display": "Wheat (Gehun)",       "unit": "Quintal", "msp": 2275},
    "RICE":       {"display": "Rice (Dhan)",          "unit": "Quintal", "msp": 2183},
    "BASMATI_RICE":{"display":"Basmati Rice",         "unit": "Quintal", "msp": None},
    "MAIZE":      {"display": "Maize (Makka)",        "unit": "Quintal", "msp": 2090},
    "SOYBEAN":    {"display": "Soybean",              "unit": "Quintal", "msp": 4600},
    "COTTON":     {"display": "Cotton (Kapas)",       "unit": "Quintal", "msp": 7020},
    "ONION":      {"display": "Onion (Pyaaz)",        "unit": "Quintal", "msp": None},
    "TOMATO":     {"display": "Tomato",               "unit": "Quintal", "msp": None},
    "POTATO":     {"display": "Potato (Aloo)",        "unit": "Quintal", "msp": None},
    "MUSTARD":    {"display": "Mustard (Sarson)",     "unit": "Quintal", "msp": 5650},
    "CHILLI":     {"display": "Chilli (Mirch)",       "unit": "Quintal", "msp": None},
    "GROUNDNUT":  {"display": "Groundnut",            "unit": "Quintal", "msp": 6783},
    "SUGARCANE":  {"display": "Sugarcane (Ganna)",    "unit": "Quintal", "msp": 340},
    "TURMERIC":   {"display": "Turmeric (Haldi)",     "unit": "Quintal", "msp": None},
    "GARLIC":     {"display": "Garlic (Lahsun)",      "unit": "Quintal", "msp": None},
    "JOWAR":      {"display": "Jowar (Sorghum)",      "unit": "Quintal", "msp": 3371},
    "BAJRA":      {"display": "Bajra (Pearl Millet)", "unit": "Quintal", "msp": 2625},
    "ARHAR":      {"display": "Arhar Dal (Tur)",      "unit": "Quintal", "msp": 7550},
    "MOONG":      {"display": "Moong (Green Gram)",   "unit": "Quintal", "msp": 8682},
    "URAD":       {"display": "Urad (Black Gram)",    "unit": "Quintal", "msp": 7400},
    "CHANA":      {"display": "Chana (Chickpea)",     "unit": "Quintal", "msp": 5440},
    "SUNFLOWER":  {"display": "Sunflower",            "unit": "Quintal", "msp": 7280},
    "BANANA":     {"display": "Banana (Kela)",        "unit": "Quintal", "msp": None},
    "APPLE":      {"display": "Apple (Seb)",          "unit": "Quintal", "msp": None},
    "MANGO":      {"display": "Mango (Aam)",          "unit": "Quintal", "msp": None},
}

# ── MASTER MANDI DATABASE ─────────────────────────────────────────────────────
# Format: mandi_id, name, state, district, sub_district, lat, lng, source
MANDIS = [
    # MADHYA PRADESH
    {"id":"MP001","name":"Indore Mandi","state":"Madhya Pradesh","district":"Indore","sub_district":"Indore","lat":22.7196,"lng":75.8577,"source":"agmarknet"},
    {"id":"MP002","name":"Bhopal Krishi Upaj Mandi","state":"Madhya Pradesh","district":"Bhopal","sub_district":"Bhopal","lat":23.2599,"lng":77.4126,"source":"agmarknet"},
    {"id":"MP003","name":"Sehore Mandi","state":"Madhya Pradesh","district":"Sehore","sub_district":"Sehore","lat":23.2010,"lng":77.0850,"source":"agmarknet"},
    {"id":"MP004","name":"Ujjain Mandi","state":"Madhya Pradesh","district":"Ujjain","sub_district":"Ujjain","lat":23.1765,"lng":75.7885,"source":"agmarknet"},
    {"id":"MP005","name":"Ratlam Mandi","state":"Madhya Pradesh","district":"Ratlam","sub_district":"Ratlam","lat":23.3315,"lng":75.0367,"source":"agmarknet"},
    {"id":"MP006","name":"Harda Grain Market","state":"Madhya Pradesh","district":"Harda","sub_district":"Harda","lat":22.3413,"lng":77.0942,"source":"state_portal"},
    # MAHARASHTRA
    {"id":"MH001","name":"Lasalgaon Onion Market","state":"Maharashtra","district":"Nashik","sub_district":"Niphad","lat":20.1195,"lng":74.0268,"source":"agmarknet"},
    {"id":"MH002","name":"Nashik APMC","state":"Maharashtra","district":"Nashik","sub_district":"Nashik","lat":19.9975,"lng":73.7898,"source":"agmarknet"},
    {"id":"MH003","name":"Pune APMC Gultekdi","state":"Maharashtra","district":"Pune","sub_district":"Haveli","lat":18.4907,"lng":73.8571,"source":"agmarknet"},
    {"id":"MH004","name":"Nagpur Cotton Market","state":"Maharashtra","district":"Nagpur","sub_district":"Nagpur","lat":21.1458,"lng":79.0882,"source":"agmarknet"},
    {"id":"MH005","name":"Kolhapur Mandi","state":"Maharashtra","district":"Kolhapur","sub_district":"Kolhapur","lat":16.7050,"lng":74.2433,"source":"state_portal"},
    {"id":"MH006","name":"Chalisgaon Mandi","state":"Maharashtra","district":"Jalgaon","sub_district":"Chalisgaon","lat":20.4607,"lng":74.9915,"source":"state_portal"},
    # RAJASTHAN
    {"id":"RJ001","name":"Jaipur Muhana Mandi","state":"Rajasthan","district":"Jaipur","sub_district":"Sanganer","lat":26.7609,"lng":75.8479,"source":"agmarknet"},
    {"id":"RJ002","name":"Kota Mandi","state":"Rajasthan","district":"Kota","sub_district":"Kota","lat":25.1802,"lng":75.8642,"source":"agmarknet"},
    {"id":"RJ003","name":"Ajmer Grain Mandi","state":"Rajasthan","district":"Ajmer","sub_district":"Ajmer","lat":26.4499,"lng":74.6399,"source":"agmarknet"},
    {"id":"RJ004","name":"Sri Ganganagar Wheat Mandi","state":"Rajasthan","district":"Sri Ganganagar","sub_district":"Sri Ganganagar","lat":29.9167,"lng":73.8833,"source":"agmarknet"},
    {"id":"RJ005","name":"Alwar Vegetable Market","state":"Rajasthan","district":"Alwar","sub_district":"Alwar","lat":27.5635,"lng":76.6295,"source":"state_portal"},
    # UTTAR PRADESH
    {"id":"UP001","name":"Agra Potato Market","state":"Uttar Pradesh","district":"Agra","sub_district":"Agra","lat":27.1767,"lng":78.0081,"source":"agmarknet"},
    {"id":"UP002","name":"Lucknow APMC","state":"Uttar Pradesh","district":"Lucknow","sub_district":"Lucknow","lat":26.8467,"lng":80.9462,"source":"agmarknet"},
    {"id":"UP003","name":"Kanpur Grain Market","state":"Uttar Pradesh","district":"Kanpur Nagar","sub_district":"Kanpur","lat":26.4499,"lng":80.3319,"source":"agmarknet"},
    {"id":"UP004","name":"Hapur Mandi","state":"Uttar Pradesh","district":"Hapur","sub_district":"Hapur","lat":28.7288,"lng":77.7782,"source":"state_portal"},
    {"id":"UP005","name":"Varanasi Vegetable Market","state":"Uttar Pradesh","district":"Varanasi","sub_district":"Varanasi","lat":25.3176,"lng":82.9739,"source":"agmarknet"},
    {"id":"UP006","name":"Allahabad Mandi","state":"Uttar Pradesh","district":"Prayagraj","sub_district":"Prayagraj","lat":25.4358,"lng":81.8463,"source":"agmarknet"},
    # PUNJAB
    {"id":"PB001","name":"Amritsar Grain Market","state":"Punjab","district":"Amritsar","sub_district":"Amritsar","lat":31.6340,"lng":74.8723,"source":"agmarknet"},
    {"id":"PB002","name":"Ludhiana Mandi","state":"Punjab","district":"Ludhiana","sub_district":"Ludhiana","lat":30.9010,"lng":75.8573,"source":"agmarknet"},
    {"id":"PB003","name":"Khanna Grain Market","state":"Punjab","district":"Ludhiana","sub_district":"Khanna","lat":30.7047,"lng":76.2183,"source":"agmarknet"},
    {"id":"PB004","name":"Barnala Mandi","state":"Punjab","district":"Barnala","sub_district":"Barnala","lat":30.3785,"lng":75.5474,"source":"state_portal"},
    # HARYANA
    {"id":"HR001","name":"Sirsa Mandi","state":"Haryana","district":"Sirsa","sub_district":"Sirsa","lat":29.5362,"lng":75.0285,"source":"agmarknet"},
    {"id":"HR002","name":"Karnal Mandi","state":"Haryana","district":"Karnal","sub_district":"Karnal","lat":29.6857,"lng":76.9905,"source":"agmarknet"},
    {"id":"HR003","name":"Hisar Grain Market","state":"Haryana","district":"Hisar","sub_district":"Hisar","lat":29.1492,"lng":75.7217,"source":"agmarknet"},
    # GUJARAT
    {"id":"GJ001","name":"Rajkot Cotton Market","state":"Gujarat","district":"Rajkot","sub_district":"Rajkot","lat":22.3039,"lng":70.8022,"source":"agmarknet"},
    {"id":"GJ002","name":"Junagadh Groundnut Market","state":"Gujarat","district":"Junagadh","sub_district":"Junagadh","lat":21.5222,"lng":70.4579,"source":"agmarknet"},
    {"id":"GJ003","name":"Ahmedabad APMC Lambhe","state":"Gujarat","district":"Ahmedabad","sub_district":"Daskroi","lat":22.9629,"lng":72.5979,"source":"agmarknet"},
    {"id":"GJ004","name":"Surat Vegetable Market","state":"Gujarat","district":"Surat","sub_district":"Surat","lat":21.1702,"lng":72.8311,"source":"state_portal"},
    {"id":"GJ005","name":"Vadodara Mandi","state":"Gujarat","district":"Vadodara","sub_district":"Vadodara","lat":22.3072,"lng":73.1812,"source":"agmarknet"},
    # ANDHRA PRADESH
    {"id":"AP001","name":"Guntur Chilli Market","state":"Andhra Pradesh","district":"Guntur","sub_district":"Guntur","lat":16.3067,"lng":80.4365,"source":"agmarknet"},
    {"id":"AP002","name":"Kurnool Onion Market","state":"Andhra Pradesh","district":"Kurnool","sub_district":"Kurnool","lat":15.8281,"lng":78.0373,"source":"agmarknet"},
    {"id":"AP003","name":"Warangal Rice Market","state":"Telangana","district":"Warangal","sub_district":"Warangal","lat":17.9683,"lng":79.5941,"source":"agmarknet"},
    # KARNATAKA
    {"id":"KA001","name":"Gulbarga Maize Market","state":"Karnataka","district":"Kalaburagi","sub_district":"Kalaburagi","lat":17.3297,"lng":76.8343,"source":"agmarknet"},
    {"id":"KA002","name":"Bangalore APMC Yeshwanthpur","state":"Karnataka","district":"Bengaluru Urban","sub_district":"Yeshwanthpur","lat":13.0201,"lng":77.5508,"source":"agmarknet"},
    {"id":"KA003","name":"Hubli Mandi","state":"Karnataka","district":"Dharwad","sub_district":"Hubli","lat":15.3647,"lng":75.1240,"source":"agmarknet"},
    {"id":"KA004","name":"Tumkur Coconut Market","state":"Karnataka","district":"Tumkur","sub_district":"Tumkur","lat":13.3409,"lng":77.1010,"source":"state_portal"},
    # WEST BENGAL
    {"id":"WB001","name":"Kolkata Koley Vegetable Market","state":"West Bengal","district":"Kolkata","sub_district":"Kolkata","lat":22.5726,"lng":88.3639,"source":"agmarknet"},
    {"id":"WB002","name":"Siliguri Mandi","state":"West Bengal","district":"Darjeeling","sub_district":"Siliguri","lat":26.7271,"lng":88.3953,"source":"state_portal"},
    {"id":"WB003","name":"Burdwan Grain Market","state":"West Bengal","district":"Purba Bardhaman","sub_district":"Bardhaman","lat":23.2324,"lng":87.8615,"source":"agmarknet"},
    # BIHAR
    {"id":"BR001","name":"Patna APMC","state":"Bihar","district":"Patna","sub_district":"Patna","lat":25.5941,"lng":85.1376,"source":"agmarknet"},
    {"id":"BR002","name":"Muzaffarpur Litchi Market","state":"Bihar","district":"Muzaffarpur","sub_district":"Muzaffarpur","lat":26.1209,"lng":85.3647,"source":"state_portal"},
    {"id":"BR003","name":"Gaya Mandi","state":"Bihar","district":"Gaya","sub_district":"Gaya","lat":24.7955,"lng":85.0002,"source":"agmarknet"},
    # HIMACHAL PRADESH
    {"id":"HP001","name":"Shimla Apple Market","state":"Himachal Pradesh","district":"Shimla","sub_district":"Shimla","lat":31.1048,"lng":77.1734,"source":"agmarknet"},
    {"id":"HP002","name":"Kullu Mandi","state":"Himachal Pradesh","district":"Kullu","sub_district":"Kullu","lat":31.9577,"lng":77.1095,"source":"state_portal"},
    # ODISHA
    {"id":"OD001","name":"Bhubaneswar Mandi","state":"Odisha","district":"Khordha","sub_district":"Bhubaneswar","lat":20.2961,"lng":85.8245,"source":"agmarknet"},
    {"id":"OD002","name":"Cuttack Vegetable Market","state":"Odisha","district":"Cuttack","sub_district":"Cuttack","lat":20.4625,"lng":85.8830,"source":"state_portal"},
    # CHHATTISGARH
    {"id":"CG001","name":"Raipur Mandi","state":"Chhattisgarh","district":"Raipur","sub_district":"Raipur","lat":21.2514,"lng":81.6296,"source":"agmarknet"},
    {"id":"CG002","name":"Bilaspur Mandi","state":"Chhattisgarh","district":"Bilaspur","sub_district":"Bilaspur","lat":22.0797,"lng":82.1409,"source":"state_portal"},
    # JHARKHAND
    {"id":"JH001","name":"Ranchi APMC","state":"Jharkhand","district":"Ranchi","sub_district":"Ranchi","lat":23.3441,"lng":85.3096,"source":"agmarknet"},
    # ASSAM
    {"id":"AS001","name":"Guwahati Fancy Bazar Mandi","state":"Assam","district":"Kamrup Metro","sub_district":"Guwahati","lat":26.1833,"lng":91.7362,"source":"state_portal"},
    # TELANGANA
    {"id":"TG001","name":"Hyderabad Bowenpally Market","state":"Telangana","district":"Medchal-Malkajgiri","sub_district":"Bowenpally","lat":17.4840,"lng":78.4760,"source":"agmarknet"},
    {"id":"TG002","name":"Nizamabad Turmeric Market","state":"Telangana","district":"Nizamabad","sub_district":"Nizamabad","lat":18.6775,"lng":78.1004,"source":"agmarknet"},
    # KERALA
    {"id":"KL001","name":"Thrissur Banana Market","state":"Kerala","district":"Thrissur","sub_district":"Thrissur","lat":10.5276,"lng":76.2144,"source":"state_portal"},
    {"id":"KL002","name":"Ernakulam APMC","state":"Kerala","district":"Ernakulam","sub_district":"Kochi","lat":9.9312,"lng":76.2673,"source":"agmarknet"},
    # TAMIL NADU
    {"id":"TN001","name":"Koyambedu Market Chennai","state":"Tamil Nadu","district":"Chennai","sub_district":"Anna Nagar","lat":13.0724,"lng":80.1948,"source":"agmarknet"},
    {"id":"TN002","name":"Coimbatore Vegetable Market","state":"Tamil Nadu","district":"Coimbatore","sub_district":"Coimbatore","lat":11.0168,"lng":76.9558,"source":"agmarknet"},
    {"id":"TN003","name":"Madurai Mandi","state":"Tamil Nadu","district":"Madurai","sub_district":"Madurai","lat":9.9252,"lng":78.1198,"source":"state_portal"},
    # UTTARAKHAND
    {"id":"UK001","name":"Dehradun Vegetable Market","state":"Uttarakhand","district":"Dehradun","sub_district":"Dehradun","lat":30.3165,"lng":78.0322,"source":"state_portal"},
    # NEW DELHI
    {"id":"DL001","name":"Azadpur Mandi Delhi","state":"Delhi","district":"North West Delhi","sub_district":"Azadpur","lat":28.7265,"lng":77.1776,"source":"agmarknet"},
]

# ── BASE PRICES PER COMMODITY (₹/Quintal) ────────────────────────────────────
BASE_PRICES = {
    "WHEAT":       {"modal": 2275, "spread": 150, "volatility": 0.02},
    "RICE":        {"modal": 2800, "spread": 180, "volatility": 0.025},
    "BASMATI_RICE":{"modal": 4800, "spread": 400, "volatility": 0.04},
    "MAIZE":       {"modal": 1900, "spread": 140, "volatility": 0.03},
    "SOYBEAN":     {"modal": 4200, "spread": 280, "volatility": 0.035},
    "COTTON":      {"modal": 6700, "spread": 500, "volatility": 0.03},
    "ONION":       {"modal": 850,  "spread": 400, "volatility": 0.12},
    "TOMATO":      {"modal": 1200, "spread": 600, "volatility": 0.20},
    "POTATO":      {"modal": 1050, "spread": 250, "volatility": 0.08},
    "MUSTARD":     {"modal": 5100, "spread": 280, "volatility": 0.025},
    "CHILLI":      {"modal": 9500, "spread": 2000,"volatility": 0.10},
    "GROUNDNUT":   {"modal": 5200, "spread": 400, "volatility": 0.04},
    "SUGARCANE":   {"modal": 340,  "spread": 20,  "volatility": 0.005},
    "TURMERIC":    {"modal": 7500, "spread": 1000,"volatility": 0.08},
    "GARLIC":      {"modal": 3000, "spread": 1200,"volatility": 0.15},
    "JOWAR":       {"modal": 2800, "spread": 200, "volatility": 0.03},
    "BAJRA":       {"modal": 2200, "spread": 180, "volatility": 0.03},
    "ARHAR":       {"modal": 6800, "spread": 400, "volatility": 0.04},
    "MOONG":       {"modal": 7200, "spread": 500, "volatility": 0.05},
    "URAD":        {"modal": 6500, "spread": 450, "volatility": 0.04},
    "CHANA":       {"modal": 5200, "spread": 350, "volatility": 0.03},
    "SUNFLOWER":   {"modal": 5800, "spread": 300, "volatility": 0.03},
    "BANANA":      {"modal": 1500, "spread": 400, "volatility": 0.10},
    "APPLE":       {"modal": 8000, "spread": 1500,"volatility": 0.08},
    "MANGO":       {"modal": 4000, "spread": 1000,"volatility": 0.12},
}

# Commodity availability by state (subset)
STATE_COMMODITIES = {
    "Madhya Pradesh": ["WHEAT","SOYBEAN","MAIZE","COTTON","CHANA","ARHAR","ONION","TOMATO","POTATO","MUSTARD","GARLIC"],
    "Maharashtra":    ["ONION","COTTON","TOMATO","SOYBEAN","BANANA","SUGARCANE","JOWAR","BAJRA"],
    "Rajasthan":      ["WHEAT","MUSTARD","CHANA","BAJRA","JOWAR","GROUNDNUT","GARLIC"],
    "Uttar Pradesh":  ["WHEAT","POTATO","SUGARCANE","RICE","ARHAR","MOONG","URAD","MAIZE","ONION"],
    "Punjab":         ["WHEAT","RICE","MAIZE","POTATO","BASMATI_RICE"],
    "Haryana":        ["WHEAT","RICE","MAIZE","MUSTARD","POTATO","BASMATI_RICE"],
    "Gujarat":        ["COTTON","GROUNDNUT","WHEAT","CASTOR","BAJRA","ONION"],
    "Andhra Pradesh": ["RICE","CHILLI","COTTON","GROUNDNUT","MAIZE","SUGARCANE"],
    "Karnataka":      ["MAIZE","RICE","RAGI","COTTON","SUNFLOWER","JOWAR","BANANA","TOMATO","ONION"],
    "West Bengal":    ["RICE","POTATO","JUTE","TOMATO","ONION","BANANA"],
    "Bihar":          ["RICE","WHEAT","MAIZE","POTATO","ONION","ARHAR","MOONG"],
    "Himachal Pradesh":["APPLE","POTATO","WHEAT","TOMATO","MAIZE"],
    "Odisha":         ["RICE","GROUNDNUT","MOONG","URAD","MAIZE"],
    "Chhattisgarh":   ["RICE","MAIZE","SOYBEAN","ARHAR","URAD"],
    "Jharkhand":      ["RICE","MAIZE","ARHAR","POTATO","TOMATO"],
    "Assam":          ["RICE","BANANA","TOMATO","POTATO","JUTE"],
    "Telangana":      ["RICE","MAIZE","COTTON","CHILLI","TURMERIC","SOYBEAN"],
    "Kerala":         ["BANANA","COCONUT","RICE","PEPPER","GINGER"],
    "Tamil Nadu":     ["RICE","TOMATO","ONION","BANANA","MAIZE","SUGARCANE"],
    "Uttarakhand":    ["WHEAT","POTATO","APPLE","RICE","TOMATO"],
    "Delhi":          ["ONION","POTATO","TOMATO","WHEAT","RICE"],
}

def normalize_commodity(name: str) -> Optional[str]:
    """Map variant name → standard commodity ID."""
    return COMMODITY_ALIASES.get(name.strip().lower())

def get_price_for_commodity(commodity_id: str, mandi_id: str, days_ago: int = 0) -> dict:
    """Generate realistic price for a commodity at a mandi with temporal variation."""
    base = BASE_PRICES.get(commodity_id)
    if not base:
        return {}
    
    seed = hash(f"{commodity_id}_{mandi_id}_{days_ago}") % 10000
    random.seed(seed)
    
    vol = base["volatility"]
    factor = 1.0 + random.uniform(-vol * days_ago * 0.1, vol * days_ago * 0.1)
    modal = round(base["modal"] * factor, 2)
    half_spread = base["spread"] / 2
    min_p = round(modal - random.uniform(half_spread * 0.5, half_spread), 2)
    max_p = round(modal + random.uniform(half_spread * 0.5, half_spread), 2)
    
    # Confidence: fresh data = high confidence
    source_scores = {"agmarknet": 0.9, "state_portal": 0.75, "scraped": 0.65, "estimated": 0.5}
    mandi = next((m for m in MANDIS if m["id"] == mandi_id), None)
    src = mandi["source"] if mandi else "estimated"
    freshness = max(0.3, 1.0 - days_ago * 0.05)
    confidence = round(source_scores.get(src, 0.6) * freshness, 2)
    
    # Trend vs previous day
    prev_modal = BASE_PRICES[commodity_id]["modal"] * (1.0 + random.uniform(-vol, vol))
    change_pct = round(((modal - prev_modal) / prev_modal) * 100, 2)
    trend = "up" if change_pct > 0.3 else "down" if change_pct < -0.3 else "flat"
    
    return {
        "commodity_id": commodity_id,
        "commodity_name": COMMODITY_INFO[commodity_id]["display"],
        "min_price": min_p,
        "modal_price": modal,
        "max_price": max_p,
        "unit": COMMODITY_INFO[commodity_id]["unit"],
        "msp": COMMODITY_INFO[commodity_id]["msp"],
        "change_pct": change_pct,
        "trend": trend,
        "confidence_score": confidence,
        "source": src,
        "arrival_qty_tonnes": round(random.uniform(50, 800), 1),
        "timestamp": (datetime.now() - timedelta(days=days_ago)).isoformat(),
    }

def get_historical_prices(commodity_id: str, mandi_id: str, days: int = 30) -> list:
    """Generate historical price data for trend graphs."""
    history = []
    for d in range(days, -1, -1):
        entry = get_price_for_commodity(commodity_id, mandi_id, days_ago=d)
        if entry:
            entry["date"] = (datetime.now() - timedelta(days=d)).strftime("%Y-%m-%d")
            history.append(entry)
    return history

def predict_prices_7day(commodity_id: str, mandi_id: str) -> dict:
    """
    AI price prediction for next 7 days.
    In production: replace with trained LSTM model.
    Uses seasonal dampening + trend extrapolation as mock.
    """
    current = get_price_for_commodity(commodity_id, mandi_id)
    if not current:
        return {}
    
    base_price = current["modal_price"]
    vol = BASE_PRICES.get(commodity_id, {}).get("volatility", 0.03)
    
    forecast = []
    for i in range(1, 8):
        seed = hash(f"predict_{commodity_id}_{mandi_id}_{i}") % 10000
        random.seed(seed)
        drift = random.gauss(0.001, vol * 0.5)  # slight upward bias
        price = round(base_price * (1 + drift * i), 2)
        forecast.append({
            "date": (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d"),
            "predicted_modal": price,
            "lower_bound": round(price * 0.95, 2),
            "upper_bound": round(price * 1.05, 2),
        })
    
    # BUY / HOLD / SELL recommendation
    final_price = forecast[-1]["predicted_modal"]
    msp_val = COMMODITY_INFO.get(commodity_id, {}).get("msp") or 0
    price_change_7d = ((final_price - base_price) / base_price) * 100
    
    if price_change_7d > 5:
        recommendation = "HOLD"
        reason = f"Prices expected to rise +{price_change_7d:.1f}% in 7 days. Wait before selling."
    elif price_change_7d < -5:
        recommendation = "SELL"
        reason = f"Prices expected to fall {price_change_7d:.1f}%. Sell now to maximize returns."
    elif msp_val and base_price < msp_val * 1.05:
        recommendation = "HOLD"
        reason = f"Current price near MSP (₹{msp_val}). Monitor state procurement."
    else:
        recommendation = "SELL"
        reason = "Prices stable. Consider selling to manage storage costs."
    
    return {
        "commodity_id": commodity_id,
        "current_price": base_price,
        "forecast": forecast,
        "recommendation": recommendation,
        "recommendation_reason": reason,
        "price_change_7d_pct": round(price_change_7d, 2),
        "model": "SmartFarm-LSTM-v1 (mock)",
        "confidence": 0.72,
    }

def get_states() -> list:
    """Return sorted unique states."""
    return sorted(set(m["state"] for m in MANDIS))

def get_districts(state: str) -> list:
    """Return districts for a state."""
    return sorted(set(m["district"] for m in MANDIS if m["state"] == state))

def get_subdistricts(state: str, district: str) -> list:
    """Return sub-districts for a district."""
    return sorted(set(m["sub_district"] for m in MANDIS
                     if m["state"] == state and m["district"] == district))

def get_mandis_filtered(state: str = None, district: str = None, sub_district: str = None) -> list:
    """Return mandis with optional cascading filter."""
    result = MANDIS
    if state:
        result = [m for m in result if m["state"] == state]
    if district:
        result = [m for m in result if m["district"] == district]
    if sub_district:
        result = [m for m in result if m["sub_district"] == sub_district]
    return result

def get_mandis_nearby(lat: float, lng: float, radius_km: float = 100) -> list:
    """Return mandis within radius using Haversine distance."""
    import math
    def haversine(lat1, lng1, lat2, lng2):
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlng/2)**2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    result = []
    for m in MANDIS:
        dist = haversine(lat, lng, m["lat"], m["lng"])
        if dist <= radius_km:
            result.append({**m, "distance_km": round(dist, 1)})
    return sorted(result, key=lambda x: x["distance_km"])

def get_commodities_for_state(state: str) -> list:
    """Return available commodities for a state."""
    ids = STATE_COMMODITIES.get(state, list(COMMODITY_INFO.keys()))
    return [{"commodity_id": c, "commodity_name": COMMODITY_INFO[c]["display"]}
            for c in ids if c in COMMODITY_INFO]

def get_best_market(commodity_id: str, lat: float, lng: float, top_n: int = 5) -> list:
    """Find best markets for selling a commodity — balances price vs distance."""
    nearby = get_mandis_nearby(lat, lng, radius_km=300)
    results = []
    for m in nearby:
        price_data = get_price_for_commodity(commodity_id, m["id"])
        if price_data:
            # Score = (modal_price / base_price) / (1 + distance/100)
            base = BASE_PRICES.get(commodity_id, {}).get("modal", 1)
            score = (price_data["modal_price"] / base) / (1 + m["distance_km"] / 100)
            results.append({
                **m,
                **price_data,
                "profit_score": round(score, 3),
            })
    results.sort(key=lambda x: -x["profit_score"])
    return results[:top_n]
