import pandas as pd
import io
from datetime import datetime
import requests
import time

def calcular_suma_cost(csv_content):
    """
    Calcula la suma total de la columna 'cost' de un CSV de trades de Kraken.
    
    Args:
        csv_content (str): Contenido del archivo CSV como string
        
    Returns:
        dict: Resultado con la suma total o error
    """
    try:
        # Parsear el CSV
        df = pd.read_csv(io.StringIO(csv_content))
        
        # Verificar que existe la columna 'cost'
        if 'cost' not in df.columns:
            return {"error": "La columna 'cost' no existe en el CSV"}
        
        # Convertir a numérico y calcular suma
        df['cost'] = pd.to_numeric(df['cost'], errors='coerce')
        suma_total = df['cost'].sum()
        
        # Estadísticas adicionales
        num_trades = len(df)
        cost_promedio = df['cost'].mean()
        cost_maximo = df['cost'].max()
        cost_minimo = df['cost'].min()
        
        return {
            "suma_total_cost": round(suma_total, 2),
            "estadisticas": {
                "numero_trades": num_trades,
                "cost_promedio": round(cost_promedio, 2),
                "cost_maximo": round(cost_maximo, 2),
                "cost_minimo": round(cost_minimo, 2)
            }
        }
        
    except Exception as e:
        return {"error": f"Error calculando suma de cost: {str(e)}"}

def calcular_suma_cost_desde_archivo(ruta_archivo):
    """
    Calcula la suma de cost desde un archivo CSV.
    
    Args:
        ruta_archivo (str): Ruta al archivo CSV
        
    Returns:
        dict: Resultado con la suma total o error
    """
    try:
        with open(ruta_archivo, 'r', encoding='utf-8') as file:
            csv_content = file.read()
        return calcular_suma_cost(csv_content)
    except Exception as e:
        return {"error": f"Error leyendo archivo: {str(e)}"}

def calcular_cost_fifo(csv_content):
    """
    Calcula el cost neto usando método FIFO (First In, First Out).
    Las ventas consumen los lotes de compra más antiguos primero.
    
    Args:
        csv_content (str): Contenido del archivo CSV como string
        
    Returns:
        dict: Resultado con cost neto por asset y totales
    """
    try:
        # Parsear el CSV
        df = pd.read_csv(io.StringIO(csv_content))
        
        # Verificar columnas requeridas
        required_columns = ['time', 'type', 'pair', 'cost', 'vol']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return {"error": f"Faltan columnas requeridas: {missing_columns}"}
        
        # Convertir time a datetime y ordenar cronológicamente
        df['time'] = pd.to_datetime(df['time'])
        df = df.sort_values('time').copy()
        
        # Filtrar solo trades de buy/sell
        df = df[df['type'].isin(['buy', 'sell'])].copy()
        
        # Procesar cada asset por separado
        assets_data = {}
        
        for _, trade in df.iterrows():
            pair = str(trade['pair'])
            # Extraer asset del par (remover EUR, USD, etc.)
            asset = pair.replace('ZEUR', '').replace('EUR', '').replace('USD', '').replace('GBP', '').replace('CAD', '').rstrip('/')
            if asset == pair:
                asset = pair
            
            if asset not in assets_data:
                assets_data[asset] = {
                    'buy_lots': [],  # Lista de lotes de compra [{vol, cost, timestamp}]
                    'total_invested': 0,  # Cost neto actual invertido
                    'total_bought': 0,    # Total gastado en compras
                    'total_sold': 0,      # Total recibido por ventas
                    'remaining_volume': 0 # Volumen restante
                }
            
            vol = float(trade['vol'])
            cost = float(trade['cost'])
            timestamp = trade['time']
            
            if trade['type'] == 'buy':
                # Agregar nuevo lote de compra
                assets_data[asset]['buy_lots'].append({
                    'vol': vol,
                    'cost': cost,
                    'timestamp': timestamp
                })
                assets_data[asset]['total_invested'] += cost
                assets_data[asset]['total_bought'] += cost
                assets_data[asset]['remaining_volume'] += vol
                
            else:  # sell
                # Consumir lotes FIFO
                remaining_to_sell = vol
                cost_to_remove = 0
                
                while remaining_to_sell > 0 and assets_data[asset]['buy_lots']:
                    # Tomar el lote más antiguo (FIFO)
                    oldest_lot = assets_data[asset]['buy_lots'][0]
                    
                    if oldest_lot['vol'] <= remaining_to_sell:
                        # Consumir todo el lote
                        cost_to_remove += oldest_lot['cost']
                        remaining_to_sell -= oldest_lot['vol']
                        assets_data[asset]['buy_lots'].pop(0)
                        
                    else:
                        # Consumir parcialmente el lote
                        cost_per_unit = oldest_lot['cost'] / oldest_lot['vol']
                        partial_cost = remaining_to_sell * cost_per_unit
                        cost_to_remove += partial_cost
                        
                        # Actualizar el lote restante
                        oldest_lot['vol'] -= remaining_to_sell
                        oldest_lot['cost'] -= partial_cost
                        remaining_to_sell = 0
                
                # Actualizar totales
                assets_data[asset]['total_invested'] -= cost_to_remove
                assets_data[asset]['total_sold'] += cost
                assets_data[asset]['remaining_volume'] -= vol
        
        # Preparar resultado
        assets_result = {}
        total_invested = 0
        total_bought = 0
        total_sold = 0
        
        for asset, data in assets_data.items():
            assets_result[asset] = {
                'cost_neto_invertido': round(data['total_invested'], 2),
                'total_comprado': round(data['total_bought'], 2),
                'total_vendido': round(data['total_sold'], 2),
                'volumen_restante': round(data['remaining_volume'], 6),
                'lotes_activos': len(data['buy_lots'])
            }
            
            total_invested += data['total_invested']
            total_bought += data['total_bought']
            total_sold += data['total_sold']
        
        return {
            "metodo": "FIFO",
            "assets": assets_result,
            "totales": {
                "cost_neto_total": round(total_invested, 2),
                "total_comprado": round(total_bought, 2),
                "total_vendido": round(total_sold, 2),
                "diferencia": round(total_bought - total_sold, 2)
            }
        }
        
    except Exception as e:
        return {"error": f"Error calculando cost FIFO: {str(e)}"}

def calcular_cost_fifo_desde_archivo(ruta_archivo):
    """
    Calcula el cost FIFO desde un archivo CSV.
    
    Args:
        ruta_archivo (str): Ruta al archivo CSV
        
    Returns:
        dict: Resultado con cost FIFO o error
    """
    try:
        with open(ruta_archivo, 'r', encoding='utf-8') as file:
            csv_content = file.read()
        return calcular_cost_fifo(csv_content)
    except Exception as e:
        return {"error": f"Error leyendo archivo: {str(e)}"}

def calcular_realized_gains_fifo(csv_content):
    """
    Calcula las ganancias realizadas (Realized Gains) usando método FIFO.
    Realized Gains = Ingresos por ventas - Coste de los lotes vendidos (FIFO).
    
    Args:
        csv_content (str): Contenido del archivo CSV como string
        
    Returns:
        dict: Realized gains por asset y total
    """
    try:
        # Parsear el CSV
        df = pd.read_csv(io.StringIO(csv_content))
        
        # Verificar columnas requeridas
        required_columns = ['time', 'type', 'pair', 'cost', 'vol']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return {"error": f"Faltan columnas requeridas: {missing_columns}"}
        
        # Convertir time a datetime y ordenar cronológicamente
        df['time'] = pd.to_datetime(df['time'])
        df = df.sort_values('time').copy()
        
        # Filtrar solo trades de buy/sell
        df = df[df['type'].isin(['buy', 'sell'])].copy()
        
        # Procesar cada asset por separado
        assets_realized_gains = {}
        
        for _, trade in df.iterrows():
            pair = str(trade['pair'])
            # Extraer asset del par
            asset = pair.replace('ZEUR', '').replace('EUR', '').replace('USD', '').replace('GBP', '').replace('CAD', '').rstrip('/')
            if asset == pair:
                asset = pair
            
            if asset not in assets_realized_gains:
                assets_realized_gains[asset] = {
                    'buy_lots': [],  # Lista de lotes de compra [{vol, cost, timestamp}]
                    'realized_gains': 0,  # Ganancias realizadas acumuladas
                    'total_sold_revenue': 0,  # Total ingresos por ventas
                    'total_sold_cost': 0,     # Total coste de lotes vendidos (FIFO)
                    'sales_count': 0          # Número de ventas
                }
            
            vol = float(trade['vol'])
            cost = float(trade['cost'])
            timestamp = trade['time']
            
            if trade['type'] == 'buy':
                # Agregar nuevo lote de compra
                assets_realized_gains[asset]['buy_lots'].append({
                    'vol': vol,
                    'cost': cost,
                    'timestamp': timestamp
                })
                
            else:  # sell
                # Calcular realized gains de esta venta usando FIFO
                remaining_to_sell = vol
                cost_of_sold_lots = 0
                sale_revenue = cost  # En ventas, 'cost' es el ingreso
                
                while remaining_to_sell > 0 and assets_realized_gains[asset]['buy_lots']:
                    # Tomar el lote más antiguo (FIFO)
                    oldest_lot = assets_realized_gains[asset]['buy_lots'][0]
                    
                    if oldest_lot['vol'] <= remaining_to_sell:
                        # Consumir todo el lote
                        cost_of_sold_lots += oldest_lot['cost']
                        remaining_to_sell -= oldest_lot['vol']
                        assets_realized_gains[asset]['buy_lots'].pop(0)
                        
                    else:
                        # Consumir parcialmente el lote
                        cost_per_unit = oldest_lot['cost'] / oldest_lot['vol']
                        partial_cost = remaining_to_sell * cost_per_unit
                        cost_of_sold_lots += partial_cost
                        
                        # Actualizar el lote restante
                        oldest_lot['vol'] -= remaining_to_sell
                        oldest_lot['cost'] -= partial_cost
                        remaining_to_sell = 0
                
                # Calcular realized gain de esta venta
                realized_gain_this_sale = sale_revenue - cost_of_sold_lots
                
                # Actualizar totales
                assets_realized_gains[asset]['realized_gains'] += realized_gain_this_sale
                assets_realized_gains[asset]['total_sold_revenue'] += sale_revenue
                assets_realized_gains[asset]['total_sold_cost'] += cost_of_sold_lots
                assets_realized_gains[asset]['sales_count'] += 1
        
        # Preparar resultado
        assets_result = {}
        total_realized_gains = 0
        total_sold_revenue = 0
        total_sold_cost = 0
        total_sales = 0
        
        for asset, data in assets_realized_gains.items():
            if data['sales_count'] > 0:  # Solo incluir assets con ventas
                assets_result[asset] = {
                    'realized_gains': round(data['realized_gains'], 2),
                    'total_sold_revenue': round(data['total_sold_revenue'], 2),
                    'total_sold_cost': round(data['total_sold_cost'], 2),
                    'sales_count': data['sales_count'],
                    'avg_realized_gain_per_sale': round(data['realized_gains'] / data['sales_count'], 2) if data['sales_count'] > 0 else 0
                }
                
                total_realized_gains += data['realized_gains']
                total_sold_revenue += data['total_sold_revenue']
                total_sold_cost += data['total_sold_cost']
                total_sales += data['sales_count']
        
        return {
            "metodo": "FIFO_Realized_Gains",
            "assets": assets_result,
            "totales": {
                "total_realized_gains": round(total_realized_gains, 2),
                "total_sold_revenue": round(total_sold_revenue, 2),
                "total_sold_cost": round(total_sold_cost, 2),
                "total_sales": total_sales,
                "avg_realized_gain_per_sale": round(total_realized_gains / total_sales, 2) if total_sales > 0 else 0
            }
        }
        
    except Exception as e:
        return {"error": f"Error calculando realized gains FIFO: {str(e)}"}

def calcular_realized_gains_desde_archivo(ruta_archivo):
    """
    Calcula realized gains FIFO desde un archivo CSV.
    
    Args:
        ruta_archivo (str): Ruta al archivo CSV
        
    Returns:
        dict: Resultado con realized gains o error
    """
    try:
        with open(ruta_archivo, 'r', encoding='utf-8') as file:
            csv_content = file.read()
        return calcular_realized_gains_fifo(csv_content)
    except Exception as e:
        return {"error": f"Error leyendo archivo: {str(e)}"}

def obtener_precio_actual_kraken(asset):
    """
    Obtiene el precio actual de un asset desde Kraken API.
    
    Args:
        asset (str): Symbol del asset (ej: BTC, ETH, XRP)
        
    Returns:
        float: Precio actual en EUR o 0 si hay error
    """
    try:
        # Assets fiat tienen precio fijo de 1
        if asset in ['EUR', 'USD', 'GBP', 'CAD']:
            return 1.0
            
        # Generar posibles pares de Kraken
        possible_pairs = [
            f"{asset}EUR",     # Formato moderno
            f"X{asset}ZEUR",   # Formato legacy con prefijos
            f"{asset}ZEUR",    # Híbrido
            f"XX{asset}ZEUR"   # Legacy completo
        ]
        
        for pair in possible_pairs:
            try:
                url = f"https://api.kraken.com/0/public/Ticker?pair={pair}"
                response = requests.get(url, timeout=10)
                data = response.json()
                
                if 'result' in data and data['result']:
                    # Obtener el primer (y único) resultado
                    pair_data = next(iter(data['result'].values()))
                    price = float(pair_data['c'][0])  # Precio de cierre actual
                    print(f"✅ {asset}: {price} EUR (pair: {pair})")
                    return price
                    
            except Exception as e:
                continue  # Probar siguiente par
        
        print(f"❌ {asset}: No se pudo obtener precio")
        return 0.0
        
    except Exception as e:
        print(f"❌ Error obteniendo precio para {asset}: {e}")
        return 0.0

def calcular_unrealized_gains_fifo(csv_content):
    """
    Calcula las ganancias no realizadas (Unrealized Gains) usando método FIFO.
    Unrealized Gains = Portfolio Value - Total Invested (solo assets retenidos).
    
    Args:
        csv_content (str): Contenido del archivo CSV como string
        
    Returns:
        dict: Unrealized gains por asset y totales
    """
    try:
        # Primero obtener el cost FIFO de assets retenidos
        fifo_result = calcular_cost_fifo(csv_content)
        if "error" in fifo_result:
            return fifo_result
        
        # Obtener precios actuales para cada asset con balance
        assets_with_balance = {}
        total_portfolio_value = 0
        total_invested = 0
        
        print("🔄 Obteniendo precios actuales...")
        
        for asset, data in fifo_result['assets'].items():
            if data['volumen_restante'] > 0:
                # Obtener precio actual
                current_price = obtener_precio_actual_kraken(asset)
                time.sleep(0.5)  # Rate limiting
                
                # Calcular valores
                volume = data['volumen_restante']
                invested = data['cost_neto_invertido']
                current_value = volume * current_price
                unrealized_gain = current_value - invested
                unrealized_percentage = (unrealized_gain / invested * 100) if invested > 0 else 0
                
                assets_with_balance[asset] = {
                    'volumen': round(volume, 6),
                    'precio_actual': round(current_price, 2),
                    'valor_actual': round(current_value, 2),
                    'cost_invertido': round(invested, 2),
                    'unrealized_gains': round(unrealized_gain, 2),
                    'unrealized_percentage': round(unrealized_percentage, 2)
                }
                
                total_portfolio_value += current_value
                total_invested += invested
        
        # Calcular totales
        total_unrealized_gains = total_portfolio_value - total_invested
        total_unrealized_percentage = (total_unrealized_gains / total_invested * 100) if total_invested > 0 else 0
        
        return {
            "metodo": "FIFO_Unrealized_Gains",
            "assets": assets_with_balance,
            "totales": {
                "total_portfolio_value": round(total_portfolio_value, 2),
                "total_invested": round(total_invested, 2),
                "total_unrealized_gains": round(total_unrealized_gains, 2),
                "total_unrealized_percentage": round(total_unrealized_percentage, 2),
                "assets_count": len(assets_with_balance)
            }
        }
        
    except Exception as e:
        return {"error": f"Error calculando unrealized gains FIFO: {str(e)}"}

def calcular_unrealized_gains_desde_archivo(ruta_archivo):
    """
    Calcula unrealized gains FIFO desde un archivo CSV.
    
    Args:
        ruta_archivo (str): Ruta al archivo CSV
        
    Returns:
        dict: Resultado con unrealized gains o error
    """
    try:
        with open(ruta_archivo, 'r', encoding='utf-8') as file:
            csv_content = file.read()
        return calcular_unrealized_gains_fifo(csv_content)
    except Exception as e:
        return {"error": f"Error leyendo archivo: {str(e)}"}

def explicar_calculo_xrp(ruta_archivo):
    """
    Explica paso a paso el cálculo FIFO para XRP usando datos reales.
    """
    print("🔍 EXPLICACIÓN DETALLADA DEL CÁLCULO XRP")
    print("=" * 70)
    
    try:
        with open(ruta_archivo, 'r', encoding='utf-8') as file:
            csv_content = file.read()
        
        # Parsear CSV y filtrar solo XRP
        df = pd.read_csv(io.StringIO(csv_content))
        df['time'] = pd.to_datetime(df['time'])
        df = df.sort_values('time').copy()
        
        # Filtrar solo trades de XRP
        xrp_trades = df[df['pair'].str.contains('XRP', na=False)].copy()
        
        print(f"📊 Trades encontrados de XRP: {len(xrp_trades)}")
        print("-" * 70)
        
        # Simular procesamiento FIFO paso a paso
        buy_lots = []  # Cola FIFO de lotes de compra
        total_invested = 0
        realized_gains = 0
        volume_actual = 0
        
        for idx, trade in xrp_trades.iterrows():
            vol = float(trade['vol'])
            cost = float(trade['cost'])
            trade_type = trade['type']
            fecha = trade['time'].strftime('%Y-%m-%d %H:%M')
            
            print(f"\n📅 {fecha} - {trade_type.upper()}")
            print(f"   Volumen: {vol:.6f} XRP")
            print(f"   Cost: {cost:.2f} EUR")
            
            if trade_type == 'buy':
                # COMPRA: Agregar lote a la cola FIFO
                buy_lots.append({
                    'vol': vol,
                    'cost': cost,
                    'fecha': fecha
                })
                total_invested += cost
                volume_actual += vol
                
                print(f"   ✅ COMPRA agregada a cola FIFO")
                print(f"   📈 Total invertido: {total_invested:.2f} EUR")
                print(f"   📦 Volumen total: {volume_actual:.6f} XRP")
                print(f"   🗂️ Lotes en cola: {len(buy_lots)}")
                
            else:  # sell
                # VENTA: Consumir lotes FIFO
                print(f"   🔄 VENTA - Consumiendo lotes FIFO...")
                remaining_to_sell = vol
                cost_of_sold_lots = 0
                sale_revenue = cost
                
                lotes_consumidos = []
                
                while remaining_to_sell > 0 and buy_lots:
                    oldest_lot = buy_lots[0]
                    
                    if oldest_lot['vol'] <= remaining_to_sell:
                        # Consumir todo el lote
                        cost_of_sold_lots += oldest_lot['cost']
                        remaining_to_sell -= oldest_lot['vol']
                        lote_consumido = buy_lots.pop(0)
                        lotes_consumidos.append(f"Lote completo de {lote_consumido['fecha']}: {lote_consumido['vol']:.6f} XRP por {lote_consumido['cost']:.2f} EUR")
                        
                    else:
                        # Consumir parcialmente el lote
                        cost_per_unit = oldest_lot['cost'] / oldest_lot['vol']
                        partial_cost = remaining_to_sell * cost_per_unit
                        cost_of_sold_lots += partial_cost
                        
                        lotes_consumidos.append(f"Lote parcial de {oldest_lot['fecha']}: {remaining_to_sell:.6f} XRP por {partial_cost:.2f} EUR")
                        
                        # Actualizar el lote restante
                        oldest_lot['vol'] -= remaining_to_sell
                        oldest_lot['cost'] -= partial_cost
                        remaining_to_sell = 0
                
                # Calcular realized gain
                realized_gain = sale_revenue - cost_of_sold_lots
                realized_gains += realized_gain
                total_invested -= cost_of_sold_lots
                volume_actual -= vol
                
                print(f"   🗂️ Lotes consumidos:")
                for lote in lotes_consumidos:
                    print(f"      - {lote}")
                print(f"   💰 Ingresos por venta: {sale_revenue:.2f} EUR")
                print(f"   💸 Coste de lotes vendidos: {cost_of_sold_lots:.2f} EUR")
                print(f"   💎 Realized Gain: {realized_gain:.2f} EUR")
                print(f"   📊 Realized Gains acumulados: {realized_gains:.2f} EUR")
                print(f"   💰 Total invertido restante: {total_invested:.2f} EUR")
                print(f"   📦 Volumen restante: {volume_actual:.6f} XRP")
        
        print("\n" + "=" * 70)
        print("🎯 RESUMEN FINAL XRP")
        print("=" * 70)
        print(f"💎 Realized Gains total: {realized_gains:.2f} EUR")
        print(f"💰 Total invertido (FIFO): {total_invested:.2f} EUR")
        print(f"📦 Volumen restante: {volume_actual:.6f} XRP")
        print(f"🗂️ Lotes activos restantes: {len(buy_lots)}")
        
        if buy_lots:
            print(f"\n📋 Lotes restantes:")
            for i, lote in enumerate(buy_lots):
                print(f"   {i+1}. {lote['fecha']}: {lote['vol']:.6f} XRP por {lote['cost']:.2f} EUR")
        
        # Calcular unrealized gains
        precio_actual = obtener_precio_actual_kraken('XRP')
        if precio_actual > 0 and volume_actual > 0:
            valor_actual = volume_actual * precio_actual
            unrealized_gain = valor_actual - total_invested
            unrealized_percentage = (unrealized_gain / total_invested * 100) if total_invested > 0 else 0
            
            print(f"\n📈 UNREALIZED GAINS:")
            print(f"   Precio actual: {precio_actual:.4f} EUR")
            print(f"   Valor actual: {valor_actual:.2f} EUR")
            print(f"   Unrealized Gain: {unrealized_gain:.2f} EUR ({unrealized_percentage:.2f}%)")
            
            print(f"\n🏆 NET PROFIT XRP:")
            net_profit = realized_gains + unrealized_gain
            print(f"   Realized + Unrealized = {realized_gains:.2f} + {unrealized_gain:.2f} = {net_profit:.2f} EUR")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    # Ejemplo de uso con el archivo trades_2.csv
    ruta_csv = "trades_2.csv"
    
    # Explicar cálculo de XRP primero
    explicar_calculo_xrp(ruta_csv)
    
    print("=" * 60)
    print("📊 SUMA SIMPLE DE COST")
    print("=" * 60)
    resultado = calcular_suma_cost_desde_archivo(ruta_csv)
    
    if "error" in resultado:
        print(f"❌ Error: {resultado['error']}")
    else:
        print(f"💰 Suma total de cost: {resultado['suma_total_cost']} EUR")
        print(f"📊 Estadísticas:")
        stats = resultado['estadisticas']
        print(f"   - Número de trades: {stats['numero_trades']}")
        print(f"   - Cost promedio: {stats['cost_promedio']} EUR")
        print(f"   - Cost máximo: {stats['cost_maximo']} EUR")
        print(f"   - Cost mínimo: {stats['cost_minimo']} EUR")
    
    print("\n" + "=" * 60)
    print("🔄 COST NETO CON MÉTODO FIFO")
    print("=" * 60)
    resultado_fifo = calcular_cost_fifo_desde_archivo(ruta_csv)
    
    if "error" in resultado_fifo:
        print(f"❌ Error: {resultado_fifo['error']}")
    else:
        print(f"💰 Cost neto total (FIFO): {resultado_fifo['totales']['cost_neto_total']} EUR")
        print(f"📊 Totales:")
        totales = resultado_fifo['totales']
        print(f"   - Total comprado: {totales['total_comprado']} EUR")
        print(f"   - Total vendido: {totales['total_vendido']} EUR")
        print(f"   - Diferencia: {totales['diferencia']} EUR")
        
        print(f"\n📈 Desglose por asset:")
        for asset, data in resultado_fifo['assets'].items():
            if data['volumen_restante'] > 0:  # Solo mostrar assets con balance
                print(f"   {asset}:")
                print(f"     - Cost neto invertido: {data['cost_neto_invertido']} EUR")
                print(f"     - Volumen restante: {data['volumen_restante']}")
                print(f"     - Lotes activos: {data['lotes_activos']}")
    
    print("\n" + "=" * 60)
    print("💎 REALIZED GAINS (GANANCIAS REALIZADAS)")
    print("=" * 60)
    resultado_realized = calcular_realized_gains_desde_archivo(ruta_csv)
    
    if "error" in resultado_realized:
        print(f"❌ Error: {resultado_realized['error']}")
    else:
        print(f"💰 Total Realized Gains: {resultado_realized['totales']['total_realized_gains']} EUR")
        print(f"📊 Totales:")
        totales = resultado_realized['totales']
        print(f"   - Total ingresos por ventas: {totales['total_sold_revenue']} EUR")
        print(f"   - Total coste vendido (FIFO): {totales['total_sold_cost']} EUR")
        print(f"   - Número de ventas: {totales['total_sales']}")
        print(f"   - Ganancia promedio por venta: {totales['avg_realized_gain_per_sale']} EUR")
        
        if resultado_realized['assets']:
            print(f"\n📈 Desglose por asset:")
            for asset, data in resultado_realized['assets'].items():
                print(f"   {asset}:")
                print(f"     - Realized gains: {data['realized_gains']} EUR")
                print(f"     - Ingresos por ventas: {data['total_sold_revenue']} EUR")
                print(f"     - Coste vendido: {data['total_sold_cost']} EUR")
                print(f"     - Número de ventas: {data['sales_count']}")
        else:
            print(f"\n📈 No hay ventas registradas (sin realized gains)")
    
    print("\n" + "=" * 60)
    print("📈 UNREALIZED GAINS (GANANCIAS NO REALIZADAS)")
    print("=" * 60)
    resultado_unrealized = calcular_unrealized_gains_desde_archivo(ruta_csv)
    
    if "error" in resultado_unrealized:
        print(f"❌ Error: {resultado_unrealized['error']}")
    else:
        print(f"💰 Total Unrealized Gains: {resultado_unrealized['totales']['total_unrealized_gains']} EUR")
        print(f"📊 Totales:")
        totales = resultado_unrealized['totales']
        print(f"   - Portfolio Value actual: {totales['total_portfolio_value']} EUR")
        print(f"   - Total invertido (FIFO): {totales['total_invested']} EUR")
        print(f"   - Unrealized percentage: {totales['total_unrealized_percentage']}%")
        print(f"   - Assets con balance: {totales['assets_count']}")
        
        print(f"\n📈 Desglose por asset:")
        for asset, data in resultado_unrealized['assets'].items():
            print(f"   {asset}:")
            print(f"     - Volumen: {data['volumen']}")
            print(f"     - Precio actual: {data['precio_actual']} EUR")
            print(f"     - Valor actual: {data['valor_actual']} EUR")
            print(f"     - Cost invertido: {data['cost_invertido']} EUR")
            print(f"     - Unrealized gains: {data['unrealized_gains']} EUR ({data['unrealized_percentage']}%)")
    
    print("\n" + "=" * 60)
    print("🎯 RESUMEN FINAL: NET PROFIT = REALIZED + UNREALIZED")
    print("=" * 60)
    
    # Combinar resultados si ambos son válidos
    if ("error" not in resultado_realized and "error" not in resultado_unrealized):
        realized_total = resultado_realized['totales']['total_realized_gains']
        unrealized_total = resultado_unrealized['totales']['total_unrealized_gains']
        net_profit = realized_total + unrealized_total
        
        total_invested = resultado_unrealized['totales']['total_invested']
        net_profit_percentage = (net_profit / total_invested * 100) if total_invested > 0 else 0
        
        print(f"💎 Realized Gains: {realized_total} EUR")
        print(f"📈 Unrealized Gains: {unrealized_total} EUR")
        print(f"🏆 NET PROFIT: {round(net_profit, 2)} EUR ({round(net_profit_percentage, 2)}%)")
        print(f"💰 Total Invested (FIFO): {total_invested} EUR")
        print(f"💼 Portfolio Value: {resultado_unrealized['totales']['total_portfolio_value']} EUR")
    else:
        print("❌ No se pueden combinar resultados debido a errores")