import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# In a real app we would use motor:
# from motor.motor_asyncio import AsyncIOMotorClient
# MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
# client = AsyncIOMotorClient(MONGO_URI)
# db = client.smartfarm
# schemes_collection = db.government_schemes
# profiles_collection = db.farmer_profiles
# eligibility_collection = db.scheme_eligibility_results

# For this module demo, we will define the Pydantic models for type safety 
# and use an in-memory dictionary if MongoDB is not reachable or configured.
# This prevents the backend from crashing if the user doesn't have Docker running.

class TranslationDict(BaseModel):
    hi: Optional[str] = None
    mr: Optional[str] = None
    gu: Optional[str] = None
    pa: Optional[str] = None
    bn: Optional[str] = None
    ta: Optional[str] = None
    te: Optional[str] = None
    kn: Optional[str] = None
    ml: Optional[str] = None
    or_: Optional[str] = Field(None, alias="or")
    as_: Optional[str] = Field(None, alias="as")

class GovernmentScheme(BaseModel):
    id: str
    name: str
    short_description: str
    full_description: str
    benefits: List[str]
    eligibility_rules: List[str]
    required_documents: List[str]
    application_process: List[str]
    official_link: str
    pdf_source: Optional[str] = None
    ministry: str
    scheme_type: str
    target_beneficiary: str
    supported_states: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # AI Extracted Fields:
    ai_summary: str
    ai_farmer_explanation: str
    ai_short_benefit_line: str
    thumbnail_icon: str
    
    # Multilingual
    languages_available: List[str] = ["en"]
    translations: Optional[Dict[str, Any]] = None

class FarmerProfile(BaseModel):
    farmer_id: str
    name: str
    state: str
    district: str
    village: str
    land_size_hectare: float
    crop_types: List[str]
    annual_income: float
    irrigation_type: str
    category: str
    age: int
    gender: str
    bank_account_linked: bool
    aadhaar_linked: bool

class SchemeEligibilityResult(BaseModel):
    farmer_id: str
    scheme_id: str
    eligible: str # "Eligible", "Possibly Eligible", "Not Eligible"
    reason: str
    missing_requirements: List[str]
    estimated_benefit: str

# MOCK DATABASE for the demo
MOCK_SCHEMES_DB: Dict[str, GovernmentScheme] = {}
MOCK_PROFILES_DB: Dict[str, FarmerProfile] = {}
MOCK_RESULTS_DB: List[SchemeEligibilityResult] = []

