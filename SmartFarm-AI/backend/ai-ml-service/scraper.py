import os
import asyncio
import uuid
import requests
from bs4 import BeautifulSoup
from apscheduler.schedulers.background import BackgroundScheduler
from pydantic import BaseModel

from database import GovernmentScheme, MOCK_SCHEMES_DB
from schemes_service import generate_voice_explanation
from google import genai
from google.genai import types as genai_types

# Initialize Gemini Client for summarization
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
GEMINI_MODEL = "gemini-flash-latest"

TARGET_URLS = [
    "https://pmkisan.gov.in",
    "https://pmfby.gov.in",
    "https://pmksy.gov.in",
    "https://agriinfra.dac.gov.in",
    "https://enam.gov.in",
    "https://soilhealth.dac.gov.in",
    "https://rkvy.nic.in",
    "https://nfsm.gov.in",
    "https://midh.gov.in",
    "https://nbhm.gov.in",
    "https://nmeo.dac.gov.in",
    "https://farmech.dac.gov.in",
    "https://pgsindia-ncof.gov.in",
    "https://nmsa.dac.gov.in",
    "https://agristack.gov.in",
    "https://dahd.nic.in",
    "https://pmmsy.dof.gov.in",
    "https://nrega.nic.in",
    "https://pmayg.nic.in"
]

def scrape_url(url: str) -> str:
    """Fetches text content from a URL using BeautifulSoup."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'lxml')
        
        # Remove scripts and styles
        for script in soup(["script", "style"]):
            script.extract()
            
        text = soup.get_text(separator=' ', strip=True)
        return text[:5000] # Limit tokens for the prompt
    except Exception as e:
        print(f"Failed to scrape {url}: {e}")
        return ""

def summarize_scheme_with_ai(raw_text: str, source_url: str) -> GovernmentScheme | None:
    """Uses Gemini to convert raw scraped HTML text into a structured GovernmentScheme."""
    if not client:
        return None
        
    prompt = f"""
    You are an AI agricultural assistant for Indian farmers. 
    Analyze the following raw scraped text from a government agricultural website and extract the scheme details.
    
    Raw Text:
    {raw_text}
    
    Respond STRICTLY with a valid JSON object matching this schema. If you cannot find sufficient information, you must still return valid JSON with plausible placeholders based on the website context.
    {{
        "name": "Scheme Name",
        "short_description": "1 sentence description",
        "full_description": "Full scheme explanation",
        "benefits": ["Benefit 1", "Benefit 2"],
        "eligibility_rules": ["Rule 1", "Rule 2"],
        "required_documents": ["Doc 1", "Doc 2"],
        "application_process": ["Step 1", "Step 2"],
        "ministry": "Ministry Name",
        "scheme_type": "Insurance / Subsidy / Crop / Infrastructure",
        "target_beneficiary": "Small & Marginal Farmers / All India",
        "supported_states": ["All India"],
        "ai_summary": "1 sentence extremely simple explanation",
        "ai_farmer_explanation": "2-3 simple sentences explaining to a rural farmer without jargon.",
        "ai_short_benefit_line": "E.g. Get ₹6,000 per year",
        "thumbnail_icon": "tractor"
    }}
    """
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[prompt],
            config=genai_types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=2048,
                response_mime_type="application/json"
            )
        )
        
        # Parse JSON and build model
        import json
        data = json.loads(response.text)
        
        # We also need a translation layer. To save time/tokens here, we will just simulate hitting the translation endpoint.
        # Ideally, we trigger a second prompt or background task to translate into the 12 languages.
        
        scheme_id = f"SCRAPED_{uuid.uuid4().hex[:8].upper()}"
        
        scheme = GovernmentScheme(
            id=scheme_id,
            name=data.get("name", "Unknown Scheme"),
            short_description=data.get("short_description", ""),
            full_description=data.get("full_description", ""),
            benefits=data.get("benefits", []),
            eligibility_rules=data.get("eligibility_rules", []),
            required_documents=data.get("required_documents", []),
            application_process=data.get("application_process", []),
            official_link=source_url,
            ministry=data.get("ministry", "Govt of India"),
            scheme_type=data.get("scheme_type", "General"),
            target_beneficiary=data.get("target_beneficiary", "All"),
            supported_states=data.get("supported_states", ["All India"]),
            ai_summary=data.get("ai_summary", ""),
            ai_farmer_explanation=data.get("ai_farmer_explanation", ""),
            ai_short_benefit_line=data.get("ai_short_benefit_line", ""),
            thumbnail_icon="tractor",
            languages_available=["en"],
            translations={}
        )
        return scheme
        
    except Exception as e:
        print(f"AI Summarization Failed: {e}")
        return None

def run_scraper_job():
    """Scheduled job to scrape portals."""
    print("[Scraper] Running scheduled scrape job...")
    for url in TARGET_URLS:
        print(f"[Scraper] Scraping {url}...")
        text = scrape_url(url)
        if text:
            print(f"[Scraper] Summarizing {url} with AI...")
            scheme = summarize_scheme_with_ai(text, url)
            if scheme:
                print(f"[Scraper] Saved scheme: {scheme.name}")
                MOCK_SCHEMES_DB[scheme.id] = scheme
    print("[Scraper] Job complete.")

def start_scheduler():
    scheduler = BackgroundScheduler()
    # In production, this would be set to something like every 24 hours: (hours=24)
    # Using larger intervals so it doesn't spam APIs while developing.
    scheduler.add_job(run_scraper_job, 'interval', hours=24)
    scheduler.start()
    print("[Scheduler] Started background scheduled scraping job.")
