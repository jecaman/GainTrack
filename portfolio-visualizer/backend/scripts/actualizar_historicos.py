#!/usr/bin/env python3
"""
Script para actualizar precios históricos del día anterior
Debe ejecutarse diariamente a primera hora (ej: 01:00 AM)
SOLO actualiza el día anterior, diseñado para cron job
"""
import logging
import sys
import os
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from supabase_cache import cache, get_spain_date

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lista de assets que trackeas en tu portfolio
ASSETS = [
    "XXBT",    # BTC
    "XETH",    # ETH
    "SOL",     # SOL
    "XRP",     # XRP
    "LINK",    # LINK
    "HBAR",    # HBAR
    "TRUMP",   # TRUMP
    "ADA",     # Cardano
    "DOT",     # Polkadot
    "AVAX",    # Avalanche
    "POL",     # Polygon (ex-MATIC)
    "XDG",     # Dogecoin (DOGE)
    "ATOM",    # Cosmos
    "UNI"      # Uniswap
]

def main():
    """Actualiza precios históricos SOLO del día anterior"""
    ayer = get_spain_date() - timedelta(days=1)
    hoy = get_spain_date()
    
    logger.info(f"🚀 [CRON JOB] Actualización diaria para {ayer}")
    logger.info(f"📊 Assets a actualizar: {len(ASSETS)} ({', '.join(ASSETS)})")
    logger.info(f"🛡️ Protección: NO tocar día actual ({hoy})")
    
    # Verificar que no estamos tocando el día actual
    if ayer >= hoy:
        logger.error(f"🚨 ERROR: Día anterior ({ayer}) no puede ser hoy o futuro")
        logger.error("   Problema con timezone o configuración del sistema")
        return 1
    
    # Ejecutar actualización SOLO para ayer
    resultados = cache.actualizar_precios_historicos(ASSETS, ayer)
    
    # Resumen final
    exitosos = sum(resultados.values())
    fallidos = len(ASSETS) - exitosos
    
    logger.info(f"✅ [CRON JOB] Actualización completada:")
    logger.info(f"   📅 Fecha: {ayer}")
    logger.info(f"   ✅ Exitosos: {exitosos}/{len(ASSETS)}")
    logger.info(f"   ❌ Fallidos: {fallidos}")
    
    if fallidos > 0:
        assets_fallidos = [asset for asset, ok in resultados.items() if not ok]
        logger.warning(f"❌ Assets fallidos: {', '.join(assets_fallidos)}")
        logger.warning("   Revisar logs para más detalles")
        return 1
    
    logger.info(f"🎉 [CRON JOB] Todos los precios del día anterior actualizados correctamente")
    return 0

if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)