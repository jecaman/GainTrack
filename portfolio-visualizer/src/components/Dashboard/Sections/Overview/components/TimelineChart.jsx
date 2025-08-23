import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Chart, TimeScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';

// Registrar escalas y plugins
Chart.register(TimeScale, LinearScale, PointElement, LineElement, Tooltip, Filler, zoomPlugin);

// Plugin de brillo personalizado con color dinámico
const glowPlugin = {
  id: 'customGlow',
  afterDraw(chart) {
    const { ctx } = chart;
    
    // Obtener elementos activos en hover
    const activeElements = chart.getActiveElements();
    
    if (activeElements.length > 0) {
      // Buscar el dataset con el order más alto (Market Value)
      let targetElement = activeElements[0];
      let highestOrder = -1;
      
      activeElements.forEach(el => {
        const dataset = chart.data.datasets[el.datasetIndex];
        const order = dataset.order || 0;
        
        if (order > highestOrder) {
          highestOrder = order;
          targetElement = el;
        }
      });
      
      const x = targetElement.element.x;
      const y = targetElement.element.y;
      const dataIndex = targetElement.index;
      
      // Determinar el color basado en los datos
      let pointColor = '#22c55e'; // Verde por defecto
      
      // Acceder a los datos para determinar profit/loss
      if (chart.config._config && chart.config._config.data && chart.config._config.data.datasets) {
        const datasets = chart.config._config.data.datasets;
        
        // Buscar dataset de Balance (P&L) para vista P&L
        const balanceDataset = datasets.find(d => d.label === 'Balance (P&L)');
        
        if (balanceDataset && dataIndex < balanceDataset.data.length) {
          const balanceValue = balanceDataset.data[dataIndex];
          // Verde si balance positivo, rojo si balance negativo
          pointColor = balanceValue >= 0 ? '#22c55e' : '#ef4444';
        } else {
          // Fallback para vista completa: buscar dataset de Market Value y Total Invested
          const marketDataset = datasets.find(d => d.label === 'Market Value');
          const investedDataset = datasets.find(d => d.label === 'Total Invested');
          
          // Solo comparar colores si la línea de Total Invested está visible (borderWidth > 0)
          if (marketDataset && investedDataset && investedDataset.borderWidth > 0 && dataIndex < marketDataset.data.length) {
            const marketValue = marketDataset.data[dataIndex];
            const investedValue = investedDataset.data[dataIndex];
            
            // Verde si market > invested, rojo si market < invested
            pointColor = marketValue >= investedValue ? '#22c55e' : '#ef4444';
          }
          // En modo full view sin invested, mantener color verde por defecto
        }
      }
      
      ctx.save();
      
      // Lógica de posicionamiento dinámico del tooltip
      const lineLength = 105; // Longitud deseada de la línea (extendida)
      
      // Estrategia inteligente: acortar línea cuando el texto se salga
      const shouldPlaceAbove = true;
      const textMargin = 20; // Margen mínimo desde el borde superior para el texto
      
      let lineTop, lineBottom, textY;
      
      // Calcular si la línea completa cabría
      const fullLineTop = y - lineLength;
      const fullTextY = fullLineTop - 10;
      
      if (fullTextY >= textMargin) {
        // La línea completa cabe - usar tamaño original
        lineTop = fullLineTop;
        lineBottom = y - 15;
        textY = fullTextY;
      } else {
        // La línea no cabe - acortarla para que el texto quede visible
        textY = textMargin; // Texto en la posición mínima
        lineTop = textY + 10; // Línea 10px abajo del texto
        lineBottom = y - 15; // Final de línea como siempre
      }
      
      // Línea punteada vertical
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, lineTop);
      ctx.lineTo(x, lineBottom);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Mostrar fecha con posicionamiento dinámico
      if (chart.data.labels && chart.data.labels[dataIndex]) {
        const label = chart.data.labels[dataIndex];
        
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = shouldPlaceAbove ? 'bottom' : 'top';
        
        // Fondo semi-transparente para la fecha
        const textWidth = ctx.measureText(label).width;
        const padding = 12;
        
        // Sin restricciones de posición X - el texto sigue exactamente al cursor
        const adjustedX = x;
        
        // Ajustar altura del fondo según posición
        const bgHeight = 26;
        const bgY = shouldPlaceAbove ? textY - bgHeight + 4 : textY - 4;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(adjustedX - textWidth/2 - padding, bgY, textWidth + padding*2, bgHeight);
        
        // Texto de la fecha
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, adjustedX, textY);
      }
      
      // Crear punto central sólido más visible
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = pointColor;
      ctx.fill();
      
      // Añadir borde blanco para contraste
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Crear gradiente radial para el brillo externo más intenso
      const gradient = ctx.createRadialGradient(x, y, 6, x, y, 20);
      const rgb = pointColor === '#22c55e' ? '34, 197, 94' : '239, 68, 68';
      
      gradient.addColorStop(0, `rgba(${rgb}, 0.6)`);
      gradient.addColorStop(0.4, `rgba(${rgb}, 0.4)`);
      gradient.addColorStop(0.7, `rgba(${rgb}, 0.2)`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);
      
      // Dibujar el halo de brillo
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.restore();
    }
  }
};

// Registrar el plugin
Chart.register(glowPlugin);

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

  const [showTotalInvested, setShowTotalInvested] = useState(true);
  const [viewMode, setViewMode] = useState('both'); // 'both', 'balance'
  const [periodMode, setPeriodMode] = useState('day'); // 'week', 'month', 'year', 'day'
  const [startDate, setStartDate] = useState(externalStartDate || '');
  const [endDate, setEndDate] = useState(externalEndDate || '');
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [processedTimelineData, setProcessedTimelineData] = useState([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const chartRef = useRef(null);
  
  // Flag para saber si el cambio de fechas viene del zoom (no re-renderizar) o del usuario (sí re-renderizar)
  const isCalendarChangeFromZoom = useRef(false);
  
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
  
  // Sincronizar cambios locales con props externas
  useEffect(() => {
    if (setExternalStartDate && startDate !== externalStartDate) {
      setExternalStartDate(startDate);
    }
  }, [startDate]);
  
  useEffect(() => {
    if (setExternalEndDate && endDate !== externalEndDate) {
      setExternalEndDate(endDate);
    }
  }, [endDate]);
  
  // Funciones para manejar el popup
  const showApplyToAllPopup = () => setShowApplyPopup(true);
  const hideApplyPopup = () => setShowApplyPopup(false);

  // Agregar estilos para la animación del popup
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
      `;
      document.head.appendChild(style);
    }
  }, []);
  
  // Referencias para acceder a las funciones de setState desde callbacks de Chart.js
  const setStartDateRef = useRef(setStartDate);
  const setEndDateRef = useRef(setEndDate);
  const setIsZoomedRef = useRef(setIsZoomed);
  const chartRefForCallback = useRef(null);
  
  // Actualizar las referencias cuando cambien las funciones
  useEffect(() => {
    setStartDateRef.current = setStartDate;
    setEndDateRef.current = setEndDate;
    setIsZoomedRef.current = setIsZoomed;
    chartRefForCallback.current = chartRef.current;
  }, [setStartDate, setEndDate, setIsZoomed, chartRef.current]);

  
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
  
  // Inicializar tooltip estático
  useEffect(() => {
    const tooltipArea = document.querySelector('#tooltip-area');
    if (tooltipArea && portfolioData?.timeline) {
      // Usar datos procesados si están disponibles, sino usar datos originales
      const dataToUse = processedTimelineData.length > 0 ? processedTimelineData : null;
      tooltipArea.innerHTML = renderTooltipContent(null, dataToUse);
    }
  }, [portfolioData, showTotalInvested, viewMode, startDate, endDate, periodMode, processedTimelineData]);

  // Gestionar transición suave del gráfico cuando cambian las fechas
  useEffect(() => {
    // Si el cambio viene del zoom, NO re-renderizar
    if (isCalendarChangeFromZoom.current) {
      console.log('🔴 [FILTRO] Cambio viene del ZOOM - NO re-renderizar');
      isCalendarChangeFromZoom.current = false; // Reset flag
      return;
    }
    
    // Si viene del usuario, SÍ re-renderizar normalmente
    console.log('🔴 [FILTRO] Cambio viene del USUARIO - re-renderizando');
    if (portfolioData?.timeline) {
      setIsChartLoading(true);
      // Delay optimizado para permitir transición visual suave
      const timer = setTimeout(() => {
        setIsChartLoading(false);
      }, 300); // 300ms para transición más ergonómica
      
      return () => clearTimeout(timer);
    }
  }, [startDate, endDate, portfolioData, periodMode]);

  // Procesar datos para tooltip cuando cambien las dependencias
  useEffect(() => {
    // Si el cambio viene del zoom, procesar datos silenciosamente
    if (isCalendarChangeFromZoom.current) {
      console.log('🔵 [PROCESAMIENTO] Cambio viene del ZOOM - procesamiento silencioso');
      // No resetear la flag aquí porque se resetea en el otro useEffect
    } else {
      console.log('🔵 [PROCESAMIENTO] Cambio viene del USUARIO - procesamiento normal');
    }
    
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
      
      // Transición directa al calendario de fin sin timeout
      setCalendarType('end');
      // Establecer calendario en la fecha fin al abrir
      if (endDate) {
        const [day, month, year] = endDate.split('/');
        setCalendarDate(new Date(year, month - 1, day));
      }
      setShowStartCalendar(false);
      setShowEndCalendar(true);
      // Mostrar popup cuando se seleccione fecha de inicio
      setShowApplyPopup(true);
      
    } else {
      // Validar que fecha fin no sea anterior a fecha inicio
      if (startDate && !isValidRange(startDate, formattedDate)) {
        return; // No permitir fecha fin anterior a fecha inicio
      }
      
      setEndDate(formattedDate);
      setShowEndCalendar(false);
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
    
    // Convertir fechas de los botones a objetos Date
    let startDateObj = null;
    let endDateObj = null;
    
    if (startDate) {
      const [sDay, sMonth, sYear] = startDate.split('/');
      startDateObj = new Date(sYear, sMonth - 1, sDay);
    }
    
    if (endDate) {
      const [eDay, eMonth, eYear] = endDate.split('/');
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
    
    if (calendarType === 'start' && endDate) {
      // En calendario de inicio, deshabilitar fechas posteriores a fecha fin
      if (!isValidRange(formattedCurrentDate, endDate)) {
        return 'disabled';
      }
    } else if (calendarType === 'end' && startDate) {
      // En calendario de fin, deshabilitar fechas anteriores a fecha inicio
      if (!isValidRange(startDate, formattedCurrentDate)) {
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
    
    let content = `<span style="color: #ffffff; font-size: 18px; vertical-align: baseline;">${dateFormat}</span>&nbsp;&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: 22px; vertical-align: baseline;">PORTFOLIO VALUE</span>&nbsp;&nbsp;<span style="font-size: 26px; vertical-align: baseline;">${formatCurrencyEuroAfter(marketValue)}</span>`;
    
    if (showTotalInvested && viewMode === 'both') {
      // Determinar el tipo de profit mostrado basado en datos disponibles
      const profitLabel = (entry.total_gain !== undefined || entry.net_profit !== undefined) ? 'TOTAL GAINS' : 'UNREALIZED GAINS';
      content += `&nbsp;&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: 22px; vertical-align: baseline;">COST BASIS</span>&nbsp;&nbsp;<span style="font-size: 26px; vertical-align: baseline;">${formatCurrencyEuroAfter(investedValue)}</span>&nbsp;&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: 22px; vertical-align: baseline;">${profitLabel}</span>&nbsp;&nbsp;<span style="color: ${profitColor}; font-size: 26px; vertical-align: baseline;">${profit >= 0 ? '+' : '-'}${formatCurrencyEuroAfter(profit)}</span><span style="color: ${profitColor}; font-size: 18px; vertical-align: top; position: relative; top: -2px;">&nbsp;${profitTriangle}</span><span style="color: ${profitColor}; font-size: 18px; vertical-align: baseline; position: relative; top: 0px;">${Math.abs(profitPct).toFixed(1)}%</span>`;
    } else if (viewMode === 'balance') {
      const profitLabel = (entry.total_gain !== undefined || entry.net_profit !== undefined) ? 'TOTAL GAINS' : 'UNREALIZED GAINS';
      content += `&nbsp;&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: 22px; vertical-align: baseline;">${profitLabel}</span>&nbsp;&nbsp;<span style="color: ${profitColor}; font-size: 26px; vertical-align: baseline;">${profit >= 0 ? '+' : '-'}${formatCurrencyEuroAfter(profit)}</span>`;
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
        font-family: 'Inter', sans-serif;
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
  
  // Check if using default date range
  const { defaultStartDate, defaultEndDate } = getDefaultDates();
  const isUsingDefaultRange = (startDate === defaultStartDate && endDate === defaultEndDate);
  
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
    
    // Para zoom, usar fechas reales en lugar de labels personalizados
    const labels = timelineData.map(entry => entry.date);

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
    
    // Para P&L: calcular si hay mayoría positiva
    const positiveBalanceCount = balanceValues.filter(val => val > 0).length;
    const balanceIsPositive = positiveBalanceCount > balanceValues.length / 2;
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
    
    // Si estamos en modo balance, solo mostrar la línea de balance
    if (viewMode === 'balance') {
      datasets.push({
        label: 'Balance (P&L)',
        data: balanceValues,
        borderColor: function(context) {
          // Contar cuántos valores están por encima de 0
          const aboveZero = balanceValues.filter(val => val > 0).length;
          const totalPoints = balanceValues.length;
          const isPositive = aboveZero > totalPoints / 2;
          
          console.log('P&L: ' + aboveZero + '/' + totalPoints + ' above zero = ' + (isPositive ? 'GREEN' : 'RED'));
          
          return isPositive ? '#22c55e' : '#ef4444';
        },
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return balanceAreaColor;
          
          // Gradiente vertical neutro - gris azulado suave
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(120, 140, 180, 0.4)');
          gradient.addColorStop(0.5, 'rgba(120, 140, 180, 0.25)');
          gradient.addColorStop(1, 'rgba(120, 140, 180, 0.08)');
          
          return gradient;
        },
        fill: 'origin', // Rellenar hasta el eje X (línea de 0)
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: function(context) {
          if (!context.parsed) return '#ffffff';
          const dataIndex = context.dataIndex;
          const balanceValue = balanceValues[dataIndex];
          // Verde si es ganancia, rojo si es pérdida
          return balanceValue >= 0 ? '#22c55e' : '#ef4444';
        },
        pointBorderColor: function(context) {
          if (!context.parsed) return 'rgba(255, 255, 255, 0.3)';
          const dataIndex = context.dataIndex;
          const balanceValue = balanceValues[dataIndex];
          // Borde más intenso del mismo color
          return balanceValue >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
        },
        pointBorderWidth: 0,
        pointHoverBorderWidth: 20,
        borderWidth: 4,
        pointStyle: 'circle',
        segment: {
          borderColor: function(ctx) {
            const startIndex = ctx.p0DataIndex;
            const endIndex = ctx.p1DataIndex;
            const startValue = balanceValues[startIndex];
            const endValue = balanceValues[endIndex];
            
            // Si ambos puntos están del mismo lado de 0, usar ese color
            if (startValue > 0 && endValue > 0) return '#22c55e';
            if (startValue <= 0 && endValue <= 0) return '#ef4444';
            
            // Si cruzan el 0, determinar qué color domina el segmento
            const zeroLine = 0;
            const startDistance = Math.abs(startValue - zeroLine);
            const endDistance = Math.abs(endValue - zeroLine);
            
            // Si el punto final está más lejos de 0, su color domina
            if (endDistance > startDistance) {
              return endValue > 0 ? '#22c55e' : '#ef4444';
            } else {
              return startValue > 0 ? '#22c55e' : '#ef4444';
            }
          }
        }
      });
    } else {
      // Modo normal: líneas con sombreado simple pero visible
      
      // Total Invested - siempre presente, pero con transparencia condicional
      datasets.push({
        label: 'Total Invested',
        data: investedValues,
        borderColor: showTotalInvested ? 'rgba(208, 208, 208, 0.8)' : 'rgba(208, 208, 208, 0)',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        borderDash: [10, 5],
        borderWidth: showTotalInvested ? 3 : 0,
        pointStyle: 'line',
        order: 1,
        hidden: false // Siempre visible para Chart.js, controlamos con transparencia
      });
      
      // Dataset para el área entre las líneas (siempre presente, controlado por transparencia)
      datasets.push({
        label: 'P&L Area',
        data: portfolioValues,
        backgroundColor: function(context) {
          if (!showTotalInvested) return 'transparent';
          
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return 'transparent';
          
          // Gradiente vertical neutro - gris azulado suave
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(120, 140, 180, 0.4)');
          gradient.addColorStop(0.5, 'rgba(120, 140, 180, 0.25)');
          gradient.addColorStop(1, 'rgba(120, 140, 180, 0.08)');
          
          return gradient;
        },
        fill: '-1', // Rellenar hasta el dataset anterior (Total Invested)
        borderColor: 'transparent',
        borderWidth: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        tension: 0.5,
        order: 2
      });
      
      // Market Value con sombreado
      datasets.push({
        label: 'Market Value',
        data: portfolioValues,
        borderColor: '#22c55e', // Color base, se sobrescribe con segment
        backgroundColor: function(context) {
          if (!showTotalInvested) {
            // Sin invested = gradiente verde muy suave
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return 'transparent';
            
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(34, 197, 94, 0.2)'); // Verde arriba
            gradient.addColorStop(0.6, 'rgba(34, 197, 94, 0.1)'); // Transición moderada
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0.01)'); // Casi transparente abajo
            return gradient;
          }
          
          // Con invested, no backgroundColor en este dataset
          return 'transparent';
        },
        fill: !showTotalInvested ? 'origin' : false, // Solo fill cuando no hay invested
        tension: 0.1, // Ángulos más rectos, menos suavizado
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(255, 255, 255, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 0.3)',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 20,
        borderWidth: 2,
        pointStyle: 'circle',
        order: showTotalInvested ? 3 : 1,
        segment: {
          borderColor: function(ctx) {
            if (!showTotalInvested) {
              return '#22c55e'; // Sin invested = siempre verde
            }
            
            const startIndex = ctx.p0DataIndex;
            const endIndex = ctx.p1DataIndex;
            const startMarket = portfolioValues[startIndex];
            const startInvested = investedValues[startIndex] || 0;
            const endMarket = portfolioValues[endIndex];
            const endInvested = investedValues[endIndex] || 0;
            
            const startIsWinning = startMarket > startInvested;
            const endIsWinning = endMarket > endInvested;
            
            // Si ambos puntos están del mismo lado, usar ese color
            if (startIsWinning && endIsWinning) return '#22c55e';
            if (!startIsWinning && !endIsWinning) return '#ef4444';
            
            // Si hay cambio, determinar qué domina el segmento
            const startGap = Math.abs(startMarket - startInvested);
            const endGap = Math.abs(endMarket - endInvested);
            
            // El que tenga mayor diferencia (gap) domina el color del segmento
            if (endGap > startGap) {
              return endIsWinning ? '#22c55e' : '#ef4444';
            } else {
              return startIsWinning ? '#22c55e' : '#ef4444';
            }
          }
        }
      });
    }


    return {
      labels,
      datasets
    };
  };

  // Timeline Chart options
  const timelineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    transitions: {
      zoom: {
        animations: {
          x: {
            duration: 1000,
            easing: 'easeOutBounce'
          },
          y: {
            duration: 1000,
            easing: 'easeOutBounce'
          }
        }
      }
    },
    layout: {
      padding: {
        left: 40,
        right: 40,
        top: 20, // Reducido para acercar al tooltip
        bottom: 30
      }
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
      axis: 'x'
    },
    hover: {
      mode: 'nearest',
      intersect: false,
      animationDuration: 0
    },
    onHover: (event, activeElements) => {
      const tooltipArea = document.querySelector('#tooltip-area');
      if (tooltipArea) {
        if (activeElements.length > 0) {
          // Actualizar tooltip con el punto hover
          const dataIndex = activeElements[0].index;
          tooltipArea.innerHTML = renderTooltipContent(dataIndex, processedTimelineData);
        } else {
          // Sin hover - volver a la última fecha (estado por defecto)
          tooltipArea.innerHTML = renderTooltipContent(null, processedTimelineData);
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 0,
        borderWidth: 0,
        hoverBorderWidth: 0,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        hoverBackgroundColor: 'transparent',
        hoverBorderColor: 'transparent'
      },
      line: {
        tension: 0.4
      }
    },
    plugins: {
      legend: {
        display: false // Ocultamos la leyenda porque ya tenemos nuestra propia leyenda personalizada
      },
      tooltip: {
        enabled: false
      },
      zoom: {
        pan: {
          enabled: false
        },
        zoom: {
          drag: {
            enabled: true,
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            borderColor: 'rgba(34, 197, 94, 0.8)',
            borderWidth: 2
          },
          wheel: {
            enabled: false
          },
          pinch: {
            enabled: false
          },
          mode: 'x',
          onZoomComplete: function(chart) {
            console.log('🔍 Zoom complete event triggered!');
            
            // Verificación más robusta del chart y escalas
            try {
              // Intentar múltiples formas de acceder al chart
              let targetChart = chart;
              
              // Si el chart pasado como parámetro no tiene escalas, usar chartRef
              if (!targetChart || !targetChart.scales) {
                if (chartRef.current) {
                  targetChart = chartRef.current;
                }
              }
              
              if (!targetChart) {
                console.log('❌ No se pudo acceder a ningún chart');
                return;
              }
              
              if (!targetChart.scales || !targetChart.scales.x) {
                return;
              }
              
              const xScale = targetChart.scales.x;
              
              // Verificar que min y max sean valores válidos
              if (typeof xScale.min === 'undefined' || typeof xScale.max === 'undefined') {
                return;
              }
              
              if (isNaN(xScale.min) || isNaN(xScale.max)) {
                return;
              }
              
              const minDate = new Date(xScale.min);
              const maxDate = new Date(xScale.max);
              
              // Verificar que las fechas sean válidas
              if (isNaN(minDate.getTime()) || isNaN(maxDate.getTime())) {
                return;
              }
              
              const newStartDate = minDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
              });
              
              const newEndDate = maxDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
              
              // Verificar que las referencias estén disponibles
              if (!setStartDateRef.current || !setEndDateRef.current || !setIsZoomedRef.current) {
                return;
              }
              
              // Activar flag: el próximo cambio de fechas viene del zoom
              isCalendarChangeFromZoom.current = true;
              
              // Marcar como zoomed
              setIsZoomed(true);
              
              // Actualizar calendarios (esto disparará useEffects pero serán ignorados por la flag)
              console.log('🔍 Actualizando calendarios desde zoom:', newStartDate, 'a', newEndDate);
              setStartDateRef.current(newStartDate);
              setEndDateRef.current(newEndDate);
              
              console.log('✅ Zoom completado con calendarios actualizados');
              
              // Mostrar popup después del zoom
              showApplyToAllPopup();
              
            } catch (error) {
              console.error('❌ [ZOOM] Error en onZoomComplete:', error);
            }
            
          },
          onZoomRejected: function() {
            setIsZoomed(false);
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: periodMode === 'year' ? 'year' : periodMode === 'month' ? 'month' : periodMode === 'week' ? 'week' : 'day',
          displayFormats: {
            day: 'dd/MM',
            week: 'dd/MM',
            month: 'MMM yyyy',
            year: 'yyyy'
          }
        },
        display: false,
        grid: {
          display: false
        },
        ticks: {
          color: '#b5b5b5',
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: '500'
          },
          maxTicksLimit: 6
        },
        border: {
          display: false
        }
      },
      y: {
        ticks: {
          color: '#b5b5b5',
          font: {
            size: 16,
            family: "'Inter', sans-serif",
            weight: '600'
          },
          padding: 15,
          callback: function(value) {
            if (value >= 1000000) {
              return '€' + (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return '€' + (value / 1000).toFixed(1) + 'K';
            }
            return '€' + Math.round(value);
          }
        },
        grid: {
          display: false
        },
        border: {
          display: false
        },
        title: {
          display: false
        }
      }
    }
  };

  const timelineData = createTimelineData();

  if (!timelineData) {
    return (
      <div style={{
        height: "500px",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.textSecondary,
        fontFamily: "'Inter', sans-serif"
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
          fontFamily: "'Inter', sans-serif",
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
                  fontFamily: "'Inter', sans-serif",
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
                  fontFamily: "'Inter', sans-serif",
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
              width: viewMode === 'both' ? '130px' : '0px',
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
                  fontFamily: "'Inter', sans-serif",
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
                Invested
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
                  fontFamily: "'Inter', sans-serif",
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
                onClick={() => setPeriodMode('week')}
                style={{
                  background: periodMode === 'week' 
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.6), rgba(16, 185, 129, 0.7))' 
                    : 'rgba(255, 255, 255, 0.06)',
                  border: periodMode === 'week' 
                    ? '1px solid rgba(34, 197, 94, 0.8)' 
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: periodMode === 'week' ? '#ffffff' : 'rgba(245, 245, 245, 0.8)',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)'
                }}
                onMouseEnter={(e) => {
                  if (periodMode !== 'week') {
                    e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (periodMode !== 'week') {
                    e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.target.style.color = 'rgba(245, 245, 245, 0.8)';
                  }
                }}
              >
                W
              </button>
              
              <button
                onClick={() => setPeriodMode('month')}
                style={{
                  background: periodMode === 'month' 
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.6), rgba(16, 185, 129, 0.7))' 
                    : 'rgba(255, 255, 255, 0.06)',
                  border: periodMode === 'month' 
                    ? '1px solid rgba(34, 197, 94, 0.8)' 
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: periodMode === 'month' ? '#ffffff' : 'rgba(245, 245, 245, 0.8)',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)'
                }}
                onMouseEnter={(e) => {
                  if (periodMode !== 'month') {
                    e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (periodMode !== 'month') {
                    e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.target.style.color = 'rgba(245, 245, 245, 0.8)';
                  }
                }}
              >
                M
              </button>
              
              <button
                onClick={() => setPeriodMode('year')}
                style={{
                  background: periodMode === 'year' 
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.6), rgba(16, 185, 129, 0.7))' 
                    : 'rgba(255, 255, 255, 0.06)',
                  border: periodMode === 'year' 
                    ? '1px solid rgba(34, 197, 94, 0.8)' 
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: periodMode === 'year' ? '#ffffff' : 'rgba(245, 245, 245, 0.8)',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)'
                }}
                onMouseEnter={(e) => {
                  if (periodMode !== 'year') {
                    e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (periodMode !== 'year') {
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
                  width: '20px',
                  height: '2px',
                  background: 'linear-gradient(90deg, #10b981, #22c55e, #34d399)',
                  borderRadius: '1px',
                  boxShadow: '0 0 6px rgba(34, 197, 94, 0.3)'
                }}></div>
                <span style={{ 
                  color: '#f5f5f5', 
                  fontWeight: '600',
                  fontSize: '15px'
                }}>Market Value</span>
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
                  width: '20px',
                  height: '2px',
                  background: 'repeating-linear-gradient(to right, rgba(200, 200, 200, 0.8) 0px, rgba(200, 200, 200, 0.8) 3px, transparent 3px, transparent 6px)',
                  borderRadius: '1px'
                }}></div>
                <span style={{ 
                  color: '#f5f5f5', 
                  fontWeight: '600',
                  fontSize: '15px'
                }}>Total Invested</span>
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
                  width: '20px',
                  height: '2px',
                  background: 'linear-gradient(90deg, #10b981, #22c55e, #34d399)',
                  borderRadius: '1px',
                  boxShadow: '0 0 6px rgba(34, 197, 94, 0.3)'
                }}></div>
                <span style={{ 
                  color: '#f5f5f5', 
                  fontWeight: '600',
                  fontSize: '15px'
                }}>Balance (P&L)</span>
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
            <div style={{ position: 'relative' }} data-calendar>
              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '12px 13px',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
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
                // Establecer calendario en la fecha actual del botón
                if (startDate) {
                  const [day, month, year] = startDate.split('/');
                  setCalendarDate(new Date(year, month - 1, day));
                }
                setShowStartCalendar(!showStartCalendar);
                if (!showStartCalendar) {
                  setShowEndCalendar(false);
                }
              }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(145, 145, 145, 0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>{startDate}</span>
                {(() => {
                  const { defaultStartDate } = getDefaultDates();
                  return startDate && startDate !== defaultStartDate && (
                    <div style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-3px',
                      width: '10px',
                      height: '10px',
                      background: '#00ff88',
                      borderRadius: '50%',
                      border: '1px solid rgba(15, 15, 15, 0.8)',
                      boxShadow: '0 0 6px rgba(0, 255, 136, 0.5)'
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
                  overflow: 'hidden'
                }}>
                  {/* Calendar Title */}
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '15px',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: '600',
                    fontFamily: "'Inter', sans-serif",
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingBottom: '10px'
                  }}>
                    Select Start Date
                  </div>

                  {/* Calendar Header - Redesign minimalista */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '20px',
                    fontFamily: "'Inter', sans-serif"
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
                      fontFamily: "'Inter', sans-serif"
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
                    fontFamily: "'Inter', sans-serif",
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
                            fontFamily: "'Inter', sans-serif",
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
                        const { defaultStartDate } = getDefaultDates();
                        setStartDate(defaultStartDate);
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
                        fontFamily: "'Inter', sans-serif",
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
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(0, 255, 136, 0.15)';
                        e.target.style.borderColor = 'rgba(0, 255, 136, 0.5)';
                        e.target.style.color = '#00ff88';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(0, 255, 136, 0.1)';
                        e.target.style.borderColor = 'rgba(0, 255, 136, 0.3)';
                        e.target.style.color = 'rgba(0, 255, 136, 0.9)';
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
                padding: '12px 13px',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
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
                // Establecer calendario en la fecha actual del botón
                if (endDate) {
                  const [day, month, year] = endDate.split('/');
                  setCalendarDate(new Date(year, month - 1, day));
                }
                setShowEndCalendar(!showEndCalendar);
                if (!showEndCalendar) {
                  setShowStartCalendar(false);
                }
              }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(145, 145, 145, 0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>{endDate}</span>
                {(() => {
                  const { defaultEndDate } = getDefaultDates();
                  return endDate && endDate !== defaultEndDate && (
                    <div style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-3px',
                      width: '10px',
                      height: '10px',
                      background: '#00ff88',
                      borderRadius: '50%',
                      border: '1px solid rgba(15, 15, 15, 0.8)',
                      boxShadow: '0 0 6px rgba(0, 255, 136, 0.5)'
                    }}></div>
                  );
                })()}
              </div>
              
              {/* Calendario emergente para fecha fin */}
              {showEndCalendar && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '8px',
                  zIndex: 1000,
                  background: 'rgba(15, 15, 15, 0.98)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  padding: '20px', // Padding equilibrado
                  backdropFilter: 'blur(30px)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
                  minWidth: '420px',
                  width: '420px',
                  minHeight: '380px'
                }}>
                  {/* Calendar Title */}
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '15px',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: '600',
                    fontFamily: "'Inter', sans-serif",
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingBottom: '10px'
                  }}>
                    Select End Date
                  </div>

                  {/* Calendar Header - Redesign minimalista */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '20px',
                    fontFamily: "'Inter', sans-serif"
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
                      fontFamily: "'Inter', sans-serif"
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
                    fontFamily: "'Inter', sans-serif",
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
                            fontFamily: "'Inter', sans-serif",
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
                        const { defaultEndDate } = getDefaultDates();
                        setEndDate(defaultEndDate);
                        setShowEndCalendar(false);
                        
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
                        fontFamily: "'Inter', sans-serif",
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
                        setShowEndCalendar(false);
                      }}
                      style={{
                        flex: '1',
                        background: 'rgba(0, 255, 136, 0.1)',
                        border: '1px solid rgba(0, 255, 136, 0.3)',
                        borderRadius: '10px',
                        padding: '10px 16px',
                        color: 'rgba(0, 255, 136, 0.9)',
                        fontSize: '14px',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(0, 255, 136, 0.15)';
                        e.target.style.borderColor = 'rgba(0, 255, 136, 0.5)';
                        e.target.style.color = '#00ff88';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(0, 255, 136, 0.1)';
                        e.target.style.borderColor = 'rgba(0, 255, 136, 0.3)';
                        e.target.style.color = 'rgba(0, 255, 136, 0.9)';
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
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
        
        {/* Botones Reset/Apply alineados a la derecha */}
        {(!isUsingDefaultRange || isZoomed) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginLeft: '2rem',
            alignSelf: 'flex-start',
            marginTop: '-10px'
          }}>
            
            {/* Botón Reset */}
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => {
                  // Reset to default dates
                  const { defaultStartDate, defaultEndDate } = getDefaultDates();
                  setStartDate(defaultStartDate);
                  setEndDate(defaultEndDate);
                  
                  // Cancelar popup si está abierto
                  if (setShowApplyPopup) {
                    setShowApplyPopup(false);
                  }
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  color: '#ef4444',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease-out',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  e.target.style.color = '#ef4444';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.color = '#ef4444';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
                <span>Reset</span>
              </div>
            </div>
            
          </div>
        )}
      </div>
      
      <div style={{
        height: '800px',
        width: '104%',
        marginLeft: '-2.5%',
        position: 'relative'
      }}>
        <Line ref={chartRef} data={timelineData} options={timelineOptions} />
        
      </div>
      </div>
      </div>

    </div>
  );
};


export default TimelineChart;