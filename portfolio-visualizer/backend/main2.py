#!/usr/bin/env python3
"""
Main2.py - Servidor Portfolio Visualizer v2
Basado en main.py pero usando lógica modular del cost_calculator
"""

import pandas as pd
import time
import asyncio
import requests
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any, Union
import io
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware

# Importar sistema de cache híbrido
from supabase_cache import obtener_precios, obtener_precio, stats_cache, get_spain_date

# Importar funciones de obtención de precios del main.py original
try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False


# Activos fiat
FIAT_ASSETS = {'USD', 'EUR', 'GBP', 'CAD'}

# Cache para pares encontrados (optimización)
DYNAMIC_PAIR_CACHE = {}

# Cache global para pares de Kraken (se llena una vez por sesión)
ALL_KRAKEN_PAIRS_CACHE = {}

# Mapeo base conocido de assets para Kraken (algunos assets tienen nombres diferentes)
KNOWN_ASSET_MAPPING_KRAKEN = {
    'BTC': 'XXBT',  # Bitcoin se llama XXBT en Kraken
    'ETH': 'XETH',  # Ethereum se llama XETH en Kraken
    # Otros assets que sabemos que tienen mapeo especial se pueden añadir aquí
}

# Cache dinámico para mapeos descubiertos automáticamente
DYNAMIC_ASSET_MAPPING_CACHE = {}

def get_dynamic_asset_mapping(trades_df):
    """
    Descubre automáticamente el mapeo de assets basándose en los datos del CSV
    y la API de Kraken
    """
    # Obtener todos los assets únicos del CSV
    if 'pair' in trades_df.columns:
        assets_in_csv = set()
        for pair in trades_df['pair'].unique():
            if '/' in pair:
                base_asset = pair.split('/')[0]
                assets_in_csv.add(base_asset)
        
        # Crear mapeo dinámico
        dynamic_mapping = {}
        for asset in assets_in_csv:
            # Usar mapeo conocido si existe
            if asset in KNOWN_ASSET_MAPPING_KRAKEN:
                dynamic_mapping[asset] = KNOWN_ASSET_MAPPING_KRAKEN[asset]
            else:
                # Para assets desconocidos, asumir que el nombre es igual
                # En una implementación más avanzada, aquí consultarías la API de Kraken
                dynamic_mapping[asset] = asset
                
        return dynamic_mapping
    
    # Fallback al mapeo conocido
    return KNOWN_ASSET_MAPPING_KRAKEN.copy()

# Se inicializa dinámicamente por cada request
ASSET_MAPPING_KRAKEN = KNOWN_ASSET_MAPPING_KRAKEN.copy()

# =============================================================================
# FUNCIONES DE OBTENCIÓN DE PRECIOS (del main.py original)
# =============================================================================

def get_all_kraken_asset_pairs():
    """
    Obtiene TODOS los pares de trading disponibles en Kraken usando la API oficial
    """
    global ALL_KRAKEN_PAIRS_CACHE
    
    if ALL_KRAKEN_PAIRS_CACHE:
        return ALL_KRAKEN_PAIRS_CACHE
    
    try:
        print("📡 Obteniendo lista completa de pares de Kraken...")
        url = "https://api.kraken.com/0/public/AssetPairs"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if 'result' in data and not data.get('error'):
            ALL_KRAKEN_PAIRS_CACHE = data['result']
            print(f"✅ Cargados {len(ALL_KRAKEN_PAIRS_CACHE)} pares de Kraken")
            return ALL_KRAKEN_PAIRS_CACHE
        else:
            print(f"❌ Error obteniendo pares: {data.get('error', 'Unknown error')}")
            return {}
            
    except Exception as e:
        print(f"❌ Error conectando con Kraken AssetPairs API: {e}")
        return {}

def find_asset_eur_pair(asset):
    """
    Busca el par EUR de un asset usando la API oficial de Kraken
    """
    if asset in DYNAMIC_PAIR_CACHE:
        return DYNAMIC_PAIR_CACHE[asset]
    
    # Aplicar mapeo especial si existe (ej: BTC -> XBT)
    kraken_asset = ASSET_MAPPING_KRAKEN.get(asset, asset)
    if asset != kraken_asset:
        print(f"🔄 Mapeo {asset} -> {kraken_asset}")
    
    # Obtener todos los pares disponibles
    all_pairs = get_all_kraken_asset_pairs()
    if not all_pairs:
        print(f"❌ No se pudo obtener lista de pares de Kraken")
        return None
    
    # Buscar par EUR para el asset
    eur_pairs_found = []
    
    for pair_name, pair_info in all_pairs.items():
        # Verificar si es un par EUR
        if pair_info.get('quote') == 'ZEUR' or pair_info.get('quote') == 'EUR':
            # Verificar si el asset base coincide
            base_asset = pair_info.get('base', '')
            
            # Comparar con diferentes variaciones del asset
            asset_variations = [
                kraken_asset,
                f"X{kraken_asset}",
                f"Z{kraken_asset}",
                f"XX{kraken_asset}",
            ]
            
            if base_asset in asset_variations:
                eur_pairs_found.append({
                    'pair_name': pair_name,
                    'altname': pair_info.get('altname', pair_name),
                    'base': base_asset,
                    'quote': pair_info.get('quote')
                })
    
    if eur_pairs_found:
        # Preferir el par con altname más simple si hay múltiples
        best_pair = min(eur_pairs_found, key=lambda x: len(x['altname']))
        pair_name = best_pair['pair_name']
        altname = best_pair['altname']
        
        DYNAMIC_PAIR_CACHE[asset] = pair_name
        print(f"✅ Par EUR encontrado para {asset}: {pair_name} (altname: {altname})")
        return pair_name
    else:
        print(f"❌ No se encontró par EUR para {asset}")
        return None

async def get_single_asset_price_async(session, asset):
    """Obtiene precio de un solo asset de forma asíncrona"""
    if asset in FIAT_ASSETS:
        return asset, 1.0
    
    # Buscar par EUR usando la nueva función
    kraken_pair = find_asset_eur_pair(asset)
    if not kraken_pair:
        return asset, 0.0
    
    try:
        url = f"https://api.kraken.com/0/public/Ticker?pair={kraken_pair}"
        
        async with session.get(url, timeout=10) as response:
            data = await response.json()
            
            if 'result' in data and data['result']:
                # La respuesta de Kraken puede tener el nombre del par ligeramente diferente
                pair_data = next(iter(data['result'].values()))
                price = float(pair_data['c'][0])  # Precio de cierre actual
                return asset, price
            else:
                return asset, 0.0
                
    except Exception as e:
        print(f"❌ Error obteniendo precio para {asset}: {e}")
        return asset, 0.0

async def get_public_kraken_prices_from_pairs_async(assets):
    """Obtiene precios actuales de forma asíncrona"""
    if not assets:
        return {}
    
    print(f"📡 Iniciando obtención de precios para {len(assets)} assets...")
    
    async with aiohttp.ClientSession() as session:
        tasks = [get_single_asset_price_async(session, asset) for asset in assets]
        results = await asyncio.gather(*tasks)
        return dict(results)

def get_public_kraken_prices_from_pairs_sync(assets):
    """Obtiene precios actuales de forma síncrona (del main.py original)"""
    if not assets:
        return {}
    
    try:
        prices = {}
        
        for asset in assets:
            if asset in FIAT_ASSETS:
                prices[asset] = 1.0
                continue
            
            # Buscar par EUR usando la nueva función
            kraken_pair = find_asset_eur_pair(asset)
            
            try:
                time.sleep(0.2)  # Rate limiting
                
                url = f"https://api.kraken.com/0/public/Ticker?pair={kraken_pair}"
                response = requests.get(url, timeout=10)
                data = response.json()
                
                if 'result' in data and data['result']:
                    # La respuesta de Kraken puede tener el nombre del par ligeramente diferente
                    pair_data = next(iter(data['result'].values()))
                    price = float(pair_data['c'][0])  # Precio de cierre actual
                    prices[asset] = price
                else:
                    prices[asset] = 0.0
                    
            except Exception as e:
                print(f"❌ Error obteniendo precio para {asset}: {e}")
                prices[asset] = 0.0
        
        return prices
        
    except Exception as e:
        print(f"❌ Error en get_public_kraken_prices_from_pairs_sync: {e}")
        return {}

async def get_public_kraken_prices_from_pairs_async(assets):
    """Obtiene precios actuales usando pares específicos - VERSION ASYNC (del main.py original)"""
    if not assets:
        return {}
    
    try:
        # Crear semáforo para rate limiting (máximo 4 requests concurrentes)
        semaphore = asyncio.Semaphore(4)
        
        async def rate_limited_request(session, asset):
            async with semaphore:
                # Small delay for rate limiting
                await asyncio.sleep(0.1)
                return await get_single_asset_price_async(session, asset)
        
        async with aiohttp.ClientSession() as session:
            # Crear tasks para todos los assets
            tasks = []
            for asset in assets:
                task = rate_limited_request(session, asset)
                tasks.append(task)
            
            # Ejecutar todas las requests en paralelo
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Procesar resultados
            prices = {}
            for result in results:
                if isinstance(result, Exception):
                    print(f"❌ Exception en request paralelo: {result}")
                    continue
                
                asset, price = result
                prices[asset] = price
            
            return prices
        
    except Exception as e:
        print(f"❌ Error en get_public_kraken_prices_from_pairs_async: {e}")
        return {}

def obtener_precios_de_kraken(assets: List[str]) -> Dict[str, float]:
    """
    Función principal usando sistema de cache híbrido Supabase
    Cache primero, Kraken API como fallback
    """
    start_time = time.time()
    try:
        print(f"🚀 [CACHE HÍBRIDO] Obteniendo precios para {len(assets)} assets...")
        
        # Usar el sistema de cache híbrido
        result = obtener_precios(assets)
        
        total_time = time.time() - start_time
        successful_prices = len([p for p in result.values() if p > 0])
        
        # Mostrar estadísticas de cache
        cache_stats = stats_cache()
        cache_hits = len(result) - len([a for a in assets if a not in result])
        
        print(f"⚡ [CACHE] Hits: {cache_hits}/{len(assets)} | BD registros: {cache_stats.get('total_registros', 0)}")
        print(f"⏱️ TIMING - Precios obtenidos: {total_time:.3f}s ({successful_prices}/{len(assets)} exitosos)")
        
        return result
        
    except Exception as e:
        print(f"❌ Error obteniendo precios (fallback a cache local): {e}")
        # Fallback al sistema anterior si falla Supabase
        return obtener_precios_fallback(assets)

def obtener_precios_fallback(assets: List[str]) -> Dict[str, float]:
    """Función de fallback usando el sistema original si falla Supabase"""
    try:
        if AIOHTTP_AVAILABLE:
            try:
                loop = asyncio.get_running_loop()
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(asyncio.run, get_public_kraken_prices_from_pairs_async(assets))
                    return future.result()
            except RuntimeError:
                return asyncio.run(get_public_kraken_prices_from_pairs_async(assets))
        else:
            return get_public_kraken_prices_from_pairs_sync(assets)
    except Exception as e:
        print(f"❌ Error en fallback: {e}")
        return {asset: 0.0 for asset in assets}

# =============================================================================
# FUNCIÓN MODULAR 1: PORTFOLIO VALUE
# =============================================================================

def extraer_activo_de_par(par):
    """
    Extrae el activo base del par de trading
    """
    if not par or pd.isna(par):
        return 'UNKNOWN'
    
    par = str(par).strip()
    
    # Casos especiales conocidos
    if par == 'ZUSD':
        return 'USD'
    if par == 'ZEUR':
        return 'EUR'
    
    # Lógica para extraer activo
    asset = par.replace('ZEUR', '').replace('EUR', '').replace('USD', '').replace('GBP', '').replace('CAD', '').rstrip('/')
    
    # Si el asset queda vacío después de las sustituciones
    if not asset or asset == '':
        if 'USD' in par:
            return 'USD'
        elif 'EUR' in par:
            return 'EUR'
        elif 'GBP' in par:
            return 'GBP'
        elif 'CAD' in par:
            return 'CAD'
        else:
            return f'UNKNOWN_{par}'
    
    # Si no cambió nada, devolver el par original
    if asset == par:
        return par
        
    return asset

def calcular_portfolio_value(
    trades_df: pd.DataFrame,
    cryptos_filter: Optional[List[str]] = None,
    fecha_inicio: Optional[Union[str, date]] = None,
    fecha_fin: Optional[Union[str, date]] = None,
    precios_actuales: Optional[Dict[str, float]] = None,
    obtener_precios_externos: bool = True,
    excluded_operations: Optional[set] = None
) -> Dict[str, Any]:
    """
    Calcula Portfolio Value modular con parámetros flexibles
    
    Args:
        trades_df: DataFrame con los trades
        cryptos_filter: Lista de cryptos a incluir (None = todas)
        fecha_inicio: Fecha inicio para filtrar trades (None = desde el principio)
        fecha_fin: Fecha fin para filtrar trades (None = hasta el final)
        precios_actuales: Dict con precios actuales {asset: precio} (None = obtener de API)
        obtener_precios_externos: Si True, obtiene precios de API externa si no están en precios_actuales
    
    Returns:
        Dict con resultados por asset y totales:
        {
            'assets': {
                'BTC': {
                    'cantidad_actual': 0.5,
                    'precio_actual': 98556,
                    'portfolio_value': 49278
                },
                ...
            },
            'totales': {
                'total_portfolio_value': 123456,
                'total_cantidad_assets': 5,
                'assets_con_balance': ['BTC', 'ETH', ...]
            },
            'metadata': {
                'trades_procesados': 150,
                'fecha_inicio_real': '2023-01-01',
                'fecha_fin_real': '2024-01-01',
                'precios_obtenidos_de': 'externos|parametros|mixto'
            }
        }
    """
    start_time = time.time()
    
    # 1. VALIDACIÓN Y PREPARACIÓN
    if trades_df.empty:
        return {
            'assets': {},
            'totales': {'total_portfolio_value': 0, 'total_cantidad_assets': 0, 'assets_con_balance': []},
            'metadata': {'error': 'DataFrame vacío'}
        }
    
    # Copiar DataFrame para no modificar el original
    df = trades_df.copy()
    
    # Asegurar que la columna time es datetime
    if 'time' not in df.columns:
        return {'error': 'Columna time no encontrada en DataFrame'}
    
    df['time'] = pd.to_datetime(df['time'])
    
    # Extraer activo de cada trade
    df['asset'] = df['pair'].apply(extraer_activo_de_par)
    
    # 2. FILTROS DE FECHA
    if fecha_inicio:
        if isinstance(fecha_inicio, str):
            fecha_inicio = pd.to_datetime(fecha_inicio).date()
        df = df[df['time'].dt.date >= fecha_inicio]
    
    if fecha_fin:
        if isinstance(fecha_fin, str):
            fecha_fin = pd.to_datetime(fecha_fin).date()
        df = df[df['time'].dt.date <= fecha_fin]
    
    # 3. FILTRO DE CRYPTOS
    if cryptos_filter:
        df = df[df['asset'].isin(cryptos_filter)]
    
    # 4. CÁLCULO DE CANTIDADES ACTUALES POR ASSET
    assets_quantities = {}
    trades_procesados = 0
    
    for _, trade in df.iterrows():
        asset = trade['asset']
        tipo = trade['type']
        ordertype = trade.get('ordertype', '')
        volumen = float(trade['vol'])
        
        # Filtrar operaciones excluidas
        if excluded_operations:
            operation_key = f"{tipo.title()} {ordertype.title()}"
            if operation_key in excluded_operations:
                continue
        
        if asset not in assets_quantities:
            assets_quantities[asset] = 0.0
        
        if tipo == 'buy':
            assets_quantities[asset] += volumen
        elif tipo == 'sell':
            assets_quantities[asset] -= volumen
        
        trades_procesados += 1
    
    # Filtrar assets con cantidad > 0
    assets_con_balance = {asset: cantidad for asset, cantidad in assets_quantities.items() if cantidad > 0}
    
    # 5. OBTENER PRECIOS ACTUALES
    precios_finales = {}
    precios_source = 'parametros'
    
    if precios_actuales:
        precios_finales.update(precios_actuales)
    
    # Obtener precios externos para assets faltantes (solo crypto, ignorar fiat)
    if obtener_precios_externos:
        assets_sin_precio = [asset for asset in assets_con_balance.keys() 
                           if asset not in precios_finales and asset not in FIAT_ASSETS]
        
        if assets_sin_precio:
            # =============================================================
            # 📊 SECCIÓN KRAKEN API - PRECIOS TIEMPO REAL
            # =============================================================
            # print(f"📡 [KRAKEN API] Obteniendo precios tiempo real para {len(assets_sin_precio)} assets...")
            start_time = time.time()
            precios_externos = obtener_precios(assets_sin_precio)
            tiempo_transcurrido = time.time() - start_time
            # print(f"⚡ [KRAKEN API] Exitosos: {len(precios_externos)}/{len(assets_sin_precio)} assets")
            # print(f"⏱️ [KRAKEN API] Tiempo: {tiempo_transcurrido:.3f}s")
            
            # =============================================================
            # 💾 SECCIÓN SUPABASE - ESTADÍSTICAS CACHE HISTÓRICO
            # =============================================================
            # print(f"📊 [SUPABASE] Consultando estadísticas cache histórico...")
            start_time_cache = time.time()
            cache_stats = stats_cache()
            tiempo_cache = time.time() - start_time_cache
            # print(f"💾 [SUPABASE] Cache histórico: {cache_stats.get('total_registros', 0)} registros")
            # print(f"⏱️ [SUPABASE] Tiempo consulta: {tiempo_cache:.3f}s")
            
            precios_finales.update(precios_externos)
            precios_source = 'tiempo_real' if precios_externos else ('mixto' if precios_actuales else 'externos')
    
    # Agregar precios fiat
    for asset in assets_con_balance.keys():
        if asset in FIAT_ASSETS and asset not in precios_finales:
            precios_finales[asset] = 1.0
    
    # 6. CALCULAR PORTFOLIO VALUE POR ASSET (solo crypto, ignorar fiat)
    results_by_asset = {}
    total_portfolio_value = 0.0
    
    for asset, cantidad in assets_con_balance.items():
        # Ignorar activos fiat para cálculos de portfolio
        if asset in FIAT_ASSETS:
            continue
            
        precio_actual = precios_finales.get(asset, 0)
        portfolio_value_asset = cantidad * precio_actual
        
        results_by_asset[asset] = {
            'cantidad_actual': cantidad,
            'precio_actual': precio_actual,
            'portfolio_value': portfolio_value_asset,
            'asset_type': 'crypto'
        }
        
        total_portfolio_value += portfolio_value_asset
        
        if precio_actual == 0 and cantidad > 0:
            print(f"⚠️ PRECIO FALTANTE: {asset} no tiene precio disponible")
    
    # 7. METADATA
    fecha_inicio_real = df['time'].min().date() if not df.empty else None
    fecha_fin_real = df['time'].max().date() if not df.empty else None
    
    processing_time = time.time() - start_time
    
    return {
        'assets': results_by_asset,
        'totales': {
            'total_portfolio_value': total_portfolio_value,
            'total_cantidad_assets': len(results_by_asset),  # Solo crypto assets
            'assets_con_balance': list(results_by_asset.keys())  # Solo crypto assets
        },
        'metadata': {
            'trades_procesados': trades_procesados,
            'fecha_inicio_real': fecha_inicio_real.strftime('%Y-%m-%d') if fecha_inicio_real else None,
            'fecha_fin_real': fecha_fin_real.strftime('%Y-%m-%d') if fecha_fin_real else None,
            'precios_obtenidos_de': precios_source,
            'processing_time_seconds': processing_time
        }
    }

# =============================================================================
# FUNCIÓN MODULAR 2: COST BASIS (FIFO)
# =============================================================================

def calcular_cost_basis(
    trades_df: pd.DataFrame,
    cryptos_filter: Optional[List[str]] = None,
    fecha_inicio: Optional[Union[str, date]] = None,
    fecha_fin: Optional[Union[str, date]] = None,
    incluir_inversion_historica: bool = True,
    excluded_operations: Optional[set] = None
) -> Dict[str, Any]:
    """
    Calcula Cost Basis usando metodología FIFO con parámetros flexibles
    
    Args:
        trades_df: DataFrame con los trades
        cryptos_filter: Lista de cryptos a incluir (None = todas)
        fecha_inicio: Fecha inicio para filtrar trades (None = desde el principio)
        fecha_fin: Fecha fin para filtrar trades (None = hasta el final)
    
    Returns:
        Dict con cost basis por asset y totales
    """
    start_time = time.time()
    
    # Copiar DataFrame para no modificar el original
    df = trades_df.copy()
    
    # Asegurar que la columna time es datetime
    if 'time' not in df.columns:
        return {'error': 'Columna time no encontrada en DataFrame'}
    
    df['time'] = pd.to_datetime(df['time'])
    
    # Extraer activo de cada trade
    df['asset'] = df['pair'].apply(extraer_activo_de_par)
    
    # 2. FILTROS DE FECHA
    if fecha_inicio:
        if isinstance(fecha_inicio, str):
            fecha_inicio = pd.to_datetime(fecha_inicio).date()
        df = df[df['time'].dt.date >= fecha_inicio]
    
    if fecha_fin:
        if isinstance(fecha_fin, str):
            fecha_fin = pd.to_datetime(fecha_fin).date()
        df = df[df['time'].dt.date <= fecha_fin]
    
    # 3. FILTRO DE CRYPTOS (ignorar fiat automáticamente)
    crypto_df = df[~df['asset'].isin(FIAT_ASSETS)].copy()
    
    if cryptos_filter:
        crypto_df = crypto_df[crypto_df['asset'].isin(cryptos_filter)]
    
    # 4. ORDENAR POR TIEMPO (CRUCIAL PARA FIFO)
    crypto_df = crypto_df.sort_values('time')
    
    # 5. PROCESAR TRADES POR ASSET USANDO FIFO
    assets_cost_basis = {}
    trades_procesados = 0
    
    for asset in crypto_df['asset'].unique():
        # Filtrar trades de este asset
        asset_trades = crypto_df[crypto_df['asset'] == asset].copy()
        
        # Inicializar estructuras FIFO para este asset
        cola_compras = []  # Cola FIFO para compras
        total_fees_asset = 0.0
        inversion_historica_total = 0.0  # Total invertido históricamente (todas las compras)
        
        # Procesar cada trade de este asset en orden cronológico
        for _, trade in asset_trades.iterrows():
            tipo = trade['type']
            ordertype = trade.get('ordertype', '')
            volumen = float(trade['vol'])
            cost = float(trade['cost'])
            fee = float(trade['fee'])
            
            # Filtrar operaciones excluidas
            if excluded_operations:
                operation_key = f"{tipo.title()} {ordertype.title()}"
                if operation_key in excluded_operations:
                    continue
            
            total_fees_asset += fee
            trades_procesados += 1
            
            if tipo == 'buy':
                # Agregar compra a la cola FIFO (incluyendo fee en el cost basis)
                cost_con_fee = cost + fee
                inversion_historica_total += cost_con_fee  # Rastrear inversión histórica total
                cola_compras.append({
                    'volumen': volumen,
                    'cost': cost_con_fee,
                    'precio_unitario': cost_con_fee / volumen if volumen > 0 else 0,
                    'timestamp': trade['time']
                })
            
            elif tipo == 'sell':
                # Procesar venta usando FIFO - consumir de los lotes más antiguos
                volumen_restante = volumen
                
                while volumen_restante > 0 and cola_compras:
                    lote = cola_compras[0]
                    
                    if lote['volumen'] <= volumen_restante:
                        # Consumir lote completo
                        volumen_restante -= lote['volumen']
                        cola_compras.pop(0)
                    else:
                        # Consumir parcialmente
                        proporcion = volumen_restante / lote['volumen']
                        lote['volumen'] -= volumen_restante
                        lote['cost'] -= lote['cost'] * proporcion
                        volumen_restante = 0
                
                # Verificar venta en corto (no mostrar mensaje)
                if volumen_restante > 0:
                    pass  # Venta en corto detectada pero no mostramos mensaje
        
        # Cost basis = suma del coste de las unidades que quedan
        cantidad_restante = sum(lote['volumen'] for lote in cola_compras)
        cost_basis_total = sum(lote['cost'] for lote in cola_compras)
        
        # Solo incluir assets con cantidad restante > 0 O con inversión histórica (para calcular ROI correcto)
        if cantidad_restante > 0 or inversion_historica_total > 0:
            assets_cost_basis[asset] = {
                'cantidad_restante': cantidad_restante,
                'cost_basis': cost_basis_total,
                'fees_incluidos': total_fees_asset,
                'lotes_fifo': len(cola_compras),
                'precio_promedio_ponderado': cost_basis_total / cantidad_restante if cantidad_restante > 0 else 0,
                'lotes_detalle': cola_compras[:3],  # Primeros 3 lotes para mostrar
                'inversion_historica_total': inversion_historica_total  # NUEVO: inversión total histórica
            }
    
    # 6. TOTALES
    total_cost_basis = sum(asset_data['cost_basis'] for asset_data in assets_cost_basis.values())
    total_fees = sum(asset_data['fees_incluidos'] for asset_data in assets_cost_basis.values())
    
    # 7. METADATA
    fecha_inicio_real = crypto_df['time'].min().date() if not crypto_df.empty else None
    fecha_fin_real = crypto_df['time'].max().date() if not crypto_df.empty else None
    processing_time = time.time() - start_time
    
    return {
        'assets': assets_cost_basis,
        'totales': {
            'total_cost_basis': total_cost_basis,
            'total_fees': total_fees,
            'assets_retenidos': list(assets_cost_basis.keys())
        },
        'metadata': {
            'trades_procesados': trades_procesados,
            'fecha_inicio_real': fecha_inicio_real.strftime('%Y-%m-%d') if fecha_inicio_real else None,
            'fecha_fin_real': fecha_fin_real.strftime('%Y-%m-%d') if fecha_fin_real else None,
            'processing_time_seconds': processing_time
        }
    }

# =============================================================================
# FUNCIÓN MODULAR 3: UNREALIZED GAINS
# =============================================================================

def calcular_unrealized_gains(
    portfolio_value_result: Dict,
    cost_basis_result: Dict
) -> Dict[str, Any]:
    """
    Calcula Unrealized Gains = Portfolio Value - Cost Basis
    
    Args:
        portfolio_value_result: Resultado de calcular_portfolio_value()
        cost_basis_result: Resultado de calcular_cost_basis()
    
    Returns:
        Dict con unrealized gains por asset y totales
    """
    start_time = time.time()
    
    assets_unrealized = {}
    
    # Obtener datos de ambos resultados
    portfolio_assets = portfolio_value_result.get('assets', {})
    cost_basis_assets = cost_basis_result.get('assets', {})
    
    # Procesar cada asset que tenga portfolio value
    for asset, portfolio_data in portfolio_assets.items():
        if asset in FIAT_ASSETS:
            continue
            
        portfolio_value = portfolio_data['portfolio_value']
        cost_basis_data = cost_basis_assets.get(asset, {})
        cost_basis = cost_basis_data.get('cost_basis', 0)
        
        # Solo incluir assets con cantidad > 0
        if portfolio_data['cantidad_actual'] > 0:
            unrealized_gains = portfolio_value - cost_basis
            unrealized_percent = (unrealized_gains / cost_basis * 100) if cost_basis > 0 else 0
            
            assets_unrealized[asset] = {
                'portfolio_value': portfolio_value,
                'cost_basis': cost_basis,
                'unrealized_gains': unrealized_gains,
                'unrealized_percent': unrealized_percent,
                'cantidad': portfolio_data['cantidad_actual'],
                'precio_actual': portfolio_data['precio_actual']
            }
    
    # Totales
    total_portfolio_value = sum(data['portfolio_value'] for data in assets_unrealized.values())
    total_cost_basis = sum(data['cost_basis'] for data in assets_unrealized.values())
    total_unrealized_gains = total_portfolio_value - total_cost_basis
    
    processing_time = time.time() - start_time
    
    return {
        'assets': assets_unrealized,
        'totales': {
            'total_portfolio_value': total_portfolio_value,
            'total_cost_basis': total_cost_basis,
            'total_unrealized_gains': total_unrealized_gains,
            'total_unrealized_percent': (total_unrealized_gains / total_cost_basis * 100) if total_cost_basis > 0 else 0
        },
        'metadata': {
            'processing_time_seconds': processing_time,
            'assets_procesados': len(assets_unrealized)
        }
    }

# =============================================================================
# FUNCIÓN MODULAR 4: REALIZED GAINS
# =============================================================================

def calcular_realized_gains(
    trades_df: pd.DataFrame,
    cryptos_filter: Optional[List[str]] = None,
    fecha_inicio: Optional[Union[str, date]] = None,
    fecha_fin: Optional[Union[str, date]] = None,
    excluded_operations: Optional[set] = None
) -> Dict[str, Any]:
    """
    Calcula Realized Gains usando metodología FIFO con parámetros flexibles
    
    Args:
        trades_df: DataFrame con los trades
        cryptos_filter: Lista de cryptos a incluir (None = todas)
        fecha_inicio: Fecha inicio para filtrar trades (None = desde el principio)
        fecha_fin: Fecha fin para filtrar trades (None = hasta el final)
    
    Returns:
        Dict con realized gains por asset y totales
    """
    start_time = time.time()
    
    # Copiar DataFrame para no modificar el original
    df = trades_df.copy()
    
    # Asegurar que la columna time es datetime
    if 'time' not in df.columns:
        return {'error': 'Columna time no encontrada en DataFrame'}
    
    df['time'] = pd.to_datetime(df['time'])
    
    # Extraer activo de cada trade
    df['asset'] = df['pair'].apply(extraer_activo_de_par)
    
    # 2. FILTROS DE FECHA
    if fecha_inicio:
        if isinstance(fecha_inicio, str):
            fecha_inicio = pd.to_datetime(fecha_inicio).date()
        df = df[df['time'].dt.date >= fecha_inicio]
    
    if fecha_fin:
        if isinstance(fecha_fin, str):
            fecha_fin = pd.to_datetime(fecha_fin).date()
        df = df[df['time'].dt.date <= fecha_fin]
    
    # 3. FILTRO DE CRYPTOS (ignorar fiat automáticamente)
    crypto_df = df[~df['asset'].isin(FIAT_ASSETS)].copy()
    
    if cryptos_filter:
        crypto_df = crypto_df[crypto_df['asset'].isin(cryptos_filter)]
    
    # 4. ORDENAR POR TIEMPO (CRUCIAL PARA FIFO)
    crypto_df = crypto_df.sort_values('time')
    
    # 5. PROCESAR TRADES POR ASSET USANDO FIFO
    assets_realized_gains = {}
    trades_procesados = 0
    total_ventas = 0
    
    for asset in crypto_df['asset'].unique():
        # Filtrar trades de este asset
        asset_trades = crypto_df[crypto_df['asset'] == asset].copy()
        
        # Inicializar estructuras FIFO para este asset
        cola_compras = []  # Cola FIFO para compras
        realized_gains_total = 0.0
        ventas_detalle = []
        ventas_procesadas = 0
        
        # Procesar cada trade de este asset en orden cronológico
        for _, trade in asset_trades.iterrows():
            tipo = trade['type']
            ordertype = trade.get('ordertype', '')
            volumen = float(trade['vol'])
            cost = float(trade['cost'])
            fee = float(trade['fee'])
            
            # Filtrar operaciones excluidas
            if excluded_operations:
                operation_key = f"{tipo.title()} {ordertype.title()}"
                if operation_key in excluded_operations:
                    continue
            
            trades_procesados += 1
            
            if tipo == 'buy':
                # Agregar compra a la cola FIFO (incluyendo fee en el cost)
                cost_con_fee = cost + fee
                cola_compras.append({
                    'volumen': volumen,
                    'cost': cost_con_fee,
                    'timestamp': trade['time']
                })
            
            elif tipo == 'sell':
                total_ventas += 1
                ventas_procesadas += 1
                
                # Procesar venta usando FIFO - calcular realized gain
                volumen_restante = volumen
                ingresos_venta = cost  # Lo que recibiste por la venta
                cost_vendido = 0.0     # Lo que costaron originalmente las unidades vendidas
                
                while volumen_restante > 0 and cola_compras:
                    lote = cola_compras[0]
                    
                    if lote['volumen'] <= volumen_restante:
                        # Consumir lote completo
                        cost_vendido += lote['cost']
                        volumen_restante -= lote['volumen']
                        cola_compras.pop(0)
                    else:
                        # Consumir parcialmente
                        proporcion = volumen_restante / lote['volumen']
                        cost_parcial = lote['cost'] * proporcion
                        cost_vendido += cost_parcial
                        
                        lote['volumen'] -= volumen_restante
                        lote['cost'] -= cost_parcial
                        volumen_restante = 0
                
                # Calcular realized gain de esta venta
                ingresos_netos = ingresos_venta - fee  # Restar fee de venta
                realized_gain_venta = ingresos_netos - cost_vendido
                realized_gains_total += realized_gain_venta
                
                # Guardar detalle de la venta
                ventas_detalle.append({
                    'volumen': volumen,
                    'ingresos_brutos': ingresos_venta,
                    'ingresos_netos': ingresos_netos,
                    'cost_vendido': cost_vendido,
                    'realized_gain': realized_gain_venta,
                    'timestamp': trade['time'],
                    'fee': fee
                })
        
        # Solo incluir assets que tuvieron ventas
        if ventas_procesadas > 0:
            assets_realized_gains[asset] = {
                'realized_gains': realized_gains_total,
                'ventas_procesadas': ventas_procesadas,
                'ventas_detalle': ventas_detalle
            }
    
    # 6. TOTALES
    total_realized_gains = sum(asset_data['realized_gains'] for asset_data in assets_realized_gains.values())
    
    # 7. METADATA
    fecha_inicio_real = crypto_df['time'].min().date() if not crypto_df.empty else None
    fecha_fin_real = crypto_df['time'].max().date() if not crypto_df.empty else None
    processing_time = time.time() - start_time
    
    return {
        'assets': assets_realized_gains,
        'totales': {
            'total_realized_gains': total_realized_gains,
            'total_ventas': total_ventas,
            'assets_procesados': list(assets_realized_gains.keys())
        },
        'metadata': {
            'trades_procesados': trades_procesados,
            'fecha_inicio_real': fecha_inicio_real.strftime('%Y-%m-%d') if fecha_inicio_real else None,
            'fecha_fin_real': fecha_fin_real.strftime('%Y-%m-%d') if fecha_fin_real else None,
            'processing_time_seconds': processing_time
        }
    }

# =============================================================================
# SECCIÓN DE PRUEBAS INTERACTIVA
# =============================================================================

def obtener_assets_del_csv():
    """Obtiene lista de assets únicos del CSV"""
    try:
        df = pd.read_csv('trades.csv')
        df['asset'] = df['pair'].apply(extraer_activo_de_par)
        
        # Calcular cantidades actuales para mostrar solo assets con balance
        assets_quantities = {}
        for _, trade in df.iterrows():
            asset = trade['asset']
            tipo = trade['type']
            volumen = float(trade['vol'])
            
            if asset not in assets_quantities:
                assets_quantities[asset] = 0.0
            
            if tipo == 'buy':
                assets_quantities[asset] += volumen
            elif tipo == 'sell':
                assets_quantities[asset] -= volumen
        
        # Separar crypto y fiat assets
        assets_con_balance = [asset for asset, cantidad in assets_quantities.items() if cantidad > 0]
        crypto_assets = [asset for asset in assets_con_balance if asset not in FIAT_ASSETS]
        fiat_assets = [asset for asset in assets_con_balance if asset in FIAT_ASSETS]
        
        return crypto_assets, fiat_assets, assets_quantities
        
    except Exception as e:
        print(f"❌ Error leyendo CSV: {e}")
        return [], [], {}

def prueba_1_obtener_precios():
    """Prueba 1: Obtener precios de todos los assets crypto (ignorar fiat)"""
    print("\n" + "="*80)
    print("🧪 PRUEBA 1: OBTENER PRECIOS DE TODOS LOS ASSETS CRYPTO")
    print("="*80)
    
    crypto_assets, fiat_assets, quantities = obtener_assets_del_csv()
    
    if not crypto_assets:
        print("❌ No se encontraron crypto assets con balance")
        return {}
    
    print(f"📋 Crypto assets detectados: {len(crypto_assets)}")
    for asset in crypto_assets:
        print(f"   • {asset}: {quantities[asset]:.6f}")
    
    if fiat_assets:
        print(f"\n💵 Fiat assets ignorados: {len(fiat_assets)}")
        for asset in fiat_assets:
            print(f"   ⏭️ {asset}: {quantities[asset]:.6f} (ignorado)")
    
    print(f"\n📡 Obteniendo precios en tiempo real para crypto assets...")
    precios = obtener_precios_de_kraken(crypto_assets)
    
    print(f"\n📊 RESULTADOS DE PRECIOS:")
    print("-" * 60)
    print(f"{'Asset':<10} | {'Precio (EUR)':<12} | {'Estado':<15}")
    print("-" * 60)
    
    total_exitosos = 0
    for asset in crypto_assets:
        precio = precios.get(asset, 0)
        estado = "✅ Exitoso" if precio > 0 else "❌ Sin precio"
        if precio > 0:
            total_exitosos += 1
        
        print(f"{asset:<10} | €{precio:<11.2f} | {estado}")
    
    print("-" * 60)
    print(f"Resumen: {total_exitosos}/{len(crypto_assets)} crypto precios obtenidos exitosamente")
    
    return precios

def prueba_2_calcular_portfolio_value(precios_obtenidos):
    """Prueba 2: Calcular Portfolio Value usando función modular"""
    print("\n" + "="*80)
    print("🧪 PRUEBA 2: CALCULAR PORTFOLIO VALUE POR ASSET Y TOTAL (SOLO CRYPTO)")
    print("="*80)
    
    try:
        df = pd.read_csv('trades.csv')
        
        # Usar la función modular
        result = calcular_portfolio_value(
            trades_df=df,
            precios_actuales=precios_obtenidos,
            obtener_precios_externos=False
        )
        
        if 'error' in result:
            print(f"❌ Error: {result['error']}")
            return
        
        # Mostrar resultados detallados
        assets = result['assets']
        totales = result['totales']
        metadata = result['metadata']
        
        # Solo assets crypto con cantidad > 0
        crypto_assets = {k: v for k, v in assets.items() if k not in FIAT_ASSETS and v['cantidad_actual'] > 0}
        
        if crypto_assets:
            print("📈 PORTFOLIO VALUE DETALLADO (SOLO CRYPTO):")
            print("-" * 80)
            print(f"{'Asset':<10} | {'Cantidad':<12} | {'Precio':<10} | {'Valor (EUR)':<12} | {'Tipo'}")
            print("-" * 80)
            
            # Ordenar por valor descendente
            sorted_assets = sorted(crypto_assets.items(), key=lambda x: x[1]['portfolio_value'], reverse=True)
            
            for asset, data in sorted_assets:
                print(f"{asset:<10} | {data['cantidad_actual']:<12.6f} | €{data['precio_actual']:<9.2f} | €{data['portfolio_value']:<11.2f} | crypto")
            
            print("-" * 80)
        
        # Mostrar resumen
        print(f"💰 TOTALES (SOLO CRYPTO):")
        print(f"   📊 Portfolio Value Total: €{totales['total_portfolio_value']:,.2f}")
        print(f"   📦 Crypto Assets: {totales['total_cantidad_assets']}")
        print(f"   ⏱️ Tiempo de procesamiento: {metadata['processing_time_seconds']:.3f}s")
        
        # Composición
        print(f"\n📊 COMPOSICIÓN:")
        print(f"   🪙 Crypto Portfolio: €{totales['total_portfolio_value']:,.2f} (100%)")
        print(f"   💵 Fiat: Ignorado en cálculos")
        
        return result
        
    except Exception as e:
        print(f"❌ Error en prueba 2: {e}")
        import traceback
        print(traceback.format_exc())

def prueba_3_calcular_cost_basis():
    """Prueba 3: Calcular Cost Basis usando metodología FIFO"""
    print("\n" + "="*80)
    print("🧪 PRUEBA 3: CALCULAR COST BASIS CON METODOLOGÍA FIFO")
    print("="*80)
    
    try:
        df = pd.read_csv('trades.csv')
        
        # Usar la función modular
        result = calcular_cost_basis(trades_df=df)
        
        if 'error' in result:
            print(f"❌ Error: {result['error']}")
            return
        
        # Mostrar resultados detallados
        assets = result['assets']
        totales = result['totales']
        metadata = result['metadata']
        
        if assets:
            print("📊 COST BASIS DETALLADO (FIFO):")
            print("-" * 90)
            print(f"{'Asset':<10} | {'Cantidad':<12} | {'Cost Basis':<12} | {'Fees':<10} | {'Lotes FIFO':<12}")
            print("-" * 90)
            
            # Ordenar por cost basis descendente
            sorted_assets = sorted(assets.items(), key=lambda x: x[1]['cost_basis'], reverse=True)
            
            for asset, data in sorted_assets:
                print(f"{asset:<10} | {data['cantidad_restante']:<12.6f} | €{data['cost_basis']:<11.2f} | €{data['fees_incluidos']:<9.2f} | {data['lotes_fifo']} lotes")
            
            print("-" * 90)
        
        # Mostrar totales
        print(f"💰 TOTALES COST BASIS:")
        print(f"   📊 Cost Basis Total: €{totales['total_cost_basis']:,.2f}")
        print(f"   💸 Fees Total: €{totales['total_fees']:.2f}")
        print(f"   📦 Assets retenidos: {len(totales['assets_retenidos'])}")
        print(f"   ⏱️ Tiempo de procesamiento: {metadata['processing_time_seconds']:.3f}s")
        
        # Información adicional
        print(f"\n📋 INFORMACIÓN ADICIONAL:")
        print(f"   🔄 Trades procesados: {metadata['trades_procesados']}")
        print(f"   📅 Rango de fechas: {metadata['fecha_inicio_real']} → {metadata['fecha_fin_real']}")
        
        # Mostrar detalle de lotes FIFO del asset con más cost basis
        if assets:
            top_asset = max(assets.items(), key=lambda x: x[1]['cost_basis'])
            asset_name, asset_data = top_asset
            
            print(f"\n🔍 DETALLE LOTES FIFO - {asset_name}:")
            for i, lote in enumerate(asset_data['lotes_detalle'][:3]):
                fecha = lote['timestamp'].strftime('%Y-%m-%d %H:%M')
                print(f"   Lote {i+1}: {lote['volumen']:.6f} × €{lote['precio_unitario']:.2f} (compra: {fecha})")
            
            if asset_data['lotes_fifo'] > 3:
                print(f"   ... y {asset_data['lotes_fifo'] - 3} lotes más")
        
        return result
        
    except Exception as e:
        print(f"❌ Error en prueba 3: {e}")
        import traceback
        print(traceback.format_exc())

def prueba_4_unrealized_realized_gains():
    """Prueba 4: Combinar todas las funciones para análisis completo"""
    print("\n" + "="*80)
    print("🧪 PRUEBA 4: UNREALIZED Y REALIZED GAINS COMBINADOS")
    print("="*80)
    
    try:
        df = pd.read_csv('trades.csv')
        
        # 1. Obtener precios actuales
        crypto_assets, _, _ = obtener_assets_del_csv()
        precios = obtener_precios_de_kraken(crypto_assets)
        
        # 2. Calcular Portfolio Value
        portfolio_result = calcular_portfolio_value(
            trades_df=df,
            precios_actuales=precios,
            obtener_precios_externos=False
        )
        
        # 3. Calcular Cost Basis
        cost_basis_result = calcular_cost_basis(trades_df=df)
        
        # 4. Calcular Unrealized Gains
        unrealized_result = calcular_unrealized_gains(portfolio_result, cost_basis_result)
        
        # 5. Calcular Realized Gains
        realized_result = calcular_realized_gains(trades_df=df)
        
        # Verificar errores
        if any('error' in result for result in [portfolio_result, cost_basis_result, unrealized_result, realized_result]):
            print("❌ Error en alguno de los cálculos")
            return
        
        print(f"📊 RESUMEN COMPLETO DE GAINS:")
        print("-" * 100)
        print(f"{'Asset':<10} | {'Unrealized':<12} | {'%':<8} | {'Realized':<12} | {'Total Gains':<12} | {'Ventas':<8}")
        print("-" * 100)
        
        # Combinar resultados por asset
        all_assets = set(unrealized_result['assets'].keys()).union(set(realized_result['assets'].keys()))
        total_gains_combined = 0
        
        for asset in sorted(all_assets):
            unrealized_data = unrealized_result['assets'].get(asset, {})
            realized_data = realized_result['assets'].get(asset, {})
            
            unrealized_gains = unrealized_data.get('unrealized_gains', 0)
            unrealized_percent = unrealized_data.get('unrealized_percent', 0)
            realized_gains = realized_data.get('realized_gains', 0)
            ventas = realized_data.get('ventas_procesadas', 0)
            
            total_gains_asset = unrealized_gains + realized_gains
            total_gains_combined += total_gains_asset
            
            print(f"{asset:<10} | €{unrealized_gains:<11.2f} | {unrealized_percent:<7.1f}% | €{realized_gains:<11.2f} | €{total_gains_asset:<11.2f} | {ventas}")
        
        print("-" * 100)
        
        # Totales
        total_unrealized = unrealized_result['totales']['total_unrealized_gains']
        total_realized = realized_result['totales']['total_realized_gains']
        total_portfolio_value = unrealized_result['totales']['total_portfolio_value']
        total_cost_basis = unrealized_result['totales']['total_cost_basis']
        
        print(f"💰 TOTALES FINALES:")
        print(f"   📈 Portfolio Value: €{total_portfolio_value:,.2f}")
        print(f"   💸 Cost Basis: €{total_cost_basis:,.2f}")
        print(f"   🟢 Unrealized Gains: €{total_unrealized:,.2f}")
        print(f"   ✅ Realized Gains: €{total_realized:,.2f}")
        print(f"   🎯 TOTAL GAINS: €{total_unrealized + total_realized:,.2f}")
        
        # Porcentajes
        if total_cost_basis > 0:
            total_roi = ((total_unrealized + total_realized) / total_cost_basis) * 100
            print(f"   📊 ROI Total: {total_roi:.1f}%")
        
        # Información adicional
        total_ventas = realized_result['totales']['total_ventas']
        assets_con_ventas = len(realized_result['assets'])
        
        print(f"\n📋 INFORMACIÓN ADICIONAL:")
        print(f"   🔄 Assets con unrealized gains: {len(unrealized_result['assets'])}")
        print(f"   💼 Assets con realized gains: {assets_con_ventas}")
        print(f"   📤 Total de ventas ejecutadas: {total_ventas}")
        
        # Mostrar detalle de ventas para el asset con más realized gains
        if realized_result['assets']:
            top_realized_asset = max(realized_result['assets'].items(), 
                                   key=lambda x: x[1]['realized_gains'])
            asset_name, asset_data = top_realized_asset
            
            print(f"\n🔍 DETALLE VENTAS - {asset_name} (mayor realized gain):")
            print(f"   Realized Gains: €{asset_data['realized_gains']:.2f}")
            print(f"   Número de ventas: {asset_data['ventas_procesadas']}")
            
            # Mostrar primeras 2 ventas
            for i, venta in enumerate(asset_data['ventas_detalle'][:2]):
                fecha = venta['timestamp'].strftime('%Y-%m-%d')
                print(f"   Venta {i+1}: {venta['volumen']:.6f} × €{venta['ingresos_netos']:.2f} = €{venta['realized_gain']:.2f} gain ({fecha})")
        
        return {
            'unrealized': unrealized_result,
            'realized': realized_result,
            'portfolio': portfolio_result,
            'cost_basis': cost_basis_result
        }
        
    except Exception as e:
        print(f"❌ Error en prueba 4: {e}")
        import traceback
        print(traceback.format_exc())

def ejecutar_todas_las_pruebas():
    """Ejecuta todas las pruebas en secuencia"""
    print("🧮 MAIN2.PY - SISTEMA DE PRUEBAS INTERACTIVO")
    print("=" * 80)
    
    # Limpiar cache para nuevas pruebas
    DYNAMIC_PAIR_CACHE.clear()
    
    # Prueba 1: Obtener precios
    precios = prueba_1_obtener_precios()
    
    if not precios:
        print("❌ No se pudieron obtener precios, abortando pruebas")
        return
    
    # Prueba 2: Calcular Portfolio Value
    portfolio_result = prueba_2_calcular_portfolio_value(precios)
    
    # Prueba 3: Calcular Cost Basis
    cost_basis_result = prueba_3_calcular_cost_basis()
    
    # Prueba 4: Calcular Unrealized y Realized Gains combinados
    combined_result = prueba_4_unrealized_realized_gains()
    
    print(f"\n🎉 TODAS LAS PRUEBAS COMPLETADAS")
    print("=" * 80)

# =============================================================================
# CONFIGURACIÓN FASTAPI
# =============================================================================

app = FastAPI(title="Portfolio Visualizer v2", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# ENDPOINTS API
# =============================================================================

@app.get("/")
async def root():
    return {"message": "Portfolio Visualizer v2 - Powered by modular functions"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}

@app.get("/api/health")
async def api_health_check():
    return {"status": "ok", "version": "2.0.0", "backend": "main2.py"}

@app.get("/api/cache/stats")
async def get_cache_stats():
    """Endpoint para obtener estadísticas del cache de Supabase"""
    try:
        stats = stats_cache()
        return {
            "status": "success",
            "cache_stats": stats,
            "message": "Estadísticas del cache híbrido Supabase"
        }
    except Exception as e:
        return {
            "status": "error", 
            "error": f"Error obteniendo estadísticas del cache: {str(e)}"
        }

@app.get("/api/trades/date-range")
async def get_trades_date_range():
    """Endpoint para obtener el rango de fechas de los trades"""
    try:
        df = pd.read_csv('trades.csv')
        df['time'] = pd.to_datetime(df['time'])
        
        start_date = df['time'].min().strftime('%Y-%m-%d')
        end_date = df['time'].max().strftime('%Y-%m-%d')
        
        return {
            "start_date": start_date,
            "end_date": end_date,
            "total_trades": len(df)
        }
    except Exception as e:
        return {"error": f"Error obteniendo rango de fechas: {str(e)}"}

def calcular_timeline_con_cache_hibrido(trades_df: pd.DataFrame, fecha_inicio: str = None, fecha_fin: str = None) -> List[Dict[str, Any]]:
    """
    Calcula timeline diario del portfolio de forma simplificada.
    Siempre toma fecha inicio y fin, calculando total gains, unrealized y realized para cada día.
    """
    try:
        # Mapeo de assets del CSV a assets del cache
        ASSET_MAPPING = {
            'BTC': 'XXBT', 'ETH': 'XETH', 'XRP': 'XRP', 'SOL': 'SOL',
            'LINK': 'LINK', 'HBAR': 'HBAR', 'TRUMP': 'TRUMP'
        }
        
        # Preparar datos
        df = trades_df.copy()
        df['time'] = pd.to_datetime(df['time'])
        df['fecha'] = df['time'].dt.date
        df = df.sort_values('time')
        
        # Determinar rango de fechas: usar parámetros o fecha mínima hasta hoy
        if fecha_inicio and fecha_fin:
            from datetime import datetime
            fecha_start = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
            fecha_end = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        else:
            fecha_start = df['fecha'].min()
            fecha_end = get_spain_date()
        
        # Crear rango de fechas completo
        fechas_timeline = []
        fecha_actual = fecha_start
        while fecha_actual <= fecha_end:
            fechas_timeline.append(fecha_actual)
            fecha_actual += timedelta(days=1)
        
        # Obtener todos los assets únicos para cache batch
        assets_en_trades = list(set(ASSET_MAPPING.get(pair.split('/')[0], pair.split('/')[0]) 
                                   for pair in df['pair'].unique() 
                                   if '/' in pair and pair.split('/')[0] not in FIAT_ASSETS))
        
        # Obtener precios en batch
        from supabase_cache import cache
        precios_batch = cache.obtener_precios_cache_batch(assets_en_trades, fecha_start, fecha_end)
        
        timeline = []
        holdings_acumulados = {}
        cost_basis_fifo = {}

        for fecha in fechas_timeline:
            # Procesar trades del día
            trades_del_dia = df[df['fecha'] == fecha]
            operations_del_dia = []

            for _, trade in trades_del_dia.iterrows():
                # Extraer y mapear asset
                asset_csv = trade['pair'].split('/')[0]
                asset = ASSET_MAPPING.get(asset_csv, asset_csv)

                if asset in FIAT_ASSETS:
                    continue

                tipo = trade['type']
                ordertype = str(trade.get('ordertype', ''))
                cantidad = float(trade['vol'])
                cost = float(trade['cost'])
                fee = float(trade['fee'])
                operation_key = f"{tipo.title()} {ordertype.title()}"

                # Inicializar estructuras
                if asset not in holdings_acumulados:
                    holdings_acumulados[asset] = 0
                if asset not in cost_basis_fifo:
                    cost_basis_fifo[asset] = []

                # Procesar según tipo
                operation_extra = {}
                if tipo.lower() == 'buy':
                    holdings_acumulados[asset] += cantidad
                    cost_con_fee = cost + fee
                    cost_basis_fifo[asset].append({
                        'volumen': cantidad,
                        'cost': cost_con_fee,
                        'timestamp': trade['time']
                    })

                elif tipo.lower() == 'sell':
                    holdings_acumulados[asset] -= cantidad

                    # Procesar venta usando FIFO y calcular realized gain
                    volumen_restante = cantidad
                    cost_vendido = 0.0
                    while volumen_restante > 0 and cost_basis_fifo[asset]:
                        lote = cost_basis_fifo[asset][0]

                        if lote['volumen'] <= volumen_restante:
                            volumen_restante -= lote['volumen']
                            cost_vendido += lote['cost']
                            cost_basis_fifo[asset].pop(0)
                        else:
                            proporcion = volumen_restante / lote['volumen']
                            cost_parcial = lote['cost'] * proporcion
                            cost_vendido += cost_parcial
                            lote['volumen'] -= volumen_restante
                            lote['cost'] -= cost_parcial
                            volumen_restante = 0

                    realized_gain = (cost - fee) - cost_vendido
                    operation_extra = {'realized_gain': realized_gain}

                # Guardar operación del día
                operations_del_dia.append({
                    'asset': asset,
                    'type': tipo.lower(),
                    'cantidad': cantidad,
                    'cost': cost,
                    'fee': fee,
                    'operation_key': operation_key,
                    'ordertype': ordertype,
                    **operation_extra
                })

            # Calcular valor del portfolio para este día
            valor_total = 0
            cost_basis_total = 0
            assets_con_valor_del_dia = {}

            for asset, cantidad in holdings_acumulados.items():
                if cantidad > 0:
                    # Obtener precio para la fecha
                    precio = None
                    if asset in precios_batch and fecha in precios_batch[asset]:
                        precio = precios_batch[asset][fecha]
                    else:
                        # Fallback: buscar precio más cercano
                        if asset in precios_batch:
                            fechas_disponibles = [f for f in precios_batch[asset].keys() if f <= fecha]
                            if fechas_disponibles:
                                fecha_cercana = max(fechas_disponibles)
                                precio = precios_batch[asset][fecha_cercana]
                            else:
                                # Si no hay fechas anteriores, usar la siguiente disponible
                                fechas_futuras = [f for f in precios_batch[asset].keys() if f > fecha]
                                if fechas_futuras:
                                    precio = precios_batch[asset][min(fechas_futuras)]

                    if precio is not None:
                        valor_asset = cantidad * precio
                        valor_total += valor_asset
                        assets_con_valor_del_dia[asset] = {
                            'precio': precio,
                            'cantidad': cantidad,
                            'valor': valor_asset
                        }

                # Calcular cost basis para este asset
                if asset in cost_basis_fifo and cantidad > 0:
                    cost_basis_asset = sum(lote['cost'] for lote in cost_basis_fifo[asset])
                    cost_basis_total += cost_basis_asset

            # Calcular gains
            unrealized_gain = valor_total - cost_basis_total

            # Para realized gains del período, usar las funciones modulares existentes
            # (simplificado: solo mostramos unrealized por ahora)
            realized_gain_period = 0  # TODO: implementar con función modular
            total_gain = unrealized_gain + realized_gain_period

            # Añadir punto al timeline
            timeline.append({
                'date': fecha.isoformat(),
                'value': valor_total,
                'cost': cost_basis_total,
                'total_gain': total_gain,
                'unrealized_gain': unrealized_gain,
                'realized_gain_period': realized_gain_period,
                'operations': operations_del_dia,
                'assets_con_valor': assets_con_valor_del_dia
            })
        
        return timeline
        
    except Exception as e:
        print(f"❌ [TIMELINE] Error: {e}")
        return []

@app.post("/api/portfolio/csv")
async def upload_csv_and_get_portfolio(
    csv_file: UploadFile = File(...),
    excluded_operations: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None)
):
    """
    Endpoint principal que procesa CSV y retorna KPIs usando funciones modulares
    """
    print(f"🚀 [ENDPOINT] Received CSV request - start_date: {start_date}, end_date: {end_date}")
    if excluded_operations:
        print(f"❌ [ENDPOINT] Excluded operations: {excluded_operations[:100]}...")  # First 100 chars
    import time
    import signal
    start_time = time.time()
    
    # Timeout de 60 segundos para evitar que el endpoint se cuelgue
    def timeout_handler(signum, frame):
        raise TimeoutError("El procesamiento del CSV tardó más de 60 segundos")
    
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(60)  # 60 segundos timeout
    
    try:
        # 1. Leer CSV
        contents = await csv_file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # 1.5. Procesar excluded_operations
        excluded_ops_set = set()
        if excluded_operations:
            try:
                import json
                excluded_ops_list = json.loads(excluded_operations)
                excluded_ops_set = set(excluded_ops_list)
                print(f"🚫 [FILTROS] Operaciones excluidas: {excluded_ops_set}")
            except Exception as e:
                print(f"❌ [FILTROS] Error procesando excluded_operations: {e}")
        
        # 1.6. Generar mapeo dinámico de assets basado en el CSV
        dynamic_asset_mapping = get_dynamic_asset_mapping(df)
        print(f"🔄 [MAPPING] Mapeo dinámico generado: {dynamic_asset_mapping}")
        
        # 2. Calcular Portfolio Value
        portfolio_result = calcular_portfolio_value(
            trades_df=df,
            obtener_precios_externos=True,
            excluded_operations=excluded_ops_set
        )
        
        # 3. Calcular Cost Basis
        cost_basis_result = calcular_cost_basis(
            trades_df=df,
            excluded_operations=excluded_ops_set
        )
        
        # 4. Calcular Unrealized Gains
        unrealized_result = calcular_unrealized_gains(portfolio_result, cost_basis_result)
        
        # 5. Calcular Realized Gains
        realized_result = calcular_realized_gains(
            trades_df=df,
            excluded_operations=excluded_ops_set
        )
        
        # 6. Extraer totales
        portfolio_value = portfolio_result.get('totales', {}).get('total_portfolio_value', 0)
        total_invested = cost_basis_result.get('totales', {}).get('total_cost_basis', 0)
        unrealized_gains_total = unrealized_result.get('totales', {}).get('total_unrealized_gains', 0)
        realized_gains_total = realized_result.get('totales', {}).get('total_realized_gains', 0)
        total_fees = cost_basis_result.get('totales', {}).get('total_fees', 0)
        
        # 7. Extraer datos por asset
        portfolio_assets = portfolio_result.get('assets', {})
        cost_basis_assets = cost_basis_result.get('assets', {})
        unrealized_assets = unrealized_result.get('assets', {})
        realized_assets = realized_result.get('assets', {})
        
        # 8. Crear portfolio array compatible con frontend
        portfolio_array = []
        all_assets = set()
        all_assets.update(portfolio_assets.keys())
        all_assets.update(cost_basis_assets.keys())
        all_assets.update(unrealized_assets.keys())
        all_assets.update(realized_assets.keys())
        
        for asset in all_assets:
            # Datos del portfolio value
            portfolio_data = portfolio_assets.get(asset, {})
            current_value = portfolio_data.get('portfolio_value', 0)
            current_price = portfolio_data.get('precio_actual', 0)
            amount = portfolio_data.get('cantidad_actual', 0)
            
            # Datos del cost basis
            cost_data = cost_basis_assets.get(asset, {})
            total_invested_asset = cost_data.get('cost_basis', 0)  # Solo activos retenidos
            fees_paid = cost_data.get('fees_incluidos', 0)
            inversion_historica = cost_data.get('inversion_historica_total', total_invested_asset)  # Inversión histórica total
            
            # Datos de gains
            unrealized_data = unrealized_assets.get(asset, {})
            unrealized_gains_asset = unrealized_data.get('unrealized_gains', 0)
            
            realized_data = realized_assets.get(asset, {})
            realized_gains_asset = realized_data.get('realized_gains', 0)
            
            # Calcular métricas
            net_profit_asset = realized_gains_asset + unrealized_gains_asset
            pnl_eur = current_value - total_invested_asset  # PnL tradicional (solo activos retenidos)
            pnl_percent = (pnl_eur / total_invested_asset * 100) if total_invested_asset > 0 else 0
            # ROI corregido: usar inversión histórica total para el net_profit_percent
            net_profit_percent = (net_profit_asset / inversion_historica * 100) if inversion_historica > 0 else 0
            
            # Solo incluir assets con datos relevantes
            if amount > 0 or total_invested_asset > 0 or realized_gains_asset != 0:
                portfolio_array.append({
                    'asset': asset,
                    'asset_type': 'fiat' if asset in FIAT_ASSETS else 'crypto',
                    'amount': amount,
                    'current_price': current_price,
                    'total_invested': total_invested_asset,
                    'fees_paid': fees_paid,
                    'current_value': current_value,
                    'pnl_eur': pnl_eur,
                    'pnl_percent': pnl_percent,
                    'realized_gains': realized_gains_asset,
                    'unrealized_gains': unrealized_gains_asset,
                    'net_profit': net_profit_asset,
                    'net_profit_percent': net_profit_percent
                })
        
        # 9. Calcular KPIs consolidados
        crypto_value = sum(item['current_value'] for item in portfolio_array if item['asset_type'] == 'crypto')
        liquidity = sum(item['current_value'] for item in portfolio_array if item['asset_type'] == 'fiat')
        net_profit = realized_gains_total + unrealized_gains_total
        net_profit_percentage = (net_profit / total_invested * 100) if total_invested > 0 else 0
        
        # 10. Generar Timeline usando cache híbrido (optimizado)
        timeline_start = time.time()
        print(f"📅 [TIMELINE] Iniciando timeline con filtros: {start_date} to {end_date}")
        timeline_data = calcular_timeline_con_cache_hibrido(df, start_date, end_date)
        timeline_time = time.time() - timeline_start
        print(f"⏱️ [TIMELINE] Completado en {timeline_time:.3f}s - {len(timeline_data)} días generados")
        
        # Sobreescribir el último entry del timeline con precios reales de Kraken
        if timeline_data:
            last_entry = timeline_data[-1]
            real_time_assets_con_valor = {}
            for asset_csv, asset_data in portfolio_assets.items():
                kraken_name = ASSET_MAPPING_KRAKEN.get(asset_csv, asset_csv)
                precio = asset_data.get('precio_actual', 0)
                cantidad = asset_data.get('cantidad_actual', 0)
                if cantidad > 0 and precio > 0:
                    real_time_assets_con_valor[kraken_name] = {
                        'precio': precio,
                        'cantidad': cantidad,
                        'valor': asset_data.get('portfolio_value', 0)
                    }
            last_entry['assets_con_valor'] = real_time_assets_con_valor
            last_entry['value'] = portfolio_value
            last_entry['cost'] = total_invested
        
        # 11. Tiempo total de procesamiento
        total_time = time.time() - start_time
        # print(f"⏱️ [TOTAL] Endpoint procesado en {total_time:.3f}s")
        
        # 12. Respuesta final
        response_data = {
            'portfolio_data': portfolio_array,
            'timeline': timeline_data,
            'asset_mapping': dynamic_asset_mapping,  # Include dynamic asset mapping for frontend
            'kpis': {
                'total_invested': total_invested,
                'current_value': portfolio_value,
                'profit': net_profit,
                'profit_percentage': net_profit_percentage,
                'fees': total_fees,
                'liquidity': liquidity,
                'realized_gains': realized_gains_total,
                'unrealized_gains': unrealized_gains_total,
                'unrealized_percentage': (unrealized_gains_total / total_invested * 100) if total_invested > 0 else 0
            },
            'data_source': 'csv_v2',
            'version': '2.0.0'
        }
        
        # Añadir información de tipos de operaciones si está disponible
        if 'operation_types_info' in globals() and operation_types_info:
            response_data['operation_types'] = operation_types_info
            
        return response_data
        
    except TimeoutError as e:
        signal.alarm(0)  # Cancelar timeout
        raise HTTPException(status_code=408, detail=str(e))
    except Exception as e:
        signal.alarm(0)  # Cancelar timeout
        return {"error": f"Error procesando CSV: {str(e)}"}
    finally:
        signal.alarm(0)  # Asegurar que se cancele el timeout

@app.get("/api/test")
async def test_functions():
    """Endpoint para probar las funciones modulares"""
    try:
        # Ejecutar las pruebas del main2.py
        df = pd.read_csv('trades.csv')
        
        portfolio_result = calcular_portfolio_value(trades_df=df, obtener_precios_externos=True)
        cost_basis_result = calcular_cost_basis(trades_df=df)
        
        return {
            "portfolio_value": portfolio_result.get('totales', {}),
            "cost_basis": cost_basis_result.get('totales', {}),
            "status": "success"
        }
    except Exception as e:
        return {"error": str(e)}

# =============================================================================
# FUNCIÓN PRINCIPAL Y PRUEBAS
# =============================================================================

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        # Modo pruebas
        print("🧪 Ejecutando pruebas...")
        ejecutar_todas_las_pruebas()
    else:
        # Modo servidor
        print("🚀 Iniciando Portfolio Visualizer v2...")
        uvicorn.run(app, host="0.0.0.0", port=8001)