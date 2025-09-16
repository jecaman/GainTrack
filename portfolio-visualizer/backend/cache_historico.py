#!/usr/bin/env python3
"""
Sistema de Cache Histórico Gratuito
Combina SQLite + JSON para máximo rendimiento sin costes
"""

import sqlite3
import json
import os
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any
import requests
import time

# Configuración
CACHE_DIR = "./cache"
DB_PATH = f"{CACHE_DIR}/precios_cache.db"
BACKUP_DIR = f"{CACHE_DIR}/daily_backup"
METADATA_PATH = f"{CACHE_DIR}/assets_metadata.json"

class CacheHistorico:
    """Sistema de cache histórico gratuito usando SQLite + JSON"""
    
    def __init__(self):
        self.ensure_cache_structure()
        self.init_database()
    
    def ensure_cache_structure(self):
        """Crear estructura de directorios si no existe"""
        os.makedirs(CACHE_DIR, exist_ok=True)
        os.makedirs(BACKUP_DIR, exist_ok=True)
    
    def init_database(self):
        """Inicializar base de datos SQLite"""
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS precios_historicos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    asset TEXT NOT NULL,
                    precio_eur REAL NOT NULL,
                    fecha DATE NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    source TEXT DEFAULT 'kraken',
                    UNIQUE(asset, fecha)
                )
            """)
            
            # Índices para consultas rápidas
            conn.execute("CREATE INDEX IF NOT EXISTS idx_asset_fecha ON precios_historicos (asset, fecha DESC)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_fecha ON precios_historicos (fecha DESC)")
            conn.commit()
    
    def get_precio_historico(self, asset: str, fecha: date) -> Optional[float]:
        """Obtener precio de un asset en una fecha específica"""
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.execute(
                "SELECT precio_eur FROM precios_historicos WHERE asset = ? AND fecha = ?",
                (asset, fecha.strftime('%Y-%m-%d'))
            )
            result = cursor.fetchone()
            return result[0] if result else None
    
    def get_precios_actuales_cache(self, assets: List[str]) -> Dict[str, float]:
        """Obtener precios más recientes del cache"""
        precios = {}
        with sqlite3.connect(DB_PATH) as conn:
            for asset in assets:
                cursor = conn.execute(
                    "SELECT precio_eur FROM precios_historicos WHERE asset = ? ORDER BY fecha DESC LIMIT 1",
                    (asset,)
                )
                result = cursor.fetchone()
                if result:
                    precios[asset] = result[0]
        return precios
    
    def actualizar_precios_diarios(self, assets: List[str]) -> Dict[str, Any]:
        """Actualizar precios diarios desde Kraken (solo si es necesario)"""
        hoy = date.today()
        
        # Verificar qué assets necesitan actualización
        assets_a_actualizar = []
        
        with sqlite3.connect(DB_PATH) as conn:
            for asset in assets:
                cursor = conn.execute(
                    "SELECT COUNT(*) FROM precios_historicos WHERE asset = ? AND fecha = ?",
                    (asset, hoy.strftime('%Y-%m-%d'))
                )
                count = cursor.fetchone()[0]
                if count == 0:
                    assets_a_actualizar.append(asset)
        
        if not assets_a_actualizar:
            print(f"✅ Cache actualizado - todos los precios disponibles para {hoy}")
            return {'updated': 0, 'cached': len(assets)}
        
        print(f"📡 Actualizando {len(assets_a_actualizar)} assets para {hoy}...")
        
        # Importar función de precios de main2.py
        from main2 import obtener_precios_de_kraken
        
        precios_nuevos = obtener_precios_de_kraken(assets_a_actualizar)
        
        # Guardar en SQLite
        updates = 0
        with sqlite3.connect(DB_PATH) as conn:
            for asset, precio in precios_nuevos.items():
                if precio > 0:  # Solo guardar precios válidos
                    conn.execute(
                        "INSERT OR REPLACE INTO precios_historicos (asset, precio_eur, fecha) VALUES (?, ?, ?)",
                        (asset, precio, hoy.strftime('%Y-%m-%d'))
                    )
                    updates += 1
            conn.commit()
        
        # Backup JSON diario
        self.backup_to_json(hoy, precios_nuevos)
        
        return {
            'updated': updates,
            'cached': len(assets) - len(assets_a_actualizar),
            'date': hoy.strftime('%Y-%m-%d')
        }
    
    def backup_to_json(self, fecha: date, precios: Dict[str, float]):
        """Crear backup JSON del día"""
        backup_file = f"{BACKUP_DIR}/{fecha.strftime('%Y-%m-%d')}.json"
        backup_data = {
            'fecha': fecha.strftime('%Y-%m-%d'),
            'timestamp': datetime.now().isoformat(),
            'precios': precios,
            'total_assets': len(precios)
        }
        
        with open(backup_file, 'w') as f:
            json.dump(backup_data, f, indent=2)
        
        print(f"💾 Backup creado: {backup_file}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas del cache"""
        with sqlite3.connect(DB_PATH) as conn:
            # Total registros
            cursor = conn.execute("SELECT COUNT(*) FROM precios_historicos")
            total_registros = cursor.fetchone()[0]
            
            # Assets únicos
            cursor = conn.execute("SELECT COUNT(DISTINCT asset) FROM precios_historicos")
            assets_unicos = cursor.fetchone()[0]
            
            # Fecha más antigua y más reciente
            cursor = conn.execute("SELECT MIN(fecha), MAX(fecha) FROM precios_historicos")
            fecha_min, fecha_max = cursor.fetchone()
            
            # Tamaño del archivo
            db_size_mb = os.path.getsize(DB_PATH) / (1024 * 1024) if os.path.exists(DB_PATH) else 0
        
        return {
            'total_registros': total_registros,
            'assets_unicos': assets_unicos,
            'fecha_inicio': fecha_min,
            'fecha_fin': fecha_max,
            'db_size_mb': round(db_size_mb, 2),
            'backup_files': len([f for f in os.listdir(BACKUP_DIR) if f.endswith('.json')]) if os.path.exists(BACKUP_DIR) else 0
        }
    
    def limpiar_datos_antiguos(self, dias_mantener: int = 365):
        """Limpiar datos más antiguos que X días (opcional)"""
        fecha_limite = date.today() - timedelta(days=dias_mantener)
        
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.execute(
                "DELETE FROM precios_historicos WHERE fecha < ?",
                (fecha_limite.strftime('%Y-%m-%d'),)
            )
            eliminados = cursor.rowcount
            conn.commit()
        
        print(f"🧹 Limpieza completada - {eliminados} registros eliminados")
        return eliminados

# Instancia global
cache_historico = CacheHistorico()

def get_precios_con_cache(assets: List[str]) -> Dict[str, float]:
    """
    Función principal - obtener precios usando cache inteligente
    
    1. Busca en cache local
    2. Si no está, actualiza desde Kraken
    3. Devuelve precios rápidamente
    """
    # Primero actualizar cache si es necesario
    stats = cache_historico.actualizar_precios_diarios(assets)
    
    # Luego obtener precios del cache
    precios = cache_historico.get_precios_actuales_cache(assets)
    
    print(f"⚡ Cache usado - {stats['cached']} cached, {stats['updated']} actualizados")
    
    return precios

if __name__ == "__main__":
    # Test del sistema
    print("🧪 Testing Cache Histórico...")
    
    test_assets = ['BTC', 'ETH', 'ADA']
    
    # Test 1: Obtener precios
    start_time = time.time()
    precios = get_precios_con_cache(test_assets)
    tiempo_total = time.time() - start_time
    
    print(f"⏱️ Tiempo total: {tiempo_total:.3f}s")
    print(f"📊 Precios obtenidos: {precios}")
    
    # Test 2: Estadísticas
    stats = cache_historico.get_stats()
    print(f"📈 Estadísticas del cache: {stats}")
    
    # Test 3: Segunda consulta (debería ser instantánea)
    start_time = time.time()
    precios_2 = get_precios_con_cache(test_assets)
    tiempo_2 = time.time() - start_time
    
    print(f"⚡ Segunda consulta: {tiempo_2:.3f}s (cache hit)")