# Portfolio Visualizer — Changelog Funcional

Este documento explica los cambios funcionales realizados en la aplicación, describiendo
**qué se pretendía hacer**, **qué estaba mal** y **qué se corrigió**.

---

## Sesión — 2026-03-08

### 7. Bug: `assetRealizedGains` se resetea al revender un asset completamente vendido

**Contexto / Problema:**
Total Gains del KPI Grid seguía sin cuadrar con la suma de P&L de la tabla. Persiste
incluso con el fix de la fila "Closed Positions" (punto 6).

**Causa raíz:**
La condición de inicialización usaba `!assetHoldings[asset]` (negación truthy).
Esta condición se cumple tanto cuando el asset no existe aún (`undefined`, falsy) como
cuando sus holdings llegan exactamente a **0** (después de vender todo). Si el usuario
vende completamente un asset y luego lo vuelve a comprar, la condición dispara una
reinicialización que incluye `assetRealizedGains[asset] = 0`, borrando las ganancias
realizadas de la primera ronda de ventas.

KPIGrid no tenía este problema porque `calculatedRealizedGains` es una variable global
acumuladora que nunca se reinicializa. En AssetLeaderboard, al ser por-asset, sí se perdía.

**Fix:**
Cambiar `!assetHoldings[asset]` por `!(asset in assetHoldings)` en ambos componentes.
`in` detecta si la clave existe en el objeto, sin importar si su valor es 0 o falsy.
Así la inicialización solo ocurre una vez por asset, aunque sus holdings lleguen a 0.

**Cambios en código:**
- `AssetLeaderboard.jsx`: condición `if (!assetHoldings[asset])` → `if (!(asset in assetHoldings))`.
- `KPIGrid.jsx`: condición `if (!holdings_acumulados[asset])` → `if (!(asset in holdings_acumulados))` (mismo bug latente, aunque no manifestaba porque las ganancias son globales).

---

### 6. Bug: suma P&L de la tabla no coincide con KPI Total Gains

**Contexto:**
La suma del P&L de todos los assets de la tabla no igualaba el "Total Gains" del KPI.

**Causa raíz — dos divergencias:**

**A) Posiciones cerradas (principal):**
La tabla solo mostraba assets con `holdings > 0`. Si un asset fue completamente vendido
(holdings = 0), sus realized gains existían en `assetRealizedGains` pero la fila era
descartada con `return`. El KPIGrid sí los incluía en `calculatedRealizedGains`.
Discrepancia = suma de realized gains de todos los assets completamente vendidos.

**B) Comparación de fechas inconsistente:**
AssetLeaderboard usaba `new Date(entry.date) <= new Date(endDate)` (comparación de
objetos Date). KPIGrid usaba `entry.date.split('T')[0] <= endDateStr` (comparación
de strings). Con entradas de timeline en hora local sin `Z`, la conversión a Date
podría excluir el último día del periodo en zonas horarias UTC+X.

**Fix A — fila "Closed Positions":**
En lugar de descartar completamente los assets con `holdings ≤ 0`, se acumulan sus
realized gains en `closedPositionsTotalGains`. Si este valor es distinto de 0, se
añade una fila especial al final de la tabla (estilo diferenciado, opacidad reducida)
con el total de las ganancias/pérdidas de posiciones cerradas. Esto hace que la suma
visual de la tabla iguale exactamente el Total Gains del KPI.

**Fix B — alineación de comparación de fechas:**
AssetLeaderboard ahora usa `entry.date.split('T')[0] <= endDateStr`, idéntico a KPIGrid.

**Cambios en código:**
- `AssetLeaderboard.jsx`: lógica de fecha cambiada a string comparison.
- `AssetLeaderboard.jsx`: loop `Object.keys(assetHoldings)` acumula `closedPositionsTotalGains` para holdings ≤ 0 en vez de hacer `return`.
- `AssetLeaderboard.jsx`: se añade fila `isClosed: true` al array si `closedPositionsTotalGains !== 0`.
- `AssetLeaderboard.jsx`: sort separa filas normales de filas closed (siempre al final).
- `AssetLeaderboard.jsx`: render bifurca entre fila normal y fila closed con diseño propio.

---

### 5. Bug: ROI% absurdo (23.348%) en assets con ventas parciales

**Contexto:**
Tras corregir el bug anterior (punto 2), el TRUMP pasó de mostrar -158€ a mostrar
un ROI% de 23.348,6%, lo cual también es incorrecto.

**Causa raíz:**
El denominador del ROI% era `totalInvested` (coste de las posiciones actuales, que
tras el fix del punto 2 es pequeño porque se descuentan los lotes vendidos). Si
compraste €5 de TRUMP y vendiste casi todo, el coste restante puede ser €0,30.
Cualquier ganancia (realizadas + no realizadas) dividida entre €0,30 da un % enorme.

**Fix:**
Se añade `assetTotalEverInvested` (suma de todas las compras, nunca decrece) como
denominador del ROI%:

```js
const netProfitPercent = totalEverInvested > 0 ? (netProfit / totalEverInvested) * 100 : 0;
```

Esto responde a "de todo lo que invertí alguna vez en TRUMP, ¿cuánto gané?", que
es la pregunta natural. El `totalInvested` (coste base actual) se sigue usando para
`unrealizedGains` y `avgCost`.

**Cambios en código:**
- `AssetLeaderboard.jsx`: añadido `assetTotalEverInvested` (se incrementa en buy, nunca decrece). Usado como denominador de `netProfitPercent`.

---

### 3. Bug: P&L de la tabla inconsistente con el KPI en modo rango de fechas

**Contexto:**
Al aplicar un rango de fechas (ej. últimos 3 meses), la suma del P&L de todos los
assets en la tabla no coincidía con el P&L total del KPI.

**Causa raíz:**
`AssetLeaderboard.jsx` filtraba el timeline a `startDate <= entry <= endDate` en modo
rango, mientras que `KPIGrid.jsx` filtraba `entry <= endDate` (todo el histórico hasta
la fecha fin). El FIFO de la tabla empezaba desde cero en `startDate`, perdiendo todas
las compras anteriores a esa fecha → coste base y holdings incorrectos.

**Fix:**
AssetLeaderboard ahora usa la misma lógica que KPIGrid: siempre procesa todo el
histórico hasta `endDate`, independientemente de `startDate`:

```js
timelineToProcess = portfolioData.timeline.filter(entry => entryDate <= endDateObj);
```

`startDate` solo afecta al zoom visual del timeline, nunca al rango de operaciones
procesadas. Esto es consistente con la arquitectura documentada en el CHANGELOG de
2026-02-26 (punto 5) y en `CLAUDE.md`.

**Cambios en código:**
- `AssetLeaderboard.jsx`: eliminado el caso `else` de rango que filtraba `>= startDate`. Ahora un único filtro `<= endDate` cubre todos los modos (point click y rango).

---

### 2. Bug: P&L imposible en assets con ventas parciales (e.g. TRUMP -158€)

**Contexto:**
La tabla de assets mostraba pérdidas totales imposibles en assets de los que se había
vendido parte de la posición (e.g. TRUMP aparecía con -158€ de pérdida cuando la
inversión total era mucho menor).

**Causa raíz:**
En el FIFO de `AssetLeaderboard.jsx`, `assetTotalInvested` se incrementa correctamente
al comprar, pero **nunca se reduce al vender**. Al calcular las ganancias no realizadas:

```js
const unrealizedGains = currentValue - totalInvested;
```

`totalInvested` incluía el coste de TODOS los lotes históricos, incluyendo los ya vendidos.
Con posiciones parcialmente vendidas, `unrealizedGains` era enormemente negativo, haciendo
que `netProfit = realizedGains + unrealizedGains` mostrase pérdidas imposibles.

**Fix:**
Al procesar una venta en el FIFO, restar `totalCostVendido` de `assetTotalInvested`
inmediatamente después de calcular el coste de los lotes vendidos:

```js
assetTotalInvested[asset] = Math.max(0, assetTotalInvested[asset] - totalCostVendido);
```

Esto asegura que `assetTotalInvested` siempre representa solo el coste base de las
posiciones abiertas actuales. También corrige el `avgCost` (coste medio por unidad)
y el `netProfitPercent` (ROI%), que dependían del mismo valor.

**Afecta a:**
Cualquier asset del que se haya vendido alguna parte. Assets nunca vendidos no se ven
afectados porque la rama de sell nunca se ejecuta para ellos.

**Cambios en código:**
- `AssetLeaderboard.jsx`: añadida línea `assetTotalInvested[asset] = Math.max(0, ...)` en la rama `sell` del FIFO.

---

### 1. Bug: scroll excesivo tras filtrar y restaurar assets en la tabla

**Contexto:**
Al quitar todos los assets del filtro (tabla vacía) y volver a añadir uno, el usuario
podía hacer scroll mucho más allá del final del contenido real de la página.

**Causa raíz:**
Dos mecanismos combinados:
1. El browser (especialmente Chrome) mantiene el scroll position aunque éste supere
   el nuevo `scrollHeight` tras encoger el contenido. La `position: sticky` del `<thead>`
   puede agravar esto al crear compositor layers que el browser no invalida inmediatamente.
2. Al reducirse la tabla de N filas a 1, el scroll position previo (que apuntaba al final
   de la tabla grande) quedaba "flotando" en vacío, y el browser lo respetaba.

**Fix:**
En `AssetLeaderboard.jsx`, se añaden dos efectos que se disparan cuando cambia
`processedData.length` (número de assets visibles):

- `useLayoutEffect`: fuerza un recálculo síncrono del layout antes de pintar, lo que
  obliga al browser a actualizar el `scrollHeight` al valor correcto.
- `useEffect`: tras el pintado, comprueba si `window.scrollY > scrollHeight - innerHeight`
  y corrige el scroll position al máximo válido si es necesario.

**Cambios en código:**
- `AssetLeaderboard.jsx`: añadido `useLayoutEffect` y `useEffect` (import actualizado).

---

## Sesión — 2026-02-26

### 5. Semántica de filtrado temporal: snapshot en endDate (no delta de periodo)

**Decisión de diseño:**
Se eliminó el modo "delta de periodo" en favor del modelo más simple e intuitivo:
los KPIs muestran **siempre el estado acumulado del portfolio desde el inicio hasta
`endDate`**. El `startDate` solo controla el zoom visual del gráfico.

**Por qué el delta era confuso:**
- Si compraste BTC en enero con pérdidas, y filtras febrero→marzo donde BTC sube un
  poco, el delta mostraría ganancias positivas aunque estés en negativo global.
- El usuario tiene que recordar qué modo está viendo para interpretar los números.
- Para un tracker personal, la pregunta natural es "¿cómo estaba mi cartera el día X?"
  no "¿cuánto gané específicamente entre X e Y?".

**Opción futura — delta de periodo:**
Si en algún momento se quiere reimplantar el delta (útil para reporting de rendimiento
trimestral), la lógica ya estaba implementada y está anotada con comentarios en el código:
- `KPIGrid.jsx`: `profit = total_gain[endEntry] - total_gain[startEntry]`
- `TimelineChart.jsx` tooltip: `profit = entry.total_gain - periodStartEntry.total_gain`
Los cálculos son correctos porque leen directamente los acumulados pre-calculados del
timeline (FIFO completo), no requieren reprocessing del backend.

**Cambios en código:**
- `KPIGrid.jsx`: eliminado bloque `shouldCalculatePeriodGains`. Siempre se usa FIFO
  acumulado hasta `endDate`.
- `TimelineChart.jsx` tooltip: eliminado `isPeriodMode`. El tooltip siempre muestra
  `entry.total_gain` (valor absoluto acumulado).
- Las fees también se acumulan desde el inicio hasta `endDate`.

### 6. Bug: popup "Apply to All" no reaparece tras zoom→apply→reset→zoom

**Causa raíz:**
`handleFiltersChange` pone `isFilterChangingDates.current = true` para suprimir el
flash del popup cuando los filtros del tab cambian fechas. Pero cuando `Apply to All`
llama a `handleFiltersChange`, el flag se queda a `true` indefinidamente porque:
- Después del apply las fechas coinciden → la detección del popup nunca llama a
  `showTimelinePopup` → el flag nunca se consume (se reseteaba solo al ser leído).
- Tras el reset y un nuevo zoom, `showTimelinePopup` ve el flag a `true` y devuelve
  early → popup no aparece.

**Fix:**
- `handleTimelineApplyToAll`: resetea `isFilterChangingDates.current = false`
  inmediatamente después de llamar a `handleFiltersChange`. El flag es para
  supresión de flash Filters-tab, no para Apply from Timeline.
- `handleFilterReset`: también resetea `isFilterChangingDates.current` y
  `lastShownPopup.current` como medida de seguridad.

---

## Sesión — 2026-02-25

### 1. Discrepancia de P&L entre KPIGrid y tooltip del Timeline

**Contexto:**
Había una diferencia de ~149€ entre los valores de ganancias que mostraba el KPIGrid
(unrealized, total gains) y los que aparecían al hacer hover en el timeline.

**Causa raíz — dos bugs independientes:**

#### Bug A: El tooltip del timeline restaba el valor del primer día
En `TimelineChart.jsx`, el cálculo del P&L del tooltip era:
```
profit = total_gain_hoy - total_gain_primer_día
```
Esto convierte un valor absoluto acumulado en un delta desde el primer día,
pero `total_gain` en el primer día no es 0 (ya tiene operaciones), así que
se restaba un valor no nulo y el resultado era incorrecto.

**Fix:** Se eliminó la resta. El tooltip usa `entry.total_gain` directamente
como valor absoluto acumulado desde el inicio del histórico.

#### Bug B: KPIGrid usaba una fórmula de periodo incorrecta para "All Time"
En `KPIGrid.jsx`, la variable `shouldCalculatePeriodGains` se activaba cuando
`startDate !== endDate`. El filtro "All Time" establece explícitamente las fechas
inicio y fin de todo el histórico, por lo que la condición se cumplía y se usaba
la fórmula:
```
periodGains = portfolioValueEnd - portfolioValueStart - cashFlowsDuringPeriod
```
El problema: `portfolioValueStart` es el valor al cierre del primer día de trading
(que ya incluye las compras de ese día), y `cashFlowsDuringPeriod` también incluye
las compras de ese primer día → doble conteo → sobreestimación de pérdidas en ~149€.

**Fix:** Se añadió la condición `isEffectivelyAllTime`: si `startDate` es igual o
anterior a la primera entrada del timeline, se considera "todo el histórico" y se
usa el cálculo FIFO en lugar de la fórmula de periodo.

```javascript
const firstTimelineDate = portfolioData.timeline?.[0]?.date?.split('T')[0] || '';
const isEffectivelyAllTime = !startDate || (startDate <= firstTimelineDate);
const shouldCalculatePeriodGains = !isPointClick && startDate && endDate
  && startDate !== endDate && !isEffectivelyAllTime;
```

**Resultado:** KPIGrid y timeline muestran el mismo total_gain (FIFO puro):
unrealized ≈ -1537, realized ≈ -34, total ≈ -1571.

---

### 2. Lógica de "Apply to All Page" — corrección completa

**Comportamiento deseado:**
Cuando el usuario selecciona un rango en el timeline y pulsa "Apply to All Page",
los KPIs deben mostrar el **delta de rendimiento durante ese periodo**:
- Total gains del periodo = total_gain[endDate] - total_gain[startDate]
- Realized del periodo   = realized_gain[endDate] - realized_gain[startDate]
- Unrealized del periodo = total - realized
- Fees del periodo       = suma de fees solo entre startDate y endDate

**Cambios realizados:**

#### Dashboard.jsx — eliminar backend reprocessing para rangos de fecha
`handleTimelineApplyToAll` ya no llama a `onReprocessCsv(startDate, endDate)` cuando
el usuario aplica un rango. El backend solo debe reprocesarse cuando cambian las
operaciones excluidas (porque eso modifica el FIFO histórico completo). Pasar fechas
al backend hacía que el timeline se construyera con el FIFO empezando desde 0 en
`startDate`, perdiendo todas las posiciones anteriores.

#### KPIGrid.jsx — nueva fórmula de periodo
Cuando `shouldCalculatePeriodGains = true`, los valores ya no se calculan con la
fórmula `End Value - Start Value - CashFlows` (que requería saber los cash flows
exactos y tenía problemas de doble conteo). En su lugar se leen directamente los
valores acumulados pre-calculados del timeline:

```javascript
const periodTotal      = endEntry.total_gain           - startEntry.total_gain;
const periodRealized   = endEntry.realized_gain_period - startEntry.realized_gain_period;
const periodUnrealized = periodTotal - periodRealized;
```

Estos valores son siempre correctos porque el backend los calcula con el FIFO
completo desde el primer trade. El `startEntry` se busca como "última entrada en
el timeline cuya fecha <= startDate" para manejar fines de semana o gaps.

#### KPIGrid.jsx — fees del periodo
Las fees ya solo se suman para operaciones dentro del rango seleccionado
(anteriormente se sumaban todas desde el inicio del histórico).

#### TimelineChart.jsx — tooltip en modo periodo
El tooltip detecta automáticamente si la ventana visible es un sub-periodo del histórico
completo comparando la fecha del primer elemento visible con la fecha del primer elemento
del timeline completo (`portfolioData.timeline[0]`).

- **All-time mode** (`visibleFirstDate == fullTimelineFirstDate`): el tooltip muestra
  `entry.total_gain` (valor absoluto acumulado desde el primer trade). Sin cambios respecto
  al comportamiento anterior.

- **Period mode** (`visibleFirstDate > fullTimelineFirstDate`): el tooltip muestra deltas
  desde el inicio de la ventana visible:
  ```
  profit          = entry.total_gain          - periodStartEntry.total_gain
  periodRealized  = entry.realized_gain_period - periodStartEntry.realized_gain_period
  periodUnrealized = profit - periodRealized
  profitPct       = profit / periodStartEntry.value * 100
  ```
  Esto hace que el tooltip sea consistente con los KPIs del KPIGrid, que también muestran
  deltas del periodo cuando "Apply to All Page" está activo.

**Semántica final del sistema:**
| Modo | Portfolio Value | Cost Basis | Unrealized | Realized | Total P&L |
|---|---|---|---|---|---|
| All-time | snapshot hoy | FIFO actual | acumulado | acumulado | acumulado |
| Period (Feb→Mar) | snapshot Mar 1 | FIFO en Mar 1 | delta Feb→Mar | delta Feb→Mar | delta Feb→Mar |

---

## Arquitectura: cómo fluyen los datos de fecha

```
Usuario interactúa con Timeline / Filters
        ↓
Dashboard.jsx  (gestiona estado de fechas)
  ├── startDate / endDate          → fechas que recibe KPIGrid (para recalcular KPIs)
  ├── timelineStartDate / timelineEndDate → fechas de zoom visual del timeline
  └── isInPointClickMode           → si true, las fechas de timeline no cambian

KPIGrid.jsx recibe startDate + endDate + portfolioData.timeline completo
  → filtra / recalcula KPIs con FIFO

TimelineChart recibe buttonStartDate + buttonEndDate → zoom visual solamente
```

### Dos modos de interacción con el timeline

| Modo | ¿Qué cambia? | Recálculo backend | Recálculo KPIs |
|---|---|---|---|
| Zoom (sin Apply) | Solo ventana visual del chart | No | No |
| Point Click | startDate = endDate = día clickado | Sí (snapshot de ese día) | Sí (FIFO hasta ese día) |
| Apply to All Page (rango) | Ambas fechas, zoom + KPIs | **Sí** ← problema aquí | **Sí** ← problema aquí |

---

## Diagnóstico: por qué "Apply to All Page" da resultados erróneos

### Qué ocurre cuando se pulsa "Apply to All Page" con un rango de fechas

1. `handleTimelineApplyToAll()` en `Dashboard.jsx` llama a:
   ```javascript
   onReprocessCsv(newStartDate, newEndDate, excludedOperations)
   ```

2. `App.jsx` envía `start_date` y `end_date` al backend via `FormData`.

3. **El backend hace dos cosas diferentes con esas fechas:**
   - Las funciones KPI (`calcular_portfolio_value`, `calcular_cost_basis`, etc.)
     procesan el CSV **completo**, ignorando `start_date` / `end_date`.
     → Los KPIs del objeto `kpis` que devuelve el backend son siempre "all time".
   - `calcular_timeline_con_cache_hibrido(df, start_date, end_date)` genera el
     timeline **solo desde `start_date`**, con el FIFO empezando desde 0.

4. **El FIFO del timeline empieza desde cero en `start_date`:**
   - Si compraste BTC en enero 2024 y filtras a "últimos 3 meses", el timeline
     construido NO incluye ese BTC.
   - El portfolio_value del primer día del rango = 0 (no hay posiciones previas).
   - Todos los cálculos de unrealized, cost basis, etc. son incorrectos.

5. **KPIGrid recibe este timeline truncado** y ejecuta su propio FIFO sobre él:
   - El FIFO del frontend también empieza desde 0 en `start_date`.
   - Los valores calculados NO reflejan las posiciones reales del portfolio.

### Resultado: ninguno de los dos valores es correcto

| Fuente | Problema |
|---|---|
| `portfolioData.kpis` (backend) | Siempre "all time", ignora el filtro de fecha |
| `portfolioData.timeline` (backend) | FIFO empieza desde 0 en `start_date` — posiciones previas perdidas |
| KPIGrid FIFO (frontend) | Igual — opera sobre timeline truncado, sin historial previo |
| `shouldCalculatePeriodGains` formula | Opera sobre valores de inicio incorrectos (portfolio = 0 al inicio) |

### Cuál debería ser el comportamiento correcto

Hay dos interpretaciones válidas de "Apply to All Page" con un rango de fechas:

**Opción A — Snapshot del portfolio al final del periodo:**
> "Muéstrame cómo estaba mi portfolio a fecha `endDate`"
> Los KPIs muestran el estado del portfolio en `endDate`,
> calculado con el historial completo (FIFO correcto).

**Opción B — Delta de rendimiento durante el periodo:**
> "¿Cuánto gané/perdí entre `startDate` y `endDate`?"
> = `total_gain[endDate] - total_gain[startDate]`
> Requiere el historial completo para que los valores de inicio sean correctos.

**La arquitectura actual no implementa ninguna de las dos correctamente.**

### Solución implementada

Ver sección "2. Lógica de Apply to All Page" arriba.

---

### 3. Filtros del sidebar se actualizan al aplicar un rango de fechas

**Comportamiento anterior:**
La lista de assets y tipos de operaciones en el sidebar de filtros mostraba siempre
el conjunto completo histórico, independientemente del rango de fechas activo. Por
ejemplo, si se filtraba a un periodo con solo Bitcoin, seguían apareciendo ETH, SOL,
etc. en la lista de assets.

**Nuevo comportamiento:**
Cuando hay un rango de fechas activo (distinto del histórico completo), las listas
se restringen dinámicamente a lo que realmente ocurrió en ese periodo:
- **Assets**: solo los que tienen operaciones entre `startDate` y `endDate`
- **Tipos de operación**: solo los `operation_key` presentes en ese rango ('Buy Limit',
  'Buy Market', 'Sell Limit', etc.)

Si el rango cubre el histórico completo, se muestran todas las opciones como antes.

**Implementación** (`Filters.jsx`):
- `useMemo` añadido al import
- `periodFilteredLists` computa en el render las listas filtradas recorriendo
  `portfolioData.timeline` y extrayendo los assets (reverse-mapeados de Kraken
  a nombre de display) y `operation_key` únicos del rango seleccionado
- `displayAssets` y `displayOperationTypes` sustituyen a `availableAssets` y la
  lista hardcodeada `['Buy Limit', 'Buy Market', 'Sell Limit']` en el render
- Las selecciones del usuario (`hiddenAssets`, `excludedOperations`) se preservan:
  si un asset no aparece en el periodo actual pero estaba oculto, seguirá oculto
  cuando se amplíe el rango

---

### 4. Cambios en el tab de Filters sincronizan el timeline (y ocultan el popup)

**Problema:**
Tras hacer "Apply to All Page" desde el timeline, la variable interna `isZoomed`
quedaba en `true`. Cuando luego el usuario cambiaba fechas desde el tab de Filters
(quick presets 1W, 1M, 3M… o selector de fechas manual), el timeline no se
actualizaba porque el sync estaba guardado por:

```javascript
if (!isZoomed || isApplyingFromTimeline) { setStartDate(externalStartDate); }
```

`isZoomed = true` y `isApplyingFromTimeline = false` → sync bloqueado.

**Por qué es seguro eliminar el guard:**
El effect solo corre cuando `externalStartDate !== startDate` (estado interno).
Cuando el timeline aplica sus propias fechas, el Dashboard actualiza `startDate`
al mismo valor → la próxima vez `externalStartDate === startDate` → no hay sync →
sin bucle. El guard de `isZoomed` era redundante y causaba el problema.

**Cambios:**
- `TimelineChart.jsx`: eliminada la condición `!isZoomed || isApplyingFromTimeline`
  en ambos effects de sync. Cualquier cambio externo de fechas sincroniza el
  timeline incondicionalmente.
- `Dashboard.jsx`: en `handleFiltersChange`, cuando llega un rango de fechas del
  tab de Filters, se llama a `setShowApplyPopup(false)` y se resetea
  `lastShownPopup.current` — el popup de "Apply to All" pendiente desaparece porque
  filtros y timeline ya están en sync.
