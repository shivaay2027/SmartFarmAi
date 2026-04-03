"""
SmartFarm AI — Mandi Price Scraper
Sources: Agmarknet, data.gov.in, State Portals

In production this runs via APScheduler every 1 hour.
For demo: uses BeautifulSoup + requests to scrape Agmarknet.
"""

import requests
from bs4 import BeautifulSoup
import logging
from datetime import datetime

logger = logging.getLogger("mandi_scraper")

AGMARKNET_BASE = "https://agmarknet.gov.in"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

def scrape_agmarknet_prices(state_code: str = "MH", commodity: str = "Onion") -> list:
    """
    Scrape Agmarknet for prices of a commodity in a state.
    Returns list of price records.

    In production: iterate over all states and 50+ commodities.
    """
    url = f"{AGMARKNET_BASE}/PriceAndArrivals/CommodityWiseDailyReport.aspx"
    params = {
        "Tx_Commodity": commodity,
        "Tx_State": state_code,
        "Tx_District": "0",
        "Tx_Market": "0",
        "DateFrom": datetime.now().strftime("%d-%b-%Y"),
        "DateTo": datetime.now().strftime("%d-%b-%Y"),
        "Fr_Date": datetime.now().strftime("%d-%b-%Y"),
        "To_Date": datetime.now().strftime("%d-%b-%Y"),
        "Tx_Trend": "0",
        "Tx_CommodityHead": commodity,
    }

    records = []
    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        # Agmarknet uses a table with class "tableagmark_new"
        table = soup.find("table", {"class": "tableagmark_new"})
        if not table:
            logger.warning(f"No table found for {commodity} in {state_code}")
            return []

        rows = table.find_all("tr")[1:]  # skip header
        for row in rows:
            cols = [td.get_text(strip=True) for td in row.find_all("td")]
            if len(cols) >= 9:
                try:
                    records.append({
                        "state": cols[0],
                        "district": cols[1],
                        "market": cols[2],
                        "commodity": cols[3],
                        "variety": cols[4],
                        "grade": cols[5],
                        "min_price": float(cols[6].replace(",", "")) if cols[6] else None,
                        "max_price": float(cols[7].replace(",", "")) if cols[7] else None,
                        "modal_price": float(cols[8].replace(",", "")) if cols[8] else None,
                        "date": cols[9] if len(cols) > 9 else datetime.now().strftime("%d/%m/%Y"),
                        "source": "agmarknet",
                        "scraped_at": datetime.now().isoformat(),
                    })
                except ValueError as e:
                    logger.debug(f"Row parse error: {e}")
    except requests.RequestException as e:
        logger.error(f"Agmarknet scrape failed: {e}")

    return records


def scrape_data_gov_api(resource_id: str = "9ef84268-d588-465a-a308-a864a43d0070",
                         limit: int = 100) -> list:
    """
    Fetch from data.gov.in Agmarknet dataset API.
    Default resource_id: Daily Mandi Prices dataset.
    """
    url = "https://api.data.gov.in/resource/" + resource_id
    params = {
        "api-key": "579b464db66ec23bdd000001cdd3946e44ce4aad38d07994cc11312",  # demo key
        "format": "json",
        "limit": limit,
        "filters[Arrival_Date]": datetime.now().strftime("%d/%m/%Y"),
    }
    records = []
    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=15)
        data = resp.json()
        for rec in data.get("records", []):
            try:
                records.append({
                    "state": rec.get("State"),
                    "district": rec.get("District"),
                    "market": rec.get("Market"),
                    "commodity": rec.get("Commodity"),
                    "variety": rec.get("Variety"),
                    "min_price": float(rec.get("Min_x0020_Price", 0) or 0),
                    "max_price": float(rec.get("Max_x0020_Price", 0) or 0),
                    "modal_price": float(rec.get("Modal_x0020_Price", 0) or 0),
                    "date": rec.get("Arrival_Date"),
                    "source": "data.gov.in",
                    "scraped_at": datetime.now().isoformat(),
                })
            except Exception:
                pass
    except Exception as e:
        logger.error(f"data.gov.in API failed: {e}")
    return records


def scrape_enam_prices(commodity: str = "Wheat") -> list:
    """
    Scrape e-NAM (National Agriculture Market) platform.
    eNAM has a public API at https://enam.gov.in/web/dashboard/trade-data
    """
    url = "https://enam.gov.in/web/Ajax_ctrl/trade_data_list"
    params = {
        "language": "en",
        "stateName": "",
        "daysToTrade": "1",
        "apmc": "",
        "commodity": commodity,
    }
    records = []
    try:
        resp = requests.post(url, data=params, headers=HEADERS, timeout=15)
        data = resp.json()
        for item in data.get("data", {}).get("trade_data", []):
            try:
                records.append({
                    "state": item.get("stateName"),
                    "market": item.get("mandName"),
                    "commodity": item.get("commodity"),
                    "min_price": float(item.get("minTradedPrice", 0)),
                    "max_price": float(item.get("maxTradedPrice", 0)),
                    "modal_price": float(item.get("modalTradedPrice", 0)),
                    "quantity_tonnes": float(item.get("arrivals", 0)),
                    "date": item.get("tradeDate"),
                    "source": "enam",
                    "scraped_at": datetime.now().isoformat(),
                })
            except Exception:
                pass
    except Exception as e:
        logger.error(f"eNAM scrape failed: {e}")
    return records


# ── Scheduler integration ─────────────────────────────────────────────────────
def run_scraper_job():
    """Called by APScheduler every hour."""
    logger.info("Mandi scraper job started")

    # Priority scrapes
    priority_items = [
        ("MH", "Onion"), ("AP", "Chilli"), ("RJ", "Mustard"),
        ("MP", "Soybean"), ("GJ", "Cotton"), ("UP", "Wheat"),
        ("PB", "Rice"), ("HR", "Wheat"), ("KA", "Maize"),
    ]

    total = 0
    for state_code, commodity in priority_items:
        try:
            records = scrape_agmarknet_prices(state_code, commodity)
            logger.info(f"  {state_code}/{commodity}: {len(records)} records")
            total += len(records)
        except Exception as e:
            logger.error(f"  Failed {state_code}/{commodity}: {e}")

    # Also try data.gov.in
    try:
        gov_records = scrape_data_gov_api(limit=200)
        logger.info(f"  data.gov.in: {len(gov_records)} records")
        total += len(gov_records)
    except Exception as e:
        logger.error(f"  data.gov.in failed: {e}")

    logger.info(f"Scraper job complete. Total records: {total}")
    return total
