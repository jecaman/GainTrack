#!/usr/bin/env python3
"""
Script para actualizar precios históricos del día anterior.
Debe ejecutarse diariamente (ej: 00:05 AM via cron).

Usa la API OHLC de Kraken para obtener el precio de cierre real del día anterior,
en vez del Ticker real-time. Así el resultado es determinista sin importar
la hora de ejecución.

Incluye reintentos con backoff exponencial y delay entre assets.
"""
import logging
import sys
import os
import time
import requests
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from supabase_cache import cache, get_spain_date

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Assets del portfolio — importar lista centralizada del backfill script
from backfill_historico import ASSETS, PAIR_MAPPING

MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 5  # seconds
DELAY_BETWEEN_ASSETS = 1.5  # seconds


def obtener_precio_cierre_ohlc(asset: str, fecha: date) -> float | None:
    """
    Obtiene el precio de cierre de un asset para una fecha específica
    usando la API OHLC de Kraken (velas diarias).
    """
    pair = PAIR_MAPPING.get(asset, f"{asset}EUR")

    # Pedir desde un día antes para asegurar que la vela del día solicitado está incluida
    since_timestamp = int(time.mktime((fecha - timedelta(days=1)).timetuple()))

    url = "https://api.kraken.com/0/public/OHLC"
    params = {
        'pair': pair,
        'interval': 1440,  # 24h candles
        'since': since_timestamp
    }

    response = requests.get(url, params=params, timeout=15)
    response.raise_for_status()

    data = response.json()

    if data.get('error'):
        logger.error(f"Kraken API error for {asset}: {data['error']}")
        return None

    if 'result' not in data or not data['result']:
        return None

    # Extraer datos del par (ignorar key 'last')
    pair_data = None
    for key, value in data['result'].items():
        if key != 'last':
            pair_data = value
            break

    if not pair_data:
        return None

    # Buscar la vela que corresponde a la fecha solicitada
    for ohlc in pair_data:
        timestamp = int(ohlc[0])
        fecha_ohlc = date.fromtimestamp(timestamp)
        if fecha_ohlc == fecha:
            return float(ohlc[4])  # Close price

    logger.warning(f"No OHLC candle found for {asset} on {fecha}")
    return None


def obtener_precio_con_reintentos(asset: str, fecha: date) -> float | None:
    """Obtiene precio con reintentos y backoff exponencial."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            precio = obtener_precio_cierre_ohlc(asset, fecha)
            if precio is not None:
                return precio
            logger.warning(f"Attempt {attempt}/{MAX_RETRIES}: No price for {asset} on {fecha}")
        except requests.exceptions.RequestException as e:
            logger.warning(f"Attempt {attempt}/{MAX_RETRIES}: Request error for {asset}: {e}")
        except Exception as e:
            logger.error(f"Attempt {attempt}/{MAX_RETRIES}: Unexpected error for {asset}: {e}")

        if attempt < MAX_RETRIES:
            wait = RETRY_BACKOFF_BASE * (2 ** (attempt - 1))
            logger.info(f"Retrying in {wait}s...")
            time.sleep(wait)

    logger.error(f"All {MAX_RETRIES} attempts failed for {asset} on {fecha}")
    return None


def main():
    """Actualiza precios históricos SOLO del día anterior."""
    ayer = get_spain_date() - timedelta(days=1)
    hoy = get_spain_date()

    logger.info(f"[CRON] Daily price update for {ayer}")
    logger.info(f"Assets: {len(ASSETS)} — Method: OHLC close price")

    if ayer >= hoy:
        logger.error(f"Date error: yesterday ({ayer}) >= today ({hoy})")
        return 1

    resultados = {}

    for i, asset in enumerate(ASSETS):
        # Check if already cached
        precio_existente = cache.obtener_precio_cache(asset, ayer)
        if precio_existente is not None:
            logger.info(f"[SKIP] {asset} = {precio_existente}€ ({ayer}) — already cached")
            resultados[asset] = True
            continue

        # Fetch with retries
        precio = obtener_precio_con_reintentos(asset, ayer)
        if precio is not None:
            cache.guardar_precio_cache(asset, precio, ayer, force_historico=True)
            logger.info(f"[OK] {asset} = {precio}€ ({ayer})")
            resultados[asset] = True
        else:
            logger.error(f"[FAIL] {asset} — no price obtained for {ayer}")
            resultados[asset] = False

        # Delay between assets to avoid rate limiting
        if i < len(ASSETS) - 1:
            time.sleep(DELAY_BETWEEN_ASSETS)

    # Summary
    exitosos = sum(resultados.values())
    fallidos = len(ASSETS) - exitosos

    logger.info(f"[CRON] Completed: {exitosos}/{len(ASSETS)} OK, {fallidos} failed")

    if fallidos > 0:
        assets_fallidos = [a for a, ok in resultados.items() if not ok]
        logger.error(f"Failed assets: {', '.join(assets_fallidos)}")
        return 1

    return 0


if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)
