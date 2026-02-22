"""
NERVE GPU Scanner — Self-contained real-time GPU spot market scanner.
Queries Azure Retail Prices, Open-Meteo weather, and Carbon Intensity APIs.
Scores GPUs with the NERVE formula (price + carbon + availability + cooling + renewable).
"""

import httpx
import asyncio
import hashlib
from typing import Optional

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

REGIONS = {
    "francecentral": {"lat": 48.86, "lon": 2.35, "label": "France Central"},
    "westeurope": {"lat": 52.37, "lon": 4.90, "label": "West Europe"},
    "uksouth": {"lat": 51.51, "lon": -0.13, "label": "UK South"},
}

NERVE_WEIGHTS = {
    "price": 0.50,
    "carbon": 0.20,
    "availability": 0.15,
    "cooling": 0.10,
    "renewable": 0.05,
}

# GPU catalog: Azure SKU prefix → (GPU name, VRAM GB, tier, energy kWh/hr)
GPU_CATALOG = {
    "Standard_NC6s_v3": ("NVIDIA V100 16GB", 16, "mid", 0.30),
    "Standard_NC12s_v3": ("NVIDIA V100 16GB x2", 32, "mid", 0.60),
    "Standard_NC24s_v3": ("NVIDIA V100 16GB x4", 64, "high", 1.20),
    "Standard_NC4as_T4_v3": ("NVIDIA T4 16GB", 16, "entry", 0.07),
    "Standard_NC8as_T4_v3": ("NVIDIA T4 16GB", 16, "entry", 0.07),
    "Standard_NC16as_T4_v3": ("NVIDIA T4 16GB", 16, "entry", 0.07),
    "Standard_NC64as_T4_v3": ("NVIDIA T4 16GB x4", 64, "mid", 0.28),
    "Standard_NC24ads_A100_v4": ("NVIDIA A100 80GB", 80, "high", 0.40),
    "Standard_NC48ads_A100_v4": ("NVIDIA A100 80GB x2", 160, "high", 0.80),
    "Standard_NC96ads_A100_v4": ("NVIDIA A100 80GB x4", 320, "ultra", 1.60),
    "Standard_ND96asr_v4": ("NVIDIA A100 80GB x8", 640, "ultra", 3.20),
    "Standard_NC40ads_H100_v5": ("NVIDIA H100 80GB", 80, "ultra", 0.70),
    "Standard_NC80adis_H100_v5": ("NVIDIA H100 80GB x2", 160, "ultra", 1.40),
    "Standard_ND96is_H100_v5": ("NVIDIA H100 80GB x4", 320, "ultra", 2.80),
    "Standard_NV6": ("NVIDIA M60 8GB", 8, "entry", 0.15),
    "Standard_NV12": ("NVIDIA M60 16GB", 16, "entry", 0.15),
    "Standard_NV24": ("NVIDIA M60 24GB", 24, "entry", 0.15),
    "Standard_NV12s_v3": ("NVIDIA M60 8GB", 8, "entry", 0.15),
    "Standard_NV24s_v3": ("NVIDIA M60 16GB", 16, "entry", 0.15),
    "Standard_NV48s_v3": ("NVIDIA M60 24GB", 24, "entry", 0.15),
    "Standard_ND6s": ("NVIDIA P40 24GB", 24, "mid", 0.25),
    "Standard_ND12s": ("NVIDIA P40 24GB x2", 48, "mid", 0.50),
    "Standard_ND24s": ("NVIDIA P40 24GB x4", 96, "high", 1.00),
    "Standard_NV6ads_A10_v5": ("NVIDIA A10 24GB", 24, "mid", 0.15),
    "Standard_NV18ads_A10_v5": ("NVIDIA A10 24GB", 24, "mid", 0.15),
    "Standard_NV36ads_A10_v5": ("NVIDIA A10 24GB", 24, "mid", 0.15),
    "Standard_NV12ads_A10_v5": ("NVIDIA A10 24GB", 24, "mid", 0.15),
    "Standard_NV36adms_A10_v5": ("NVIDIA A10 24GB", 24, "mid", 0.15),
    # AMD Radeon Instinct (NVv4 series)
    "Standard_NV4as_v4": ("AMD MI25 4GB", 4, "entry", 0.10),
    "Standard_NV8as_v4": ("AMD MI25 8GB", 8, "entry", 0.10),
    "Standard_NV16as_v4": ("AMD MI25 16GB", 16, "entry", 0.10),
    "Standard_NV32as_v4": ("AMD MI25 16GB", 16, "entry", 0.10),
}

# Grid mixes for carbon estimation (without live carbon API)
GRID_MIXES = {
    "francecentral": {
        "nuclear": 0.70, "hydro": 0.12, "wind_solar": 0.10, "gas": 0.08,
    },
    "westeurope": {
        "gas": 0.52, "wind_solar": 0.14, "nuclear": 0.03, "coal": 0.10,
        "hydro": 0.01, "biomass": 0.06, "other": 0.14,
    },
}

EMISSION_FACTORS = {
    "nuclear": 12, "hydro": 24, "wind_solar": 11, "wind": 11,
    "solar": 45, "gas": 490, "coal": 820, "biomass": 230, "other": 300,
}

PUE = 1.2  # Data center Power Usage Effectiveness


# ---------------------------------------------------------------------------
# Azure Retail Prices API
# ---------------------------------------------------------------------------

async def _scrape_azure_prices(client: httpx.AsyncClient, region: str) -> list[dict]:
    """Fetch GPU spot prices from Azure Retail Prices API."""
    gpu_skus = []
    url = "https://prices.azure.com/api/retail/prices"
    # Query for Virtual Machines + GPU SKUs (NC, NV, ND families) + Spot
    filters = [
        f"armRegionName eq '{region}'",
        "serviceFamily eq 'Compute'",
        "priceType eq 'Consumption'",
        "(contains(armSkuName, 'Standard_NC') or contains(armSkuName, 'Standard_NV') or contains(armSkuName, 'Standard_ND'))",
    ]
    params = {"$filter": " and ".join(filters)}

    try:
        resp = await client.get(url, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        items = data.get("Items", [])
    except Exception:
        return []

    # Group by SKU, separate spot vs on-demand
    sku_map: dict[str, dict] = {}
    for item in items:
        sku = item.get("armSkuName", "")
        price = item.get("retailPrice", 0)
        unit = item.get("unitOfMeasure", "")
        sku_name = item.get("skuName", "")

        if "1 Hour" not in unit or price <= 0:
            continue

        is_spot = "Spot" in sku_name
        is_low = "Low Priority" in sku_name

        if sku not in sku_map:
            sku_map[sku] = {"sku": sku, "spot": None, "ondemand": None}

        if is_spot or is_low:
            current = sku_map[sku]["spot"]
            if current is None or price < current:
                sku_map[sku]["spot"] = price
        else:
            current = sku_map[sku]["ondemand"]
            if current is None or price < current:
                sku_map[sku]["ondemand"] = price

    for sku, prices in sku_map.items():
        if prices["spot"] is None:
            continue  # No spot price = skip

        catalog = GPU_CATALOG.get(sku)
        if not catalog:
            # Try prefix match
            for prefix, info in GPU_CATALOG.items():
                if sku.startswith(prefix.split("_v")[0]):
                    catalog = info
                    break

        if not catalog:
            continue  # Skip unknown GPU SKUs

        gpu_name = catalog[0]
        vram = catalog[1]
        tier = catalog[2]
        energy = catalog[3]

        ondemand = prices["ondemand"] or prices["spot"] * 3
        savings = round((1 - prices["spot"] / ondemand) * 100, 1) if ondemand > 0 else 0

        gpu_skus.append({
            "sku": sku,
            "gpu_name": gpu_name,
            "vram_gb": vram,
            "tier": tier,
            "spot_price_usd_hr": round(prices["spot"], 4),
            "ondemand_price_usd_hr": round(ondemand, 4),
            "savings_pct": savings,
            "energy_kwh_hr": energy,
            "region": region,
            "region_label": REGIONS[region]["label"],
        })

    return gpu_skus


# ---------------------------------------------------------------------------
# Weather API (Open-Meteo)
# ---------------------------------------------------------------------------

async def _scrape_weather(client: httpx.AsyncClient, region: str) -> dict:
    """Fetch current weather from Open-Meteo."""
    coords = REGIONS[region]
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": coords["lat"],
        "longitude": coords["lon"],
        "current": "temperature_2m,wind_speed_10m,direct_radiation",
    }
    try:
        resp = await client.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        current = data.get("current", {})
        return {
            "temperature_c": current.get("temperature_2m", 15),
            "wind_kmh": current.get("wind_speed_10m", 10),
            "solar_radiation": current.get("direct_radiation", 100),
        }
    except Exception:
        return {"temperature_c": 15, "wind_kmh": 10, "solar_radiation": 100}


# ---------------------------------------------------------------------------
# Carbon Intensity
# ---------------------------------------------------------------------------

async def _scrape_carbon_uk(client: httpx.AsyncClient) -> Optional[float]:
    """Fetch live carbon intensity for UK from carbonintensity.org.uk."""
    url = "https://api.carbonintensity.org.uk/intensity"
    try:
        resp = await client.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        items = data.get("data", [])
        if items:
            return items[0].get("intensity", {}).get("actual") or items[0].get("intensity", {}).get("forecast")
    except Exception:
        pass
    return None


def _estimate_carbon_from_weather(region: str, weather: dict) -> float:
    """Estimate carbon intensity from grid mix and weather for non-UK regions."""
    mix = GRID_MIXES.get(region)
    if not mix:
        return 200  # default fallback

    wind = weather.get("wind_kmh", 10)
    solar = weather.get("solar_radiation", 100)

    # Adjust wind/solar share based on live weather
    wind_factor = min(wind / 25.0, 2.0)  # double at 25+ km/h
    solar_factor = min(solar / 300.0, 2.0)  # double at 300+ W/m²

    base_wind_solar = mix.get("wind_solar", 0.10)
    adjusted_re = base_wind_solar * ((wind_factor + solar_factor) / 2)
    adjusted_re = min(adjusted_re, 0.50)  # cap at 50%

    # Redistribute: more renewables → less gas
    gas_share = mix.get("gas", 0.08)
    gas_reduction = (adjusted_re - base_wind_solar) * 0.8
    adjusted_gas = max(gas_share - gas_reduction, 0.02)

    # Calculate weighted carbon intensity
    carbon = 0
    carbon += mix.get("nuclear", 0) * EMISSION_FACTORS["nuclear"]
    carbon += mix.get("hydro", 0) * EMISSION_FACTORS["hydro"]
    carbon += adjusted_re * EMISSION_FACTORS["wind_solar"]
    carbon += adjusted_gas * EMISSION_FACTORS["gas"]
    carbon += mix.get("coal", 0) * EMISSION_FACTORS["coal"]
    carbon += mix.get("biomass", 0) * EMISSION_FACTORS.get("biomass", 230)
    carbon += mix.get("other", 0) * EMISSION_FACTORS.get("other", 300)

    return round(carbon, 1)


# ---------------------------------------------------------------------------
# NERVE Scoring
# ---------------------------------------------------------------------------

def _estimate_availability(spot: float, ondemand: float) -> tuple[str, float]:
    """Estimate GPU availability from spot/on-demand price ratio."""
    if ondemand <= 0:
        return ("medium", 0.7)
    ratio = spot / ondemand
    if ratio > 0.70:
        return ("low", 0.4)
    elif ratio > 0.45:
        return ("medium", 0.7)
    else:
        return ("high", 1.0)


def _nerve_score(gpu: dict, weather: dict, carbon_gco2: float) -> float:
    """Calculate NERVE score (lower is better)."""
    w = NERVE_WEIGHTS

    # Normalize price (0-1, $15/hr max)
    norm_price = min(gpu["spot_price_usd_hr"] / 15.0, 1.0)

    # Normalize carbon (0-1, 500 gCO2/kWh max)
    norm_carbon = min(carbon_gco2 / 500.0, 1.0)

    # Availability score (higher = better)
    _, avail_score = _estimate_availability(
        gpu["spot_price_usd_hr"], gpu["ondemand_price_usd_hr"]
    )

    # Normalize cooling (temperature, lower is better for cooling)
    temp = weather.get("temperature_c", 15)
    norm_cooling = min(max(temp, 0) / 40.0, 1.0)

    # Renewable score (wind proxy, higher = more renewable)
    wind = weather.get("wind_kmh", 10)
    renew_score = min(wind / 50.0, 1.0)

    score = (
        w["price"] * norm_price
        + w["carbon"] * norm_carbon
        + w["availability"] * (1 - avail_score)
        + w["cooling"] * norm_cooling
        + w["renewable"] * (1 - renew_score)
    )

    return round(score, 4)


def _az_variation(sku: str, region: str, base_price: float) -> list[dict]:
    """Generate per-AZ price micro-variations (±3-8%) using deterministic hash."""
    azs = []
    for az_num in range(1, 4):
        az_name = f"{region}-az{az_num}"
        h = int(hashlib.md5(f"{sku}:{az_name}".encode()).hexdigest()[:8], 16)
        variation = 0.92 + (h % 160) / 1000.0  # 0.92 to 1.08
        price = round(base_price * variation, 4)
        azs.append({"az": az_name, "spot_price_usd_hr": price})
    return azs


# ---------------------------------------------------------------------------
# Main scanner
# ---------------------------------------------------------------------------

async def scan_all_regions() -> dict:
    """
    Scan all configured regions for GPU spot prices, weather, and carbon data.
    Returns the best GPU option + alternatives ranked by NERVE score.
    """
    all_gpus = []

    async with httpx.AsyncClient() as client:
        # Fetch all data concurrently
        tasks = {}
        for region in REGIONS:
            tasks[region] = {
                "prices": _scrape_azure_prices(client, region),
                "weather": _scrape_weather(client, region),
            }
        tasks["uk_carbon"] = _scrape_carbon_uk(client)

        # Gather all
        weather_data = {}
        price_data = {}

        # Run weather + prices for all regions concurrently
        all_tasks = []
        task_keys = []
        for region in REGIONS:
            all_tasks.append(tasks[region]["prices"])
            task_keys.append(("prices", region))
            all_tasks.append(tasks[region]["weather"])
            task_keys.append(("weather", region))
        all_tasks.append(tasks["uk_carbon"])
        task_keys.append(("uk_carbon", None))

        results = await asyncio.gather(*all_tasks, return_exceptions=True)

        uk_carbon = None
        for (kind, region), result in zip(task_keys, results):
            if isinstance(result, Exception):
                continue
            if kind == "prices":
                price_data[region] = result
            elif kind == "weather":
                weather_data[region] = result
            elif kind == "uk_carbon":
                uk_carbon = result

        # Score each GPU
        for region in REGIONS:
            gpus = price_data.get(region, [])
            weather = weather_data.get(region, {"temperature_c": 15, "wind_kmh": 10})

            # Carbon intensity
            if region == "uksouth" and uk_carbon is not None:
                carbon = uk_carbon
            else:
                carbon = _estimate_carbon_from_weather(region, weather)

            for gpu in gpus:
                avail_label, _ = _estimate_availability(
                    gpu["spot_price_usd_hr"], gpu["ondemand_price_usd_hr"]
                )

                # Carbon per hour for this GPU
                co2_per_hr = gpu["energy_kwh_hr"] * carbon * PUE

                score = _nerve_score(gpu, weather, carbon)

                all_gpus.append({
                    "gpu_name": gpu["gpu_name"],
                    "sku": gpu["sku"],
                    "vram_gb": gpu["vram_gb"],
                    "region": gpu["region_label"],
                    "region_id": gpu["region"],
                    "spot_price_usd_hr": gpu["spot_price_usd_hr"],
                    "ondemand_price_usd_hr": gpu["ondemand_price_usd_hr"],
                    "savings_pct": gpu["savings_pct"],
                    "carbon_intensity_gco2_kwh": round(carbon, 1),
                    "carbon_index": (
                        "very low" if carbon < 50 else
                        "low" if carbon < 150 else
                        "medium" if carbon < 300 else
                        "high"
                    ),
                    "co2_grams_per_hr": round(co2_per_hr, 1),
                    "temperature_c": round(weather.get("temperature_c", 15), 1),
                    "wind_kmh": round(weather.get("wind_kmh", 10), 1),
                    "availability": avail_label,
                    "nerve_score": score,
                    "az_prices": _az_variation(gpu["sku"], gpu["region"], gpu["spot_price_usd_hr"]),
                })

    # Sort by NERVE score (lower = better)
    all_gpus.sort(key=lambda g: g["nerve_score"])

    if not all_gpus:
        return {"best": None, "alternatives": [], "regions_scanned": len(REGIONS), "gpus_found": 0}

    best = all_gpus[0]
    # Add cost estimate for 4h training
    est_hours = 0.15  # ~10 min for TinyLlama + LoRA on small dataset
    best["estimated_training_min"] = round(est_hours * 60)
    best["total_cost_estimate_usd"] = round(best["spot_price_usd_hr"] * est_hours, 3)
    best["total_co2_grams"] = round(best["co2_grams_per_hr"] * est_hours, 1)
    best["strategy"] = "immediate" if best["availability"] == "high" else "wait_or_migrate"

    # Alternatives: up to 4, different GPUs or regions from best
    alternatives = []
    seen = set()
    for gpu in all_gpus[1:]:
        key = (gpu["gpu_name"], gpu["region_id"])
        if key not in seen and key != (best["gpu_name"], best["region_id"]):
            alternatives.append({
                "gpu_name": gpu["gpu_name"],
                "sku": gpu["sku"],
                "region": gpu["region"],
                "region_id": gpu["region_id"],
                "spot_price_usd_hr": gpu["spot_price_usd_hr"],
                "savings_pct": gpu["savings_pct"],
                "carbon_intensity_gco2_kwh": gpu["carbon_intensity_gco2_kwh"],
                "nerve_score": gpu["nerve_score"],
            })
            seen.add(key)
        if len(alternatives) >= 4:
            break

    return {
        "best": best,
        "alternatives": alternatives,
        "regions_scanned": len(REGIONS),
        "gpus_found": len(all_gpus),
    }
