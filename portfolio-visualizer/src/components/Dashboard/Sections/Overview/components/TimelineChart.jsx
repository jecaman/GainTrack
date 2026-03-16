import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Chart, TimeScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { makeOpId } from '../../../../../utils/chartUtils';

// Registrar escalas y plugins
Chart.register(TimeScale, LinearScale, PointElement, LineElement, Tooltip, Filler, zoomPlugin);



// Plugin para mostrar punto y línea en hover con animación al salir
const hoverPlugin = {
  id: 'hoverPlugin',
  beforeInit(chart) {
    // Estado para la animación al salir del hover
    chart.exitHoverAnimation = {
      isAnimating: false,
      lastHoverIndex: -1,
      animationFrame: null,
      startTime: 0,
      duration: 300 // 0.3 segundos - más rápido para evitar flash de línea gris
    };
    
    // Estado para tooltip congelado
    chart.frozenTooltip = {
      isFrozen: false,
      frozenIndex: -1,
      lastDrawnIndex: -1 // Para evitar redibujar innecesariamente
    };
  },
  beforeDatasetsDraw(chart) {
    // Almacenar información del hover para usar en afterDraw
    if (chart.hoveredDataIndex !== undefined) {
      this._hoveredIndex = chart.hoveredDataIndex;
      chart.exitHoverAnimation.lastHoverIndex = chart.hoveredDataIndex;
    }
  },
  afterDraw(chart) {
    const { ctx } = chart;
    
    // No dibujar durante drag
    if (chart.isDragging) return;
    
    // Si hay animación de salida de hover activa
    if (chart.exitHoverAnimation.isAnimating) {
      this.drawExitHoverAnimation(chart, ctx);
      return;
    }
    
    // Determinar qué índice usar: congelado tiene prioridad
    let dataIndex;
    if (chart.frozenTooltip && chart.frozenTooltip.isFrozen) {
      dataIndex = chart.frozenTooltip.frozenIndex;
      // Cuando está congelado, siempre dibujar (no usar cache de lastDrawnIndex)
    } else {
      // Usar el índice almacenado desde onHover
      if (chart.hoveredDataIndex === undefined) return;
      dataIndex = chart.hoveredDataIndex;
    }
    const portfolioDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value' || d.label === 'Total P&L');
    if (!portfolioDataset) return;
    
    const meta = chart.getDatasetMeta(chart.data.datasets.indexOf(portfolioDataset));
    const point = meta.data[dataIndex];
    if (!point) return;
    
    const x = point.x;
    const y = point.y;
    
    // Obtener el valor del P&L para determinar el color
    const currentValue = portfolioDataset.data[dataIndex];
    const isNegative = currentValue < 0;
    const pointColor = isNegative ? '#ff4444' : '#00ff88';
    const waveColor = isNegative ? '255, 68, 68' : '0, 255, 136';
    
    
    // Programar la siguiente animación
    if (!chart._animationFrameId && !chart._isDestroying) {
      chart._animationFrameId = requestAnimationFrame(() => {
        chart._animationFrameId = null;
        if (chart && !chart._isDestroying && chart.canvas && chart.canvas.ownerDocument) {
          try {
            chart.update('none');
          } catch (e) {
            console.warn('Error updating chart:', e);
          }
        }
      });
    }
    
    ctx.save();
    
    // Determinar si está congelado para los efectos visuales
    const isFrozen = (chart.frozenTooltip && chart.frozenTooltip.isFrozen && dataIndex === chart.frozenTooltip.frozenIndex);
    
    // Si está congelado, dibujar línea vertical estilizada
    if (isFrozen) {
      const { chartArea } = chart;
      
      // Gradiente vertical para la línea
      const lineGradient = ctx.createLinearGradient(x, chartArea.top, x, chartArea.bottom);
      lineGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      lineGradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.6)');
      lineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
      lineGradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.6)');
      lineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]); // Patrón más elegante
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();
      ctx.setLineDash([]); // Resetear
    }
    
    // Punto luminoso moderado (más grande si está congelado)
    const pointRadius = isFrozen ? 9 : 7;
    const borderWidth = isFrozen ? 3 : 2;
    
    ctx.beginPath();
    ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
    ctx.fillStyle = pointColor;
    ctx.fill();
    
    // Borde del punto (más grueso si está congelado)
    ctx.beginPath();
    ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = borderWidth;
    ctx.stroke();
    
    // Resplandor suave alrededor del punto (más intenso si está congelado)
    const glowRadius = isFrozen ? 20 : 15;
    const glowIntensity = isFrozen ? 0.8 : 0.6;
    
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
    glowGradient.addColorStop(0, `rgba(${waveColor}, ${glowIntensity})`);
    glowGradient.addColorStop(0.6, `rgba(${waveColor}, ${glowIntensity * 0.3})`);
    glowGradient.addColorStop(1, `rgba(${waveColor}, 0)`);
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();
    
    // Efecto de ondas expandiéndose continuamente
    const time = Date.now() * 0.001;
    
    // Emitir 3 ondas con diferentes tiempos de inicio
    for (let i = 0; i < 3; i++) {
      const waveDelay = i * 1.5; // Desfase entre ondas
      const waveTime = (time + waveDelay) % 4; // Ciclo de 4 segundos por onda
      const waveRadius = waveTime * 10; // Expansión de 0 a 40px
      const waveOpacity = Math.max(0, 1 - (waveTime / 4)); // Se desvanece al expandirse
      
      if (waveRadius > 3) { // Solo mostrar cuando la onda se ha separado del punto
        ctx.beginPath();
        ctx.arc(x, y, waveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${waveColor}, ${waveOpacity * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    
    // Línea fina conectora entre punto y fecha
    if (chart.data.labels && chart.data.labels[dataIndex]) {
      const { chartArea } = chart;
      let textY = y - 68;
      const minY = chartArea.top + 30;
      if (textY < minY) {
        textY = y + 35;
      }
      
      // Dibujar línea fina conectora
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (textY < y) {
        // Fecha arriba del punto
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x, textY + 15);
      } else {
        // Fecha debajo del punto
        ctx.moveTo(x, y + 8);
        ctx.lineTo(x, textY - 15);
      }
      ctx.stroke();
    }
    
    // Mostrar fecha con ajuste automático para evitar cortes
    if (chart.data.labels && chart.data.labels[dataIndex]) {
      const label = chart.data.labels[dataIndex];
      const { chartArea } = chart;
      
      // Calcular posición Y adaptativa
      let textY = y - 68;
      const minY = chartArea.top + 30; // Margen mínimo desde arriba
      if (textY < minY) {
        textY = y + 35; // Mover debajo del punto si está muy arriba
      }
      
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      
      // Fondo para la fecha con ajuste horizontal
      const textWidth = ctx.measureText(label).width;
      const padding = 12;
      const bgHeight = 26;
      const bgY = textY - bgHeight + 4;
      
      // Ajustar X si se sale por los lados
      let adjustedX = x;
      const bgWidth = textWidth + padding * 2;
      if (adjustedX - bgWidth/2 < chartArea.left) {
        adjustedX = chartArea.left + bgWidth/2;
      } else if (adjustedX + bgWidth/2 > chartArea.right) {
        adjustedX = chartArea.right - bgWidth/2;
      }
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(adjustedX - textWidth/2 - padding, bgY, textWidth + padding*2, bgHeight);
      
      // Texto de la fecha
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, adjustedX, textY);
    }
    
    // Las ondas se animan automáticamente con el tiempo
    
    ctx.restore();
    },
  
  // Método para iniciar la animación al salir del hover
  startExitHoverAnimation(chart) {
    if (chart.exitHoverAnimation.lastHoverIndex === -1) return;
    
    chart.exitHoverAnimation.isAnimating = true;
    chart.exitHoverAnimation.startTime = Date.now();
    
    const animate = () => {
      if (chart.exitHoverAnimation.isAnimating) {
        // Marcar que estamos en animación para que los datasets futuros no se muestren
        chart._isInTransition = true;
        
        if (chart && !chart._isDestroying && chart.canvas && chart.canvas.ownerDocument) {
          try {
            chart.update('none');
          } catch (e) {
            console.warn('Error updating chart:', e);
          }
        }
        chart.exitHoverAnimation.animationFrame = requestAnimationFrame(animate);
      }
    };
    
    chart.exitHoverAnimation.animationFrame = requestAnimationFrame(animate);
  },
  
  // Método para dibujar la animación de línea progresiva
  drawExitHoverAnimation(chart, ctx) {
    const animation = chart.exitHoverAnimation;
    const elapsed = Date.now() - animation.startTime;
    const progress = Math.min(elapsed / animation.duration, 1);
    
    // Obtener el dataset principal
    const portfolioDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value' || d.label === 'Total P&L');
    if (!portfolioDataset) return;
    
    const meta = chart.getDatasetMeta(chart.data.datasets.indexOf(portfolioDataset));
    const startIndex = animation.lastHoverIndex;
    const totalPoints = portfolioDataset.data.length;
    const currentEndIndex = startIndex + Math.floor((totalPoints - startIndex) * progress);
    
    // Dibujar la línea progresiva desde el punto de hover
    if (currentEndIndex > startIndex) {
      ctx.save();
      ctx.strokeStyle = portfolioDataset.borderColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      
      for (let i = startIndex; i <= Math.min(currentEndIndex, totalPoints - 1); i++) {
        const point = meta.data[i];
        if (point) {
          if (i === startIndex) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }
      }
      
      ctx.stroke();
      ctx.restore();
    }
    
    // Terminar animación si se completó (terminar un poco antes para evitar flash)
    if (progress >= 0.95) {
      animation.isAnimating = false;
      if (animation.animationFrame) {
        cancelAnimationFrame(animation.animationFrame);
        animation.animationFrame = null;
      }
      
      // Limpiar bandera de transición cuando termine la animación
      chart._isInTransition = false;
    }
  }
};
// Plugin para ocultar líneas futuras durante animaciones globales
const hideGrayLinesPlugin = {
  id: 'hideGrayLines',
  beforeDraw(chart) {
    // Marcar transición durante animaciones globales del chart
    if (chart._animator && chart._animator.running) {
      chart._isInTransition = true;
    } else {
      chart._isInTransition = false;
    }
  },
  afterDraw(chart) {
    // Los datasets futuros se recrearán automáticamente en el próximo render
    // No hacer nada aquí para evitar conflictos
  }
};

// Plugin para dividir línea en activa/futura
const splitLinePlugin = {
  id: 'splitLine',
  afterDraw(chart) {
    const { ctx, data, scales } = chart;
    
    // No dibujar durante cualquier animación (hover exit o chart animations)
    if ((chart.exitHoverAnimation && chart.exitHoverAnimation.isAnimating) || 
        (chart._animator && chart._animator.running)) {
      return;
    }
    
    let activeIndex;
    
    // Determinar el índice activo: congelado tiene prioridad
    if (chart.frozenTooltip && chart.frozenTooltip.isFrozen) {
      activeIndex = chart.frozenTooltip.frozenIndex;
      
      // Solo procesar si es diferente al último dibujado (usar el mismo estado que hoverPlugin)
      if (chart.frozenTooltip.lastDrawnIndex === activeIndex) {
        return; // Ya está dibujado, no hacer nada
      }
      
    } else {
      const activeElements = chart.getActiveElements();
      if (activeElements.length === 0) return;
      activeIndex = activeElements[0].index;
    }
    
    // Para cada dataset visible
    data.datasets.forEach((dataset, datasetIndex) => {
      if (dataset.hidden || !dataset.data || dataset.data.length === 0) return;
      
      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta.visible || !meta.data || meta.data.length === 0) return;
      
      // No dibujar línea futura para Cost Basis si showTotalInvested es false
      if (dataset.label === 'Cost Basis') {
        // Buscar el valor de showTotalInvested desde el componente
        const showTotalInvested = dataset.borderColor !== 'rgba(208, 208, 208, 0)';
        if (!showTotalInvested) return;
      }
      
      ctx.save();
      
      
      ctx.restore();
    });
  }
};

// Registrar los plugins
Chart.register(hoverPlugin, hideGrayLinesPlugin, splitLinePlugin);

const TimelineChart = ({ portfolioData, theme, hiddenAssets = new Set(), excludedOperations = new Set(), disabledOps = new Set(), showApplyPopup, setShowApplyPopup, startDate: externalStartDate, endDate: externalEndDate, buttonStartDate, buttonEndDate, setStartDate: setExternalStartDate, setEndDate: setExternalEndDate, onTimelineApplyToAll, showTimelinePopup, showTimelineClickPopup, sidebarOpen, timelineUnfreezeTooltipRef, filterSelectedPreset, isInPointClickMode, setIsInPointClickMode, onFilterReset, isApplyingFromTimeline, viewMode: viewModeProp = 'both', onViewModeChange, showTotalInvested: showTotalInvestedProp = false, onShowTotalInvestedChange, periodMode: periodModeProp = 'day', onPeriodModeChange }) => {
  // Constantes de estilo reutilizables
  const isDark = theme.bg === '#000000';
  const COLORS = {
    HOVER_LIGHT: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    HOVER_DEFAULT: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    BACKGROUND_GLASS: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    BACKGROUND_DARK: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.85)',
    TEXT: isDark ? '#ffffff' : '#111111',
    TEXT_DIM: isDark ? 'rgba(245, 245, 245, 0.8)' : 'rgba(0, 0, 0, 0.6)',
    TEXT_MUTED: isDark ? 'rgba(245, 245, 245, 0.6)' : 'rgba(0, 0, 0, 0.4)',
    BORDER: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
    BORDER_HOVER: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)',
    BORDER_STRONG: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
    BTN_INACTIVE: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    BTN_INACTIVE_SM: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
    SHADOW: isDark ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)' : '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)',
    SHADOW_SM: isDark ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 1px 4px rgba(0, 0, 0, 0.06)',
  };

  // Función centralizada para formatear fechas
  // Use standard YYYY-MM-DD format (same as Filter) - avoid timezone issues
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const showTotalInvested = showTotalInvestedProp;
  const setShowTotalInvested = (val) => onShowTotalInvestedChange?.(typeof val === 'function' ? val(showTotalInvestedProp) : val);
  const viewMode = viewModeProp;
  const setViewMode = (val) => onViewModeChange?.(val);
  const periodMode = periodModeProp;
  const setPeriodMode = (val) => onPeriodModeChange?.(val);
  const [startDate, setStartDateRaw] = useState(buttonStartDate || externalStartDate || '');
  const [endDate, setEndDateRaw] = useState(buttonEndDate || externalEndDate || '');

  // Wrappers: every date change is immediately mirrored to Dashboard's timelineStartDate /
  // timelineEndDate so the value survives section-navigation (component remount).
  // The sync effects that respond to externalStartDate/EndDate changes (below) use the
  // raw setters to avoid re-triggering setExternalStartDate.
  const setStartDate = (date) => {
    setStartDateRaw(date);
    if (date) setExternalStartDate?.(date);
  };
  const setEndDate = (date) => {
    setEndDateRaw(date);
    if (date) setExternalEndDate?.(date);
  };

  // Flags to skip the very first run of the external-sync effects on mount.
  // Local startDate/endDate are already correctly initialised from buttonStartDate/
  // buttonEndDate (the persisted timeline zoom). Without this guard the effects would
  // override those values with externalStartDate/EndDate (the KPI dates).
  const syncStartInitializedRef = useRef(false);
  const syncEndInitializedRef = useRef(false);

  // Reset the guards on unmount so each real (or StrictMode-simulated) mount
  // starts with them cleared. Without this the StrictMode double-invoke would
  // leave the refs as true on the second mount, bypassing the guard.
  useEffect(() => {
    return () => {
      syncStartInitializedRef.current = false;
      syncEndInitializedRef.current = false;
    };
  }, []);

  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [showMonthYearSelector, setShowMonthYearSelector] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [processedTimelineData, setProcessedTimelineData] = useState([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomDates, setZoomDates] = useState({ start: null, end: null });
  const [isDragging, setIsDragging] = useState(false);
  const [isTooltipFrozen, setIsTooltipFrozen] = useState(false);
  const [isChartStabilizing, setIsChartStabilizing] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [showFill, setShowFill] = useState(false);
  const popupTimeoutRef = useRef(null);
  
  const chartRef = useRef(null);
  const hasUserInteractedWithTimeline = useRef(false);
  const userClosedPopup = useRef(false);
  
  
  // Cleanup del chart al desmontar el componente o cuando cambien las dependencias críticas
  useEffect(() => {
    return () => {
      // Clear any pending popup timeouts
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
      
      if (chartRef.current && chartRef.current.destroy) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);
  

  
  
  
  // Track previous period mode y data length para detectar cambios
  const previousPeriodMode = useRef(periodMode);
  const previousDataLength = useRef(0);
  
  // Helper para detectar si es un cambio de agregación mayor a menor o reset
  const isAggregationDowngrade = (prevMode, currentMode) => {
    const hierarchy = { 'day': 1, 'week': 2, 'month': 3, 'year': 4 };
    // Detectar downgrade (mes→semana, año→mes, etc.) o reset a día desde cualquier agregación
    return hierarchy[prevMode] > hierarchy[currentMode] || 
           (currentMode === 'day' && prevMode !== 'day');
  };

  // Función para recalcular timeline excluyendo operaciones específicas
  const recalculateTimelineWithoutOperations = (timelineData, excludedOperations) => {
    if (!timelineData || timelineData.length === 0) return [];
    
    // Simular recálculo del portfolio día a día excluyendo operaciones
    let holdings_acumulados = {}; // Asset -> cantidad actual
    let cost_basis_fifo = {}; // Asset -> cola FIFO para cost basis
    
    const recalculatedTimeline = timelineData.map(dayData => {
      const operations = dayData.operations || [];
      
      // Procesar operaciones del día (excluyendo las filtradas)
      operations.forEach(operation => {
        if (!excludedOperations.has(operation.operation_key) && !disabledOps.has(makeOpId(operation, dayData.date))) {
          const asset = operation.asset;
          const tipo = operation.type;
          const cantidad = operation.cantidad;
          const cost = operation.cost;
          const fee = operation.fee;
          
          // Inicializar estructuras si no existen
          if (!holdings_acumulados[asset]) {
            holdings_acumulados[asset] = 0;
          }
          if (!cost_basis_fifo[asset]) {
            cost_basis_fifo[asset] = [];
          }
          
          // Procesar según tipo de operación
          if (tipo === 'buy') {
            holdings_acumulados[asset] += cantidad;
            // Agregar compra a cola FIFO
            const cost_con_fee = cost + fee;
            cost_basis_fifo[asset].push({
              volumen: cantidad,
              cost: cost_con_fee
            });
          } else if (tipo === 'sell') {
            holdings_acumulados[asset] -= cantidad;
            // Procesar venta usando FIFO
            let volumen_restante = cantidad;
            
            while (volumen_restante > 0 && cost_basis_fifo[asset].length > 0) {
              const lote = cost_basis_fifo[asset][0];
              
              if (lote.volumen <= volumen_restante) {
                // Consumir lote completo
                volumen_restante -= lote.volumen;
                cost_basis_fifo[asset].shift();
              } else {
                // Consumir parcialmente
                const proporcion = volumen_restante / lote.volumen;
                lote.volumen -= volumen_restante;
                lote.cost -= lote.cost * proporcion;
                volumen_restante = 0;
              }
            }
          }
        }
      });
      
      // Calcular valores para este día con holdings actualizados
      let valor_total = 0;
      let cost_basis_total = 0;
      const assets_con_valor_recalc = {};
      
      // Usar precios originales del timeline
      Object.keys(holdings_acumulados).forEach(asset => {
        const cantidad = holdings_acumulados[asset];
        if (cantidad > 0) {
          // Buscar precio del asset en assets_con_valor original
          const precio = dayData.assets_con_valor?.[asset]?.precio || 0;
          const valor_asset = cantidad * precio;
          valor_total += valor_asset;
          
          assets_con_valor_recalc[asset] = {
            cantidad: cantidad,
            precio: precio,
            valor: valor_asset
          };
          
          // Calcular cost basis del asset
          const cost_basis_asset = cost_basis_fifo[asset]?.reduce((sum, lote) => sum + lote.cost, 0) || 0;
          cost_basis_total += cost_basis_asset;
        }
      });
      
      return {
        ...dayData,
        value: valor_total,
        cost: cost_basis_total,
        assets_con_valor: assets_con_valor_recalc
      };
    });
    
    return recalculatedTimeline;
  };

  // Función para obtener datos filtrados por el rango de fechas y assets ocultos
  const getFilteredTimelineData = () => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) return [];
    
    let filteredData = portfolioData.timeline;
    
    // Apply date range filter
    if (startDate && endDate) {
      // Use string comparison to avoid timezone issues
      const startDateStr = startDate;
      const endDateStr = endDate;
      
      filteredData = filteredData.filter(entry => {
        // Extract date part from entry.date (YYYY-MM-DD)
        const entryDateStr = entry.date.split('T')[0];
        return entryDateStr >= startDateStr && entryDateStr <= endDateStr;
      });
    }
    
    // Apply hidden assets filter
    if (hiddenAssets && hiddenAssets.size > 0) {
      // Use asset mapping from backend, fallback to hardcoded for safety
      const assetMapping = portfolioData?.asset_mapping || {
        'BTC': 'XXBT',  // Fallback mapping
        'ETH': 'XETH'
      };
      
      // Convert hidden assets to timeline names
      const hiddenTimelineAssets = new Set();
      hiddenAssets.forEach(asset => {
        const timelineAsset = assetMapping[asset] || asset;
        hiddenTimelineAssets.add(timelineAsset);
      });
      
      filteredData = filteredData.map(entry => {
        const filteredEntry = { ...entry };
        
        // Filter assets_con_valor and recalculate totals
        if (entry.assets_con_valor) {
          filteredEntry.assets_con_valor = {};
          let newTotalValue = 0;
          
          Object.keys(entry.assets_con_valor).forEach(assetName => {
            if (!hiddenTimelineAssets.has(assetName)) {
              filteredEntry.assets_con_valor[assetName] = entry.assets_con_valor[assetName];
              newTotalValue += entry.assets_con_valor[assetName].valor || 0;
            }
          });
          
          // Recalculate proportional cost based on filtered assets
          const originalValue = entry.value || 0;
          const originalCost = entry.cost || 0;
          const costRatio = originalValue > 0 ? originalCost / originalValue : 0;
          const newTotalCost = newTotalValue * costRatio;
          
          // Update value and cost with filtered totals
          filteredEntry.value = newTotalValue;
          filteredEntry.cost = newTotalCost;
        }
        
        // Filter holdings to match assets_con_valor
        if (entry.holdings) {
          filteredEntry.holdings = {};
          Object.keys(entry.holdings).forEach(assetName => {
            if (!hiddenTimelineAssets.has(assetName)) {
              filteredEntry.holdings[assetName] = entry.holdings[assetName];
            }
          });
        }
        
        return filteredEntry;
      });
    }
    
    // Apply operation filter - recalculate timeline excluding filtered operations
    if ((excludedOperations && excludedOperations.size > 0) || (disabledOps && disabledOps.size > 0)) {
      filteredData = recalculateTimelineWithoutOperations(filteredData, excludedOperations);
    }

    return filteredData;
  };

  // Función para verificar si hay suficientes datos para cada tipo de agregación
  const canAggregate = (period) => {
    const timelineData = getFilteredTimelineData();
    if (timelineData.length === 0) return false;
    
    const uniquePeriods = new Set();
    
    timelineData.forEach(entry => {
      const date = new Date(entry.date);
      let periodKey;
      
      switch (period) {
        case 'week':
          const weekStart = new Date(date);
          const day = weekStart.getDay();
          const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
          weekStart.setDate(diff);
          periodKey = weekStart.toISOString().split('T')[0];
          break;
          
        case 'month':
          periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
          
        case 'year':
          periodKey = date.getFullYear().toString();
          break;
          
        default:
          return true; // Para 'day' siempre está disponible
      }
      
      uniquePeriods.add(periodKey);
    });
    
    // Necesitamos al menos 2 períodos únicos para que tenga sentido agregar
    return uniquePeriods.size >= 2;
  };

  // Función para obtener rangos de fechas rápidos
  const getQuickDateRange = (range) => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) return null;
    
    const today = new Date();
    const firstAvailableDate = new Date(portfolioData.timeline[0].date);
    let calculatedStartDate;
    
    switch (range) {
      case 'all':
        return null; // No aplicar filtro
      case '1y':
        calculatedStartDate = new Date(today);
        calculatedStartDate.setFullYear(today.getFullYear() - 1);
        break;
      case '6m':
        calculatedStartDate = new Date(today);
        calculatedStartDate.setMonth(today.getMonth() - 6);
        break;
      case '3m':
        calculatedStartDate = new Date(today);
        calculatedStartDate.setMonth(today.getMonth() - 3);
        break;
      case '1m':
        calculatedStartDate = new Date(today);
        calculatedStartDate.setMonth(today.getMonth() - 1);
        break;
      case '1w':
        calculatedStartDate = new Date(today);
        calculatedStartDate.setDate(today.getDate() - 7);
        break;
      default:
        return null;
    }
    
    // Si la fecha calculada es anterior a la primera fecha disponible, usar la primera fecha
    const finalStartDate = calculatedStartDate < firstAvailableDate ? firstAvailableDate : calculatedStartDate;
    
    return {
      startDate: formatDate(finalStartDate),
      endDate: formatDate(today)
    };
  };

  // Estado para el filtro rápido activo
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');

  // Función para detectar combinaciones problemáticas entre agregación y filtro
  const getProblematicCombination = (currentPeriodMode, filterRange) => {
    // 'day' siempre es compatible con todos los filtros
    if (currentPeriodMode === 'day') return false;
    
    // 'all' siempre es compatible con todas las agregaciones
    if (filterRange === 'all') return false;
    
    const aggregationHierarchy = { 'week': 2, 'month': 3, 'year': 4 };
    const filterHierarchy = { '1w': 2, '1m': 3, '3m': 3.5, '6m': 3.8, '1y': 4 };
    
    const aggLevel = aggregationHierarchy[currentPeriodMode];
    const filterLevel = filterHierarchy[filterRange];
    
    // Si la agregación es igual o mayor al filtro, es problemático
    return aggLevel >= filterLevel;
  };

  // Función para resolver combinaciones problemáticas
  const resolveProblematicCombination = (filterRange) => {
    if (filterRange === 'all') return 'day'; // Para 'all', usar siempre 'day'
    
    // Mapear filtros a agregaciones seguras
    const safeAggregations = {
      '1w': 'day',     // 1 semana -> días
      '1m': 'day',     // 1 mes -> días  
      '3m': 'week',    // 3 meses -> semanas
      '6m': 'week',    // 6 meses -> semanas
      '1y': 'month'    // 1 año -> meses
    };
    
    return safeAggregations[filterRange] || 'day';
  };

  // Función para verificar si un filtro es compatible con la agregación actual
  const isFilterCompatible = (filterRange, currentPeriodMode) => {
    // 'all' siempre es compatible
    if (filterRange === 'all') return true;
    
    // 'day' siempre es compatible con todos los filtros
    if (currentPeriodMode === 'day') return true;
    
    // Verificar incompatibilidad conceptual
    if (getProblematicCombination(currentPeriodMode, filterRange)) {
      return false;
    }
    
    // Simular aplicación del filtro y verificar si la agregación seguiría siendo válida
    const simulatedDateRange = getQuickDateRange(filterRange);
    if (!simulatedDateRange) return true;
    
    // Simular el filtro temporalmente
    const filteredData = portfolioData?.timeline?.filter(entry => {
      // Use string comparison to avoid timezone issues
      const entryDateStr = entry.date.split('T')[0];
      const startDateStr = simulatedDateRange.startDate;
      const endDateStr = simulatedDateRange.endDate;
      return entryDateStr >= startDateStr && entryDateStr <= endDateStr;
    }) || [];
    
    // Verificar si habría suficientes períodos únicos para la agregación actual
    const uniquePeriods = new Set();
    filteredData.forEach(entry => {
      const date = new Date(entry.date);
      let periodKey;
      
      switch (currentPeriodMode) {
        case 'week':
          const weekStart = new Date(date);
          const day = weekStart.getDay();
          const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
          weekStart.setDate(diff);
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        case 'year':
          periodKey = date.getFullYear().toString();
          break;
        default:
          return true; // day siempre es válido
      }
      uniquePeriods.add(periodKey);
    });
    
    return uniquePeriods.size >= 2;
  };

  // Función para verificar si una agregación es compatible con el filtro actual
  const isAggregationCompatible = (aggregationMode, currentFilter) => {
    if (!currentFilter || currentFilter === 'all') {
      // Sin filtro específico, verificar con datos actuales
      return canAggregate(aggregationMode);
    }
    
    // Verificar incompatibilidad conceptual
    if (getProblematicCombination(aggregationMode, currentFilter)) {
      return false;
    }
    
    // Verificar si hay suficientes datos con el filtro actual
    return canAggregate(aggregationMode);
  };

  // Función para manejar clicks en filtros rápidos
  const handleQuickFilter = (range) => {
    if (range === 'all') {
      const { defaultStartDate, defaultEndDate } = getDefaultDates();
      if (!defaultStartDate || !defaultEndDate) return;

      handleCompleteReset();

      // Also persist to Dashboard's timeline dates so navigation back restores 'all'
      setExternalStartDate(defaultStartDate);
      setExternalEndDate(defaultEndDate);
      return;
    }

    if (isFilterCompatible(range, periodMode)) {
      // Solo aplicar otros filtros si son compatibles
      const dateRange = getQuickDateRange(range);
      if (dateRange) {
        setIsChartStabilizing(true);
        isQuickFilterChange.current = true;
        userClosedPopup.current = false;

        setStartDate(dateRange.startDate);
        setEndDate(dateRange.endDate);
        setActiveQuickFilter(range);

        setTimeout(() => {
          setIsChartStabilizing(false);
        }, 700);
      }
    }
  };

  // Ref para trackear si el cambio de fecha es por filtro rápido
  const isQuickFilterChange = useRef(false);

  // Detectar cambios manuales en las fechas para actualizar activeQuickFilter
  useEffect(() => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) return;

    // Si el cambio es por filtro rápido, no procesarlo aquí
    if (isQuickFilterChange.current) {
      isQuickFilterChange.current = false;
      return;
    }

    // Fechas aún no inicializadas (carga inicial/remount): no modificar el estado del filtro
    if (!startDate || !endDate) return;

    const { defaultStartDate, defaultEndDate } = getDefaultDates();

    // Si es el rango completo por defecto
    if (startDate === defaultStartDate && endDate === defaultEndDate) {
      setActiveQuickFilter('all');
      return;
    }
    
    // Verificar si coincide con algún filtro rápido
    const quickFilters = ['1w', '1m', '3m', '6m', '1y'];
    let foundMatch = false;
    
    for (const filter of quickFilters) {
      const range = getQuickDateRange(filter);
      if (range && startDate === range.startDate && endDate === range.endDate) {
        setActiveQuickFilter(filter);
        foundMatch = true;
        break;
      }
    }
    
    // Si no coincide con ningún filtro rápido, desactivar cualquier filtro activo
    if (!foundMatch) {
      setActiveQuickFilter(null);
    }
  }, [startDate, endDate, portfolioData]);
  
  // Sync with filter's selected preset
  useEffect(() => {
    if (filterSelectedPreset) {
      // Map filter preset to timeline quick filter format
      const timelineFilterMap = {
        '1W': '1w',
        '1M': '1m',
        '3M': '3m', 
        '6M': '6m',
        '1Y': '1y',
        'All': 'all'
      };
      
      const mappedFilter = timelineFilterMap[filterSelectedPreset];
      if (mappedFilter && mappedFilter !== activeQuickFilter) {
        setActiveQuickFilter(mappedFilter);
      }
    }
  }, [filterSelectedPreset]);
  
  // Helper para detectar cambios que requieren animaciones especiales
  const getAnimationType = (timelineData) => {
    const currentDataLength = timelineData?.labels?.length || 0;
    const prevLength = previousDataLength.current;
    const hasAggregationChange = previousPeriodMode.current !== periodMode;
    const isSignificantIncrease = currentDataLength > prevLength * 2; // Más del doble de puntos
    const isSignificantDecrease = currentDataLength < prevLength * 0.5; // Menos de la mitad
    
    // Casos específicos:
    if (hasAggregationChange && isSignificantIncrease) {
      return 'fade'; // Transición suave sin movimiento de puntos
    }
    if (hasAggregationChange && isSignificantDecrease) {
      return 'none'; // Sin animación para evitar líneas extrañas
    }
    if (hasAggregationChange) {
      return 'smooth'; // Transición suave normal
    }
    
    return 'normal'; // Animación normal
  };
  
  // Sincronizar fechas externas con estados locales
  useEffect(() => {
    // Skip the very first run: local startDate is already initialized from
    // buttonStartDate (persisted timeline zoom) and must not be overridden
    // by externalStartDate (KPI date) on mount.
    if (!syncStartInitializedRef.current) {
      syncStartInitializedRef.current = true;
      return;
    }

    // Don't sync if we're currently applying from timeline
    if (isApplyingFromTimeline) {
      return;
    }

    // Check if we should ignore this sync due to point click
    if (typeof window !== 'undefined' && window.ignoreTimelineSync) {
      window.ignoreTimelineSync = false;
      return;
    }

    // Don't update timeline button dates when tab dates are equal (point click scenario)
    if (externalStartDate === externalEndDate) {
      // Tab dates are equal, this is a point click - don't update timeline dates
      return;
    }

    if (externalStartDate && externalStartDate !== startDate) {
      // If tooltip is frozen, unfreeze it when dates change externally
      if (chartRef.current?.frozenTooltip?.isFrozen) {
        chartRef.current.hoveredDataIndex = undefined;
        chartRef.current.frozenTooltip.isFrozen = false;
        chartRef.current.frozenTooltip.frozenIndex = -1;
        chartRef.current.data?.datasets?.forEach(dataset => {
          if (dataset.originalData && !dataset.skipDuringMouseMove) {
            dataset.data = [...dataset.originalData];
          }
        });
        setIsTooltipFrozen(false);
      }
      // Always sync when external dates change — this covers both "Apply to All" from
      // the timeline and date changes initiated from the Filters tab (presets / manual).
      // Use the RAW setter so the wrapper doesn't call setExternalStartDate again (loop).
      setStartDateRaw(externalStartDate);
      hasUserInteractedWithTimeline.current = false;
      userClosedPopup.current = false;
      lastProcessedDates.current = { startDate: '', endDate: '' };

      // Reset zoom flag when returning to the full default range
      const { defaultStartDate, defaultEndDate } = getDefaultDates();
      if (externalStartDate === defaultStartDate && externalEndDate === defaultEndDate) {
        setIsZoomed(false);
      }
    }
  }, [externalStartDate, externalEndDate, popupBlocked, isApplyingFromTimeline]);
  
  useEffect(() => {
    // Skip the very first run: same reasoning as the startDate effect above.
    if (!syncEndInitializedRef.current) {
      syncEndInitializedRef.current = true;
      return;
    }

    // Check if we should ignore this sync due to point click
    if (typeof window !== 'undefined' && window.ignoreTimelineSync) {
      window.ignoreTimelineSync = false;
      return;
    }

    // Don't update timeline button dates when tab dates are equal (point click scenario) - UNLESS applying
    if (externalStartDate === externalEndDate && !isApplyingFromTimeline) {
      // Tab dates are equal, this is a point click - don't update timeline dates
      return;
    }

    if (externalEndDate && externalEndDate !== endDate) {
      // If tooltip is frozen, unfreeze it when dates change externally
      if (chartRef.current?.frozenTooltip?.isFrozen) {
        chartRef.current.hoveredDataIndex = undefined;
        chartRef.current.frozenTooltip.isFrozen = false;
        chartRef.current.frozenTooltip.frozenIndex = -1;
        chartRef.current.data?.datasets?.forEach(dataset => {
          if (dataset.originalData && !dataset.skipDuringMouseMove) {
            dataset.data = [...dataset.originalData];
          }
        });
        setIsTooltipFrozen(false);
      }
      // Always sync — use RAW setter (same reasoning as startDate above).
      setEndDateRaw(externalEndDate);
      hasUserInteractedWithTimeline.current = false;
      userClosedPopup.current = false;
      lastProcessedDates.current = { startDate: '', endDate: '' };

      const { defaultStartDate, defaultEndDate } = getDefaultDates();
      if (externalStartDate === defaultStartDate && externalEndDate === defaultEndDate) {
        setIsZoomed(false);
      }
    }
  }, [externalEndDate, externalStartDate, popupBlocked, isApplyingFromTimeline]);
  
  // NOTE: Timeline changes should NOT automatically sync to external dates
  // Only sync when user explicitly clicks "Apply to All"
  
  // Funciones para manejar el popup
  const showApplyToAllPopup = () => setShowApplyPopup(true);
  const hideApplyPopup = () => {
    userClosedPopup.current = true; // Track that user manually closed popup
    // Keep lastProcessedDates to prevent re-showing same popup
    setShowApplyPopup(false);
  };
  
  // Apply timeline dates to filter - SIMPLE
  const handleApplyTimelineToFilter = () => {
    if (onTimelineApplyToAll && startDate && endDate) {
      // Reset our tracking to prevent duplicate detections
      lastProcessedDates.current = { startDate: '', endDate: '' };
      
      // Close popup and block new ones for 5 seconds
      setShowApplyPopup(false);
      setPopupBlocked(true);
      setTimeout(() => setPopupBlocked(false), 5000);
      
      // Apply the dates
      if (typeof window !== 'undefined') {
        window.timelineDates = {
          from: startDate,
          to: endDate,
          startDate: startDate,
          endDate: endDate,
          quickFilter: activeQuickFilter
        };
      }
      
      onTimelineApplyToAll({
        type: 'dateRange',
        dateRange: {
          from: startDate,
          to: endDate
        }
      });
    }
  };
  
  // Funciones simples para manejar el popup
  const forceHidePopup = () => {
    setShowApplyPopup(false);
  };
  const showCleanPopup = () => setShowApplyPopup(true);

  // Auto-show popup only for specific timeline interactions (zoom, date changes)
  // NOT for direct clicks - those are handled separately

  // Simple popup logic - only show ONCE when dates actually change
  const lastProcessedDates = useRef({ startDate: '', endDate: '' });
  
  useEffect(() => {
    // Skip if popup blocked
    if (popupBlocked) return;
    
    // Skip if we're applying from timeline
    if (isApplyingFromTimeline) return;
    
    // Compare timeline button dates with external filter dates
    const datesAreDifferent = startDate !== externalStartDate || endDate !== externalEndDate;
    
    // Only proceed if dates actually changed from what we last processed OR if we need to hide popup
    const currentDates = `${startDate}-${endDate}`;
    const lastDates = `${lastProcessedDates.current.startDate}-${lastProcessedDates.current.endDate}`;
    const datesChanged = currentDates !== lastDates;
    const shouldHidePopup = !datesAreDifferent && showApplyPopup;
    
    if (!datesChanged && !shouldHidePopup) return;
    
    if (datesAreDifferent) {
      // Update our tracking
      lastProcessedDates.current = { startDate, endDate };
      
      // Show popup when dates are different
      showTimelinePopup && showTimelinePopup({ 
        startDate, 
        endDate, 
        quickFilter: activeQuickFilter 
      });
    } else {
      // Update our tracking when hiding
      lastProcessedDates.current = { startDate, endDate };
      
      // Hide popup when dates match
      setShowApplyPopup(false);
    }
  }, [startDate, endDate, externalStartDate, externalEndDate, popupBlocked, showApplyPopup, isApplyingFromTimeline]);

  // Definir animación base una sola vez
  React.useEffect(() => {
    if (!document.getElementById('popup-slide-animation')) {
      const style = document.createElement('style');
      style.id = 'popup-slide-animation';
      style.textContent = '@keyframes slideInFromBottom { 0% { opacity: 0; transform: translateY(20px) scale(0.97); } 100% { opacity: 1; transform: translateY(0) scale(1); } } @keyframes calendarSlideIn { 0% { opacity: 0; transform: translateY(-10px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } } .calendar-title-transition { transition: all 0.2s ease-out; } .calendar-content-transition { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }';
      document.head.appendChild(style);
    }
  }, []);
  
  // Inicializar fechas
  useEffect(() => {
    if (portfolioData?.timeline && portfolioData.timeline.length > 0) {
      const firstDate = new Date(portfolioData.timeline[0].date);
      const lastDate = new Date(portfolioData.timeline[portfolioData.timeline.length - 1].date); // Usar última fecha de los datos
      
      // Solo establecer si no están ya establecidas (para no sobrescribir selecciones del usuario)
      if (!startDate) setStartDate(formatDate(firstDate));
      if (!endDate) setEndDate(formatDate(lastDate));
    }
    
    // Ocultar iconos de calendario de manera agresiva
    const hideCalendarIcon = () => {
      if (!document.querySelector('#date-picker-style')) {
        const style = document.createElement('style');
        style.id = 'date-picker-style';
        style.textContent = `
          input[type="date"]::-webkit-calendar-picker-indicator {
            display: none !important;
            -webkit-appearance: none !important;
            background: transparent !important;
            color: transparent !important;
            width: 0 !important;
            height: 0 !important;
            position: absolute !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          input[type="date"]::-webkit-inner-spin-button,
          input[type="date"]::-webkit-outer-spin-button {
            -webkit-appearance: none !important;
            margin: 0 !important;
            display: none !important;
          }
          input[type="date"]::-moz-calendar-picker-indicator {
            display: none !important;
          }
        `;
        document.head.appendChild(style);
      }
    };
    
    hideCalendarIcon();
    // Ejecutar múltiples veces para asegurar que se aplique
    setTimeout(hideCalendarIcon, 100);
    setTimeout(hideCalendarIcon, 500);
  }, [portfolioData]);

  // Cerrar calendarios al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-calendar]')) {
        setShowStartCalendar(false);
        setShowEndCalendar(false);
      }
    };

    if (showStartCalendar || showEndCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStartCalendar, showEndCalendar]);

  // Exit point click mode when clicking outside the chart
  useEffect(() => {
    const handleClickOutsideChart = (event) => {
      // Only handle if we're in point click mode
      if (!isInPointClickMode) return;
      
      // Check if click is outside the chart container
      const chartContainer = document.querySelector('.timeline-chart-container');
      if (chartContainer && !chartContainer.contains(event.target)) {
        
        // Simple cleanup: just exit point click mode and unfreeze tooltip
        setIsInPointClickMode(false);
        if (chartRef.current?.frozenTooltip?.isFrozen) {
          unfreezeTooltip();
        }
      }
    };

    if (isInPointClickMode) {
      document.addEventListener('mousedown', handleClickOutsideChart);
      return () => document.removeEventListener('mousedown', handleClickOutsideChart);
    }
  }, [isInPointClickMode]);

  // Function to handle complete reset (extracted from reset button logic)
  const handleCompleteReset = () => {
    const { defaultStartDate, defaultEndDate } = getDefaultDates();
    
    // Resetear zoom si existe
    if (chartRef.current) {
      chartRef.current.resetZoom();
      chartRef.current._isDragZoom = false; // Limpiar flag de drag zoom
    }
    
    // Descongelar tooltip si está congelado
    unfreezeTooltip();
    
    // Resetear fechas y estado ANTES de salir del point click mode
    // Esto es importante para que handleTimelineStartDateChange detecte el reset correctamente
    isQuickFilterChange.current = true;
    userClosedPopup.current = false; // Reset popup close flag when complete reset happens
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    
    // Período de estabilización después del reset (DESPUÉS de unfreezeTooltip)
    setIsChartStabilizing(true);
    if (chartRef.current) {
      chartRef.current._stabilizing = true;
    }
    setTimeout(() => {
      setIsChartStabilizing(false);
      if (chartRef.current) {
        chartRef.current._stabilizing = false;
      }
    }, 700);
    setIsZoomed(false);
    setActiveQuickFilter('all');
    
    // Limpiar completamente el estado de click para volver al modo normal
    if (typeof window !== 'undefined') {
      window.timelineDates = null;
      window.justShowedPopupFromPointClickExit = false;
    }
    isPopupFromDirectClick.current = false;
    
    // Marcar que el usuario ha interactuado
    hasUserInteractedWithTimeline.current = true;
  };
  
  // Inicializar tooltip estático (para modos que no son P&L View)
  useEffect(() => {
    if (viewMode === 'balance') return; // Skip para P&L View
    
    
    const tooltipArea = document.querySelector('#tooltip-area');
    if (tooltipArea && portfolioData?.timeline) {
      const dataToUse = processedTimelineData.length > 0 ? processedTimelineData : null;
      tooltipArea.innerHTML = renderTooltipContent(null, dataToUse);
    }
  }, [portfolioData, showTotalInvested, viewMode, startDate, endDate, periodMode, processedTimelineData]);

  // Gestionar transición suave del gráfico cuando cambian las fechas
  useEffect(() => {
    if (portfolioData?.timeline) {
      setIsChartLoading(true);
      
      
      // Delay optimizado para permitir transición visual suave
      const timer = setTimeout(() => {
        setIsChartLoading(false);
        
        // Período de estabilización después de cambio de datos
        // Solo estabilizar si el usuario ha interactuado activamente (no en carga inicial/remount)
        if (chartRef.current && hasUserInteractedWithTimeline.current) {
          chartRef.current._stabilizing = true;
          setTimeout(() => {
            if (chartRef.current && chartRef.current.canvas && chartRef.current.canvas.ownerDocument && !chartRef.current._isDestroying) {
              chartRef.current._stabilizing = false;
            }
          }, 700);
        }
      }, 500); // 500ms para transición más suave
      
      return () => clearTimeout(timer);
    }
  }, [startDate, endDate, portfolioData, periodMode]);


  // Procesar datos para tooltip cuando cambien las dependencias
  useEffect(() => {
    
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) {
      setProcessedTimelineData([]);
      return;
    }

    // Use the existing filtered data function that handles both dates and assets
    let timelineData = getFilteredTimelineData();

    // Función para agrupar datos según el período seleccionado
    const groupDataByPeriod = (data, period) => {
      if (period === 'day' || data.length === 0) return data;
      
      const grouped = {};
      
      data.forEach(entry => {
        const date = new Date(entry.date);
        let groupKey;
        
        switch (period) {
          case 'week':
            const weekStart = new Date(date);
            const day = weekStart.getDay();
            const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
            weekStart.setDate(diff);
            groupKey = weekStart.toISOString().split('T')[0];
            break;
            
          case 'month':
            groupKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            break;
            
          case 'year':
            groupKey = date.getFullYear().toString();
            break;
            
          default:
            groupKey = entry.date;
        }
        
        if (!grouped[groupKey]) {
          grouped[groupKey] = {
            date: period === 'week' ? groupKey : 
                  period === 'month' ? `${groupKey}-01` :
                  period === 'year' ? `${groupKey}-01-01` : entry.date,
            entries: []
          };
        }
        
        grouped[groupKey].entries.push(entry);
      });
      
      return Object.values(grouped).map(group => {
        const sortedEntries = group.entries.sort((a, b) => new Date(a.date) - new Date(b.date));
        const lastEntry = sortedEntries[sortedEntries.length - 1];
        
        return {
          date: group.date,
          value: lastEntry.value,
          cost: lastEntry.cost,
          total_gain: lastEntry.total_gain,
          net_profit: lastEntry.net_profit,
          sales: lastEntry.sales  // Mantener información de ventas
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    
    // Aplicar agrupación
    const processedData = groupDataByPeriod(timelineData, periodMode);
    setProcessedTimelineData(processedData);
  }, [portfolioData, startDate, endDate, periodMode, hiddenAssets, excludedOperations, disabledOps]);

  // Crear datos interpolados para P&L View tooltip
  const interpolatedDataForTooltip = useMemo(() => {
    if (viewMode !== 'balance' || !processedTimelineData.length) {
      return null;
    }

    const timelineData = processedTimelineData;
    const balanceValues = timelineData.map(entry => {
      return entry.total_gain !== undefined ? entry.total_gain :
             entry.net_profit !== undefined ? entry.net_profit :
             (entry.value || 0) - (entry.cost || 0);
    });
    const baseLabels = timelineData.map(entry => entry.date);

    // Función para interpolar puntos en cruces de 0
    const interpolateZeroCrossings = (values, inputLabels) => {
      const newValues = [];
      const newLabels = [];
      
      for (let i = 0; i < values.length; i++) {
        newValues.push(values[i]);
        newLabels.push(inputLabels[i]);
        
        if (i < values.length - 1) {
          const current = values[i];
          const next = values[i + 1];
          
          if ((current > 0 && next < 0) || (current < 0 && next > 0)) {
            const ratio = Math.abs(current) / (Math.abs(current) + Math.abs(next));
            const currentDate = new Date(inputLabels[i]);
            const nextDate = new Date(inputLabels[i + 1]);
            const interpolatedDate = new Date(currentDate.getTime() + (nextDate.getTime() - currentDate.getTime()) * ratio);
            
            newValues.push(0);
            newLabels.push(interpolatedDate.toISOString().split('T')[0]);
          }
        }
      }
      
      return { values: newValues, labels: newLabels };
    };

    const interpolated = interpolateZeroCrossings(balanceValues, baseLabels);
    
    // Crear datos procesados que coincidan con la interpolación
    return interpolated.labels.map((date, index) => {
      const originalIndex = baseLabels.findIndex(label => label === date);
      if (originalIndex !== -1) {
        return timelineData[originalIndex];
      } else {
        return {
          date: date,
          value: 0,
          cost: 0,
          net_profit: interpolated.values[index],
          total_gain: interpolated.values[index]
        };
      }
    });
  }, [viewMode, processedTimelineData]);

  // Inicializar tooltip estático para P&L View (usando datos interpolados)
  useEffect(() => {
    if (viewMode !== 'balance') return; // Solo para P&L View
    
    
    const tooltipArea = document.querySelector('#tooltip-area');
    if (tooltipArea && portfolioData?.timeline) {
      const dataToUse = interpolatedDataForTooltip || 
                        (processedTimelineData.length > 0 ? processedTimelineData : null);
      tooltipArea.innerHTML = renderTooltipContent(null, dataToUse);
    }
  }, [portfolioData, showTotalInvested, viewMode, startDate, endDate, periodMode, processedTimelineData, interpolatedDataForTooltip]);

  // Manejar transición cuando cambia showTotalInvested
  const handleInvestedToggle = () => {
    setShowTotalInvested(!showTotalInvested);
  };

  // Functions to handle calendars
  const handleStartDateChange = (event) => {
    const formattedDate = event.target.value; // Already in YYYY-MM-DD format
    setStartDate(formattedDate);
    setShowStartCalendar(false);
    // El popup se controlará automáticamente por el useEffect que compara fechas
  };

  const handleEndDateChange = (event) => {
    const formattedDate = event.target.value; // Already in YYYY-MM-DD format
    setEndDate(formattedDate);
    setShowEndCalendar(false);
    // El popup se controlará automáticamente por el useEffect que compara fechas
  };

  // No need to convert dates anymore - both use YYYY-MM-DD format
  const formatDateForInput = (dateStr) => {
    return dateStr || '';
  };

  // Generar calendario personalizado
  const generateCalendar = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    // Completar con días vacíos hasta completar 6 filas (42 espacios total)
    while (days.length < 42) {
      days.push(null);
    }
    
    return days;
  };

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarType, setCalendarType] = useState('start'); // 'start' o 'end'


  // Función para obtener fechas por defecto
  const getDefaultDates = () => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) {
      return { defaultStartDate: '', defaultEndDate: '' };
    }
    
    const firstDate = new Date(portfolioData.timeline[0].date);
    const lastDate = new Date(portfolioData.timeline[portfolioData.timeline.length - 1].date);
    
    return {
      defaultStartDate: formatDate(firstDate),
      defaultEndDate: formatDate(lastDate)
    };
  };

  // Función para obtener rango de fechas válidas
  const getValidDateRange = () => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) {
      return { minDate: null, maxDate: null };
    }
    
    const firstDate = new Date(portfolioData.timeline[0].date);
    const lastDate = new Date(portfolioData.timeline[portfolioData.timeline.length - 1].date);
    
    return {
      minDate: firstDate,
      maxDate: lastDate
    };
  };

  // Función para validar si una fecha es válida
  const isValidDate = (year, month, day) => {
    const { minDate, maxDate } = getValidDateRange();
    if (!minDate || !maxDate) return false;
    
    const dateToCheck = new Date(year, month, day);
    return dateToCheck >= minDate && dateToCheck <= maxDate;
  };

  // Función para validar lógica de rango (inicio no posterior a fin)
  const isValidRange = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return true; // Si alguna está vacía, no validar
    
    // Both dates are now in YYYY-MM-DD format
    const startDateObj = new Date(startDateStr);
    const endDateObj = new Date(endDateStr);
    
    return startDateObj <= endDateObj;
  };

  // Handle day selection in custom calendar
  const handleDayClick = (day) => {
    if (!day) return;
    
    // Validar que la fecha esté en el rango de datos disponibles
    if (!isValidDate(calendarDate.getFullYear(), calendarDate.getMonth(), day)) {
      return; // No permitir seleccionar fechas fuera del rango
    }
    
    // Create date string directly to avoid timezone issues
    const year = calendarDate.getFullYear();
    const month = (calendarDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayStr}`;
    
    if (calendarType === 'start') {
      // Validar que fecha inicio no sea posterior a fecha fin
      if (endDate && !isValidRange(formattedDate, endDate)) {
        return; // No permitir fecha inicio posterior a fecha fin
      }
      
      setStartDate(formattedDate);
      
      // Transición suave al calendario de fin
      setTimeout(() => {
        setCalendarType('end');
        // Establecer calendario en la fecha fin al abrir
        const dateToUse = endDate;
        if (dateToUse) {
          setCalendarDate(new Date(dateToUse));
        }
        setShowStartCalendar(true);
      }, 150);
      
      // El popup se controlará automáticamente por el useEffect que compara fechas
      
    } else {
      // Validar que fecha fin no sea anterior a fecha inicio
      if (startDate && !isValidRange(startDate, formattedDate)) {
        return; // No permitir fecha fin anterior a fecha inicio
      }
      
      setEndDate(formattedDate);
      setShowStartCalendar(false); // Cerrar el calendario después de seleccionar fecha fin
      // El popup se controlará automáticamente por el useEffect que compara fechas
      
      // NO abrir automáticamente el calendario de inicio - ROMPER EL BUCLE
      // El usuario tendrá que hacer clic manual si quiere cambiar la fecha inicio
    }
  };

  // Cambiar mes del calendario
  const changeMonth = (direction) => {
    const { minDate, maxDate } = getValidDateRange();
    if (!minDate || !maxDate) return;
    
    setCalendarDate(prev => {
      const newDate = new Date(prev);
      const targetMonth = prev.getMonth() + direction;
      newDate.setMonth(targetMonth);
      
      // Verificar que el nuevo mes no esté fuera del rango de datos
      const firstDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      const lastDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
      
      // Si todo el mes está fuera del rango, no cambiar
      if (lastDayOfMonth < minDate || firstDayOfMonth > maxDate) {
        return prev; // No cambiar si está completamente fuera del rango
      }
      
      return newDate;
    });
  };

  // Cambiar año del calendario
  const changeYear = (direction) => {
    const { minDate, maxDate } = getValidDateRange();
    if (!minDate || !maxDate) return;
    
    setCalendarDate(prev => {
      const newDate = new Date(prev);
      const targetYear = prev.getFullYear() + direction;
      newDate.setFullYear(targetYear);
      
      // Verificar que el nuevo año no esté fuera del rango de datos
      const firstDayOfYear = new Date(newDate.getFullYear(), 0, 1);
      const lastDayOfYear = new Date(newDate.getFullYear(), 11, 31);
      
      // Si todo el año está fuera del rango, no cambiar
      if (lastDayOfYear < minDate || firstDayOfYear > maxDate) {
        return prev; // No cambiar si está completamente fuera del rango
      }
      
      return newDate;
    });
  };

  // Función para determinar el estado de un día en el calendario
  const getDayState = (day, currentYear, currentMonth) => {
    if (!day) return 'empty';
    
    const currentDate = new Date(currentYear, currentMonth, day);
    
    const currentStartDate = startDate;
    const currentEndDate = endDate;
    
    // Convertir fechas de los botones a objetos Date
    let startDateObj = null;
    let endDateObj = null;
    
    if (currentStartDate) {
      // Handle YYYY-MM-DD format
      const [sYear, sMonth, sDay] = currentStartDate.split('-');
      startDateObj = new Date(sYear, sMonth - 1, sDay);
    }
    
    if (currentEndDate) {
      // Handle YYYY-MM-DD format
      const [eYear, eMonth, eDay] = currentEndDate.split('-');
      endDateObj = new Date(eYear, eMonth - 1, eDay);
    }
    
    // PRIMERO verificar si es una fecha seleccionada (prioridad máxima)
    if (startDateObj && currentDate.getTime() === startDateObj.getTime()) {
      return 'selected-start';
    }
    
    if (endDateObj && currentDate.getTime() === endDateObj.getTime()) {
      return 'selected-end';
    }
    
    // Verificar si la fecha está fuera del rango de datos disponibles
    if (!isValidDate(currentYear, currentMonth, day)) {
      return 'disabled';
    }
    
    // Verificar validaciones de rango según el contexto (solo si no es fecha seleccionada)
    const formattedCurrentDate = formatDate(currentDate); // Use YYYY-MM-DD format
    
    if (calendarType === 'start' && currentEndDate) {
      // En calendario de inicio, deshabilitar fechas posteriores a fecha fin
      if (!isValidRange(formattedCurrentDate, currentEndDate)) {
        return 'disabled';
      }
    } else if (calendarType === 'end' && currentStartDate) {
      // En calendario de fin, deshabilitar fechas anteriores a fecha inicio
      if (!isValidRange(currentStartDate, formattedCurrentDate)) {
        return 'disabled';
      }
    }
    
    // Verificar si está en el rango
    if (startDateObj && endDateObj) {
      const minDate = startDateObj < endDateObj ? startDateObj : endDateObj;
      const maxDate = startDateObj > endDateObj ? startDateObj : endDateObj;
      
      if (currentDate > minDate && currentDate < maxDate) {
        return 'in-range';
      }
    }
    
    return 'normal';
  };
  
  // Función para verificar si la navegación de mes está deshabilitada
  const isMonthNavigationDisabled = (direction) => {
    const { minDate, maxDate } = getValidDateRange();
    if (!minDate || !maxDate) return true;
    
    const testDate = new Date(calendarDate);
    testDate.setMonth(testDate.getMonth() + direction);
    
    const firstDayOfMonth = new Date(testDate.getFullYear(), testDate.getMonth(), 1);
    const lastDayOfMonth = new Date(testDate.getFullYear(), testDate.getMonth() + 1, 0);
    
    return lastDayOfMonth < minDate || firstDayOfMonth > maxDate;
  };
  
  // Función para verificar si la navegación de año está deshabilitada
  const isYearNavigationDisabled = (direction) => {
    const { minDate, maxDate } = getValidDateRange();
    if (!minDate || !maxDate) return true;
    
    const testDate = new Date(calendarDate);
    testDate.setFullYear(testDate.getFullYear() + direction);
    
    const firstDayOfYear = new Date(testDate.getFullYear(), 0, 1);
    const lastDayOfYear = new Date(testDate.getFullYear(), 11, 31);
    
    return lastDayOfYear < minDate || firstDayOfYear > maxDate;
  };
  
  // Función para calcular tamaño de fuente responsive para tooltip
  const getTooltipFontSize = (contentLength, baseSize = 22) => {
    // Obtener ancho del gráfico como referencia principal
    const containerWidth = window.innerWidth;
    
    // Calcular ancho disponible considerando el sidebar
    let chartWidth;
    if (sidebarOpen) {
      // Cuando el sidebar está abierto, restar 350px del ancho total
      chartWidth = containerWidth - 350;
    } else {
      // Sin sidebar, usar todo el ancho disponible
      chartWidth = containerWidth;
    }
    
    // Margen mínimo y máximo del tooltip
    const margin = 60; // Margen lateral del gráfico
    const maxTooltipWidth = chartWidth - (margin * 2); // El tooltip puede usar todo el ancho del gráfico
    
    if (contentLength === 0) return `${baseSize}px`;
    
    // Agregar buffer más grande para hacer mucho menos sensible - rangos de 15 caracteres
    const bufferedContentLength = Math.ceil(contentLength / 15) * 15;
    
    // Calcular tamaño de fuente menos restrictivo para permitir fuentes más grandes
    const safeTooltipWidth = maxTooltipWidth * 0.8; // Usar 80% del ancho disponible
    const pixelsPerChar = safeTooltipWidth / bufferedContentLength;
    const fontSize = Math.min(pixelsPerChar * 0.7, baseSize); // Menos restrictivo para permitir fuentes más grandes
    
    // Tamaño mínimo legible moderado
    const minFontSize = window.innerWidth < 768 ? 18 : 20; // Mínimos moderados
    
    const finalSize = Math.max(fontSize, minFontSize);
    
    return `${finalSize}px`;
  };

  // Función para renderizar tooltip con datos específicos
  const renderTooltipContent = (dataIndex = null, processedData = null) => {
    // Usar datos procesados si están disponibles, sino usar datos originales
    const dataSource = processedData || portfolioData?.timeline;
    if (!dataSource || dataSource.length === 0) return '';
    
    // Usar el último punto si no se especifica índice
    const index = dataIndex !== null ? dataIndex : dataSource.length - 1;
    const entry = dataSource[index];
    
    if (!entry) return '';
    
    const date = new Date(entry.date);
    const marketValue = entry.value || 0;
    const investedValue = entry.cost || 0;
    
    // Tooltip always shows absolute cumulative gain from the very first trade up to this point.
    // startDate only zooms the visible chart range — it does not affect gain calculations.
    // (Future option: period delta mode — gain since start of visible window)
    let profit;
    let profitPct;

    profit = entry.total_gain !== undefined ? entry.total_gain :
             entry.net_profit !== undefined ? entry.net_profit :
             (marketValue - investedValue);
    profitPct = investedValue > 0 ? ((profit / investedValue) * 100) : 0;

    // En Full View (sin cost basis), usar el cálculo directo para consistencia visual
    if (viewMode !== 'balance' && !showTotalInvested) {
      profit = marketValue - investedValue;
      profitPct = investedValue > 0 ? ((profit / investedValue) * 100) : 0;
    }
    
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };
    
    // Construir el contenido en una sola línea con estilos específicos y buen espaciado
    const profitColor = profit >= 0 ? '#00FF99' : '#ef4444';
    const profitTriangle = profit >= 0 ? '▲' : '▼'; // Mismo triángulo que los KPIs
    
    const formatCurrencyEuroAfter = (value) => {
      const absValue = Math.abs(value);
      return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(absValue) + '€';
    };
    
    // Formatear fecha según el período seleccionado
    let dateFormat;
    switch (periodMode) {
      case 'week':
        dateFormat = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }) + ' (Week)';
        break;
      case 'month':
        dateFormat = date.toLocaleDateString('en-US', { 
          month: 'long',
          year: 'numeric'
        });
        break;
      case 'year':
        dateFormat = date.getFullYear().toString();
        break;
      default: // 'day'
        dateFormat = date.toLocaleDateString('en-US', { 
          weekday: 'short',
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
    }
    
    let content;
    
    if (viewMode === 'balance') {
      // En P&L View, mostrar fecha + P&L acumulados y porcentaje
      const profitLabel = (entry.total_gain !== undefined || entry.net_profit !== undefined) ? 'TOTAL P&L' : 'TOTAL P&L';
      
      // Calcular longitud del contenido para responsive
      const mainContentLength = dateFormat.length + profitLabel.length + formatCurrencyEuroAfter(profit).length + 6; // +6 por el % y símbolos
      const mainFontSize = getTooltipFontSize(mainContentLength, 28); // Tamaño moderado
      const labelFontSize = getTooltipFontSize(mainContentLength, 28); // Tamaño moderado
      const valueFontSize = getTooltipFontSize(mainContentLength, 28); // Tamaño moderado
      
      content = `<span style="color: #ffffff; font-size: ${mainFontSize}; font-weight: 400; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">${dateFormat}</span>&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: ${labelFontSize}; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">${profitLabel}</span>&nbsp;<span style="color: ${profitColor}; font-size: ${valueFontSize}; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">${profit >= 0 ? '+' : '-'}${formatCurrencyEuroAfter(profit)}</span>&nbsp;<span style="color: ${profitColor}; font-size: ${valueFontSize}; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">${profitTriangle}&nbsp;${Math.abs(profitPct).toFixed(1)}%</span>`;
      
      // Desglose realized / unrealized — siempre acumulado desde el inicio
      let periodRealizedGain, periodUnrealizedGain;
      {
        periodRealizedGain  = entry.realized_gain_period || 0;
        periodUnrealizedGain = entry.unrealized_gain || 0;
      }
      
      // Colores para cada tipo de ganancia
      const realizedColor = periodRealizedGain >= 0 ? '#00FF99' : '#ef4444';
      const unrealizedColor = periodUnrealizedGain >= 0 ? '#00FF99' : '#ef4444';
      
      // Usar los mismos tamaños que el contenido principal para uniformidad
      const breakdownLabelFontSize = labelFontSize; // Mismo tamaño que las etiquetas principales
      const breakdownValueFontSize = valueFontSize; // Mismo tamaño que los valores principales
      
      // Añadir desglose al tooltip
      content += `&nbsp;&nbsp;<span style="color: rgba(140, 140, 140, 0.7); font-size: ${breakdownLabelFontSize}; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">UNREALIZED P&L</span>&nbsp;<span style="color: ${unrealizedColor}; font-size: ${breakdownValueFontSize}; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">${periodUnrealizedGain >= 0 ? '+' : '-'}${formatCurrencyEuroAfter(periodUnrealizedGain)}</span>`;

      content += `&nbsp;&nbsp;<span style="color: rgba(140, 140, 140, 0.7); font-size: ${breakdownLabelFontSize}; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">REALIZED P&L</span>&nbsp;<span style="color: ${realizedColor}; font-size: ${breakdownValueFontSize}; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">${periodRealizedGain >= 0 ? '+' : '-'}${formatCurrencyEuroAfter(periodRealizedGain)}</span>`;
    } else {
      // Full View - mostrar portfolio value primero
      const portfolioLabel = 'PORTFOLIO VALUE';
      
      // Calcular longitud del contenido para responsive (sin desglose = MÁS ESPACIO)
      const fullContentLength = dateFormat.length + portfolioLabel.length + formatCurrencyEuroAfter(marketValue).length + 4; // +4 por espacios
      
      // Tamaño responsive uniforme para todo el tooltip en Full View
      const fullUniformFontSize = getTooltipFontSize(fullContentLength, 28); // Tamaño moderado
      const fullMainFontSize = fullUniformFontSize; // Mismo tamaño
      const fullLabelFontSize = fullUniformFontSize; // Mismo tamaño  
      const fullValueFontSize = fullUniformFontSize; // Mismo tamaño
      
      content = `<span style="color: #ffffff; font-size: ${fullMainFontSize}; font-weight: 400; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">${dateFormat}</span>&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: ${fullLabelFontSize}; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">${portfolioLabel}</span>&nbsp;<span style="font-size: ${fullValueFontSize}; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">${formatCurrencyEuroAfter(marketValue)}</span>`;
    }
    
    if (showTotalInvested && viewMode === 'both') {
      // Calcular tamaños responsive para el contenido simplificado (sin UNR/REA)
      const costBasisLabel = 'COST BASIS';
      const totalLabel = 'TOTAL P&L';
      const bothContentLength = (costBasisLabel.length + formatCurrencyEuroAfter(investedValue).length + 
                                totalLabel.length + formatCurrencyEuroAfter(profit).length + 8); // +8 por espacios
      
      const bothLabelFontSize = getTooltipFontSize(bothContentLength, 28); // Tamaño moderado
      const bothValueFontSize = getTooltipFontSize(bothContentLength, 28); // Tamaño moderado
      
      // Layout simplificado: PORTFOLIO VALUE ya mostrado + COST BASIS + TOTAL P&L
      content += `&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: ${bothLabelFontSize}; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">${costBasisLabel}</span>&nbsp;<span style="font-size: ${bothValueFontSize}; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">${formatCurrencyEuroAfter(investedValue)}</span>`;
      
      // Total P&L con porcentaje
      content += `&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: ${bothLabelFontSize}; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">${totalLabel}</span>&nbsp;<span style="color: ${profitColor}; font-size: ${bothValueFontSize}; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">${profit >= 0 ? '+' : '-'}${formatCurrencyEuroAfter(profit)}</span>&nbsp;<span style="color: ${profitColor}; font-size: ${bothValueFontSize}; font-family: 'JetBrains Mono', monospace; vertical-align: baseline;">${profitTriangle}&nbsp;${Math.abs(profitPct).toFixed(1)}%</span>`;
    }
    // Las ventas ahora se muestran en tooltip separado al hacer hover sobre los puntos
    
    return `
      <div class="custom-tooltip" style="
        position: relative;
        pointer-events: none;
        background: none !important;
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        color: #ffffff;
        padding: 0;
        margin: 0;
        min-width: max-content;
        width: auto;
        white-space: nowrap;
        display: flex;
        align-items: baseline;
        font-family: 'JetBrains Mono', monospace;
        font-size: 22px;
        font-weight: 700;
        opacity: 1;
        transform: scale(1);
        letter-spacing: 0.3px;
        line-height: 1;
        flex-shrink: 0;
        overflow: visible;
      ">
        ${content}
      </div>
    `;
  };

  // Función helper para obtener los datos correctos según el modo
  const getDataForTooltip = () => {
    if (viewMode === 'balance' && interpolatedDataForTooltip) {
      return interpolatedDataForTooltip;
    }
    return processedTimelineData.length > 0 ? processedTimelineData : null;
  };

  // Configurar eventos de mouse personalizados para el hover
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !chart.canvas) return;

    const canvas = chart.canvas;
    
    const handleMouseMove = (event) => {
      // Verificar que el chart y el canvas existen
      if (!chart || chart._isDestroying || !chart.canvas || !chart.canvas.ownerDocument) {
        return;
      }
      
      // No hacer nada si se está haciendo drag, drag zoom, o en período de estabilización
      if (isDragging || chart._isDragZoom || chart._stabilizing || isChartStabilizing) {
        return;
      }
      
      // Si está congelado, no procesar hover
      if (chart.frozenTooltip && chart.frozenTooltip.isFrozen) {
        return;
      }
      
      
      // Throttle dinámico basado en complejidad
      if (chart._mouseThrottle) return;
      chart._mouseThrottle = true;
      
      // Throttling más agresivo si hay menos datasets activos
      const activeDatasets = chart.data.datasets.filter(d => !d.hidden && !d.skipDuringMouseMove).length;
      const throttleTime = activeDatasets <= 2 ? 0 : 2; // Sin throttle para pocos datasets
      
      setTimeout(() => {
        chart._mouseThrottle = false;
      }, throttleTime);

      let rect, x, y;
      try {
        rect = canvas.getBoundingClientRect();
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
      } catch (e) {
        console.warn('Error getting canvas bounds:', e);
        return;
      }
      
      // Verificar que estemos dentro del área del gráfico
      if (!chart.chartArea) return;
      
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      // Detectar zoom del navegador y corregir coordenadas
      const browserZoom = window.devicePixelRatio || 1;
      const visualZoom = window.visualViewport?.scale || 1;
      const zoomFactor = browserZoom / visualZoom;
      
      const canvasX = (x * scaleX) / zoomFactor;
      const canvasY = (y * scaleY) / zoomFactor;
      
      // Añadir tolerancia extra cuando hay zoom para evitar detección errónea de bordes
      const tolerance = isZoomed ? 20 : 0;
      if (canvasX < (chart.chartArea.left - tolerance) || canvasX > (chart.chartArea.right + tolerance) || 
          canvasY < (chart.chartArea.top - tolerance) || canvasY > (chart.chartArea.bottom + tolerance)) {
        // Fuera del área del gráfico
        const tooltipArea = document.querySelector('#tooltip-area');
        if (tooltipArea) {
          tooltipArea.innerHTML = renderTooltipContent(null, getDataForTooltip());
        }
        if (chart.hoveredDataIndex !== undefined) {
          chart.hoveredDataIndex = undefined;
          
          // Restaurar todas las líneas principales
          const portfolioDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value' || d.label === 'Total P&L');
          const futureDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value Future' || d.label === 'Total P&L Future');
          const glowDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value Glow' || d.label === 'Total P&L Glow');
          const costBasisDataset = chart.data.datasets.find(d => d.label === 'Cost Basis');
          const costBasisFutureDataset = chart.data.datasets.find(d => d.label === 'Cost Basis Future');
          
          if (portfolioDataset && portfolioDataset.originalData) {
            portfolioDataset.data = [...portfolioDataset.originalData];
          }
          
          if (futureDataset && futureDataset.originalData) {
            // Ocultar completamente el dataset futuro cuando no hay hover
            futureDataset.data = futureDataset.originalData.map(() => null);
          }
          
          if (glowDataset && glowDataset.originalData) {
            glowDataset.data = [...glowDataset.originalData];
          }
          
          if (costBasisDataset && costBasisDataset.originalData) {
            costBasisDataset.data = [...costBasisDataset.originalData];
          }
          
          if (costBasisFutureDataset && costBasisFutureDataset.originalData) {
            // Ocultar completamente el dataset futuro cuando no hay hover
            costBasisFutureDataset.data = costBasisFutureDataset.originalData.map(() => null);
          }
          
          if (chart && chart.canvas && chart.canvas.ownerDocument) {
            try {
              if (chart && !chart._isDestroying && chart.canvas && chart.canvas.ownerDocument) {
          try {
            chart.update('none');
          } catch (e) {
            console.warn('Error updating chart:', e);
          }
        }
            } catch (e) {
              console.warn('Error updating chart:', e);
            }
          }
        }
        return;
      }
      
      // Buscar el dataset principal (Portfolio Value o Balance P&L)
      const portfolioDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value' || d.label === 'Total P&L');
      if (!portfolioDataset) return;
      
      const meta = chart.getDatasetMeta(chart.data.datasets.indexOf(portfolioDataset));
      
      // Encontrar el punto más cercano en X
      let closestIndex = -1;
      let minDistance = Infinity;
      
      meta.data.forEach((point, index) => {
        if (point && point.x) {  // Verificar que el punto existe
          // En P&L View, solo considerar puntos reales usando el mapeo de índices
          if (viewMode === 'balance' && portfolioDataset.indexMap) {
            const value = portfolioDataset.data[index];
            // Filtrar puntos interpolados (0 y ±0.001)
            if (value === 0 || Math.abs(value) === 0.001) {
              return; // Saltar puntos interpolados
            }
          }
          
          const distance = Math.abs(point.x - canvasX);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        }
      });
      
      if (closestIndex >= 0) {
        const tooltipArea = document.querySelector('#tooltip-area');
        if (tooltipArea) {
          // En P&L View, sincronizar por fecha en lugar de índice para evitar offsets
          let tooltipIndex = closestIndex;
          if (viewMode === 'balance' && chart.data.labels) {
            // Obtener la fecha del punto hover actual (interpolado)
            const hoverDate = chart.data.labels[closestIndex];
            
            // Buscar la misma fecha en los datos del tooltip (originales)
            const tooltipData = getDataForTooltip();
            if (tooltipData && hoverDate) {
              // Buscar índice por fecha exacta
              const matchingIndex = tooltipData.findIndex(entry => {
                const entryDate = new Date(entry.date).toISOString().split('T')[0];
                const hoverDateString = new Date(hoverDate).toISOString().split('T')[0];
                return entryDate === hoverDateString;
              });
              
              if (matchingIndex >= 0) {
                tooltipIndex = matchingIndex;
              } else {
                // Si no hay coincidencia exacta, usar mapeo como fallback
                tooltipIndex = portfolioDataset.indexMap ? (portfolioDataset.indexMap[closestIndex] || closestIndex) : closestIndex;
              }
            }
          }
          tooltipArea.innerHTML = renderTooltipContent(tooltipIndex, getDataForTooltip());
        }
        
        // Solo actualizar si el índice cambió
        if (chart.hoveredDataIndex !== closestIndex) {
          chart.hoveredDataIndex = closestIndex;
          
          // Actualizar solo la línea principal, mantener áreas completas
          const portfolioDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value' || d.label === 'Total P&L');
          const costBasisDataset = chart.data.datasets.find(d => d.label === 'Cost Basis');
          
          // Aplicar efecto de línea progresiva con dos datasets
          if (portfolioDataset && portfolioDataset.originalData) {
            // Dataset principal: mostrar solo hasta el punto actual
            const newData = [...portfolioDataset.originalData];
            for (let i = closestIndex + 1; i < newData.length; i++) {
              newData[i] = null;
            }
            portfolioDataset.data = newData;
          }
          
          // Dataset futuro: mostrar desde el punto actual en adelante (solo si no estamos en transición)
          const futureDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value Future' || d.label === 'Total P&L Future');
          if (futureDataset && futureDataset.originalData && !chart._isInTransition) {
            const futureData = [...futureDataset.originalData];
            for (let i = 0; i < closestIndex; i++) { // Cambiar <= por < para incluir el punto actual
              futureData[i] = null;
            }
            futureDataset.data = futureData;
            futureDataset.borderColor = 'rgba(80, 80, 80, 0.4)'; // Mostrar la línea gris
          } else if (futureDataset) {
            // Durante transiciones, ocultar completamente
            futureDataset.data = futureDataset.originalData.map(() => null);
            futureDataset.borderColor = 'transparent';
          }
          
          // Dataset glow: sincronizar con la línea principal
          const glowDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value Glow' || d.label === 'Total P&L Glow');
          if (glowDataset && glowDataset.originalData) {
            const glowData = [...glowDataset.originalData];
            for (let i = closestIndex + 1; i < glowData.length; i++) {
              glowData[i] = null;
            }
            glowDataset.data = glowData;
          }
          
          if (costBasisDataset && costBasisDataset.originalData && !costBasisDataset.hidden) {
            const newData = [...costBasisDataset.originalData];
            for (let i = closestIndex + 1; i < newData.length; i++) {
              newData[i] = null;
            }
            costBasisDataset.data = newData;
          }
          
          // Cost Basis Future: mostrar desde el punto actual en adelante (solo si no estamos en transición)
          const costBasisFutureDataset = chart.data.datasets.find(d => d.label === 'Cost Basis Future');
          if (costBasisFutureDataset && costBasisFutureDataset.originalData && !chart._isInTransition) {
            const futureData = [...costBasisFutureDataset.originalData];
            for (let i = 0; i < closestIndex; i++) { // Cambiar <= por < para incluir el punto actual
              futureData[i] = null;
            }
            costBasisFutureDataset.data = futureData;
            costBasisFutureDataset.borderColor = 'rgba(80, 80, 80, 0.4)'; // Mostrar la línea gris
          } else if (costBasisFutureDataset) {
            // Durante transiciones, ocultar completamente
            costBasisFutureDataset.data = costBasisFutureDataset.originalData.map(() => null);
            costBasisFutureDataset.borderColor = 'transparent';
          }
          
          if (chart && chart.canvas && chart.canvas.ownerDocument) {
            try {
              if (chart && !chart._isDestroying && chart.canvas && chart.canvas.ownerDocument) {
          try {
            chart.update('none');
          } catch (e) {
            console.warn('Error updating chart:', e);
          }
        }
            } catch (e) {
              console.warn('Error updating chart:', e);
            }
          }
          
          // Las áreas se mantienen completas siempre
        }
      }
    };

    const handleMouseLeave = () => {
      // Verificar que el chart existe
      if (!chart || !chart.canvas || !chart.canvas.ownerDocument) {
        return;
      }
      
      // Si está congelado, no resetear el tooltip al salir
      if (chart.frozenTooltip && chart.frozenTooltip.isFrozen) {
        return;
      }
      
      const tooltipArea = document.querySelector('#tooltip-area');
      if (tooltipArea) {
        tooltipArea.innerHTML = renderTooltipContent(null, getDataForTooltip());
      }
      
      // Usar timeout para asegurar que la animación funcione tanto para movimiento gradual como rápido
      setTimeout(() => {
        // Si está congelado, no restaurar las líneas
        if (chart.frozenTooltip && chart.frozenTooltip.isFrozen) {
          return;
        }
        
        if (chart.hoveredDataIndex !== undefined) {
          chart.hoveredDataIndex = undefined;
          
          // Restaurar todas las líneas principales
          const portfolioDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value' || d.label === 'Total P&L');
          const futureDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value Future' || d.label === 'Total P&L Future');
          const glowDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value Glow' || d.label === 'Total P&L Glow');
          const costBasisDataset = chart.data.datasets.find(d => d.label === 'Cost Basis');
          const costBasisFutureDataset = chart.data.datasets.find(d => d.label === 'Cost Basis Future');
          
          if (portfolioDataset && portfolioDataset.originalData) {
            portfolioDataset.data = [...portfolioDataset.originalData];
          }
          
          if (futureDataset && futureDataset.originalData) {
            // Ocultar completamente el dataset futuro cuando no hay hover
            futureDataset.data = futureDataset.originalData.map(() => null);
          }
          
          if (glowDataset && glowDataset.originalData) {
            glowDataset.data = [...glowDataset.originalData];
          }
          
          if (costBasisDataset && costBasisDataset.originalData) {
            costBasisDataset.data = [...costBasisDataset.originalData];
          }
          
          if (costBasisFutureDataset && costBasisFutureDataset.originalData) {
            // Ocultar completamente el dataset futuro cuando no hay hover
            costBasisFutureDataset.data = costBasisFutureDataset.originalData.map(() => null);
          }
          
          if (chart && chart.canvas && chart.canvas.ownerDocument) {
            try {
              if (chart && !chart._isDestroying && chart.canvas && chart.canvas.ownerDocument) {
          try {
            chart.update('none');
          } catch (e) {
            console.warn('Error updating chart:', e);
          }
        }
            } catch (e) {
              console.warn('Error updating chart:', e);
            }
          }
        }
      }, 10); // Pequeño delay para asegurar que el estado se procese correctamente
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      if (canvas && canvas.ownerDocument && !chartRef.current?._isDestroying) {
        try {
          canvas.removeEventListener('mousemove', handleMouseMove);
          canvas.removeEventListener('mouseleave', handleMouseLeave);
        } catch (e) {
          console.warn('Error removing event listeners:', e);
        }
      }
    };
  }, [portfolioData, processedTimelineData, viewMode, showTotalInvested, periodMode, isDragging, isChartStabilizing]);
  
  // Función helper para descongelar el tooltip
  const unfreezeTooltip = () => {
    const chart = chartRef.current;
    if (!chart || !chart.frozenTooltip || !chart.frozenTooltip.isFrozen) return;
    
    
    // Limpiar estados
    chart.hoveredDataIndex = undefined;
    chart.frozenTooltip.isFrozen = false;
    chart.frozenTooltip.frozenIndex = -1;
    
    // Restaurar líneas
    chart.data.datasets.forEach((dataset, idx) => {
      if (dataset.originalData && !dataset.skipDuringMouseMove) {
        dataset.data = [...dataset.originalData];
      }
    });
    
    setIsTooltipFrozen(false);
    forceHidePopup();
    chart.update('none');
  };

  // Assign unfreezeTooltip function to ref for external access
  useEffect(() => {
    if (timelineUnfreezeTooltipRef) {
      timelineUnfreezeTooltipRef.current = unfreezeTooltip;
    }
  }, [timelineUnfreezeTooltipRef]);

  // Manejar estado de dragging para tooltip
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !chart.canvas) return;

    const canvas = chart.canvas;
    if (!canvas) return;

    const handleMouseDown = (event) => {
      // IMPORTANTE: No marcar como dragging si el tooltip está congelado O si estamos en proceso de congelar
      // Esto evita que el hoverPlugin deje de dibujar durante mousedown
      const isFrozenOrFreezing = (chart.frozenTooltip && chart.frozenTooltip.isFrozen) || isTooltipFrozen;
      
      if (!isFrozenOrFreezing) {
        // Guardar posición inicial para detectar drag
        chart._mouseDownPos = {
          x: event.clientX,
          y: event.clientY,
          time: Date.now()
        };
        
        setIsDragging(true);
        chart.isDragging = true;
        
        // No resetear el tooltip - mantenerlo tal como está
        // Solo restaurar las líneas sin delay para evitar efectos visuales bruscos
        if (chart.hoveredDataIndex !== undefined) {
          chart.hoveredDataIndex = undefined;
        
        // NO restaurar las líneas durante mousedown para evitar parpadeo en congelado
        // Las líneas se restaurarán en mouseup o hover normal
        }
      }
    };

    const handleMouseUp = () => {
      // Solo resetear dragging si no estaba congelado (para evitar inconsistencias)
      const isFrozenOrFreezing = (chart.frozenTooltip && chart.frozenTooltip.isFrozen) || isTooltipFrozen;
      
      if (!isFrozenOrFreezing) {
        setIsDragging(false);
        chart.isDragging = false;
        if (chart && !chart._isDestroying && chart.canvas && chart.canvas.ownerDocument) {
          try {
            chart.update('none');
          } catch (e) {
            console.warn('Error updating chart:', e);
          }
        }
      }
      
      // Limpiar posición de mousedown
      chart._mouseDownPos = null;
      chart._dragDetected = false;
    };

    const handleDocumentMouseMove = (event) => {
      // Solo procesar si estamos en mousedown y no hemos detectado drag aún
      if (!chart._mouseDownPos || chart._dragDetected) return;
      
      const deltaX = Math.abs(event.clientX - chart._mouseDownPos.x);
      const deltaY = Math.abs(event.clientY - chart._mouseDownPos.y);
      const deltaTime = Date.now() - chart._mouseDownPos.time;
      
      // Detectar drag: movimiento mínimo de 5px en cualquier dirección
      if ((deltaX > 5 || deltaY > 5) && deltaTime > 50) {
        chart._dragDetected = true;
        
        // Restaurar todas las líneas completas inmediatamente
        chart.data.datasets.forEach(dataset => {
          if (dataset.originalData && !dataset.skipDuringMouseMove) {
            dataset.data = [...dataset.originalData];
          }
        });
        
        if (chart && !chart._isDestroying && chart.canvas && chart.canvas.ownerDocument) {
          try {
            chart.update('none');
          } catch (e) {
            console.warn('Error updating chart:', e);
          }
        }
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleDocumentMouseMove);

    return () => {
      if (canvas && canvas.ownerDocument && !chartRef.current?._isDestroying) {
        try {
          canvas.removeEventListener('mousedown', handleMouseDown);
          canvas.removeEventListener('mouseup', handleMouseUp);
        } catch (e) {
          console.warn('Error removing canvas event listeners:', e);
        }
      }
      try {
        document.removeEventListener('mousemove', handleDocumentMouseMove);
      } catch (e) {
        console.warn('Error removing document event listener:', e);
      }
    };
  }, [chartRef.current]);
  
  // Check if using default date range
  const { defaultStartDate, defaultEndDate } = getDefaultDates();
  const isUsingDefaultRange = (startDate === defaultStartDate && endDate === defaultEndDate);
  
  
  // Create Timeline Chart Data with conditional coloring
  const createTimelineData = () => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) {
      return null;
    }

    // Use the existing filtered data function that handles both dates and assets  
    let timelineData = getFilteredTimelineData();

    // Usar datos ya procesados del useEffect
    timelineData = processedTimelineData.length > 0 ? processedTimelineData : timelineData;
    
    // Labels base
    const baseLabels = timelineData.map(entry => entry.date);
    
    // Para P&L View, usar labels interpoladas (se definirá más abajo)
    let labels = baseLabels;

    const investedValues = timelineData.map(entry => entry.cost || 0);
    const portfolioValues = timelineData.map(entry => entry.value || 0);
    
    // Usar total_gain del backend (realized + unrealized gains)
    const balanceValues = timelineData.map(entry => {
      // Prioridad: total_gain del backend, fallback a net_profit, sino unrealized
      return entry.total_gain !== undefined ? entry.total_gain :
             entry.net_profit !== undefined ? entry.net_profit :
             (entry.value || 0) - (entry.cost || 0);
    });

    // Create point colors based on profit/loss at each point
    const pointColors = portfolioValues.map((value, index) => {
      const invested = investedValues[index] || 0;
      return value >= invested ? '#00FF99' : '#ef4444'; // Green if profit, red if loss
    });

    // PRE-CALCULAR COLORES PARA EVITAR PROBLEMAS
    
    // Para P&L: usar el valor final para determinar color (más intuitivo)
    const finalBalanceValue = balanceValues[balanceValues.length - 1] || 0;
    const balanceIsPositive = finalBalanceValue > 0;
    const balanceAreaColor = balanceIsPositive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
    
        
    // Para Full View: calcular si market gana
    let marketWinsCount = 0;
    if (showTotalInvested) {
      for (let i = 0; i < portfolioValues.length; i++) {
        if (portfolioValues[i] > investedValues[i]) {
          marketWinsCount++;
        }
      }
    } else {
      marketWinsCount = portfolioValues.length; // Sin invested = siempre gana
    }
    
    const marketIsWinning = marketWinsCount > portfolioValues.length / 2;
    const marketAreaColor = marketIsWinning ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
    
    
    // Construir datasets según el modo de vista
    let datasets = [];
    
    // Si estamos en modo balance, crear área con colores dinámicos
    if (viewMode === 'balance') {
      // Función mejorada para interpolar múltiples puntos en cruces de 0
      const interpolateZeroCrossings = (values, inputLabels) => {
        const newValues = [];
        const newLabels = [];
        const indexMap = []; // Mapeo de índice interpolado -> índice original
        
        for (let i = 0; i < values.length; i++) {
          newValues.push(values[i]);
          newLabels.push(inputLabels[i]);
          indexMap.push(i); // Mapear este índice interpolado al índice original i
          
          // Si hay un siguiente punto y cruzan el 0
          if (i < values.length - 1) {
            const current = values[i];
            const next = values[i + 1];
            
            if ((current > 0 && next < 0) || (current < 0 && next > 0)) {
              // Interpolar el punto exacto donde cruza 0
              const ratio = Math.abs(current) / (Math.abs(current) + Math.abs(next));
              const currentDate = new Date(inputLabels[i]);
              const nextDate = new Date(inputLabels[i + 1]);
              const interpolatedDate = new Date(currentDate.getTime() + (nextDate.getTime() - currentDate.getTime()) * ratio);
              
              // Agregar múltiples puntos en 0 para asegurar separación clara
              const zeroCrossingDate = interpolatedDate.toISOString().split('T')[0];
              
              // Punto antes del cruce
              newValues.push(current > 0 ? 0.001 : -0.001);
              newLabels.push(zeroCrossingDate);
              indexMap.push(i); // Mapear al índice original actual
              
              // Punto exacto del cruce  
              newValues.push(0);
              newLabels.push(zeroCrossingDate);
              indexMap.push(i); // Mapear al índice original actual
              
              // Punto después del cruce
              newValues.push(next > 0 ? 0.001 : -0.001);
              newLabels.push(zeroCrossingDate);
              indexMap.push(i + 1); // Mapear al siguiente índice original
            }
          }
        }
        
        return { values: newValues, labels: newLabels, indexMap: indexMap };
      };
      
      // Aplicar interpolación mejorada - agregar más puntos de corte
      const interpolated = interpolateZeroCrossings(balanceValues, baseLabels);
      const interpolatedBalanceValues = interpolated.values;
      const indexMap = interpolated.indexMap;
      
      // Actualizar las labels para este modo
      labels = interpolated.labels;
      
      // Lógica simple: verde para ≥0, rojo para <0  
      const positiveData = interpolatedBalanceValues.map((val) => {
        return val >= 0 ? val : null;
      });
      
      const negativeData = interpolatedBalanceValues.map((val) => {
        return val < 0 ? val : null;
      });
      
      // Área positiva (verde) - solo muestra datos cuando son >= 0
      datasets.push({
        label: 'Positive P&L Area',
        data: positiveData,
        borderColor: 'transparent',
        borderWidth: 0,
        backgroundColor: showFill ? function(context) {
          const chart = context.chart;
          const { ctx, chartArea, scales } = chart;
          if (!chartArea) return 'transparent';
          // Gradiente desde la línea hacia y=0 (no todo el chartArea)
          const yZero = scales.y ? scales.y.getPixelForValue(0) : chartArea.bottom;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, yZero);
          gradient.addColorStop(0, 'rgba(34, 197, 94, 0.28)');
          gradient.addColorStop(0.7, 'rgba(34, 197, 94, 0.12)');
          gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
          return gradient;
        } : 'transparent',
        fill: 'origin',
        tension: 0.15,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        skipDuringMouseMove: true,
        originalData: [...positiveData],
        spanGaps: false, // No conectar líneas cuando hay gaps (null values)
        animation: {
          backgroundColor: false
        }
      });

      // Área negativa (roja) - solo muestra datos cuando son <= 0
      datasets.push({
        label: 'Negative P&L Area',
        data: negativeData,
        borderColor: 'transparent',
        borderWidth: 0,
        backgroundColor: showFill ? function(context) {
          const chart = context.chart;
          const { ctx, chartArea, scales } = chart;
          if (!chartArea) return 'transparent';
          // Gradiente desde y=0 hacia abajo
          const yZero = scales.y ? scales.y.getPixelForValue(0) : chartArea.top;
          const gradient = ctx.createLinearGradient(0, yZero, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
          gradient.addColorStop(0.3, 'rgba(239, 68, 68, 0.12)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0.28)');
          return gradient;
        } : 'transparent',
        fill: 'origin',
        tension: 0.15,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        skipDuringMouseMove: true,
        originalData: [...negativeData],
        spanGaps: false, // No conectar líneas cuando hay gaps (null values)
        animation: {
          backgroundColor: false
        }
      });

      // Área de degradado bajo la línea principal P&L
      datasets.push({
        label: 'P&L Gradient Area',
        data: interpolatedBalanceValues,
        borderColor: 'transparent',
        borderWidth: 0,
        backgroundColor: 'transparent',
        fill: 'start', // Rellenar desde el top del chart
        tension: 0.15,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        skipDuringMouseMove: true,
        originalData: [...interpolatedBalanceValues],
        spanGaps: false,
        order: 5, // Renderizar detrás de la línea principal
        animation: {
          backgroundColor: false
        }
      });
      
      // Línea principal (con efecto progresivo) - estilo copiado de Full View
      datasets.push({
        label: 'Total P&L',
        data: interpolatedBalanceValues,
        originalData: [...interpolatedBalanceValues], // Para el efecto de línea progresiva
        indexMap: indexMap, // Mapeo de índices interpolados a originales
        pointRadius: function(context) {
          // Ocultar puntos imaginarios pero permitir hover en puntos reales
          const value = interpolatedBalanceValues[context.dataIndex];
          const isZeroCrossing = value === 0;
          return 0; // Ocultar todos los puntos visualmente
        },
        pointHitRadius: function(context) {
          // Permitir selección solo en puntos reales (no en cruces de 0)
          const value = interpolatedBalanceValues[context.dataIndex];
          const isZeroCrossing = value === 0;
          return isZeroCrossing ? 0 : 5; // Sin hit radius para puntos imaginarios
        },
        borderColor: '#10d56e', // Verde brillante para la línea principal
        backgroundColor: 'transparent', // Sin área de relleno
        fill: false, // No fill para este dataset
        tension: 0.15, // Igual que Full View pero un poco menos suave
        pointHoverRadius: 0, // Desactivar hover de puntos en P&L View
        pointBackgroundColor: function(context) {
          const value = interpolatedBalanceValues[context.dataIndex];
          const isZeroCrossing = value === 0;
          if (isZeroCrossing) return 'transparent';
          return value >= 0 ? '#10d56e' : '#ff3030';
        },
        pointBorderColor: function(context) {
          const value = interpolatedBalanceValues[context.dataIndex];
          const isZeroCrossing = value === 0;
          if (isZeroCrossing) return 'transparent';
          return value >= 0 ? '#10d56e' : '#ff3030';
        },
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        borderWidth: 3, // Más grueso como Full View
        order: 1, // Render encima del área
        pointStyle: 'circle',
        segment: {
          borderColor: function(ctx) {
            const startIndex = ctx.p0DataIndex;
            const endIndex = ctx.p1DataIndex;
            const startValue = interpolatedBalanceValues[startIndex];
            const endValue = interpolatedBalanceValues[endIndex];
            
            // Usar solo el valor final del segmento para evitar cambios durante transiciones
            return endValue >= 0 ? '#10d56e' : '#ff2020';
          }
        }
      });
      
      // Dataset para la línea futura (parte no activa) - gris apagado
      datasets.push({
        label: 'Total P&L Future',
        data: [...interpolatedBalanceValues],
        originalData: [...interpolatedBalanceValues],
        indexMap: indexMap,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        borderColor: 'transparent', // Inicialmente transparente
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.15,
        borderWidth: 3,
        order: 1,
        pointStyle: 'circle',
        animation: {
          duration: 0 // Sin animación para este dataset específico
        }
      });
      
    } else {
      // Modo normal: líneas con sombreado simple pero visible
      
      // Cost Basis Shadow (área) - siempre completa cuando está visible, blanco
      if (showTotalInvested) {
        datasets.push({
          label: 'Cost Basis Shadow',
          data: investedValues, // Siempre datos completos
          borderColor: 'transparent', // Sin línea
          borderWidth: 0,
          backgroundColor: showFill ? function(context) {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'transparent';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.01)');
            return gradient;
          } : 'transparent',
          fill: 'origin',
          tension: 0.05,
          pointRadius: 0,
          pointHoverRadius: 0,
          pointBackgroundColor: 'transparent',
          pointBorderColor: 'transparent',
          pointBorderWidth: 0,
          pointHoverBorderWidth: 0,
          order: 3, // Render detrás de ambas líneas
          skipDuringMouseMove: true, // No modificar durante el hover para mayor fluidez
          animation: {
            backgroundColor: false
          }
        });
      }

      // Cost Basis Line - solo agregar si está habilitado
      if (showTotalInvested) {
        datasets.push({
          label: 'Cost Basis',
          data: investedValues,
          originalData: [...investedValues], // Copia de los datos originales
          borderColor: 'rgba(200, 220, 255, 0.9)',
          backgroundColor: 'transparent', // Sin área de relleno
          fill: false, // No fill para este dataset
          tension: 0.05, // Más angular que la línea verde
          pointRadius: 0,
          pointHoverRadius: 0,
          pointBackgroundColor: 'transparent',
          pointBorderColor: 'transparent',
          pointBorderWidth: 0,
          pointHoverBorderWidth: 0,
          borderDash: [8, 3],
          borderWidth: 3,
          pointStyle: 'line',
          order: 1,
        });
        
        // Cost Basis Future Line - parte no activa en gris
        datasets.push({
          label: 'Cost Basis Future',
          data: [...investedValues],
          originalData: [...investedValues],
          borderColor: 'transparent', // Inicialmente transparente
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.05,
          pointRadius: 0,
          pointHoverRadius: 0,
          pointBackgroundColor: 'transparent',
          pointBorderColor: 'transparent',
          pointBorderWidth: 0,
          pointHoverBorderWidth: 0,
          borderDash: [8, 3],
          borderWidth: 3,
          pointStyle: 'line',
          order: 1,
          animation: {
            duration: 0 // Sin animación para este dataset específico
          }
        });
      }
      
      // Dataset para la sombra (área) - siempre verde, datos fijos para evitar líneas fantasma
      datasets.push({
        label: 'Portfolio Shadow',
        data: [...portfolioValues],
        borderColor: 'transparent',
        borderWidth: 0,
        backgroundColor: showFill ? function(context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'transparent';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(34, 197, 94, 0.35)');
          gradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.18)');
          gradient.addColorStop(1, 'rgba(34, 197, 94, 0.03)');
          return gradient;
        } : 'transparent',
        fill: 'origin',
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        order: 2,
        skipDuringMouseMove: true,
        animation: { backgroundColor: false }
      });

      // Dataset para la línea principal - se corta dinámicamente
      datasets.push({
        label: 'Portfolio Value',
        data: portfolioValues, // Los datos se actualizarán dinámicamente
        originalData: [...portfolioValues], // Copia de los datos originales
        borderColor: '#00ff88', // Verde brillante para la parte activa
        backgroundColor: 'transparent', // Sin área de relleno
        fill: false, // No fill para este dataset
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        borderWidth: 3,
        order: 1, // Render encima de la sombra
        pointStyle: 'circle'
      });
      
      // Dataset para la línea futura (parte no activa) - verde apagado
      datasets.push({
        label: 'Portfolio Value Future',
        data: [...portfolioValues], // Datos completos inicialmente
        originalData: [...portfolioValues],
        borderColor: 'transparent', // Inicialmente transparente
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        borderWidth: 3,
        order: 1,
        pointStyle: 'circle',
        animation: {
          duration: 0 // Sin animación para este dataset específico
        }
      });
    }


    return {
      labels,
      datasets
    };
  };

  // No regenerar timelineData si el tooltip está congelado (preservar datos cortados)
  const timelineData = useMemo(() => {
    if (isTooltipFrozen && chartRef.current) {
      // Devolver los datos actuales del chart para preservar el estado congelado
      return chartRef.current.data;
    }
    return createTimelineData();
  }, [portfolioData, startDate, endDate, processedTimelineData, viewMode, showTotalInvested, isTooltipFrozen, excludedOperations, disabledOps, showFill]);
  
  const getDynamicTimelineOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600,
        easing: 'easeOutCirc',
        animateRotate: false,
        animateScale: false
      },
      layout: {
        padding: {
          right: 40
        }
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      onClick: function(event, elements, chart) {
        
        // Asegurar que el estado existe
        if (!chart.frozenTooltip) {
          chart.frozenTooltip = {
            isFrozen: false,
            frozenIndex: -1,
            lastDrawnIndex: -1
          };
        }
        
        if (elements && elements.length > 0) {
          const clickedIndex = elements[0].index;
          
          // Si ya está congelado, descongelar (sin importar el punto) - actuar como RESET
          if (chart.frozenTooltip.isFrozen) {
            
            // Limpiar estados
            chart.hoveredDataIndex = undefined;
            chart.frozenTooltip.isFrozen = false;
            chart.frozenTooltip.frozenIndex = -1;
            
            // Restaurar líneas
            chart.data.datasets.forEach((dataset, idx) => {
              if (dataset.originalData && !dataset.skipDuringMouseMove) {
                dataset.data = [...dataset.originalData];
              }
            });
            
            setIsTooltipFrozen(false);

            // Do NOT reset dates — unfreeze stays at current zoom level
            // Do NOT hide zoom popup — it may still be valid if chart is zoomed

            // No llamar forceHidePopup() aquí para permitir que el popup funcione correctamente
            if (chart && chart.canvas && chart.canvas.ownerDocument) {
            try {
              if (chart && !chart._isDestroying && chart.canvas && chart.canvas.ownerDocument) {
          try {
            chart.update('none');
          } catch (e) {
            console.warn('Error updating chart:', e);
          }
        }
            } catch (e) {
              console.warn('Error updating chart:', e);
            }
          }
          } else {
            // Congelar en este punto
            
            const indexToFreeze = chart.hoveredDataIndex !== undefined ? chart.hoveredDataIndex : clickedIndex;
            
            // Configurar el estado congelado
            chart.frozenTooltip.isFrozen = true;
            chart.frozenTooltip.frozenIndex = indexToFreeze;
            chart.hoveredDataIndex = indexToFreeze;
            
            setIsTooltipFrozen(true);
            
            // Marcar que el usuario ha interactuado con el timeline
            hasUserInteractedWithTimeline.current = true;
            
            // Cortar líneas principales
            chart.data.datasets.forEach((dataset, idx) => {
              const isMainLine = dataset.label === 'Portfolio Value' || 
                                dataset.label === 'Total P&L' || 
                                dataset.label === 'Cost Basis';
              
              if (dataset.originalData && isMainLine && !dataset.skipDuringMouseMove) {
                dataset.data = dataset.originalData.slice(0, indexToFreeze + 1);
              }
            });
          }
          
          if (chart && chart.canvas && chart.canvas.ownerDocument) {
            try {
              if (chart && !chart._isDestroying && chart.canvas && chart.canvas.ownerDocument) {
          try {
            chart.update('none');
          } catch (e) {
            console.warn('Error updating chart:', e);
          }
        }
            } catch (e) {
              console.warn('Error updating chart:', e);
            }
          }
        }
      },
      onHover: function(event, elements, chart) {
        // Si está congelado, no procesar hover
        if (chart.frozenTooltip && chart.frozenTooltip.isFrozen) {
          return;
        }
        
        // Comportamiento normal de hover si no está congelado
        // Chart.js manejará esto automáticamente
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: false,
            },
            drag: {
              enabled: true,
              backgroundColor: 'rgba(34, 197, 94, 0.3)',
              borderColor: 'rgba(34, 197, 94, 0.8)',
              borderWidth: 2,
              onDragStart: function({chart}) {

                // Si el tooltip está congelado, descongelarlo antes de hacer zoom
                if (chart.frozenTooltip && chart.frozenTooltip.isFrozen) {
                  chart.hoveredDataIndex = undefined;
                  chart.frozenTooltip.isFrozen = false;
                  chart.frozenTooltip.frozenIndex = -1;
                }
                setIsTooltipFrozen(false);

                // Restaurar todas las líneas completas para el drag/zoom
                chart.data.datasets.forEach(dataset => {
                  if (dataset.originalData && !dataset.skipDuringMouseMove) {
                    dataset.data = [...dataset.originalData];
                  }
                });
                
                // Marcar que estamos en modo drag
                chart._isDragZoom = true;
                if (chart && chart.canvas && chart.canvas.ownerDocument) {
            try {
              if (chart && !chart._isDestroying && chart.canvas && chart.canvas.ownerDocument) {
          try {
            chart.update('none');
          } catch (e) {
            console.warn('Error updating chart:', e);
          }
        }
            } catch (e) {
              console.warn('Error updating chart:', e);
            }
          }
              },
              onDragEnd: function({chart}) {
                // El onZoomComplete se encargará de limpiar el flag
              }
            },
            mode: 'x',
            onZoomComplete: function({chart}) {

              // Descongelar tooltip si estaba congelado
              setIsTooltipFrozen(false);

              // Limpiar flag de drag zoom
              chart._isDragZoom = false;
              
              // Período de estabilización después del zoom
              chart._stabilizing = true;
              setTimeout(() => {
                chart._stabilizing = false;
              }, 700); // 0.6 segundos
              
              if (chart && chart.scales && chart.scales.x) {
                const xScale = chart.scales.x;
                const startDate = new Date(xScale.min);
                const endDate = new Date(xScale.max);
                
                // Use global formatDate function to maintain consistency (YYYY-MM-DD format)
                const formatZoomDate = (date) => {
                  return date.toISOString().split('T')[0];
                };
                
                const newStartDate = formatZoomDate(startDate);
                const newEndDate = formatZoomDate(endDate);
                
                userClosedPopup.current = false; // Reset popup close flag when zoom changes dates
                
                // Reset tracking when zoom changes dates to prevent duplicate popups
                lastProcessedDates.current = { startDate: '', endDate: '' };
                
                setStartDate(newStartDate);
                setEndDate(newEndDate);
                setIsZoomed(true);
                
                // Exit point click mode on zoom
                if (setIsInPointClickMode) {
                  setIsInPointClickMode(false);
                }
                
                // Marcar que el usuario ha interactuado con el timeline
                hasUserInteractedWithTimeline.current = true;
                
                // El popup se controlará automáticamente por el useEffect que compara fechas
              }
            }
          },
          pan: {
            enabled: false,
          },
          limits: {
            x: {
              minRange: 24 * 60 * 60 * 1000
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          display: false,
          time: {
            unit: 'day',
            displayFormats: {
              day: 'dd/MM/yyyy'
            }
          },
          grid: {
            display: false
          },
          border: {
            display: false
          }
        },
        y: {
          display: true,
          position: 'left',
          grid: {
            display: false
          },
          border: {
            display: false
          },
          ticks: {
            color: '#ffffff',
            font: {
              size: 14,
              family: 'monospace',
              weight: '600'
            },
            padding: 5,
            maxTicksLimit: 6,
            callback: function(value) {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M€';
              } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'K€';
              } else if (value <= -1000000) {
                return (value / 1000000).toFixed(1) + 'M€';
              } else if (value <= -1000) {
                return (value / 1000).toFixed(1) + 'K€';
              }
              return Math.round(value) + '€';
            }
          }
        }
      }
    };
  };

  if (!timelineData) {
    return (
      <div style={{
        height: "520px",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.textSecondary,
        fontFamily: 'monospace'
      }}>
        No timeline data available
      </div>
    );
  }

  return (
    <div className="timeline-chart-container" style={{
      width: '100%',
      height: "fit-content",
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      margin: '0',
      padding: '0',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '0',
      boxSizing: 'border-box',
      overflow: 'visible'
    }}>
      {/* Contenedor igual que AssetLeaderboard */}
      <div style={{
        background: 'transparent',
        border: 'none',
        borderRadius: '0',
        overflow: 'visible'
      }}>
        <div style={{
          position: 'relative',
          marginBottom: '8rem',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Contenedor principal para controles */}
          <div style={{
          position: 'absolute',
          top: '0',
          left: '60px',
          right: '60px', // Márgenes aumentados a 60px en ambos lados
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          fontFamily: 'monospace',
          fontWeight: '600',
          zIndex: 10
        }}>
          {/* Controles izquierda */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
          {/* Botones de control mejorados */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginRight: '1.5rem',
            background: COLORS.BACKGROUND_DARK,
            borderRadius: '14px',
            padding: '6px',
            border: `2px solid ${COLORS.BORDER_STRONG}`,
            backdropFilter: 'blur(20px)',
            boxShadow: COLORS.SHADOW,
            minWidth: 'fit-content',
            flexShrink: 0
          }}>
            {/* Selector de modo de vista con toggle fluido */}
            <div style={{
              position: 'relative',
              display: 'flex',
              background: 'transparent',
              borderRadius: '10px',
              padding: '0',
              minWidth: '200px',
              justifyContent: 'space-between',
              marginRight: '10px'
            }}>
              <button
                onClick={() => setViewMode('both')}
                style={{
                  background: viewMode === 'both'
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.5), rgba(16, 185, 129, 0.6))'
                    : COLORS.BTN_INACTIVE,
                  border: viewMode === 'both'
                    ? '2px solid rgba(34, 197, 94, 0.7)'
                    : `2px solid ${COLORS.BORDER}`,
                  borderRadius: '10px',
                  padding: '6px 10px',
                  color: viewMode === 'both' ? '#ffffff' : COLORS.TEXT_DIM,
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease-out',
                  backdropFilter: 'blur(10px)',
                  boxShadow: viewMode === 'both'
                    ? '0 4px 20px rgba(34, 197, 94, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                    : COLORS.SHADOW_SM
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'both') {
                    e.currentTarget.style.color = COLORS.TEXT;
                    e.currentTarget.style.background = COLORS.HOVER_LIGHT;
                    e.currentTarget.style.boxShadow = COLORS.SHADOW_SM;
                    e.currentTarget.style.borderColor = COLORS.BORDER_HOVER;
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'both') {
                    e.currentTarget.style.color = COLORS.TEXT_DIM;
                    e.currentTarget.style.background = COLORS.HOVER_DEFAULT;
                    e.currentTarget.style.boxShadow = COLORS.SHADOW_SM;
                    e.currentTarget.style.borderColor = COLORS.BORDER;
                  }
                }}
              >
                FULL VIEW
              </button>

              <button
                onClick={() => setViewMode('balance')}
                style={{
                  background: viewMode === 'balance'
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.5), rgba(16, 185, 129, 0.6))'
                    : COLORS.BTN_INACTIVE,
                  border: viewMode === 'balance'
                    ? '2px solid rgba(34, 197, 94, 0.7)'
                    : `2px solid ${COLORS.BORDER}`,
                  borderRadius: '10px',
                  padding: '6px 10px',
                  color: viewMode === 'balance' ? '#ffffff' : COLORS.TEXT_DIM,
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease-out',
                  backdropFilter: 'blur(10px)',
                  boxShadow: viewMode === 'balance'
                    ? '0 4px 20px rgba(34, 197, 94, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                    : COLORS.SHADOW_SM
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'balance') {
                    e.currentTarget.style.color = COLORS.TEXT;
                    e.currentTarget.style.background = COLORS.HOVER_LIGHT;
                    e.currentTarget.style.boxShadow = COLORS.SHADOW_SM;
                    e.currentTarget.style.borderColor = COLORS.BORDER_HOVER;
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'balance') {
                    e.currentTarget.style.color = COLORS.TEXT_DIM;
                    e.currentTarget.style.background = COLORS.HOVER_DEFAULT;
                    e.currentTarget.style.boxShadow = COLORS.SHADOW_SM;
                    e.currentTarget.style.borderColor = COLORS.BORDER;
                  }
                }}
              >
                P&L VIEW
              </button>
            </div>
            
            {/* Cost Basis + Fill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginRight: '10px'
            }}>
              {/* Cost Basis — se oculta en P&L View */}
              <div style={{
                overflow: 'hidden',
                opacity: viewMode === 'both' ? 1 : 0,
                width: viewMode === 'both' ? 'auto' : '0px',
                transition: 'all 0.25s ease-out',
                pointerEvents: viewMode === 'both' ? 'auto' : 'none',
              }}>
                <button
                  onClick={handleInvestedToggle}
                  style={{
                    background: showTotalInvested
                      ? COLORS.HOVER_LIGHT
                      : COLORS.BTN_INACTIVE_SM,
                    border: showTotalInvested
                      ? `1px solid ${COLORS.BORDER_HOVER}`
                      : `1px solid ${COLORS.BORDER}`,
                    borderRadius: '8px',
                    padding: '5px 8px',
                    color: showTotalInvested ? COLORS.TEXT : COLORS.TEXT_MUTED,
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: showTotalInvested
                      ? '0 3px 12px rgba(255, 255, 255, 0.1)'
                      : '0 1px 4px rgba(0, 0, 0, 0.1)',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = COLORS.HOVER_LIGHT;
                    e.currentTarget.style.color = COLORS.TEXT;
                    e.currentTarget.style.borderColor = COLORS.BORDER_HOVER;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = showTotalInvested ? COLORS.HOVER_LIGHT : COLORS.BTN_INACTIVE_SM;
                    e.currentTarget.style.color = showTotalInvested ? COLORS.TEXT : COLORS.TEXT_MUTED;
                    e.currentTarget.style.borderColor = showTotalInvested ? COLORS.BORDER_HOVER : COLORS.BORDER;
                  }}
                >
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: showTotalInvested
                      ? 'linear-gradient(45deg, rgba(0, 255, 136, 1), rgba(34, 197, 94, 0.9))'
                      : 'rgba(120, 120, 120, 0.5)',
                    transition: 'all 0.3s ease',
                    boxShadow: showTotalInvested
                      ? '0 2px 8px rgba(0, 255, 136, 0.3), inset 0 1px 2px rgba(0, 255, 136, 0.5)'
                      : 'none'
                  }}></span>
                  COST BASIS
                </button>
              </div>

              {/* Fill */}
              <button
                onClick={() => setShowFill(prev => !prev)}
                style={{
                  background: showFill
                    ? COLORS.HOVER_LIGHT
                    : COLORS.BTN_INACTIVE_SM,
                  border: showFill
                    ? `1px solid ${COLORS.BORDER_HOVER}`
                    : `1px solid ${COLORS.BORDER}`,
                  borderRadius: '8px',
                  padding: '5px 8px',
                  color: showFill ? COLORS.TEXT : COLORS.TEXT_MUTED,
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease-out',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backdropFilter: 'blur(10px)',
                  boxShadow: showFill
                    ? '0 3px 12px rgba(255, 255, 255, 0.1)'
                    : '0 1px 4px rgba(0, 0, 0, 0.1)',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = COLORS.HOVER_LIGHT;
                  e.currentTarget.style.color = COLORS.TEXT;
                  e.currentTarget.style.borderColor = COLORS.BORDER_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = showFill ? COLORS.HOVER_LIGHT : COLORS.BTN_INACTIVE_SM;
                  e.currentTarget.style.color = showFill ? COLORS.TEXT : COLORS.TEXT_MUTED;
                  e.currentTarget.style.borderColor = showFill ? COLORS.BORDER_HOVER : COLORS.BORDER;
                }}
              >
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: showFill
                    ? 'linear-gradient(45deg, rgba(0, 255, 136, 1), rgba(34, 197, 94, 0.9))'
                    : 'rgba(120, 120, 120, 0.5)',
                  transition: 'all 0.3s ease',
                  boxShadow: showFill
                    ? '0 2px 8px rgba(0, 255, 136, 0.3), inset 0 1px 2px rgba(0, 255, 136, 0.5)'
                    : 'none'
                }}></span>
                FILL
              </button>
            </div>

            {/* Botones de Period */}
            <div style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center'
            }}>
              
              <button
                onClick={() => setPeriodMode('day')}
                style={{
                  background: periodMode === 'day' 
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.6), rgba(16, 185, 129, 0.7))' 
                    : COLORS.BTN_INACTIVE_SM,
                  border: periodMode === 'day' 
                    ? '1px solid rgba(34, 197, 94, 0.8)' 
                    : `1px solid ${COLORS.BORDER}`,
                  borderRadius: '8px',
                  padding: '4px 8px',
                  color: periodMode === 'day' ? '#ffffff' : COLORS.TEXT_DIM,
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)'
                }}
                onMouseEnter={(e) => {
                  if (periodMode !== 'day') {
                    e.currentTarget.style.background = COLORS.HOVER_LIGHT;
                    e.currentTarget.style.color = COLORS.TEXT;
                  }
                }}
                onMouseLeave={(e) => {
                  if (periodMode !== 'day') {
                    e.currentTarget.style.background = COLORS.BTN_INACTIVE_SM;
                    e.currentTarget.style.color = COLORS.TEXT_DIM;
                  }
                }}
              >
                D
              </button>
              
              <button
                onClick={() => {
                  if (canAggregate('week') && isAggregationCompatible('week', activeQuickFilter)) {
                    setPeriodMode('week');
                  }
                }}
                disabled={!canAggregate('week') || !isAggregationCompatible('week', activeQuickFilter)}
                style={{
                  background: periodMode === 'week' 
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.6), rgba(16, 185, 129, 0.7))' 
                    : (!canAggregate('week') || !isAggregationCompatible('week', activeQuickFilter))
                      ? 'rgba(255, 255, 255, 0.02)' 
                      : COLORS.BTN_INACTIVE_SM,
                  border: periodMode === 'week' 
                    ? '1px solid rgba(34, 197, 94, 0.8)' 
                    : (!canAggregate('week') || !isAggregationCompatible('week', activeQuickFilter))
                      ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`
                      : `1px solid ${COLORS.BORDER}`,
                  borderRadius: '8px',
                  padding: '4px 8px',
                  color: periodMode === 'week' 
                    ? '#ffffff' 
                    : (!canAggregate('week') || !isAggregationCompatible('week', activeQuickFilter))
                      ? COLORS.TEXT_MUTED
                      : COLORS.TEXT_DIM,
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  cursor: (!canAggregate('week') || !isAggregationCompatible('week', activeQuickFilter)) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)',
                  opacity: (!canAggregate('week') || !isAggregationCompatible('week', activeQuickFilter)) ? 0.4 : 1
                }}
                onMouseEnter={(e) => {
                  if (periodMode !== 'week' && canAggregate('week') && isAggregationCompatible('week', activeQuickFilter)) {
                    e.currentTarget.style.background = COLORS.HOVER_LIGHT;
                    e.currentTarget.style.color = COLORS.TEXT;
                  }
                }}
                onMouseLeave={(e) => {
                  if (periodMode !== 'week' && canAggregate('week') && isAggregationCompatible('week', activeQuickFilter)) {
                    e.currentTarget.style.background = COLORS.BTN_INACTIVE_SM;
                    e.currentTarget.style.color = COLORS.TEXT_DIM;
                  }
                }}
              >
                W
              </button>
              
              <button
                onClick={() => {
                  if (canAggregate('month') && isAggregationCompatible('month', activeQuickFilter)) {
                    setPeriodMode('month');
                  }
                }}
                disabled={!canAggregate('month') || !isAggregationCompatible('month', activeQuickFilter)}
                style={{
                  background: periodMode === 'month' 
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.6), rgba(16, 185, 129, 0.7))' 
                    : (!canAggregate('month') || !isAggregationCompatible('month', activeQuickFilter))
                      ? 'rgba(255, 255, 255, 0.02)' 
                      : COLORS.BTN_INACTIVE_SM,
                  border: periodMode === 'month' 
                    ? '1px solid rgba(34, 197, 94, 0.8)' 
                    : (!canAggregate('month') || !isAggregationCompatible('month', activeQuickFilter))
                      ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`
                      : `1px solid ${COLORS.BORDER}`,
                  borderRadius: '8px',
                  padding: '4px 8px',
                  color: periodMode === 'month' 
                    ? '#ffffff' 
                    : (!canAggregate('month') || !isAggregationCompatible('month', activeQuickFilter))
                      ? COLORS.TEXT_MUTED
                      : COLORS.TEXT_DIM,
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  cursor: (!canAggregate('month') || !isAggregationCompatible('month', activeQuickFilter)) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)',
                  opacity: (!canAggregate('month') || !isAggregationCompatible('month', activeQuickFilter)) ? 0.4 : 1
                }}
                onMouseEnter={(e) => {
                  if (periodMode !== 'month' && canAggregate('month') && isAggregationCompatible('month', activeQuickFilter)) {
                    e.currentTarget.style.background = COLORS.HOVER_LIGHT;
                    e.currentTarget.style.color = COLORS.TEXT;
                  }
                }}
                onMouseLeave={(e) => {
                  if (periodMode !== 'month' && canAggregate('month') && isAggregationCompatible('month', activeQuickFilter)) {
                    e.currentTarget.style.background = COLORS.BTN_INACTIVE_SM;
                    e.currentTarget.style.color = COLORS.TEXT_DIM;
                  }
                }}
              >
                M
              </button>
              
              <button
                onClick={() => {
                  if (canAggregate('year') && isAggregationCompatible('year', activeQuickFilter)) {
                    setPeriodMode('year');
                  }
                }}
                disabled={!canAggregate('year') || !isAggregationCompatible('year', activeQuickFilter)}
                style={{
                  background: periodMode === 'year' 
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.6), rgba(16, 185, 129, 0.7))' 
                    : (!canAggregate('year') || !isAggregationCompatible('year', activeQuickFilter))
                      ? 'rgba(255, 255, 255, 0.02)' 
                      : COLORS.BTN_INACTIVE_SM,
                  border: periodMode === 'year' 
                    ? '1px solid rgba(34, 197, 94, 0.8)' 
                    : (!canAggregate('year') || !isAggregationCompatible('year', activeQuickFilter))
                      ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`
                      : `1px solid ${COLORS.BORDER}`,
                  borderRadius: '8px',
                  padding: '4px 8px',
                  color: periodMode === 'year' 
                    ? '#ffffff' 
                    : (!canAggregate('year') || !isAggregationCompatible('year', activeQuickFilter))
                      ? COLORS.TEXT_MUTED
                      : COLORS.TEXT_DIM,
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  cursor: (!canAggregate('year') || !isAggregationCompatible('year', activeQuickFilter)) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)',
                  opacity: (!canAggregate('year') || !isAggregationCompatible('year', activeQuickFilter)) ? 0.4 : 1
                }}
                onMouseEnter={(e) => {
                  if (periodMode !== 'year' && canAggregate('year') && isAggregationCompatible('year', activeQuickFilter)) {
                    e.currentTarget.style.background = COLORS.HOVER_LIGHT;
                    e.currentTarget.style.color = COLORS.TEXT;
                  }
                }}
                onMouseLeave={(e) => {
                  if (periodMode !== 'year' && canAggregate('year') && isAggregationCompatible('year', activeQuickFilter)) {
                    e.currentTarget.style.background = COLORS.BTN_INACTIVE_SM;
                    e.currentTarget.style.color = COLORS.TEXT_DIM;
                  }
                }}
              >
                Y
              </button>
            </div>
          </div>
          
          {/* Leyenda dinámica - solo muestra elementos activos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {viewMode === 'both' && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  width: '28px',
                  height: '3px',
                  background: 'linear-gradient(90deg, #10b981, #22c55e, #34d399)',
                  borderRadius: '2px',
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)'
                }}></div>
                <span style={{ 
                  color: COLORS.TEXT,
                  fontWeight: '600',
                  fontSize: '15px'
                }}>PORTFOLIO VALUE</span>
              </div>
            )}
            
            {viewMode === 'both' && showTotalInvested && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  width: '28px',
                  height: '3px',
                  background: 'repeating-linear-gradient(to right, rgba(220, 220, 220, 0.9) 0px, rgba(220, 220, 220, 0.9) 4px, transparent 4px, transparent 8px)',
                  borderRadius: '2px'
                }}></div>
                <span style={{ 
                  color: COLORS.TEXT,
                  fontWeight: '600',
                  fontSize: '15px'
                }}>COST BASIS</span>
              </div>
            )}

            {viewMode === 'balance' && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  width: '28px',
                  height: '3px',
                  background: 'linear-gradient(90deg, #10b981, #22c55e, #34d399)',
                  borderRadius: '2px',
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)'
                }}></div>
                <span style={{ 
                  color: COLORS.TEXT,
                  fontWeight: '600',
                  fontSize: '15px'
                }}>TOTAL P&L</span>
              </div>
            )}
            
          </div>
          
          {/* Botones de fechas a la derecha */}
          <div style={{
            position: 'absolute',
            top: '6px',
            right: sidebarOpen ? '-30px' : '20px', // Otro pelin más a la derecha
            display: 'flex',
            alignItems: 'center',
            gap: '0px'
          }}>
            {/* Botón fecha inicio */}
            <div style={{ position: 'relative' }} data-calendar id="start-date-container">
              <div style={{
                background: COLORS.BTN_INACTIVE,
                border: `1px solid ${COLORS.BORDER}`,
                borderRadius: '10px',
                padding: (() => {
                  const { defaultStartDate } = getDefaultDates();
                  return startDate && startDate !== defaultStartDate ? '6px 26px 6px 10px' : '6px 10px';
                })(),
                height: '37px',
                boxSizing: 'border-box',
                color: COLORS.TEXT,
                fontSize: '13px',
                fontFamily: 'monospace',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.25s ease-out',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '6px',
                whiteSpace: 'nowrap',
                minWidth: '120px',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.background = COLORS.HOVER_LIGHT;
                e.currentTarget.style.boxShadow = COLORS.SHADOW_SM;
                e.currentTarget.style.borderColor = COLORS.BORDER_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = COLORS.BTN_INACTIVE;
                e.currentTarget.style.boxShadow = COLORS.SHADOW_SM;
                e.currentTarget.style.borderColor = COLORS.BORDER;
              }}
              onClick={() => {
                setCalendarType('start');
                const dateToUse = startDate;
                if (dateToUse) {
                  // Now dates are in YYYY-MM-DD format
                  setCalendarDate(new Date(dateToUse));
                }
                // Usar estado unificado para el calendario
                const shouldShow = !showStartCalendar && !showEndCalendar;
                setShowStartCalendar(shouldShow);
                setShowEndCalendar(false);
              }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(145, 145, 145, 0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span id="timeline-start-date-display" style={{ textAlign: 'left', flex: '1' }}>{startDate}</span>
                {(() => {
                  const { defaultStartDate } = getDefaultDates();
                  const currentStartDate = startDate;
                  return currentStartDate && currentStartDate !== defaultStartDate && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      right: '12px',
                      transform: 'translateY(-50%)',
                      width: '10px',
                      height: '10px',
                      background: '#00ff88',
                      borderRadius: '50%',
                      border: '1px solid rgba(15, 15, 15, 0.8)',
                      boxShadow: '0 0 8px rgba(0, 255, 136, 0.6)',
                      pointerEvents: 'none'
                    }}></div>
                  );
                })()}
              </div>
              
              {/* Calendario emergente para fecha inicio */}
              {showStartCalendar && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: '-50px',
                    marginTop: '8px',
                    background: '#1a1a1a',
                    border: '1px solid #4a4a4a',
                    borderRadius: '10px',
                    padding: '16px',
                    fontFamily: 'monospace',
                    pointerEvents: 'auto',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 6px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                    width: '280px',
                    fontSize: '14px',
                    zIndex: 10000,
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header with date type and close */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '6px',
                    position: 'relative',
                    height: '22px'
                  }}>
                    <div style={{
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {calendarType === 'start' ? 'START DATE' : 'END DATE'}
                    </div>
                    <button
                      onClick={() => setShowStartCalendar(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ff6666',
                        fontSize: '15px',
                        cursor: 'pointer',
                        padding: '0',
                        lineHeight: '1',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'absolute',
                        top: '-2px',
                        right: '0',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 102, 102, 0.2)';
                        e.currentTarget.style.color = '#ff6666';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#ff6666';
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Separator line */}
                  <div style={{
                    width: '100%',
                    height: '1px',
                    background: '#333333',
                    marginBottom: '12px'
                  }}></div>

                  {/* Month/Year Navigation */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '12px',
                    gap: '8px'
                  }}>
                    <button 
                      onClick={() => !isMonthNavigationDisabled(-1) && changeMonth(-1)}
                      disabled={isMonthNavigationDisabled(-1)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isMonthNavigationDisabled(-1) ? '#444444' : '#ffffff',
                        fontSize: '28px',
                        cursor: isMonthNavigationDisabled(-1) ? 'not-allowed' : 'pointer',
                        padding: '6px',
                        transition: 'all 0.2s ease',
                        minWidth: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => !isMonthNavigationDisabled(-1) && (e.currentTarget.style.color = '#ffffff')}
                      onMouseLeave={(e) => !isMonthNavigationDisabled(-1) && (e.currentTarget.style.color = '#ffffff')}
                    >
                      ‹
                    </button>
                    
                    <div 
                      onClick={() => setShowMonthYearSelector(!showMonthYearSelector)}
                      style={{ 
                        fontWeight: '600',
                        color: '#ffffff',
                        fontSize: '13px',
                        textAlign: 'center',
                        background: '#1a1a1a',
                        border: '1px solid #333333',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        minWidth: '140px',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#2a2a2a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#1a1a1a';
                      }}
                    >
                      {calendarDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} - {calendarDate.getFullYear()}
                    </div>
                    
                    <button 
                      onClick={() => !isMonthNavigationDisabled(1) && changeMonth(1)}
                      disabled={isMonthNavigationDisabled(1)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isMonthNavigationDisabled(1) ? '#444444' : '#ffffff',
                        fontSize: '28px',
                        cursor: isMonthNavigationDisabled(1) ? 'not-allowed' : 'pointer',
                        padding: '6px',
                        transition: 'all 0.2s ease',
                        minWidth: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => !isMonthNavigationDisabled(1) && (e.currentTarget.style.color = '#ffffff')}
                      onMouseLeave={(e) => !isMonthNavigationDisabled(1) && (e.currentTarget.style.color = '#ffffff')}
                    >
                      ›
                    </button>
                  </div>

                  {/* Month/Year Selector */}
                  {showMonthYearSelector && (() => {
                    const { minDate, maxDate } = getValidDateRange();
                    const availableMonths = [];
                    const availableYears = [];
                    
                    if (minDate && maxDate) {
                      // Generar meses disponibles
                      for (let month = 0; month < 12; month++) {
                        const testDate = new Date(calendarDate.getFullYear(), month, 1);
                        const lastDayOfMonth = new Date(calendarDate.getFullYear(), month + 1, 0);
                        if (testDate <= maxDate && lastDayOfMonth >= minDate) {
                          availableMonths.push(month);
                        }
                      }
                      
                      // Generar años disponibles (solo los que tienen datos)
                      for (let year = minDate.getFullYear(); year <= maxDate.getFullYear(); year++) {
                        availableYears.push(year);
                      }
                    }
                    
                    return (
                      <div style={{
                        position: 'absolute',
                        top: '60px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#1a1a1a',
                        border: '1px solid #4a4a4a',
                        borderRadius: '8px',
                        padding: '16px',
                        zIndex: 10001,
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        minWidth: '280px',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 4px 15px rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)'
                      }}>
                        {/* Month Column */}
                        <div>
                          <div style={{
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: '600',
                            marginBottom: '8px',
                            textAlign: 'center'
                          }}>MONTH</div>
                          <div style={{
                            maxHeight: '80px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1px',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                          }}>
                            {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((month, index) => {
                              const isAvailable = availableMonths.includes(index);
                              return (
                                <div
                                  key={month}
                                  onClick={() => {
                                    if (isAvailable) {
                                      const newDate = new Date(calendarDate);
                                      newDate.setMonth(index);
                                      setCalendarDate(newDate);
                                      setShowMonthYearSelector(false);
                                    }
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                                    borderRadius: '3px',
                                    background: calendarDate.getMonth() === index ? '#333333' : 'transparent',
                                    color: isAvailable ? (calendarDate.getMonth() === index ? '#ffffff' : '#cccccc') : '#555555',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'center',
                                    opacity: isAvailable ? 1 : 0.5,
                                    fontWeight: '600',
                                    minHeight: '28px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (isAvailable && calendarDate.getMonth() !== index) {
                                      e.currentTarget.style.background = '#2a2a2a';
                                      e.currentTarget.style.color = '#ffffff';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (isAvailable && calendarDate.getMonth() !== index) {
                                      e.currentTarget.style.background = 'transparent';
                                      e.currentTarget.style.color = '#cccccc';
                                    }
                                  }}
                                >
                                  {month}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Year Column */}
                        <div>
                          <div style={{
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: '600',
                            marginBottom: '8px',
                            textAlign: 'center'
                          }}>YEAR</div>
                          <div style={{
                            maxHeight: '80px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1px',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                          }}>
                            {availableYears.map((year) => (
                              <div
                                key={year}
                                onClick={() => {
                                  const newDate = new Date(calendarDate);
                                  newDate.setFullYear(year);
                                  setCalendarDate(newDate);
                                  setShowMonthYearSelector(false);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  borderRadius: '3px',
                                  background: calendarDate.getFullYear() === year ? '#333333' : 'transparent',
                                  color: calendarDate.getFullYear() === year ? '#ffffff' : '#cccccc',
                                  transition: 'all 0.2s ease',
                                  textAlign: 'center',
                                  fontWeight: '600',
                                  minHeight: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                  if (calendarDate.getFullYear() !== year) {
                                    e.currentTarget.style.background = '#2a2a2a';
                                    e.currentTarget.style.color = '#ffffff';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (calendarDate.getFullYear() !== year) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#cccccc';
                                  }
                                }}
                              >
                                {year}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Days of week header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '0px',
                    marginBottom: '4px'
                  }}>
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, index) => {
                      const isWeekend = index === 0 || index === 6; // Sunday = 0, Saturday = 6
                      return (
                        <div key={index} style={{
                          textAlign: 'center',
                          padding: '4px 0',
                          color: isWeekend ? '#ff6666' : '#aaaaaa',
                          fontSize: '12px',
                          fontWeight: '600',
                          userSelect: 'none'
                        }}>
                          {day}
                        </div>
                      );
                    })}
                  </div>

                  {/* Calendar Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '0px'
                  }}>
                    {generateCalendar(calendarDate.getFullYear(), calendarDate.getMonth()).map((day, index) => {
                      const dayState = getDayState(day, calendarDate.getFullYear(), calendarDate.getMonth());
                      const isWeekend = index % 7 === 0 || index % 7 === 6; // Sunday = 0, Saturday = 6
                      
                      let backgroundColor = 'transparent';
                      let color = isWeekend ? '#ff6666' : '#cccccc'; // Set weekend color by default
                      let cursor = 'pointer';
                      let border = 'none';
                      let boxShadow = 'none';
                      
                      if (day) {
                        if (dayState === 'selected-start') {
                          backgroundColor = '#52c481';
                          color = '#000000';
                        } else if (dayState === 'selected-end') {
                          backgroundColor = '#52c481';
                          color = '#000000';
                        } else if (dayState === 'in-range') {
                          backgroundColor = '#1a2d1f';
                          color = '#ffffff';
                          border = '1px solid #334d39';
                        } else if (dayState === 'disabled') {
                          backgroundColor = 'transparent';
                          color = '#444444';
                          cursor = 'not-allowed';
                        }
                        // Weekend color is already set by default above
                      }

                      const isSelected = dayState === 'selected-start' || dayState === 'selected-end';

                      return (
                        <div
                          key={index}
                          onClick={() => day && dayState !== 'disabled' && handleDayClick(day)}
                          style={{
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: day ? cursor : 'default',
                            backgroundColor,
                            color,
                            border,
                            fontSize: '16px',
                            fontWeight: isSelected ? '700' : dayState === 'in-range' ? '500' : '400',
                            userSelect: 'none',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (day && dayState !== 'disabled' && !isSelected) {
                              if (dayState === 'in-range') {
                                e.currentTarget.style.backgroundColor = '#263d2a';
                                e.currentTarget.style.color = '#ffffff';
                              } else {
                                e.currentTarget.style.backgroundColor = '#2a2a2a';
                                e.currentTarget.style.color = '#ffffff';
                              }
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (day && dayState !== 'disabled' && !isSelected) {
                              if (dayState === 'in-range') {
                                e.currentTarget.style.backgroundColor = '#1a2d1f';
                                e.currentTarget.style.color = '#ffffff';
                              } else {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = isWeekend ? '#ff6666' : '#cccccc';
                              }
                            }
                          }}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>

                  {/* Clear Button */}
                  <div style={{
                    marginTop: '3px',
                    display: 'flex',
                    justifyContent: 'flex-start'
                  }}>
                    <button
                      onClick={() => {
                        // Reset to default date range based on calendar type
                        if (calendarType === 'start') {
                          const { defaultStartDate } = getDefaultDates();
                          setStartDate(defaultStartDate);
                          // El popup se controlará automáticamente por el useEffect que compara fechas
                        } else {
                          const { defaultEndDate } = getDefaultDates();
                          setEndDate(defaultEndDate);
                          // El popup se controlará automáticamente por el useEffect que compara fechas
                        }
                        setShowStartCalendar(false);
                      }}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #444444',
                        borderRadius: '3px',
                        background: 'transparent',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textTransform: 'uppercase'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#2a2a2a';
                        e.currentTarget.style.borderColor = '#666666';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = '#444444';
                      }}
                    >
                      CLEAR
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* TO separador */}
            <span style={{
              color: COLORS.TEXT,
              fontSize: '11px',
              fontFamily: 'monospace',
              letterSpacing: '1.5px',
              fontWeight: '600',
              margin: '0 4px'
            }}>TO</span>

            {/* Botón fecha fin */}
            <div style={{ position: 'relative' }} data-calendar>
              <div style={{
                background: COLORS.BTN_INACTIVE,
                border: `1px solid ${COLORS.BORDER}`,
                borderRadius: '10px',
                padding: (() => {
                  const { defaultEndDate } = getDefaultDates();
                  return endDate && endDate !== defaultEndDate ? '6px 26px 6px 10px' : '6px 10px';
                })(),
                height: '37px',
                boxSizing: 'border-box',
                color: COLORS.TEXT,
                fontSize: '13px',
                fontFamily: 'monospace',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.25s ease-out',
                backdropFilter: 'blur(10px)',
                boxShadow: COLORS.SHADOW_SM,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '6px',
                whiteSpace: 'nowrap',
                minWidth: '120px',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.background = COLORS.HOVER_LIGHT;
                e.currentTarget.style.boxShadow = COLORS.SHADOW_SM;
                e.currentTarget.style.borderColor = COLORS.BORDER_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = COLORS.BTN_INACTIVE;
                e.currentTarget.style.boxShadow = COLORS.SHADOW_SM;
                e.currentTarget.style.borderColor = COLORS.BORDER;
              }}
              onClick={() => {
                setCalendarType('end');
                const dateToUse = endDate;
                if (dateToUse) {
                  // Now dates are in YYYY-MM-DD format
                  setCalendarDate(new Date(dateToUse));
                }
                // Usar estado unificado para el calendario - mostrar en la posición del botón de inicio
                const shouldShow = !showStartCalendar && !showEndCalendar;
                setShowStartCalendar(shouldShow); // Usamos showStartCalendar para mostrar en la misma posición
                setShowEndCalendar(false);
              }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(145, 145, 145, 0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span id="timeline-end-date-display" style={{ textAlign: 'left', flex: '1' }}>{endDate}</span>
                {(() => {
                  const { defaultEndDate } = getDefaultDates();
                  const currentEndDate = endDate;
                  return currentEndDate && currentEndDate !== defaultEndDate && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      right: '12px',
                      transform: 'translateY(-50%)',
                      width: '10px',
                      height: '10px',
                      background: '#00ff88',
                      borderRadius: '50%',
                      border: '1px solid rgba(15, 15, 15, 0.8)',
                      boxShadow: '0 0 8px rgba(0, 255, 136, 0.6)',
                      pointerEvents: 'none'
                    }}></div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Espaciador para separar tooltip de controles */}
      <div style={{ height: '4rem' }}></div>
      
      {/* Tooltip estático con botones en la misma línea */}
      <div style={{
        width: '100%',
        marginTop: '1rem',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'visible'
      }}>
        <div id="tooltip-area" style={{ 
          flex: '1 1 auto',
          position: 'relative',
          padding: '10px 8px',
          paddingLeft: '60px', // Alineado con el margen izquierdo del gráfico
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          minWidth: 0,
          overflow: 'visible'
        }}>
          {/* El tooltip se inicializará con el último día */}
        </div>
        
      </div>
      

      <div style={{
        height: '600px',
        width: sidebarOpen ? 'calc(100% - 40px)' : 'calc(100% - 120px)',
        marginLeft: '60px',
        marginRight: sidebarOpen ? '-20px' : '60px', // Margen negativo para extender más allá del borde
        position: 'relative',
      }}>
        <Line 
          ref={chartRef} 
          data={timelineData} 
          options={getDynamicTimelineOptions()}
          plugins={[]}
        />
        
        {/* Botones de filtro rápido - debajo del gráfico */}
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '60px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          zIndex: 10
        }}>
          {[
            { key: 'all', label: 'ALL TIME' },
            { key: '1y', label: '1 YEAR' },
            { key: '6m', label: '6 MONTHS' },
            { key: '3m', label: '3 MONTHS' },
            { key: '1m', label: '1 MONTH' },
            { key: '1w', label: '1 WEEK' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleQuickFilter(key)}
              disabled={key !== 'all' && !isFilterCompatible(key, periodMode)}
              style={{
                background: activeQuickFilter === key ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255,255,255,0.06)',
                border: activeQuickFilter === key ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                padding: '5px 12px',
                color: (key !== 'all' && !isFilterCompatible(key, periodMode))
                  ? 'rgba(255, 255, 255, 0.2)'
                  : activeQuickFilter === key
                    ? '#ffffff'
                    : 'rgba(255, 255, 255, 0.65)',
                fontSize: '14px',
                fontFamily: 'monospace',
                fontWeight: activeQuickFilter === key ? '700' : '400',
                cursor: (key !== 'all' && !isFilterCompatible(key, periodMode)) ? 'not-allowed' : 'pointer',
                transition: 'color 0.2s ease, background 0.2s ease, border-color 0.2s ease',
                textAlign: 'center',
                letterSpacing: '0.2px'
              }}
            >
              {label}
            </button>
          ))}
        </div>
        
        {/* Botón de reset de fechas - posicionado en margen derecho del gráfico */}
        {((!isUsingDefaultRange || isZoomed || isTooltipFrozen)) && (
          <div
            id="timeline-reset-button"
            onClick={(e) => {
              // Añadir efecto visual de click
              e.currentTarget.style.transform = 'scale(0.95) translateY(0px)';
              e.currentTarget.style.transition = 'transform 0.1s ease-out';
              
              setTimeout(() => {
                e.currentTarget.style.transform = 'scale(1) translateY(-1px)';
                e.currentTarget.style.transition = 'transform 0.2s ease-out';
              }, 100);
              
              // Use the shared reset function
              handleCompleteReset();
            }}
            style={{
              position: 'absolute',
              top: (sidebarOpen && showTotalInvested && viewMode !== 'balance') ? '-5px' : '-65px',
              right: sidebarOpen ? '50px' : '20px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#ffffff',
              fontSize: '14px',
              fontFamily: 'monospace',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              zIndex: 1000,
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <span>Reset</span>
          </div>
        )}
        
      </div>
      </div>
      </div>

    </div>
  );
}


export default TimelineChart;