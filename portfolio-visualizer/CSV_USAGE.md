# CSV Usage Guide - Portfolio Visualizer

## ✅ **Opción A Implementada: CSV + Precios Públicos**

El dashboard ahora funciona completamente con archivos CSV de Kraken, obteniendo precios actuales de la API pública.

## 📊 **Tipos de CSV Soportados**

### **1. Account Statement (Recomendado)**
**Cómo obtenerlo:**
1. Ir a Kraken Pro → Reports → Account Statement
2. Seleccionar rango de fechas
3. Descargar CSV

**Ventajas:**
- ✅ Incluye deposits, withdrawals, y trades
- ✅ Balances históricos completos
- ✅ Más datos para análisis preciso

**Formato esperado:**
```csv
type,asset,amount,balance,time,fee
deposit,ZEUR,1000.00,1000.00,2024-01-01 10:00:00,0.00
buy,XXBT,0.05,0.05,2024-01-01 11:00:00,2.50
```

### **2. Trades History (Compatibilidad)**
**Cómo obtenerlo:**
1. Ir a Kraken Pro → Reports → Trade History
2. Seleccionar rango de fechas
3. Descargar CSV

**Limitaciones:**
- ⚠️ Solo trades, no deposits/withdrawals
- ⚠️ Menos preciso para liquidez

**Formato esperado:**
```csv
txid,time,type,pair,price,cost,fee,vol
ABC123,2024-01-01 11:00:00,buy,XXBTZEUR,45000.00,2250.00,2.50,0.05
```

## 🔌 **Funcionalidad Mejorada**

### **Precios Actuales**
- **API Pública de Kraken**: Obtiene precios actuales automáticamente
- **Sin API Keys**: No requiere credenciales, usa endpoints públicos
- **Tiempo Real**: Precios actualizados al momento de subir el CSV

### **Datos Calculados**
- **Portfolio Value**: Valor total actual (crypto + fiat)
- **Liquidity**: Balances de fiat actuales
- **Profit/Loss**: Cálculo preciso con precios actuales
- **Asset Breakdown**: Análisis detallado por asset

### **Compatibilidad Dashboard**
- ✅ **KPIs**: Todos los indicadores funcionan
- ✅ **Gráficos**: Asset allocation, performance comparison
- ✅ **Colores**: Esquema de colores por asset
- ✅ **Responsivo**: Misma experiencia que con API

## 📈 **Ejemplo de Uso**

### **Paso 1: Obtener CSV**
```bash
# Recomendado: Account Statement
Kraken Pro → Reports → Account Statement → Download CSV

# Alternativo: Trades History  
Kraken Pro → Reports → Trade History → Download CSV
```

### **Paso 2: Subir al Dashboard**
1. Abrir Portfolio Visualizer
2. Seleccionar "Upload CSV"
3. Subir archivo CSV de Kraken
4. El dashboard procesará automáticamente

### **Paso 3: Visualizar**
- **KPIs**: Portfolio value, profit, liquidity
- **Gráficos**: Asset allocation, performance
- **Análisis**: Breakdown por asset

## 🔧 **Procesamiento Backend**

### **Detección Automática**
El backend detecta automáticamente el tipo de CSV:
- `txid` + `pair` = Trades History
- `type` + `asset` + `balance` = Account Statement

### **Obtención de Precios**
```python
# API pública de Kraken (sin autenticación)
GET https://api.kraken.com/0/public/Ticker?pair=XXBTZEUR,XETHZEUR

# Mapeo automático de assets:
XXBT → BTC
XETH → ETH
ZEUR → EUR
```

### **Cálculo de KPIs**
```python
# Misma lógica que con API privada
portfolio_value = crypto_value + liquidity
profit = crypto_value - total_invested - total_fees
```

## ⚠️ **Limitaciones**

### **Con Account Statement:**
- ✅ Funcionalidad completa
- ✅ Precios actuales
- ✅ Balances precisos

### **Con Trades History:**
- ⚠️ Solo trades (no deposits/withdrawals)
- ⚠️ Balances calculados (pueden ser imprecisos)
- ⚠️ Liquidez limitada

### **Generales:**
- 📡 Requiere conexión a internet (API pública)
- ⏱️ Precios al momento de subida (no en tiempo real)
- 🔄 Necesita re-subir CSV para actualizar precios

## 🎯 **Recomendaciones**

1. **Usar Account Statement** para máxima precisión
2. **Incluir rango completo** de fechas en el export
3. **Re-subir periódicamente** para precios actualizados
4. **Verificar resultados** comparando con Kraken Pro

## 📝 **Formato de Respuesta**

```json
{
  "kpis": {
    "total_invested": 2500.00,
    "current_value": 2750.00,
    "profit": 200.00,
    "profit_percentage": 8.00,
    "fees": 50.00,
    "liquidity": 500.00
  },
  "portfolio_data": [
    {
      "asset": "XXBT",
      "asset_type": "crypto",
      "amount": 0.05,
      "current_price": 45000.00,
      "current_value": 2250.00,
      "total_invested": 2000.00,
      "fees_paid": 10.00,
      "pnl_eur": 240.00,
      "pnl_percent": 11.94
    }
  ],
  "data_source": "csv"
}
```

---

*Última actualización: 2025-01-17*
*Versión: 1.0 - Opción A implementada*