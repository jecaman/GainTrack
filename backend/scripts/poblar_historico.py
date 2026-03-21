#!/usr/bin/env python3
"""
Script para poblar datos históricos en Supabase
Obtiene precios históricos de Kraken API para los últimos N días
"""
import logging
import sys
import os
import time
from datetime import date, timedelta
from typing import List, Dict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from supabase_cache import cache, get_spain_date
import requests

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Assets — importar lista centralizada del backfill script
from backfill_historico import ASSETS, PAIR_MAPPING

def obtener_precio_historico_kraken(asset: str, fecha: date) -> float:
    """
    Obtiene precio histórico de un asset para una fecha específica
    Usa la API de Kraken para obtener el precio de cierre del día
    """
    try:
        pair = PAIR_MAPPING.get(asset, f"{asset}EUR")
        
        # Convertir fecha a timestamp Unix (inicio y fin del día)
        inicio_dia = int(time.mktime(fecha.timetuple()))
        fin_dia = inicio_dia + 86400  # +24 horas
        
        # API de Kraken para datos OHLC (diarios)
        url = f"https://api.kraken.com/0/public/OHLC"
        params = {
            'pair': pair,
            'interval': 1440,  # 1440 minutos = 24 horas (datos diarios)
            'since': inicio_dia
        }
        
        response = requests.get(url, params=params, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            if 'result' in data and data['result']:
                # Obtener datos del par
                pair_data = None
                for key, value in data['result'].items():
                    if key != 'last':  # 'last' es metadata
                        pair_data = value
                        break
                
                if pair_data:
                    # Buscar el precio de cierre para la fecha específica
                    for ohlc in pair_data:
                        timestamp = int(ohlc[0])
                        fecha_ohlc = date.fromtimestamp(timestamp)
                        
                        if fecha_ohlc == fecha:
                            precio_cierre = float(ohlc[4])  # Índice 4 = Close price
                            logger.info(f"Histórico {asset} ({fecha}): {precio_cierre}€")
                            return precio_cierre
                    
                    # Si no encontramos fecha exacta, usar el más cercano
                    if pair_data:
                        precio_cierre = float(pair_data[0][4])  # Primer resultado disponible
                        logger.warning(f"Fecha exacta no encontrada para {asset} ({fecha}), usando precio más cercano: {precio_cierre}€")
                        return precio_cierre
        
        logger.error(f"No se pudo obtener precio histórico para {asset} en {fecha}")
        return None
        
    except Exception as e:
        logger.error(f"Error obteniendo precio histórico de {asset} para {fecha}: {e}")
        return None

def poblar_semana_historica(dias: int = 7):
    """
    Pobla datos históricos para los últimos N días
    """
    logger.info(f"🚀 Iniciando población de datos históricos para últimos {dias} días")
    logger.info(f"📊 Assets a procesar: {len(ASSETS)} ({', '.join(ASSETS)})")
    
    hoy = get_spain_date()
    total_procesados = 0
    total_exitosos = 0
    errores = []
    
    # Procesar cada día (desde hace N días hasta ayer)
    for i in range(dias, 0, -1):  # dias, dias-1, ..., 1
        fecha_objetivo = hoy - timedelta(days=i)
        
        logger.info(f"📅 Procesando fecha: {fecha_objetivo}")
        
        for asset in ASSETS:
            try:
                # Verificar si ya existe
                precio_existente = cache.obtener_precio_cache(asset, fecha_objetivo)
                if precio_existente is not None:
                    logger.info(f"  ✅ {asset}: Ya existe ({precio_existente}€)")
                    total_procesados += 1
                    total_exitosos += 1
                    continue
                
                # Obtener precio histórico
                precio = obtener_precio_historico_kraken(asset, fecha_objetivo)
                if precio is not None:
                    # Guardarlo en cache
                    cache.guardar_precio_cache(asset, precio, fecha_objetivo)
                    total_procesados += 1
                    total_exitosos += 1
                    logger.info(f"  💾 {asset}: Guardado ({precio}€)")
                else:
                    total_procesados += 1
                    errores.append(f"{asset} - {fecha_objetivo}")
                    logger.error(f"  ❌ {asset}: Error obteniendo precio")
                
                # Pequeña pausa para no saturar la API
                time.sleep(0.5)
                
            except Exception as e:
                total_procesados += 1
                errores.append(f"{asset} - {fecha_objetivo}: {str(e)}")
                logger.error(f"  ❌ {asset}: Excepción - {e}")
    
    # Resumen final
    logger.info(f"\n📊 RESUMEN FINAL:")
    logger.info(f"  • Total procesados: {total_procesados}")
    logger.info(f"  • Exitosos: {total_exitosos}")
    logger.info(f"  • Errores: {len(errores)}")
    
    if errores:
        logger.warning(f"\n❌ ERRORES ENCONTRADOS:")
        for error in errores:
            logger.warning(f"  - {error}")
    
    logger.info(f"🎉 Población de datos históricos completada")
    return total_exitosos, len(errores)

if __name__ == "__main__":
    print("🧪 Iniciando población de datos históricos...")
    exitosos, errores = poblar_semana_historica(7)  # Última semana
    
    if errores == 0:
        print(f"✅ Todos los datos poblados correctamente ({exitosos} registros)")
        exit(0)
    else:
        print(f"⚠️ Completado con {errores} errores ({exitosos} exitosos)")
        exit(1)