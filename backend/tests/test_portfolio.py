#!/usr/bin/env python3
"""
Pruebas interactivas del portfolio visualizer.
Ejecutar: python -m tests.test_portfolio (desde backend/)
"""

import sys
import os

# Añadir directorio padre al path para imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from main import (
    FIAT_ASSETS, DYNAMIC_PAIR_CACHE,
    extraer_activo_de_par, obtener_precios_de_kraken,
    calcular_portfolio_value, calcular_cost_basis,
    calcular_unrealized_gains, calcular_realized_gains
)


def obtener_assets_del_csv():
    """Obtiene lista de assets únicos del CSV"""
    try:
        df = pd.read_csv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'trades.csv'))
        df['asset'] = df['pair'].apply(extraer_activo_de_par)

        # Calcular cantidades actuales para mostrar solo assets con balance
        assets_quantities = {}
        for _, trade in df.iterrows():
            asset = trade['asset']
            tipo = trade['type']
            volumen = float(trade['vol'])

            if asset not in assets_quantities:
                assets_quantities[asset] = 0.0

            if tipo == 'buy':
                assets_quantities[asset] += volumen
            elif tipo == 'sell':
                assets_quantities[asset] -= volumen

        # Separar crypto y fiat assets
        assets_con_balance = [asset for asset, cantidad in assets_quantities.items() if cantidad > 0]
        crypto_assets = [asset for asset in assets_con_balance if asset not in FIAT_ASSETS]
        fiat_assets = [asset for asset in assets_con_balance if asset in FIAT_ASSETS]

        return crypto_assets, fiat_assets, assets_quantities

    except Exception as e:
        print(f"❌ Error leyendo CSV: {e}")
        return [], [], {}


def prueba_1_obtener_precios():
    """Prueba 1: Obtener precios de todos los assets crypto (ignorar fiat)"""
    print("\n" + "="*80)
    print("🧪 PRUEBA 1: OBTENER PRECIOS DE TODOS LOS ASSETS CRYPTO")
    print("="*80)

    crypto_assets, fiat_assets, quantities = obtener_assets_del_csv()

    if not crypto_assets:
        print("❌ No se encontraron crypto assets con balance")
        return {}

    print(f"📋 Crypto assets detectados: {len(crypto_assets)}")
    for asset in crypto_assets:
        print(f"   • {asset}: {quantities[asset]:.6f}")

    if fiat_assets:
        print(f"\n💵 Fiat assets ignorados: {len(fiat_assets)}")
        for asset in fiat_assets:
            print(f"   ⏭️ {asset}: {quantities[asset]:.6f} (ignorado)")

    print(f"\n📡 Obteniendo precios en tiempo real para crypto assets...")
    precios = obtener_precios_de_kraken(crypto_assets)

    print(f"\n📊 RESULTADOS DE PRECIOS:")
    print("-" * 60)
    print(f"{'Asset':<10} | {'Precio (EUR)':<12} | {'Estado':<15}")
    print("-" * 60)

    total_exitosos = 0
    for asset in crypto_assets:
        precio = precios.get(asset, 0)
        estado = "✅ Exitoso" if precio > 0 else "❌ Sin precio"
        if precio > 0:
            total_exitosos += 1

        print(f"{asset:<10} | €{precio:<11.2f} | {estado}")

    print("-" * 60)
    print(f"Resumen: {total_exitosos}/{len(crypto_assets)} crypto precios obtenidos exitosamente")

    return precios


def prueba_2_calcular_portfolio_value(precios_obtenidos):
    """Prueba 2: Calcular Portfolio Value usando función modular"""
    print("\n" + "="*80)
    print("🧪 PRUEBA 2: CALCULAR PORTFOLIO VALUE POR ASSET Y TOTAL (SOLO CRYPTO)")
    print("="*80)

    try:
        df = pd.read_csv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'trades.csv'))

        result = calcular_portfolio_value(
            trades_df=df,
            precios_actuales=precios_obtenidos,
            obtener_precios_externos=False
        )

        if 'error' in result:
            print(f"❌ Error: {result['error']}")
            return

        assets = result['assets']
        totales = result['totales']
        metadata = result['metadata']

        crypto_assets = {k: v for k, v in assets.items() if k not in FIAT_ASSETS and v['cantidad_actual'] > 0}

        if crypto_assets:
            print("📈 PORTFOLIO VALUE DETALLADO (SOLO CRYPTO):")
            print("-" * 80)
            print(f"{'Asset':<10} | {'Cantidad':<12} | {'Precio':<10} | {'Valor (EUR)':<12} | {'Tipo'}")
            print("-" * 80)

            sorted_assets = sorted(crypto_assets.items(), key=lambda x: x[1]['portfolio_value'], reverse=True)

            for asset, data in sorted_assets:
                print(f"{asset:<10} | {data['cantidad_actual']:<12.6f} | €{data['precio_actual']:<9.2f} | €{data['portfolio_value']:<11.2f} | crypto")

            print("-" * 80)

        print(f"💰 TOTALES (SOLO CRYPTO):")
        print(f"   📊 Portfolio Value Total: €{totales['total_portfolio_value']:,.2f}")
        print(f"   📦 Crypto Assets: {totales['total_cantidad_assets']}")
        print(f"   ⏱️ Tiempo de procesamiento: {metadata['processing_time_seconds']:.3f}s")

        print(f"\n📊 COMPOSICIÓN:")
        print(f"   🪙 Crypto Portfolio: €{totales['total_portfolio_value']:,.2f} (100%)")
        print(f"   💵 Fiat: Ignorado en cálculos")

        return result

    except Exception as e:
        print(f"❌ Error en prueba 2: {e}")
        import traceback
        print(traceback.format_exc())


def prueba_3_calcular_cost_basis():
    """Prueba 3: Calcular Cost Basis usando metodología FIFO"""
    print("\n" + "="*80)
    print("🧪 PRUEBA 3: CALCULAR COST BASIS CON METODOLOGÍA FIFO")
    print("="*80)

    try:
        df = pd.read_csv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'trades.csv'))

        result = calcular_cost_basis(trades_df=df)

        if 'error' in result:
            print(f"❌ Error: {result['error']}")
            return

        assets = result['assets']
        totales = result['totales']
        metadata = result['metadata']

        if assets:
            print("📊 COST BASIS DETALLADO (FIFO):")
            print("-" * 90)
            print(f"{'Asset':<10} | {'Cantidad':<12} | {'Cost Basis':<12} | {'Fees':<10} | {'Lotes FIFO':<12}")
            print("-" * 90)

            sorted_assets = sorted(assets.items(), key=lambda x: x[1]['cost_basis'], reverse=True)

            for asset, data in sorted_assets:
                print(f"{asset:<10} | {data['cantidad_restante']:<12.6f} | €{data['cost_basis']:<11.2f} | €{data['fees_incluidos']:<9.2f} | {data['lotes_fifo']} lotes")

            print("-" * 90)

        print(f"💰 TOTALES COST BASIS:")
        print(f"   📊 Cost Basis Total: €{totales['total_cost_basis']:,.2f}")
        print(f"   💸 Fees Total: €{totales['total_fees']:.2f}")
        print(f"   📦 Assets retenidos: {len(totales['assets_retenidos'])}")
        print(f"   ⏱️ Tiempo de procesamiento: {metadata['processing_time_seconds']:.3f}s")

        print(f"\n📋 INFORMACIÓN ADICIONAL:")
        print(f"   🔄 Trades procesados: {metadata['trades_procesados']}")
        print(f"   📅 Rango de fechas: {metadata['fecha_inicio_real']} → {metadata['fecha_fin_real']}")

        if assets:
            top_asset = max(assets.items(), key=lambda x: x[1]['cost_basis'])
            asset_name, asset_data = top_asset

            print(f"\n🔍 DETALLE LOTES FIFO - {asset_name}:")
            for i, lote in enumerate(asset_data['lotes_detalle'][:3]):
                fecha = lote['timestamp'].strftime('%Y-%m-%d %H:%M')
                print(f"   Lote {i+1}: {lote['volumen']:.6f} × €{lote['precio_unitario']:.2f} (compra: {fecha})")

            if asset_data['lotes_fifo'] > 3:
                print(f"   ... y {asset_data['lotes_fifo'] - 3} lotes más")

        return result

    except Exception as e:
        print(f"❌ Error en prueba 3: {e}")
        import traceback
        print(traceback.format_exc())


def prueba_4_unrealized_realized_gains():
    """Prueba 4: Combinar todas las funciones para análisis completo"""
    print("\n" + "="*80)
    print("🧪 PRUEBA 4: UNREALIZED Y REALIZED GAINS COMBINADOS")
    print("="*80)

    try:
        df = pd.read_csv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'trades.csv'))

        crypto_assets, _, _ = obtener_assets_del_csv()
        precios = obtener_precios_de_kraken(crypto_assets)

        portfolio_result = calcular_portfolio_value(
            trades_df=df,
            precios_actuales=precios,
            obtener_precios_externos=False
        )

        cost_basis_result = calcular_cost_basis(trades_df=df)
        unrealized_result = calcular_unrealized_gains(portfolio_result, cost_basis_result)
        realized_result = calcular_realized_gains(trades_df=df)

        if any('error' in result for result in [portfolio_result, cost_basis_result, unrealized_result, realized_result]):
            print("❌ Error en alguno de los cálculos")
            return

        print(f"📊 RESUMEN COMPLETO DE GAINS:")
        print("-" * 100)
        print(f"{'Asset':<10} | {'Unrealized':<12} | {'%':<8} | {'Realized':<12} | {'Total Gains':<12} | {'Ventas':<8}")
        print("-" * 100)

        all_assets = set(unrealized_result['assets'].keys()).union(set(realized_result['assets'].keys()))
        total_gains_combined = 0

        for asset in sorted(all_assets):
            unrealized_data = unrealized_result['assets'].get(asset, {})
            realized_data = realized_result['assets'].get(asset, {})

            unrealized_gains = unrealized_data.get('unrealized_gains', 0)
            unrealized_percent = unrealized_data.get('unrealized_percent', 0)
            realized_gains = realized_data.get('realized_gains', 0)
            ventas = realized_data.get('ventas_procesadas', 0)

            total_gains_asset = unrealized_gains + realized_gains
            total_gains_combined += total_gains_asset

            print(f"{asset:<10} | €{unrealized_gains:<11.2f} | {unrealized_percent:<7.1f}% | €{realized_gains:<11.2f} | €{total_gains_asset:<11.2f} | {ventas}")

        print("-" * 100)

        total_unrealized = unrealized_result['totales']['total_unrealized_gains']
        total_realized = realized_result['totales']['total_realized_gains']
        total_portfolio_value = unrealized_result['totales']['total_portfolio_value']
        total_cost_basis = unrealized_result['totales']['total_cost_basis']

        print(f"💰 TOTALES FINALES:")
        print(f"   📈 Portfolio Value: €{total_portfolio_value:,.2f}")
        print(f"   💸 Cost Basis: €{total_cost_basis:,.2f}")
        print(f"   🟢 Unrealized Gains: €{total_unrealized:,.2f}")
        print(f"   ✅ Realized Gains: €{total_realized:,.2f}")
        print(f"   🎯 TOTAL GAINS: €{total_unrealized + total_realized:,.2f}")

        if total_cost_basis > 0:
            total_roi = ((total_unrealized + total_realized) / total_cost_basis) * 100
            print(f"   📊 ROI Total: {total_roi:.1f}%")

        total_ventas = realized_result['totales']['total_ventas']
        assets_con_ventas = len(realized_result['assets'])

        print(f"\n📋 INFORMACIÓN ADICIONAL:")
        print(f"   🔄 Assets con unrealized gains: {len(unrealized_result['assets'])}")
        print(f"   💼 Assets con realized gains: {assets_con_ventas}")
        print(f"   📤 Total de ventas ejecutadas: {total_ventas}")

        if realized_result['assets']:
            top_realized_asset = max(realized_result['assets'].items(),
                                   key=lambda x: x[1]['realized_gains'])
            asset_name, asset_data = top_realized_asset

            print(f"\n🔍 DETALLE VENTAS - {asset_name} (mayor realized gain):")
            print(f"   Realized Gains: €{asset_data['realized_gains']:.2f}")
            print(f"   Número de ventas: {asset_data['ventas_procesadas']}")

            for i, venta in enumerate(asset_data['ventas_detalle'][:2]):
                fecha = venta['timestamp'].strftime('%Y-%m-%d')
                print(f"   Venta {i+1}: {venta['volumen']:.6f} × €{venta['ingresos_netos']:.2f} = €{venta['realized_gain']:.2f} gain ({fecha})")

        return {
            'unrealized': unrealized_result,
            'realized': realized_result,
            'portfolio': portfolio_result,
            'cost_basis': cost_basis_result
        }

    except Exception as e:
        print(f"❌ Error en prueba 4: {e}")
        import traceback
        print(traceback.format_exc())


def ejecutar_todas_las_pruebas():
    """Ejecuta todas las pruebas en secuencia"""
    print("🧮 SISTEMA DE PRUEBAS INTERACTIVO")
    print("=" * 80)

    DYNAMIC_PAIR_CACHE.clear()

    precios = prueba_1_obtener_precios()

    if not precios:
        print("❌ No se pudieron obtener precios, abortando pruebas")
        return

    prueba_2_calcular_portfolio_value(precios)
    prueba_3_calcular_cost_basis()
    prueba_4_unrealized_realized_gains()

    print(f"\n🎉 TODAS LAS PRUEBAS COMPLETADAS")
    print("=" * 80)


if __name__ == "__main__":
    ejecutar_todas_las_pruebas()
