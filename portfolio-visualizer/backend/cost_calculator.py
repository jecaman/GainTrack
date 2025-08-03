#!/usr/bin/env python3
"""
Calculadora de Portfolio simplificada con precios manuales
"""

import pandas as pd
from datetime import datetime

# Precios actuales de Kraken API (EUR)
PRECIOS_ACTUALES = {
    'BTC': 97286.72,
    'ETH': 2983.91,
    'XRP': 2.44,
    'SOL': 139.10,
    'TRUMP': 7.43
}

def extraer_activo_de_par(par):
    """
    Extrae el activo base del par de trading usando la misma lógica que main.py
    """
    # Usar la misma lógica que en main.py para extraer activos
    asset = par.replace('ZEUR', '').replace('EUR', '').replace('USD', '').replace('GBP', '').replace('CAD', '').rstrip('/')
    if asset == par:
        asset = par
    return asset

def procesar_trades_csv(archivo_csv):
    """
    Procesa el archivo CSV de trades y calcula métricas por activo
    """
    print("📂 Cargando trades desde:", archivo_csv)
    df = pd.read_csv(archivo_csv)
    print(f"✅ {len(df)} trades cargados")
    
    # Extraer activo del par
    df['asset'] = df['pair'].apply(extraer_activo_de_par)
    
    # Procesar cada activo
    activos = df['asset'].unique()
    print(f"🔍 Activos encontrados: {', '.join(activos)}")
    
    resultados = {}
    
    for activo in activos:
        print(f"\n📊 PROCESANDO {activo}")
        print("=" * 40)
        
        # Filtrar trades del activo
        trades_activo = df[df['asset'] == activo].copy()
        trades_activo = trades_activo.sort_values('time')
        
        # Calcular métricas usando FIFO
        resultado = calcular_metricas_fifo(trades_activo, activo)
        resultados[activo] = resultado
        
        # Mostrar resultados del activo
        mostrar_resultado_activo(activo, resultado)
    
    # Resumen final
    mostrar_resumen_total(resultados)
    
    return resultados

def calcular_metricas_fifo(trades, activo, precio_actual=None):
    """
    Calcula todas las métricas para un activo usando método FIFO
    """
    cola_compras = []  # Cola FIFO para compras
    realized_gains = 0.0
    total_fees = 0.0
    
    for _, trade in trades.iterrows():
        tipo = trade['type']
        volumen = float(trade['vol'])
        cost = float(trade['cost'])
        fee = float(trade['fee'])
        
        total_fees += fee
        
        if tipo == 'buy':
            # Agregar compra a la cola FIFO (incluyendo fee en el cost)
            cost_con_fee = cost + fee
            cola_compras.append({
                'volumen': volumen,
                'cost': cost_con_fee,
                'cost_sin_fee': cost,
                'fee': fee,
                'precio_unitario': cost_con_fee / volumen if volumen > 0 else 0
            })
        
        elif tipo == 'sell':
            # Procesar venta usando FIFO
            volumen_restante = volumen
            ingresos_venta = cost
            cost_vendido = 0.0
            
            while volumen_restante > 0 and cola_compras:
                lote = cola_compras[0]
                
                if lote['volumen'] <= volumen_restante:
                    # Consumir lote completo
                    cost_vendido += lote['cost']
                    volumen_restante -= lote['volumen']
                    cola_compras.pop(0)
                else:
                    # Consumir parcialmente
                    proporcion = volumen_restante / lote['volumen']
                    cost_vendido += lote['cost'] * proporcion
                    lote['volumen'] -= volumen_restante
                    lote['cost'] -= lote['cost'] * proporcion
                    volumen_restante = 0
            
            # Calcular realized gain
            realized_gain_trade = ingresos_venta - cost_vendido
            realized_gains += realized_gain_trade
    
    # Calcular holdings actuales
    volumen_total = sum(lote['volumen'] for lote in cola_compras)
    cost_basis_total = sum(lote['cost'] for lote in cola_compras)
    
    # Calcular unrealized gains - usar precio pasado o fallback a hardcodeado
    if precio_actual is None:
        precio_actual = PRECIOS_ACTUALES.get(activo, 0)
    
    valor_actual = volumen_total * precio_actual
    unrealized_gains = valor_actual - cost_basis_total
    
    # Net profit total
    net_profit = realized_gains + unrealized_gains
    
    return {
        'cantidad': volumen_total,
        'cost_basis': cost_basis_total,
        'valor_actual': valor_actual,
        'precio_actual': precio_actual,
        'realized_gains': realized_gains,
        'unrealized_gains': unrealized_gains,
        'net_profit': net_profit,
        'fees': total_fees,
        'lotes_restantes': len(cola_compras)
    }

def mostrar_resultado_activo(activo, resultado):
    """
    Muestra el resultado formateado para un activo
    """
    print(f"💰 {activo}:")
    print(f"   Cantidad: {resultado['cantidad']:.6f}")
    print(f"   Precio actual: €{resultado['precio_actual']:.2f}")
    print(f"   Valor actual: €{resultado['valor_actual']:.2f}")
    print(f"   Cost basis (con fees): €{resultado['cost_basis']:.2f}")
    print(f"   Realized gains: €{resultado['realized_gains']:.2f}")
    print(f"   Unrealized gains: €{resultado['unrealized_gains']:.2f}")
    print(f"   Net profit: €{resultado['net_profit']:.2f}")
    print(f"   Fees totales: €{resultado['fees']:.2f}")
    
    # Porcentajes
    if resultado['cost_basis'] > 0:
        unrealized_pct = (resultado['unrealized_gains'] / resultado['cost_basis']) * 100
        net_profit_pct = (resultado['net_profit'] / resultado['cost_basis']) * 100
        print(f"   Unrealized %: {unrealized_pct:.2f}%")
        print(f"   Net profit %: {net_profit_pct:.2f}%")

def mostrar_resumen_total(resultados):
    """
    Muestra el resumen total del portfolio
    """
    print("\n" + "=" * 60)
    print("🎯 RESUMEN TOTAL DEL PORTFOLIO")
    print("=" * 60)
    
    # Calcular totales
    total_valor = sum(r['valor_actual'] for r in resultados.values())
    total_cost = sum(r['cost_basis'] for r in resultados.values())
    total_realized = sum(r['realized_gains'] for r in resultados.values())
    total_unrealized = sum(r['unrealized_gains'] for r in resultados.values())
    total_net_profit = sum(r['net_profit'] for r in resultados.values())
    total_fees = sum(r['fees'] for r in resultados.values())
    
    print(f"💼 Valor total portfolio: €{total_valor:.2f}")
    print(f"🏦 Cost basis total (con fees): €{total_cost:.2f}")
    print(f"💎 Realized gains total: €{total_realized:.2f}")
    print(f"📈 Unrealized gains total: €{total_unrealized:.2f}")
    print(f"🎯 Net profit total: €{total_net_profit:.2f}")
    print(f"💸 Fees totales: €{total_fees:.2f}")
    
    if total_cost > 0:
        roi_pct = (total_net_profit / total_cost) * 100
        print(f"📊 ROI total: {roi_pct:.2f}%")
    
    print(f"\nℹ️  Cost basis includes trading fees for accurate ROI calculation")
    
    print("\n📋 LÍNEA POR ACTIVO:")
    print("Asset    | Cantidad    | Valor       | Cost        | Net Profit  | Unrealized  | Realized")
    print("-" * 90)
    
    for activo, resultado in resultados.items():
        if resultado['cantidad'] > 0:  # Solo mostrar activos con balance
            print(f"{activo:<8} | {resultado['cantidad']:<11.6f} | €{resultado['valor_actual']:<10.2f} | €{resultado['cost_basis']:<10.2f} | €{resultado['net_profit']:<10.2f} | €{resultado['unrealized_gains']:<10.2f} | €{resultado['realized_gains']:<10.2f}")

def calcular_realized_gains_fifo(csv_content):
    """
    Función para compatibilidad con main.py - calcula realized gains usando FIFO
    """
    try:
        import io
        df = pd.read_csv(io.StringIO(csv_content))
        df['asset'] = df['pair'].apply(extraer_activo_de_par)
        
        activos = df['asset'].unique()
        assets = {}
        total_realized_gains = 0
        
        for activo in activos:
            trades_activo = df[df['asset'] == activo].copy()
            trades_activo = trades_activo.sort_values('time')
            resultado = calcular_metricas_fifo(trades_activo, activo)
            
            realized_gains = resultado['realized_gains']
            assets[activo] = {'realized_gains': realized_gains}
            total_realized_gains += realized_gains
        
        return {
            'totales': {'total_realized_gains': total_realized_gains},
            'assets': assets
        }
    except Exception as e:
        return {'error': str(e)}

def calcular_unrealized_gains_fifo(csv_content, current_prices=None):
    """
    Función para compatibilidad con main.py - calcula unrealized gains usando FIFO
    """
    try:
        import io
        df = pd.read_csv(io.StringIO(csv_content))
        df['asset'] = df['pair'].apply(extraer_activo_de_par)
        
        activos = df['asset'].unique()
        assets = {}
        total_unrealized_gains = 0
        total_portfolio_value = 0
        total_invested = 0
        
        for activo in activos:
            trades_activo = df[df['asset'] == activo].copy()
            trades_activo = trades_activo.sort_values('time')
            
            # Obtener precio actual para este activo
            precio_actual = None
            if current_prices and activo in current_prices:
                precio_actual = current_prices[activo]
            
            resultado = calcular_metricas_fifo(trades_activo, activo, precio_actual)
            
            unrealized_gains = resultado['unrealized_gains']
            valor_actual = resultado['valor_actual']
            cost_basis = resultado['cost_basis']
            
            assets[activo] = {'unrealized_gains': unrealized_gains}
            total_unrealized_gains += unrealized_gains
            total_portfolio_value += valor_actual
            total_invested += cost_basis
        
        return {
            'totales': {
                'total_unrealized_gains': total_unrealized_gains,
                'total_portfolio_value': total_portfolio_value,
                'total_invested': total_invested
            },
            'assets': assets
        }
    except Exception as e:
        return {'error': str(e)}

def main():
    """
    Función principal
    """
    print("🧮 CALCULADORA DE PORTFOLIO")
    print("=" * 50)
    print("📊 Precios actuales configurados:")
    for activo, precio in PRECIOS_ACTUALES.items():
        print(f"   {activo}: €{precio:.2f}")
    print()
    
    # Procesar archivo de trades
    try:
        resultados = procesar_trades_csv('trades.csv')
        print("\n✅ Cálculo completado exitosamente")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()