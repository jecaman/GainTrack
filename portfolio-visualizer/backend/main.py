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

FIAT_ASSETS = ["ZEUR", "ZUSD", "ZGBP"]

class PortfolioRequest(BaseModel):
    api_key: str
    api_secret: str

# --- Lógica de Kraken (adaptada del código proporcionado) ---
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

def obtener_rentabilidad_optimizada(kraken):
    """Versión optimizada que reutiliza la instancia de KrakenAPI"""
    since = int((datetime.now() - timedelta(days=365 * 50)).timestamp())
    trades, _ = kraken.get_trades_history(start=since)
    resultados = []
    unique_pairs = trades['pair'].unique()
    for pair in unique_pairs:
        if not isinstance(pair, str):
            continue
        for fiat in FIAT_ASSETS:
            if pair.endswith(fiat):
                asset = pair.replace(fiat, '')
                break
        else:
            continue
        if asset in FIAT_ASSETS:
            continue
        valid_pair = get_valid_pair(kraken, asset)
        if not valid_pair:
            continue
        try:
            current_price = float(kraken.get_ticker_information(valid_pair).loc[valid_pair]["c"][0])
        except:
            continue
        trades_asset = trades[trades['pair'] == pair]
        buys = trades_asset[trades_asset['type'] == 'buy']
        sells = trades_asset[trades_asset['type'] == 'sell']
        total_bought = buys['vol'].astype(float).sum()
        total_cost = buys['cost'].astype(float).sum()
        total_sold = sells['vol'].astype(float).sum()
        net_volume = total_bought - total_sold
        if net_volume <= 0:
            continue
        avg_price = total_cost / total_bought if total_bought > 0 else current_price
        current_value = net_volume * current_price
        pnl = current_value - total_cost
        pnl_percent = (pnl / total_cost) * 100 if total_cost > 0 else 0
        resultados.append({
            "asset": asset,
            "amount": round(net_volume, 8),
            "average_cost": round(avg_price, 2),
            "current_price": round(current_price, 2),
            "total_invested": round(total_cost, 2),
            "current_value": round(current_value, 2),
            "pnl_eur": round(pnl, 2),
            "pnl_percent": round(pnl_percent, 2)
        })
    balances = kraken.get_account_balance()
    for fiat in FIAT_ASSETS:
        if fiat in balances.index:
            amount = float(balances.loc[fiat]['vol'])
            if amount > 0:
                resultados.append({
                    "asset": fiat,
                    "amount": amount,
                    "average_cost": None,
                    "current_price": 1.0,
                    "total_invested": None,
                    "current_value": round(amount, 2),
                    "pnl_eur": None,
                    "pnl_percent": None
                })
    return resultados, trades

def obtener_rentabilidad(api_key, api_secret):
    """Función original que mantiene compatibilidad"""
    kraken = crear_kraken_api(api_key, api_secret)
    return obtener_rentabilidad_optimizada(kraken)

def reconstruir_holdings_diarios(trades_df):
    trades_df["date"] = pd.to_datetime(trades_df["time"], unit="s").dt.date
    start = trades_df["date"].min()
    end = datetime.now().date()
    date_range = pd.date_range(start=start, end=end)
    holdings = {}
    cumulative = {}
    for date in date_range:
        fecha_actual = date.date()
        trades_del_dia = trades_df[trades_df["date"] == fecha_actual]
        for _, trade in trades_del_dia.iterrows():
            pair = trade["pair"]
            tipo = trade["type"]
            vol = float(trade["vol"])
            for fiat in FIAT_ASSETS:
                if pair.endswith(fiat):
                    asset = pair.replace(fiat, "")
                    break
            else:
                continue
            if asset not in cumulative:
                cumulative[asset] = 0.0
            cumulative[asset] += vol if tipo == "buy" else -vol
        holdings[str(fecha_actual)] = cumulative.copy()
    return holdings

def obtener_precios_diarios(asset, kraken, start_date, end_date, quote='ZEUR'):
    pair = asset + quote
    try:
        ohlc, _ = kraken.get_ohlc_data(pair, interval=1440, since=pd.to_datetime(start_date))
    except Exception as e:
        return {}
    ohlc = ohlc[(ohlc.index.date >= pd.to_datetime(start_date).date()) &
                (ohlc.index.date <= pd.to_datetime(end_date).date())]
    precios_diarios = {}
    for date, row in ohlc.iterrows():
        fecha = date.strftime('%Y-%m-%d')
        precio_cierre = float(row['close'])
        precios_diarios[fecha] = precio_cierre
    return precios_diarios

def calcular_profit_timeline(trades_df, holdings_diarios, precios_por_asset):
    trades_df["date"] = pd.to_datetime(trades_df["time"], unit="s").dt.date
    trades_df = trades_df.sort_values(by="time")
    profit_timeline = []
    lotes_por_asset = {}
    for fecha_str in sorted(holdings_diarios.keys()):
        fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        trades_dia = trades_df[trades_df["date"] == fecha]
        for _, trade in trades_dia.iterrows():
            pair = trade["pair"]
            tipo = trade["type"]
            vol = float(trade["vol"])
            cost = float(trade["cost"])
            if tipo != "buy":
                continue
            for fiat in FIAT_ASSETS:
                if pair.endswith(fiat):
                    asset = pair.replace(fiat, "")
                    break
            else:
                continue
            if asset not in lotes_por_asset:
                lotes_por_asset[asset] = []
            lotes_por_asset[asset].append({
                "amount": vol,
                "price": cost / vol if vol > 0 else 0
            })
        snapshot = holdings_diarios[fecha_str]
        valor_mercado_total = 0
        coste_real_total = 0
        for asset, cantidad_actual in snapshot.items():
            if cantidad_actual <= 0:
                continue
            precio_dia = precios_por_asset.get(asset, {}).get(fecha_str)
            if precio_dia is None:
                continue
            valor_mercado_total += cantidad_actual * precio_dia
            lotes = lotes_por_asset.get(asset, [])
            restante = cantidad_actual
            coste_acumulado = 0
            i = 0
            while restante > 0 and i < len(lotes):
                lote = lotes[i]
                disponible = min(restante, lote["amount"])
                coste_acumulado += disponible * lote["price"]
                restante -= disponible
                i += 1
            coste_real_total += coste_acumulado
        profit = valor_mercado_total - coste_real_total
        profit_pct = (profit / coste_real_total * 100) if coste_real_total > 0 else 0
        profit_timeline.append({
            "date": fecha_str,
            "value": round(valor_mercado_total, 2),
            "cost": round(coste_real_total, 2),
            "profit": round(profit, 2),
            "profit_pct": round(profit_pct, 2)
        })
    return profit_timeline

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
        
        print(f"🔄 Obteniendo datos frescos de Kraken API...")
        
        # Crear una sola instancia de KrakenAPI para reutilizar
        kraken = crear_kraken_api(req.api_key, req.api_secret)
        
        summary, trades_df = obtener_rentabilidad_optimizada(kraken)
        holdings_diarios = reconstruir_holdings_diarios(trades_df)
        precios_por_asset = {}
        
        # Obtener precios para todos los assets de una vez, reutilizando la conexión
        for asset in set([a['asset'] for a in summary if a['average_cost'] is not None]):
            precios_por_asset[asset] = obtener_precios_diarios(
                asset, kraken,  # Reutilizar la misma instancia
                min(holdings_diarios.keys()), max(holdings_diarios.keys())
            )
        
        timeline = calcular_profit_timeline(trades_df, holdings_diarios, precios_por_asset)
        result = {"summary": summary, "timeline": timeline}
        
        # Guardar en caché
        cache[cache_key] = (result, current_time)
        print(f"✅ Datos guardados en caché por {CACHE_DURATION} segundos")
        
        return result
    except Exception as e:
        print(f"❌ Error al obtener datos de portfolio: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 