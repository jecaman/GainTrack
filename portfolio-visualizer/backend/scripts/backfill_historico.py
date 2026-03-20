#!/usr/bin/env python3
"""
Script de backfill masivo de precios históricos desde Kraken.

La API OHLC de Kraken devuelve máximo ~720 velas por llamada (diarias = ~2 años).
Este script hace múltiples llamadas hacia atrás para cada asset, desde hoy hasta
la fecha objetivo (por defecto 2020-01-01).

Uso:
  python3 backfill_historico.py                    # Todos los assets, desde 2020
  python3 backfill_historico.py 2022-01-01         # Todos los assets, desde 2022
  python3 backfill_historico.py 2020-01-01 XXBT    # Solo BTC, desde 2020
  python3 backfill_historico.py 2020-01-01 --skip-existing  # Saltar fechas ya cacheadas
"""
import logging
import sys
import os
import time
import requests
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from supabase_cache import cache, get_spain_date

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════
# ASSETS Y PAIR MAPPING — Fuente de verdad centralizada
# ═══════════════════════════════════════════════════════════════════════

ASSETS = [
    # ── Top market cap ──
    "XXBT",     # BTC
    "XETH",     # ETH
    "SOL",      # Solana
    "XRP",      # Ripple
    "ADA",      # Cardano
    "AVAX",     # Avalanche
    "DOT",      # Polkadot
    "LINK",     # Chainlink
    "ATOM",     # Cosmos
    "UNI",      # Uniswap
    "XDG",      # Dogecoin (DOGE)
    "POL",      # Polygon (ex-MATIC)
    "HBAR",     # Hedera
    "TRUMP",    # TRUMP
    "TRX",      # TRON
    "TON",      # Toncoin
    "KAS",      # Kaspa
    "ICP",      # Internet Computer
    "XLTC",     # Litecoin
    "BCH",      # Bitcoin Cash
    "XXLM",     # Stellar
    "XTZ",      # Tezos
    "BNB",      # Binance Coin
    # ── Layer 2 / New L1 ──
    "NEAR",     # NEAR Protocol
    "APT",      # Aptos
    "ARB",      # Arbitrum
    "OP",       # Optimism
    "SUI",      # Sui
    "SEI",      # Sei
    "STX",      # Stacks
    "TIA",      # Celestia
    "INJ",      # Injective
    "MINA",     # Mina
    "FLOW",     # Flow
    "KAVA",     # Kava
    "ALGO",     # Algorand
    # ── DeFi ──
    "AAVE",     # Aave
    "CRV",      # Curve
    "COMP",     # Compound
    "SNX",      # Synthetix
    "SUSHI",    # SushiSwap
    "YFI",      # Yearn Finance
    "1INCH",    # 1inch
    "DYDX",     # dYdX
    "PENDLE",   # Pendle
    "RUNE",     # THORChain
    "FIL",      # Filecoin
    # ── AI / Data ──
    "FET",      # Fetch.ai
    "OCEAN",    # Ocean Protocol
    "RENDER",   # Render
    "TAO",      # Bittensor
    "GRT",      # The Graph
    # ── Gaming / Metaverse ──
    "MANA",     # Decentraland
    "SAND",     # The Sandbox
    "AXS",      # Axie Infinity
    "ENJ",      # Enjin
    "GALA",     # Gala
    "IMX",      # Immutable X
    # ── Meme ──
    "PEPE",     # Pepe
    "SHIB",     # Shiba Inu
    "FLOKI",    # Floki
    "BONK",     # Bonk
    "WIF",      # dogwifhat
    # ── Trending / New ──
    "JUP",      # Jupiter
    "WLD",      # Worldcoin
    "STRK",     # StarkNet
    "ZRO",      # LayerZero
    "EIGEN",    # EigenLayer
    "ENA",      # Ethena
    "ONDO",     # Ondo Finance
    "ETHFI",    # Ether.fi
]

PAIR_MAPPING = {
    # Special Kraken naming
    'XXBT': 'XXBTZEUR',
    'XETH': 'XETHZEUR',
    'XRP': 'XXRPZEUR',
    'XLTC': 'XLTCZEUR',
    'XXLM': 'XXLMZEUR',
    'XDG': 'XDGEUR',
    # Standard {ASSET}EUR
    'SOL': 'SOLEUR',
    'ADA': 'ADAEUR',
    'AVAX': 'AVAXEUR',
    'DOT': 'DOTEUR',
    'LINK': 'LINKEUR',
    'ATOM': 'ATOMEUR',
    'UNI': 'UNIEUR',
    'POL': 'POLEUR',
    'HBAR': 'HBAREUR',
    'TRUMP': 'TRUMPEUR',
    'TRX': 'TRXEUR',
    'TON': 'TONEUR',
    'KAS': 'KASEUR',
    'ICP': 'ICPEUR',
    'BCH': 'BCHEUR',
    'BNB': 'BNBEUR',
    'XTZ': 'XTZEUR',
    'NEAR': 'NEAREUR',
    'APT': 'APTEUR',
    'ARB': 'ARBEUR',
    'OP': 'OPEUR',
    'SUI': 'SUIEUR',
    'SEI': 'SEIEUR',
    'STX': 'STXEUR',
    'TIA': 'TIAEUR',
    'INJ': 'INJEUR',
    'MINA': 'MINAEUR',
    'FLOW': 'FLOWEUR',
    'KAVA': 'KAVAEUR',
    'ALGO': 'ALGOEUR',
    'AAVE': 'AAVEEUR',
    'CRV': 'CRVEUR',
    'COMP': 'COMPEUR',
    'SNX': 'SNXEUR',
    'SUSHI': 'SUSHIEUR',
    'YFI': 'YFIEUR',
    '1INCH': '1INCHEUR',
    'DYDX': 'DYDXEUR',
    'PENDLE': 'PENDLEEUR',
    'RUNE': 'RUNEEUR',
    'FIL': 'FILEUR',
    'FET': 'FETEUR',
    'OCEAN': 'OCEANEUR',
    'RENDER': 'RENDEREUR',
    'TAO': 'TAOEUR',
    'GRT': 'GRTEUR',
    'MANA': 'MANAEUR',
    'SAND': 'SANDEUR',
    'AXS': 'AXSEUR',
    'ENJ': 'ENJEUR',
    'GALA': 'GALAEUR',
    'IMX': 'IMXEUR',
    'PEPE': 'PEPEEUR',
    'SHIB': 'SHIBEUR',
    'FLOKI': 'FLOKIEUR',
    'BONK': 'BONKEUR',
    'WIF': 'WIFEUR',
    'JUP': 'JUPEUR',
    'WLD': 'WLDEUR',
    'STRK': 'STRKEUR',
    'ZRO': 'ZROEUR',
    'EIGEN': 'EIGENEUR',
    'ENA': 'ENAEUR',
    'ONDO': 'ONDOEUR',
    'ETHFI': 'ETHFIEUR',
}

# Max candles Kraken returns per OHLC call (daily interval)
MAX_CANDLES_PER_CALL = 720
DELAY_BETWEEN_CALLS = 1.5  # seconds
DELAY_BETWEEN_ASSETS = 2.0  # seconds


def fetch_ohlc(pair: str, interval: int = 1440) -> list:
    """
    Fetch OHLC data from Kraken (max ~720 candles).
    interval: 1440 = daily, 10080 = weekly.
    Returns list of [timestamp, open, high, low, close, vwap, volume, count].
    """
    url = "https://api.kraken.com/0/public/OHLC"
    params = {'pair': pair, 'interval': interval}

    for attempt in range(3):
        try:
            resp = requests.get(url, params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json()

            if data.get('error'):
                logger.warning(f"Kraken API error: {data['error']}")
                if 'EGeneral:Too many requests' in str(data['error']):
                    wait = 10 * (attempt + 1)
                    logger.info(f"Rate limited, waiting {wait}s...")
                    time.sleep(wait)
                    continue
                return []

            for key, value in data.get('result', {}).items():
                if key != 'last':
                    return value
            return []

        except requests.exceptions.RequestException as e:
            logger.warning(f"Request error (attempt {attempt+1}/3): {e}")
            time.sleep(5 * (attempt + 1))

    return []


def interpolate_weekly_to_daily(weekly_prices: Dict[date, float], target_start: date, daily_start: date) -> Dict[date, float]:
    """
    Interpolate weekly price points to daily prices using linear interpolation.
    Only generates dates from target_start to daily_start (exclusive).
    """
    if len(weekly_prices) < 2:
        return {}

    sorted_dates = sorted(weekly_prices.keys())
    daily_prices = {}

    for i in range(len(sorted_dates) - 1):
        d1 = sorted_dates[i]
        d2 = sorted_dates[i + 1]
        p1 = weekly_prices[d1]
        p2 = weekly_prices[d2]
        days_between = (d2 - d1).days

        if days_between == 0:
            continue

        for day_offset in range(days_between):
            current_date = d1 + timedelta(days=day_offset)
            if current_date < target_start or current_date >= daily_start:
                continue
            # Linear interpolation
            fraction = day_offset / days_between
            price = p1 + (p2 - p1) * fraction
            daily_prices[current_date] = round(price, 8)

    return daily_prices


def backfill_asset(asset: str, target_start: date, skip_existing: bool = True) -> dict:
    """
    Backfill historical prices for a single asset.

    Strategy (Kraken OHLC returns max ~720 candles):
    1. Fetch DAILY candles (last ~720 days of real daily data)
    2. If target_start is before the daily range, fetch WEEKLY candles
       and interpolate to daily for the gap period

    Returns: {'saved': int, 'skipped': int, 'errors': int, 'earliest': date|None}
    """
    pair = PAIR_MAPPING.get(asset, f"{asset}EUR")
    hoy = get_spain_date()
    stats = {'saved': 0, 'skipped': 0, 'errors': 0, 'earliest': None}
    all_prices: Dict[date, float] = {}

    # Step 1: Fetch daily candles (last ~720 days)
    logger.info(f"  Fetching daily candles...")
    daily_candles = fetch_ohlc(pair, interval=1440)
    daily_start = None

    if daily_candles:
        for candle in daily_candles:
            candle_date = date.fromtimestamp(int(candle[0]))
            if candle_date >= hoy:
                continue
            close_price = float(candle[4])
            all_prices[candle_date] = close_price
            if daily_start is None or candle_date < daily_start:
                daily_start = candle_date

        logger.info(f"  Daily: {len(all_prices)} candles ({daily_start} → {max(all_prices.keys()) if all_prices else 'N/A'})")
    else:
        logger.warning(f"  No daily candles returned for {asset}")
        return stats

    # Step 2: If we need data before the daily range, fetch weekly and interpolate
    if target_start < daily_start:
        logger.info(f"  Need weekly data for gap: {target_start} → {daily_start}")
        time.sleep(DELAY_BETWEEN_CALLS)

        weekly_candles = fetch_ohlc(pair, interval=10080)
        if weekly_candles:
            weekly_prices = {}
            for candle in weekly_candles:
                candle_date = date.fromtimestamp(int(candle[0]))
                if candle_date >= hoy:
                    continue
                weekly_prices[candle_date] = float(candle[4])

            if weekly_prices:
                weekly_start = min(weekly_prices.keys())
                logger.info(f"  Weekly: {len(weekly_prices)} candles ({weekly_start} → {max(weekly_prices.keys())})")

                # Interpolate weekly to daily for the gap period
                interpolated = interpolate_weekly_to_daily(weekly_prices, target_start, daily_start)
                logger.info(f"  Interpolated: {len(interpolated)} daily prices from weekly data")

                # Add interpolated prices (don't overwrite real daily data)
                for d, p in interpolated.items():
                    if d not in all_prices:
                        all_prices[d] = p
        else:
            logger.warning(f"  No weekly candles for {asset} — only daily data available")

    # Now save all collected prices to Supabase
    if all_prices:
        stats['earliest'] = min(all_prices.keys())
        logger.info(f"  Total prices collected: {len(all_prices)} ({stats['earliest']} → {max(all_prices.keys())})")

        # Batch check: get all existing dates for this asset in one query
        existing_dates = set()
        if skip_existing:
            try:
                resp = cache.supabase.table("precios_cache") \
                    .select("fecha") \
                    .eq("asset", asset) \
                    .gte("fecha", str(stats['earliest'])) \
                    .lte("fecha", str(max(all_prices.keys()))) \
                    .execute()
                existing_dates = {r['fecha'] for r in resp.data} if resp.data else set()
                logger.info(f"  Existing dates in Supabase: {len(existing_dates)}")
            except Exception as e:
                logger.warning(f"  Could not batch-check existing dates: {e}")

        # Batch insert: collect rows to upsert
        rows_to_save = []
        for fecha, precio in sorted(all_prices.items()):
            if str(fecha) in existing_dates:
                stats['skipped'] += 1
                continue
            rows_to_save.append({
                'asset': asset,
                'precio_eur': precio,
                'fecha': str(fecha),
                'updated_at': datetime.now().isoformat(),
            })

        # Upsert in batches of 500
        BATCH_SIZE = 500
        for i in range(0, len(rows_to_save), BATCH_SIZE):
            batch = rows_to_save[i:i + BATCH_SIZE]
            try:
                cache.supabase.table("precios_cache") \
                    .upsert(batch, on_conflict="asset,fecha") \
                    .execute()
                stats['saved'] += len(batch)
                logger.info(f"  Batch upserted {len(batch)} rows ({i+1}-{i+len(batch)})")
            except Exception as e:
                logger.error(f"  Batch upsert error: {e}")
                # Fallback: try one by one
                for row in batch:
                    try:
                        cache.guardar_precio_cache(asset, row['precio_eur'],
                                                    date.fromisoformat(row['fecha']),
                                                    force_historico=True)
                        stats['saved'] += 1
                    except Exception as e2:
                        logger.error(f"  Error saving {asset} {row['fecha']}: {e2}")
                        stats['errors'] += 1

        logger.info(f"  Saved: {stats['saved']}, Skipped: {stats['skipped']}, Errors: {stats['errors']}")
    else:
        logger.warning(f"  No prices collected for {asset}")

    return stats


def main():
    """Main backfill function."""
    # Parse args
    target_start = date(2020, 1, 1)
    specific_asset = None
    skip_existing = True

    args = sys.argv[1:]
    for arg in args:
        if arg == '--skip-existing':
            skip_existing = True
        elif arg == '--force':
            skip_existing = False
        elif specific_asset is None and not arg.startswith('-') and '-' not in arg:
            # Could be asset name
            if arg.upper() in ASSETS or arg.upper() in PAIR_MAPPING:
                specific_asset = arg.upper()
            else:
                # Try as date
                try:
                    target_start = datetime.strptime(arg, '%Y-%m-%d').date()
                except ValueError:
                    specific_asset = arg.upper()
        else:
            try:
                target_start = datetime.strptime(arg, '%Y-%m-%d').date()
            except ValueError:
                pass

    # Re-parse to handle "date asset" order
    if len(args) >= 1 and '-' in args[0]:
        try:
            target_start = datetime.strptime(args[0], '%Y-%m-%d').date()
        except ValueError:
            pass
    if len(args) >= 2 and not args[1].startswith('-'):
        specific_asset = args[1].upper()

    assets_to_process = [specific_asset] if specific_asset else ASSETS

    logger.info(f"{'='*60}")
    logger.info(f"BACKFILL HISTORICO")
    logger.info(f"  Target start: {target_start}")
    logger.info(f"  Assets: {len(assets_to_process)}")
    logger.info(f"  Skip existing: {skip_existing}")
    logger.info(f"{'='*60}")

    total_stats = {'saved': 0, 'skipped': 0, 'errors': 0}
    results = {}

    for i, asset in enumerate(assets_to_process, 1):
        logger.info(f"\n[{i}/{len(assets_to_process)}] {asset}")
        stats = backfill_asset(asset, target_start, skip_existing)
        results[asset] = stats
        total_stats['saved'] += stats['saved']
        total_stats['skipped'] += stats['skipped']
        total_stats['errors'] += stats['errors']

        if i < len(assets_to_process):
            time.sleep(DELAY_BETWEEN_ASSETS)

    # Summary
    logger.info(f"\n{'='*60}")
    logger.info(f"BACKFILL COMPLETE")
    logger.info(f"  Total saved:   {total_stats['saved']}")
    logger.info(f"  Total skipped: {total_stats['skipped']}")
    logger.info(f"  Total errors:  {total_stats['errors']}")
    logger.info(f"{'='*60}")

    # Per-asset summary
    for asset, stats in results.items():
        earliest = stats['earliest'] or 'N/A'
        status = 'OK' if stats['errors'] == 0 else 'ERRORS'
        logger.info(f"  {asset:8s}: {stats['saved']:5d} saved, {stats['skipped']:5d} skipped, earliest={earliest} [{status}]")

    return 0 if total_stats['errors'] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
