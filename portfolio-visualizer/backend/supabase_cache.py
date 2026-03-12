"""
Sistema de cache híbrido con Supabase para Portfolio Visualizer
"""
import os
from datetime import datetime, date
from typing import Dict, List, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import requests
import logging
import pytz

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()

# Timezone para España (UTC+2 en verano, UTC+1 en invierno)
SPAIN_TZ = pytz.timezone('Europe/Madrid')

def get_spain_date() -> date:
    """Obtiene la fecha actual en timezone de España"""
    return datetime.now(SPAIN_TZ).date()

class SupabaseCache:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL y SUPABASE_KEY son requeridos en .env")
            
        self.supabase: Client = create_client(self.url, self.key)
        logger.info("Cliente Supabase inicializado")

    def obtener_precios_cache_batch(self, assets: List[str], fecha_inicio: date, fecha_fin: date) -> Dict[str, Dict[date, float]]:
        """
        Obtiene precios de múltiples assets para un rango de fechas con paginación
        Retorna: {asset: {fecha: precio}}
        """
        try:
            result = {}
            total_records = 0
            
            # Paginación para superar el límite de 1000 registros de Supabase
            page_size = 1000
            offset = 0
            
            while True:
                response = self.supabase.table("precios_cache").select("asset, fecha, precio_eur").in_("asset", assets).gte("fecha", str(fecha_inicio)).lte("fecha", str(fecha_fin)).order("fecha").range(offset, offset + page_size - 1).execute()
                
                if not response.data:
                    break
                
                # Organizar resultados por asset y fecha
                for record in response.data:
                    asset = record["asset"]
                    fecha = datetime.strptime(record["fecha"], '%Y-%m-%d').date()
                    precio = float(record["precio_eur"])
                    
                    if asset not in result:
                        result[asset] = {}
                    result[asset][fecha] = precio
                
                total_records += len(response.data)
                
                # Si recibimos menos registros que el page_size, hemos terminado
                if len(response.data) < page_size:
                    break
                    
                offset += page_size
            
            logger.info(f"Cache BATCH: {total_records} precios obtenidos para {len(assets)} assets (con paginación)")
            return result
            
        except Exception as e:
            logger.error(f"Error obteniendo precios cache batch: {e}")
            return {}

    def obtener_precio_cache(self, asset: str, fecha: date = None) -> Optional[float]:
        """Obtiene precio desde cache de Supabase"""
        try:
            if fecha is None:
                fecha = get_spain_date()
            
            response = self.supabase.table("precios_cache").select("*").eq("asset", asset).eq("fecha", str(fecha)).execute()
            
            if response.data:
                precio = float(response.data[0]["precio_eur"])
                logger.info(f"Cache HIT: {asset} = {precio}€ (fecha: {fecha})")
                return precio
            else:
                logger.info(f"Cache MISS: {asset} no encontrado para {fecha}")
                return None
                
        except Exception as e:
            logger.error(f"Error obteniendo precio cache: {e}")
            return None

    def guardar_precio_cache(self, asset: str, precio: float, fecha: date = None, force_historico: bool = False):
        """Guarda precio en cache de Supabase"""
        try:
            if fecha is None:
                fecha = get_spain_date()
            
            # 🚨 PROTECCIÓN: NO guardar precios del día actual (salvo si es forzado para históricos)
            hoy = get_spain_date()
            if fecha == hoy and not force_historico:
                logger.warning(f"🚨 BLOQUEADO: Intento de guardar precio del día actual ({fecha}) para {asset}")
                logger.warning("   Los precios de hoy deben ser tiempo real, no históricos")
                return
            
            # Timestamp con timezone Madrid para updated_at
            timestamp_madrid = datetime.now(SPAIN_TZ).isoformat()
            
            data = {
                "asset": asset,
                "precio_eur": precio,
                "fecha": str(fecha),
                "updated_at": timestamp_madrid
            }
            
            # Usar upsert para insertar o actualizar
            # Ahora que el esquema permite (asset, fecha) como clave compuesta
            response = self.supabase.table("precios_cache").upsert(data).execute()
            logger.info(f"Cache SAVE: {asset} = {precio}€ (fecha: {fecha})")
            
        except Exception as e:
            logger.error(f"Error guardando precio cache: {e}")

    def obtener_precio_kraken(self, asset: str) -> Optional[float]:
        """Obtiene precio actual desde Kraken API"""
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
                'HBAR': 'HBAREUR',
                'XRP': 'XXRPZEUR',
                'TRUMP': 'TRUMPEUR'
            }
            
            # Usar el asset tal como viene si no está en el mapeo
            pair = pair_mapping.get(asset, f"{asset}EUR")
            
            url = f"https://api.kraken.com/0/public/Ticker?pair={pair}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'result' in data and data['result']:
                    # Obtener el primer (y único) resultado
                    ticker_data = list(data['result'].values())[0]
                    precio = float(ticker_data['c'][0])  # Último precio
                    return precio
            
            logger.error(f"Error obteniendo precio de Kraken para {asset}")
            return None
            
        except Exception as e:
            logger.error(f"Error llamando Kraken API: {e}")
            return None

    def obtener_precio_hibrido(self, asset: str, fecha: date = None) -> Optional[float]:
        """
        Lógica híbrida mejorada:
        - Para HOY: Siempre Kraken API (tiempo real), NO usar cache
        - Para días ANTERIORES: Solo cache, si no existe → None
        """
        if fecha is None:
            fecha = get_spain_date()
        
        hoy = get_spain_date()
        
        # Para el día actual: SIEMPRE llamar a Kraken (tiempo real)
        if fecha == hoy:
            precio_kraken = self.obtener_precio_kraken(asset)
            if precio_kraken is not None:
                return precio_kraken
            else:
                logger.error(f"Error obteniendo precio tiempo real para {asset}")
                return None
        
        # Para días anteriores: SOLO cache (histórico)
        else:
            precio_cache = self.obtener_precio_cache(asset, fecha)
            if precio_cache is not None:
                return precio_cache
            else:
                logger.warning(f"Precio histórico NO disponible: {asset} para {fecha}")
                return None

    def obtener_precios_multiples(self, assets: List[str]) -> Dict[str, float]:
        """Obtiene precios para múltiples assets"""
        precios = {}
        
        for asset in assets:
            precio = self.obtener_precio_hibrido(asset)
            if precio is not None:
                precios[asset] = precio
        
        return precios

    def limpiar_cache_antiguo(self, dias: int = 30):
        """Limpia registros más antiguos que X días"""
        try:
            from datetime import timedelta
            fecha_limite = get_spain_date() - timedelta(days=dias)
            
            response = self.supabase.table("precios_cache").delete().lt("fecha", str(fecha_limite)).execute()
            logger.info(f"Cache limpio: eliminados registros anteriores a {fecha_limite}")
            
        except Exception as e:
            logger.error(f"Error limpiando cache: {e}")

    def actualizar_precios_historicos(self, assets: List[str], fecha: date) -> Dict[str, bool]:
        """
        Actualiza precios históricos para una fecha específica
        Usado para insertar precios del día anterior
        """
        resultados = {}
        
        logger.info(f"🔄 Actualizando precios históricos para {fecha}")
        
        for asset in assets:
            try:
                # Verificar si ya existe
                precio_existente = self.obtener_precio_cache(asset, fecha)
                if precio_existente is not None:
                    logger.info(f"Precio ya existe: {asset} = {precio_existente}€ ({fecha})")
                    resultados[asset] = True
                    continue
                
                # Obtener precio desde Kraken
                precio = self.obtener_precio_kraken(asset)
                if precio is not None:
                    self.guardar_precio_cache(asset, precio, fecha, force_historico=True)
                    resultados[asset] = True
                    logger.info(f"✅ Histórico guardado: {asset} = {precio}€ ({fecha})")
                else:
                    resultados[asset] = False
                    logger.error(f"❌ Error obteniendo precio histórico: {asset}")
                    
            except Exception as e:
                logger.error(f"Error actualizando {asset}: {e}")
                resultados[asset] = False
        
        exitosos = sum(resultados.values())
        logger.info(f"📊 Actualización histórica: {exitosos}/{len(assets)} exitosos para {fecha}")
        return resultados

    def estadisticas_cache(self) -> Dict:
        """Obtiene estadísticas del cache"""
        try:
            # Total de registros
            total = self.supabase.table("precios_cache").select("*", count="exact").execute()
            
            # Registros de hoy
            hoy = str(get_spain_date())
            hoy_count = self.supabase.table("precios_cache").select("*", count="exact").eq("fecha", hoy).execute()
            
            # Assets únicos
            assets = self.supabase.table("precios_cache").select("asset").execute()
            assets_unicos = len(set([r["asset"] for r in assets.data]))
            
            stats = {
                "total_registros": total.count,
                "registros_hoy": hoy_count.count,
                "assets_unicos": assets_unicos,
                "fecha_consulta": hoy
            }
            
            logger.info(f"Estadísticas cache: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas: {e}")
            return {}


# Instancia global del cache
cache = SupabaseCache()

# Funciones de conveniencia para usar en main.py
def obtener_precio(asset: str, fecha: date = None) -> Optional[float]:
    """Función simple para obtener precio de un asset"""
    return cache.obtener_precio_hibrido(asset, fecha)

def obtener_precios(assets: List[str]) -> Dict[str, float]:
    """Función simple para obtener precios de múltiples assets"""
    return cache.obtener_precios_multiples(assets)

def actualizar_historicos_ayer(assets: List[str]) -> Dict[str, bool]:
    """Actualiza precios históricos del día anterior"""
    from datetime import timedelta
    ayer = get_spain_date() - timedelta(days=1)
    return cache.actualizar_precios_historicos(assets, ayer)

def stats_cache() -> Dict:
    """Función simple para obtener estadísticas"""
    return cache.estadisticas_cache()

if __name__ == "__main__":
    # Test del sistema
    print("🧪 Probando sistema de cache...")
    
    # Test básico
    test_assets = ["XXBT", "XETH", "ADA"]
    precios = obtener_precios(test_assets)
    print(f"Precios obtenidos: {precios}")
    
    # Estadísticas
    stats = stats_cache()
    print(f"Estadísticas: {stats}")