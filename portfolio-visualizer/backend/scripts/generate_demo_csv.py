#!/usr/bin/env python3
"""
Genera un CSV demo con operaciones ficticias de trading en Kraken.
Usa precios REALES de Supabase para que los trades sean coherentes.
Estrategia: comprar en dips, vender en rallies → portfolio rentable.
~350 operaciones, 12 assets, rango dic 2024 - mar 2026.
"""
import csv
import random
import math
import sys
import os
from datetime import datetime, date, timedelta
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from supabase_cache import cache

random.seed(42)

# Assets y configuración
ASSETS_CONFIG = {
    'BTC':   {'backend': 'XXBT', 'step': 0.001,  'typical_eur': (80, 500),  'weight': 25},
    'ETH':   {'backend': 'XETH', 'step': 0.01,   'typical_eur': (40, 300),  'weight': 18},
    'SOL':   {'backend': 'SOL',  'step': 0.1,    'typical_eur': (25, 200),  'weight': 12},
    'XRP':   {'backend': 'XRP',  'step': 1.0,    'typical_eur': (20, 150),  'weight': 10},
    'ADA':   {'backend': 'ADA',  'step': 10.0,   'typical_eur': (20, 120),  'weight': 8},
    'DOT':   {'backend': 'DOT',  'step': 1.0,    'typical_eur': (20, 100),  'weight': 6},
    'LINK':  {'backend': 'LINK', 'step': 0.5,    'typical_eur': (20, 120),  'weight': 8},
    'AVAX':  {'backend': 'AVAX', 'step': 0.5,    'typical_eur': (20, 100),  'weight': 6},
    'DOGE':  {'backend': 'XDG',  'step': 50.0,   'typical_eur': (15, 80),   'weight': 7},
    'ATOM':  {'backend': 'ATOM', 'step': 1.0,    'typical_eur': (20, 80),   'weight': 5},
    'UNI':   {'backend': 'UNI',  'step': 1.0,    'typical_eur': (20, 80),   'weight': 5},
    'TRUMP': {'backend': 'TRUMP','step': 0.5,    'typical_eur': (15, 100),  'weight': 6},
}

def fake_txid():
    s = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=16))
    return f"T{s[:5]}-{s[5:10]}-{s[10:]}"

def fake_orderid():
    s = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=16))
    return f"O{s[:5]}-{s[5:10]}-{s[10:]}"

def fake_ledger():
    s1 = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=16))
    s2 = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=16))
    return f"L{s1[:5]}-{s1[5:10]}-{s1[10:]},L{s2[:5]}-{s2[5:10]}-{s2[10:]}"

def load_real_prices():
    """Carga precios reales de Supabase para todos los assets"""
    print("Cargando precios reales de Supabase...")
    prices = {}  # {backend_asset: {date: price}}

    backend_assets = [cfg['backend'] for cfg in ASSETS_CONFIG.values()]
    start = date(2024, 12, 1)
    end = date(2026, 3, 18)

    batch = cache.obtener_precios_cache_batch(backend_assets, start, end)

    for asset, date_prices in batch.items():
        prices[asset] = date_prices
        print(f"  {asset}: {len(date_prices)} precios")

    return prices

def get_price_percentile(prices_dict, current_date, lookback_days=60):
    """
    Calcula en qué percentil está el precio actual respecto a los últimos N días.
    Retorna 0.0 (mínimo local) a 1.0 (máximo local).
    """
    current_price = prices_dict.get(current_date)
    if current_price is None:
        return 0.5

    lookback_prices = []
    for i in range(1, lookback_days + 1):
        d = current_date - timedelta(days=i)
        p = prices_dict.get(d)
        if p is not None:
            lookback_prices.append(p)

    if len(lookback_prices) < 10:
        return 0.5

    below = sum(1 for p in lookback_prices if p <= current_price)
    return below / len(lookback_prices)

def generate_trades(real_prices):
    """Genera trades usando precios reales y estrategia smart"""
    trades = []

    start = date(2024, 12, 10)
    end = date(2026, 3, 10)
    total_days = (end - start).days

    holdings = defaultdict(float)       # cantidad actual por asset
    avg_cost = defaultdict(float)       # coste medio por asset

    # Pool de assets con pesos
    asset_pool = []
    for asset, cfg in ASSETS_CONFIG.items():
        asset_pool.extend([asset] * cfg['weight'])

    trump_start = date(2025, 1, 18)

    # Generar fechas de operación (~350)
    target_trades = 360
    trade_dates = sorted([start + timedelta(days=random.randint(0, total_days))
                         for _ in range(target_trades)])

    for trade_date in trade_dates:
        asset = random.choice(asset_pool)
        cfg = ASSETS_CONFIG[asset]
        backend = cfg['backend']

        # TRUMP no disponible antes de su launch
        if asset == 'TRUMP' and trade_date < trump_start:
            asset = random.choice(['BTC', 'ETH', 'SOL', 'XRP'])
            cfg = ASSETS_CONFIG[asset]
            backend = cfg['backend']

        # Obtener precio real
        price_data = real_prices.get(backend, {})
        price = price_data.get(trade_date)
        if price is None:
            # Buscar día más cercano
            for delta in range(1, 5):
                price = price_data.get(trade_date - timedelta(days=delta))
                if price:
                    break
            if price is None:
                continue

        # Calcular percentil (¿precio alto o bajo respecto al pasado reciente?)
        percentile = get_price_percentile(price_data, trade_date, lookback_days=45)

        # --- ESTRATEGIA SMART ---
        # Probabilidad de venta sube con el percentil (vender en rallies)
        # Probabilidad de compra sube cuando el percentil es bajo (comprar en dips)

        has_holdings = holdings[asset] > 0
        has_profit = has_holdings and price > avg_cost[asset] * 1.05

        should_sell = False
        if has_holdings:
            if percentile > 0.80 and has_profit:
                # Rally + profit → alta probabilidad de venta
                should_sell = random.random() < 0.65
            elif percentile > 0.65 and has_profit:
                # Precio alto + profit → venta moderada
                should_sell = random.random() < 0.35
            elif percentile < 0.25:
                # Precio bajo → casi nunca vender (no vender en dips)
                should_sell = random.random() < 0.05
            else:
                # Neutral → venta baja
                should_sell = random.random() < 0.12

        if should_sell:
            # SELL — vender parte de holdings
            if percentile > 0.80:
                sell_fraction = random.uniform(0.3, 0.6)  # Vender más en rally
            elif percentile > 0.60:
                sell_fraction = random.uniform(0.15, 0.35)
            else:
                sell_fraction = random.uniform(0.05, 0.15)  # Vender poco

            vol = holdings[asset] * sell_fraction

            # Redondear
            if cfg['step'] >= 1.0:
                vol = round(vol, 1)
            else:
                vol = round(vol, 8)

            if vol <= 0:
                continue

            cost = round(vol * price, 5)
            fee = round(cost * random.uniform(0.0020, 0.0035), 5)
            holdings[asset] -= vol
            tipo = 'sell'
        else:
            # BUY — comprar más en dips
            if percentile < 0.20:
                # Dip → compra grande (DCA agresivo)
                buy_eur = random.uniform(cfg['typical_eur'][0] * 1.5, cfg['typical_eur'][1] * 1.8)
            elif percentile < 0.40:
                # Precio bajo-medio → compra normal-grande
                buy_eur = random.uniform(cfg['typical_eur'][0], cfg['typical_eur'][1] * 1.2)
            elif percentile > 0.80:
                # Precio muy alto → compra pequeña o skip
                if random.random() < 0.3:
                    continue  # Skip: no comprar en ATH
                buy_eur = random.uniform(cfg['typical_eur'][0] * 0.5, cfg['typical_eur'][0] * 1.2)
            else:
                # Normal → compra normal
                buy_eur = random.uniform(*cfg['typical_eur'])

            vol = buy_eur / price

            # Redondear
            if cfg['step'] >= 1.0:
                vol = round(vol, 1)
            else:
                vol = round(vol, 8)

            if vol <= 0:
                continue

            cost = round(vol * price, 5)
            fee = round(cost * random.uniform(0.0020, 0.0035), 5)

            # Actualizar coste medio
            old_total = holdings[asset] * avg_cost[asset]
            holdings[asset] += vol
            avg_cost[asset] = (old_total + cost) / holdings[asset] if holdings[asset] > 0 else 0

            tipo = 'buy'

        # Hora aleatoria durante el día
        hour = random.randint(7, 23)
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        trade_dt = datetime.combine(trade_date, datetime.min.time().replace(
            hour=hour, minute=minute, second=second))

        order_type = random.choice(['limit', 'limit', 'limit', 'market'])

        trades.append({
            'txid': fake_txid(),
            'ordertxid': fake_orderid(),
            'pair': f'{asset}/EUR',
            'aclass': 'forex',
            'subclass': 'crypto',
            'time': trade_dt.strftime('%Y-%m-%d %H:%M:%S.') + f'{random.randint(1000, 9999)}',
            'type': tipo,
            'ordertype': order_type,
            'price': f'{price:.5f}',
            'cost': f'{cost:.5f}',
            'fee': f'{fee:.5f}',
            'vol': f'{vol:.8f}',
            'margin': '0.00000',
            'misc': '',
            'ledgers': fake_ledger(),
            'posttxid': fake_txid(),
            'posstatuscode': '',
            'cprice': '',
            'ccost': '',
            'cfee': '',
            'cvol': '',
            'cmargin': '',
            'net': '',
            'trades': '',
        })

    return trades

def main():
    real_prices = load_real_prices()
    trades = generate_trades(real_prices)

    # Ordenar por fecha
    trades.sort(key=lambda t: t['time'])

    output_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        '..', 'public', 'demo_trades.csv'
    )
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    fieldnames = ['txid', 'ordertxid', 'pair', 'aclass', 'subclass', 'time',
                  'type', 'ordertype', 'price', 'cost', 'fee', 'vol', 'margin',
                  'misc', 'ledgers', 'posttxid', 'posstatuscode', 'cprice',
                  'ccost', 'cfee', 'cvol', 'cmargin', 'net', 'trades']

    with open(output_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(trades)

    # Stats
    buys = sum(1 for t in trades if t['type'] == 'buy')
    sells = len(trades) - buys
    assets_used = set(t['pair'].split('/')[0] for t in trades)
    total_bought = sum(float(t['cost']) for t in trades if t['type'] == 'buy')
    total_sold = sum(float(t['cost']) for t in trades if t['type'] == 'sell')
    date_range = f"{trades[0]['time'][:10]} -> {trades[-1]['time'][:10]}"

    print(f"\nDemo CSV generado: {output_path}")
    print(f"  Total trades: {len(trades)}")
    print(f"  Buys: {buys}, Sells: {sells}")
    print(f"  Assets: {len(assets_used)} ({', '.join(sorted(assets_used))})")
    print(f"  Rango: {date_range}")
    print(f"  Total comprado: {total_bought:,.2f} EUR")
    print(f"  Total vendido:  {total_sold:,.2f} EUR")
    print(f"  Realized P&L:   {total_sold - (total_sold/total_bought)*total_bought:+,.2f} EUR (aprox)")

if __name__ == '__main__':
    main()
