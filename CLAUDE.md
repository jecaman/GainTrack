# CLAUDE.md — KRAKEN Portfolio Visualizer

## Contexto del Proyecto

Aplicación personal de análisis de portfolio de criptomonedas en Kraken.
- **Frontend**: React 19 + Vite (`portfolio-visualizer/src/`)
- **Backend**: Python + FastAPI (`portfolio-visualizer/backend/`)
- **Datos**: CSV de trades exportado de Kraken, procesado con FIFO

> El README.md está **desactualizado** — referencias a componentes que ya no existen. La fuente de verdad es el código actual.

---

## Estructura Real del Proyecto

```
portfolio-visualizer/
├── backend/
│   ├── main.py               # Servidor FastAPI (puerto 8001)
│   ├── supabase_cache.py     # Cache de precios históricos vía Supabase
│   ├── requirements.txt
│   ├── .env                   # Credenciales Supabase (NO committear)
│   ├── trades.csv             # Dataset principal (NO committear)
│   ├── scripts/
│   │   ├── actualizar_historicos.py  # Cron job diario (precios del día anterior)
│   │   ├── poblar_historico.py       # Poblar cache histórico (últimos N días)
│   │   ├── recarga_historica.py      # Recarga histórica con params custom
│   │   ├── setup_cron.sh             # Configurar cron job automático
│   │   └── setup-supabase.sql        # Schema SQL para Supabase
│   └── tests/
│       └── test_portfolio.py  # Pruebas interactivas (python main.py test)
├── src/
│   ├── App.jsx               # Punto de entrada; llama al backend y pasa datos
│   ├── components/
│   │   ├── Filters.jsx       # Sidebar de filtros (fecha, assets, operaciones)
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx         # Gestor central de estado de fechas
│   │   │   ├── Header.jsx
│   │   │   └── Sections/
│   │   │       ├── Overview/
│   │   │       │   ├── OverviewSection.jsx
│   │   │       │   └── components/
│   │   │       │       ├── KPIGrid.jsx           # KPIs (cálculo FIFO en frontend)
│   │   │       │       ├── TimelineChart.jsx      # Gráfico principal
│   │   │       │       ├── AssetLeaderboard.jsx   # Tabla de assets
│   │   │       │       ├── PortfolioBar.jsx       # Barra proporcional por asset
│   │   │       │       ├── DonutChart.jsx
│   │   │       │       └── PriceTicker.jsx
│   │   │       ├── Operations/
│   │   │       │   └── components/OperationsTable.jsx
│   │   │       └── Portfolio/
│   │   │           └── PortfolioSection.jsx
│   └── utils/
│       ├── krakenAssets.js    # Mapeo nombre/color/logo de assets
│       ├── chartUtils.js      # Utilidades para Chart.js
│       ├── numberFormatter.js # Formato europeo (€, comas)
│       └── assetColors.js
├── CHANGELOG.md               # Ver sección "Cómo usar el CHANGELOG" abajo
└── KPI_CALCULATION_METHODOLOGY.md
```

---

## Flujo de Datos

```
trades.csv
    ↓
backend/main.py  →  POST /api/portfolio
    ↓
App.jsx (llama al backend, guarda portfolioData)
    ↓
Dashboard.jsx (gestiona estado de fechas y filtros)
    ├── startDate / endDate         → KPIs y AssetLeaderboard
    ├── timelineStartDate / End     → zoom visual del TimelineChart
    ├── hiddenAssets (Set)          → filtra assets en tabla y cálculos
    └── excludedOperations (Set)    → excluye operaciones del FIFO
```

**Regla de oro**: Los KPIs se recalculan **en el frontend** usando `portfolioData.timeline` completo — NO se re-pide al backend. El backend solo se vuelve a llamar (`onReprocessCsv`) cuando cambian las `excludedOperations`, porque eso modifica el FIFO histórico completo.

---

## Arquitectura de Fechas — La Parte Más Compleja

Hay **dos pares de fechas** distintas:

| Variable | Qué controla |
|---|---|
| `startDate` / `endDate` | Cálculo de KPIs y tabla de assets |
| `timelineStartDate` / `timelineEndDate` | Zoom visual del gráfico únicamente |

### Modos de interacción

| Modo | Qué pasa |
|---|---|
| **Filtro de fechas** | Ambos pares se actualizan |
| **Zoom timeline** | Solo `timelineStart/End` cambia; aparece popup "Apply to All" |
| **Point click** | `startDate = endDate = día clickado`; timeline NO se mueve |
| **Apply to All** | `timelineStart/End` → `start/EndDate`; recalcula KPIs |

### Regla: no llamar al backend en zooms de rango
Cuando el usuario aplica un rango (no point click), **NO** llamar a `onReprocessCsv`. El timeline completo ya está en memoria y los KPIs se calculan desde él con FIFO correcto.

---

## Semántica de los KPIs

Los KPIs muestran siempre el **estado acumulado del portfolio desde el inicio hasta `endDate`**. No es un delta del periodo seleccionado.

- **Excepción**: Si `startDate ≠ endDate` y `startDate > primera entrada del timeline`, los KPIs muestran delta del periodo (`total_gain[endDate] - total_gain[startDate]`). Ver `KPIGrid.jsx` → `shouldCalculatePeriodGains`.
- **Point click**: Snapshot del portfolio en esa fecha exacta (FIFO hasta ese día).

---

## Principios de Desarrollo

### Lo que HAY que hacer
- **Leer antes de tocar**: Siempre leer el archivo completo antes de modificarlo.
- **Cambios mínimos**: Solo modificar lo estrictamente necesario. No refactorizar código adyacente.
- **Seguir los patrones existentes**: Estilos inline con objetos JS, formato de números europeo (`formatEuropeanCurrency`), nombres de assets mapeados con `assetLabelMap`.
- **Actualizar el CHANGELOG** cuando se arregle un bug no trivial o se tome una decisión de diseño.

### Lo que NO hay que hacer
- No crear componentes nuevos para funcionalidad de un solo uso.
- No añadir estado global ni librerías de estado (Redux, Zustand, etc.).
- No mover estilos a ficheros CSS separados salvo que ya exista uno para ese componente.
- No llamar al backend cuando baste con recalcular desde `portfolioData.timeline`.
- No cambiar la semántica de los KPIs sin documentarlo en el CHANGELOG.
- No ignorar las advertencias de React (deps de `useEffect`, keys en listas, etc.).

### Layout — Peculiaridades a tener en cuenta
- El Dashboard tiene `marginTop: '-200px'` en el contenedor de contenido para compensar el Header. No es un bug.
- El Header tiene una div con `height: '220px'` y `transform: 'translateY(-150px)'` — parte de la maquetación visual. No tocar.
- Todos los contenedores usan `overflow: 'visible'` para permitir efectos que salen de sus límites.
- Los filtros (`Filters.jsx`) son `position: fixed` — no afectan al flujo del documento.
- Al abrir el sidebar: `paddingRight: '350px'` en el Dashboard. Los componentes deben reaccionar a `sidebarOpen`.

---

## Cómo Usar el CHANGELOG

El CHANGELOG (`portfolio-visualizer/CHANGELOG.md`) es una bitácora funcional, no técnica.

**Cuándo añadir una entrada:**
- Al corregir un bug no trivial (especialmente en cálculos FIFO, fechas, scroll).
- Al tomar una decisión de diseño relevante (por qué X y no Y).
- Al cambiar la semántica de algo (cómo se calculan KPIs, qué hace un filtro).

**Formato de entrada:**
```markdown
## Sesión — YYYY-MM-DD

### N. Título descriptivo del cambio

**Contexto / Problema:**
Qué estaba pasando y por qué era un problema.

**Causa raíz:**
Por qué ocurría (código específico si aplica).

**Fix / Decisión:**
Qué se cambió y por qué es la solución correcta.

**Cambios en código:**
- `Archivo.jsx`: descripción del cambio.
```

**Cuándo NO añadir al CHANGELOG:**
- Cambios cosméticos menores (color, padding, tamaño de fuente).
- Refactors que no cambian comportamiento.
- Fixes obvios de typos.

---

## Comandos de Desarrollo

```bash
# Frontend
cd portfolio-visualizer
npm run dev          # http://localhost:5173

# Backend
cd portfolio-visualizer/backend
python3 main.py      # http://localhost:8001

# Tests
cd portfolio-visualizer/backend
python3 main.py test        # Suite completa
python3 -m tests.test_portfolio  # Directo
```

> El backend corre en el puerto **8001** (no 8000 como dice el README).

---

## Assets y Nombres

Kraken usa nombres internos distintos a los nombres de display:

| Kraken interno | Display |
|---|---|
| `XXBT` | `BTC` |
| `XETH` | `ETH` |

El mapeo completo está en `src/utils/krakenAssets.js` (`assetLabelMap`).
Siempre usar `assetLabelMap[asset] || asset` para convertir antes de mostrar.

---

## Trampas Conocidas

1. **FIFO y fechas**: Si el FIFO empieza desde `startDate` (no desde el inicio del histórico), los valores de unrealized y cost basis son incorrectos. El FIFO siempre debe procesar desde la primera operación.

2. **`isFilterChangingDates` ref**: Flag para suprimir el popup flash cuando Filters tab cambia fechas. Se resetea en `handleTimelineApplyToAll` para no bloquear futuros popups.

3. **`position: sticky` en `<thead>`**: Puede causar que el browser no recalcule el scroll height cuando la tabla encoge. Solución: `useLayoutEffect` + corrección del scroll en `AssetLeaderboard.jsx`.

4. **`excludedOperations`**: Es un `Set` de `operation_key` (string compuesto). Al pasar al backend, convertir con `Array.from(excludedOperations)`.

5. **Supabase cache**: Los precios históricos se cachean en Supabase. Si los precios parecen incorrectos, puede ser un problema de cache en `supabase_cache.py`.

---

## Scripts de Mantenimiento (backend/scripts/)

| Script | Uso | Frecuencia |
|--------|-----|-----------|
| `actualizar_historicos.py` | Actualiza precios del día anterior | Cron diario 01:00 AM |
| `poblar_historico.py` | Pobla cache para últimos N días | Setup inicial |
| `recarga_historica.py` | Recarga rango específico de fechas | Mantenimiento manual |
| `setup_cron.sh` | Configura el cron job automático | Una vez |
| `setup-supabase.sql` | Schema de la tabla Supabase | Una vez |

```bash
# Ejemplos
cd portfolio-visualizer/backend
python3 scripts/actualizar_historicos.py
python3 scripts/recarga_historica.py 2025-09-01 2025-10-01 XXBT
python3 scripts/poblar_historico.py
```
