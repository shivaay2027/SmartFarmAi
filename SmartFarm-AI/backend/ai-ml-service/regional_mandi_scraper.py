"""
SmartFarm AI — Regional Mandi Scraper (Tier-2)
===============================================
For sub-district / local rural mandis NOT covered by Agmarknet (data.gov.in),
this module scrapes state mandi board portals and regional agriculture sites.

Coverage by state:
  MP        → mpmandiboard.gov.in (rural mandi rates)
  Rajasthan → rsamb.rajasthan.gov.in
  UP        → upmandiparishad.in
  Maharashtra → mainagriculture.maharashtra.gov.in
  Haryana   → agriharyana.gov.in
  Punjab    → agripb.gov.in
  Karnataka → krishimaratavahini.karnataka.gov.in
  Gujarat   → agri.gujarat.gov.in
  eNAM      → enam.gov.in (national fallback for any state)
  Agriwatch → agriwatch.com (private aggregator — last resort)
"""

import requests
import logging
from datetime import datetime
from bs4 import BeautifulSoup

logger = logging.getLogger("regional_scraper")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
    "Accept":     "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
}

TODAY = datetime.now().strftime("%d/%m/%Y")
TODAY_DMY = datetime.now().strftime("%d-%m-%Y")


# ─── UTILITY ─────────────────────────────────────────────────────────────────
def _safe_float(v) -> float:
    try:
        return float(str(v).replace(",", "").replace("₹", "").strip() or 0)
    except Exception:
        return 0.0


def _make_record(state, district, market, commodity, modal, min_p=0, max_p=0,
                 variety="", source="regional_scrape") -> dict:
    return {
        "state":       state,
        "district":    district,
        "market":      market,
        "commodity":   commodity,
        "variety":     variety,
        "min_price":   _safe_float(min_p) or _safe_float(modal),
        "max_price":   _safe_float(max_p) or _safe_float(modal),
        "modal_price": _safe_float(modal),
        "unit":        "Quintal",
        "date":        TODAY,
        "source":      source,
    }


# ─── TIER-2 SCRAPERS ─────────────────────────────────────────────────────────

def scrape_mp_mandi_board(market: str = None, commodity: str = None) -> list:
    """
    Madhya Pradesh Mandi Board — includes rural / sub-district mandis.
    URL: https://www.mpmandiboard.gov.in/MandiRate/DailyRateNewDesign.aspx
    Also: https://www.mpmandiboard.gov.in/MandiRate/DailyRateRural.aspx
    """
    records = []
    urls = [
        "https://www.mpmandiboard.gov.in/MandiRate/DailyRateNewDesign.aspx",
        "https://www.mpmandiboard.gov.in/MandiRate/DailyRateRural.aspx",
    ]
    for url in urls:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=20)
            soup = BeautifulSoup(resp.text, "lxml")
            tables = soup.find_all("table")
            for table in tables:
                rows = table.find_all("tr")
                for row in rows[1:]:
                    cols = [td.get_text(strip=True) for td in row.find_all("td")]
                    if len(cols) >= 5:
                        mkt = cols[0] if len(cols) > 0 else ""
                        comm = cols[1] if len(cols) > 1 else commodity or ""
                        min_p = _safe_float(cols[2] if len(cols) > 2 else 0)
                        max_p = _safe_float(cols[3] if len(cols) > 3 else 0)
                        modal = _safe_float(cols[4] if len(cols) > 4 else 0)
                        if modal <= 0:
                            continue
                        if market and market.lower()[:6] not in mkt.lower():
                            continue
                        records.append(_make_record(
                            "Madhya Pradesh", "", mkt, comm, modal, min_p, max_p,
                            source="mp_mandi_board"
                        ))
        except Exception as e:
            logger.warning(f"MP Mandi Board scrape failed {url}: {e}")
    return records


def scrape_rajasthan_mandi(market: str = None, commodity: str = None) -> list:
    """
    Rajasthan State Agricultural Marketing Board
    URL: https://rsamb.rajasthan.gov.in/DailyPricing.aspx
    """
    records = []
    try:
        resp = requests.get(
            "https://rsamb.rajasthan.gov.in/DailyPricing.aspx",
            headers=HEADERS, timeout=20
        )
        soup = BeautifulSoup(resp.text, "lxml")
        tables = soup.find_all("table", {"class": lambda c: c and "grid" in c.lower()}) or soup.find_all("table")
        for table in tables:
            for row in table.find_all("tr")[1:]:
                cols = [td.get_text(strip=True) for td in row.find_all("td")]
                if len(cols) >= 5:
                    mkt  = cols[1] if len(cols) > 1 else ""
                    comm = cols[2] if len(cols) > 2 else commodity or ""
                    min_p  = _safe_float(cols[3] if len(cols) > 3 else 0)
                    max_p  = _safe_float(cols[4] if len(cols) > 4 else 0)
                    modal  = _safe_float(cols[5] if len(cols) > 5 else cols[4])
                    if modal <= 0:
                        continue
                    records.append(_make_record(
                        "Rajasthan", cols[0] if cols else "", mkt, comm, modal, min_p, max_p,
                        source="rsamb_rajasthan"
                    ))
    except Exception as e:
        logger.warning(f"Rajasthan RSAMB scrape failed: {e}")
    return records


def scrape_up_mandi(market: str = None, commodity: str = None) -> list:
    """
    Uttar Pradesh Mandi Board
    URL: https://www.upmandiparishad.in/MandiRates.aspx
    """
    records = []
    try:
        resp = requests.get(
            "https://www.upmandiparishad.in/MandiRates.aspx",
            headers=HEADERS, timeout=20
        )
        soup = BeautifulSoup(resp.text, "lxml")
        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:]:
                cols = [td.get_text(strip=True) for td in row.find_all("td")]
                if len(cols) >= 4:
                    mkt  = cols[0] if cols else ""
                    comm = cols[1] if len(cols) > 1 else commodity or ""
                    min_p = _safe_float(cols[2] if len(cols) > 2 else 0)
                    max_p = _safe_float(cols[3] if len(cols) > 3 else 0)
                    modal = _safe_float(cols[4] if len(cols) > 4 else cols[3])
                    if modal <= 0:
                        continue
                    records.append(_make_record(
                        "Uttar Pradesh", "", mkt, comm, modal, min_p, max_p,
                        source="up_mandi_parishad"
                    ))
    except Exception as e:
        logger.warning(f"UP Mandi Parishad scrape failed: {e}")
    return records


def scrape_enam(state: str = None, commodity: str = None) -> list:
    """
    e-NAM (National Agriculture Market) — covers 1,260+ integrated mandis.
    REST API: https://enam.gov.in/web/Ajax_ctrl/trade_data_list
    """
    records = []
    try:
        payload = {
            "language": "en",
            "stateName": state or "",
            "daysToTrade": "1",
            "apmc": "",
            "commodity": commodity or "",
        }
        resp = requests.post(
            "https://enam.gov.in/web/Ajax_ctrl/trade_data_list",
            data=payload, headers={**HEADERS, "Content-Type": "application/x-www-form-urlencoded"},
            timeout=20
        )
        data = resp.json()
        for item in data.get("data", {}).get("trade_data", []):
            modal = _safe_float(item.get("modalTradedPrice", 0))
            if modal <= 0:
                continue
            records.append(_make_record(
                state=item.get("stateName", state or ""),
                district=item.get("districtName", ""),
                market=item.get("mandName", ""),
                commodity=item.get("commodity", commodity or ""),
                modal=modal,
                min_p=_safe_float(item.get("minTradedPrice", 0)),
                max_p=_safe_float(item.get("maxTradedPrice", 0)),
                variety=item.get("variety", ""),
                source="enam"
            ))
    except Exception as e:
        logger.warning(f"eNAM scrape failed: {e}")
    return records


def scrape_agriwatch(state: str = None, commodity: str = None) -> list:
    """
    Agriwatch.com — comprehensive private aggregator covering rural mandis.
    URL: https://www.agriwatch.com/price.php
    """
    records = []
    try:
        params = {
            "type": "today",
            "state": state or "",
            "commodity": commodity or "Wheat",
        }
        resp = requests.get(
            "https://www.agriwatch.com/price.php",
            params=params, headers=HEADERS, timeout=20
        )
        soup = BeautifulSoup(resp.text, "lxml")
        tables = soup.find_all("table")
        for table in tables:
            for row in table.find_all("tr")[1:]:
                cols = [td.get_text(strip=True) for td in row.find_all("td")]
                if len(cols) >= 5:
                    mkt  = cols[0]
                    comm = cols[1] if len(cols) > 1 else commodity or ""
                    min_p = _safe_float(cols[2] if len(cols) > 2 else 0)
                    max_p = _safe_float(cols[3] if len(cols) > 3 else 0)
                    modal = _safe_float(cols[4] if len(cols) > 4 else cols[3])
                    if modal <= 0:
                        continue
                    records.append(_make_record(
                        state or "", "", mkt, comm, modal, min_p, max_p,
                        source="agriwatch"
                    ))
    except Exception as e:
        logger.warning(f"Agriwatch scrape failed: {e}")
    return records


def scrape_agmarknet_web(state: str = None, market: str = None, commodity: str = None) -> list:
    """
    Agmarknet direct web scrape (bypasses the API limit).
    URL: https://agmarknet.gov.in/SearchCmmMkt.aspx
    Better coverage for sub-sub mandis not in the API dataset.
    """
    records = []
    today = datetime.now().strftime("%d-%b-%Y")
    try:
        params = {
            "Tx_Commodity": commodity or "0",
            "Tx_State":     _STATE_CODES.get(state or "", "0"),
            "Tx_District":  "0",
            "Tx_Market":    "0",
            "DateFrom":     today,
            "DateTo":       today,
            "Fr_Date":      today,
            "To_Date":      today,
            "Tx_Trend":     "0",
            "Tx_CommodityHead": commodity or "ALL COMMODITIES",
            "Tx_StateHead": state or "All States",
        }
        resp = requests.get(
            "https://agmarknet.gov.in/SearchCmmMkt.aspx",
            params=params, headers=HEADERS, timeout=25
        )
        soup = BeautifulSoup(resp.text, "lxml")
        table = soup.find("table", {"class": "tableagmark_new"}) or \
                soup.find("table", id="cphBody_GridPriceData")
        if not table:
            return []
        for row in table.find_all("tr")[1:]:
            cols = [td.get_text(strip=True) for td in row.find_all("td")]
            if len(cols) >= 9:
                modal = _safe_float(cols[8] if len(cols) > 8 else 0)
                if modal <= 0:
                    continue
                if market and market.lower()[:5] not in cols[2].lower():
                    continue
                records.append(_make_record(
                    cols[0], cols[1], cols[2], cols[3], modal,
                    _safe_float(cols[6]),  _safe_float(cols[7]),
                    cols[4], source="agmarknet_web"
                ))
    except Exception as e:
        logger.warning(f"Agmarknet web scrape failed: {e}")
    return records


# ─── STATE CODE MAP ───────────────────────────────────────────────────────────
_STATE_CODES = {
    "Andhra Pradesh": "AP", "Arunachal Pradesh": "AR", "Assam": "AS",
    "Bihar": "BR", "Chhattisgarh": "CH", "Chattisgarh": "CH",
    "Goa": "GA", "Gujarat": "GJ", "Haryana": "HR",
    "Himachal Pradesh": "HP", "Jharkhand": "JH", "Karnataka": "KA",
    "Kerala": "KL", "Madhya Pradesh": "MP", "Maharashtra": "MH",
    "Manipur": "MN", "Meghalaya": "ML", "Mizoram": "MZ",
    "Nagaland": "NL", "Odisha": "OR", "Punjab": "PB",
    "Rajasthan": "RJ", "Sikkim": "SK", "Tamil Nadu": "TN",
    "Telangana": "TS", "Tripura": "TR", "Uttar Pradesh": "UP",
    "Uttarakhand": "UK", "West Bengal": "WB",
    "Jammu And Kashmir": "JK", "Jammu & Kashmir": "JK",
    "Ladakh": "LA", "Delhi": "DL",
    "Andaman And Nicobar": "AN", "Chandigarh": "CH",
    "Dadra And Nagar Haveli": "DN", "Daman And Diu": "DD",
    "Lakshadweep": "LD", "Puducherry": "PY",
}

# Map state → primary tier-2 scraper function
_STATE_SCRAPERS = {
    "Madhya Pradesh":  scrape_mp_mandi_board,
    "Rajasthan":       scrape_rajasthan_mandi,
    "Uttar Pradesh":   scrape_up_mandi,
}


# ─── MAIN ROUTING FUNCTION ───────────────────────────────────────────────────
def fetch_regional_prices(state: str, market: str = None, commodity: str = None,
                           district: str = None) -> list:
    """
    Main entry point for Tier-2 (regional) mandi data.
    Tries state-specific scraper first, then eNAM, then Agmarknet web scrape.

    Args:
        state:     State name (e.g. "Madhya Pradesh")
        market:    Specific market/mandi name to filter to
        commodity: Commodity name (optional, returns all if None)
        district:  District name (optional)

    Returns:
        List of canonical price records.
    """
    records = []

    # 1. State-specific scraper
    state_fn = _STATE_SCRAPERS.get(state)
    if state_fn:
        try:
            r = state_fn(market=market, commodity=commodity)
            if r:
                logger.info(f"State scraper ({state}): {len(r)} records")
                records.extend(r)
        except Exception as e:
            logger.warning(f"State scraper failed for {state}: {e}")

    # 2. eNAM (covers 1,260+ integrated mandis including many sub-district ones)
    if len(records) < 5:
        try:
            r = scrape_enam(state=state, commodity=commodity)
            if market:
                r = [x for x in r if market.lower()[:5] in x["market"].lower()]
            if r:
                logger.info(f"eNAM ({state}): {len(r)} records")
                records.extend(r)
        except Exception as e:
            logger.warning(f"eNAM failed for {state}: {e}")

    # 3. Agmarknet web scrape (more comprehensive than API for local mandis)
    if len(records) < 5:
        try:
            r = scrape_agmarknet_web(state=state, market=market, commodity=commodity)
            if r:
                logger.info(f"Agmarknet web ({state}): {len(r)} records")
                records.extend(r)
        except Exception as e:
            logger.warning(f"Agmarknet web failed for {state}: {e}")

    # 4. Last resort: Agriwatch (private aggregator)
    if len(records) < 3:
        try:
            r = scrape_agriwatch(state=state, commodity=commodity)
            if market:
                r = [x for x in r if market.lower()[:5] in x["market"].lower()]
            if r:
                logger.info(f"Agriwatch ({state}): {len(r)} records")
                records.extend(r)
        except Exception as e:
            logger.warning(f"Agriwatch failed for {state}: {e}")

    # Deduplicate
    seen = set()
    out = []
    for r in records:
        key = f"{r['market']}|{r['commodity']}|{r['modal_price']}"
        if key not in seen:
            seen.add(key)
            out.append(r)

    logger.info(f"fetch_regional_prices({state},{market}) → {len(out)} total records")
    return out
