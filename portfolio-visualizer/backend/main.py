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
        kraken = crear_kraken_api(req.api_key, req.api_secret)
        result = obtener_portfolio_historico(kraken)
        
        # Añadir KPIs al resultado
        kpis = calcular_kpis_portfolio(result)
        result["kpis"] = kpis
        
        cache[cache_key] = (result, current_time)
        print(f"✅ Datos guardados en caché por {CACHE_DURATION} segundos")
        return result
    except Exception as e:
        print(f"❌ Error al obtener datos de portfolio: {str(e)}")
        return {"error": str(e)}

@app.post("/api/kpis")
async def kpis_endpoint(req: PortfolioRequest):
    """Endpoint específico para obtener solo los KPIs del portfolio"""
    try:
        kraken = crear_kraken_api(req.api_key, req.api_secret)
        portfolio_data = obtener_portfolio_historico(kraken)
        kpis = calcular_kpis_portfolio(portfolio_data)
        return kpis
    except Exception as e:
        print(f"❌ Error al obtener KPIs: {str(e)}")
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
    
    # Obtener y mostrar solo los KPIs
    kraken = crear_kraken_api(api_key, api_secret)
    print(len(get_all_trades(kraken)))
    print(obtener_portfolio_historico(kraken))
   
    # portfolio_data = obtener_portfolio_historico(kraken)
    # print(portfolio_data)
    # kpis = calcular_kpis_portfolio(portfolio_data)
    
    # print("📈 KPIs DEL PORTFOLIO:")
    # print(f"💰 Total Invertido: {kpis['total_invested']} EUR")
    # print(f"💎 Valor Actual: {kpis['current_value']} EUR")
    # print(f"💵 Liquidez: {kpis['liquidity']} EUR")
    # print(f"📈 Profit Neto: {kpis['profit_neto']} EUR ({kpis['profit_porcentaje']}%)")
    # print(f"🏦 Valor Total Portfolio: {kpis['total_portfolio_value']} EUR")
    # print("=" * 50)
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)