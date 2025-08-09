# 🗺️ ROADMAP ESTRATÉGICO - Portfolio Visualizer

*Última actualización: 2025-01-08*

## 🎯 **FASE 1: COMPLETAR FUNCIONALIDAD CORE (2-3 semanas)**
*"Hacer que la app funcione completamente antes de escalar"*

### **1.1 - Tabla Assets Mejorada (1-2 días) - PRIORIDAD #1**
- ✅ **COMENZAR AQUÍ** - Decisión del usuario
- Barra de progreso visual en columna de porcentaje (%)
- Agregar nueva columna "Avg Cost" con precio medio de compra
- Mejorar visualización de datos tabulares
- Ordenación mejorada y consistente
- **Dependencia:** Ninguna

### **1.2 - Gráfica Temporal (3-4 días)**
- ✅ **Prioridad ALTA** - Feature más visible
- Mejorar TimelineChart con datos reales del timeline
- Añadir zoom, tooltips, múltiples métricas
- Integrar con datos históricos existentes
- **Dependencia:** Tabla assets completada

### **1.3 - Filtros Funcionales (2-3 días)**
- ✅ **Prioridad ALTA** - UX crítica
- Filtros por valor mínimo (ocultar assets <5€)
- Filtro por tipo (crypto/fiat)
- Toggle de notación numérica (EU/US)
- Filtros interactivos con la tabla y gráficas
- **Dependencia:** Gráfica temporal funcionando

---

## 🔒 **FASE 2: SEGURIDAD Y ESTABILIDAD (1-2 semanas)**
*"Preparar para producción"*

### **2.1 - Seguridad Crítica (3-4 días)**
- 🔴 **CRÍTICO** - Migrar credenciales hardcodeadas a variables de entorno
- Implementar validación robusta de entrada
- Agregar rate limiting interno
- Sanitización de datos de entrada
- **Dependencia:** Funcionalidad core completa

### **2.2 - Error Handling (2-3 días)**
- 🔴 **CRÍTICO** - Manejo robusto de errores API
- Estados de loading/error en frontend
- Retry logic inteligente para llamadas fallidas
- Mensajes de error amigables para usuario
- **Dependencia:** Seguridad implementada

### **2.3 - Testing Básico (2-3 días)**
- Tests de endpoints críticos
- Validación de cálculos KPI (FIFO, realized/unrealized)
- Tests de error scenarios
- Coverage de funciones principales
- **Dependencia:** Error handling completo

---

## 🚀 **FASE 3: BASE DE DATOS Y PERFORMANCE (1-2 semanas)**
*"Escalabilidad real para múltiples usuarios"*

### **3.1 - Diseño Base de Datos (1-2 días)**
- Esquema para precios históricos (PostgreSQL/SQLite)
- Índices optimizados para consultas rápidas
- Migración de datos existentes del cache
- **Dependencia:** App estable y testada

### **3.2 - Implementación BD (3-4 días)**
- Backend modificado para consultar BD primero
- Job diario de actualización de precios (cron)
- Sistema de fallback a API Kraken cuando falten datos
- Poblado inicial de datos históricos
- **Dependencia:** Esquema BD definido

### **3.3 - Optimización Performance (1-2 días)**
- Cache inteligente con invalidación selectiva
- Lazy loading de componentes pesados
- Compresión de responses
- **Dependencia:** BD funcionando correctamente

---

## 🌟 **FASE 4: FEATURES AVANZADAS (2-3 semanas)**
*"Diferenciación competitiva"*

### **4.1 - Crypto-to-Crypto Trading (1 semana)**
- Soporte para compras hechas con BTC/ETH/otros cryptos
- Cálculos FIFO complejos para cost basis
- Tracking de conversiones internas entre cryptos
- **Dependencia:** BD y performance optimizados

### **4.2 - Features Premium (1-2 semanas)**
- Análisis avanzados (Sharpe ratio, volatilidad, correlaciones)
- Exportación de datos (CSV, PDF, Excel)
- Sistema de alertas y notificaciones
- Múltiples exchanges (Binance, Coinbase)
- **Dependencia:** Crypto-to-crypto funcionando

---

## 📊 **CRONOGRAMA ESTIMADO:**

| Semana | Fase | Tareas Clave | Resultado Esperado |
|--------|------|--------------|-------------------|
| **1-2** | Fase 1 | **Tabla** → Gráfica → Filtros | **App completamente funcional** |
| **3-4** | Fase 2 | Seguridad → Errors → Tests | **Lista para producción** |
| **5-6** | Fase 3 | BD → Performance | **Escalable para múltiples usuarios** |
| **7-9** | Fase 4 | Crypto-to-crypto → Features | **Producto competitivo** |

---

## 🎯 **PRÓXIMO PASO INMEDIATO:**

### **EMPEZAR: Mejorar Tabla de Assets**
**Archivo:** `/src/components/Dashboard/Sections/Overview/components/AssetLeaderboard.jsx`

**Tareas específicas:**
1. Agregar columna "Avg Cost" usando `asset.average_cost`
2. Implementar barras de progreso visuales en columna "%"
3. Mejorar estilos y responsividad de la tabla
4. Optimizar ordenación por todas las columnas

---

## 📋 **NOTAS TÉCNICAS:**

### **Limitaciones Actuales Identificadas:**
- Rate limiting de Kraken API (1 call/sec, penalizaciones de 5s)
- Credenciales hardcodeadas (CRÍTICO para producción)
- Sin manejo de errores robusto
- Performance: 25s de carga para portfolios históricos

### **Decisiones Pendientes:**
- **Base de datos:** SQLite (desarrollo rápido) vs PostgreSQL (producción escalable)
- **Hosting:** VPS, Vercel, Railway, u otros
- **Timeline de lanzamiento:** ¿Fecha objetivo?

### **Métricas de Éxito:**
- **Fase 1:** Tiempo de carga <30s, UX completa
- **Fase 2:** Cero vulnerabilidades críticas, 95% uptime
- **Fase 3:** Tiempo de carga <5s, soporte 100+ usuarios concurrentes
- **Fase 4:** Feature parity con competidores premium

---

*Este roadmap es un documento vivo que se actualiza según progreso y feedback.*