import os
import io
import json
import base64
from typing import Dict, Any, List
from gtts import gTTS
from pydantic import BaseModel
import asyncio

# Our model schemas
from database import (
    GovernmentScheme, 
    FarmerProfile, 
    SchemeEligibilityResult,
    MOCK_SCHEMES_DB,
    MOCK_PROFILES_DB,
    MOCK_RESULTS_DB
)
from mock_schemes_data import MOCK_SCHEME_LIST

# Use the same Gemini client from main.py if possible, or initialize a new one 
from google import genai
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
GEMINI_MODEL = "gemini-flash-latest"

def generate_voice_explanation(text: str, lang: str = 'en') -> str:
    """Uses gTTS to generate an audio file from text and returns base64 encoded string."""
    try:
        tts = gTTS(text=text, lang=lang)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        return base64.b64encode(fp.read()).decode('utf-8')
    except Exception as e:
        print(f"Failed to generate TTS: {e}")
        return ""

def determine_eligibility(scheme: GovernmentScheme, profile: FarmerProfile) -> SchemeEligibilityResult:
    """Rule engine to match farmer profile to scheme eligibility."""
    eligible = "Eligible"
    reasons = []
    missing = []
    
    # Very basic static logic for the demo (we would usually use AI or a rule engine here)
    if scheme.supported_states and profile.state not in scheme.supported_states and "All India" not in scheme.supported_states:
        eligible = "Not Eligible"
        missing.append("State not supported")
        reasons.append(f"This scheme is active in {', '.join(scheme.supported_states)}, not {profile.state}.")
    else:
        reasons.append(f"Your state ({profile.state}) is supported.")
        
    if "Marginal" in scheme.target_beneficiary and profile.land_size_hectare > 2:
        eligible = "Not Eligible"
        missing.append("Land size too large")
        reasons.append(f"Scheme is for farmers with < 2 hectares. You have {profile.land_size_hectare} ha.")
    elif "Marginal" in scheme.target_beneficiary:
        reasons.append(f"Your land size ({profile.land_size_hectare} ha) qualifies you.")
        
    estimated_benefit = "Unknown"
    if "Kisan Samman" in scheme.name:
        estimated_benefit = "₹6,000 / year"
    elif "Insurance" in scheme.scheme_type:
        estimated_benefit = "Crop Loss Cover"

    return SchemeEligibilityResult(
        farmer_id=profile.farmer_id,
        scheme_id=scheme.id,
        eligible=eligible,
        reason=" ".join(reasons),
        missing_requirements=missing,
        estimated_benefit=estimated_benefit
    )

def add_mock_data():
    """Seeds the hardcoded mock database so the frontend has data to fetch."""
    
    # Insert from mock datasets
    for s in MOCK_SCHEME_LIST:
        MOCK_SCHEMES_DB[s.id] = s

    profile = FarmerProfile(
        farmer_id="FARMER_123",
        name="Ramesh Kumar",
        state="Maharashtra",
        district="Pune",
        village="Shirur",
        land_size_hectare=1.5,
        crop_types=["Wheat", "Onion"],
        annual_income=45000.0,
        irrigation_type="Drip",
        category="General",
        age=45,
        gender="Male",
        bank_account_linked=True,
        aadhaar_linked=True
    )
    MOCK_PROFILES_DB[profile.farmer_id] = profile

    res = determine_eligibility(MOCK_SCHEME_LIST[0], profile)
    MOCK_RESULTS_DB.append(res)

# Seed it on load
add_mock_data()
