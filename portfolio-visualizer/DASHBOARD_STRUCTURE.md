# Dashboard Structure - Portfolio Visualizer

## Overview de la Estructura Acordada

### 1. **Overview Section** (Sección Principal)
**Componente**: `OverviewSection.jsx`
**Propósito**: Vista general del portfolio con KPIs y gráficos principales

#### KPIs Principales:
- **Portfolio Value**: Valor total (crypto + fiat)
- **Total Invested**: Total invertido (sin fees)
- **Net Profit**: Ganancia neta (solo crypto, sin fiat)
- **Liquidity**: Liquidez (solo fiat)
- **Total Fees**: Comisiones totales

#### Gráficos Generales:
- **Portfolio Performance**: Evolución del valor del portfolio en el tiempo
- **Asset Allocation**: Distribución de assets (pie chart)
- **Profit/Loss Evolution**: Evolución de ganancias/pérdidas
- **ROI Comparison**: Comparación de ROI entre assets

### 2. **Asset Analysis Section** (Análisis por Asset)
**Componente**: `AssetAnalysisSection.jsx`
**Propósito**: Análisis detallado de cada asset individual

#### Funcionalidades:
- **Tabla de assets** con métricas individuales
- **Gráficos por asset**: performance, volumen, price changes
- **Métricas detalladas**: ROI, fees, average price, etc.

### 3. **Comparative Analysis Section** (Comparativas Avanzadas)
**Componente**: `ComparativeAnalysisSection.jsx` (futuro)
**Propósito**: Comparaciones avanzadas entre assets

#### Funcionalidades Futuras:
- **Asset vs Asset** comparisons
- **Performance benchmarks**
- **Correlation analysis**

## Sistema de Filtros

### Filtros Globales (Nivel Dashboard)
```javascript
// Filtros que afectan a TODAS las secciones
{
  dateRange: { from: Date, to: Date },
  selectedAssets: Array<string>,
  baseCurrency: 'EUR' | 'USD' | 'BTC',
  dataSource: 'api' | 'csv'
}
```

### Filtros por Sección (Nivel Componente)

#### Overview Section:
```javascript
{
  chartType: 'line' | 'bar' | 'area',
  timeGranularity: 'daily' | 'weekly' | 'monthly',
  showLiquidity: boolean
}
```

#### Asset Analysis Section:
```javascript
{
  sortBy: 'performance' | 'value' | 'roi' | 'fees',
  filterBy: 'all' | 'profitable' | 'losing' | 'crypto' | 'fiat',
  viewMode: 'table' | 'cards' | 'charts'
}
```

## Flujo de Datos

### Estado Global:
```javascript
{
  portfolioData: Object,        // Datos del portfolio desde API
  filters: GlobalFilters,       // Filtros globales
  isLoading: boolean,          // Estado de carga
  error: string | null         // Errores
}
```

### Comunicación:
1. **Filtros globales** → Se propagan a todas las secciones
2. **Filtros locales** → Solo afectan a la sección específica
3. **Datos filtrados** → Cada sección recibe datos pre-filtrados

## Componentes a Eliminar

### Componentes Obsoletos:
- `KPISection.jsx` → Funcionalidad integrada en Overview
- `GeneralPerformanceSection.jsx` → Funcionalidad integrada en Overview
- `PortfolioCharts.jsx` → Funcionalidad integrada en Overview

### Componentes a Mantener:
- `GainTrackForm.jsx` → Formulario de conexión API
- `AssetAnalysisSection.jsx` → Análisis detallado por asset
- `PortfolioPage.jsx` → Container principal

## Implementación Prioritaria

### Fase 1: ✅ Completar Overview Section
- [x] KPIs principales
- [x] Gráficos generales
- [x] Asset Allocation Chart con colores temáticos
- [x] Formateo de moneda sin decimales
- [x] Diseño sin tarjeta de fondo para pie chart
- [ ] Integración con filtros básicos

### Fase 2: Filtros Funcionales
- [ ] Filtros globales en sidebar
- [ ] Aplicación de filtros a Overview
- [ ] Persistencia de filtros en localStorage

### Fase 3: Asset Analysis
- [ ] Mejorar AssetAnalysisSection existente
- [ ] Integrar con filtros globales
- [ ] Añadir más métricas y visualizaciones

### Fase 4: Comparative Analysis (Futuro)
- [ ] Crear ComparativeAnalysisSection
- [ ] Comparaciones asset vs asset
- [ ] Benchmarks y correlaciones

## Notas Técnicas

- **Tema**: Mantener glass-morphism y modo oscuro/claro
- **Responsividad**: Mobile-first design
- **Performance**: Lazy loading para gráficos complejos
- **Accesibilidad**: Keyboard navigation y ARIA labels
- **Testing**: Unit tests para lógica de filtros

## Opciones de Datos

### **Fuentes de datos soportadas:**
1. **API Credentials**: 100% funcionalidad (tiempo real)
2. **Account Statement CSV**: 98% funcionalidad (histórico completo)
3. **Trades History CSV**: 95% funcionalidad (solo trades)

### **Documentación adicional:**
- Ver `EXPORT_GUIDE.md` para guía completa de exportación
- Ver `CSV_USAGE.md` para detalles técnicos del procesamiento CSV

---

*Última actualización: 2025-01-17*
*Estado: En desarrollo - Fase 1*