#!/usr/bin/env python3
"""
Calculadora de Portfolio desde cero
Implementamos cada métrica paso a paso de forma clara y correcta
"""

import pandas as pd
from datetime import datetime

# Precios actuales de Kraken API (EUR) - Actualizar según sea necesario
PRECIOS_ACTUALES = {
    'BTC': 98556,
    'ETH': 3837.0,
    'XRP': 2.54,
    'SOL': 199.00,
    'TRUMP': 7.23,
    'LINK': 20.10,
    'HBAR': 0.2,
    'USD': 1.0,
    'EUR': 1.0,
    'GBP': 1.0,
    'CAD': 1.0
}

# Activos fiat
FIAT_ASSETS = {'USD', 'EUR', 'GBP', 'CAD'}

def extraer_activo_de_par(par):
    """
    Extrae el activo base del par de trading
    """
    if not par or pd.isna(par):
        return 'UNKNOWN'
    
    par = str(par).strip()
    
    # Casos especiales conocidos
    if par == 'ZUSD':
        return 'USD'
    if par == 'ZEUR':
        return 'EUR'
    
    # Lógica para extraer activo
    asset = par.replace('ZEUR', '').replace('EUR', '').replace('USD', '').replace('GBP', '').replace('CAD', '').rstrip('/')
    
    # Si el asset queda vacío después de las sustituciones
    if not asset or asset == '':
        if 'USD' in par:
            return 'USD'
        elif 'EUR' in par:
            return 'EUR'
        elif 'GBP' in par:
            return 'GBP'
        elif 'CAD' in par:
            return 'CAD'
        else:
            return f'UNKNOWN_{par}'
    
    # Si no cambió nada, devolver el par original
    if asset == par:
        return par
        
    return asset

# =============================================================================
# MÉTRICA 1: PORTFOLIO VALUE
# =============================================================================

def portfolio_value(trades, activo):
    """
    Calcula Portfolio Value para un activo = Cantidad actual × Precio actual
    Cantidad actual = Compras totales - Ventas totales
    """
    cantidad_actual = 0.0
    
    for _, trade in trades.iterrows():
        tipo = trade['type']
        volumen = float(trade['vol'])
        
        if tipo == 'buy':
            cantidad_actual += volumen
        elif tipo == 'sell':
            cantidad_actual -= volumen
    
    precio_actual = PRECIOS_ACTUALES.get(activo, 0)
    if precio_actual == 0 and cantidad_actual > 0:
        print(f"⚠️ PRECIO FALTANTE: {activo} no tiene precio configurado")
    
    portfolio_value = cantidad_actual * precio_actual
    
    return {
        'cantidad_actual': cantidad_actual,
        'precio_actual': precio_actual,
        'portfolio_value': portfolio_value
    }

# =============================================================================
# MÉTRICA 2: COST BASIS (FIFO)
# =============================================================================

def cost_basis(trades, activo):
    """
    Calcula Cost Basis usando FIFO = Suma del coste de las unidades que quedan
    FIFO: Las primeras compras son las primeras en venderse
    """
    cola_compras = []  # Cola FIFO para compras
    total_fees = 0.0
    
    for _, trade in trades.iterrows():
        tipo = trade['type']
        volumen = float(trade['vol'])
        cost = float(trade['cost'])
        fee = float(trade['fee'])
        
        total_fees += fee
        
        if tipo == 'buy':
            # Agregar compra a la cola FIFO (incluyendo fee en el cost basis)
            cost_con_fee = cost + fee
            cola_compras.append({
                'volumen': volumen,
                'cost': cost_con_fee
            })
        
        elif tipo == 'sell':
            # Procesar venta usando FIFO - consumir de los lotes más antiguos
            volumen_restante = volumen
            
            while volumen_restante > 0 and cola_compras:
                lote = cola_compras[0]
                
                if lote['volumen'] <= volumen_restante:
                    # Consumir lote completo
                    volumen_restante -= lote['volumen']
                    cola_compras.pop(0)
                else:
                    # Consumir parcialmente
                    proporcion = volumen_restante / lote['volumen']
                    lote['volumen'] -= volumen_restante
                    lote['cost'] -= lote['cost'] * proporcion
                    volumen_restante = 0
    
    # Cost basis = suma del coste de las unidades que quedan
    cantidad_restante = sum(lote['volumen'] for lote in cola_compras)
    cost_basis_total = sum(lote['cost'] for lote in cola_compras)
    
    return {
        'cantidad_restante': cantidad_restante,
        'cost_basis': cost_basis_total,
        'fees_incluidos': total_fees
    }

# =============================================================================
# MÉTRICA 3: UNREALIZED GAINS
# =============================================================================

def unrealized_gains(portfolio_value_resultado, cost_basis_resultado):
    """
    Calcula Unrealized Gains = Portfolio Value - Cost Basis
    Lo que ganarías si vendieras los activos al precio actual
    """
    portfolio_val = portfolio_value_resultado['portfolio_value']
    cost_basis_val = cost_basis_resultado['cost_basis']
    unrealized = portfolio_val - cost_basis_val
    
    return {
        'unrealized_gains': unrealized
    }

# =============================================================================
# MÉTRICA 4: REALIZED GAINS
# =============================================================================

def realized_gains(trades, activo):
    """
    Calcula Realized Gains = Ganancias de ventas ya ejecutadas
    Cada venta genera: Ingresos por venta - Coste original (FIFO)
    """
    cola_compras = []  # Cola FIFO para compras
    realized_gains_total = 0.0
    
    for _, trade in trades.iterrows():
        tipo = trade['type']
        volumen = float(trade['vol'])
        cost = float(trade['cost'])
        fee = float(trade['fee'])
        
        if tipo == 'buy':
            # Agregar compra a la cola FIFO (incluyendo fee en el cost)
            cost_con_fee = cost + fee
            cola_compras.append({
                'volumen': volumen,
                'cost': cost_con_fee
            })
        
        elif tipo == 'sell':
            # Procesar venta usando FIFO - calcular realized gain
            volumen_restante = volumen
            ingresos_venta = cost  # Lo que recibiste por la venta
            cost_vendido = 0.0     # Lo que costaron originalmente las unidades vendidas
            
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
                    cost_parcial = lote['cost'] * proporcion
                    cost_vendido += cost_parcial
                    
                    lote['volumen'] -= volumen_restante
                    lote['cost'] -= cost_parcial
                    volumen_restante = 0
            
            # Calcular realized gain de esta venta
            realized_gain_venta = ingresos_venta - cost_vendido
            realized_gains_total += realized_gain_venta
    
    return {
        'realized_gains': realized_gains_total
    }

# =============================================================================
# MÉTRICA 5: TOTAL GAINS
# =============================================================================

def total_gains(unrealized_gains_resultado, realized_gains_resultado):
    """
    Calcula Total Gains = Realized Gains + Unrealized Gains
    Rendimiento total hasta la fecha (ventas ejecutadas + ganancias pendientes)
    """
    unrealized = unrealized_gains_resultado['unrealized_gains']
    realized = realized_gains_resultado['realized_gains']
    total = realized + unrealized
    
    return {
        'total_gains': total
    }

def test_portfolio_metricas():
    """
    Test completo con Portfolio Value y Cost Basis en tabla unificada
    """
    try:
        df = pd.read_csv('trades.csv')
        df['asset'] = df['pair'].apply(extraer_activo_de_par)
        
        activos = [a for a in df['asset'].unique() if a != '']
        
        # Solo activos no-fiat (crypto)
        crypto_assets = [a for a in activos if a not in FIAT_ASSETS]
        
        print("🧮 PORTFOLIO METRICS")
        print("=" * 130)
        print("Asset    | Cantidad     | Portfolio Value | Cost Basis   | Unrealized Gains | Realized Gains | Total Gains")
        print("-" * 130)
        
        total_portfolio_value = 0
        total_cost_basis = 0
        total_unrealized_gains = 0
        total_realized_gains = 0
        total_total_gains = 0
        
        for activo in crypto_assets:
            trades_activo = df[df['asset'] == activo].copy()
            trades_activo = trades_activo.sort_values('time')
            
            pv_resultado = portfolio_value(trades_activo, activo)
            cb_resultado = cost_basis(trades_activo, activo)
            ug_resultado = unrealized_gains(pv_resultado, cb_resultado)
            rg_resultado = realized_gains(trades_activo, activo)
            tg_resultado = total_gains(ug_resultado, rg_resultado)
            
            # Mostrar activos con cantidad > 0 O con realized gains != 0
            if pv_resultado['cantidad_actual'] > 0 or rg_resultado['realized_gains'] != 0:
                print(f"{activo:<8} | {pv_resultado['cantidad_actual']:<12.6f} | €{pv_resultado['portfolio_value']:<14.2f} | €{cb_resultado['cost_basis']:<11.2f} | €{ug_resultado['unrealized_gains']:<15.2f} | €{rg_resultado['realized_gains']:<13.2f} | €{tg_resultado['total_gains']:<10.2f}")
                total_portfolio_value += pv_resultado['portfolio_value']
                total_cost_basis += cb_resultado['cost_basis']
                total_unrealized_gains += ug_resultado['unrealized_gains']
                total_realized_gains += rg_resultado['realized_gains']
                total_total_gains += tg_resultado['total_gains']
        
        # Línea separadora y total
        print("-" * 130)
        print(f"{'TOTAL':<8} | {'':<12} | €{total_portfolio_value:<14.2f} | €{total_cost_basis:<11.2f} | €{total_unrealized_gains:<15.2f} | €{total_realized_gains:<13.2f} | €{total_total_gains:<10.2f}")
        
        # Resumen final
        print(f"\n💎 TOTAL GAINS: €{total_total_gains:.2f}")
        print(f"   └─ Realized Gains: €{total_realized_gains:.2f}")
        print(f"   └─ Unrealized Gains: €{total_unrealized_gains:.2f}")
        
        # Verificación
        diferencia = total_portfolio_value - total_cost_basis
        print(f"\n✅ Verificación: Portfolio Value - Cost Basis = €{diferencia:.2f}")
        print(f"✅ Unrealized Gains calculado = €{total_unrealized_gains:.2f}")
        print(f"✅ ¿Coinciden? {'SÍ' if abs(diferencia - total_unrealized_gains) < 0.01 else 'NO'}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """
    Función principal
    """
    print("🧮 CALCULADORA DE PORTFOLIO - DESDE CERO")
    print("=" * 60)
    print("📊 Precios actuales configurados:")
    for activo, precio in PRECIOS_ACTUALES.items():
        print(f"   {activo}: €{precio:.2f}")
    print()
    
    # Test Portfolio Value y Cost Basis unificados
    test_portfolio_metricas()

if __name__ == "__main__":
    main()