import os
from google import genai
from google.genai import types

def generate_schemes():
    API_KEY = os.environ.get("GEMINI_API_KEY", "")
    if not API_KEY:
        print("Set GEMINI_API_KEY")
        return
        
    client = genai.Client(api_key=API_KEY)
    
    prompt = """
    We need an EXTREMELY large list of 45 real Indian agricultural schemes and subsidies.
    Include schemes from:
    - Ministry of Agriculture (Central)
    - State specific schemes (UP, Punjab, MP, Maharashtra, Bihar, Gujarat, South India)
    - Animal Husbandry & Dairying
    - Fisheries
    - Horticulture (MIDH)
    - Mechanization (SMAM, Tractors)
    - Solar Pumps (PM KUSUM)
    - Crop Insurance
    - Agri Infrastructure
    
    Output ONLY a valid Python list of Pydantic object initializations. 
    Use the following format for each item in the list:
    
    GovernmentScheme(
        id="SCHEME_XXX",
        name="...",
        short_description="...",
        full_description="...",
        benefits=["..."],
        eligibility_rules=["..."],
        required_documents=["..."],
        application_process=["..."],
        official_link="...",
        ministry="...",
        scheme_type="Insurance | Subsidy | Infrastructure | Income Support | Mechanization | Horticulture | Animal Husbandry | Fisheries | Debt Relief",
        target_beneficiary="...",
        supported_states=["All India", "Uttar Pradesh", "etc..."],
        ai_summary="...",
        ai_farmer_explanation="...",
        ai_short_benefit_line="...",
        thumbnail_icon="tractor | leaf | shield | cash | droplet | sun | cow | fish | warehouse | smartphone",
        languages_available=["en"],
        translations={}
    ),
    
    Make sure to generate 45 distinct schemes. Do not wrap in markdown ```python. Just strictly output the Python list starting with `[` and ending with `]`. Make sure syntax is valid.
    """
    
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[prompt],
        config=types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=8192,
        )
    )
    
    with open("massive_mock_data.py", "w", encoding="utf-8") as f:
        f.write("from database import GovernmentScheme\n\nMOCK_SCHEME_LIST = " + response.text.replace("```python", "").replace("```", ""))
    
    print("Done generated massive mock data.")

if __name__ == "__main__":
    generate_schemes()
