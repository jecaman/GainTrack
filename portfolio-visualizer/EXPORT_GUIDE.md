# Kraken Export Guide - Portfolio Visualizer

## 📊 **Opciones de Exportación**

El Portfolio Visualizer soporta múltiples formas de obtener datos de Kraken, cada una con diferentes niveles de funcionalidad:

### **Opción 1: API Credentials (Recomendado)**
- **Funcionalidad**: 100% completa
- **Datos**: Tiempo real, balances actuales, precios actuales
- **Configuración**: Requiere API keys

### **Opción 2: Ledger CSV**
- **Funcionalidad**: 98% completa
- **Datos**: Histórico completo + liquidez precisa + precios actuales via API pública
- **Configuración**: Export desde Kraken Pro

### **Opción 3: Trades History CSV**
- **Funcionalidad**: 95% completa
- **Datos**: Histórico de trades + precios actuales via API pública
- **Configuración**: Export desde Kraken Pro

---

## 🔑 **Opción 1: API Credentials**

### **Permisos necesarios:**
Para usar la API de Kraken, necesitas crear API keys con estos permisos:

```
✅ Query Funds (Consultar fondos)
✅ Query Open Orders & Trades (Consultar órdenes y trades)
✅ Query Closed Orders & Trades (Consultar órdenes y trades cerradas)
✅ Query Ledger Entries (Consultar entradas del ledger)
```

### **Cómo crear API keys:**
1. **Ir a Kraken Pro**:
   ```
   https://pro.kraken.com
   ```

2. **Acceder a API Management**:
   ```
   Settings → API → Create New Key
   ```

3. **Configurar permisos**:
   - **Key Description**: "Portfolio Visualizer"
   - **Permissions**: Seleccionar los permisos listados arriba
   - **Nonce Window**: 5000 (recomendado)

4. **Generar y guardar**:
   - Copiar **API Key** y **Private Key**
   - ⚠️ **IMPORTANTE**: Guarda el Private Key de forma segura, no se puede recuperar

### **Funcionalidad obtenida:**
- ✅ **Balances actuales** en tiempo real
- ✅ **Precios actuales** precisos
- ✅ **Historial completo** de trades
- ✅ **Liquidez exacta** (EUR, USD, etc.)
- ✅ **Fees detalladas** por operación
- ✅ **Profit/Loss** en tiempo real
- ✅ **Todos los gráficos** disponibles

---

## 📄 **Opción 2: Ledger CSV**

### **Cómo exportar:**
1. **Acceder a Kraken Pro**:
   ```
   https://pro.kraken.com
   ```

2. **Ir a Reports**:
   ```
   Sidebar → Reports → Ledger
   ```

3. **Configurar export**:
   - **Date Range**: Desde tu primer trade hasta hoy
   - **Format**: CSV
   - **Asset**: All (todas las monedas)
   - **Type**: All (todas las transacciones)

4. **Generar y descargar**:
   - Click "Export"
   - Descargar archivo CSV

### **Contenido del CSV:**
```csv
txid,refid,time,type,subtype,aclass,asset,amount,fee,balance
ABC123,,2024-01-01 10:00:00,deposit,,currency,ZEUR,1000.00,0.00,1000.00
DEF456,,2024-01-01 11:00:00,trade,buy,currency,XXBT,0.05,2.50,0.05
GHI789,,2024-01-01 11:00:00,trade,buy,currency,ZEUR,-2252.50,0.00,747.50
JKL012,,2024-01-02 12:00:00,withdrawal,,currency,ZEUR,-500.00,1.00,247.50
```

### **Funcionalidad obtenida:**
- ✅ **Balances actuales** precisos del historial
- ✅ **Precios actuales** via API pública de Kraken
- ✅ **Historial completo** (trades + deposits + withdrawals)
- ✅ **Liquidez precisa** (incluye deposits directos)
- ✅ **Fees completas** por operación
- ✅ **Profit/Loss** con precios actuales
- ✅ **Todos los gráficos** disponibles

### **Ventajas:**
- No requiere API keys
- Datos históricos completos
- Incluye deposits y withdrawals
- Liquidez precisa
- Balances exactos después de cada operación

### **Limitaciones:**
- Precios actuales solo al momento de subir el CSV
- Requiere re-subir para actualizar precios
- No actualización automática

---

## 📈 **Opción 3: Trades History CSV**

### **Cómo exportar:**
1. **Acceder a Kraken Pro**:
   ```
   https://pro.kraken.com
   ```

2. **Ir a Reports**:
   ```
   Sidebar → Reports → Trade History
   ```

3. **Configurar export**:
   - **Date Range**: Desde tu primer trade hasta hoy
   - **Format**: CSV
   - **Pair**: All (todos los pares)
   - **Type**: All (buy + sell)

4. **Generar y descargar**:
   - Click "Generate Report"
   - Descargar archivo CSV

### **Contenido del CSV:**
```csv
txid,time,type,pair,price,cost,fee,vol,margin,misc,ledgers
ABC123,2024-01-01 11:00:00,buy,XXBTZEUR,45000.00,2250.00,2.50,0.05,,,
DEF456,2024-01-02 12:00:00,sell,XXBTZEUR,46000.00,920.00,1.80,0.02,,,
```

### **Funcionalidad obtenida:**
- ✅ **Balances actuales** calculados de trades
- ✅ **Precios actuales** via API pública de Kraken
- ✅ **Historial de trades** completo
- ⚠️ **Liquidez aproximada** (solo de trades, no deposits)
- ✅ **Fees de trades** completas
- ✅ **Profit/Loss** con precios actuales
- ✅ **Gráficos principales** disponibles

### **Ventajas:**
- No requiere API keys
- Export rápido y simple
- Datos de trading completos
- Suficiente para la mayoría de casos

### **Limitaciones:**
- No incluye deposits/withdrawals directos
- Liquidez puede ser imprecisa
- Balances calculados (no reales)

---

## 🎯 **Comparación de Opciones**

| Característica | API Credentials | Ledger CSV | Trades History |
|---------------|----------------|------------|----------------|
| **Configuración** | Media | Fácil | Muy fácil |
| **Funcionalidad** | 100% | 98% | 95% |
| **Tiempo real** | ✅ Sí | ❌ No | ❌ No |
| **Liquidez precisa** | ✅ Sí | ✅ Sí | ⚠️ Aproximada |
| **Histórico completo** | ✅ Sí | ✅ Sí | ⚠️ Solo trades |
| **Precios actuales** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Actualización** | Automática | Manual | Manual |
| **Seguridad** | API keys | Archivo local | Archivo local |

## 💡 **Recomendaciones por Caso de Uso**

### **Para uso diario y trading activo:**
```
🥇 Opción 1: API Credentials
- Datos en tiempo real
- Actualización automática
- Funcionalidad completa
```

### **Para análisis histórico detallado:**
```
🥈 Opción 2: Ledger CSV
- Historial completo
- Liquidez precisa
- Sin API keys
```

### **Para análisis rápido de trading:**
```
🥉 Opción 3: Trades History CSV
- Setup más rápido
- Datos de trading
- Suficiente para la mayoría
```

## 🔒 **Consideraciones de Seguridad**

### **API Credentials:**
- ✅ Usa permisos de solo lectura
- ✅ Configura nonce window adecuado
- ✅ Guarda las keys de forma segura
- ⚠️ Revoca keys si no las usas

### **CSV Files:**
- ✅ Archivos procesados localmente
- ✅ No se almacenan en el servidor
- ✅ Datos solo en tu navegador
- ⚠️ Protege los archivos CSV (contienen tu historial)

## 📞 **Soporte**

Si tienes problemas con alguna opción:
1. Verificar permisos de API keys
2. Revisar formato del CSV exportado
3. Consultar logs del backend
4. Revisar documentación de Kraken

---

*Última actualización: 2025-01-17*  
*Versión: 1.0 - Guía completa de exportación*