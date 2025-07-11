from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict
import uvicorn
import krakenex
from pykrakenapi import KrakenAPI
import pandas as pd
from datetime import datetime, timedelta
import time
import hashlib
from kraken_pairs import pair_exists, get_eur_pairs

# Cache simple para evitar llamadas repetidas
cache = {}
CACHE_DURATION = 300  # 5 minutos en segundos

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FIAT_ASSETS = ["ZEUR", "ZUSD", "ZGBP", "ZCAD", "ZJPY", "ZCHF", "ZKRW", "ZUSDT", "ZUSDC"]

class PortfolioRequest(BaseModel):
    api_key: str
    api_secret: str

def crear_kraken_api(api_key, api_secret):
    k = krakenex.API()
    k.key = api_key
    k.secret = api_secret
    return KrakenAPI(k)

def get_valid_pair(kraken, asset, quote="ZEUR"):
    asset_pairs = kraken.get_tradable_asset_pairs()
    for pair_name in asset_pairs.index:
        if pair_name.startswith(asset) and pair_name.endswith(quote):
            return pair_name
    return None

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

        # Reset index (opcional pero útil para limpieza)
        return full_trades_df.reset_index(drop=True)

    except Exception as e:
        print(f"⚠️ Error obteniendo trades: {e}")
        return pd.DataFrame()

def obtener_portfolio_historico(kraken):
    """Para cada par, calcula el total cost, total fee, total vol y el avg price ponderado por volumen"""
    trades = get_all_trades(kraken)
    if trades.empty:
        return {}
    
    resumen = {}
    for pair in trades['pair'].unique():
        trades_pair = trades[trades['pair'] == pair]
        total_cost = trades_pair['cost'].astype(float).sum()
        total_fee = trades_pair['fee'].astype(float).sum()
        total_vol = trades_pair['vol'].astype(float).sum()
        
        # Precio medio ponderado por volumen
        avg_price = total_cost / total_vol if total_vol > 0 else 0
        
        resumen[pair] = {
            'total_cost': round(total_cost, 8),
            'total_fee': round(total_fee, 8),
            'total_vol': round(total_vol, 8),
            'avg_price': round(avg_price, 8)
        }
    return resumen

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
                # Los assets de Kraken vienen con prefijos, necesitamos el par exacto
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

def calcular_kpis_portfolio(kraken, portfolio_data, current_balances=None, current_prices=None):
    """Calcula los KPIs principales del portfolio con datos reales"""
    if not portfolio_data:
        return {
            "total_invested": 0,
            "current_value": 0,
            "liquidity": 0,
            "profit_neto": 0,
            "profit_porcentaje": 0,
            "total_portfolio_value": 0,
            "total_fees": 0,
            "profit_without_fees": 0,
            "return_on_investment": 0,
            "average_daily_return": 0
        }
    
    # 1. CALCULAR DATOS HISTÓRICOS
    total_invested = sum(data['total_cost'] for data in portfolio_data.values())
    total_fees = sum(data['total_fee'] for data in portfolio_data.values())
    total_invested_with_fees = total_invested + total_fees
    
    # 2. OBTENER BALANCES ACTUALES (reutilizar si ya se pasó)
    if current_balances is None:
        current_balances = get_current_balances(kraken)
    
    if current_balances.empty:
        return {
            "total_invested": round(total_invested_with_fees, 2),
            "current_value": 0,
            "liquidity": 0,
            "profit_neto": round(-total_fees, 2),
            "profit_porcentaje": 0,
            "total_portfolio_value": 0,
            "total_fees": round(total_fees, 2),
            "profit_without_fees": round(-total_fees, 2),
            "return_on_investment": 0,
            "average_daily_return": 0
        }
    
    # 3. OBTENER PRECIOS ACTUALES (reutilizar si ya se pasó)
    assets = [asset for asset in current_balances.index if float(current_balances.loc[asset, 'vol']) > 0]
    
    if current_prices is None:
        current_prices = get_current_prices(kraken, assets)
    
    # 4. CALCULAR VALORES ACTUALES
    current_value = 0
    liquidity = 0
    crypto_value = 0
    
    for asset in assets:
        balance = float(current_balances.loc[asset, 'vol'])
        price = current_prices.get(asset, 0)
        asset_value = balance * price
        
        current_value += asset_value
        
        # Liquidez = solo activos FIAT
        if asset in FIAT_ASSETS:
            liquidity += asset_value
        else:
            crypto_value += asset_value
    
    # 5. CALCULAR PROFITS Y RETORNOS
    profit_neto = current_value - total_invested_with_fees
    profit_without_fees = current_value - total_invested  # Profit sin contar fees
    profit_porcentaje = (profit_neto / total_invested_with_fees * 100) if total_invested_with_fees > 0 else 0
    return_on_investment = (profit_without_fees / total_invested * 100) if total_invested > 0 else 0
    
    # 6. ESTIMACIÓN DE RETORNO DIARIO PROMEDIO (basado en tiempo aproximado)
    # Asumimos que el portfolio lleva activo aproximadamente 30 días (ajustable)
    days_active = 30  # Hardcoded por ahora, se podría calcular dinámicamente
    average_daily_return = (profit_porcentaje / days_active) if days_active > 0 else 0
    
    return {
        "total_invested": round(total_invested_with_fees, 2),  # Total con fees
        "current_value": round(current_value, 2),
        "liquidity": round(liquidity, 2),
        "crypto_value": round(crypto_value, 2),
        "profit_neto": round(profit_neto, 2),
        "profit_porcentaje": round(profit_porcentaje, 2),
        "total_portfolio_value": round(current_value, 2),
        "total_fees": round(total_fees, 2),
        "profit_without_fees": round(profit_without_fees, 2),
        "return_on_investment": round(return_on_investment, 2),
        "average_daily_return": round(average_daily_return, 3)
    }


def get_complete_portfolio_data(kraken, portfolio_data):
    """Obtiene todos los datos necesarios con el mínimo de llamadas a Kraken"""
    # 1. Una sola llamada para balances
    current_balances = get_current_balances(kraken)
    if current_balances.empty:
        return None, None
    
    # 2. Una sola serie de llamadas para precios (solo activos con balance)
    assets = [asset for asset in current_balances.index if float(current_balances.loc[asset, 'vol']) > 0]
    current_prices = get_current_prices(kraken, assets)
    
    return current_balances, current_prices

@app.post("/api/portfolio")
async def portfolio_endpoint(req: PortfolioRequest):
    try:
        # Crear clave de caché basada en las credenciales API
        cache_key = hashlib.md5(f"{req.api_key}{req.api_secret}".encode()).hexdigest()
        current_time = time.time()
        
        # Verificar si hay datos en caché y no han expirado
        if cache_key in cache:
            cached_data, timestamp = cache[cache_key]
            if current_time - timestamp < CACHE_DURATION:
                print(f"📊 Devolviendo datos desde caché para evitar llamadas redundantes a Kraken")
                return cached_data
        
        # Crear API instance
        kraken = crear_kraken_api(req.api_key, req.api_secret)
        
        # Obtener datos históricos (no requiere llamadas API públicas)
        portfolio_data = obtener_portfolio_historico(kraken)
        
        # Obtener datos actuales con mínimas llamadas API
        current_balances, current_prices = get_complete_portfolio_data(kraken, portfolio_data)
        
        # Calcular KPIs reutilizando los datos obtenidos
        kpis = calcular_kpis_portfolio(kraken, portfolio_data, current_balances, current_prices)
        
        # Preparar resultado
        result = portfolio_data.copy()
        result["kpis"] = kpis
        
        # Guardar en caché
        cache[cache_key] = (result, current_time)
        return result
        
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    
    # Credenciales reales de Kraken (reemplaza con las tuyas)
    api_key = "IITH+u7wTKm8bCgcHstIxc+HpUKj75ylHlBkKSdf3HQCNOUCJaXQ9e+E"
    api_secret = "Qg4gE2ncHzy/mPu5x5nHZ1GAfvJFRJbUaQ/Lya2lP01TWIZBgc6IidMOkpt62wQJIJEPAwHOYuxRZEaHWRf1KA=="
    
    print("🚀 Iniciando servidor Portfolio Visualizer...")
    print("📊 Backend disponible en: http://localhost:8000")
    print("🌐 Frontend disponible en: http://localhost:5173")
    print("📖 Documentación API: http://localhost:8000/docs")
    print("=" * 50)

    # Test KPI calculations on startup with optimized calls
    try:
        kraken = crear_kraken_api(api_key, api_secret)
        historical_data = obtener_portfolio_historico(kraken)
        current_balances, current_prices = get_complete_portfolio_data(kraken, historical_data)
        kpis = calcular_kpis_portfolio(kraken, historical_data, current_balances, current_prices)
        print(f"✅ KPIs calculados: Portfolio: {kpis['total_portfolio_value']}€, Profit: {kpis['profit_neto']}€, Fees: {kpis['total_fees']}€")
    except Exception as e:
        print(f"⚠️ Error al calcular KPIs: {e}")

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)