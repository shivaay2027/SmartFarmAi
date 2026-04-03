"""
SmartFarm AI - Production ML Service
Primary:  Google Gemini 2.0 Flash (via google-genai SDK) — any image, all crops
Fallback: PlantVillage MobileNetV2 (38 disease classes)

Usage:
    $env:GEMINI_API_KEY="your_key"
    python main.py

Free tier: 1500 req/day, 15 RPM — https://aistudio.google.com/apikey
"""

import io
import os
import json
import base64
import re
import time
import logging
import math
from datetime import datetime, timedelta
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from PIL import Image
from pydantic import BaseModel
from database import MOCK_SCHEMES_DB, MOCK_PROFILES_DB, MOCK_RESULTS_DB
from schemes_service import generate_voice_explanation, determine_eligibility
from scraper import start_scheduler
from mandi_data import (
    get_states, get_districts, get_subdistricts, get_mandis_filtered,
    get_mandis_nearby, get_commodities_for_state, get_price_for_commodity,
    get_historical_prices, predict_prices_7day, get_best_market,
    normalize_commodity, MANDIS, COMMODITY_INFO, BASE_PRICES,
    get_price_for_commodity as _gp
)

app = FastAPI(title="SmartFarm AI - Production ML Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

logger = logging.getLogger("smartfarm")

@app.on_event("startup")
def on_startup():
    start_scheduler()

# ── GEMINI SETUP (new google-genai SDK) ───────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
gemini_client = None
GEMINI_MODEL = "gemini-flash-latest"

if GEMINI_API_KEY:
    try:
        from google import genai as google_genai
        gemini_client = google_genai.Client(api_key=GEMINI_API_KEY)
        print(f"+ Gemini {GEMINI_MODEL} ready.")
    except Exception as e:
        print(f"FAILED Gemini setup: {e}")
else:
    print("WARNING: GEMINI_API_KEY not set — using PlantVillage fallback only.")

# ── PLANTVILLAGE FALLBACK ─────────────────────────────────────────────────────
plant_classifier = None
try:
    from transformers import pipeline as hf_pipeline
    print("Loading PlantVillage fallback model…")
    plant_classifier = hf_pipeline(
        "image-classification",
        model="linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
    )
    print("+ PlantVillage fallback ready.")
except Exception as e:
    print(f"FAILED PlantVillage model not loaded: {e}")

# ── PLANTVILLAGE LABEL → (crop, disease, severity, treatment) ────────────────
PV_LABEL_DB = {
    "Apple Scab": ("Apple", "Apple Scab (Venturia inaequalis)", "High",
        "1. Apply Captan 50 WP @ 2 g/L or Myclobutanil 10 WP @ 0.5 g/L from bud break.\n2. Spray every 7–10 days during wet spring weather.\n3. Collect and destroy fallen infected leaves in autumn.\n4. Prune for open canopy. 5. Plant resistant varieties (Florina, GoldRush)."),
    "Apple with Black Rot": ("Apple", "Black Rot (Botryosphaeria obtusa)", "High",
        "1. Prune out all dead/cankered wood well below infection zone.\n2. Apply Captan 50 WP @ 2 g/L during growing season.\n3. Remove all mummified fruits from tree and ground.\n4. Sanitize tools with 70% alcohol."),
    "Cedar Apple Rust": ("Apple", "Cedar Apple Rust (Gymnosporangium juniperi-virginianae)", "Medium",
        "1. Apply Myclobutanil 10 WP @ 0.5 g/L from bud break, 3–4 sprays at 7–10 day intervals.\n2. Remove nearby eastern red cedar trees if feasible.\n3. Plant resistant varieties (Liberty, Redfree)."),
    "Healthy Apple": ("Apple", "Healthy — No Disease Detected", "None",
        "Apple is healthy. Apply Bordeaux mixture 1% before bud swell, maintain balanced NPK with micronutrients."),
    "Healthy Blueberry Plant": ("Blueberry", "Healthy — No Disease Detected", "None",
        "Blueberry is healthy. Maintain soil pH 4.5–5.0, prune 20% of oldest canes annually."),
    "Cherry with Powdery Mildew": ("Cherry", "Powdery Mildew (Podosphaera clandestina)", "Medium",
        "1. Wettable Sulphur 80 WP @ 2.5 g/L at first symptom.\n2. Myclobutanil 10 WP @ 0.5 g/L for established infection.\n3. Prune for open canopy. 4. Do NOT spray Sulphur above 30°C."),
    "Healthy Cherry Plant": ("Cherry", "Healthy — No Disease Detected", "None",
        "Cherry is healthy. Apply Bordeaux mixture 1% before bud swell."),
    "Corn (Maize) with Cercospora and Gray Leaf Spot": ("Maize/Corn", "Cercospora Gray Leaf Spot", "High",
        "1. Azoxystrobin 23 SC @ 1 ml/L at VT (tasseling) stage.\n2. Propiconazole 25 EC @ 1 ml/L 14 days later.\n3. Plant resistant hybrids, rotate with non-host crops."),
    "Corn (Maize) with Common Rust": ("Maize/Corn", "Common Rust (Puccinia sorghi)", "Medium",
        "1. Tebuconazole 25 EC @ 1 ml/L or Propiconazole 25 EC @ 1 ml/L at first symptom.\n2. Use resistant hybrids — most modern Bt hybrids have good rust tolerance."),
    "Corn (Maize) with Northern Leaf Blight": ("Maize/Corn", "Northern Leaf Blight (Exserohilum turcicum)", "High",
        "1. Mancozeb 75 WP @ 2 g/L at 45 and 60 DAS.\n2. Azoxystrobin + Propiconazole spray is most effective.\n3. Maintain plant spacing 60×20 cm."),
    "Healthy Corn (Maize) Plant": ("Maize/Corn", "Healthy — No Disease Detected", "None",
        "Maize is healthy. Top-dress Urea @ 40 kg N/ha at knee-high, monitor for Fall Armyworm weekly."),
    "Grape with Black Rot": ("Grape", "Black Rot (Guignardia bidwellii)", "High",
        "1. Remove mummified berries/infected canes before bud break.\n2. Myclobutanil 10 WP @ 0.5 g/L from bud break to 4 weeks post-bloom.\n3. Time sprays before rain events."),
    "Grape with Esca (Black Measles)": ("Grape", "Esca / Black Measles (Wood Disease Complex)", "High",
        "1. No chemical cure — prune affected wood, seal wounds with Thiophanate-methyl paste.\n2. Avoid water stress and over-cropping."),
    "Grape with Isariopsis Leaf Spot": ("Grape", "Isariopsis Leaf Spot", "Medium",
        "1. Mancozeb 75 WP @ 2 g/L or Carbendazim 50 WP @ 1 g/L.\n2. Bordeaux mixture 1% after pruning."),
    "Healthy Grape Plant": ("Grape", "Healthy — No Disease Detected", "None",
        "Grapevine is healthy. Preventive Bordeaux 0.5% at bud burst, balanced K nutrition."),
    "Orange with Citrus Greening": ("Orange / Citrus", "Huanglongbing / Citrus Greening (CLas)", "High",
        "1. CRITICAL — No cure. Remove and destroy infected trees immediately.\n2. Control Asian Citrus Psyllid: Imidacloprid 17.8 SL @ 0.5 ml/L.\n3. Report to local Plant Quarantine Authority."),
    "Peach with Bacterial Spot": ("Peach", "Bacterial Spot (Xanthomonas arboricola)", "High",
        "1. Copper hydroxide 77 WP @ 2 g/L during late dormancy.\n2. Continue Copper sprays at petal fall through summer.\n3. Avoid overhead irrigation."),
    "Healthy Peach Plant": ("Peach", "Healthy — No Disease Detected", "None",
        "Peach is healthy. Bordeaux mixture 1% at dormant stage, thin fruits to 15–20 cm."),
    "Bell Pepper with Bacterial Spot": ("Bell Pepper / Capsicum", "Bacterial Spot (Xanthomonas campestris)", "Medium",
        "1. Copper hydroxide 77 WP @ 2 g/L + Streptocycline @ 200 ppm.\n2. Drip irrigation. Rotate with non-solanaceous crops."),
    "Healthy Bell Pepper Plant": ("Bell Pepper / Capsicum", "Healthy — No Disease Detected", "None",
        "Bell pepper is healthy. Preventive Copper oxychloride at 30, 45, 60 DAT."),
    "Potato with Early Blight": ("Potato", "Early Blight (Alternaria solani)", "Medium",
        "1. Mancozeb 75 WP @ 2 g/L from 40–45 DAS.\n2. Adequate potassium K2O @ 60 kg/ha.\n3. Chlorothalonil 75 WP @ 2 g/L as alternative."),
    "Potato with Late Blight": ("Potato", "Late Blight (Phytophthora infestans)", "High",
        "1. CRITICAL — act within 24 hours.\n2. Metalaxyl + Mancozeb @ 2.5 g/L every 5–7 days.\n3. Destroy infected haulm 2 weeks before harvest."),
    "Healthy Potato Plant": ("Potato", "Healthy — No Disease Detected", "None",
        "Potato is healthy. Earthing-up at 30 and 45 DAS, balanced NPK (120:60:120 kg/ha)."),
    "Healthy Raspberry Plant": ("Raspberry", "Healthy — No Disease Detected", "None",
        "Raspberry is healthy. Remove fruited canes after harvest."),
    "Healthy Soybean Plant": ("Soybean", "Healthy — No Disease Detected", "None",
        "Soybean is healthy. Rhizobium inoculation, Sulphur preventive at pod-fill."),
    "Squash with Powdery Mildew": ("Squash / Pumpkin", "Powdery Mildew (Podosphaera xanthii)", "Medium",
        "1. Wettable Sulphur 80 WP @ 2.5 g/L.\n2. Potassium bicarbonate @ 5 g/L (organic option).\n3. Neem oil 2% at 7-day intervals."),
    "Strawberry with Leaf Scorch": ("Strawberry", "Leaf Scorch (Diplocarpon earlianum)", "Medium",
        "1. Captan 50 WP @ 2 g/L or Myclobutanil 10 WP @ 0.5 g/L.\n2. Remove infected leaves. Drip irrigation."),
    "Healthy Strawberry Plant": ("Strawberry", "Healthy — No Disease Detected", "None",
        "Strawberry is healthy. Straw mulch, monitor for spider mites under leaves."),
    "Tomato with Bacterial Spot": ("Tomato", "Bacterial Spot (Xanthomonas campestris)", "Medium",
        "1. Copper oxychloride 50 WP @ 3 g/L + Streptocycline @ 200 ppm.\n2. Drip irrigation. Rotate with non-solanaceous crops."),
    "Tomato with Early Blight": ("Tomato", "Early Blight (Alternaria solani)", "High",
        "1. Remove infected leaves from bottom up immediately.\n2. Mancozeb 75 WP @ 2 g/L every 7–10 days.\n3. Switch to Azoxystrobin 23 SC @ 1 ml/L if disease progresses."),
    "Tomato with Late Blight": ("Tomato", "Late Blight (Phytophthora infestans)", "High",
        "1. Act immediately — spreads very rapidly.\n2. Cymoxanil + Mancozeb @ 3 g/L every 5–7 days.\n3. Remove and burn infected plants."),
    "Tomato with Leaf Mold": ("Tomato", "Leaf Mold (Passalora fulva)", "Medium",
        "1. Chlorothalonil 75 WP @ 2 g/L.\n2. Reduce humidity below 85%. Improve ventilation."),
    "Tomato with Septoria Leaf Spot": ("Tomato", "Septoria Leaf Spot (Septoria lycopersici)", "Medium",
        "1. Remove lower infected leaves.\n2. Chlorothalonil 75 WP @ 2 g/L every 7–10 days.\n3. Mulch to prevent soil splash."),
    "Tomato with Spider Mites or Two-spotted Spider Mite": ("Tomato", "Two-Spotted Spider Mite (Tetranychus urticae)", "Medium",
        "1. Abamectin 1.8 EC @ 0.5 ml/L. 2. Spray under leaf surface.\n3. Rotate miticides — mites develop resistance rapidly."),
    "Tomato with Target Spot": ("Tomato", "Target Spot (Corynespora cassiicola)", "Medium",
        "1. Azoxystrobin 23 SC @ 1 ml/L at first symptom.\n2. Alternate Tebuconazole 25 EC @ 1 ml/L every 14 days."),
    "Tomato Yellow Leaf Curl Virus": ("Tomato", "Yellow Leaf Curl Virus (TYLCV) — Viral", "High",
        "1. No chemical cure. Control whitefly: Imidacloprid 17.8 SL @ 0.3 ml/L.\n2. Uproot and destroy infected plants.\n3. Silver reflective mulch repels whitefly."),
    "Tomato Mosaic Virus": ("Tomato", "Tomato Mosaic Virus (ToMV) — Viral", "High",
        "1. Remove and destroy infected plants immediately.\n2. Disinfect tools with 10% bleach.\n3. Control aphid vectors: Dimethoate 30 EC @ 2 ml/L."),
    "Healthy Tomato Plant": ("Tomato", "Healthy — No Disease Detected", "None",
        "Tomato is healthy. Monthly Mancozeb preventive spray, drip irrigation, top-dress K @ 30 kg K2O/ha after fruit set."),
}

# ── EXPERT AGRICULTURAL PROMPT ────────────────────────────────────────────────
GEMINI_PROMPT = """You are a senior agricultural pathologist and plant disease expert with 25+ years of experience, specializing in Indian farming crops. A farmer has uploaded this image for disease diagnosis.

Analyze the image carefully and respond ONLY with a valid JSON object (no markdown, no text outside JSON):
{
  "crop_name": "exact common crop name (e.g. Tomato, Rice Paddy, Wheat, Mango, Cotton, Potato, Chilli)",
  "disease_name": "exact disease/pest/deficiency name with scientific name in parentheses, or 'Healthy — No Disease Detected'",
  "is_healthy": false,
  "confidence": 87,
  "severity": "High",
  "symptoms_observed": "What you specifically see in this image — describe visible symptoms in 1-2 sentences",
  "treatment": "1. Specific step with Indian product names and dosages\\n2. Step two\\n3. Step three\\n4. Step four\\n5. Step five if needed",
  "prevention": "Key future prevention in 1 sentence",
  "immediate_action": "Single most critical action the farmer must take RIGHT NOW"
}

Critical rules:
- "severity" must be exactly: "None", "Low", "Medium", or "High"
- "confidence" is integer 0-100
- If healthy: is_healthy=true, severity="None", disease_name="Healthy — No Disease Detected"
- If image is poor quality/blurry: give best diagnosis, lower confidence to 50-65
- Use Indian product names and dosages (per litre of water or kg/ha)
- Include specific concentrations (e.g. "Mancozeb 75 WP @ 2 g/L" not just "fungicide")
- For viral diseases: state "No chemical cure" and focus on vector control
- For severe diseases: start immediate_action with "URGENT:"
- Cover ALL Indian crops including: Rice, Wheat, Maize, Bajra, Jowar, Ragi, all Millets, Cotton, Sugarcane, Groundnut, Soybean, Mustard, Sunflower, all Pulses (Arhar/Toor, Urad, Moong, Masoor, Chickpea, Peas), all Vegetables (Tomato, Potato, Onion, Garlic, Chilli, Capsicum, Brinjal, Okra, Cabbage, all Gourds, Carrot, Radish, Spinach, Fenugreek), all Fruits (Mango, Banana, Coconut, Citrus, Apple, Guava, Pomegranate, Papaya, Grapes, Watermelon, Pineapple, Litchi), Spices (Ginger, Turmeric, Coriander), Cash crops (Cotton, Sugarcane, Tobacco, Jute, Rubber, Tea, Coffee)"""


def call_gemini(img_bytes: bytes):
    """Call Gemini Vision API using new google-genai SDK."""
    from google import genai as google_genai
    from google.genai import types as genai_types

    pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=85)
    jpeg_bytes = buf.getvalue()

    try:
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                genai_types.Part.from_bytes(data=jpeg_bytes, mime_type="image/jpeg"),
                GEMINI_PROMPT,
            ],
            config=genai_types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=4096,
            ),
        )
        text = response.text.strip()
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        return json.loads(text)
    except Exception as e:
        print(f"genai_client.models.generate_content failed: {e}")
        raise e
    return json.loads(text)


def call_plantvillage(pil_img: Image.Image):
    results = plant_classifier(pil_img, top_k=5)
    top = results[0]
    label = top["label"]
    conf = round(float(top["score"]) * 100, 1)
    crop, disease, sev, treat = PV_LABEL_DB.get(
        label,
        ("Unknown Crop", label, "Medium", "Consult a local KVK agronomist.")
    )
    return {
        "crop_name": crop, "disease_name": disease, "confidence": conf,
        "severity": sev, "treatment": treat,
        "symptoms_observed": f"PlantVillage model detected: {label}",
        "prevention": "Monitor regularly and maintain field hygiene.",
        "immediate_action": "Follow the treatment steps above promptly.",
        "is_healthy": sev == "None",
        "top_preds": [{"label": r["label"], "score": round(float(r["score"]) * 100, 1)} for r in results],
    }


# ── ENDPOINTS ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "SmartFarm AI running",
        "gemini_enabled": gemini_client is not None,
        "gemini_model": GEMINI_MODEL if gemini_client else None,
        "plantvillage_fallback": plant_classifier is not None,
        "mode": "production-gemini" if gemini_client else ("plantvillage-fallback" if plant_classifier else "offline"),
    }


@app.post("/api/v1/ai/vision/detect")
async def detect_disease(image: UploadFile = File(...)):
    try:
        contents = await image.read()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image. Please upload JPG or PNG.")

    det = None
    model_used = "none"

    # ── PRIMARY: Gemini ───────────────────────────────────────────────────
    if gemini_client:
        try:
            g = call_gemini(contents)
            sev = g.get("severity", "Medium")
            if sev not in ("None", "Low", "Medium", "High"):
                sev = "Medium"
            det = {
                "crop_name": g.get("crop_name", "Unknown Crop"),
                "class": g.get("disease_name", "Unknown"),
                "confidence": float(g.get("confidence", 80)),
                "severity": sev,
                "severity_score": 0.9 if sev == "High" else 0.6 if sev == "Medium" else 0.2 if sev == "Low" else 0.0,
                "recommendation": g.get("treatment", ""),
                "symptoms_observed": g.get("symptoms_observed", ""),
                "prevention": g.get("prevention", ""),
                "immediate_action": g.get("immediate_action", ""),
                "is_healthy": bool(g.get("is_healthy", False)),
            }
            model_used = f"Google Gemini ({GEMINI_MODEL})"
        except Exception as e:
            print(f"Gemini fallback triggered: {e}")

    # ── FALLBACK: PlantVillage ────────────────────────────────────────────
            model_used = "PlantVillage-MobileNetV2 (fallback)"
        except Exception as e:
            print(f"PlantVillage error: {e}")

    if det is None:
        raise HTTPException(status_code=503,
            detail="No AI models available. Set GEMINI_API_KEY and restart.")

    return {"status": "success", "model_used": model_used, "detections": [det]}

# ── GOVT SCHEMES AND ELIGIBILITY ROUTES ───────────────────────────────────────

class TTSRequest(BaseModel):
    text: str
    lang: str = "en"

@app.get("/api/v1/schemes")
def list_schemes(lang: str = "en", farmer_id: str = "FARMER_123"):
    """
    Returns AI-summarized schemes. Maps the chosen language and checks eligibility
    using the rule engine for the given farmer.
    """
    farmer = MOCK_PROFILES_DB.get(farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")

    response_list = []
    for s_id, scheme in MOCK_SCHEMES_DB.items():
        # Create a localized copy of the scheme details
        localized_data = {
            "id": scheme.id,
            "category": scheme.scheme_type,
            "match": 85,  # Mock generic score
            "thumbnail_icon": scheme.thumbnail_icon
        }

        # Handle Translations
        if lang != "en" and scheme.translations and lang in scheme.translations:
            # Overwrite base fields with translated fields
            t = scheme.translations[lang]
            localized_data["name"] = t.get("name", scheme.name)
            localized_data["desc"] = t.get("ai_short_benefit_line", scheme.ai_short_benefit_line)
            localized_data["full_explanation"] = t.get("ai_farmer_explanation", scheme.ai_farmer_explanation)
        else:
            localized_data["name"] = scheme.name
            localized_data["desc"] = scheme.ai_short_benefit_line
            localized_data["full_explanation"] = scheme.ai_farmer_explanation

        # Check Eligibility
        eligibility = determine_eligibility(scheme, farmer)
        localized_data["eligible"] = (eligibility.eligible == "Eligible")
        localized_data["eligibility_reason"] = eligibility.reason
        localized_data["missing_requirements"] = eligibility.missing_requirements
        
        response_list.append(localized_data)
        
    # Sort eligible ones first
    response_list.sort(key=lambda x: not x["eligible"])
    return {"status": "success", "farmer": farmer.name, "data": response_list}

@app.post("/api/v1/schemes/tts")
def text_to_speech(req: TTSRequest):
    """Generates an mp3 base64 string for the farmer to listen to the scheme."""
    audio_b64 = generate_voice_explanation(req.text, req.lang)
    if audio_b64:
        return {"status": "success", "audio_base64": audio_b64}
    return {"status": "error", "message": "TTS generation failed"}


# ── MANDI PRICE API ENDPOINTS ────────────────────────────────────────────────

@app.get("/api/v1/mandi/states")
def mandi_states():
    """Return all states that have mandi data."""
    return {"status": "success", "data": get_states()}


@app.get("/api/v1/mandi/districts")
def mandi_districts(state: str):
    """Return districts for a given state."""
    d = get_districts(state)
    if not d:
        raise HTTPException(status_code=404, detail=f"No districts found for state: {state}")
    return {"status": "success", "state": state, "data": d}


@app.get("/api/v1/mandi/subdistricts")
def mandi_subdistricts(state: str, district: str):
    """Return sub-districts/tehsils for a given district."""
    sd = get_subdistricts(state, district)
    return {"status": "success", "state": state, "district": district, "data": sd}


@app.get("/api/v1/mandi/list")
def mandi_list(state: str = None, district: str = None, sub_district: str = None):
    """Return mandis with cascading filters. Includes commodity availability."""
    mandis = get_mandis_filtered(state, district, sub_district)
    return {"status": "success", "count": len(mandis), "data": mandis}


@app.get("/api/v1/mandi/commodities")
def mandi_commodities(state: str = None):
    """Return commodities available in a state (or all if no state)."""
    if state:
        data = get_commodities_for_state(state)
    else:
        data = [{"commodity_id": k, "commodity_name": v["display"]} for k, v in COMMODITY_INFO.items()]
    return {"status": "success", "data": data}


@app.get("/api/v1/mandi/prices")
def mandi_prices(mandi_id: str, commodity_id: str = None, state: str = None):
    """
    Return current prices for a mandi.
    If commodity_id provided: single commodity.
    Otherwise: all relevant commodities for that mandi's state.
    """
    mandi = next((m for m in MANDIS if m["id"] == mandi_id), None)
    if not mandi:
        raise HTTPException(status_code=404, detail=f"Mandi not found: {mandi_id}")

    if commodity_id:
        # Normalize if needed
        norm = normalize_commodity(commodity_id) or commodity_id.upper()
        price = get_price_for_commodity(norm, mandi_id)
        if not price:
            raise HTTPException(status_code=404, detail=f"Commodity not found: {commodity_id}")
        return {"status": "success", "mandi": mandi, "prices": [price]}

    # Return all commodities for that state
    commodities = get_commodities_for_state(mandi["state"])
    prices = []
    for c in commodities:
        p = get_price_for_commodity(c["commodity_id"], mandi_id)
        if p:
            prices.append(p)
    prices.sort(key=lambda x: -x["modal_price"])
    return {"status": "success", "mandi": mandi, "count": len(prices), "prices": prices}


@app.get("/api/v1/mandi/price-trend")
def mandi_price_trend(mandi_id: str, commodity_id: str, days: int = 30):
    """Return historical price trend for charting."""
    mandi = next((m for m in MANDIS if m["id"] == mandi_id), None)
    if not mandi:
        raise HTTPException(status_code=404, detail=f"Mandi not found: {mandi_id}")
    norm = normalize_commodity(commodity_id) or commodity_id.upper()
    history = get_historical_prices(norm, mandi_id, days=min(days, 90))
    return {"status": "success", "mandi": mandi, "commodity_id": norm, "history": history}


@app.get("/api/v1/mandi/nearby")
def mandi_nearby(lat: float, lng: float, radius_km: float = 100, commodity_id: str = None):
    """Return mandis within radius, optionally filtered by commodity."""
    mandis = get_mandis_nearby(lat, lng, radius_km)
    if commodity_id:
        norm = normalize_commodity(commodity_id) or commodity_id.upper()
        result = []
        for m in mandis:
            price = get_price_for_commodity(norm, m["id"])
            if price:
                result.append({**m, "price": price})
        return {"status": "success", "count": len(result), "data": result}
    return {"status": "success", "count": len(mandis), "data": mandis}


@app.get("/api/v1/mandi/predict")
def mandi_predict(mandi_id: str, commodity_id: str):
    """AI price prediction: next 7-day forecast + BUY/HOLD/SELL recommendation."""
    mandi = next((m for m in MANDIS if m["id"] == mandi_id), None)
    if not mandi:
        raise HTTPException(status_code=404, detail=f"Mandi not found: {mandi_id}")
    norm = normalize_commodity(commodity_id) or commodity_id.upper()
    prediction = predict_prices_7day(norm, mandi_id)
    if not prediction:
        raise HTTPException(status_code=404, detail=f"Cannot predict for commodity: {commodity_id}")
    return {"status": "success", "mandi": mandi, "prediction": prediction}


@app.get("/api/v1/mandi/search")
def mandi_search(q: str):
    """Full-text search across mandi names, districts, states."""
    q_lower = q.strip().lower()
    results = [m for m in MANDIS if
               q_lower in m["name"].lower() or
               q_lower in m["district"].lower() or
               q_lower in m["state"].lower() or
               q_lower in m["sub_district"].lower()]
    return {"status": "success", "query": q, "count": len(results), "data": results}


# ── LIVE PRICE FETCH ENDPOINT ─────────────────────────────────────────────────
try:
    from live_mandi_fetcher import fetch_live_prices_gov, fetch_live_prices_scrape, fetch_prices_smart
    _live_fetcher_ok = True
except ImportError:
    _live_fetcher_ok = False

_live_cache = {}   # {cache_key: (timestamp, records)}
CACHE_TTL_SECS = 3600  # 1 hour

@app.get("/api/v1/mandi/live-prices")
def mandi_live_prices(
    state: str = None,
    commodity: str = None,
    market: str = None,
    district: str = None,
    limit: int = 2000
):
    """
    Fetch TODAY's actual mandi prices using a TWO-TIER strategy:
    - Tier 1 (Official APMC): Agmarknet / data.gov.in API
      → Used for all government-registered APMCs (~7,000+ mandis)
    - Tier 2 (Local/Sub-district): Regional scrapers
      → MP Mandi Board, Rajasthan RSAMB, UP Mandi Parishad, eNAM, Agriwatch
      → Triggered automatically when the selected market is NOT found in Tier-1

    Pass `market=<mandi_name>` to enable smart routing.
    Without market filter, returns full state-level Tier-1 data.
    """
    import time
    cache_key = f"{state}|{commodity}|{market}"
    now_ts = time.time()

    # Return cached data if fresh
    if cache_key in _live_cache:
        cached_ts, cached_data, cached_source = _live_cache[cache_key]
        if now_ts - cached_ts < CACHE_TTL_SECS:
            return {
                "status": "success", "source": "cache",
                "count": len(cached_data), "data": cached_data,
                "cached_at": datetime.fromtimestamp(cached_ts).isoformat()
            }

    if not _live_fetcher_ok:
        raise HTTPException(status_code=503, detail="Live fetcher not available")

    # Two-tier smart fetch
    result = fetch_prices_smart(
        state=state or "Madhya Pradesh",
        market=market,
        district=district,
        commodity=commodity,
        limit=limit,
    )

    records = [r for r in result["records"] if r.get("modal_price", 0) > 0]
    source = result["source"]
    tier = result.get("tier", 1)

    _live_cache[cache_key] = (now_ts, records, source)
    return {
        "status":  "success",
        "source":  source,
        "tier":    tier,
        "market_found_in_api": result.get("market_found_in_api", False),
        "date":    datetime.now().strftime("%Y-%m-%d"),
        "count":   len(records),
        "data":    records,
    }


# ── HISTORICAL PRICES ENDPOINT ────────────────────────────────────────────────
_hist_cache = {}

@app.get("/api/v1/mandi/historical-prices")
def mandi_historical(commodity: str, state: str = None, market: str = None, days: int = 30):
    """
    Fetch last N days of price data from Agmarknet (parallel fetching for speed).
    Returns list of {date, min_price, modal_price, max_price, count}.
    """
    import time
    cache_key = f"hist|{state}|{commodity}|{days}"
    now_ts = time.time()
    if cache_key in _hist_cache:
        ts, data = _hist_cache[cache_key]
        if now_ts - ts < 3600:
            return {"status": "success", "source": "cache", "data": data}

    if not _live_fetcher_ok:
        return {"status": "error", "data": []}

    from live_mandi_fetcher import fetch_historical_prices
    result = fetch_historical_prices(commodity=commodity, state=state, days=days)

    _hist_cache[cache_key] = (now_ts, result)
    return {"status": "success", "source": "agmarknet_api", "commodity": commodity, "data": result}


# ── AI FORECAST ENDPOINT (Gemini) ─────────────────────────────────────────────
_forecast_cache = {}

# Official MSP 2024-25 data for enriching AI prompt
_MSP_CONTEXT = {
    "Wheat": 2275, "Paddy": 2300, "Maize": 2090, "Bajra": 2625,
    "Jowar": 3371, "Soya seeds": 4892, "Mustard": 5650, "Groundnut": 6783,
    "Sunflower Seed": 7280, "Cotton": 7020, "Sugarcane": 340, "Jute": 5335,
    "Arhar": 7550, "Moong": 8682, "Urad": 7400,
    "Bengal Gram": 5440, "Masoor Dal": 6425, "Sesamum": 9267,
}

# Seasonal volatility coefficients by commodity type (% per week)
_VOLATILITY = {
    "vegetable": 8.0, "onion": 12.0, "tomato": 15.0, "potato": 6.0,
    "garlic": 9.0, "soya": 2.5, "wheat": 1.8, "rice": 1.5, "paddy": 1.5,
    "maize": 2.2, "bajra": 2.8, "chana": 2.0, "arhar": 2.5, "urad": 2.8,
    "moong": 2.5, "mustard": 2.2, "groundnut": 3.0, "cotton": 2.0,
    "default": 3.5,
}

def _get_volatility(commodity: str) -> float:
    cl = commodity.lower()
    for k, v in _VOLATILITY.items():
        if k in cl:
            return v
    return _VOLATILITY["default"]


@app.get("/api/v1/mandi/forecast")
def mandi_forecast(commodity: str, state: str = None, current_price: float = 0):
    """AI price forecast using Gemini (google.genai SDK) based on historical + MSP data."""
    import time, json, random, math
    cache_key = f"fc|{state}|{commodity}"
    now_ts = time.time()
    if cache_key in _forecast_cache:
        ts, data = _forecast_cache[cache_key]
        if now_ts - ts < 7200:
            return {"status": "success", "source": "cache", "data": data}

    # Get historical data
    hist_resp = mandi_historical(commodity=commodity, state=state, days=14)
    hist_data = hist_resp.get("data", [])

    cur = current_price or (hist_data[-1]["modal_price"] if hist_data else 0)
    if not cur:
        # Fetch today's price if not provided
        live_recs = []
        try:
            from live_mandi_fetcher import fetch_live_prices_gov
            live_recs = fetch_live_prices_gov(commodity=commodity, state=state, limit=50)
        except Exception:
            pass
        cur = live_recs[0]["modal_price"] if live_recs else 3000

    # Find MSP for context
    msp_val = None
    for k, v in _MSP_CONTEXT.items():
        if k.lower() in commodity.lower() or commodity.lower() in k.lower():
            msp_val = v
            break

    msp_note = f"Official MSP (govt floor price): ₹{msp_val}/Quintal" if msp_val else "No MSP set for this crop"
    hist_summary = [(d["date"], d["modal_price"]) for d in hist_data[-7:]] if hist_data else [(datetime.now().strftime("%d/%m/%Y"), cur)]

    prompt = f"""You are an expert Indian agricultural market analyst with deep knowledge of mandi prices.

Commodity: {commodity}
State: {state or "India"}
Today's modal price: ₹{cur}/Quintal  
{msp_note}
Recent price history (date, price): {hist_summary}
Current month: {datetime.now().strftime("%B %Y")}

Analyze supply/demand dynamics, seasonal patterns, procurement policies, and market arrivals for {commodity} in {state or 'India'} this season.

Respond with ONLY this JSON (no markdown, no text outside):
{{
  "forecast": [
    {{"day": 1, "date": "YYYY-MM-DD", "predicted": <realistic_int>, "low": <int>, "high": <int>}},
    {{"day": 2, ...}}, {{"day": 3, ...}}, {{"day": 4, ...}}, {{"day": 5, ...}}, {{"day": 6, ...}}, {{"day": 7, ...}}
  ],
  "recommendation": "BUY" or "SELL" or "HOLD",
  "expected_change_pct": <realistic_non_zero_float>,
  "reason": "<1 precise sentence about price direction>",
  "factors": ["<seasonal factor>", "<supply factor>", "<policy/demand factor>"]
}}

Base day 1 date: {(datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")}
Prices in ₹/Quintal. The expected_change_pct MUST be non-zero — base it on real seasonal trends."""

    # Try google.genai (new SDK preferred — old SDK is deprecated and broken)
    try:
        import google.genai as genai_new
        client = genai_new.Client()
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        raw = response.text.strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()
        fc = json.loads(raw)
        _forecast_cache[cache_key] = (now_ts, fc)
        return {"status": "success", "source": "gemini", "current_price": cur, "data": fc}
    except Exception as e_new:
        logger.warning(f"google.genai forecast failed: {e_new}")

    # Try old genai as secondary fallback
    try:
        import google.generativeai as genai_old
        model = genai_old.GenerativeModel("gemini-2.0-flash")
        resp = model.generate_content(prompt)
        raw = resp.text.strip().replace("```json", "").replace("```", "").strip()
        fc = json.loads(raw)
        _forecast_cache[cache_key] = (now_ts, fc)
        return {"status": "success", "source": "gemini", "current_price": cur, "data": fc}
    except Exception as e_old:
        logger.warning(f"old genai forecast failed: {e_old}")

    # ── Smart statistical fallback (NOT 0%) ──────────────────────────────────
    # Use commodity volatility + seasonal bias to generate meaningful prediction
    vol_pct = _get_volatility(commodity) / 100.0   # weekly volatility
    
    # Detect if price is near/below MSP → likely to rise (policy support)
    if msp_val and cur < msp_val * 1.05:
        bias = abs(vol_pct) * 0.5    # small upward pressure from procurement
    elif msp_val and cur > msp_val * 1.5:
        bias = -abs(vol_pct) * 0.3   # above-MSP, slight mean reversion
    else:
        # Use historical trend if available, else small seasonal random walk
        if len(hist_data) >= 2:
            trend = (hist_data[-1]["modal_price"] - hist_data[0]["modal_price"]) / len(hist_data)
            bias = trend / max(cur, 1)
        else:
            # March/April = rabi harvest ↓ for wheat/gram; kharif demand ↑ for others
            month = datetime.now().month
            is_rabi_harvest = month in [3, 4, 5]
            comm_l = commodity.lower()
            is_rabi = any(x in comm_l for x in ["wheat", "chana", "gram", "mustard", "masoor"])
            if is_rabi and is_rabi_harvest:
                bias = -vol_pct * 0.4   # supply surge → price dip
            else:
                bias = vol_pct * 0.2    # normal slight gain

    forecast = []
    for i in range(7):
        dt = datetime.now() + timedelta(days=i+1)
        # Simulate smooth walk with volatility
        daily_move = bias / 7 + (vol_pct / 7) * math.sin(i * 0.9) * 0.3
        p = round(cur * (1 + daily_move * (i + 1)))
        p = max(p, 1)
        spread = round(p * vol_pct * 0.5)
        forecast.append({
            "day": i+1, "date": dt.strftime("%Y-%m-%d"),
            "predicted": p, "low": max(p - spread, 1), "high": p + spread
        })

    change_pct = round((forecast[-1]["predicted"] - cur) / max(cur, 1) * 100, 1)
    rec = "SELL" if change_pct < -4 else "BUY" if change_pct > 5 else "HOLD"
    month_name = datetime.now().strftime("%B")
    
    fc = {
        "forecast": forecast, "recommendation": rec,
        "expected_change_pct": change_pct,
        "reason": f"Seasonal patterns for {commodity} in {month_name} suggest {'downward' if change_pct < 0 else 'upward'} price movement based on historical mandi trends.",
        "factors": [
            f"{'Rabi harvest arrivals increasing supply' if change_pct < 0 else 'Rising demand from processors'}",
            f"MSP floor at ₹{msp_val}/Quintal providing support" if msp_val else "Government procurement policy influence",
            "Seasonal weather and transport cost variations"
        ]
    }
    _forecast_cache[cache_key] = (now_ts, fc)
    return {"status": "success", "source": "statistical", "current_price": cur, "data": fc}




# ── BEST MARKET ENDPOINT ──────────────────────────────────────────────────────
@app.get("/api/v1/mandi/best-market")
def mandi_best_market(commodity: str, state: str = None, lat: float = None, lng: float = None):
    """Find best markets (highest modal price) for a commodity across India."""
    if not _live_fetcher_ok:
        return {"status": "error", "data": []}

    from live_mandi_fetcher import fetch_live_prices_gov

    # Strategy 1: filter by commodity nationwide (most likely to work)
    records = fetch_live_prices_gov(commodity=commodity, limit=3000)

    # Strategy 2: Try state-scoped then national broad fetch
    if not records:
        records = fetch_live_prices_gov(state=state, limit=3000) if state else []
    if not records:
        records = fetch_live_prices_gov(limit=3000)

    if not records:
        return {"status": "no_data", "commodity": commodity, "data": []}

    # Fuzzy commodity filtering — match by overlapping words
    comm_lower = commodity.lower().replace("(", " ").replace(")", " ").split()
    keywords = [w for w in comm_lower if len(w) >= 4]

    def commodity_matches(r_comm: str) -> bool:
        rc = r_comm.lower()
        return any(kw in rc for kw in keywords) if keywords else comm_lower[0][:4] in rc if comm_lower else True

    filtered = [r for r in records if commodity_matches(r.get("commodity", ""))]

    # Fallback: if still nothing, return top markets regardless of exact commodity match
    if not filtered:
        filtered = records[:100]

    # Deduplicate: one entry per market (take highest modal)
    markets: dict = {}
    for r in filtered:
        key = f"{r['market']}|{r['district']}|{r['state']}"
        if key not in markets or r["modal_price"] > markets[key]["modal_price"]:
            markets[key] = r

    sorted_markets = sorted(markets.values(), key=lambda x: x["modal_price"], reverse=True)
    result = [dict(m) for m in sorted_markets[:15]]

    return {"status": "success", "commodity": commodity, "count": len(result), "data": result}


# ── SPARKLINE / MINI TREND ENDPOINT ──────────────────────────────────────────
_sparkline_cache = {}

@app.get("/api/v1/mandi/sparkline")
def mandi_sparkline(commodity: str, state: str = None):
    """Get 7-day price trend for sparklines in the price table."""
    import time
    cache_key = f"sp|{state}|{commodity}"
    now_ts = time.time()
    if cache_key in _sparkline_cache:
        ts, data = _sparkline_cache[cache_key]
        if now_ts - ts < 3600:
            return {"status": "success", "source": "cache", "data": data}

    hist_resp = mandi_historical(commodity=commodity, state=state, days=7)
    hist_data = hist_resp.get("data", [])
    prices = [d["modal_price"] for d in hist_data] if hist_data else []
    _sparkline_cache[cache_key] = (now_ts, prices)
    return {"status": "success", "data": prices}


# ───────────────────────────────────────────────────────────────────────────────
# 🌱  INTELLIGENT CROP RECOMMENDER  —  POST /api/v1/recommend-crop
# ───────────────────────────────────────────────────────────────────────────────

from typing import List, Optional
from pydantic import BaseModel, Field

class CropRecommendRequest(BaseModel):
    # Soil parameters
    ph: float = Field(6.5, ge=3.0, le=10.0)
    nitrogen: float = Field(80.0, ge=0, le=300)          # kg/ha
    phosphorus: float = Field(60.0, ge=0, le=200)         # kg/ha
    potassium: float = Field(50.0, ge=0, le=200)          # kg/ha
    moisture_pct: float = Field(55.0, ge=0, le=100)

    # Weather
    temperature_c: float = Field(28.0, ge=0, le=50)
    rainfall_mm: float = Field(800.0, ge=0, le=5000)
    humidity_pct: float = Field(65.0, ge=0, le=100)

    # Location & profile
    state: str = "Maharashtra"
    agro_zone: str = "Semi-arid"                          # e.g. Arid / Semi-arid / Humid / Sub-humid
    lat: float = 19.99
    lng: float = 73.79
    farm_size_ha: float = Field(2.0, ge=0.1, le=500)
    budget_inr: float = Field(50000.0, ge=0)
    irrigation: str = "drip"                              # drip / flood / rainfed
    risk_appetite: str = "medium"                         # low / medium / high
    harvest_months: List[int] = [6, 7, 8]                 # months farmer wants to harvest (1-12)
    soil_type: str = "loamy"                              # sandy / loamy / clayey / black / red


# ── 40-CROP AGRONOMY DATABASE ──────────────────────────────────────────────────
# Each entry: ph_range, temp_range, rain_range, moisture_range, nitrogen_req,
#             seasons (months harvest-ready), input_cost_per_ha, labor_per_ha,
#             typical_yield_q_per_ha, market_commodity_name, risk_base, water_need
_CROP_DB = {
    # ── Vegetables ────────────────────────────────────────────────────────────
    "Tomato":       dict(ph=(5.5,7.5),temp=(20,35),rain=(600,1500),moist=(50,80),n_req=120,seasons=[6,7,8,9,10,11,12,1,2],input=35000,labor=25000,yield_q=250,commodity="Tomato",risk_base=0.55,water="medium"),
    "Onion":        dict(ph=(5.8,6.8),temp=(15,30),rain=(650,750),moist=(40,70),n_req=80,seasons=[10,11,12,1,2,3,4],input=28000,labor=20000,yield_q=200,commodity="Onion",risk_base=0.48,water="medium"),
    "Potato":       dict(ph=(5.0,6.5),temp=(15,25),rain=(500,700),moist=(60,80),n_req=120,seasons=[10,11,12,1,2,3],input=32000,labor=18000,yield_q=250,commodity="Potato",risk_base=0.40,water="medium"),
    "Cabbage":      dict(ph=(6.0,7.5),temp=(10,25),rain=(380,500),moist=(60,80),n_req=100,seasons=[10,11,12,1,2,3],input=22000,labor=15000,yield_q=300,commodity="Cabbage",risk_base=0.35,water="medium"),
    "Cauliflower":  dict(ph=(6.0,7.5),temp=(10,25),rain=(380,500),moist=(60,80),n_req=100,seasons=[10,11,12,1,2,3],input=22000,labor=16000,yield_q=200,commodity="Cauliflower",risk_base=0.38,water="medium"),
    "Brinjal":      dict(ph=(5.5,6.8),temp=(20,35),rain=(500,750),moist=(50,75),n_req=90,seasons=[6,7,8,9,10,11,12],input=20000,labor=15000,yield_q=200,commodity="Brinjal",risk_base=0.42,water="medium"),
    "Okra":         dict(ph=(6.0,6.8),temp=(25,40),rain=(500,1200),moist=(40,70),n_req=80,seasons=[4,5,6,7,8,9],input=18000,labor=14000,yield_q=100,commodity="Ladies Finger",risk_base=0.38,water="low"),
    "Green Chilli": dict(ph=(6.0,7.0),temp=(20,35),rain=(600,1200),moist=(50,75),n_req=100,seasons=[5,6,7,8,9,10],input=25000,labor=20000,yield_q=120,commodity="Chilli",risk_base=0.50,water="medium"),
    "Carrot":       dict(ph=(6.0,7.5),temp=(15,25),rain=(400,600),moist=(55,75),n_req=80,seasons=[10,11,12,1,2],input=20000,labor=18000,yield_q=180,commodity="Carrot",risk_base=0.35,water="medium"),
    "Spinach":      dict(ph=(6.5,7.5),temp=(10,25),rain=(300,600),moist=(60,80),n_req=100,seasons=[9,10,11,12,1,2,3],input=14000,labor=12000,yield_q=120,commodity="Spinach",risk_base=0.30,water="medium"),
    "Bitter Gourd": dict(ph=(5.5,7.0),temp=(24,38),rain=(600,1000),moist=(50,75),n_req=70,seasons=[3,4,5,6,7,8,9],input=18000,labor=16000,yield_q=120,commodity="Bitter Gourd",risk_base=0.40,water="low"),
    "Bottle Gourd": dict(ph=(6.0,7.5),temp=(22,35),rain=(600,1000),moist=(50,75),n_req=60,seasons=[4,5,6,7,8,9,10],input=16000,labor=14000,yield_q=200,commodity="Bottle Gourd",risk_base=0.35,water="low"),
    "Capsicum":     dict(ph=(5.5,7.5),temp=(18,30),rain=(600,1200),moist=(55,80),n_req=110,seasons=[9,10,11,12,1,2,3],input=55000,labor=30000,yield_q=150,commodity="Capsicum",risk_base=0.52,water="medium"),
    "Garlic":       dict(ph=(6.0,7.5),temp=(10,25),rain=(500,1000),moist=(50,70),n_req=80,seasons=[2,3,4,5],input=40000,labor=22000,yield_q=100,commodity="Garlic",risk_base=0.42,water="medium"),
    "Peas":         dict(ph=(6.0,7.5),temp=(10,20),rain=(400,600),moist=(55,80),n_req=20,seasons=[11,12,1,2,3],input=16000,labor=14000,yield_q=80,commodity="Peas",risk_base=0.35,water="low"),
    # ── Cereals ───────────────────────────────────────────────────────────────
    "Wheat":        dict(ph=(6.0,7.5),temp=(10,25),rain=(400,650),moist=(40,65),n_req=120,seasons=[3,4,5],input=18000,labor=12000,yield_q=45,commodity="Wheat",risk_base=0.18,water="medium"),
    "Rice":         dict(ph=(5.5,7.0),temp=(20,37),rain=(1000,2500),moist=(70,100),n_req=110,seasons=[9,10,11],input=22000,labor=20000,yield_q=60,commodity="Paddy",risk_base=0.22,water="high"),
    "Maize":        dict(ph=(5.5,7.5),temp=(18,32),rain=(500,1500),moist=(50,75),n_req=120,seasons=[8,9,10],input=16000,labor=10000,yield_q=55,commodity="Maize",risk_base=0.25,water="medium"),
    "Jowar":        dict(ph=(6.0,7.5),temp=(25,38),rain=(400,700),moist=(30,60),n_req=60,seasons=[9,10,11],input=12000,labor=8000,yield_q=30,commodity="Jowar",risk_base=0.22,water="low"),
    "Bajra":        dict(ph=(6.0,7.5),temp=(25,40),rain=(250,600),moist=(25,60),n_req=60,seasons=[9,10,11],input=10000,labor=8000,yield_q=25,commodity="Bajra",risk_base=0.20,water="low"),
    "Ragi":         dict(ph=(5.5,7.5),temp=(15,30),rain=(500,1200),moist=(30,60),n_req=40,seasons=[9,10,11],input=10000,labor=8000,yield_q=25,commodity="Ragi",risk_base=0.18,water="low"),
    # ── Pulses ────────────────────────────────────────────────────────────────
    "Tur (Arhar)":  dict(ph=(6.0,7.5),temp=(20,35),rain=(600,1000),moist=(40,70),n_req=20,seasons=[11,12,1,2],input=14000,labor=10000,yield_q=15,commodity="Arhar",risk_base=0.28,water="low"),
    "Chana":        dict(ph=(5.5,7.0),temp=(15,25),rain=(400,600),moist=(35,65),n_req=20,seasons=[2,3,4],input=15000,labor=10000,yield_q=18,commodity="Bengal Gram",risk_base=0.25,water="low"),
    "Moong":        dict(ph=(6.0,7.5),temp=(25,35),rain=(600,900),moist=(40,70),n_req=20,seasons=[6,7,8],input=12000,labor=10000,yield_q=12,commodity="Moong",risk_base=0.28,water="low"),
    "Urad":         dict(ph=(6.0,7.5),temp=(25,35),rain=(600,1000),moist=(40,70),n_req=20,seasons=[9,10,11],input=12000,labor=10000,yield_q=12,commodity="Urad",risk_base=0.28,water="low"),
    # ── Oilseeds ──────────────────────────────────────────────────────────────
    "Groundnut":    dict(ph=(5.5,7.0),temp=(22,35),rain=(500,1200),moist=(45,70),n_req=25,seasons=[9,10,11],input=25000,labor=15000,yield_q=25,commodity="Groundnut",risk_base=0.30,water="medium"),
    "Soybean":      dict(ph=(5.5,7.0),temp=(20,30),rain=(600,1000),moist=(50,70),n_req=25,seasons=[10,11],input=18000,labor=12000,yield_q=20,commodity="Soya seeds",risk_base=0.30,water="medium"),
    "Mustard":      dict(ph=(6.0,7.5),temp=(10,25),rain=(300,500),moist=(35,60),n_req=80,seasons=[2,3,4],input=16000,labor=10000,yield_q=20,commodity="Mustard",risk_base=0.25,water="low"),
    "Sunflower":    dict(ph=(6.0,7.5),temp=(20,35),rain=(400,800),moist=(40,70),n_req=80,seasons=[2,3,4,9,10],input=18000,labor=12000,yield_q=18,commodity="Sunflower Seed",risk_base=0.28,water="medium"),
    # ── Cash Crops ────────────────────────────────────────────────────────────
    "Sugarcane":    dict(ph=(6.0,7.5),temp=(20,38),rain=(1000,2000),moist=(60,80),n_req=150,seasons=[3,4,5],input=60000,labor=40000,yield_q=700,commodity="Sugarcane",risk_base=0.22,water="high"),
    "Cotton":       dict(ph=(6.0,8.0),temp=(22,38),rain=(500,1000),moist=(40,70),n_req=120,seasons=[11,12,1],input=45000,labor=30000,yield_q=20,commodity="Cotton",risk_base=0.45,water="medium"),
    "Turmeric":     dict(ph=(5.5,7.0),temp=(20,35),rain=(1500,2500),moist=(60,80),n_req=90,seasons=[12,1,2,3],input=45000,labor=30000,yield_q=200,commodity="Turmeric",risk_base=0.35,water="high"),
    "Ginger":       dict(ph=(5.5,6.5),temp=(20,32),rain=(1200,2500),moist=(60,85),n_req=90,seasons=[12,1,2,3],input=50000,labor=35000,yield_q=150,commodity="Ginger",risk_base=0.40,water="high"),
    # ── Fruits ────────────────────────────────────────────────────────────────
    "Banana":       dict(ph=(5.5,7.0),temp=(20,38),rain=(1000,2500),moist=(60,80),n_req=120,seasons=[1,2,3,4,5,6,7,8,9,10,11,12],input=60000,labor=30000,yield_q=300,commodity="Banana",risk_base=0.32,water="high"),
    "Papaya":       dict(ph=(6.0,7.5),temp=(22,38),rain=(1000,2000),moist=(55,75),n_req=90,seasons=[1,2,3,4,5,6,7,8,9,10,11,12],input=30000,labor=20000,yield_q=500,commodity="Papaya",risk_base=0.38,water="medium"),
    "Watermelon":   dict(ph=(6.0,7.0),temp=(25,40),rain=(300,400),moist=(40,65),n_req=80,seasons=[3,4,5,6],input=25000,labor=15000,yield_q=250,commodity="Watermelon",risk_base=0.42,water="medium"),
    "Lemon":        dict(ph=(5.5,7.0),temp=(20,38),rain=(750,1200),moist=(45,70),n_req=70,seasons=[3,4,5,6,7,8,9,10,11,12],input=20000,labor=15000,yield_q=80,commodity="Lemon",risk_base=0.30,water="medium"),
    "Grapes":       dict(ph=(6.5,7.5),temp=(15,40),rain=(300,600),moist=(40,65),n_req=80,seasons=[1,2,3,4,5],input=80000,labor=60000,yield_q=200,commodity="Grapes",risk_base=0.55,water="medium"),
    "Pomegranate":  dict(ph=(5.5,7.5),temp=(20,40),rain=(500,800),moist=(35,65),n_req=80,seasons=[2,3,4,5,6,7,8,9,10],input=50000,labor=30000,yield_q=150,commodity="Pomegranate",risk_base=0.40,water="low"),
    "Mango":        dict(ph=(5.5,7.5),temp=(23,40),rain=(750,2500),moist=(40,70),n_req=60,seasons=[4,5,6,7],input=25000,labor=20000,yield_q=120,commodity="Mango",risk_base=0.38,water="low"),
}

# ── MSP prices for profit floor calculation ────────────────────────────────────
_CROP_MSP = {
    "Wheat":2275,"Paddy":2300,"Rice":2300,"Maize":2090,"Bajra":2625,
    "Jowar":3371,"Soya seeds":4892,"Soybean":4892,"Mustard":5650,
    "Groundnut":6783,"Sunflower Seed":7280,"Cotton":7020,"Sugarcane":340,
    "Arhar":7550,"Tur (Arhar)":7550,"Moong":8682,"Urad":7400,
    "Bengal Gram":5440,"Chana":5440,"Masoor Dal":6425,"Ragi":3846,
}


def _score_suitability(crop_id: str, c: dict, req: CropRecommendRequest) -> float:
    """Returns 0–1 suitability score for a crop given the request conditions."""
    score = 1.0

    # pH suitability (hard gates + soft penalties)
    ph_lo, ph_hi = c["ph"]
    if not (ph_lo <= req.ph <= ph_hi):
        dev = min(abs(req.ph - ph_lo), abs(req.ph - ph_hi))
        score *= max(0, 1 - dev * 0.35)

    # Temperature
    t_lo, t_hi = c["temp"]
    if not (t_lo <= req.temperature_c <= t_hi):
        dev = min(abs(req.temperature_c - t_lo), abs(req.temperature_c - t_hi))
        score *= max(0, 1 - dev * 0.05)

    # Rainfall
    r_lo, r_hi = c["rain"]
    if req.irrigation == "rainfed":
        if not (r_lo <= req.rainfall_mm <= r_hi):
            dev = min(abs(req.rainfall_mm - r_lo), abs(req.rainfall_mm - r_hi))
            score *= max(0, 1 - dev * 0.001)
    elif req.irrigation in ("drip", "flood"):
        # Irrigation compensates partially
        if req.rainfall_mm < r_lo:
            score *= 0.85     # still slightly penalise extreme mismatch

    # Moisture
    m_lo, m_hi = c["moist"]
    if not (m_lo <= req.moisture_pct <= m_hi):
        dev = min(abs(req.moisture_pct - m_lo), abs(req.moisture_pct - m_hi))
        score *= max(0, 1 - dev * 0.02)

    # Nitrogen adequacy
    n_pct = min(req.nitrogen / max(c["n_req"], 1), 1.2)
    score *= min(n_pct, 1.0)

    # Harvest season alignment
    if req.harvest_months:
        overlap = len(set(c["seasons"]) & set(req.harvest_months)) / max(len(req.harvest_months), 1)
        score *= (0.4 + 0.6 * overlap)  # at least 0.4 even if no month matches

    # Water needs vs irrigation
    water_map = {"low": 1, "medium": 2, "high": 3}
    irr_cap    = {"rainfed": 1, "flood": 2, "drip": 3}
    need  = water_map.get(c.get("water","medium"), 2)
    cap   = irr_cap.get(req.irrigation, 2)
    if need > cap:
        score *= (0.6 if need - cap == 1 else 0.35)

    # Budget adequacy
    total_cost = c["input"] + c["labor"]
    if req.budget_inr < total_cost * req.farm_size_ha:
        score *= max(0.3, req.budget_inr / (total_cost * req.farm_size_ha + 1))

    return round(max(0.0, min(1.0, score)), 4)


def _estimate_yield(c: dict, req: CropRecommendRequest) -> float:
    """Estimate yield in quintals for the full farm."""
    base_yield = c["yield_q"]  # quintals/ha

    # Soil fertility index
    n_idx  = min(req.nitrogen / max(c["n_req"], 1), 1.0)
    p_idx  = min(req.phosphorus / 60, 1.0)
    k_idx  = min(req.potassium / 50, 1.0)
    fertility = (n_idx * 0.5 + p_idx * 0.25 + k_idx * 0.25)

    # Water adequacy
    water_map = {"low": 0.6, "medium": 1.0, "high": 1.2}
    irr_factor = {"rainfed": 0.75, "flood": 0.95, "drip": 1.10}
    water_score = min(irr_factor.get(req.irrigation, 1.0),
                      water_map.get(c.get("water","medium"), 1.0) * 0.9 + 0.1)

    yield_ha = base_yield * (0.5 + 0.3 * fertility + 0.2 * water_score)
    return round(yield_ha * req.farm_size_ha, 1)


def _estimate_market_price(commodity: str, state: str) -> float:
    """Get best available price from mandi data or MSP floor."""
    try:
        from mandi_data import get_price_for_commodity, normalize_commodity, MANDIS
        # Find a mandi in the user's state
        state_mandis = [m for m in MANDIS if m.get("state","").lower() == state.lower()]
        if state_mandis:
            norm = normalize_commodity(commodity) or commodity.upper()
            price_obj = get_price_for_commodity(norm, state_mandis[0]["id"])
            if price_obj and price_obj.get("modal_price", 0) > 0:
                return float(price_obj["modal_price"])
    except Exception:
        pass
    # Fallback: MSP or generic estimates
    return float(_CROP_MSP.get(commodity, 2500))


def _risk_score(crop_id: str, c: dict, req: CropRecommendRequest) -> float:
    """Returns 0–1 risk score (higher = riskier)."""
    risk = c["risk_base"]

    # Weather volatility bonus
    if req.humidity_pct > 80:
        risk += 0.05  # fungal disease risk
    if req.rainfall_mm > 2000 and c.get("water") != "high":
        risk += 0.05  # flood / waterlogging
    if req.temperature_c > 38:
        risk += 0.04  # heat stress

    # Budget risk (low buffer)
    total_cost = (c["input"] + c["labor"]) * req.farm_size_ha
    if req.budget_inr < total_cost * 1.2:
        risk += 0.06  # thin margin

    # Irrigation risk
    if req.irrigation == "rainfed" and c.get("water") in ("medium","high"):
        risk += 0.08

    # Adjust by farmer appetite
    if req.risk_appetite == "low":
        risk = risk  # no adjustment — used in ranking
    elif req.risk_appetite == "high":
        risk *= 0.8  # risk-tolerant farmers penalise it less

    return round(min(1.0, max(0.0, risk)), 4)


def _demand_score(commodity: str, state: str) -> float:
    """Simple heuristic demand index 0–1."""
    high_demand = {"Tomato","Onion","Potato","Wheat","Rice","Maize","Green Chilli","Soybean","Cotton","Groundnut","Mustard"}
    medium_demand = {"Cabbage","Cauliflower","Brinjal","Okra","Carrot","Capsicum","Garlic","Peas","Tur (Arhar)","Chana","Banana","Sugarcane"}
    if commodity in high_demand:
        return 0.85
    if commodity in medium_demand:
        return 0.65
    return 0.50


def _explain_crops_gemini(top_crops: list, req: CropRecommendRequest) -> dict:
    """
    Call Gemini once with all top crops and get per-crop explanations.
    Returns dict: {crop_name: {explanation, key_reasons, best_sell_time, watch_out}}
    """
    crops_summary = []
    for cr in top_crops:
        crops_summary.append({
            "rank": cr["rank"],
            "crop": cr["crop_name"],
            "composite_score": cr["composite_score"],
            "suitability_pct": round(cr["suitability_score"]*100),
            "estimated_profit_inr": cr["estimated_profit_inr"],
            "yield_q": cr["estimated_yield_q"],
            "risk_pct": round(cr["risk_score"]*100),
            "market_price_per_q": cr["market_price_per_q"],
        })

    prompt = f"""You are an expert Indian agricultural advisor and soil scientist.
A farmer has provided their farm profile and you have already run a quantitative analysis ranking the best crops to grow.

FARM PROFILE:
- Location: {req.state}, {req.agro_zone} zone  |  Lat: {req.lat}, Lng: {req.lng}
- Soil: pH {req.ph}, N={req.nitrogen}kg/ha, P={req.phosphorus}kg/ha, K={req.potassium}kg/ha, Moisture={req.moisture_pct}%, Type={req.soil_type}
- Weather: Temp {req.temperature_c}°C, Rainfall {req.rainfall_mm}mm/yr, Humidity {req.humidity_pct}%
- Farm: {req.farm_size_ha} hectares, Budget ₹{int(req.budget_inr):,}, Irrigation: {req.irrigation}
- Risk appetite: {req.risk_appetite}   |   Target harvest: months {req.harvest_months}

TOP RANKED CROPS (from quantitative scoring):
{crops_summary}

For EACH crop above, provide a detailed explanation. Respond with ONLY valid JSON (no markdown):
{{
  "CropName1": {{
    "explanation": "2-3 sentence plain-language explanation of why this crop suits this farmer's specific conditions — mention soil pH, weather suitability, profit potential, and any unique advantage",
    "key_reasons": ["reason 1 (specific, data-backed)", "reason 2", "reason 3"],
    "best_sell_time": "specific month/season recommendation with nearest mandi type",
    "watch_out": "one critical risk or challenge the farmer must monitor"
  }},
  "CropName2": {{ ... }},
  ...
}}
Use the exact crop names from the list above as JSON keys. Responses must be practical, region-specific to {req.state}, and written for a farmer (not academic). In Hindi terms where helpful."""

    try:
        from google import genai as genai_sdk
        client = genai_sdk.Client(api_key=GEMINI_API_KEY)
        from google.genai import types as gt
        resp = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=gt.GenerateContentConfig(temperature=0.3, max_output_tokens=4096),
        )
        raw = resp.text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception as e:
        logger.warning(f"Gemini crop explanation failed: {e}")
        # Fallback: generic explanations
        fallback = {}
        for cr in top_crops:
            cn = cr["crop_name"]
            fallback[cn] = {
                "explanation": f"{cn} is well-suited to your farm in {req.state}. Given your soil pH of {req.ph} and {req.irrigation} irrigation, expected profit of ₹{int(cr['estimated_profit_inr']):,} looks achievable with proper inputs.",
                "key_reasons": [
                    f"Soil pH {req.ph} is within optimal range for {cn}",
                    f"Estimated profit ₹{int(cr['estimated_profit_inr']):,} for {req.farm_size_ha} ha",
                    f"Risk level {round(cr['risk_score']*100)}% is manageable with {req.irrigation} irrigation",
                ],
                "best_sell_time": f"Target harvest in months {req.harvest_months} aligns with {cn} season",
                "watch_out": f"Monitor for weather stress and ensure timely fertilizer application — risk score is {round(cr['risk_score']*100)}%.",
            }
        return fallback


@app.post("/api/v1/recommend-crop")
async def recommend_crop(req: CropRecommendRequest):
    """
    🌱 Intelligent Crop Recommender
    5-stage pipeline: Suitability → Yield → Market Price → Profit → Risk → Ranking
    + Gemini-powered natural language explanation per crop.
    """
    results = []

    for crop_id, c in _CROP_DB.items():
        # Stage 1: Suitability
        suit = _score_suitability(crop_id, c, req)
        if suit < 0.10:
            continue  # completely unsuitable — skip

        # Stage 2: Yield estimate
        yield_q = _estimate_yield(c, req)

        # Stage 3: Market price
        price_q = _estimate_market_price(c["commodity"], req.state)

        # Stage 4: Profit
        total_cost = (c["input"] + c["labor"]) * req.farm_size_ha
        revenue = yield_q * price_q
        profit = revenue - total_cost
        profit_norm = min(max(profit / max(req.farm_size_ha * 100000, 1), 0), 1)

        # Stage 5: Risk
        risk = _risk_score(crop_id, c, req)

        # Stage 5b: Demand
        demand = _demand_score(crop_id, req.state)

        # Composite score: suitability 30%, profit 35%, demand 20%, safety 15%
        composite = (
            0.30 * suit +
            0.35 * profit_norm +
            0.20 * demand +
            0.15 * (1 - risk)
        )

        # Apply risk appetite multiplier to composite
        if req.risk_appetite == "low" and risk > 0.5:
            composite *= 0.7
        elif req.risk_appetite == "high" and risk > 0.5:
            composite *= 1.1

        results.append({
            "crop_name": crop_id,
            "commodity": c["commodity"],
            "composite_score": round(min(composite, 1.0), 4),
            "suitability_score": suit,
            "estimated_yield_q": yield_q,
            "market_price_per_q": price_q,
            "estimated_revenue_inr": round(revenue),
            "estimated_cost_inr": round(total_cost),
            "estimated_profit_inr": round(profit),
            "risk_score": risk,
            "demand_score": demand,
            "profit_margin_pct": round((profit / max(revenue, 1)) * 100, 1),
            "water_need": c.get("water","medium"),
            "seasons": c["seasons"],
            "input_cost_per_ha": c["input"],
            "labor_cost_per_ha": c["labor"],
        })

    if not results:
        return {"status": "no_results", "message": "No suitable crops found for the given conditions.", "crops": []}

    # Sort by composite score descending
    results.sort(key=lambda x: -x["composite_score"])
    top5 = results[:5]

    # Add rank
    for i, r in enumerate(top5):
        r["rank"] = i + 1

    # Stage 6: Gemini explanations (batch call)
    explanations = {}
    if gemini_client or GEMINI_API_KEY:
        explanations = _explain_crops_gemini(top5, req)

    # Merge explanations into results
    for r in top5:
        cn = r["crop_name"]
        expl = explanations.get(cn, {})
        r["explanation"] = expl.get("explanation", "")
        r["key_reasons"] = expl.get("key_reasons", [])
        r["best_sell_time"] = expl.get("best_sell_time", "")
        r["watch_out"] = expl.get("watch_out", "")

    return {
        "status": "success",
        "state": req.state,
        "farm_size_ha": req.farm_size_ha,
        "irrigation": req.irrigation,
        "risk_appetite": req.risk_appetite,
        "top_crop": top5[0]["crop_name"] if top5 else None,
        "crops": top5,
        "total_candidates_evaluated": len(results),
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)



@app.get("/api/v1/mandi/historical-prices")
def mandi_historical(commodity: str, state: str = None, market: str = None, days: int = 30):
    """
    Fetch last N days of price data from Agmarknet for a commodity.
    Returns list of {date, min_price, modal_price, max_price}.
    """
    import time
    cache_key = f"hist|{state}|{commodity}|{days}"
    now_ts = time.time()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
