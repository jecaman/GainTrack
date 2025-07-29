#!/usr/bin/env python3
"""
Test script para verificar que los nuevos KPIs funcionan correctamente
"""

import pandas as pd
import io
from main import process_trades_csv

def test_new_kpis():
    """Test básico de los nuevos KPIs mejorados"""
    print("🧪 TESTING NUEVOS KPIs MEJORADOS")
    print("=" * 50)
    
    try:
        # Usar archivo real trades_2.csv
        print("📂 Leyendo trades_2.csv...")
        with open('trades_2.csv', 'r', encoding='utf-8') as file:
            csv_content = file.read()
        
        # Procesar como lo haría el endpoint
        df = pd.read_csv(io.StringIO(csv_content))
        print(f"✅ CSV cargado: {df.shape[0]} trades")
        
        # Procesar usando la función del main.py
        result = process_trades_csv(df)
        
        if "error" in result:
            print(f"❌ Error procesando: {result['error']}")
            return False
        
        print("\n📊 KPIs TRADICIONALES:")
        kpis = result['kpis']
        print(f"   Total Invested: {kpis['total_invested']:.2f} EUR")
        print(f"   Current Value: {kpis['current_value']:.2f} EUR")
        print(f"   Profit: {kpis['profit']:.2f} EUR")
        print(f"   Profit %: {kpis['profit_percentage']:.2f}%")
        print(f"   Fees: {kpis['fees']:.2f} EUR")
        print(f"   Liquidity: {kpis['liquidity']:.2f} EUR")
        
        # Verificar que los nuevos KPIs existen
        print("\n🎯 NUEVOS KPIs MEJORADOS:")
        if 'realized_gains' in kpis:
            print(f"   ✅ Realized Gains: {kpis['realized_gains']:.2f} EUR")
        else:
            print("   ❌ Realized Gains: NO ENCONTRADO")
            
        if 'unrealized_gains' in kpis:
            print(f"   ✅ Unrealized Gains: {kpis['unrealized_gains']:.2f} EUR")
        else:
            print("   ❌ Unrealized Gains: NO ENCONTRADO")
            
        if 'unrealized_percentage' in kpis:
            print(f"   ✅ Unrealized %: {kpis['unrealized_percentage']:.2f}%")
        else:
            print("   ❌ Unrealized %: NO ENCONTRADO")
        
        # Verificar la fórmula: Net Profit = Realized + Unrealized
        if 'realized_gains' in kpis and 'unrealized_gains' in kpis:
            calculated_net = kpis['realized_gains'] + kpis['unrealized_gains']
            actual_net = kpis['profit']
            diff = abs(calculated_net - actual_net)
            
            print(f"\n🧮 VERIFICACIÓN FÓRMULA:")
            print(f"   Net Profit (actual): {actual_net:.2f} EUR")
            print(f"   Realized + Unrealized: {calculated_net:.2f} EUR")
            print(f"   Diferencia: {diff:.2f} EUR")
            
            if diff < 0.01:  # Tolerancia de 1 céntimo
                print("   ✅ FÓRMULA CORRECTA")
            else:
                print("   ❌ FÓRMULA INCORRECTA")
                return False
        
        print(f"\n📈 ASSETS CON BALANCE:")
        for asset in result['portfolio_data']:
            if asset['amount'] > 0:
                print(f"   {asset['asset']}: {asset['amount']:.6f} (Value: {asset['current_value']:.2f} EUR)")
        
        print("\n✅ TEST COMPLETADO EXITOSAMENTE")
        return True
        
    except Exception as e:
        print(f"❌ ERROR EN TEST: {e}")
        import traceback
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    success = test_new_kpis()
    if success:
        print("\n🎉 ¡TODOS LOS TESTS PASARON!")
        print("🚀 Los nuevos KPIs están listos para el frontend")
    else:
        print("\n💥 ¡HAY ERRORES QUE CORREGIR!")
        exit(1)