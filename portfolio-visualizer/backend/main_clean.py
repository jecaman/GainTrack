from fastapi import FastAPI, UploadFile, File
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
    print(f"🔍 DEBUG obtener_precios_diarios_cached: {asset} desde {start_date} hasta {end_date}")
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
        ohlc_data = public_kraken_api.get_ohlc_data(kraken_pair, interval=1440, ascending=True)
        
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
        
        print(f"✅ {asset}: {len(precios_diarios)} precios históricos obtenidos")
        
        # Cachear el resultado
        store_cached_public_data(cache_key, precios_diarios)
        
        return precios_diarios

    except Exception as e:
        print(f"❌ Error obteniendo precios para {asset}: {e}")
        return {}

def get_public_kraken_prices_from_pairs(assets, asset_to_pair):
    """Obtiene precios actuales usando pares específicos"""
    print(f"🔍 get_public_kraken_prices_from_pairs: {assets}")
    
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
                print(f"⚠️ No se pudo obtener par para {asset}")
                prices[asset] = 0.0
                continue
            
            try:
                print(f"📡 Consultando precio actual para {asset} usando par: {kraken_pair}")
                time.sleep(0.5)  # Rate limiting
                
                url = f"https://api.kraken.com/0/public/Ticker?pair={kraken_pair}"
                response = requests.get(url, timeout=10)
                data = response.json()
                
                if 'result' in data and data['result']:
                    # La respuesta de Kraken puede tener el nombre del par ligeramente diferente
                    pair_data = next(iter(data['result'].values()))
                    price = float(pair_data['c'][0])  # Precio de cierre actual
                    prices[asset] = price
                    print(f"✅ {asset}: {price}€")
                else:
                    print(f"❌ No se encontraron datos para {asset}")
                    prices[asset] = 0.0
                    
            except Exception as e:
                print(f"❌ Error obteniendo precio para {asset}: {e}")
                prices[asset] = 0.0
        
        return prices
        
    except Exception as e:
        print(f"Exception in get_public_kraken_prices_from_pairs: {e}")
        return {}

# =============================================================================
# FUNCIONES DE PROCESAMIENTO
# =============================================================================

def create_portfolio_data_from_trades(trades_df, balances, current_prices):
    """Crear datos de portfolio a partir de trades"""
    asset_data = {}
    
    for _, row in trades_df.iterrows():
        pair = str(row['pair'])
        asset = pair.replace('ZEUR', '').replace('EUR', '').replace('USD', '').replace('GBP', '').replace('CAD', '').rstrip('/')
        if asset == pair:
            asset = pair
        
        if asset not in asset_data:
            asset_data[asset] = {'invested': 0, 'fees': 0, 'trades': []}
        
        cost = float(row['cost'])
        fee = float(row['fee']) if pd.notna(row['fee']) else 0.0
        
        if row['type'] == 'buy':
            asset_data[asset]['invested'] += cost
        else:
            asset_data[asset]['invested'] -= cost
        
        asset_data[asset]['fees'] += fee
    
    # Crear portfolio array
    portfolio_array = []
    for asset, balance in balances.items():
        current_price = current_prices.get(asset, 1.0 if asset in FIAT_ASSETS else 0)
        current_value = balance * current_price
        
        invested = asset_data.get(asset, {}).get('invested', 0)
        fees = asset_data.get(asset, {}).get('fees', 0)
        
        portfolio_array.append({
            'asset': asset,
            'asset_type': 'fiat' if asset in FIAT_ASSETS else 'crypto',
            'amount': balance,
            'current_price': current_price,
            'total_invested': invested,
            'fees_paid': fees,
            'current_value': current_value,
            'pnl_eur': current_value - invested - fees,
            'pnl_percent': ((current_value - invested - fees) / (invested + fees) * 100) if (invested + fees) > 0 else 0
        })
    
    # Calcular KPIs
    total_invested = sum(item['total_invested'] for item in portfolio_array if item['asset_type'] == 'crypto')
    total_fees = sum(item['fees_paid'] for item in portfolio_array)
    crypto_value = sum(item['current_value'] for item in portfolio_array if item['asset_type'] == 'crypto')
    liquidity = sum(item['current_value'] for item in portfolio_array if item['asset_type'] == 'fiat')
    current_value = crypto_value + liquidity
    profit = crypto_value - total_invested - total_fees
    profit_percentage = (profit / (total_invested + total_fees) * 100) if (total_invested + total_fees) > 0 else 0
    
    return {
        'portfolio_data': portfolio_array,
        'kpis': {
            'total_invested': total_invested,
            'current_value': current_value,
            'profit': profit,
            'profit_percentage': profit_percentage,
            'fees': total_fees,
            'liquidity': liquidity
        },
        'data_source': 'csv'
    }

def calcular_holdings_diarios_csv(trades_df):
    """Calcula los holdings diarios desde el primer trade hasta HOY"""
    print(f"📅 Calculando holdings diarios desde CSV con {len(trades_df)} trades...")
    
    if trades_df.empty:
        print("❌ No hay trades para calcular timeline")
        return []
    
    # Ordenar trades por fecha
    trades_df = trades_df.sort_values('time').copy()
    
    # Obtener rango de fechas - SIEMPRE hasta HOY
    fecha_minima = trades_df['time'].min().date()
    today = date.today()
    
    print(f"📅 Rango de fechas: {fecha_minima} -> {today}")
    print(f"🔍 DEBUG: Último trade: {trades_df['time'].max().date()}, Extendiéndose hasta: {today}")
    
    # Obtener assets únicos para precios históricos
    assets_unicos = set()
    for _, trade in trades_df.iterrows():
        pair = str(trade['pair'])
        asset = pair.replace('ZEUR', '').replace('EUR', '').replace('USD', '').replace('GBP', '').replace('CAD', '').rstrip('/')
        if asset == pair:
            asset = pair
        assets_unicos.add(asset)
    
    print(f"🎯 Assets únicos encontrados: {list(assets_unicos)}")
    
    # Obtener precios históricos para todos los assets
    precios_historicos = {}
    for i, asset in enumerate(assets_unicos):
        print(f"📈 Obteniendo precios históricos para {asset}...")
        
        if i > 0:
            print("⏱️ Esperando 2 segundos para evitar rate limiting...")
            time.sleep(2)
        
        precios = obtener_precios_diarios_cached(asset, fecha_minima, today)
        if precios:
            precios_historicos[asset] = precios
            print(f"✅ {asset}: {len(precios)} días de precios obtenidos")
        else:
            print(f"⚠️ {asset}: No se pudieron obtener precios")
    
    # Generar timeline día por día hasta HOY
    fecha_actual = fecha_minima
    timeline = []
    holdings_por_asset = {}
    
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
                holdings_por_asset[asset] = {"cantidad": 0.0, "coste_total": 0.0, "fees_total": 0.0}
            
            vol = float(trade['vol'])
            cost = float(trade['cost'])
            fee = float(trade['fee'])
            
            if trade['type'] == 'buy':
                holdings_por_asset[asset]["cantidad"] += vol
                holdings_por_asset[asset]["coste_total"] += cost
                holdings_por_asset[asset]["fees_total"] += fee
            else:  # sell
                if holdings_por_asset[asset]["cantidad"] > 0:
                    ratio_vendido = min(vol / holdings_por_asset[asset]["cantidad"], 1.0)
                    coste_reducido = holdings_por_asset[asset]["coste_total"] * ratio_vendido
                    
                    holdings_por_asset[asset]["cantidad"] -= vol
                    holdings_por_asset[asset]["coste_total"] -= coste_reducido
                    holdings_por_asset[asset]["fees_total"] += fee
        
        # Calcular totales del día
        coste_total_dia = sum(holding["coste_total"] for holding in holdings_por_asset.values() if holding["cantidad"] > 0)
        fees_total_dia = sum(holding["fees_total"] for holding in holdings_por_asset.values() if holding["cantidad"] > 0)
        
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
        
        # DEBUG: Mostrar progreso especialmente en fechas recientes
        if fecha_actual.day % 5 == 0 or fecha_actual >= today - timedelta(days=7):
            print(f"📅 DEBUG: Procesando {fecha_str}, valor: {valor_mercado_dia:.2f}€")
        
        # Avanzar al siguiente día
        fecha_actual += timedelta(days=1)
    
    print(f"✅ Timeline calculado: {len(timeline)} días desde {fecha_minima} hasta {today}")
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
        
        print(f"🔍 Trades found: {len(trades_df)} out of {len(df)} total rows")
        
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
        df = pd.read_csv(io.StringIO(csv_content))
        
        print(f"🔍 CSV columns found: {df.columns.tolist()}")
        print(f"📊 CSV shape: {df.shape}")
        
        # Solo soportamos Trades CSV por ahora
        if 'txid' in df.columns and 'pair' in df.columns:
            return process_trades_csv(df)
        else:
            return {"error": "Invalid CSV format. Please use Trades History export from Kraken"}
    
    except Exception as e:
        return {"error": f"Error processing CSV: {str(e)}"}

# =============================================================================
# ENDPOINTS
# =============================================================================

@app.post("/api/portfolio/csv")
async def upload_csv(file: UploadFile = File(...)):
    """Endpoint para procesar CSV de Kraken"""
    try:
        print(f"📤 Recibido archivo CSV: {file.filename}")
        
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        result = process_csv_data(csv_content)
        
        print(f"✅ CSV procesado exitosamente")
        return result
        
    except Exception as e:
        print(f"❌ Error procesando CSV: {e}")
        return {"error": f"Error processing file: {str(e)}"}

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