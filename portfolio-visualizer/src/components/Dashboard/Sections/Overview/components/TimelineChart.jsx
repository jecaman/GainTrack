import React, { useRef, useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Chart, TimeScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

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
      duration: 1200 // 1.2 segundos - más lento
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
    
    // Usar el índice almacenado desde onHover
    if (chart.hoveredDataIndex === undefined) return;
    
    const dataIndex = chart.hoveredDataIndex;
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
    if (!chart._animationFrameId) {
      chart._animationFrameId = requestAnimationFrame(() => {
        chart._animationFrameId = null;
        chart.update('none');
      });
    }
    
    ctx.save();
    
    // Línea vertical eliminada para evitar bug visual
    
    // Punto luminoso moderado
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = pointColor;
    ctx.fill();
    
    // Borde del punto
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Resplandor suave alrededor del punto
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
    glowGradient.addColorStop(0, `rgba(${waveColor}, 0.6)`);
    glowGradient.addColorStop(0.6, `rgba(${waveColor}, 0.2)`);
    glowGradient.addColorStop(1, `rgba(${waveColor}, 0)`);
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
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
      
      ctx.font = 'bold 16px "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Source Code Pro", monospace';
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
        chart.update('none');
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
    
    // Terminar animación si se completó
    if (progress >= 1) {
      animation.isAnimating = false;
      if (animation.animationFrame) {
        cancelAnimationFrame(animation.animationFrame);
        animation.animationFrame = null;
      }
    }
  }
};
// Plugin para dividir línea en activa/futura
const splitLinePlugin = {
  id: 'splitLine',
  afterDraw(chart) {
    const { ctx, data, scales } = chart;
    const activeElements = chart.getActiveElements();
    
    if (activeElements.length === 0) return;
    
    // Obtener el índice del punto activo
    const activeIndex = activeElements[0].index;
    
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
Chart.register(hoverPlugin, splitLinePlugin);

const TimelineChart = ({ portfolioData, theme, showApplyPopup, setShowApplyPopup, startDate: externalStartDate, endDate: externalEndDate, setStartDate: setExternalStartDate, setEndDate: setExternalEndDate }) => {
  // Constantes de estilo reutilizables
  const COLORS = {
    HOVER_LIGHT: 'rgba(255, 255, 255, 0.12)',
    HOVER_DEFAULT: 'rgba(255, 255, 255, 0.08)',
    BACKGROUND_GLASS: 'rgba(255, 255, 255, 0.1)',
    BACKGROUND_DARK: 'rgba(0, 0, 0, 0.4)'
  };

  // Función centralizada para formatear fechas
  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [showTotalInvested, setShowTotalInvested] = useState(false);
  const [viewMode, setViewMode] = useState('both'); // 'both', 'balance'
  const [periodMode, setPeriodMode] = useState('day'); // 'week', 'month', 'year', 'day'
  const [startDate, setStartDate] = useState(externalStartDate || '');
  const [endDate, setEndDate] = useState(externalEndDate || '');
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [processedTimelineData, setProcessedTimelineData] = useState([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomDates, setZoomDates] = useState({ start: null, end: null });
  const [isDragging, setIsDragging] = useState(false);
  
  const chartRef = useRef(null);
  
  // Cleanup del chart al desmontar el componente o cuando cambien las dependencias críticas
  useEffect(() => {
    return () => {
      if (chartRef.current && chartRef.current.destroy) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);
  
  const pendingDatesUpdate = useRef(null); // Fechas pendientes de actualizar
  const updateDatesTimer = useRef(null); // Timer para actualizar fechas
  
  
  
  
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

  // Función para obtener datos filtrados por el rango de fechas actual
  const getFilteredTimelineData = () => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) return [];
    
    if (!startDate || !endDate) return portfolioData.timeline;
    
    const [startDay, startMonth, startYear] = startDate.split('/');
    const [endDay, endMonth, endYear] = endDate.split('/');
    const startDateObj = new Date(startYear, startMonth - 1, startDay);
    const endDateObj = new Date(endYear, endMonth - 1, endDay);
    
    return portfolioData.timeline.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDateObj && entryDate <= endDateObj;
    });
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
      const entryDate = new Date(entry.date);
      const [startDay, startMonth, startYear] = simulatedDateRange.startDate.split('/');
      const [endDay, endMonth, endYear] = simulatedDateRange.endDate.split('/');
      const startDateObj = new Date(startYear, startMonth - 1, startDay);
      const endDateObj = new Date(endYear, endMonth - 1, endDay);
      return entryDate >= startDateObj && entryDate <= endDateObj;
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
      // ALL siempre ejecuta reset completo, independientemente del estado actual
      const { defaultStartDate, defaultEndDate } = getDefaultDates();
      
      if (!defaultStartDate || !defaultEndDate) {
        return;
      }
      
      // Primero resetear zoom y estado
      if (chartRef.current) {
        chartRef.current.resetZoom();
      }
      setIsZoomed(false);
      
      // Marcar como cambio de filtro rápido y establecer fechas
      isQuickFilterChange.current = true;
      setStartDate(defaultStartDate);
      setEndDate(defaultEndDate);
      
      // Mostrar popup cuando se seleccione filtro rápido
      setShowApplyPopup(true);
      
      // Establecer el filtro ALL al final para que el botón de reset desaparezca
      setTimeout(() => {
        setActiveQuickFilter(range);
      }, 1);
    } else if (isFilterCompatible(range, periodMode)) {
      // Solo aplicar otros filtros si son compatibles
      const dateRange = getQuickDateRange(range);
      if (dateRange) {
        // Marcar que el cambio de fecha es por filtro rápido ANTES de cambiar las fechas
        isQuickFilterChange.current = true;
        
        setStartDate(dateRange.startDate);
        setEndDate(dateRange.endDate);
        setActiveQuickFilter(range);
        
        // Mostrar popup cuando se seleccione filtro rápido
        setShowApplyPopup(true);
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
    
    // Si no coincide con ningún filtro rápido, no activar ninguno
    if (!foundMatch) {
      setActiveQuickFilter(null);
    }
  }, [startDate, endDate, portfolioData]);
  
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
    if (externalStartDate && externalStartDate !== startDate) {
      setStartDate(externalStartDate);
    }
  }, [externalStartDate]);
  
  useEffect(() => {
    if (externalEndDate && externalEndDate !== endDate) {
      setEndDate(externalEndDate);
    }
  }, [externalEndDate]);
  
  // Sincronizar cambios locales con props externas (no durante drag)
  useEffect(() => {
    if (setExternalStartDate && startDate !== externalStartDate && !isDragging) {
      setExternalStartDate(startDate);
    }
  }, [startDate, isDragging]);
  
  useEffect(() => {
    if (setExternalEndDate && endDate !== externalEndDate && !isDragging) {
      setExternalEndDate(endDate);
    }
  }, [endDate, isDragging]);
  
  // Funciones para manejar el popup
  const showApplyToAllPopup = () => setShowApplyPopup(true);
  const hideApplyPopup = () => setShowApplyPopup(false);

  // Agregar estilos para la animación del popup y calendario
  React.useEffect(() => {
    if (!document.getElementById('popup-slide-animation')) {
      const style = document.createElement('style');
      style.id = 'popup-slide-animation';
      style.textContent = `
        @keyframes slideInFromBottom {
          0% {
            opacity: 0;
            transform: translateY(100%) scale(0.9);
          }
          60% {
            transform: translateY(-5%) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes calendarSlideIn {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .calendar-title-transition {
          transition: all 0.2s ease-out;
        }
        
        .calendar-content-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  
  // Referencias para acceder a las funciones de setState desde callbacks de Chart.js
  const setStartDateRef = useRef(setStartDate);
  const setEndDateRef = useRef(setEndDate);
  const chartRefForCallback = useRef(null);
  
  // Actualizar las referencias cuando cambien las funciones
  useEffect(() => {
    setStartDateRef.current = setStartDate;
    setEndDateRef.current = setEndDate;
    chartRefForCallback.current = chartRef.current;
  }, [setStartDate, setEndDate, chartRef.current]);


  // Inicializar fechas
  useEffect(() => {
    if (portfolioData?.timeline && portfolioData.timeline.length > 0) {
      const firstDate = new Date(portfolioData.timeline[0].date);
      const today = new Date(); // Fecha actual en lugar de última fecha de datos
      
      // Solo establecer si no están ya establecidas (para no sobrescribir selecciones del usuario)
      if (!startDate) setStartDate(formatDate(firstDate));
      if (!endDate) setEndDate(formatDate(today));
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

    let timelineData = [...portfolioData.timeline];

    // Filtrar por fechas si están definidas
    if (startDate || endDate) {
      timelineData = timelineData.filter(entry => {
        const entryDate = new Date(entry.date);
        let includeEntry = true;
        
        if (startDate) {
          const [startDay, startMonth, startYear] = startDate.split('/');
          const startDateObj = new Date(startYear, startMonth - 1, startDay);
          if (entryDate < startDateObj) {
            includeEntry = false;
          }
        }
        
        if (endDate && includeEntry) {
          const [endDay, endMonth, endYear] = endDate.split('/');
          const endDateObj = new Date(endYear, endMonth - 1, endDay, 23, 59, 59);
          if (entryDate > endDateObj) {
            includeEntry = false;
          }
        }
        
        return includeEntry;
      });
    }

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
  }, [portfolioData, startDate, endDate, periodMode]);

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
    const selectedDate = new Date(event.target.value);
    const formattedDate = selectedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    setStartDate(formattedDate);
    setShowStartCalendar(false);
    // Mostrar popup cuando se cambie la fecha
    setShowApplyPopup(true);
  };

  const handleEndDateChange = (event) => {
    const selectedDate = new Date(event.target.value);
    const formattedDate = selectedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    setEndDate(formattedDate);
    setShowEndCalendar(false);
    // Mostrar popup cuando se cambie la fecha
    setShowApplyPopup(true);
  };

  // Convertir fecha DD/MM/YYYY a YYYY-MM-DD para input date
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Función para obtener fechas por defecto
  const getDefaultDates = () => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) {
      return { defaultStartDate: '', defaultEndDate: '' };
    }
    
    const firstDate = new Date(portfolioData.timeline[0].date);
    const today = new Date();
    
    return {
      defaultStartDate: formatDate(firstDate),
      defaultEndDate: formatDate(today)
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
    
    const [startDay, startMonth, startYear] = startDateStr.split('/');
    const [endDay, endMonth, endYear] = endDateStr.split('/');
    
    const startDateObj = new Date(startYear, startMonth - 1, startDay);
    const endDateObj = new Date(endYear, endMonth - 1, endDay);
    
    return startDateObj <= endDateObj;
  };

  // Handle day selection in custom calendar
  const handleDayClick = (day) => {
    if (!day) return;
    
    // Validar que la fecha esté en el rango de datos disponibles
    if (!isValidDate(calendarDate.getFullYear(), calendarDate.getMonth(), day)) {
      return; // No permitir seleccionar fechas fuera del rango
    }
    
    const selectedDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    const formattedDate = selectedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    if (calendarType === 'start') {
      // Validar que fecha inicio no sea posterior a fecha fin
      if (endDate && !isValidRange(formattedDate, endDate)) {
        return; // No permitir fecha inicio posterior a fecha fin
      }
      
      setStartDate(formattedDate);
      
      // Transición suave al calendario de fin
      setIsTransitioning(true);
      setTimeout(() => {
        setCalendarType('end');
        // Establecer calendario en la fecha fin al abrir
        const dateToUse = endDate;
        if (dateToUse) {
          const [day, month, year] = dateToUse.split('/');
          setCalendarDate(new Date(year, month - 1, day));
        }
        // Mantener el calendario abierto para la transición suave
        setShowStartCalendar(true);
        setIsTransitioning(false);
      }, 150); // Optimized delay para transición suave
      
      // Mostrar popup cuando se seleccione fecha de inicio
      setShowApplyPopup(true);
      
    } else {
      // Validar que fecha fin no sea anterior a fecha inicio
      if (startDate && !isValidRange(startDate, formattedDate)) {
        return; // No permitir fecha fin anterior a fecha inicio
      }
      
      setEndDate(formattedDate);
      setShowStartCalendar(false); // Cerrar el calendario después de seleccionar fecha fin
      // Mostrar popup cuando se seleccione fecha de fin
      setShowApplyPopup(true);
      
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
      const [sDay, sMonth, sYear] = currentStartDate.split('/');
      startDateObj = new Date(sYear, sMonth - 1, sDay);
    }
    
    if (currentEndDate) {
      const [eDay, eMonth, eYear] = currentEndDate.split('/');
      endDateObj = new Date(eYear, eMonth - 1, eDay);
    }
    
    // PRIMERO verificar si es una fecha seleccionada (prioridad máxima)
    if (startDateObj && currentDate.getTime() === startDateObj.getTime()) {
      return 'selected';
    }
    
    if (endDateObj && currentDate.getTime() === endDateObj.getTime()) {
      return 'selected';
    }
    
    // Verificar si la fecha está fuera del rango de datos disponibles
    if (!isValidDate(currentYear, currentMonth, day)) {
      return 'disabled';
    }
    
    // Verificar validaciones de rango según el contexto (solo si no es fecha seleccionada)
    const formattedCurrentDate = currentDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
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
        return 'inRange';
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
    
    // Usar total_gain del backend (realized + unrealized gains)
    const profit = entry.total_gain !== undefined ? entry.total_gain :
                   entry.net_profit !== undefined ? entry.net_profit :
                   (marketValue - investedValue);
    const profitPct = investedValue > 0 ? ((profit / investedValue) * 100) : 0;
    
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };
    
    // Construir el contenido en una sola línea con estilos específicos y buen espaciado
    const profitColor = profit >= 0 ? '#22c55e' : '#ef4444';
    const profitTriangle = profit >= 0 ? '▲' : '▼';
    
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
      const profitLabel = (entry.total_gain !== undefined || entry.net_profit !== undefined) ? 'TOTAL P&L' : 'UNREALIZED P&L';
      content = `<span style="color: #ffffff; font-size: 20px; font-weight: 400; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; vertical-align: baseline;">${dateFormat}</span>&nbsp;&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: 22px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; vertical-align: baseline;">${profitLabel}</span>&nbsp;&nbsp;<span style="color: ${profitColor}; font-size: 26px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; vertical-align: baseline;">${profit >= 0 ? '+' : '-'}${formatCurrencyEuroAfter(profit)}</span><span style="color: ${profitColor}; font-size: 18px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; vertical-align: top; position: relative; top: -2px;">&nbsp;${profitTriangle}</span><span style="color: ${profitColor}; font-size: 18px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; vertical-align: baseline; position: relative; top: 0px;">${Math.abs(profitPct).toFixed(1)}%</span>`;
    } else {
      // Full View - mostrar portfolio value primero
      content = `<span style="color: #ffffff; font-size: 20px; font-weight: 400; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; vertical-align: baseline;">${dateFormat}</span>&nbsp;&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: 22px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; vertical-align: baseline;">PORTFOLIO VALUE</span>&nbsp;&nbsp;<span style="font-size: 26px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; vertical-align: baseline;">${formatCurrencyEuroAfter(marketValue)}</span>`;
    }
    
    if (showTotalInvested && viewMode === 'both') {
      // Determinar el tipo de profit mostrado basado en datos disponibles
      const profitLabel = (entry.total_gain !== undefined || entry.net_profit !== undefined) ? 'TOTAL GAINS' : 'UNREALIZED GAINS';
      content += `&nbsp;&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: 22px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; vertical-align: baseline;">COST BASIS</span>&nbsp;&nbsp;<span style="font-size: 26px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; vertical-align: baseline;">${formatCurrencyEuroAfter(investedValue)}</span>&nbsp;&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: 22px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; vertical-align: baseline;">${profitLabel}</span>&nbsp;&nbsp;<span style="color: ${profitColor}; font-size: 26px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; vertical-align: baseline;">${profit >= 0 ? '+' : '-'}${formatCurrencyEuroAfter(profit)}</span><span style="color: ${profitColor}; font-size: 18px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; vertical-align: top; position: relative; top: -2px;">&nbsp;${profitTriangle}</span><span style="color: ${profitColor}; font-size: 18px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; vertical-align: baseline; position: relative; top: 0px;">${Math.abs(profitPct).toFixed(1)}%</span>`;
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
        width: 100%;
        display: flex;
        align-items: baseline;
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
        font-size: 22px;
        font-weight: 700;
        opacity: 1;
        transform: scale(1);
        letter-spacing: 0.3px;
        line-height: 1;
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
    if (!chart) return;

    const canvas = chart.canvas;
    
    const handleMouseMove = (event) => {
      // No hacer nada si se está haciendo drag
      if (isDragging) return;
      
      // Throttle dinámico basado en complejidad
      if (chart._mouseThrottle) return;
      chart._mouseThrottle = true;
      
      // Throttling más agresivo si hay menos datasets activos
      const activeDatasets = chart.data.datasets.filter(d => !d.hidden && !d.skipDuringMouseMove).length;
      const throttleTime = activeDatasets <= 2 ? 0 : 2; // Sin throttle para pocos datasets
      
      setTimeout(() => {
        chart._mouseThrottle = false;
      }, throttleTime);

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Verificar que estemos dentro del área del gráfico
      if (!chart.chartArea) return;
      
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = x * scaleX;
      const canvasY = y * scaleY;
      
      if (canvasX < chart.chartArea.left || canvasX > chart.chartArea.right || 
          canvasY < chart.chartArea.top || canvasY > chart.chartArea.bottom) {
        // Fuera del área del gráfico
        const tooltipArea = document.querySelector('#tooltip-area');
        if (tooltipArea) {
          tooltipArea.innerHTML = renderTooltipContent(null, getDataForTooltip());
        }
        if (chart.hoveredDataIndex !== undefined) {
          chart.hoveredDataIndex = undefined;
          
          // Restaurar solo las líneas principales, las áreas ya están completas
          const portfolioDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value' || d.label === 'Total P&L');
          const costBasisDataset = chart.data.datasets.find(d => d.label === 'Cost Basis');
          
          if (portfolioDataset && portfolioDataset.originalData) {
            portfolioDataset.data = [...portfolioDataset.originalData];
          }
          
          if (costBasisDataset && costBasisDataset.originalData) {
            costBasisDataset.data = [...costBasisDataset.originalData];
          }
          
          chart.update('none');
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
        const distance = Math.abs(point.x - canvasX);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });
      
      if (closestIndex >= 0) {
        const tooltipArea = document.querySelector('#tooltip-area');
        if (tooltipArea) {
          tooltipArea.innerHTML = renderTooltipContent(closestIndex, getDataForTooltip());
        }
        // Solo actualizar si el índice cambió
        if (chart.hoveredDataIndex !== closestIndex) {
          chart.hoveredDataIndex = closestIndex;
          
          // Actualizar solo la línea principal, mantener áreas completas
          const portfolioDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value' || d.label === 'Total P&L');
          const costBasisDataset = chart.data.datasets.find(d => d.label === 'Cost Basis');
          
          // Solo cortar las líneas principales, no las áreas
          if (portfolioDataset && portfolioDataset.originalData) {
            portfolioDataset.data = portfolioDataset.originalData.slice(0, closestIndex + 1).concat(
              new Array(portfolioDataset.originalData.length - closestIndex - 1).fill(null)
            );
          }
          
          if (costBasisDataset && costBasisDataset.originalData && !costBasisDataset.hidden) {
            costBasisDataset.data = costBasisDataset.originalData.slice(0, closestIndex + 1).concat(
              new Array(costBasisDataset.originalData.length - closestIndex - 1).fill(null)
            );
          }
          
          // Las áreas se mantienen completas siempre
          
          chart.update('none');
        }
      }
    };

    const handleMouseLeave = () => {
      const tooltipArea = document.querySelector('#tooltip-area');
      if (tooltipArea) {
        tooltipArea.innerHTML = renderTooltipContent(null, getDataForTooltip());
      }
      
      // Usar timeout para asegurar que la animación funcione tanto para movimiento gradual como rápido
      setTimeout(() => {
        if (chart.hoveredDataIndex !== undefined) {
          chart.hoveredDataIndex = undefined;
          
          // Restaurar solo las líneas principales, las áreas ya están completas
          const portfolioDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value' || d.label === 'Total P&L');
          const costBasisDataset = chart.data.datasets.find(d => d.label === 'Cost Basis');
          
          if (portfolioDataset && portfolioDataset.originalData) {
            portfolioDataset.data = [...portfolioDataset.originalData];
          }
          
          if (costBasisDataset && costBasisDataset.originalData) {
            costBasisDataset.data = [...costBasisDataset.originalData];
          }
          
          chart.update('none');
        }
      }, 10); // Pequeño delay para asegurar que el estado se procese correctamente
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [portfolioData, processedTimelineData, viewMode, showTotalInvested, periodMode, isDragging]);

  // Manejar estado de dragging para tooltip
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const canvas = chart.canvas;
    if (!canvas) return;

    const handleMouseDown = () => {
      setIsDragging(true);
      chart.isDragging = true;
      
      // No resetear el tooltip - mantenerlo tal como está
      // Solo restaurar las líneas sin delay para evitar efectos visuales bruscos
      if (chart.hoveredDataIndex !== undefined) {
        chart.hoveredDataIndex = undefined;
        
        // Restaurar solo las líneas principales, las áreas ya están completas
        const portfolioDataset = chart.data.datasets.find(d => d.label === 'Portfolio Value' || d.label === 'Total P&L');
        const costBasisDataset = chart.data.datasets.find(d => d.label === 'Cost Basis');
        
        if (portfolioDataset && portfolioDataset.originalData) {
          portfolioDataset.data = [...portfolioDataset.originalData];
        }
        
        if (costBasisDataset && costBasisDataset.originalData) {
          costBasisDataset.data = [...costBasisDataset.originalData];
        }
        
        chart.update('none');
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      chart.isDragging = false;
      chart.update('none');
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [chartRef.current]);
  
  // Check if using default date range
  const { defaultStartDate, defaultEndDate } = getDefaultDates();
  const isUsingDefaultRange = (startDate === defaultStartDate && endDate === defaultEndDate);
  
  // Forzar re-evaluación del botón de reset después de cambios de zoom
  useEffect(() => {
    // Esto fuerza una actualización para mostrar/ocultar el botón reset
  }, [isZoomed, startDate, endDate, defaultStartDate, defaultEndDate]);
  
  
  // Create Timeline Chart Data with conditional coloring
  const createTimelineData = () => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) {
      return null;
    }

    let timelineData = portfolioData.timeline;
    
    // Filter data based on selected date range (only if not using default range)
    if ((startDate || endDate) && !isUsingDefaultRange) {
      timelineData = timelineData.filter(entry => {
        const entryDate = new Date(entry.date);
        let includeEntry = true;
        
        if (startDate) {
          const [startDay, startMonth, startYear] = startDate.split('/');
          const startDateObj = new Date(startYear, startMonth - 1, startDay);
          if (entryDate < startDateObj) {
            includeEntry = false;
          }
        }
        
        if (endDate && includeEntry) {
          const [endDay, endMonth, endYear] = endDate.split('/');
          // Incluir todo el día de la fecha fin (hasta las 23:59:59)
          const endDateObj = new Date(endYear, endMonth - 1, endDay, 23, 59, 59);
          if (entryDate > endDateObj) {
            includeEntry = false;
          }
        }
        
        return includeEntry;
      });
    }

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
      return value >= invested ? '#22c55e' : '#ef4444'; // Green if profit, red if loss
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
        
        for (let i = 0; i < values.length; i++) {
          newValues.push(values[i]);
          newLabels.push(inputLabels[i]);
          
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
              
              // Punto exacto del cruce  
              newValues.push(0);
              newLabels.push(zeroCrossingDate);
              
              // Punto después del cruce
              newValues.push(next > 0 ? 0.001 : -0.001);
              newLabels.push(zeroCrossingDate);
            }
          }
        }
        
        return { values: newValues, labels: newLabels };
      };
      
      // Aplicar interpolación mejorada - agregar más puntos de corte
      const interpolated = interpolateZeroCrossings(balanceValues, baseLabels);
      const interpolatedBalanceValues = interpolated.values;
      
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
        pointRadius: 0,
        borderColor: 'transparent',
        borderWidth: 0,
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(0, 255, 136, 0.4)');
          gradient.addColorStop(0.4, 'rgba(0, 255, 136, 0.25)');
          gradient.addColorStop(0.8, 'rgba(0, 255, 136, 0.1)');
          gradient.addColorStop(1, 'rgba(0, 255, 136, 0.05)');
          
          return gradient;
        },
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
          backgroundColor: false // Deshabilitar animación de gradiente en reset
        }
      });

      // Área negativa (roja) - solo muestra datos cuando son <= 0  
      datasets.push({
        label: 'Negative P&L Area',
        data: negativeData,
        pointRadius: 0,
        borderColor: 'transparent', 
        borderWidth: 0,
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(255, 68, 68, 0.4)');
          gradient.addColorStop(0.4, 'rgba(255, 68, 68, 0.25)');
          gradient.addColorStop(0.8, 'rgba(255, 68, 68, 0.1)');
          gradient.addColorStop(1, 'rgba(255, 68, 68, 0.05)');
          
          return gradient;
        },
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
          backgroundColor: false // Deshabilitar animación de gradiente en reset
        }
      });
      
      // Línea principal (con efecto progresivo) - estilo copiado de Full View
      datasets.push({
        label: 'Total P&L',
        data: interpolatedBalanceValues,
        originalData: [...interpolatedBalanceValues], // Para el efecto de línea progresiva
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
        borderColor: '#10d56e', // Color base - los segmentos manejarán el color real
        backgroundColor: 'transparent', // Sin área de relleno
        fill: false, // No fill para este dataset
        tension: 0.15, // Igual que Full View pero un poco menos suave
        pointHoverRadius: function(context) {
          const value = interpolatedBalanceValues[context.dataIndex];
          const isZeroCrossing = value === 0;
          return isZeroCrossing ? 0 : 5; // Hover más grande para puntos reales
        },
        pointBackgroundColor: function(context) {
          const value = interpolatedBalanceValues[context.dataIndex];
          const isZeroCrossing = value === 0;
          if (isZeroCrossing) return 'transparent';
          return value >= 0 ? '#10d56e' : '#ef4444';
        },
        pointBorderColor: function(context) {
          const value = interpolatedBalanceValues[context.dataIndex];
          const isZeroCrossing = value === 0;
          if (isZeroCrossing) return 'transparent';
          return value >= 0 ? '#10d56e' : '#ef4444';
        },
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        borderWidth: 4, // Más grueso como Full View
        order: 1, // Render encima del área
        pointStyle: 'circle',
        segment: {
          borderColor: function(ctx) {
            const startIndex = ctx.p0DataIndex;
            const endIndex = ctx.p1DataIndex;
            const startValue = interpolatedBalanceValues[startIndex];
            const endValue = interpolatedBalanceValues[endIndex];
            
            // Usar solo el valor final del segmento para evitar cambios durante transiciones
            return endValue >= 0 ? '#10d56e' : '#ff4757';
          }
        }
      });
    } else {
      // Modo normal: líneas con sombreado simple pero visible
      
      // Cost Basis Shadow (área) - siempre completa cuando está visible
      if (showTotalInvested) {
        datasets.push({
          label: 'Cost Basis Shadow',
          data: investedValues, // Siempre datos completos
          borderColor: 'transparent', // Sin línea
          borderWidth: 0,
          backgroundColor: function(context) {
            // Área blanca con degradado más visible para Total Invested
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return 'transparent';
            
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)'); // Más intenso arriba
            gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.22)'); // Transición más visible
            gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.12)'); // Más color en el medio
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)'); // Más visible abajo
            return gradient;
          },
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
            backgroundColor: false // Deshabilitar animación de gradiente en reset
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
      }
      
      // Dataset para el área entre las líneas - completamente deshabilitado para evitar interferencias
      datasets.push({
        label: 'P&L Area',
        data: portfolioValues,
        backgroundColor: 'transparent', // Completamente transparente
        fill: false, // No rellenar
        borderColor: 'transparent',
        borderWidth: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        tension: 0.5,
        order: 2,
        hidden: true // Ocultar completamente
      });
      
      // Dataset para la sombra (área) - siempre completa, datos fijos para evitar líneas fantasma
      datasets.push({
        label: 'Portfolio Shadow',
        data: [...portfolioValues], // Copia fija de los datos completos
        borderColor: 'transparent', // Sin línea visible
        borderWidth: 0,
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return 'transparent';
          
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(0, 255, 136, 0.4)');
          gradient.addColorStop(0.4, 'rgba(0, 255, 136, 0.25)');
          gradient.addColorStop(0.8, 'rgba(0, 255, 136, 0.1)');
          gradient.addColorStop(1, 'rgba(0, 255, 136, 0.05)');
          return gradient;
        },
        fill: 'origin',
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        order: 2, // Render detrás de la línea
        skipDuringMouseMove: true, // Marcar para no modificar durante mouse move
        animation: {
          backgroundColor: false // Deshabilitar animación de gradiente en reset
        }
      });

      // Dataset para la línea - se corta dinámicamente
      datasets.push({
        label: 'Portfolio Value',
        data: portfolioValues, // Los datos se actualizarán dinámicamente
        originalData: [...portfolioValues], // Copia de los datos originales
        borderColor: '#00ff88',
        backgroundColor: 'transparent', // Sin área de relleno
        fill: false, // No fill para este dataset
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        borderWidth: 4,
        order: 1, // Render encima de la sombra
        pointStyle: 'circle'
      });
    }


    return {
      labels,
      datasets
    };
  };

  const timelineData = createTimelineData();
  
  const getDynamicTimelineOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500,
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
            },
            mode: 'x',
            onZoomComplete: function({chart}) {
              if (chart && chart.scales && chart.scales.x) {
                const xScale = chart.scales.x;
                const startDate = new Date(xScale.min);
                const endDate = new Date(xScale.max);
                
                const formatDate = (date) => {
                  const day = date.getDate().toString().padStart(2, '0');
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const year = date.getFullYear();
                  return `${day}/${month}/${year}`;
                };
                
                const newStartDate = formatDate(startDate);
                const newEndDate = formatDate(endDate);
                
                setStartDate(newStartDate);
                setEndDate(newEndDate);
                setIsZoomed(true);
                
                // Mostrar popup cuando se haga zoom
                setShowApplyPopup(true);
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
              family: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
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
        height: "500px",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.textSecondary,
        fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace"
      }}>
        No timeline data available
      </div>
    );
  }

  return (
    <div style={{
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
          left: '0',
          right: '0', // Hasta el borde derecho real
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
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
            border: '2px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
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
                    : 'rgba(255, 255, 255, 0.08)',
                  border: viewMode === 'both' 
                    ? '2px solid rgba(34, 197, 94, 0.7)' 
                    : '2px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  color: viewMode === 'both' ? '#ffffff' : 'rgba(245, 245, 245, 0.8)',
                  fontSize: '15px',
                  fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease-out',
                  backdropFilter: 'blur(10px)',
                  boxShadow: viewMode === 'both' 
                    ? '0 4px 20px rgba(34, 197, 94, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'both') {
                    e.target.style.color = '#ffffff';
                    e.target.style.background = COLORS.HOVER_LIGHT;
                    e.target.style.boxShadow = '0 3px 12px rgba(255, 255, 255, 0.08)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'both') {
                    e.target.style.color = 'rgba(245, 245, 245, 0.8)';
                    e.target.style.background = COLORS.HOVER_DEFAULT;
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }
                }}
              >
                Full View
              </button>
              
              <button
                onClick={() => setViewMode('balance')}
                style={{
                  background: viewMode === 'balance' 
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.5), rgba(16, 185, 129, 0.6))' 
                    : 'rgba(255, 255, 255, 0.08)',
                  border: viewMode === 'balance' 
                    ? '2px solid rgba(34, 197, 94, 0.7)' 
                    : '2px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  color: viewMode === 'balance' ? '#ffffff' : 'rgba(245, 245, 245, 0.8)',
                  fontSize: '15px',
                  fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease-out',
                  backdropFilter: 'blur(10px)',
                  boxShadow: viewMode === 'balance' 
                    ? '0 4px 20px rgba(34, 197, 94, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'balance') {
                    e.target.style.color = '#ffffff';
                    e.target.style.background = COLORS.HOVER_LIGHT;
                    e.target.style.boxShadow = '0 3px 12px rgba(255, 255, 255, 0.08)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'balance') {
                    e.target.style.color = 'rgba(245, 245, 245, 0.8)';
                    e.target.style.background = COLORS.HOVER_DEFAULT;
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }
                }}
              >
                P&L View
              </button>
            </div>
            
            {/* Botón para mostrar/ocultar Total Invested - con transición suave */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              opacity: viewMode === 'both' ? 1 : 0,
              width: viewMode === 'both' ? '140px' : '0px',
              overflow: 'hidden',
              transition: 'all 0.25s ease-out',
              pointerEvents: viewMode === 'both' ? 'auto' : 'none',
              marginRight: '10px'
            }}>
              <button
                onClick={handleInvestedToggle}
                style={{
                  background: showTotalInvested 
                    ? 'rgba(255, 255, 255, 0.15)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: showTotalInvested 
                    ? '1px solid rgba(255, 255, 255, 0.3)' 
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  color: showTotalInvested ? '#ffffff' : 'rgba(245, 245, 245, 0.6)',
                  fontSize: '15px',
                  fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
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
                  e.target.style.background = showTotalInvested 
                    ? 'rgba(255, 255, 255, 0.18)' 
                    : 'rgba(255, 255, 255, 0.1)';
                  e.target.style.color = '#ffffff';
                  e.target.style.boxShadow = '0 3px 12px rgba(255, 255, 255, 0.12)';
                  e.target.style.borderColor = showTotalInvested 
                    ? 'rgba(255, 255, 255, 0.4)' 
                    : 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = showTotalInvested 
                    ? 'rgba(255, 255, 255, 0.15)' 
                    : 'rgba(255, 255, 255, 0.05)';
                  e.target.style.color = showTotalInvested ? '#ffffff' : 'rgba(245, 245, 245, 0.6)';
                  e.target.style.boxShadow = showTotalInvested 
                    ? '0 3px 12px rgba(255, 255, 255, 0.1)' 
                    : '0 1px 4px rgba(0, 0, 0, 0.1)';
                  e.target.style.borderColor = showTotalInvested 
                    ? 'rgba(255, 255, 255, 0.3)' 
                    : 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: showTotalInvested 
                    ? 'linear-gradient(45deg, rgba(200, 200, 200, 1), rgba(255, 255, 255, 0.9))' 
                    : 'rgba(120, 120, 120, 0.5)',
                  transition: 'all 0.3s ease',
                  boxShadow: showTotalInvested 
                    ? '0 2px 8px rgba(255, 255, 255, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5)' 
                    : 'none'
                }}></span>
                Cost Basis
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
                    : 'rgba(255, 255, 255, 0.06)',
                  border: periodMode === 'day' 
                    ? '1px solid rgba(34, 197, 94, 0.8)' 
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: periodMode === 'day' ? '#ffffff' : 'rgba(245, 245, 245, 0.8)',
                  fontSize: '13px',
                  fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)'
                }}
                onMouseEnter={(e) => {
                  if (periodMode !== 'day') {
                    e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (periodMode !== 'day') {
                    e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.target.style.color = 'rgba(245, 245, 245, 0.8)';
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
                      : 'rgba(255, 255, 255, 0.06)',
                  border: periodMode === 'week' 
                    ? '1px solid rgba(34, 197, 94, 0.8)' 
                    : (!canAggregate('week') || !isAggregationCompatible('week', activeQuickFilter))
                      ? '1px solid rgba(255, 255, 255, 0.04)' 
                      : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: periodMode === 'week' 
                    ? '#ffffff' 
                    : (!canAggregate('week') || !isAggregationCompatible('week', activeQuickFilter))
                      ? 'rgba(245, 245, 245, 0.3)' 
                      : 'rgba(245, 245, 245, 0.8)',
                  fontSize: '13px',
                  fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                  fontWeight: '700',
                  cursor: (!canAggregate('week') || !isAggregationCompatible('week', activeQuickFilter)) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)',
                  opacity: (!canAggregate('week') || !isAggregationCompatible('week', activeQuickFilter)) ? 0.4 : 1
                }}
                onMouseEnter={(e) => {
                  if (periodMode !== 'week' && canAggregate('week') && isAggregationCompatible('week', activeQuickFilter)) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (periodMode !== 'week' && canAggregate('week') && isAggregationCompatible('week', activeQuickFilter)) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.target.style.color = 'rgba(245, 245, 245, 0.8)';
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
                      : 'rgba(255, 255, 255, 0.06)',
                  border: periodMode === 'month' 
                    ? '1px solid rgba(34, 197, 94, 0.8)' 
                    : (!canAggregate('month') || !isAggregationCompatible('month', activeQuickFilter))
                      ? '1px solid rgba(255, 255, 255, 0.04)' 
                      : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: periodMode === 'month' 
                    ? '#ffffff' 
                    : (!canAggregate('month') || !isAggregationCompatible('month', activeQuickFilter))
                      ? 'rgba(245, 245, 245, 0.3)' 
                      : 'rgba(245, 245, 245, 0.8)',
                  fontSize: '13px',
                  fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                  fontWeight: '700',
                  cursor: (!canAggregate('month') || !isAggregationCompatible('month', activeQuickFilter)) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)',
                  opacity: (!canAggregate('month') || !isAggregationCompatible('month', activeQuickFilter)) ? 0.4 : 1
                }}
                onMouseEnter={(e) => {
                  if (periodMode !== 'month' && canAggregate('month') && isAggregationCompatible('month', activeQuickFilter)) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (periodMode !== 'month' && canAggregate('month') && isAggregationCompatible('month', activeQuickFilter)) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.target.style.color = 'rgba(245, 245, 245, 0.8)';
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
                      : 'rgba(255, 255, 255, 0.06)',
                  border: periodMode === 'year' 
                    ? '1px solid rgba(34, 197, 94, 0.8)' 
                    : (!canAggregate('year') || !isAggregationCompatible('year', activeQuickFilter))
                      ? '1px solid rgba(255, 255, 255, 0.04)' 
                      : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: periodMode === 'year' 
                    ? '#ffffff' 
                    : (!canAggregate('year') || !isAggregationCompatible('year', activeQuickFilter))
                      ? 'rgba(245, 245, 245, 0.3)' 
                      : 'rgba(245, 245, 245, 0.8)',
                  fontSize: '13px',
                  fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                  fontWeight: '700',
                  cursor: (!canAggregate('year') || !isAggregationCompatible('year', activeQuickFilter)) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)',
                  opacity: (!canAggregate('year') || !isAggregationCompatible('year', activeQuickFilter)) ? 0.4 : 1
                }}
                onMouseEnter={(e) => {
                  if (periodMode !== 'year' && canAggregate('year') && isAggregationCompatible('year', activeQuickFilter)) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (periodMode !== 'year' && canAggregate('year') && isAggregationCompatible('year', activeQuickFilter)) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.target.style.color = 'rgba(245, 245, 245, 0.8)';
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
                  color: '#f5f5f5', 
                  fontWeight: '600',
                  fontSize: '18px'
                }}>Portfolio Value</span>
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
                  color: '#f5f5f5', 
                  fontWeight: '600',
                  fontSize: '18px'
                }}>Cost Basis</span>
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
                  color: '#f5f5f5', 
                  fontWeight: '600',
                  fontSize: '18px'
                }}>Total P&L</span>
              </div>
            )}
            
          </div>
          
          {/* Botones de fechas a la derecha */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '0px',
            display: 'flex',
            alignItems: 'center',
            gap: '0px'
          }}>
            {/* Botón fecha inicio */}
            <div style={{ position: 'relative' }} data-calendar id="start-date-container">
              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '12px 14px',
                color: '#ffffff',
                fontSize: '15px',
                fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.25s ease-out',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.background = COLORS.HOVER_LIGHT;
                e.target.style.boxShadow = '0 3px 12px rgba(255, 255, 255, 0.08)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.background = COLORS.HOVER_DEFAULT;
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
              onClick={() => {
                setCalendarType('start');
                const dateToUse = startDate;
                if (dateToUse) {
                  const [day, month, year] = dateToUse.split('/');
                  setCalendarDate(new Date(year, month - 1, day));
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
                <span id="timeline-start-date-display">{startDate}</span>
                {(() => {
                  const { defaultStartDate } = getDefaultDates();
                  const currentStartDate = startDate;
                  return currentStartDate && currentStartDate !== defaultStartDate && (
                    <div style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-3px',
                      width: '10px',
                      height: '10px',
                      background: '#00ff88',
                      borderRadius: '50%',
                      border: '1px solid rgba(15, 15, 15, 0.8)',
                      boxShadow: '0 0 6px rgba(0, 255, 136, 0.5)',
                      pointerEvents: 'none'
                    }}></div>
                  );
                })()}
              </div>
              
              {/* Calendario emergente para fecha inicio */}
              {showStartCalendar && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '8px',
                  zIndex: 1000,
                  background: 'rgba(15, 15, 15, 0.98)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  padding: '20px',
                  backdropFilter: 'blur(30px)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
                  minWidth: '420px',
                  width: '420px',
                  minHeight: '380px',
                  overflow: 'hidden',
                  transform: 'scale(1)',
                  opacity: 1,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s ease-out, opacity 0.25s ease-out',
                  animation: 'calendarSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  {/* Calendar Title */}
                  <div className="calendar-title-transition" style={{
                    textAlign: 'center',
                    marginBottom: '15px',
                    color: '#ffffff',
                    fontSize: '20px',
                    fontWeight: '700',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingBottom: '10px',
                    opacity: isTransitioning ? 0.5 : 1,
                    transform: isTransitioning ? 'scale(0.95)' : 'scale(1)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {calendarType === 'start' ? 'START DATE' : 'END DATE'}
                  </div>

                  {/* Calendar Header - Redesign minimalista */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '20px',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace"
                  }}>
                    {/* Navigation with arrows */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      color: '#ffffff',
                      fontSize: '18px',
                      fontWeight: '500',
                      fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace"
                    }}>
                      {/* Month navigation */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        flex: '1',
                        position: 'relative'
                      }}>
                        <span 
                          onClick={() => !isMonthNavigationDisabled(-1) && changeMonth(-1)}
                          style={{
                            cursor: isMonthNavigationDisabled(-1) ? 'not-allowed' : 'pointer',
                            userSelect: 'none',
                            opacity: isMonthNavigationDisabled(-1) ? 0.6 : 1.0,
                            transition: 'opacity 0.2s ease',
                            fontSize: '16px',
                            fontWeight: '500',
                            color: isMonthNavigationDisabled(-1) ? 'rgba(160,160,160,0.7)' : 'rgba(255,255,255,1.0)',
                            textAlign: 'right',
                            minWidth: '40px'
                          }}
                          onMouseEnter={(e) => !isMonthNavigationDisabled(-1) && (e.target.style.opacity = 1)}
                          onMouseLeave={(e) => !isMonthNavigationDisabled(-1) && (e.target.style.opacity = 0.7)}
                        >
                          {new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1).toLocaleDateString('en-US', { month: 'long' }).substring(0, 3)}
                        </span>
                        <span style={{ 
                          fontWeight: '600',
                          color: '#ffffff',
                          textAlign: 'center',
                          flex: '1',
                          fontSize: '18px'
                        }}>
                          {calendarDate.toLocaleDateString('en-US', { month: 'long' })}
                        </span>
                        <span 
                          onClick={() => !isMonthNavigationDisabled(1) && changeMonth(1)}
                          style={{
                            cursor: isMonthNavigationDisabled(1) ? 'not-allowed' : 'pointer',
                            userSelect: 'none',
                            opacity: isMonthNavigationDisabled(1) ? 0.6 : 1.0,
                            transition: 'opacity 0.2s ease',
                            fontSize: '16px',
                            fontWeight: '500',
                            color: isMonthNavigationDisabled(1) ? 'rgba(160,160,160,0.7)' : 'rgba(255,255,255,1.0)',
                            textAlign: 'left',
                            minWidth: '40px'
                          }}
                          onMouseEnter={(e) => !isMonthNavigationDisabled(1) && (e.target.style.opacity = 1)}
                          onMouseLeave={(e) => !isMonthNavigationDisabled(1) && (e.target.style.opacity = 0.7)}
                        >
                          {new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1).toLocaleDateString('en-US', { month: 'long' }).substring(0, 3)}
                        </span>
                      </div>

                      {/* Divisor */}
                      <div style={{
                        width: '2px',
                        height: '30px',
                        background: 'rgba(255, 255, 255, 0.5)',
                        margin: '0 20px',
                        borderRadius: '1px'
                      }}></div>

                      {/* Year navigation */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        minWidth: '140px'
                      }}>
                        <span 
                          onClick={() => !isYearNavigationDisabled(-1) && changeYear(-1)}
                          style={{
                            cursor: isYearNavigationDisabled(-1) ? 'not-allowed' : 'pointer',
                            userSelect: 'none',
                            opacity: isYearNavigationDisabled(-1) ? 0.6 : 1.0,
                            transition: 'opacity 0.2s ease',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: isYearNavigationDisabled(-1) ? 'rgba(160,160,160,0.7)' : 'rgba(255,255,255,1.0)',
                            textAlign: 'right',
                            minWidth: '30px'
                          }}
                          onMouseEnter={(e) => !isYearNavigationDisabled(-1) && (e.target.style.opacity = 1)}
                          onMouseLeave={(e) => !isYearNavigationDisabled(-1) && (e.target.style.opacity = 0.7)}
                        >
                          {calendarDate.getFullYear() - 1}
                        </span>
                        <span style={{ 
                          fontWeight: '600',
                          color: '#ffffff',
                          minWidth: '50px',
                          textAlign: 'center',
                          fontSize: '18px'
                        }}>
                          {calendarDate.getFullYear()}
                        </span>
                        <span 
                          onClick={() => !isYearNavigationDisabled(1) && changeYear(1)}
                          style={{
                            cursor: isYearNavigationDisabled(1) ? 'not-allowed' : 'pointer',
                            userSelect: 'none',
                            opacity: isYearNavigationDisabled(1) ? 0.6 : 1.0,
                            transition: 'opacity 0.2s ease',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: isYearNavigationDisabled(1) ? 'rgba(160,160,160,0.7)' : 'rgba(255,255,255,1.0)',
                            textAlign: 'left',
                            minWidth: '30px'
                          }}
                          onMouseEnter={(e) => !isYearNavigationDisabled(1) && (e.target.style.opacity = 1)}
                          onMouseLeave={(e) => !isYearNavigationDisabled(1) && (e.target.style.opacity = 0.7)}
                        >
                          {calendarDate.getFullYear() + 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Días de la semana */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '6px', // Espacio optimizado
                    marginBottom: '16px', // Más espacio
                    fontSize: '16px', // Más grande
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} style={{ padding: '8px' }}>{day}</div>
                    ))}
                  </div>

                  {/* Grid de días */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '8px' // Más espacio
                  }}>
                    {generateCalendar(calendarDate.getFullYear(), calendarDate.getMonth()).map((day, index) => {
                      const dayState = getDayState(day, calendarDate.getFullYear(), calendarDate.getMonth());
                      
                      // Determinar colores según el estado
                      let backgroundColor = 'transparent';
                      
                      if (day) {
                        switch (dayState) {
                          case 'selected':
                            backgroundColor = 'rgba(34, 197, 94, 0.7)'; // Verde fuerte para días seleccionados
                            break;
                          case 'inRange':
                            backgroundColor = 'rgba(34, 197, 94, 0.3)'; // Verde suave para rango
                            break;
                          case 'disabled':
                            backgroundColor = 'rgba(80, 80, 80, 0.25)'; // Gris más visible para días deshabilitados
                            break;
                          case 'normal':
                          default:
                            backgroundColor = 'rgba(255, 255, 255, 0.1)'; // Color normal
                            break;
                        }
                      }
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleDayClick(day)}
                          disabled={!day || dayState === 'disabled'}
                          style={{
                            background: backgroundColor === 'rgba(34, 197, 94, 0.7)' ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.8), rgba(0, 200, 100, 0.6))' :
                                      backgroundColor === 'rgba(34, 197, 94, 0.3)' ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.35), rgba(0, 200, 100, 0.25))' :
                                      backgroundColor === 'rgba(80, 80, 80, 0.25)' ? 'linear-gradient(135deg, rgba(80, 80, 80, 0.15), rgba(60, 60, 60, 0.1))' :
                                      backgroundColor === 'rgba(255, 255, 255, 0.1)' ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))' : 'transparent',
                            border: dayState === 'selected' ? '2px solid rgba(0, 255, 136, 0.9)' : 
                                   dayState === 'inRange' ? '1px solid rgba(0, 255, 136, 0.4)' :
                                   dayState === 'disabled' ? '1px solid rgba(120, 120, 120, 0.6)' :
                                   day ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                            borderRadius: '14px',
                            color: day ? (dayState === 'disabled' ? 'rgba(180, 180, 180, 0.8)' : '#ffffff') : 'transparent',
                            padding: '12px',
                            cursor: day ? (dayState === 'disabled' ? 'not-allowed' : 'pointer') : 'default',
                            fontSize: '16px',
                            fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                            fontWeight: dayState === 'selected' ? '800' : '600',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            minHeight: '42px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: dayState === 'selected' ? '0 6px 20px rgba(34, 197, 94, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)' :
                                      dayState === 'inRange' ? '0 3px 12px rgba(34, 197, 94, 0.15)' :
                                      dayState === 'disabled' ? 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' :
                                      day ? '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.05)' : 'none',
                            opacity: dayState === 'disabled' ? 0.55 : 1
                          }}
                          onMouseEnter={day && dayState !== 'disabled' ? (e) => {
                            if (dayState !== 'selected' && dayState !== 'inRange') {
                              e.target.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.3))';
                              e.target.style.borderColor = 'rgba(34, 197, 94, 0.6)';
                            }
                            e.target.style.transform = 'scale(1.12)';
                            e.target.style.boxShadow = '0 8px 24px rgba(34, 197, 94, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.15)';
                            e.target.style.zIndex = '10';
                          } : undefined}
                          onMouseLeave={day && dayState !== 'disabled' ? (e) => {
                            const currentBackground = backgroundColor === 'rgba(34, 197, 94, 0.7)' ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.8), rgba(16, 185, 129, 0.6))' :
                                                    backgroundColor === 'rgba(34, 197, 94, 0.3)' ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.35), rgba(16, 185, 129, 0.25))' :
                                                    backgroundColor === 'rgba(255, 255, 255, 0.1)' ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))' : 'transparent';
                            e.target.style.background = currentBackground;
                            e.target.style.borderColor = dayState === 'selected' ? 'rgba(34, 197, 94, 0.9)' : 
                                                        dayState === 'inRange' ? 'rgba(34, 197, 94, 0.4)' :
                                                        'rgba(255, 255, 255, 0.08)';
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = dayState === 'selected' ? '0 6px 20px rgba(34, 197, 94, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)' :
                                                      dayState === 'inRange' ? '0 3px 12px rgba(34, 197, 94, 0.15)' :
                                                      '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.05)';
                            e.target.style.zIndex = 'auto';
                          } : undefined}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Action buttons */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginTop: '20px',
                    paddingTop: '15px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <button
                      onClick={() => {
                        // Destruir chart existente antes del reset para evitar conflictos
                        if (chartRef.current && chartRef.current.destroy) {
                          chartRef.current.destroy();
                          chartRef.current = null;
                        }
                        
                        if (calendarType === 'start') {
                          const { defaultStartDate } = getDefaultDates();
                          setStartDate(defaultStartDate);
                        } else {
                          const { defaultEndDate } = getDefaultDates();
                          setEndDate(defaultEndDate);
                        }
                        setShowStartCalendar(false);
                        
                        // Cancelar popup si está abierto
                        if (setShowApplyPopup) {
                          setShowApplyPopup(false);
                        }
                      }}
                      style={{
                        flex: '1',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '10px',
                        padding: '10px 16px',
                        color: 'rgba(239, 68, 68, 0.9)',
                        fontSize: '14px',
                        fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                        e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                        e.target.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        e.target.style.color = 'rgba(239, 68, 68, 0.9)';
                      }}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        setShowStartCalendar(false);
                      }}
                      style={{
                        flex: '1',
                        background: 'rgba(0, 255, 136, 0.1)',
                        border: '1px solid rgba(0, 255, 136, 0.3)',
                        borderRadius: '10px',
                        padding: '10px 16px',
                        color: 'rgba(0, 255, 136, 0.9)',
                        fontSize: '14px',
                        fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Línea divisora */}
            <div style={{
              width: '2px',
              height: '24px',
              background: 'rgba(255, 255, 255, 0.4)',
              margin: '0 8px',
              borderRadius: '1px'
            }}></div>
            
            {/* Botón fecha fin */}
            <div style={{ position: 'relative' }} data-calendar>
              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '12px 14px',
                color: '#ffffff',
                fontSize: '15px',
                fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.25s ease-out',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.background = COLORS.HOVER_LIGHT;
                e.target.style.boxShadow = '0 3px 12px rgba(255, 255, 255, 0.08)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.background = COLORS.HOVER_DEFAULT;
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
              onClick={() => {
                setCalendarType('end');
                const dateToUse = endDate;
                if (dateToUse) {
                  const [day, month, year] = dateToUse.split('/');
                  setCalendarDate(new Date(year, month - 1, day));
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
                <span id="timeline-end-date-display">{endDate}</span>
                {(() => {
                  const { defaultEndDate } = getDefaultDates();
                  const currentEndDate = endDate;
                  return currentEndDate && currentEndDate !== defaultEndDate && (
                    <div style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-3px',
                      width: '10px',
                      height: '10px',
                      background: '#00ff88',
                      borderRadius: '50%',
                      border: '1px solid rgba(15, 15, 15, 0.8)',
                      boxShadow: '0 0 6px rgba(0, 255, 136, 0.5)',
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
        alignItems: 'center'
      }}>
        <div id="tooltip-area" style={{ 
          minHeight: '40px', 
          flex: 1,
          position: 'relative',
          padding: '0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start'
        }}>
          {/* El tooltip se inicializará con el último día */}
        </div>
        
      </div>
      

      <div style={{
        height: '800px',
        width: '100%',
        marginLeft: '0',
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
            { key: 'all', label: 'ALL' },
            { key: '1y', label: '1Y' },
            { key: '6m', label: '6M' },
            { key: '3m', label: '3M' },
            { key: '1m', label: '1M' },
            { key: '1w', label: '1W' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleQuickFilter(key)}
              disabled={key !== 'all' && !isFilterCompatible(key, periodMode)}
              style={{
                background: activeQuickFilter === key 
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.6), rgba(16, 185, 129, 0.7))' 
                  : (key !== 'all' && !isFilterCompatible(key, periodMode))
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'rgba(255, 255, 255, 0.06)',
                border: activeQuickFilter === key 
                  ? '1px solid rgba(34, 197, 94, 0.8)' 
                  : (key !== 'all' && !isFilterCompatible(key, periodMode))
                    ? '1px solid rgba(255, 255, 255, 0.04)'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: activeQuickFilter === key 
                  ? '#ffffff' 
                  : (key !== 'all' && !isFilterCompatible(key, periodMode))
                    ? 'rgba(245, 245, 245, 0.3)'
                    : 'rgba(245, 245, 245, 0.8)',
                fontSize: '13px',
                fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                fontWeight: '700',
                cursor: (key !== 'all' && !isFilterCompatible(key, periodMode)) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(8px)',
                minWidth: '50px',
                textAlign: 'center',
                opacity: (key !== 'all' && !isFilterCompatible(key, periodMode)) ? 0.4 : 1
              }}
              onMouseEnter={(e) => {
                if (activeQuickFilter !== key && (key === 'all' || isFilterCompatible(key, periodMode))) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (activeQuickFilter !== key && (key === 'all' || isFilterCompatible(key, periodMode))) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.target.style.color = 'rgba(245, 245, 245, 0.8)';
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
        
        {/* Botón de reset de fechas - posicionado en margen derecho del gráfico */}
        {(!isUsingDefaultRange || isZoomed) && activeQuickFilter !== 'all' && !(activeQuickFilter === '1y' && isUsingDefaultRange) && (
          <div
            onClick={(e) => {
              // Añadir efecto visual de click
              e.target.style.transform = 'scale(0.95) translateY(0px)';
              e.target.style.transition = 'transform 0.1s ease-out';
              
              setTimeout(() => {
                e.target.style.transform = 'scale(1) translateY(-1px)';
                e.target.style.transition = 'transform 0.2s ease-out';
              }, 100);
              
              const { defaultStartDate, defaultEndDate } = getDefaultDates();
              
              // Resetear zoom si existe
              if (chartRef.current) {
                chartRef.current.resetZoom();
              }
              
              // Resetear fechas y estado
              isQuickFilterChange.current = true;
              setStartDate(defaultStartDate);
              setEndDate(defaultEndDate);
              setIsZoomed(false);
              setActiveQuickFilter('all');
              
              // Mostrar popup cuando se resetee
              setShowApplyPopup(true);
            }}
            style={{
              position: 'absolute',
              top: '-50px',
              right: '0px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(200, 200, 200, 0.08))',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#00ff88',
              fontSize: '14px',
              fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.25s ease-out',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(220, 220, 220, 0.15))';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(200, 200, 200, 0.08))';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.1)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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