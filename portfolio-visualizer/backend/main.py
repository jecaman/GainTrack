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
from cost_calculator import calcular_realized_gains_fifo, calcular_unrealized_gains_fifo

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
    global public_kraken_api
    
    # Si el asset está en la lista de deslistados, no intentar buscarlo
    if asset in DELISTED_ASSETS:
        print(f"⚠️ Asset {asset} está en lista de deslistados, saltando...")
        return {}
    
    # Generar clave de cache
    cache_key = get_public_cache_key("ohlc", asset, start_date, end_date)
    
    # Intentar obtener del cache primero
    cached_data = get_cached_public_data(cache_key)
    if cached_data is not None:
        return cached_data
    
    # Si no está en cache, obtener de Kraken
    if public_kraken_api is None:
        init_public_kraken()
        if public_kraken_api is None:
            return {}
    
    try:
        # Generar par dinámicamente
        kraken_pair = generate_kraken_pairs_dynamically(asset)
        if not kraken_pair:
            print(f"❌ No se pudo generar par para {asset}")
            return {}

        print(f"📡 Obteniendo OHLC para {asset} usando par: {kraken_pair}")
        
        # Llamar a la API de Kraken para obtener OHLC
        api_result = public_kraken_api.get_ohlc_data(kraken_pair, interval=1440, ascending=True)
        
        # La API puede devolver una tupla (ohlc_data, last_timestamp)
        if isinstance(api_result, tuple):
            ohlc_data = api_result[0]
        else:
            ohlc_data = api_result
        
        if ohlc_data is None or ohlc_data.empty:
            print(f"❌ No se obtuvieron datos OHLC para {asset}")
            return {}
        
        # Convertir a diccionario de fechas -> precios
        precios_diarios = {}
        for index, row in ohlc_data.iterrows():
            fecha = index.date()
            if start_date <= fecha <= end_date:
                precio_cierre = float(row['close'])
                precios_diarios[fecha] = precio_cierre
        
        primera_fecha_precios = min(precios_diarios.keys())
        ultima_fecha_precios = max(precios_diarios.keys())
        print(f"   {asset}: {len(precios_diarios)} precios desde {primera_fecha_precios} hasta {ultima_fecha_precios}")
        
        # CRÍTICO: Verificar si los precios llegan hasta hoy
        if ultima_fecha_precios != end_date:
            print(f"   ⚠️ PROBLEMA: {asset} precios solo hasta {ultima_fecha_precios}, se solicitó hasta {end_date}")
        
        # Cachear el resultado
        store_cached_public_data(cache_key, precios_diarios)
        
        return precios_diarios

    except Exception as e:
        print(f"❌ Error obteniendo precios para {asset}: {e}")
        return {}

def get_public_kraken_prices_from_pairs(assets, asset_to_pair):
    """Obtiene precios actuales usando pares específicos"""
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
                time.sleep(0.5)  # Rate limiting
                
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
        
        while remaining_to_sell > 0 and asset_lots['buy_lots']:
            # Tomar el lote más antiguo (FIFO)
            oldest_lot = asset_lots['buy_lots'][0]
            
            if oldest_lot['vol'] <= remaining_to_sell:
                # Consumir todo el lote
                cost_to_remove += oldest_lot['cost']
                remaining_to_sell -= oldest_lot['vol']
                asset_lots['buy_lots'].pop(0)  # Eliminar lote consumido
                
            else:
                # Consumir parcialmente el lote
                cost_per_unit = oldest_lot['cost'] / oldest_lot['vol']
                partial_cost = remaining_to_sell * cost_per_unit
                cost_to_remove += partial_cost
                
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

def create_portfolio_data_from_trades_enhanced(trades_df, balances, current_prices):
    """Crear datos de portfolio con KPIs mejorados (Realized/Unrealized)"""
    import io
    
    # Convertir trades_df a CSV string para usar las funciones de cost_calculator
    csv_buffer = io.StringIO()
    trades_df.to_csv(csv_buffer, index=False)
    csv_content = csv_buffer.getvalue()
    
    # Calcular Realized Gains por activo
    realized_result = calcular_realized_gains_fifo(csv_content)
    realized_gains_total = realized_result.get('totales', {}).get('total_realized_gains', 0) if 'error' not in realized_result else 0
    realized_gains_by_asset = realized_result.get('assets', {}) if 'error' not in realized_result else {}
    
    # Calcular Unrealized Gains por activo
    unrealized_result = calcular_unrealized_gains_fifo(csv_content, current_prices)
    unrealized_gains_total = unrealized_result.get('totales', {}).get('total_unrealized_gains', 0) if 'error' not in unrealized_result else 0
    portfolio_value = unrealized_result.get('totales', {}).get('total_portfolio_value', 0) if 'error' not in unrealized_result else 0
    total_invested_fifo = unrealized_result.get('totales', {}).get('total_invested', 0) if 'error' not in unrealized_result else 0
    unrealized_gains_by_asset = unrealized_result.get('assets', {}) if 'error' not in unrealized_result else {}
    
    # Crear datos usando método FIFO original para compatibilidad
    asset_data = {}
    trades_df = trades_df.sort_values('time').copy()
    
    for _, row in trades_df.iterrows():
        pair = str(row['pair'])
        asset = pair.replace('ZEUR', '').replace('EUR', '').replace('USD', '').replace('GBP', '').replace('CAD', '').rstrip('/')
        if asset == pair:
            asset = pair
        
        if asset not in asset_data:
            asset_data[asset] = {
                'buy_lots': [],
                'total_invested': 0,
                'total_invested_historical': 0,  # Nueva: inversión total histórica
                'fees': 0
            }
        
        cost = float(row['cost'])
        fee = float(row['fee']) if pd.notna(row['fee']) else 0.0
        vol = float(row['vol'])
        timestamp = row['time']
        
        process_trade_fifo(asset_data[asset], row['type'], vol, cost, timestamp, fee)
        asset_data[asset]['fees'] += fee
        
        # Rastrear inversión histórica total (solo en compras)
        if row['type'] == 'buy':
            asset_data[asset]['total_invested_historical'] += cost + fee
    
    # Crear portfolio array con realized/unrealized gains por activo
    portfolio_array = []
    for asset, balance in balances.items():
        current_price = current_prices.get(asset, 1.0 if asset in FIAT_ASSETS else 0)
        current_value = balance * current_price
        
        invested = asset_data.get(asset, {}).get('total_invested', 0)
        invested_historical = asset_data.get(asset, {}).get('total_invested_historical', 0)
        fees = asset_data.get(asset, {}).get('fees', 0)
        
        # Obtener realized_gains y unrealized_gains por activo individual
        realized_gains_asset = realized_gains_by_asset.get(asset, {}).get('realized_gains', 0)
        unrealized_gains_asset = unrealized_gains_by_asset.get(asset, {}).get('unrealized_gains', 0)
        
        # Net profit por activo = realized + unrealized
        net_profit_asset = realized_gains_asset + unrealized_gains_asset
        # Calcular porcentaje sobre inversión histórica total, no sobre inversión restante
        if invested_historical > 0:
            net_profit_percent_asset = (net_profit_asset / invested_historical * 100)
            # Limitar porcentaje a un rango razonable
            net_profit_percent_asset = max(-999.99, min(999.99, net_profit_percent_asset))
        else:
            net_profit_percent_asset = 0
        
        portfolio_array.append({
            'asset': asset,
            'asset_type': 'fiat' if asset in FIAT_ASSETS else 'crypto',
            'amount': balance,
            'current_price': current_price,
            'total_invested': invested,
            'fees_paid': fees,
            'current_value': current_value,
            'pnl_eur': current_value - invested,  # Ya incluye fees en invested
            'pnl_percent': (net_profit_asset / invested * 100) if invested > 0 else 0,
            # Nuevos campos por activo
            'realized_gains': realized_gains_asset,
            'unrealized_gains': unrealized_gains_asset,
            'net_profit': net_profit_asset,
            'net_profit_percent': net_profit_percent_asset
        })
    
    # Calcular KPIs tradicionales
    total_fees = sum(item['fees_paid'] for item in portfolio_array)
    crypto_value = sum(item['current_value'] for item in portfolio_array if item['asset_type'] == 'crypto')
    liquidity = sum(item['current_value'] for item in portfolio_array if item['asset_type'] == 'fiat')
    current_value = crypto_value + liquidity
    
    # Net Profit = Realized + Unrealized
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
    """Wrapper para mantener compatibilidad - usa versión mejorada"""
    return create_portfolio_data_from_trades_enhanced(trades_df, balances, current_prices)

def calcular_holdings_diarios_csv(trades_df):
    """Calcula los holdings diarios desde el primer trade hasta HOY"""
    if trades_df.empty:
        return []
    
    # Ordenar trades por fecha
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
    
    # Obtener precios históricos para todos los assets
    precios_historicos = {}
    for i, asset in enumerate(assets_unicos):
        if i > 0:
            time.sleep(2)
        
        precios = obtener_precios_diarios_cached(asset, fecha_minima, today)
        if precios:
            precios_historicos[asset] = precios
        else:
            print(f"⚠️ {asset}: No se pudieron obtener precios históricos")
    
    # Generar timeline día por día hasta HOY usando FIFO
    fecha_actual = fecha_minima
    timeline = []
    holdings_por_asset = {}  # {asset: {'buy_lots': [], 'total_invested': 0, 'fees': 0, 'cantidad': 0}}
    
    while fecha_actual <= today:
        fecha_str = fecha_actual.strftime('%Y-%m-%d')
        
        # Procesar trades de este día
        trades_del_dia = trades_df[trades_df['time'].dt.date == fecha_actual]
        
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
                    'cantidad': 0
                }
            
            vol = float(trade['vol'])
            cost = float(trade['cost'])
            fee = float(trade['fee'])
            timestamp = trade['time']
            
            # Usar función FIFO reutilizable
            process_trade_fifo(holdings_por_asset[asset], trade['type'], vol, cost, timestamp)
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
        
        # Calcular valor de mercado usando precios históricos
        valor_mercado_dia = 0.0
        for asset, holding in holdings_por_asset.items():
            if holding["cantidad"] > 0:
                precio_actual = precios_historicos.get(asset, {}).get(fecha_actual, 0)
                valor_actual = holding["cantidad"] * precio_actual
                valor_mercado_dia += valor_actual
        
        dia_data = {
            "date": fecha_str,
            "cost": round(coste_total_dia, 2),
            "value": round(valor_mercado_dia, 2),
            "fees": round(fees_total_dia, 2)
        }
        
        timeline.append(dia_data)
        
        # Avanzar al siguiente día
        fecha_actual += timedelta(days=1)
    
    # DEBUG: Verificar rango final del timeline
    if timeline:
        primera_fecha = timeline[0]['date']
        ultima_fecha = timeline[-1]['date']
        print(f"🔍 TIMELINE GENERADO:")
        print(f"   Primera fecha: {primera_fecha}")
        print(f"   Última fecha: {ultima_fecha}")
        print(f"   Total días: {len(timeline)}")
        print(f"   ¿Llega hasta hoy ({today})? {ultima_fecha == today.strftime('%Y-%m-%d')}")
    
    return timeline

def process_trades_csv(df):
    """Procesa CSV de Trades History"""
    try:
        required_columns = ['txid', 'time', 'type', 'pair', 'price', 'cost', 'fee', 'vol']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return {"error": f"Invalid Trades CSV format. Missing required columns: {missing_columns}"}
        
        df['time'] = pd.to_datetime(df['time'])
        trades_df = df[df['type'].isin(['buy', 'sell'])].copy()
        
        
        # Calcular balances actuales a partir de trades
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
        
        # Obtener precios actuales
        assets_with_balance = [asset for asset, balance in balances.items() if balance > 0]
        current_prices = get_public_kraken_prices_from_pairs(assets_with_balance, asset_to_pair)
        
        portfolio_result = create_portfolio_data_from_trades(trades_df, balances, current_prices)
        
        # Agregar timeline al resultado
        timeline_data = calcular_holdings_diarios_csv(trades_df)
        portfolio_result["timeline"] = timeline_data
        
        return portfolio_result
        
    except Exception as e:
        return {"error": f"Error processing Trades CSV: {str(e)}"}

def process_csv_data(csv_content):
    """Procesa los datos del CSV de Kraken"""
    try:
        print(f"🔍 Parseando CSV...")
        df = pd.read_csv(io.StringIO(csv_content))
        print(f"🔍 CSV parseado: {df.shape[0]} filas, {df.shape[1]} columnas")
        print(f"🔍 Columnas encontradas: {list(df.columns)}")
        
        # Solo soportamos Trades CSV por ahora
        if 'txid' in df.columns and 'pair' in df.columns:
            print(f"🔍 Formato de Trades detectado, procesando...")
            result = process_trades_csv(df)
            print(f"🔍 Resultado del procesamiento: {type(result)}")
            if isinstance(result, dict) and "error" in result:
                print(f"❌ Error en process_trades_csv: {result['error']}")
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
            
        content = await csv_file.read()
        print(f"📤 Contenido leído: {len(content)} bytes")
        
        if len(content) == 0:
            print("❌ Archivo vacío")
            return {"error": "File is empty"}
        
        try:
            csv_content = content.decode('utf-8')
            print(f"📤 Decodificado: {len(csv_content)} caracteres")
        except UnicodeDecodeError as e:
            print(f"❌ Error de decodificación: {e}")
            return {"error": f"File encoding error: {str(e)}"}
        
        print("📤 Iniciando procesamiento...")
        result = process_csv_data(csv_content)
        
        if isinstance(result, dict) and "error" in result:
            print(f"❌ Error en procesamiento: {result['error']}")
            return {"error": result["error"]}
        
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