"""
SmartFarm AI — Live Mandi Price Fetcher  (v3 — Full Rewrite)
Fetches real prices from Agmarknet via data.gov.in public dataset API.
API Key: 579b464db66ec23bdd000001956dc4f06cd140955c9f9c9692e62578
"""
import os
import requests
import logging
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger("live_mandi")

# ── API CONFIG ─────────────────────────────────────────────────────────────────
AGMARKNET_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
DATA_GOV_BASE = "https://api.data.gov.in/resource"
API_KEY = os.environ.get("AGMARKNET_API_KEY", "579b464db66ec23bdd000001956dc4f06cd140955c9f9c9692e62578")
AGMARKNET_SCRAPE_URL = "https://agmarknet.gov.in/SearchCmmMkt.aspx"

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "SmartFarmAI/2.0", "Accept": "application/json"})


def safe_float(v) -> float:
    try:
        return float(str(v).replace(",", "").strip() or 0)
    except Exception:
        return 0.0


def _make_record(rec: dict, default_date: str) -> dict | None:
    """Normalize a raw API record into the SmartFarm canonical format."""
    modal = safe_float(rec.get("modal_price") or 0)
    if modal <= 0:
        return None
    return {
        "state":       (rec.get("state")     or "").strip(),
        "district":    (rec.get("district")  or "").strip(),
        "market":      (rec.get("market")    or "").strip(),
        "commodity":   (rec.get("commodity") or "").strip(),
        "variety":     (rec.get("variety")   or "").strip(),
        "min_price":   safe_float(rec.get("min_price")   or 0),
        "max_price":   safe_float(rec.get("max_price")   or 0),
        "modal_price": modal,
        "unit":        "Quintal",
        "date":        (rec.get("arrival_date") or default_date or "").strip(),
        "source":      "agmarknet_api",
    }


def _fetch_page(params: dict) -> list:
    """Fetch one API page and return normalised records."""
    url = f"{DATA_GOV_BASE}/{AGMARKNET_RESOURCE_ID}"
    try:
        resp = SESSION.get(url, params=params, timeout=20)
        if resp.status_code == 200:
            today = datetime.now().strftime("%d/%m/%Y")
            raw = resp.json().get("records", [])
            out = []
            for r in raw:
                rec = _make_record(r, today)
                if rec:
                    out.append(rec)
            logger.debug(f"_fetch_page → {len(out)} records")
            return out
        elif resp.status_code == 429:
            logger.warning("data.gov.in rate-limited (429)")
        else:
            logger.warning(f"data.gov.in status {resp.status_code}")
    except Exception as e:
        logger.error(f"_fetch_page error: {e}")
    return []


# ── PUBLIC: TODAY'S PRICES ─────────────────────────────────────────────────────
def fetch_live_prices_gov(state: str = None, commodity: str = None,
                          market: str = None, limit: int = 1000) -> list:
    """
    Fetch today's live prices from data.gov.in Agmarknet API.
    State and commodity are pushed natively into the API filters.
    Returns a list of canonical mandi price records.
    """
    params: dict = {
        "api-key": API_KEY,
        "format":  "json",
        "limit":   limit,
    }
    if state:
        params["filters[state]"] = state
    if commodity:
        params["filters[commodity]"] = commodity
    if market:
        params["filters[market]"] = market

    records = _fetch_page(params)

    # If state was a filter but API returned 0 because the exact string doesn't match,
    # try without state filter and do a local pass
    if state and not records:
        params_no_state = {k: v for k, v in params.items() if k != "filters[state]"}
        all_records = _fetch_page(params_no_state)
        # local filter — case-insensitive prefix match
        state_lc = state.lower()
        records = [r for r in all_records
                   if r["state"].lower().startswith(state_lc[:5]) or
                      state_lc.startswith(r["state"].lower()[:5])]

    logger.info(f"fetch_live_prices_gov({state},{commodity}) → {len(records)} records")
    return records


# ── PUBLIC: HISTORICAL PRICES ──────────────────────────────────────────────────
def fetch_historical_prices(commodity: str, state: str = None, days: int = 30) -> list:
    """
    Fetch historical price data for the last `days` calendar days.
    Uses a single API call fetching a large limit, then groups by arrival_date.
    This avoids per-day parallel requests that trigger rate limits / timeouts.
    Returns list of {date, modal_price, min_price, max_price, count}.
    """
    # We fetch a bulk page of 3000 records for this commodity (and optionally state).
    # The API returns records with different dates sorted newest-first.
    params: dict = {
        "api-key": API_KEY,
        "format":  "json",
        "limit":   3000,
        "filters[commodity]": commodity,
    }
    if state:
        params["filters[state]"] = state

    raw_recs = _fetch_page(params)

    # If state filtered returned 0, try national
    if not raw_recs and state:
        params_ns = {k: v for k, v in params.items() if k != "filters[state]"}
        raw_recs = _fetch_page(params_ns)

    if not raw_recs:
        return []

    # Group by arrival_date
    def _parse_date(s: str) -> datetime:
        for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d-%b-%Y"):
            try:
                return datetime.strptime(s, fmt)
            except ValueError:
                continue
        return datetime.min

    daily: dict = {}
    cutoff = datetime.now() - timedelta(days=days)
    for r in raw_recs:
        ds = r.get("date", "")
        if not ds:
            continue
        dt = _parse_date(ds)
        if dt < cutoff:
            continue
        if ds not in daily:
            daily[ds] = {"modals": [], "mins": [], "maxs": [], "dt": dt}
        daily[ds]["modals"].append(r["modal_price"])
        daily[ds]["mins"].append(r["min_price"])
        daily[ds]["maxs"].append(r["max_price"])

    result = []
    for ds, vals in daily.items():
        n = len(vals["modals"])
        if n == 0:
            continue
        result.append({
            "date":        ds,
            "modal_price": round(sum(vals["modals"]) / n),
            "min_price":   round(sum(vals["mins"])   / n) if vals["mins"] else 0,
            "max_price":   round(sum(vals["maxs"])   / n) if vals["maxs"] else 0,
            "count":       n,
        })

    result.sort(key=lambda x: _parse_date(x["date"]))
    logger.info(f"fetch_historical_prices({commodity},{state},{days}d) → {len(result)} days of data")
    return result


# ── LEGACY: Agmarknet WEB SCRAPE FALLBACK (used by regional scraper internally) ──
def fetch_live_prices_scrape(state: str = None, commodity: str = "Onion") -> list:
    """
    Scrape Agmarknet directly as fallback when API rate-limited.
    Kept for backward compatibility — prefer fetch_prices_smart().
    """
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        logger.warning("bs4 not installed — scrape fallback disabled")
        return []

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120"}
    today = datetime.now().strftime("%d-%b-%Y")
    params = {
        "Tx_Commodity": commodity, "Tx_State": state or "0", "Tx_District": "0",
        "Tx_Market": "0", "DateFrom": today, "DateTo": today, "Fr_Date": today,
        "To_Date": today, "Tx_Trend": "0",
        "Tx_CommodityHead": commodity, "Tx_StateHead": state or "All",
    }
    records = []
    try:
        resp = SESSION.get(AGMARKNET_SCRAPE_URL, params=params, timeout=15)
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, "lxml")
        table = soup.find("table", {"class": "tableagmark_new"}) or \
                soup.find("table", id="cphBody_GridPriceData")
        if table:
            for row in table.find_all("tr")[1:]:
                cols = [td.get_text(strip=True) for td in row.find_all("td")]
                if len(cols) >= 8:
                    records.append({
                        "state":       cols[0] if len(cols) > 0 else "",
                        "district":    cols[1] if len(cols) > 1 else "",
                        "market":      cols[2] if len(cols) > 2 else "",
                        "commodity":   cols[3] if len(cols) > 3 else commodity,
                        "variety":     cols[4] if len(cols) > 4 else "",
                        "min_price":   safe_float(cols[6] if len(cols) > 6 else "0"),
                        "max_price":   safe_float(cols[7] if len(cols) > 7 else "0"),
                        "modal_price": safe_float(cols[8] if len(cols) > 8 else "0"),
                        "unit":        "Quintal",
                        "date":        today,
                        "source":      "agmarknet_scraped",
                    })
    except Exception as e:
        logger.error(f"Agmarknet scrape error: {e}")
    return records


# ── PUBLIC: TWO-TIER SMART FETCH ──────────────────────────────────────────────
def fetch_prices_smart(
    state: str,
    market: str = None,
    district: str = None,
    commodity: str = None,
    limit: int = 2000,
    force_regional: bool = False,
) -> dict:
    """
    TWO-TIER DATA STRATEGY
    ======================
    Tier-1 (Official APMC): data.gov.in Agmarknet API
      → Covers all ~7,000+ government-registered APMCs.
      → Returns real arrival prices reported daily.

    Tier-2 (Local/Sub-district): Regional scraper cascade
      → MP Mandi Board, Rajasthan RSAMB, UP Mandi Parishad, eNAM, Agriwatch
      → Used when the specific market is NOT found in Tier-1 results.

    Args:
        state:          State name (e.g. "Madhya Pradesh")
        market:         Specific market/mandi name selected by the user
        district:       District name (optional, for filtering)
        commodity:      Commodity filter (optional)
        limit:          Max records to fetch from Tier-1
        force_regional: Skip Tier-1 and go directly to Tier-2 (for known local mandis)

    Returns:
        {
          "records":   [...],
          "source":    "agmarknet_api" | "regional" | "combined",
          "tier":      1 | 2,
          "market_found_in_api": bool,
        }
    """
    tier1_records = []
    tier2_records = []
    market_found_in_api = False

    # ── TIER 1: Official Agmarknet API ────────────────────────────────────────
    if not force_regional:
        tier1_records = fetch_live_prices_gov(
            state=state, commodity=commodity, limit=limit
        )

        if market and tier1_records:
            # Check if this specific market appears in the API results
            mkt_lower = market.lower().replace(" apmc", "").replace(" apmcs", "").strip()
            matched = [
                r for r in tier1_records
                if mkt_lower[:8] in r["market"].lower() or
                   r["market"].lower()[:8] in mkt_lower
            ]
            market_found_in_api = len(matched) > 0
            if matched:
                logger.info(f"Tier-1: found {len(matched)} records for market '{market}' in API")
                return {
                    "records": matched,
                    "source":  "agmarknet_api",
                    "tier":    1,
                    "market_found_in_api": True,
                }
            else:
                logger.info(f"Market '{market}' NOT in Agmarknet API — routing to Tier-2 regional scrapers")
        elif not market:
            # No specific market → return full state-level API data
            if tier1_records:
                return {
                    "records": tier1_records,
                    "source":  "agmarknet_api",
                    "tier":    1,
                    "market_found_in_api": False,  # no market filter requested
                }

    # ── TIER 2: Regional scrapers (local/sub-district mandis) ─────────────────
    logger.info(f"Tier-2 regional scraping for: state={state}, market={market}, commodity={commodity}")
    try:
        from regional_mandi_scraper import fetch_regional_prices
        tier2_records = fetch_regional_prices(
            state=state,
            market=market,
            commodity=commodity,
            district=district
        )
    except Exception as e:
        logger.error(f"Tier-2 regional scraper failed: {e}")

    if tier2_records:
        logger.info(f"Tier-2 returned {len(tier2_records)} records")
        return {
            "records": tier2_records,
            "source":  "regional_scrape",
            "tier":    2,
            "market_found_in_api": False,
        }

    # If Tier-2 also failed, return nearest state-wide Tier-1 data
    if tier1_records:
        logger.info(f"Tier-2 empty — falling back to state-wide Tier-1 ({len(tier1_records)} records)")
        return {
            "records": tier1_records[:100],  # cap to avoid flooding
            "source":  "agmarknet_api_statewide",
            "tier":    1,
            "market_found_in_api": False,
        }

    return {"records": [], "source": "none", "tier": 0, "market_found_in_api": False}

