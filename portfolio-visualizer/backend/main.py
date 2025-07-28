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
from datetime import datetime, timedelta
import asyncio
from threading import Thread, Lock
import json

# =============================================================================
# CONFIGURACIÓN Y CONSTANTES
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
# SISTEMA DE CACHE SEPARADO PARA APIs PÚBLICAS VS PRIVADAS
# =============================================================================

# Cache para datos privados del usuario (por usuario)
private_cache = {}
PRIVATE_CACHE_DURATION = 300  # 5 minutos

# Cache global para datos públicos (compartido entre todos los usuarios)
public_cache = {}
PUBLIC_CACHE_DURATION = 900  # 15 minutos (más tiempo porque es compartido)
public_cache_lock = Lock()

# Instancia global de Kraken para APIs públicas (sin credenciales)
public_kraken = None
public_kraken_api = None

# Assets fiat reconocidos por Kraken
FIAT_ASSETS = ["ZEUR", "ZUSD", "ZGBP", "ZCAD", "ZJPY", "ZCHF", "ZKRW", "ZUSDT", "ZUSDC"]

# Patrones comunes de Kraken para generar pares automáticamente
KRAKEN_PAIR_PATTERNS = [
    # Patrones más comunes primero para optimizar
    "XX{asset}ZEUR",    # Patrón más común: XXBTZEUR, XXRPZEUR
    "X{asset}ZEUR",     # Segundo más común: XETHZEUR
    "{asset}ZEUR",      # Directo: ADAZEUR
    "{asset}/EUR",      # Formato con slash: BTC/EUR
    "{asset}EUR",       # Sin Z: BTCEUR
    "X{asset}EUR",      # X sin Z: XETHEUR
    "XX{asset}EUR",     # XX sin Z: XXBTCEUR
]

# Cache dinámico de pares exitosos (se va llenando automáticamente)
DYNAMIC_PAIR_CACHE = {}

# =============================================================================
# MODELOS DE DATOS
# =============================================================================

class PortfolioRequest(BaseModel):
    api_key: str
    api_secret: str

# =============================================================================
# SISTEMA DE GESTIÓN DE APIs PÚBLICAS (COMPARTIDAS)
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

def get_public_cache_key(operation, *args):
    """Genera clave de cache para operaciones públicas"""
    return f"public_{operation}_" + "_".join(str(arg) for arg in args)

def get_cached_public_data(cache_key):
    """Obtiene datos del cache público con thread safety"""
    with public_cache_lock:
        if cache_key in public_cache:
            data, timestamp = public_cache[cache_key]
            if time.time() - timestamp < PUBLIC_CACHE_DURATION:
                print(f"📋 Cache HIT público: {cache_key}")
                return data
            else:
                del public_cache[cache_key]
                print(f"🕐 Cache EXPIRED público: {cache_key}")
    return None

def set_cached_public_data(cache_key, data):
    """Guarda datos en el cache público con thread safety"""
    with public_cache_lock:
        public_cache[cache_key] = (data, time.time())
        print(f"💾 Cache STORED público: {cache_key}")

def obtener_precios_diarios_cached(asset, start_date, end_date):
    """
    Obtiene precios históricos con cache público optimizado.
    Esta función usa el cache compartido entre usuarios.
    """
    global public_kraken_api
    
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
    
    def generate_kraken_pairs_dynamically(asset_name):
        """
        Genera automáticamente todos los pares posibles para cualquier asset
        usando los patrones comunes de Kraken + cache dinámico, sin hardcodear nada.
        """
        pairs = []
        
        # Si ya sabemos qué par funciona para este asset, ponerlo primero
        if asset_name in DYNAMIC_PAIR_CACHE:
            successful_pair = DYNAMIC_PAIR_CACHE[asset_name]
            pairs.append(successful_pair)
            print(f"🎯 Usando par conocido para {asset_name}: {successful_pair}")
        
        # Generar pares usando patrones comunes (ordenados por probabilidad)
        for pattern in KRAKEN_PAIR_PATTERNS:
            pair = pattern.format(asset=asset_name)
            if pair not in pairs:  # Evitar duplicados
                pairs.append(pair)
        
        # Generar también variaciones con USD y otras monedas principales
        additional_patterns = [
            "XX{asset}ZUSD", "X{asset}ZUSD", "{asset}ZUSD",
            "{asset}/USD", "{asset}USD"
        ]
        for pattern in additional_patterns:
            pair = pattern.format(asset=asset_name)
            if pair not in pairs:  # Evitar duplicados
                pairs.append(pair)
            
        return pairs
    
    possible_pairs = generate_kraken_pairs_dynamically(asset)
    print(f"🔍 Probando pares para {asset}: {possible_pairs[:5]}...")  # Solo mostrar primeros 5
    
    for pair in possible_pairs:
        try:
            # Convertir fechas a timestamp
            start_ts = int(pd.to_datetime(start_date).timestamp())
            
            print(f"📞 API PÚBLICA: get_ohlc_data({pair}, 1440, {start_date})")
            ohlc, _ = public_kraken_api.get_ohlc_data(pair, interval=1440, since=start_ts)
            
            # Filtrar fechas dentro del rango
            start_pd = pd.to_datetime(start_date).date()
            end_pd = pd.to_datetime(end_date).date()
            
            ohlc = ohlc[(ohlc.index.date >= start_pd) & (ohlc.index.date <= end_pd)]
            
            precios_diarios = {}
            for date, row in ohlc.iterrows():
                fecha = date.strftime('%Y-%m-%d')
                precio_cierre = float(row['close'])
                precios_diarios[fecha] = precio_cierre
            
            print(f"✅ Precios obtenidos para {asset} via {pair}: {len(precios_diarios)} días")
            
            # Guardar el par exitoso en el cache dinámico para futuras consultas
            DYNAMIC_PAIR_CACHE[asset] = pair
            print(f"💾 Par {pair} guardado en cache dinámico para {asset}")
            
            # Guardar en cache antes de retornar
            set_cached_public_data(cache_key, precios_diarios)
            return precios_diarios
            
        except Exception as e:
            error_str = str(e)
            print(f"⚠️ Error con par {pair}: {error_str}")
            
            # Si es un error de asset pair desconocido, no seguir intentando otros pares para este asset
            if "Unknown asset pair" in error_str or "EQuery:Unknown asset pair" in error_str:
                print(f"❌ Asset {clean_asset} no encontrado en Kraken, saltando...")
                break
            continue
    
    print(f"❌ No se pudieron obtener precios para {asset}")
    # Guardar resultado vacío en cache para evitar reintentos inmediatos
    set_cached_public_data(cache_key, {})
    return {}


# =============================================================================
# FUNCIONES AUXILIARES - API DE KRAKEN
# =============================================================================

def crear_kraken_api(api_key, api_secret):
    """Crear instancia de API de Kraken con credenciales PRIVADAS"""
    k = krakenex.API()
    k.key = api_key
    k.secret = api_secret
    return KrakenAPI(k)

def get_private_cache_key(api_key, operation, *args):
    """Genera clave de cache para operaciones privadas por usuario"""
    # Usar hash del API key para privacidad
    user_hash = hashlib.md5(api_key.encode()).hexdigest()[:8]
    return f"private_{user_hash}_{operation}_" + "_".join(str(arg) for arg in args)

def get_cached_private_data(cache_key):
    """Obtiene datos del cache privado"""
    if cache_key in private_cache:
        data, timestamp = private_cache[cache_key]
        if time.time() - timestamp < PRIVATE_CACHE_DURATION:
            print(f"📋 Cache HIT privado: {cache_key}")
            return data
        else:
            del private_cache[cache_key]
            print(f"🕐 Cache EXPIRED privado: {cache_key}")
    return None

def set_cached_private_data(cache_key, data):
    """Guarda datos en el cache privado"""
    private_cache[cache_key] = (data, time.time())
    print(f"💾 Cache STORED privado: {cache_key}")

def get_all_trades(kraken):
    """Obtiene todo el historial de trades usando paginación"""
    try:
        all_trades = []
        offset = 0
        page_size = 50  # Kraken devuelve 50 trades por página

        while True:
            trades, count = kraken.get_trades_history(ofs=offset)

            if trades.empty:
                break

            all_trades.append(trades)
            offset += len(trades)

            # Si ya tenemos todo lo que Kraken dice que hay, paramos
            if offset >= count:
                break

        full_trades_df = pd.concat(all_trades, ignore_index=True)
        return full_trades_df.reset_index(drop=True)

    except Exception as e:
        print(f"⚠️ Error obteniendo trades: {e}")
        return pd.DataFrame()

def get_current_balances(kraken):
    """Obtiene los balances actuales de la cuenta"""
    try:
        balance = kraken.get_account_balance()
        return balance
    except Exception as e:
        return pd.DataFrame()

def get_current_prices(kraken, assets):
    """Obtiene precios actuales para los activos usando pares válidos"""
    try:
        prices = {}
        eur_pairs = get_eur_pairs()  # Obtener pares EUR del archivo
        
        # Crear lista de pares a consultar
        pairs_to_query = []
        asset_to_pair_map = {}
        
        for asset in assets:
            if asset in FIAT_ASSETS:
                prices[asset] = 1.0  # Fiat = 1.0
            else:
                # Buscar par válido con EUR usando kraken_pairs.py
                possible_pairs = [
                    f"{asset}ZEUR",  # Formato más común: XXBTZEUR, XXRPZEUR
                    f"{asset}EUR",   # Formato alternativo
                    f"{asset.replace('X', '').replace('Z', '')}EUR",  # Sin prefijos
                ]
                
                found_pair = None
                for pair in possible_pairs:
                    if pair in eur_pairs:
                        pairs_to_query.append(pair)
                        asset_to_pair_map[pair] = asset
                        found_pair = pair
                        break
                
                if not found_pair:
                    # Intentar búsqueda manual en pares disponibles
                    asset_clean = asset.replace('X', '').replace('Z', '')
                    manual_pairs = [p for p in eur_pairs if asset_clean.lower() in p.lower()]
                    if manual_pairs:
                        # Usar el primer par que encuentre
                        manual_pair = manual_pairs[0]
                        pairs_to_query.append(manual_pair)
                        asset_to_pair_map[manual_pair] = asset
                    else:
                        # Si no encuentra par con EUR, asignar 0
                        prices[asset] = 0.0
        
        # Obtener precios individualmente para cada par (más fiable que batch)
        for pair in pairs_to_query:
            asset = asset_to_pair_map[pair]
            try:
                time.sleep(0.3)  # Rate limiting between requests
                ticker_data = kraken.get_ticker_information([pair])  # Request individual pair
                
                if pair in ticker_data.index:
                    price = float(ticker_data.loc[pair, 'c'][0])  # Precio de cierre
                    prices[asset] = price
                else:
                    prices[asset] = 0.0
                        
            except Exception as e:
                prices[asset] = 0.0
        
        return prices
        
    except Exception as e:
        print(f"Exception in get_current_prices: {e}")
        return {}

def get_public_kraken_prices(assets):
    """Obtiene precios actuales usando la API pública de Kraken"""
    try:
        print(f"🔍 Buscando precios para assets: {assets}")
        
        # Crear pares para consultar precios
        pairs_to_query = []
        asset_to_pair_map = {}
        
        for asset in assets:
            if asset in FIAT_ASSETS:
                continue  # Skip fiat assets
            
            # Mapeo específico para assets conocidos
            pair_mappings = {
                'BTC': ['XXBTZEUR', 'XBTZEUR', 'BTCEUR'],
                'ETH': ['XETHZEUR', 'ETHEUR'],
                'XRP': ['XXRPZEUR', 'XRPZEUR', 'XRPEUR'],
                'ADA': ['ADAZEUR', 'ADAEUR'],
                'DOT': ['DOTZEUR', 'DOTEUR'],
                'SOL': ['SOLZEUR', 'SOLEUR'],
                'MATIC': ['MATICZEUR', 'MATICEUR'],
                'AVAX': ['AVAXZEUR', 'AVAXEUR'],
                'LINK': ['LINKZEUR', 'LINKEUR'],
                'LTC': ['XLTCZEUR', 'LTCZEUR', 'LTCEUR'],
                'TRUMP': ['TRUMPEUR', 'TRUMPZEUR'],
                'UNI': ['UNIZEUR', 'UNIEUR'],
                'ATOM': ['ATOMZEUR', 'ATOMEUR']
            }
            
            # Intentar pares específicos o genéricos
            possible_pairs = pair_mappings.get(asset, [
                f"X{asset}ZEUR",   # XXRPZEUR
                f"{asset}ZEUR",    # ADAZEUR
                f"{asset}EUR",     # ADAEUR
                f"XX{asset}ZEUR"   # XXADAZEUR
            ])
            
            print(f"  Asset {asset} -> intentando pares: {possible_pairs}")
            
            # Usar el primer par que parezca válido
            for pair in possible_pairs:
                pairs_to_query.append(pair)
                asset_to_pair_map[pair] = asset
                break
        
        if not pairs_to_query:
            print("❌ No hay pares para consultar")
            return {}
        
        print(f"📡 Consultando API con pares: {pairs_to_query}")
        
        # Llamar a la API pública de Kraken
        pairs_str = ",".join(pairs_to_query)
        url = f"https://api.kraken.com/0/public/Ticker?pair={pairs_str}"
        
        response = requests.get(url, timeout=10)
        data = response.json()
        
        print(f"📊 Respuesta de Kraken: {data}")
        
        if data.get('error'):
            print(f"⚠️ Kraken API error: {data['error']}")
            return {}
        
        prices = {}
        for pair, price_data in data.get('result', {}).items():
            print(f"  Par encontrado: {pair} -> {price_data['c'][0]}")
            if pair in asset_to_pair_map:
                asset = asset_to_pair_map[pair]
                prices[asset] = float(price_data['c'][0])  # Current price
                print(f"    Mapeado: {asset} = {prices[asset]}")
            else:
                # Try to match with original asset names
                for orig_pair, orig_asset in asset_to_pair_map.items():
                    if orig_pair in pair or pair in orig_pair:
                        prices[orig_asset] = float(price_data['c'][0])
                        print(f"    Mapeado por similitud: {orig_asset} = {prices[orig_asset]}")
                        break
        
        print(f"💰 Precios finales: {prices}")
        return prices
        
    except Exception as e:
        print(f"⚠️ Error fetching public prices: {e}")
        return {}

def get_public_kraken_prices_from_pairs(assets, asset_to_pair):
    """Obtiene precios usando los pares originales del CSV"""
    try:
        print(f"🔍 Buscando precios con pares originales para assets: {assets}")
        
        # Usar los pares originales del CSV
        pairs_to_query = []
        asset_to_pair_map = {}
        
        for asset in assets:
            if asset in FIAT_ASSETS:
                continue  # Skip fiat assets
            
            original_pair = asset_to_pair.get(asset)
            if original_pair:
                print(f"  Asset {asset} -> par original: {original_pair}")
                pairs_to_query.append(original_pair)
                asset_to_pair_map[original_pair] = asset
            else:
                print(f"  ⚠️ Asset {asset} sin par original, saltando...")
        
        if not pairs_to_query:
            print("❌ No hay pares para consultar")
            return {}
        
        print(f"📡 Consultando API con pares originales: {pairs_to_query}")
        
        # Llamar a la API pública de Kraken
        pairs_str = ",".join(pairs_to_query)
        url = f"https://api.kraken.com/0/public/Ticker?pair={pairs_str}"
        
        response = requests.get(url, timeout=10)
        data = response.json()
        
        print(f"📊 Respuesta de Kraken: {data}")
        
        if data.get('error'):
            print(f"⚠️ Kraken API error: {data['error']}")
            return {}
        
        prices = {}
        for pair_response, price_data in data.get('result', {}).items():
            print(f"  Par encontrado: {pair_response} -> {price_data['c'][0]}")
            
            # Buscar el asset correspondiente
            found_asset = None
            for orig_pair, asset in asset_to_pair_map.items():
                if orig_pair == pair_response or orig_pair.replace('/', '') == pair_response:
                    found_asset = asset
                    break
            
            if found_asset:
                prices[found_asset] = float(price_data['c'][0])
                print(f"    Mapeado: {found_asset} = {prices[found_asset]}")
            else:
                print(f"    ⚠️ No se encontró asset para par: {pair_response}")
        
        print(f"💰 Precios finales: {prices}")
        return prices
        
    except Exception as e:
        print(f"⚠️ Error fetching prices from pairs: {e}")
        return {}

# =============================================================================
# FUNCIONES DE ANÁLISIS DE PORTFOLIO
# =============================================================================

def obtener_portfolio_historico(kraken):
    """Para cada par, calcula la inversión neta (compras - ventas), fees totales y volumen neto"""
    trades = get_all_trades(kraken)
    if trades.empty:
        return {}
    
    resumen = {}
    for pair in trades['pair'].unique():
        trades_pair = trades[trades['pair'] == pair]
        
        # Separar compras y ventas
        buys = trades_pair[trades_pair['type'] == 'buy']
        sells = trades_pair[trades_pair['type'] == 'sell']
        
        # Calcular inversión neta: compras - ventas
        total_buy_cost = buys['cost'].astype(float).sum() if not buys.empty else 0
        total_sell_cost = sells['cost'].astype(float).sum() if not sells.empty else 0
        net_invested = total_buy_cost - total_sell_cost
        
        # Fees de todas las operaciones
        total_fee = trades_pair['fee'].astype(float).sum()
        
        # Volumen neto: compras - ventas
        total_buy_vol = buys['vol'].astype(float).sum() if not buys.empty else 0
        total_sell_vol = sells['vol'].astype(float).sum() if not sells.empty else 0
        net_vol = total_buy_vol - total_sell_vol
        
        # Precio medio ponderado (solo de las compras para ser más preciso)
        avg_buy_price = (total_buy_cost / total_buy_vol) if total_buy_vol > 0 else 0
        
        resumen[pair] = {
            'total_cost': round(net_invested, 8),        # Inversión neta
            'total_fee': round(total_fee, 8),            # Fees totales
            'total_vol': round(net_vol, 8),              # Volumen neto
            'avg_price': round(avg_buy_price, 8),        # Precio medio de compra
            'total_buy_cost': round(total_buy_cost, 8),  # Para referencia
            'total_sell_cost': round(total_sell_cost, 8) # Para referencia
        }
    return resumen

def calcular_kpis_portfolio(kraken, portfolio_data, current_balances=None, current_prices=None):
    """Calcula los KPIs principales del portfolio"""
    if not portfolio_data:
        return {
            "total_invested": 0,
            "current_value": 0,
            "profit": 0,
            "profit_percentage": 0,
            "liquidity": 0,
            "fees": 0
        }
    
    # Calcular datos históricos
    total_invested = sum(data['total_cost'] for data in portfolio_data.values())
    total_fees = sum(data['total_fee'] for data in portfolio_data.values())
    
    # Obtener balances actuales
    if current_balances is None:
        current_balances = get_current_balances(kraken)
    
    if current_balances.empty:
        return {
            "total_invested": round(total_invested, 2),
            "current_value": 0,
            "profit": round(-total_fees, 2),
            "profit_percentage": 0,
            "liquidity": 0,
            "fees": round(total_fees, 2)
        }
    
    # Obtener precios actuales
    assets = [asset for asset in current_balances.index if float(current_balances.loc[asset, 'vol']) > 0]
    
    if current_prices is None:
        current_prices = get_current_prices(kraken, assets)
    
    # Calcular valores actuales
    crypto_value = 0
    liquidity = 0
    
    for asset in assets:
        balance = float(current_balances.loc[asset, 'vol'])
        price = current_prices.get(asset, 0)
        asset_value = balance * price
        
        if asset in FIAT_ASSETS:
            liquidity += asset_value
        else:
            crypto_value += asset_value
    
    current_value = crypto_value + liquidity
    profit = crypto_value - total_invested - total_fees
    profit_percentage = (profit / (total_invested + total_fees) * 100) if (total_invested + total_fees) > 0 else 0
    
    return {
        "total_invested": round(total_invested, 2),
        "current_value": round(current_value, 2),
        "profit": round(profit, 2),
        "profit_percentage": round(profit_percentage, 2),
        "liquidity": round(liquidity, 2),
        "fees": round(total_fees, 2)
    }

def get_asset_breakdown(kraken, portfolio_data, current_balances=None, current_prices=None):
    """Desglose detallado por asset del portfolio"""
    if not portfolio_data:
        return {}
    
    if current_balances is None:
        current_balances = get_current_balances(kraken)
    
    breakdown = {}
    
    # Agregar assets que tienen datos históricos
    for pair, historical_data in portfolio_data.items():
        # Extraer el asset base del par
        asset = pair.replace('ZEUR', '').replace('EUR', '')
        if asset.endswith('Z'):
            asset = asset[:-1]
        
        # Buscar asset en balances actuales
        if not current_balances.empty and asset not in current_balances.index:
            possible_assets = [a for a in current_balances.index if asset in a or a in asset]
            if possible_assets:
                asset = possible_assets[0]
        
        # Obtener balance actual
        balance = 0
        if not current_balances.empty and asset in current_balances.index:
            balance = float(current_balances.loc[asset, 'vol'])
        
        # Obtener precio actual
        current_price = 0
        if current_prices and asset in current_prices:
            current_price = current_prices[asset]
        elif balance > 0:
            if current_prices is None:
                current_prices = {}
            try:
                asset_prices = get_current_prices(kraken, [asset])
                current_price = asset_prices.get(asset, 0)
                current_prices[asset] = current_price
            except:
                current_price = 0
        
        # Calcular valores
        current_value = balance * current_price
        invested_amount = historical_data['total_cost']
        fees_paid = historical_data['total_fee']
        avg_buy_price = historical_data['avg_price']
        
        profit_loss = current_value - invested_amount - fees_paid
        profit_percentage = (profit_loss / (invested_amount + fees_paid) * 100) if (invested_amount + fees_paid) > 0 else 0
        
        asset_type = "fiat" if asset in FIAT_ASSETS else "crypto"
        
        breakdown[asset] = {
            "asset_name": asset,
            "asset_type": asset_type,
            "balance": round(balance, 8),
            "current_price": round(current_price, 8),
            "current_value": round(current_value, 2),
            "invested_amount": round(invested_amount, 2),
            "fees_paid": round(fees_paid, 2),
            "avg_buy_price": round(avg_buy_price, 8),
            "profit_loss": round(profit_loss, 2),
            "profit_percentage": round(profit_percentage, 2),
            "has_historical_data": True,
            "is_sold": balance == 0
        }
    
    # Agregar assets con balance pero sin datos históricos
    if not current_balances.empty:
        for asset in current_balances.index:
            balance = float(current_balances.loc[asset, 'vol'])
            if balance > 0 and asset not in breakdown:
                current_price = current_prices.get(asset, 0) if current_prices else 0
                current_value = balance * current_price
                
                asset_type = "fiat" if asset in FIAT_ASSETS else "crypto"
                
                breakdown[asset] = {
                    "asset_name": asset,
                    "asset_type": asset_type,
                    "balance": round(balance, 8),
                    "current_price": round(current_price, 8),
                    "current_value": round(current_value, 2),
                    "invested_amount": 0,
                    "fees_paid": 0,
                    "avg_buy_price": 0,
                    "profit_loss": round(current_value, 2),
                    "profit_percentage": 0,
                    "has_historical_data": False,
                    "is_sold": False
                }
    
    return breakdown

def get_complete_portfolio_data(kraken, portfolio_data):
    """Obtiene todos los datos necesarios con el mínimo de llamadas a Kraken"""
    current_balances = get_current_balances(kraken)
    if current_balances.empty:
        return None, None
    
    assets = [asset for asset in current_balances.index if float(current_balances.loc[asset, 'vol']) > 0]
    current_prices = get_current_prices(kraken, assets)
    
    return current_balances, current_prices

# =============================================================================
# FUNCIONES DE PROCESAMIENTO CSV
# =============================================================================

def process_csv_data(csv_content):
    """Procesa los datos del CSV de Kraken y los convierte al formato esperado"""
    try:
        df = pd.read_csv(io.StringIO(csv_content))
        
        print(f"🔍 CSV columns found: {df.columns.tolist()}")
        print(f"📊 CSV shape: {df.shape}")
        
        # Detectar el tipo de CSV
        if 'txid' in df.columns and 'pair' in df.columns:
            return process_trades_csv(df)
        elif 'txid' in df.columns and 'type' in df.columns and 'asset' in df.columns and 'balance' in df.columns:
            return process_ledger_csv(df)
        else:
            return {"error": "Invalid CSV format. Please use Trades History or Ledger export from Kraken"}
    
    except Exception as e:
        return {"error": f"Error processing CSV: {str(e)}"}

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
        
        # Calcular balances actuales a partir de trades Y guardar pares originales
        balances = {}
        asset_to_pair = {}  # Mapear asset -> par original
        
        for _, row in trades_df.iterrows():
            pair = str(row['pair'])
            asset = pair.replace('ZEUR', '').replace('EUR', '').replace('USD', '').replace('GBP', '').replace('CAD', '').rstrip('/')
            if asset == pair:
                asset = pair
            
            # Guardar el par original para este asset
            asset_to_pair[asset] = pair
            
            vol = float(row['vol'])
            print(f"📋 Trade: {row['type']} {vol} {asset} (par: {pair})")
            
            if row['type'] == 'buy':
                balances[asset] = balances.get(asset, 0) + vol
            else:
                balances[asset] = balances.get(asset, 0) - vol
                
            print(f"   Balance actual de {asset}: {balances[asset]}")
        
        print(f"🗂️ Mapeo asset -> par original: {asset_to_pair}")
        
        # Obtener precios actuales
        assets_with_balance = [asset for asset, balance in balances.items() if balance > 0]
        print(f"🏦 Assets con balance > 0: {assets_with_balance}")
        print(f"📊 Balances: {balances}")
        
        # FORZAR llamada a API de precios usando pares originales
        print("🚀 LLAMANDO A get_public_kraken_prices...")
        current_prices = get_public_kraken_prices_from_pairs(assets_with_balance, asset_to_pair)
        print(f"🎯 PRECIOS OBTENIDOS: {current_prices}")
        
        portfolio_result = create_portfolio_data_from_trades(trades_df, balances, current_prices)
        
        # Agregar timeline al resultado
        timeline_data = calcular_holdings_diarios_csv(trades_df)
        portfolio_result["timeline"] = timeline_data
        
        return portfolio_result
        
    except Exception as e:
        return {"error": f"Error processing Trades CSV: {str(e)}"}

def process_ledger_csv(df):
    """Procesa CSV de Ledger"""
    try:
        required_columns = ['txid', 'time', 'type', 'asset', 'amount', 'balance']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return {"error": f"Invalid Ledger CSV format. Missing required columns: {missing_columns}"}
        
        df['time'] = pd.to_datetime(df['time'])
        
        # Obtener balances actuales
        latest_balances = df.groupby('asset')['balance'].last().to_dict()
        current_balances = {asset: float(balance) for asset, balance in latest_balances.items() if float(balance) > 0}
        
        # Obtener precios actuales para assets no fiat
        crypto_assets = [asset for asset in current_balances.keys() if asset not in FIAT_ASSETS]
        current_prices = get_public_kraken_prices(crypto_assets)
        
        return create_portfolio_data_from_ledger(df, current_balances, current_prices)
        
    except Exception as e:
        return {"error": f"Error processing Ledger CSV: {str(e)}"}

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
        asset_data[asset]['trades'].append(row)
    
    # Crear portfolio array (solo crypto, sin FIAT)
    portfolio_array = []
    for asset, data in asset_data.items():
        if asset in FIAT_ASSETS:
            continue
            
        balance = balances.get(asset, 0)
        current_price = current_prices.get(asset, 0)
        current_value = balance * current_price
        
        print(f"💎 Asset {asset}: balance={balance}, price={current_price}, value={current_value}")
        
        portfolio_array.append({
            'asset': asset,
            'asset_type': 'crypto',
            'amount': balance,
            'current_price': current_price,
            'total_invested': data['invested'],
            'fees_paid': data['fees'],
            'current_value': current_value,
            'pnl_eur': current_value - data['invested'] - data['fees'],
            'pnl_percent': ((current_value - data['invested'] - data['fees']) / (data['invested'] + data['fees']) * 100) if (data['invested'] + data['fees']) > 0 else 0
        })
    
    # Calcular KPIs (solo crypto, sin liquidez)
    total_invested = sum(item['total_invested'] for item in portfolio_array)
    total_fees = sum(item['fees_paid'] for item in portfolio_array)
    crypto_value = sum(item['current_value'] for item in portfolio_array)
    profit = crypto_value - total_invested - total_fees
    profit_percentage = (profit / (total_invested + total_fees) * 100) if (total_invested + total_fees) > 0 else 0
    
    return {
        'portfolio_data': portfolio_array,
        'kpis': {
            'total_invested': total_invested,
            'current_value': crypto_value,
            'profit': profit,
            'profit_percentage': profit_percentage,
            'fees': total_fees,
            'liquidity': 0  # Sin liquidez para CSV trades
        },
        'data_source': 'csv'
    }

def create_portfolio_data_from_ledger(df, current_balances, current_prices):
    """Crear datos de portfolio a partir de Ledger"""
    asset_data = {}
    
    for _, row in df.iterrows():
        asset = str(row['asset'])
        amount = float(row['amount'])
        fee = float(row.get('fee', 0))
        
        if asset not in asset_data:
            asset_data[asset] = {'invested': 0, 'fees': 0}
        
        if row['type'] == 'trade':
            if amount > 0:
                pass  # Compra de crypto
            else:
                if asset in FIAT_ASSETS:
                    asset_data[asset]['invested'] += abs(amount)
        
        asset_data[asset]['fees'] += fee
    
    # Crear portfolio array
    portfolio_array = []
    for asset, balance in current_balances.items():
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
    """
    Calcula los holdings diarios (cantidad y coste) de cada asset desde el primer trade hasta el último.
    
    Args:
        trades_df: DataFrame con los trades del CSV
        
    Returns:
        List: Timeline con holdings diarios por asset
    """
    print(f"📅 Calculando holdings diarios desde CSV con {len(trades_df)} trades...")
    
    if trades_df.empty:
        print("❌ No hay trades para calcular timeline")
        return []
    
    # Ordenar trades por fecha
    trades_df = trades_df.sort_values('time').copy()
    
    # Obtener rango de fechas
    fecha_minima = trades_df['time'].min().date()
    fecha_maxima = trades_df['time'].max().date()
    
    print(f"📅 Rango de fechas: {fecha_minima} -> {fecha_maxima}")
    
    # Obtener assets únicos para precios históricos
    assets_unicos = set()
    for _, trade in trades_df.iterrows():
        pair = str(trade['pair'])
        asset = pair.replace('ZEUR', '').replace('EUR', '').replace('USD', '').replace('GBP', '').replace('CAD', '').rstrip('/')
        if asset == pair:
            asset = pair
        assets_unicos.add(asset)
    
    print(f"🎯 Assets únicos encontrados: {list(assets_unicos)}")
    
    # Obtener precios históricos para todos los assets de una vez
    precios_historicos = {}  # {asset: {fecha: precio}}
    for i, asset in enumerate(assets_unicos):
        print(f"📈 Obteniendo precios históricos para {asset}...")
        
        # Añadir delay entre llamadas para evitar rate limiting (excepto la primera)
        if i > 0:
            print("⏱️ Esperando 2 segundos para evitar rate limiting...")
            time.sleep(2)
        
        precios = obtener_precios_diarios_cached(asset, fecha_minima, fecha_maxima)
        if precios:
            precios_historicos[asset] = precios
            print(f"✅ {asset}: {len(precios)} días de precios obtenidos")
        else:
            print(f"⚠️ {asset}: No se pudieron obtener precios - asset no encontrado o error de API")
    
    # Generar todas las fechas en el rango
    fecha_actual = fecha_minima
    timeline = []
    
    # Holdings acumulativos por asset
    holdings_por_asset = {}  # {asset: {"cantidad": float, "coste_total": float, "fees_total": float}}
    
    while fecha_actual <= fecha_maxima:
        fecha_str = fecha_actual.strftime('%Y-%m-%d')
        
        # Procesar todos los trades de este día
        trades_del_dia = trades_df[trades_df['time'].dt.date == fecha_actual]
        
        for _, trade in trades_del_dia.iterrows():
            # Extraer asset del pair
            pair = str(trade['pair'])
            asset = pair.replace('ZEUR', '').replace('EUR', '').replace('USD', '').replace('GBP', '').replace('CAD', '').rstrip('/')
            if asset == pair:
                asset = pair
            
            # Inicializar asset si no existe
            if asset not in holdings_por_asset:
                holdings_por_asset[asset] = {"cantidad": 0.0, "coste_total": 0.0, "fees_total": 0.0}
            
            vol = float(trade['vol'])
            cost = float(trade['cost'])
            fee = float(trade['fee'])
            
            if trade['type'] == 'buy':
                holdings_por_asset[asset]["cantidad"] += vol
                holdings_por_asset[asset]["coste_total"] += cost
                holdings_por_asset[asset]["fees_total"] += fee
                print(f"📈 {fecha_str}: BUY {vol} {asset} - Coste: {cost}€ - Fee: {fee}€")
            else:  # sell
                # Para ventas, reducir cantidad proporcionalmente al coste
                if holdings_por_asset[asset]["cantidad"] > 0:
                    ratio_vendido = min(vol / holdings_por_asset[asset]["cantidad"], 1.0)
                    coste_reducido = holdings_por_asset[asset]["coste_total"] * ratio_vendido
                    
                    holdings_por_asset[asset]["cantidad"] -= vol
                    holdings_por_asset[asset]["coste_total"] -= coste_reducido
                    holdings_por_asset[asset]["fees_total"] += fee
                    
                    print(f"📉 {fecha_str}: SELL {vol} {asset} - Ratio: {ratio_vendido:.3f} - Coste reducido: {coste_reducido:.2f}€")
                else:
                    print(f"⚠️ {fecha_str}: SELL {vol} {asset} pero no hay holdings!")
        
        # Calcular totales del día
        coste_total_dia = sum(holding["coste_total"] for holding in holdings_por_asset.values() if holding["cantidad"] > 0)
        fees_total_dia = sum(holding["fees_total"] for holding in holdings_por_asset.values() if holding["cantidad"] > 0)
        
        # Calcular valor de mercado del día
        valor_mercado_dia = 0.0
        for asset, holding in holdings_por_asset.items():
            if holding["cantidad"] > 0:
                precio_del_dia = precios_historicos.get(asset, {}).get(fecha_str)
                if precio_del_dia:
                    valor_asset = holding["cantidad"] * precio_del_dia
                    valor_mercado_dia += valor_asset
                    print(f"💰 {fecha_str} {asset}: {holding['cantidad']:.6f} × {precio_del_dia:.2f}€ = {valor_asset:.2f}€")
                else:
                    # Si no tenemos precio, usar el coste como aproximación
                    valor_mercado_dia += holding["coste_total"]
                    print(f"⚠️ {fecha_str} {asset}: Sin precio, usando coste {holding['coste_total']:.2f}€")
        
        # Crear snapshot del día en formato compatible con frontend
        dia_data = {
            "date": fecha_str,
            "cost": round(coste_total_dia, 2),      # Coste total invertido hasta esta fecha
            "fees": round(fees_total_dia, 2),       # Fees totales hasta esta fecha
            "value": round(valor_mercado_dia, 2),   # Valor de mercado actual
            "holdings": {}  # Detalle por asset para debugs
        }
        
        # Agregar detalle por asset
        for asset, holding in holdings_por_asset.items():
            if holding["cantidad"] > 0:  # Solo incluir assets con cantidad > 0
                precio_actual = precios_historicos.get(asset, {}).get(fecha_str, 0)
                valor_actual = holding["cantidad"] * precio_actual if precio_actual else holding["coste_total"]
                
                dia_data["holdings"][asset] = {
                    "cantidad": round(holding["cantidad"], 8),
                    "coste_total": round(holding["coste_total"], 2),
                    "fees_total": round(holding["fees_total"], 2),
                    "coste_promedio": round(holding["coste_total"] / holding["cantidad"], 2) if holding["cantidad"] > 0 else 0,
                    "precio_mercado": round(precio_actual, 2) if precio_actual else 0,
                    "valor_mercado": round(valor_actual, 2)
                }
        
        timeline.append(dia_data)
        
        # Avanzar al siguiente día
        fecha_actual += timedelta(days=1)
    
    print(f"✅ Timeline calculado: {len(timeline)} días con holdings diarios")
    
    # Mostrar algunos ejemplos
    if timeline:
        print(f"📊 Primer día ({timeline[0]['date']}): cost={timeline[0]['cost']}€, assets={list(timeline[0]['holdings'].keys())}")
        if len(timeline) > 1:
            print(f"📊 Último día ({timeline[-1]['date']}): cost={timeline[-1]['cost']}€, assets={list(timeline[-1]['holdings'].keys())}")
    
    return timeline

# =============================================================================
# ENDPOINTS DE LA API
# =============================================================================

@app.post("/api/portfolio")
async def portfolio_endpoint(req: PortfolioRequest):
    try:
        # Detectar credenciales de test y devolver datos mock
        if req.api_key == "test" and req.api_secret == "test":
            print("🧪 Detectadas credenciales de test, devolviendo datos mock")
            mock_portfolio_data = [
                {"asset": "BTC", "asset_type": "crypto", "amount": 0.015, "current_price": 100000.0, "total_invested": 1200.0, "fees_paid": 5.0, "current_value": 1500.0, "pnl_eur": 300.0, "pnl_percent": 25.0},
                {"asset": "ETH", "asset_type": "crypto", "amount": 0.25, "current_price": 3200.0, "total_invested": 750.0, "fees_paid": 3.0, "current_value": 800.0, "pnl_eur": 50.0, "pnl_percent": 6.67},
                {"asset": "XRP", "asset_type": "crypto", "amount": 100.0, "current_price": 2.0, "total_invested": 180.0, "fees_paid": 2.0, "current_value": 200.0, "pnl_eur": 20.0, "pnl_percent": 11.11}
            ]
            
            # Timeline vacío por ahora
            timeline_result = []
            
            mock_result = {
                "kpis": {
                    "total_invested": 2130.0,
                    "current_value": 2500.0,
                    "profit": 370.0,
                    "profit_percentage": 17.37,
                    "fees": 10.0,
                    "liquidity": 0.0
                },
                "portfolio_data": mock_portfolio_data,
                "timeline": timeline_result,
                "asset_breakdown": {},
                "data_source": "mock"
            }
            return mock_result
        
        # Crear clave de caché PRIVADO
        cache_key = get_private_cache_key(req.api_key, "portfolio_analysis")
        
        # Verificar caché privado
        cached_data = get_cached_private_data(cache_key)
        if cached_data is not None:
            print(f"📊 Devolviendo datos desde caché PRIVADO")
            return cached_data
        
        # Crear API instance
        kraken = crear_kraken_api(req.api_key, req.api_secret)
        
        # Obtener datos históricos
        portfolio_data = obtener_portfolio_historico(kraken)
        
        # Obtener datos actuales
        current_balances, current_prices = get_complete_portfolio_data(kraken, portfolio_data)
        
        # Calcular KPIs
        kpis = calcular_kpis_portfolio(kraken, portfolio_data, current_balances, current_prices)
        
        # Obtener desglose por asset
        asset_breakdown = get_asset_breakdown(kraken, portfolio_data, current_balances, current_prices)
        
        # Convertir a formato compatible con frontend (mismo formato que CSV)
        portfolio_array = []
        for asset_name, asset_data in asset_breakdown.items():
            portfolio_array.append({
                "asset": asset_name,
                "asset_type": asset_data["asset_type"],
                "amount": asset_data["balance"],
                "current_price": asset_data["current_price"],
                "total_invested": asset_data["invested_amount"],
                "fees_paid": asset_data["fees_paid"],
                "current_value": asset_data["current_value"],
                "pnl_eur": asset_data["profit_loss"],
                "pnl_percent": asset_data["profit_percentage"]
            })
        
        # Timeline vacío por ahora
        timeline_result = []
        
        # Preparar resultado
        result = portfolio_data.copy()
        result["kpis"] = kpis
        result["asset_breakdown"] = asset_breakdown
        result["portfolio_data"] = portfolio_array
        result["timeline"] = timeline_result
        
        # Guardar en caché PRIVADO
        set_cached_private_data(cache_key, result)
        return result
        
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/portfolio/csv")
async def portfolio_csv_endpoint(csv_file: UploadFile = File(...)):
    try:
        # Verificar que es un archivo CSV
        if not str(csv_file.filename).endswith('.csv'):
            return {"error": "File must be a CSV file"}
        
        # Leer el contenido del archivo
        content = await csv_file.read()
        csv_content = content.decode('utf-8')
        
        # Procesar los datos del CSV
        result = process_csv_data(csv_content)
        
        if "error" in result:
            return result
        
        print(f"📊 CSV procesado exitosamente:")
        print(f"  💰 Total invertido: {result['kpis']['total_invested']:.2f}€")
        print(f"  💰 Valor actual: {result['kpis']['current_value']:.2f}€")
        print(f"  📈 Profit: {result['kpis']['profit']:.2f}€ ({result['kpis']['profit_percentage']:.2f}%)")
        print(f"  💸 Fees: {result['kpis']['fees']:.2f}€")
        print(f"  💧 Liquidez: {result['kpis']['liquidity']:.2f}€")
        print(f"  🏦 Assets: {len(result['portfolio_data'])} activos")
        
        # El timeline ya se calcula en process_trades_csv
        result["asset_breakdown"] = {
            asset['asset']: {
                'asset_name': asset['asset'],
                'asset_type': asset['asset_type'],
                'balance': asset['amount'],
                'current_price': asset['current_price'],
                'current_value': asset['current_value'],
                'invested_amount': asset['total_invested'],
                'fees_paid': asset['fees_paid'],
                'avg_buy_price': asset['current_price'],
                'profit_loss': asset['pnl_eur'],
                'profit_percentage': asset['pnl_percent'],
                'has_historical_data': True,
                'is_sold': asset['amount'] == 0
            }
            for asset in result['portfolio_data']
        }
        
        return result
        
    except Exception as e:
        return {"error": f"Error processing CSV file: {str(e)}"}

# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    print("🚀 Iniciando servidor Portfolio Visualizer...")
    print("📊 Backend disponible en: http://localhost:8000")
    print("🌐 Frontend disponible en: http://localhost:5173")
    print("📖 Documentación API: http://localhost:8000/docs")
    print("=" * 50)
    
    # Inicializar Kraken público al arrancar
    print("🔧 Inicializando APIs públicas...")
    init_public_kraken()
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)