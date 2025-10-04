#!/usr/bin/env python3
"""
Script para recarga histórica con parámetros personalizables
Uso: python3 recarga_historica.py [fecha_inicio] [fecha_fin] [asset]

Parámetros:
- fecha_inicio: Fecha de inicio en formato YYYY-MM-DD (incluida)
- fecha_fin: Fecha de fin en formato YYYY-MM-DD (NO incluida)
- asset: Asset específico (opcional, si no se especifica usa todos los de la BD)

Ejemplos:
- python3 recarga_historica.py 2025-09-14 2025-09-21 XXBT
- python3 recarga_historica.py 2025-09-14 2025-09-21
- python3 recarga_historica.py 2025-09-15 2025-09-20 SOL
"""
import logging
import sys
import time
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict
from supabase_cache import cache, get_spain_date

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def obtener_assets_existentes() -> List[str]:
    """Obtiene todos los assets únicos que existen en la base de datos"""
    try:
        response = cache.supabase.table("precios_cache").select("asset").execute()
        assets = list(set([r["asset"] for r in response.data]))
        return sorted(assets)
    except Exception as e:
        logger.error(f"Error obteniendo assets existentes: {e}")
        return []

def borrar_datos_rango(asset: str, fecha_inicio: date, fecha_fin: date) -> int:
    """
    Borra datos históricos de un asset entre fechas
    fecha_inicio: incluida
    fecha_fin: NO incluida
    Retorna: número de registros borrados
    """
    try:
        # Protección: NO tocar el día actual
        hoy = get_spain_date()
        if fecha_inicio <= hoy < fecha_fin:
            logger.error(f"🚨 ERROR: El rango {fecha_inicio} a {fecha_fin} incluye el día actual ({hoy})")
            logger.error("   No se puede tocar el día actual desde recarga histórica")
            return 0
        
        # Construir consulta de borrado
        query = cache.supabase.table("precios_cache").delete()
        query = query.eq("asset", asset)
        query = query.gte("fecha", str(fecha_inicio))
        query = query.lt("fecha", str(fecha_fin))
        
        response = query.execute()
        
        # Contar registros borrados (PostgreSQL devuelve los registros borrados)
        registros_borrados = len(response.data) if response.data else 0
        
        if registros_borrados > 0:
            logger.info(f"🗑️ Borrados {registros_borrados} registros de {asset} entre {fecha_inicio} y {fecha_fin}")
        else:
            logger.info(f"ℹ️ No había registros de {asset} entre {fecha_inicio} y {fecha_fin}")
        
        return registros_borrados
        
    except Exception as e:
        logger.error(f"Error borrando datos de {asset}: {e}")
        return 0

def obtener_precios_rango_kraken(asset: str, fecha_inicio: date, fecha_fin: date) -> Dict[date, float]:
    """
    Obtiene precios históricos de Kraken para un rango completo de fechas
    Patrón basado en main.py - más eficiente que llamadas individuales
    """
    try:
        # Mapeo de assets a pares de Kraken
        pair_mapping = {
            'XXBT': 'XXBTZEUR',
            'XETH': 'XETHZEUR', 
            'ADA': 'ADAEUR',
            'SOL': 'SOLEUR',
            'DOT': 'DOTEUR',
            'MATIC': 'MATICEUR',
            'LINK': 'LINKEUR',
            'UNI': 'UNIEUR',
            'AAVE': 'AAVEEUR',
            'ATOM': 'ATOMEUR',
            'XRP': 'XXRPZEUR',
            'HBAR': 'HBAREUR',
            'TRUMP': 'TRUMPEUR'
        }
        
        pair = pair_mapping.get(asset, f"{asset}EUR")
        
        # Convertir fecha_inicio a timestamp Unix
        inicio_timestamp = int(time.mktime(fecha_inicio.timetuple()))
        
        logger.info(f"📡 Obteniendo OHLC para {asset} rango {fecha_inicio} a {fecha_fin} usando par: {pair}")
        
        # API de Kraken para datos OHLC (UNA SOLA LLAMADA PARA TODO EL RANGO)
        url = f"https://api.kraken.com/0/public/OHLC"
        params = {
            'pair': pair,
            'interval': 1440,  # 1440 minutos = 24 horas
            'since': inicio_timestamp
        }
        
        import requests
        response = requests.get(url, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if 'result' in data and data['result']:
                # Obtener datos del par
                pair_data = None
                for key, value in data['result'].items():
                    if key != 'last':
                        pair_data = value
                        break
                
                if pair_data:
                    # Procesar TODOS los datos del rango
                    precios_diarios = {}
                    for ohlc in pair_data:
                        timestamp = int(ohlc[0])
                        fecha_ohlc = date.fromtimestamp(timestamp)
                        precio_cierre = float(ohlc[4])  # Close price
                        
                        # Solo incluir fechas dentro del rango solicitado
                        if fecha_inicio <= fecha_ohlc <= fecha_fin:
                            precios_diarios[fecha_ohlc] = precio_cierre
                    
                    logger.info(f"✅ {asset}: {len(precios_diarios)} precios obtenidos para rango")
                    if precios_diarios:
                        primera_fecha = min(precios_diarios.keys())
                        ultima_fecha = max(precios_diarios.keys())
                        logger.info(f"   📅 Rango real: {primera_fecha} → {ultima_fecha}")
                    
                    return precios_diarios
        
        logger.error(f"❌ No se pudieron obtener datos OHLC para {asset}")
        return {}
        
    except Exception as e:
        logger.error(f"Error obteniendo precios históricos de {asset} para rango {fecha_inicio}-{fecha_fin}: {e}")
        return {}

def recarga_historica(fecha_inicio: date, fecha_fin: date, asset: Optional[str] = None):
    """
    Función principal de recarga histórica
    """
    hoy = get_spain_date()
    
    # Validaciones de seguridad
    if fecha_inicio >= fecha_fin:
        logger.error(f"🚨 ERROR: fecha_inicio ({fecha_inicio}) debe ser anterior a fecha_fin ({fecha_fin})")
        return False
    
    if fecha_inicio >= hoy:
        logger.error(f"🚨 ERROR: fecha_inicio ({fecha_inicio}) no puede ser hoy o futuro ({hoy})")
        return False
    
    if fecha_fin > hoy:
        logger.warning(f"⚠️ AJUSTE: fecha_fin ({fecha_fin}) ajustada a hoy ({hoy}) para evitar tocar día actual")
        fecha_fin = hoy
    
    # Determinar assets a procesar
    if asset:
        assets_procesar = [asset]
        logger.info(f"🎯 Asset específico: {asset}")
    else:
        assets_procesar = obtener_assets_existentes()
        if not assets_procesar:
            logger.error("❌ No se encontraron assets en la base de datos")
            return False
        logger.info(f"📊 Todos los assets de la BD: {len(assets_procesar)} ({', '.join(assets_procesar)})")
    
    logger.info(f"📅 Rango de fechas: {fecha_inicio} hasta {fecha_fin} (no incluida)")
    logger.info(f"📆 Total días a procesar: {(fecha_fin - fecha_inicio).days}")
    
    # FASE 1: BORRADO
    logger.info(f"\n🗑️ FASE 1: BORRADO DE DATOS EXISTENTES")
    total_borrados = 0
    for asset_actual in assets_procesar:
        borrados = borrar_datos_rango(asset_actual, fecha_inicio, fecha_fin)
        total_borrados += borrados
    
    logger.info(f"📊 Total registros borrados: {total_borrados}")
    
    # FASE 2: RECARGA (MÉTODO EFICIENTE POR ASSET)
    logger.info(f"\n💾 FASE 2: RECARGA DE DATOS HISTÓRICOS")
    total_procesados = 0
    total_exitosos = 0
    errores = []
    
    # Procesar cada asset obteniendo todo su rango de una vez
    for asset_actual in assets_procesar:
        logger.info(f"🔄 Procesando {asset_actual} para rango completo...")
        
        try:
            # Obtener TODOS los precios del rango de una vez
            precios_rango = obtener_precios_rango_kraken(asset_actual, fecha_inicio, fecha_fin)
            
            if precios_rango:
                # Guardar todos los precios en la base de datos
                for fecha_precio, precio in precios_rango.items():
                    try:
                        cache.guardar_precio_cache(asset_actual, precio, fecha_precio, force_historico=True)
                        total_exitosos += 1
                        total_procesados += 1
                    except Exception as e:
                        errores.append(f"{asset_actual} - {fecha_precio}: {str(e)}")
                        total_procesados += 1
                        logger.error(f"  ❌ Error guardando {asset_actual} {fecha_precio}: {e}")
                
                logger.info(f"  ✅ {asset_actual}: {len(precios_rango)} precios guardados")
            else:
                logger.error(f"  ❌ {asset_actual}: No se obtuvieron precios")
                errores.append(f"{asset_actual} - rango completo")
            
            # Pausa entre assets para no saturar API
            time.sleep(1.0)
            
        except Exception as e:
            logger.error(f"  ❌ {asset_actual}: Excepción en rango completo - {e}")
            errores.append(f"{asset_actual} - excepción: {str(e)}")
    
    # RESUMEN FINAL
    logger.info(f"\n📊 RESUMEN FINAL:")
    logger.info(f"  • Registros borrados: {total_borrados}")
    logger.info(f"  • Registros procesados: {total_procesados}")
    logger.info(f"  • Exitosos: {total_exitosos}")
    logger.info(f"  • Errores: {len(errores)}")
    
    if errores:
        logger.warning(f"\n❌ ERRORES ENCONTRADOS:")
        for error in errores[:10]:  # Mostrar solo primeros 10
            logger.warning(f"  - {error}")
        if len(errores) > 10:
            logger.warning(f"  ... y {len(errores) - 10} errores más")
    
    exito = len(errores) == 0
    logger.info(f"🎉 Recarga histórica {'COMPLETADA' if exito else 'COMPLETADA CON ERRORES'}")
    return exito

def main():
    """Función principal con parsing de argumentos"""
    if len(sys.argv) < 3:
        print("❌ Uso: python3 recarga_historica.py <fecha_inicio> <fecha_fin> [asset]")
        print("")
        print("Parámetros:")
        print("  fecha_inicio: YYYY-MM-DD (incluida)")
        print("  fecha_fin: YYYY-MM-DD (NO incluida)")
        print("  asset: Asset específico (opcional)")
        print("")
        print("Ejemplos:")
        print("  python3 recarga_historica.py 2025-09-14 2025-09-21 XXBT")
        print("  python3 recarga_historica.py 2025-09-14 2025-09-21")
        sys.exit(1)
    
    try:
        # Parsear fechas
        fecha_inicio_str = sys.argv[1]
        fecha_fin_str = sys.argv[2]
        asset = sys.argv[3] if len(sys.argv) > 3 else None
        
        fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
        fecha_fin = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
        
        logger.info(f"🚀 Iniciando recarga histórica")
        logger.info(f"📅 Rango: {fecha_inicio} hasta {fecha_fin}")
        logger.info(f"🎯 Asset: {asset or 'TODOS'}")
        
        exito = recarga_historica(fecha_inicio, fecha_fin, asset)
        
        sys.exit(0 if exito else 1)
        
    except ValueError as e:
        print(f"❌ Error en formato de fecha: {e}")
        print("Formato correcto: YYYY-MM-DD")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()