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
    """Calcula los KPIs principales del portfolio: total invertido, valor actual, profit, profit %, liquidez y fees"""
    if not portfolio_data:
        return {
            "total_invested": 0,      # Total invertido SIN fees
            "current_value": 0,       # Valor actual del portfolio
            "profit": 0,              # Ganancia/pérdida neta
            "profit_percentage": 0,   # Ganancia/pérdida en %
            "liquidity": 0,           # Solo monedas fiat
            "fees": 0                 # Total de comisiones pagadas
        }
    
    # 1. CALCULAR DATOS HISTÓRICOS
    total_invested = sum(data['total_cost'] for data in portfolio_data.values())  # SIN fees
    total_fees = sum(data['total_fee'] for data in portfolio_data.values())
    
    # 2. OBTENER BALANCES ACTUALES (reutilizar si ya se pasó)
    if current_balances is None:
        current_balances = get_current_balances(kraken)
    
    if current_balances.empty:
        return {
            "total_invested": round(total_invested, 2),
            "current_value": 0,
            "profit": round(-total_fees, 2),  # Solo las fees como pérdida
            "profit_percentage": 0,
            "liquidity": 0,
            "fees": round(total_fees, 2)
        }
    
    # 3. OBTENER PRECIOS ACTUALES (reutilizar si ya se pasó)
    assets = [asset for asset in current_balances.index if float(current_balances.loc[asset, 'vol']) > 0]
    
    if current_prices is None:
        current_prices = get_current_prices(kraken, assets)
    
    # 4. CALCULAR VALORES ACTUALES
    current_value = 0  # Solo crypto, SIN liquidez
    liquidity = 0      # Solo fiat
    
    for asset in assets:
        balance = float(current_balances.loc[asset, 'vol'])
        price = current_prices.get(asset, 0)
        asset_value = balance * price
        
        # Separar liquidez (fiat) del valor actual (crypto)
        if asset in FIAT_ASSETS:
            liquidity += asset_value  # Solo fiat
        else:
            current_value += asset_value  # Solo crypto
    
    # 5. CALCULAR PROFIT Y PORCENTAJE
    # Profit = Valor actual crypto - Total invertido - Fees pagadas (SIN contar liquidez)
    profit = current_value - total_invested - total_fees
    profit_percentage = (profit / (total_invested + total_fees) * 100) if (total_invested + total_fees) > 0 else 0
    
    return {
        "total_invested": round(total_invested, 2),           # Total invertido SIN fees
        "current_value": round(current_value, 2),            # Valor actual completo
        "profit": round(profit, 2),                          # Ganancia neta
        "profit_percentage": round(profit_percentage, 2),    # Ganancia en %
        "liquidity": round(liquidity, 2),                    # Solo fiat
        "fees": round(total_fees, 2)                         # Total comisiones
    }


def get_asset_breakdown(kraken, portfolio_data, current_balances=None, current_prices=None):
    """Desglose detallado por asset del portfolio"""
    if not portfolio_data:
        return {}
    
    # Obtener datos actuales si no se proporcionan
    if current_balances is None:
        current_balances = get_current_balances(kraken)
    
    breakdown = {}
    
    # Primero: agregar todos los assets que tienen datos históricos (incluso si balance = 0)
    for pair, historical_data in portfolio_data.items():
        # Extraer el asset base del par (ej: XXBTZEUR -> XXBT)
        asset = pair.replace('ZEUR', '').replace('EUR', '')
        if asset.endswith('Z'):
            asset = asset[:-1]  # Remover Z final si existe
        
        # Si no existe el asset exacto, buscar en current_balances
        if not current_balances.empty and asset not in current_balances.index:
            # Buscar asset similar en balances actuales
            possible_assets = [a for a in current_balances.index if asset in a or a in asset]
            if possible_assets:
                asset = possible_assets[0]
        
        # Obtener balance actual
        balance = 0
        if not current_balances.empty and asset in current_balances.index:
            balance = float(current_balances.loc[asset, 'vol'])
        
        # Obtener precio actual si no se ha proporcionado
        current_price = 0
        if current_prices and asset in current_prices:
            current_price = current_prices[asset]
        elif balance > 0:  # Solo buscar precio si tiene balance
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
        
        # Calcular profit/loss para este asset
        profit_loss = current_value - invested_amount - fees_paid
        profit_percentage = (profit_loss / (invested_amount + fees_paid) * 100) if (invested_amount + fees_paid) > 0 else 0
        
        # Determinar tipo de asset
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
            "is_sold": balance == 0  # Marcar si se vendió completamente
        }
    
    # Segundo: agregar assets con balance pero sin datos históricos (ej: transferencias)
    if not current_balances.empty:
        for asset in current_balances.index:
            balance = float(current_balances.loc[asset, 'vol'])
            if balance > 0 and asset not in breakdown:
                # Asset con balance pero sin datos históricos
                current_price = current_prices.get(asset, 0) if current_prices else 0
                current_value = balance * current_price
                
                asset_type = "fiat" if asset in FIAT_ASSETS else "crypto"
                
                breakdown[asset] = {
                    "asset_name": asset,
                    "asset_type": asset_type,
                    "balance": round(balance, 8),
                    "current_price": round(current_price, 8),
                    "current_value": round(current_value, 2),
                    "invested_amount": 0,  # No hay datos históricos
                    "fees_paid": 0,
                    "avg_buy_price": 0,
                    "profit_loss": round(current_value, 2),  # Todo es ganancia si no hay inversión
                    "profit_percentage": 0,
                    "has_historical_data": False,
                    "is_sold": False
                }
    
    return breakdown

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
        
        # Obtener desglose por asset
        asset_breakdown = get_asset_breakdown(kraken, portfolio_data, current_balances, current_prices)
        
        # Convertir asset_breakdown a formato compatible con frontend
        portfolio_array = []
        for asset_name, asset_data in asset_breakdown.items():
            portfolio_array.append({
                "asset": asset_name,
                "asset_type": asset_data["asset_type"],
                "amount": asset_data["balance"],
                "average_cost": asset_data["avg_buy_price"],
                "current_price": asset_data["current_price"],
                "total_invested": asset_data["invested_amount"],
                "fees_paid": asset_data["fees_paid"],
                "current_value": asset_data["current_value"],
                "pnl_eur": asset_data["profit_loss"],
                "pnl_percent": asset_data["profit_percentage"]
            })
        
        # Preparar resultado
        result = portfolio_data.copy()
        result["kpis"] = kpis
        result["asset_breakdown"] = asset_breakdown
        result["portfolio_data"] = portfolio_array  # Datos en formato array para frontend
        
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
        #asset_breakdown = get_asset_breakdown(kraken, historical_data, current_balances, current_prices)
        print(kpis)
        
        #print(f"✅ KPIs calculados: Invertido: {kpis['total_invested']}€, Current Value: {kpis['current_value']}€, Profit: {kpis['profit']}€ ({kpis['profit_percentage']}%), Fees: {kpis['fees']}€, Liquidez: {kpis['liquidity']}€")
        #print(f"📊 Assets encontrados: {len(asset_breakdown)} ({len([a for a in asset_breakdown.values() if a['asset_type'] == 'crypto'])} crypto, {len([a for a in asset_breakdown.values() if a['asset_type'] == 'fiat'])} fiat)")
    except Exception as e:
        print(f"⚠️ Error al calcular KPIs: {e}")

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)