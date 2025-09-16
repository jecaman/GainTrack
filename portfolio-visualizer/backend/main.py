from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import krakenex
from pykrakenapi import KrakenAPI
import pandas as pd
import time
import hashlib
import io
import requests
from kraken_pairs import get_eur_pairs
from datetime import datetime, timedelta, date
import asyncio
from threading import Thread, Lock
import json
from config import *
# from cost_calculator import calcular_realized_gains_fifo, calcular_unrealized_gains_fifo  # No longer needed
# Importar las nuevas funciones modulares del main2.py
from main2 import (
    calcular_portfolio_value,
    calcular_cost_basis,
    calcular_unrealized_gains,
    calcular_realized_gains,
    FIAT_ASSETS as FIAT_ASSETS_MAIN2
)

# =============================================================================
# CONFIGURACIÓN FASTAPI
# =============================================================================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# SISTEMA DE CACHE
# =============================================================================

# Cache para datos privados del usuario (por usuario)
private_cache = {}

# Cache global para datos públicos (compartido entre todos los usuarios)
public_cache = {}
public_cache_lock = Lock()

# Instancia global de Kraken para APIs públicas (sin credenciales)
public_kraken = None
public_kraken_api = None

# =============================================================================
# MODELOS DE DATOS
# =============================================================================

class PortfolioRequest(BaseModel):
    api_key: str
    api_secret: str

# =============================================================================
# FUNCIONES DE CACHE
# =============================================================================

def get_public_cache_key(operation, *args):
    """Genera clave de cache para operaciones públicas"""
    return f"public_{operation}_" + "_".join(str(arg) for arg in args)

def get_cached_public_data(cache_key):
    """Obtiene datos del cache público si existen y no han expirado"""
    with public_cache_lock:
        if cache_key in public_cache:
            data, timestamp = public_cache[cache_key]
            if time.time() - timestamp < PUBLIC_CACHE_DURATION:
                print(f"💾 Cache HIT público: {cache_key}")
                return data
            else:
                print(f"⏰ Cache EXPIRED público: {cache_key}")
                del public_cache[cache_key]
    return None

def store_cached_public_data(cache_key, data):
    """Almacena datos en el cache público"""
    with public_cache_lock:
        public_cache[cache_key] = (data, time.time())
        print(f"💾 Cache STORED público: {cache_key}")

# =============================================================================
# FUNCIONES DE KRAKEN API
# =============================================================================

def init_public_kraken():
    """Inicializa la instancia global de Kraken para APIs públicas"""
    global public_kraken, public_kraken_api
    try:
        public_kraken = krakenex.API()
        public_kraken_api = KrakenAPI(public_kraken)
        print("✅ Kraken público inicializado")
    except Exception as e:
        print(f"❌ Error inicializando Kraken público: {e}")

def generate_kraken_pairs_dynamically(asset):
    """
    Genera posibles pares de Kraken para un asset específico basado en patrones conocidos.
    
    Sistema de transformación Kraken:
    - Assets legacy (BTC, ETH, XRP, etc.): Usan prefijos XX/X y sufijo Z
    - Assets modernos (TRUMP, PEPE, etc.): Formato directo sin prefijos
    - El orden de patrones está optimizado por frecuencia de uso
    """
    if asset in DYNAMIC_PAIR_CACHE:
        return DYNAMIC_PAIR_CACHE[asset]
    
    # Verificar si el asset está en la lista de deslistados
    if asset in DELISTED_ASSETS:
        return None
    
    # Verificar cada patrón contra la lista oficial de pares
    available_pairs = get_eur_pairs()
    
    for pattern_template in KRAKEN_PAIR_PATTERNS:
        pattern = pattern_template.format(asset=asset)
        if pattern in available_pairs:
            DYNAMIC_PAIR_CACHE[asset] = pattern
            print(f"✅ Pair encontrado para {asset}: {pattern}")
            return pattern
    
    # Si no se encuentra ningún patrón válido, marcar como deslistado
    print(f"❌ No se encontró pair válido para {asset}, marcando como deslistado")
    DELISTED_ASSETS.add(asset)
    return None

def obtener_precios_diarios_cached(asset, start_date, end_date):
    """Obtiene precios históricos con cache público optimizado"""
    api_start = time.time()
    global public_kraken_api
    
    # Si el asset está en la lista de deslistados, no intentar buscarlo
    if asset in DELISTED_ASSETS:
        print(f"⚠️ Asset {asset} está en lista de deslistados, saltando...")
        return {}
    
    # TIMING: Cache lookup
    cache_start = time.time()
    cache_key = get_public_cache_key("ohlc", asset, start_date, end_date)
    cached_data = get_cached_public_data(cache_key)
    cache_time = time.time() - cache_start
    
    if cached_data is not None:
        print(f"💾 Cache HIT para {asset} ({cache_time:.3f}s)")
        return cached_data
    
    print(f"🌐 Cache MISS para {asset}, llamando API...")
    
    # Si no está en cache, obtener de Kraken
    if public_kraken_api is None:
        init_public_kraken()
        if public_kraken_api is None:
            return {}
    
    try:
        # TIMING: Pair generation
        pair_start = time.time()
        kraken_pair = generate_kraken_pairs_dynamically(asset)
        pair_time = time.time() - pair_start
        
        if not kraken_pair:
            print(f"❌ No se pudo generar par para {asset} ({pair_time:.3f}s)")
            return {}

        print(f"📡 Obteniendo OHLC para {asset} usando par: {kraken_pair}")
        
        # TIMING: API call
        api_call_start = time.time()
        api_result = public_kraken_api.get_ohlc_data(kraken_pair, interval=1440, ascending=True)
        api_call_time = time.time() - api_call_start
        
        # La API puede devolver una tupla (ohlc_data, last_timestamp)
        if isinstance(api_result, tuple):
            ohlc_data = api_result[0]
        else:
            ohlc_data = api_result
        
        if ohlc_data is None or ohlc_data.empty:
            print(f"❌ No se obtuvieron datos OHLC para {asset} ({api_call_time:.3f}s)")
            return {}
        
        # TIMING: Data processing
        processing_start = time.time()
        precios_diarios = {}
        for index, row in ohlc_data.iterrows():
            fecha = index.date()
            if start_date <= fecha <= end_date:
                precio_cierre = float(row['close'])
                precios_diarios[fecha] = precio_cierre
        
        processing_time = time.time() - processing_start
        
        primera_fecha_precios = min(precios_diarios.keys()) if precios_diarios else None
        ultima_fecha_precios = max(precios_diarios.keys()) if precios_diarios else None
        
        api_total_time = time.time() - api_start
        print(f"   ✅ {asset}: {len(precios_diarios)} precios ({primera_fecha_precios} → {ultima_fecha_precios}) en {api_total_time:.3f}s")
        print(f"      ├─ Pair generation: {pair_time:.3f}s")
        print(f"      ├─ API call: {api_call_time:.3f}s")
        print(f"      └─ Data processing: {processing_time:.3f}s")
        
        # CRÍTICO: Verificar si los precios llegan hasta hoy
        if ultima_fecha_precios and ultima_fecha_precios != end_date:
            print(f"   ⚠️ PROBLEMA: {asset} precios solo hasta {ultima_fecha_precios}, se solicitó hasta {end_date}")
        
        # Cachear el resultado
        store_cached_public_data(cache_key, precios_diarios)
        
        return precios_diarios

    except Exception as e:
        api_total_time = time.time() - api_start
        print(f"❌ Error obteniendo precios para {asset}: {e} ({api_total_time:.3f}s)")
        return {}

async def get_single_asset_price_async(session, asset):
    """Obtiene precio de un solo asset de forma asíncrona"""
    if asset in FIAT_ASSETS:
        return asset, 1.0
    
    # Generar par dinámicamente
    kraken_pair = generate_kraken_pairs_dynamically(asset)
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

async def get_public_kraken_prices_from_pairs_async(assets, asset_to_pair):
    """Obtiene precios actuales usando pares específicos - VERSION ASYNC"""
    if not assets:
        return {}
    
    try:
        import aiohttp
        
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
        
    except ImportError:
        # Fallback a versión síncrona si aiohttp no está disponible
        print("⚠️ aiohttp no disponible, usando versión síncrona")
        return get_public_kraken_prices_from_pairs_sync(assets, asset_to_pair)
    except Exception as e:
        print(f"❌ Error en get_public_kraken_prices_from_pairs_async: {e}")
        return {}

def get_public_kraken_prices_from_pairs_sync(assets, asset_to_pair):
    """Obtiene precios actuales usando pares específicos - VERSION SYNC (fallback)"""
    if not assets:
        return {}
    
    try:
        prices = {}
        
        for asset in assets:
            if asset in FIAT_ASSETS:
                prices[asset] = 1.0
                continue
            
            # Usar generate_kraken_pairs_dynamically en lugar del mapeo manual
            kraken_pair = generate_kraken_pairs_dynamically(asset)
            if not kraken_pair:
                prices[asset] = 0.0
                continue
            
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
                prices[asset] = 0.0
        
        return prices
        
    except Exception as e:
        return {}

def get_public_kraken_prices_from_pairs(assets, asset_to_pair):
    """Wrapper que decide entre async y sync"""
    start_time = time.time()
    try:
        print(f"📡 Iniciando obtención de precios para {len(assets)} assets...")
        
        # Intentar ejecutar versión async
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Si ya hay un loop corriendo, crear uno nuevo en thread
            import concurrent.futures
            print(f"🔄 Usando ThreadPoolExecutor para async...")
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, get_public_kraken_prices_from_pairs_async(assets, asset_to_pair))
                result = future.result()
        else:
            # Si no hay loop, usar asyncio.run
            print(f"🔄 Usando asyncio.run...")
            result = asyncio.run(get_public_kraken_prices_from_pairs_async(assets, asset_to_pair))
        
        total_time = time.time() - start_time
        successful_prices = len([p for p in result.values() if p > 0])
        print(f"⏱️ TIMING - Precios obtenidos: {total_time:.3f}s ({successful_prices}/{len(assets)} exitosos)")
        return result
        
    except Exception as e:
        print(f"⚠️ Error ejecutando versión async, fallback a sync: {e}")
        fallback_start = time.time()
        result = get_public_kraken_prices_from_pairs_sync(assets, asset_to_pair)
        fallback_time = time.time() - fallback_start
        successful_prices = len([p for p in result.values() if p > 0])
        print(f"⏱️ TIMING - Fallback sync: {fallback_time:.3f}s ({successful_prices}/{len(assets)} exitosos)")
        return result

# =============================================================================
# FUNCIONES DE PROCESAMIENTO
# =============================================================================

def process_trade_fifo(asset_lots, trade_type, vol, cost, timestamp, fee=0):
    """
    Procesa un trade usando método FIFO y devuelve el coste invertido resultante.
    
    Args:
        asset_lots: {'buy_lots': [], 'total_invested': 0}  (se modifica in-place)
        trade_type: 'buy' o 'sell'
        vol: cantidad de la operación
        cost: coste de la operación
        timestamp: fecha de la operación
        fee: fee de la operación (incluida en cost basis)
    
    Returns:
        float: coste actual invertido después de la operación
    """
    if trade_type == 'buy':
        # Agregar nuevo lote de compra a la cola FIFO (incluyendo fee en cost)
        cost_con_fee = cost + fee
        asset_lots['buy_lots'].append({
            'vol': vol,
            'cost': cost_con_fee,
            'cost_sin_fee': cost,
            'fee': fee,
            'timestamp': timestamp
        })
        asset_lots['total_invested'] += cost_con_fee
        
    else:  # sell
        # Consumir lotes FIFO hasta completar la venta
        remaining_to_sell = vol
        cost_to_remove = 0
        
        # Inicializar realized gains historical si no existe
        if 'realized_gains_historical' not in asset_lots:
            asset_lots['realized_gains_historical'] = 0
        
        while remaining_to_sell > 0 and asset_lots['buy_lots']:
            # Tomar el lote más antiguo (FIFO)
            oldest_lot = asset_lots['buy_lots'][0]
            
            if oldest_lot['vol'] <= remaining_to_sell:
                # Consumir todo el lote
                cost_to_remove += oldest_lot['cost']
                
                # Calcular realized gain para este lote
                sell_proceeds = (oldest_lot['vol'] / vol) * cost  # Proporción de la venta
                realized_gain = sell_proceeds - oldest_lot['cost']
                asset_lots['realized_gains_historical'] += realized_gain
                
                remaining_to_sell -= oldest_lot['vol']
                asset_lots['buy_lots'].pop(0)  # Eliminar lote consumido
                
            else:
                # Consumir parcialmente el lote
                cost_per_unit = oldest_lot['cost'] / oldest_lot['vol']
                partial_cost = remaining_to_sell * cost_per_unit
                cost_to_remove += partial_cost
                
                # Calcular realized gain para la parte vendida
                sell_proceeds = (remaining_to_sell / vol) * cost
                realized_gain = sell_proceeds - partial_cost
                asset_lots['realized_gains_historical'] += realized_gain
                
                # Actualizar el lote restante
                oldest_lot['vol'] -= remaining_to_sell
                oldest_lot['cost'] -= partial_cost
                remaining_to_sell = 0
        
        # Actualizar inversión total
        asset_lots['total_invested'] -= cost_to_remove
        
        # Si queda cantidad por vender sin lotes disponibles (venta en corto)
        if remaining_to_sell > 0:
            print(f"⚠️ Venta en corto detectada: {remaining_to_sell} unidades sin lotes de compra")
    
    return asset_lots['total_invested']

def create_portfolio_data_from_trades_enhanced_v2(trades_df, balances, current_prices):
    """Crear datos de portfolio usando las nuevas funciones modulares del main2.py"""
    
    # 1. Calcular Portfolio Value usando nueva función modular
    portfolio_result = calcular_portfolio_value(
        trades_df=trades_df,
        precios_actuales=current_prices,
        obtener_precios_externos=False
    )
    
    # 2. Calcular Cost Basis usando nueva función modular  
    cost_basis_result = calcular_cost_basis(trades_df=trades_df)
    
    # 3. Calcular Unrealized Gains usando nueva función modular
    unrealized_result = calcular_unrealized_gains(portfolio_result, cost_basis_result)
    
    # 4. Calcular Realized Gains usando nueva función modular
    realized_result = calcular_realized_gains(trades_df=trades_df)
    
    # 5. Extraer totales de los resultados
    portfolio_value = portfolio_result.get('totales', {}).get('total_portfolio_value', 0)
    total_invested_fifo = cost_basis_result.get('totales', {}).get('total_cost_basis', 0) 
    unrealized_gains_total = unrealized_result.get('totales', {}).get('total_unrealized_gains', 0)
    realized_gains_total = realized_result.get('totales', {}).get('total_realized_gains', 0)
    total_fees = cost_basis_result.get('totales', {}).get('total_fees', 0)
    
    # 6. Extraer datos por asset
    portfolio_assets = portfolio_result.get('assets', {})
    cost_basis_assets = cost_basis_result.get('assets', {})
    unrealized_assets = unrealized_result.get('assets', {}) 
    realized_assets = realized_result.get('assets', {})
    
    # 7. Crear portfolio array usando los resultados de las funciones modulares
    portfolio_array = []
    
    # Combinar datos de todas las fuentes (portfolio, cost basis, unrealized, realized)
    all_assets = set()
    all_assets.update(portfolio_assets.keys())
    all_assets.update(cost_basis_assets.keys()) 
    all_assets.update(unrealized_assets.keys())
    all_assets.update(realized_assets.keys())
    all_assets.update(balances.keys())
    
    for asset in all_assets:
        # Datos del portfolio value
        portfolio_data = portfolio_assets.get(asset, {})
        current_value = portfolio_data.get('portfolio_value', 0)
        current_price = portfolio_data.get('precio_actual', current_prices.get(asset, 1.0 if asset in FIAT_ASSETS_MAIN2 else 0))
        amount = portfolio_data.get('cantidad_actual', balances.get(asset, 0))
        
        # Datos del cost basis
        cost_data = cost_basis_assets.get(asset, {})
        total_invested = cost_data.get('cost_basis', 0)
        fees_paid = cost_data.get('fees_incluidos', 0)
        
        # Datos de unrealized gains
        unrealized_data = unrealized_assets.get(asset, {})
        unrealized_gains_asset = unrealized_data.get('unrealized_gains', 0)
        
        # Datos de realized gains  
        realized_data = realized_assets.get(asset, {})
        realized_gains_asset = realized_data.get('realized_gains', 0)
        
        # Calcular net profit y porcentajes
        net_profit_asset = realized_gains_asset + unrealized_gains_asset
        pnl_eur = current_value - total_invested  # PnL tradicional
        
        # Porcentajes
        pnl_percent = (pnl_eur / total_invested * 100) if total_invested > 0 else 0
        net_profit_percent = (net_profit_asset / total_invested * 100) if total_invested > 0 else 0
        
        # Solo incluir assets con balance o historial de trading
        if amount > 0 or total_invested > 0 or realized_gains_asset != 0:
            portfolio_array.append({
                'asset': asset,
                'asset_type': 'fiat' if asset in FIAT_ASSETS_MAIN2 else 'crypto',
                'amount': amount,
                'current_price': current_price,
                'total_invested': total_invested,
                'fees_paid': fees_paid,
                'current_value': current_value,
                'pnl_eur': pnl_eur,
                'pnl_percent': max(-999.99, min(999.99, pnl_percent)),
                # Nuevos campos usando funciones modulares
                'realized_gains': realized_gains_asset,
                'unrealized_gains': unrealized_gains_asset,
                'net_profit': net_profit_asset,
                'net_profit_percent': max(-999.99, min(999.99, net_profit_percent))
            })
    
    # 8. Calcular KPIs consolidados
    crypto_value = sum(item['current_value'] for item in portfolio_array if item['asset_type'] == 'crypto')
    liquidity = sum(item['current_value'] for item in portfolio_array if item['asset_type'] == 'fiat')
    net_profit = realized_gains_total + unrealized_gains_total
    net_profit_percentage = (net_profit / total_invested_fifo * 100) if total_invested_fifo > 0 else 0
    
    
    return {
        'portfolio_data': portfolio_array,
        'kpis': {
            'total_invested': total_invested_fifo,  # Solo assets retenidos (FIFO)
            'current_value': portfolio_value,       # Valor actual de mercado
            'profit': net_profit,                   # Net Profit = Realized + Unrealized
            'profit_percentage': net_profit_percentage,
            'fees': total_fees,
            'liquidity': liquidity,
            # Nuevos KPIs detallados
            'realized_gains': realized_gains_total,
            'unrealized_gains': unrealized_gains_total,
            'unrealized_percentage': (unrealized_gains_total / total_invested_fifo * 100) if total_invested_fifo > 0 else 0
        },
        'data_source': 'csv'
    }

def create_portfolio_data_from_trades(trades_df, balances, current_prices):
    """Wrapper para mantener compatibilidad - usa versión mejorada con funciones modulares"""
    return create_portfolio_data_from_trades_enhanced_v2(trades_df, balances, current_prices)

def calcular_holdings_diarios_csv(trades_df, current_prices=None):
    """Calcula los holdings diarios desde el primer trade hasta HOY
    
    Args:
        trades_df: DataFrame con los trades
        current_prices: Dict con precios actuales para usar en el último día
    """
    start_time = time.time()
    if trades_df.empty:
        return []
    
    # TIMING: Preparación inicial
    prep_start = time.time()
    trades_df = trades_df.sort_values('time').copy()
    
    # Obtener rango de fechas - SIEMPRE hasta HOY
    fecha_minima = trades_df['time'].min().date()
    fecha_ultimo_trade = trades_df['time'].max().date()
    today = date.today()
    
    print(f"🔍 TIMELINE DEBUG:")
    print(f"   Primer trade: {fecha_minima}")
    print(f"   Último trade: {fecha_ultimo_trade}")
    print(f"   Fecha actual: {today}")
    print(f"   ¿Debería extenderse? {fecha_ultimo_trade < today}")
    
    # Obtener assets únicos para precios históricos
    assets_unicos = set()
    for _, trade in trades_df.iterrows():
        pair = str(trade['pair'])
        asset = pair.replace('ZEUR', '').replace('EUR', '').replace('USD', '').replace('GBP', '').replace('CAD', '').rstrip('/')
        if asset == pair:
            asset = pair
        assets_unicos.add(asset)
    
    prep_time = time.time() - prep_start
    print(f"⏱️ TIMING - Preparación timeline: {prep_time:.3f}s")
    
    # TIMING: Obtención de precios históricos
    historical_prices_start = time.time()
    precios_historicos = {}
    print(f"📡 Obteniendo precios históricos para {len(assets_unicos)} assets...")
    
    for i, asset in enumerate(assets_unicos):
        asset_start = time.time()
        if i > 0:
            time.sleep(0.5)
        
        precios = obtener_precios_diarios_cached(asset, fecha_minima, today)
        asset_time = time.time() - asset_start
        
        if precios:
            precios_historicos[asset] = precios
            print(f"   ✅ {asset}: {len(precios)} precios obtenidos en {asset_time:.3f}s")
        else:
            print(f"   ⚠️ {asset}: No se pudieron obtener precios históricos ({asset_time:.3f}s)")
    
    historical_prices_time = time.time() - historical_prices_start
    print(f"⏱️ TIMING - Precios históricos totales: {historical_prices_time:.3f}s")
    
    # TIMING: Generación de timeline día por día
    timeline_generation_start = time.time()
    fecha_actual = fecha_minima
    timeline = []
    holdings_por_asset = {}  # {asset: {'buy_lots': [], 'total_invested': 0, 'fees': 0, 'cantidad': 0}}
    
    days_to_process = (today - fecha_minima).days + 1
    print(f"📅 Procesando {days_to_process} días de timeline...")
    
    day_count = 0
    while fecha_actual <= today:
        fecha_str = fecha_actual.strftime('%Y-%m-%d')
        
        # Procesar trades de este día
        trades_del_dia = trades_df[trades_df['time'].dt.date == fecha_actual]
        
        # Rastrear ventas del día
        ventas_del_dia = []
        
        for _, trade in trades_del_dia.iterrows():
            pair = str(trade['pair'])
            asset = pair.replace('ZEUR', '').replace('EUR', '').replace('USD', '').replace('GBP', '').replace('CAD', '').rstrip('/')
            if asset == pair:
                asset = pair
            
            if asset not in holdings_por_asset:
                holdings_por_asset[asset] = {
                    'buy_lots': [],
                    'total_invested': 0,
                    'total_invested_historical': 0,
                    'fees': 0,
                    'cantidad': 0,
                    'realized_gains_historical': 0
                }
            
            vol = float(trade['vol'])
            cost = float(trade['cost'])
            fee = float(trade['fee'])
            timestamp = trade['time']
            
            # Si es una venta, guardar información para el tooltip
            if trade['type'] == 'sell':
                # Calcular realized gain de esta venta antes de procesarla
                realized_gain_before = holdings_por_asset[asset].get('realized_gains_historical', 0)
                
                # Procesar la venta
                process_trade_fifo(holdings_por_asset[asset], trade['type'], vol, cost, timestamp, fee)
                
                # Calcular realized gain de esta venta específica
                realized_gain_after = holdings_por_asset[asset].get('realized_gains_historical', 0)
                realized_gain_this_sale = realized_gain_after - realized_gain_before
                
                ventas_del_dia.append({
                    'asset': asset,
                    'volume': vol,
                    'cost': cost,  # Ingresos de la venta
                    'fee': fee,
                    'realized_gain': realized_gain_this_sale,
                    'timestamp': timestamp
                })
            else:
                # Procesar compra normalmente
                process_trade_fifo(holdings_por_asset[asset], trade['type'], vol, cost, timestamp, fee)
            
            holdings_por_asset[asset]['fees'] += fee
            
            # Actualizar cantidad total (para balance)
            if trade['type'] == 'buy':
                holdings_por_asset[asset]['cantidad'] += vol
                holdings_por_asset[asset]['total_invested_historical'] += cost + fee
            else:
                holdings_por_asset[asset]['cantidad'] -= vol
        
        # Calcular totales del día usando FIFO
        coste_total_dia = sum(holding["total_invested"] for holding in holdings_por_asset.values() if holding["cantidad"] > 0)
        fees_total_dia = sum(holding["fees"] for holding in holdings_por_asset.values() if holding["cantidad"] > 0)
        
        # Calcular valor de mercado - usar precios actuales para el último día
        valor_mercado_dia = 0.0
        unrealized_gains_dia = 0.0
        is_last_day = (day_count == days_to_process - 1)
        
        for asset, holding in holdings_por_asset.items():
            if holding["cantidad"] > 0:
                if is_last_day and current_prices and asset in current_prices:
                    # Último día: usar precio actual para coincidir con KPIs
                    precio_actual = current_prices[asset]
                else:
                    # Días anteriores: usar precio histórico
                    precio_actual = precios_historicos.get(asset, {}).get(fecha_actual, 0)
                
                valor_actual = holding["cantidad"] * precio_actual
                valor_mercado_dia += valor_actual
                
                # Calcular unrealized gains para este asset
                costo_base = holding.get("total_invested", 0)
                unrealized_gain_asset = valor_actual - costo_base
                unrealized_gains_dia += unrealized_gain_asset
        
        # Calcular realized gains acumulados hasta esta fecha
        realized_gains_dia = sum(holding.get("realized_gains_historical", 0) for holding in holdings_por_asset.values())
        
        # Total gains = realized + unrealized
        total_gains_dia = realized_gains_dia + unrealized_gains_dia
        
        # Calcular total_invested_fifo_dia (solo activos retenidos, homólogo a KPI)
        total_invested_fifo_dia = sum(holding["total_invested"] for holding in holdings_por_asset.values() if holding["cantidad"] > 0)
        total_gains_percent = (total_gains_dia / total_invested_fifo_dia * 100) if total_invested_fifo_dia > 0 else 0
        
        
        # Preparar información de ventas para el frontend
        sales_info = None
        if ventas_del_dia:
            # Ordenar ventas por volumen en euros (cost) descendente
            ventas_ordenadas = sorted(ventas_del_dia, key=lambda x: x['cost'], reverse=True)
            
            # Tomar máximo 5 ventas
            ventas_principales = ventas_ordenadas[:5]
            ventas_adicionales = len(ventas_ordenadas) - 5 if len(ventas_ordenadas) > 5 else 0
            
            # Calcular totales
            total_volume_eur = sum(venta['cost'] for venta in ventas_del_dia)
            total_realized_gain = sum(venta['realized_gain'] for venta in ventas_del_dia)
            
            sales_info = {
                "total_sales": len(ventas_del_dia),
                "total_volume_eur": round(total_volume_eur, 2),
                "total_realized_gain": round(total_realized_gain, 2),
                "sales": [
                    {
                        "asset": venta['asset'],
                        "volume": round(venta['volume'], 6),
                        "volume_eur": round(venta['cost'], 2),
                        "realized_gain": round(venta['realized_gain'], 2),
                        "fee": round(venta['fee'], 2)
                    }
                    for venta in ventas_principales
                ],
                "additional_sales": ventas_adicionales
            }
        
        dia_data = {
            "date": fecha_str,
            "cost": round(total_invested_fifo_dia, 2),
            "value": round(valor_mercado_dia, 2),
            "fees": round(fees_total_dia, 2),
            "realized_gains": round(realized_gains_dia, 2),
            "unrealized_gains": round(unrealized_gains_dia, 2),
            "net_profit": round(total_gains_dia, 2),
            "net_profit_percent": round(total_gains_percent, 2),
            "sales": sales_info  # Nueva información de ventas
        }
        
        timeline.append(dia_data)
        
        # Avanzar al siguiente día
        fecha_actual += timedelta(days=1)
        day_count += 1
        
        # Progress cada 30 días
        if day_count % 30 == 0:
            progress = (day_count / days_to_process) * 100
            print(f"   📅 Progreso timeline: {progress:.1f}% ({day_count}/{days_to_process} días)")
    
    timeline_generation_time = time.time() - timeline_generation_start
    print(f"⏱️ TIMING - Generación timeline: {timeline_generation_time:.3f}s")
    
    # DEBUG: Verificar rango final del timeline
    if timeline:
        primera_fecha = timeline[0]['date']
        ultima_fecha = timeline[-1]['date']
        print(f"🔍 TIMELINE GENERADO:")
        print(f"   Primera fecha: {primera_fecha}")
        print(f"   Última fecha: {ultima_fecha}")
        print(f"   Total días: {len(timeline)}")
        print(f"   ¿Llega hasta hoy ({today})? {ultima_fecha == today.strftime('%Y-%m-%d')}")
    
    total_time = time.time() - start_time
    print(f"⏱️ TIMING - TOTAL calcular_holdings_diarios_csv: {total_time:.3f}s")
    
    return timeline

def process_trades_csv(df):
    """Procesa CSV de Trades History"""
    start_time = time.time()
    try:
        # TIMING: Validación de columnas
        validation_start = time.time()
        required_columns = ['txid', 'time', 'type', 'pair', 'price', 'cost', 'fee', 'vol']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return {"error": f"Invalid Trades CSV format. Missing required columns: {missing_columns}"}
        
        df['time'] = pd.to_datetime(df['time'])
        trades_df = df[df['type'].isin(['buy', 'sell'])].copy()
        validation_time = time.time() - validation_start
        print(f"⏱️ TIMING - Validación y preparación: {validation_time:.3f}s")
        
        # TIMING: Cálculo de balances
        balance_start = time.time()
        balances = {}
        asset_to_pair = {}
        
        for _, row in trades_df.iterrows():
            pair = str(row['pair'])
            asset = pair.replace('ZEUR', '').replace('EUR', '').replace('USD', '').replace('GBP', '').replace('CAD', '').rstrip('/')
            if asset == pair:
                asset = pair
            
            asset_to_pair[asset] = pair
            vol = float(row['vol'])
            
            if row['type'] == 'buy':
                balances[asset] = balances.get(asset, 0) + vol
            else:
                balances[asset] = balances.get(asset, 0) - vol
        
        balance_time = time.time() - balance_start
        print(f"⏱️ TIMING - Cálculo balances: {balance_time:.3f}s")
        
        # TIMING: Obtención de precios actuales
        prices_start = time.time()
        assets_with_balance = [asset for asset, balance in balances.items() if balance > 0]
        print(f"📡 Obteniendo precios para {len(assets_with_balance)} assets...")
        current_prices = get_public_kraken_prices_from_pairs(assets_with_balance, asset_to_pair)
        prices_time = time.time() - prices_start
        print(f"⏱️ TIMING - Obtención precios actuales: {prices_time:.3f}s")
        
        # TIMING: Creación de datos de portfolio
        portfolio_start = time.time()
        portfolio_result = create_portfolio_data_from_trades(trades_df, balances, current_prices)
        portfolio_time = time.time() - portfolio_start
        print(f"⏱️ TIMING - Creación portfolio: {portfolio_time:.3f}s")
        
        # TIMING: Generación de timeline
        timeline_start = time.time()
        print(f"📈 Generando timeline histórico...")
        timeline_data = calcular_holdings_diarios_csv(trades_df, current_prices)
        timeline_time = time.time() - timeline_start
        print(f"⏱️ TIMING - Generación timeline: {timeline_time:.3f}s")
        
        portfolio_result["timeline"] = timeline_data
        
        total_time = time.time() - start_time
        print(f"⏱️ TIMING - TOTAL process_trades_csv: {total_time:.3f}s")
        return portfolio_result
        
    except Exception as e:
        return {"error": f"Error processing Trades CSV: {str(e)}"}

def process_csv_data(csv_content):
    """Procesa los datos del CSV de Kraken"""
    start_time = time.time()
    try:
        # TIMING: Parseo del CSV
        parse_start = time.time()
        print(f"🔍 Parseando CSV...")
        df = pd.read_csv(io.StringIO(csv_content))
        parse_time = time.time() - parse_start
        print(f"⏱️ TIMING - Parseo CSV: {parse_time:.3f}s")
        print(f"🔍 CSV parseado: {df.shape[0]} filas, {df.shape[1]} columnas")
        print(f"🔍 Columnas encontradas: {list(df.columns)}")
        
        # Solo soportamos Trades CSV por ahora
        if 'txid' in df.columns and 'pair' in df.columns:
            print(f"🔍 Formato de Trades detectado, procesando...")
            
            # TIMING: Procesamiento de trades
            trades_start = time.time()
            result = process_trades_csv(df)
            trades_time = time.time() - trades_start
            print(f"⏱️ TIMING - Procesamiento trades: {trades_time:.3f}s")
            
            print(f"🔍 Resultado del procesamiento: {type(result)}")
            if isinstance(result, dict) and "error" in result:
                print(f"❌ Error en process_trades_csv: {result['error']}")
            
            total_time = time.time() - start_time
            print(f"⏱️ TIMING - TOTAL process_csv_data: {total_time:.3f}s")
            return result
        else:
            error_msg = "Invalid CSV format. Please use Trades History export from Kraken"
            print(f"❌ {error_msg}")
            return {"error": error_msg}
    
    except Exception as e:
        error_msg = f"Error processing CSV: {str(e)}"
        print(f"❌ Exception en process_csv_data: {error_msg}")
        return {"error": error_msg}

# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/api/health")
async def health_check():
    """Endpoint para verificar que el servidor funciona"""
    return {"status": "ok", "message": "Server is running"}

@app.get("/api/trades/date-range")
async def get_trades_date_range():
    """Obtiene las fechas de inicio y fin de todos los trades"""
    try:
        # Leer el archivo CSV de trades histórico
        trades_df = pd.read_csv('trades.csv')
        
        if trades_df.empty:
            return {"error": "No trades data available"}
        
        # Convertir columna de tiempo a datetime
        trades_df['time'] = pd.to_datetime(trades_df['time'])
        
        # Obtener fecha mínima y fecha actual
        start_date = trades_df['time'].min().strftime('%Y-%m-%d')
        end_date = date.today().strftime('%Y-%m-%d')
        
        return {
            "start_date": start_date,
            "end_date": end_date,
            "total_trades": len(trades_df)
        }
        
    except FileNotFoundError:
        return {"error": "Trades file not found"}
    except Exception as e:
        return {"error": f"Error reading trades data: {str(e)}"}

@app.post("/api/portfolio/csv-debug")
async def upload_csv_debug(request: Request):
    """Endpoint de debug para ver qué recibimos"""
    try:
        print(f"📤 DEBUG REQUEST - Headers: {dict(request.headers)}")
        print(f"📤 DEBUG REQUEST - Method: {request.method}")
        print(f"📤 DEBUG REQUEST - URL: {request.url}")
        
        form = await request.form()
        print(f"📤 DEBUG FORM - Keys: {list(form.keys())}")
        
        for key, value in form.items():
            print(f"📤 DEBUG FORM - {key}: {type(value)} - {str(value)[:100]}...")
        
        return {"debug": "ok", "form_keys": list(form.keys())}
        
    except Exception as e:
        print(f"❌ DEBUG Exception: {e}")
        import traceback
        print(f"❌ DEBUG Traceback: {traceback.format_exc()}")
        return {"error": str(e)}

@app.post("/api/portfolio/csv")
async def upload_csv(csv_file: UploadFile = File()):
    """Endpoint para procesar CSV de Kraken"""
    start_time = time.time()
    try:
        print(f"📤 INICIO - Recibiendo archivo: {csv_file.filename if csv_file else 'None'}")
        print(f"📤 Content-Type: {csv_file.content_type if csv_file else 'None'}")
        print(f"📤 Size: {csv_file.size if hasattr(csv_file, 'size') else 'Unknown'}")
        
        if not csv_file:
            print("❌ No se recibió archivo")
            return {"error": "No file provided"}
        
        if not csv_file.filename:
            print("❌ Archivo sin nombre")
            return {"error": "File has no filename"}
        
        # TIMING: Lectura del archivo
        read_start = time.time()    
        content = await csv_file.read()
        read_time = time.time() - read_start
        print(f"⏱️ TIMING - Lectura archivo: {read_time:.3f}s - {len(content)} bytes")
        
        if len(content) == 0:
            print("❌ Archivo vacío")
            return {"error": "File is empty"}
        
        # TIMING: Decodificación
        decode_start = time.time()
        try:
            csv_content = content.decode('utf-8')
            decode_time = time.time() - decode_start
            print(f"⏱️ TIMING - Decodificación: {decode_time:.3f}s - {len(csv_content)} caracteres")
        except UnicodeDecodeError as e:
            print(f"❌ Error de decodificación: {e}")
            return {"error": f"File encoding error: {str(e)}"}
        
        # TIMING: Procesamiento completo
        processing_start = time.time()
        print("📤 Iniciando procesamiento...")
        result = process_csv_data(csv_content)
        processing_time = time.time() - processing_start
        print(f"⏱️ TIMING - Procesamiento total: {processing_time:.3f}s")
        
        if isinstance(result, dict) and "error" in result:
            print(f"❌ Error en procesamiento: {result['error']}")
            return {"error": result["error"]}
        
        total_time = time.time() - start_time
        print(f"⏱️ TIMING - TOTAL ENDPOINT: {total_time:.3f}s")
        print(f"✅ CSV procesado exitosamente")
        return result
        
    except Exception as e:
        error_msg = f"Error processing file: {str(e)}"
        print(f"❌ Exception en upload_csv: {error_msg}")
        print(f"❌ Exception type: {type(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return {"error": error_msg}

# =============================================================================
# INICIALIZACIÓN
# =============================================================================

if __name__ == "__main__":
    print("🚀 Iniciando servidor Portfolio Visualizer...")
    print("📊 Backend disponible en: http://localhost:8000")
    print("🌐 Frontend disponible en: http://localhost:5173")
    print("📖 Documentación API: http://localhost:8000/docs")
    print("=" * 50)
    
    print("🔧 Inicializando APIs públicas...")
    init_public_kraken()
    
    uvicorn.run(app, host="0.0.0.0", port=8000)