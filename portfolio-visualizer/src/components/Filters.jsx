import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Filters.css';

const Filters = ({ theme, onFiltersChange, portfolioData, onSidebarToggle, showApplyPopup, setShowApplyPopup, startDate, endDate, onApplyToAll, popupSource }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTabPulse, setShowTabPulse] = useState(false);
  const [isTabHoverDisabled, setIsTabHoverDisabled] = useState(false);
  const [activeSection, setActiveSection] = useState('filters');
  const [hiddenAssets, setHiddenAssets] = useState(new Set());
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedTimePreset, setSelectedTimePreset] = useState('');
  const [minAllocation, setMinAllocation] = useState('0');
  const [balanceThreshold, setBalanceThreshold] = useState('0');
  const [excludedOperations, setExcludedOperations] = useState(new Set());
  const [baseCurrency, setBaseCurrency] = useState('EUR');
  const [activeFilters, setActiveFilters] = useState(0);
  const tabButtonRef = useRef(null);
  
  // Estados para calendario personalizado
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [calendarType, setCalendarType] = useState('start'); // 'start' o 'end'
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showMonthYearSelector, setShowMonthYearSelector] = useState(false);
  
  // Helper function to get default date range (min available to max available)
  const getDefaultDateRange = () => {
    // Use full available date range from portfolio timeline
    if (portfolioData?.timeline && portfolioData.timeline.length > 0) {
      const startDate = new Date(portfolioData.timeline[0].date).toISOString().split('T')[0];
      const endDate = new Date(portfolioData.timeline[portfolioData.timeline.length - 1].date).toISOString().split('T')[0];
      return { from: startDate, to: endDate };
    } else {
      // Fallback to 1 month range if no portfolio data
      const now = new Date();
      const endDate = now.toISOString().split('T')[0];
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
      return { from: startDate, to: endDate };
    }
  };

  // Helper function to check if current date range is the full available range
  const isFullDateRange = (dateRng) => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) return false;
    
    const minAvailable = new Date(portfolioData.timeline[0].date).toISOString().split('T')[0];
    const maxAvailable = new Date(portfolioData.timeline[portfolioData.timeline.length - 1].date).toISOString().split('T')[0];
    
    return dateRng.from === minAvailable && dateRng.to === maxAvailable;
  };

  // Helper function to check if start date has been modified from default
  const isStartDateModified = () => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) return false;
    
    const defaultStartDate = new Date(portfolioData.timeline[0].date).toISOString().split('T')[0];
    return dateRange.from !== defaultStartDate;
  };

  // Helper function to check if end date has been modified from default
  const isEndDateModified = () => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) return false;
    
    const defaultEndDate = new Date(portfolioData.timeline[portfolioData.timeline.length - 1].date).toISOString().split('T')[0];
    return dateRange.to !== defaultEndDate;
  };

  // Funciones para calendario personalizado
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

  const isValidDate = (year, month, day) => {
    const { minDate, maxDate } = getValidDateRange();
    if (!minDate || !maxDate) return false;
    
    const dateToCheck = new Date(year, month, day);
    return dateToCheck >= minDate && dateToCheck <= maxDate;
  };

  const isValidRange = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return true;
    const startDateObj = new Date(startDateStr);
    const endDateObj = new Date(endDateStr);
    return startDateObj <= endDateObj;
  };

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
    
    // Asegurar que siempre tengamos exactamente 42 celdas (6 filas × 7 días)
    const totalCells = 42;
    while (days.length < totalCells) {
      days.push(null);
    }
    
    return days;
  };

  const getDayState = (day, currentYear, currentMonth) => {
    if (!day) return '';
    
    const currentStartDate = dateRange.from;
    const currentEndDate = dateRange.to;
    
    // Verificar si es fecha seleccionada - usar formato local YYYY-MM-DD
    const formatDate = (year, month, day) => {
      const y = year.toString();
      const m = (month + 1).toString().padStart(2, '0'); // month es 0-based
      const d = day.toString().padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    const currentDateStr = formatDate(currentYear, currentMonth, day);
    
    if (currentStartDate && currentDateStr === currentStartDate) {
      return 'selected-start';
    }
    if (currentEndDate && currentDateStr === currentEndDate) {
      return 'selected-end';
    }
    
    // Verificar si está fuera del rango de datos disponibles
    if (!isValidDate(currentYear, currentMonth, day)) {
      return 'disabled';
    }
    
    // Verificar validaciones de rango
    if (calendarType === 'start' && currentEndDate) {
      if (!isValidRange(currentDateStr, currentEndDate)) {
        return 'disabled';
      }
    } else if (calendarType === 'end' && currentStartDate) {
      if (!isValidRange(currentStartDate, currentDateStr)) {
        return 'disabled';
      }
    }
    
    // Verificar si está en el rango
    if (currentStartDate && currentEndDate && currentStartDate !== currentEndDate) {
      // Usar comparación de strings en formato YYYY-MM-DD
      const minDateStr = currentStartDate < currentEndDate ? currentStartDate : currentEndDate;
      const maxDateStr = currentStartDate > currentEndDate ? currentStartDate : currentEndDate;
      
      if (currentDateStr > minDateStr && currentDateStr < maxDateStr) {
        return 'in-range';
      }
    }
    
    return '';
  };

  const handleDayClick = (day) => {
    if (!day) return;
    
    if (!isValidDate(calendarDate.getFullYear(), calendarDate.getMonth(), day)) {
      return;
    }
    
    // Usar formateo local para evitar problemas de timezone
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // No permitir seleccionar la misma fecha para start y end
    if (calendarType === 'start' && dateRange.to === formattedDate) {
      return;
    }
    if (calendarType === 'end' && dateRange.from === formattedDate) {
      return;
    }
    
    if (calendarType === 'start') {
      if (dateRange.to && !isValidRange(formattedDate, dateRange.to)) {
        return;
      }
      
      const newRange = { ...dateRange, from: formattedDate };
      setDateRange(newRange);
      updateActiveFiltersCount(hiddenAssets, newRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
      
      if (onFiltersChange) {
        onFiltersChange({
          type: 'dateRange',
          dateRange: { ...newRange }
        });
      }
      
      // Transición al calendario de fin
      setTimeout(() => {
        setCalendarType('end');
        if (dateRange.to) {
          setCalendarDate(new Date(dateRange.to));
        }
      }, 150);
      
    } else {
      if (dateRange.from && !isValidRange(dateRange.from, formattedDate)) {
        return;
      }
      
      const newRange = { ...dateRange, to: formattedDate };
      setDateRange(newRange);
      updateActiveFiltersCount(hiddenAssets, newRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
      
      if (onFiltersChange) {
        onFiltersChange({
          type: 'dateRange',
          dateRange: { ...newRange }
        });
      }
      
      setShowCustomCalendar(false);
    }
  };

  const changeMonth = (direction) => {
    const { minDate, maxDate } = getValidDateRange();
    if (!minDate || !maxDate) return;
    
    setCalendarDate(prev => {
      const newDate = new Date(prev);
      const targetMonth = prev.getMonth() + direction;
      newDate.setMonth(targetMonth);
      
      const firstDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      const lastDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
      
      if (lastDayOfMonth < minDate || firstDayOfMonth > maxDate) {
        return prev;
      }
      
      return newDate;
    });
  };

  const changeYear = (direction) => {
    const { minDate, maxDate } = getValidDateRange();
    if (!minDate || !maxDate) return;
    
    setCalendarDate(prev => {
      const newDate = new Date(prev);
      const targetYear = prev.getFullYear() + direction;
      newDate.setFullYear(targetYear);
      
      const firstDayOfYear = new Date(newDate.getFullYear(), 0, 1);
      const lastDayOfYear = new Date(newDate.getFullYear(), 11, 31);
      
      if (lastDayOfYear < minDate || firstDayOfYear > maxDate) {
        return prev;
      }
      
      return newDate;
    });
  };

  const isMonthNavigationDisabled = (direction) => {
    const { minDate, maxDate } = getValidDateRange();
    if (!minDate || !maxDate) return true;
    
    const testDate = new Date(calendarDate);
    testDate.setMonth(testDate.getMonth() + direction);
    
    const firstDayOfMonth = new Date(testDate.getFullYear(), testDate.getMonth(), 1);
    const lastDayOfMonth = new Date(testDate.getFullYear(), testDate.getMonth() + 1, 0);
    
    return lastDayOfMonth < minDate || firstDayOfMonth > maxDate;
  };

  const isYearNavigationDisabled = (direction) => {
    const { minDate, maxDate } = getValidDateRange();
    if (!minDate || !maxDate) return true;
    
    const testDate = new Date(calendarDate);
    testDate.setFullYear(testDate.getFullYear() + direction);
    
    const firstDayOfYear = new Date(testDate.getFullYear(), 0, 1);
    const lastDayOfYear = new Date(testDate.getFullYear(), 11, 31);
    
    return lastDayOfYear < minDate || firstDayOfYear > maxDate;
  };


  // Set default dates on component mount and when portfolio data changes
  useEffect(() => {
    if (portfolioData && (!dateRange.from || !dateRange.to)) {
      const defaultRange = getDefaultDateRange();
      // Set and communicate default dates when portfolio data is available and dates are missing
      setDateRange(defaultRange);
      // Communicate initial date range to parent/timeline
      if (onFiltersChange) {
        onFiltersChange({ 
          type: 'dateRange', 
          dateRange: { ...defaultRange }
        });
      }
    }
  }, [portfolioData]);

  // Sync local date range with props from Dashboard
  useEffect(() => {
    if (startDate && endDate) {
      setDateRange({ from: startDate, to: endDate });
    }
  }, [startDate, endDate]);
  
  // Estados para animaciones del popup
  const [popupAnimation, setPopupAnimation] = useState('entering');
  const [isApplying, setIsApplying] = useState(false);
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  
  
  // Efecto para mostrar el popup
  useEffect(() => {
    if (showApplyPopup) {
      setShouldShowPopup(true);
      setPopupAnimation('entering');
      
      const timer = setTimeout(() => {
        setPopupAnimation('visible');
      }, 10);
      
      return () => clearTimeout(timer);
    }
  }, [showApplyPopup]);

  // Efecto para manejar el cierre (manual o automático)
  useEffect(() => {
    if (!showApplyPopup && shouldShowPopup) {
      // Animar hacia la derecha antes de ocultar
      setPopupAnimation('exitingRight');
      
      const timer = setTimeout(() => {
        setShouldShowPopup(false);
        setPopupAnimation('entering');
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [showApplyPopup, shouldShowPopup]);
  
  // Funciones para manejar las salidas animadas
  const handleClosePopup = () => {
    // Solo cambiar el estado showApplyPopup, el useEffect se encarga del resto
    setShowApplyPopup(false);
  };
  
  const handleApplyFilter = () => {
    console.log('Aplicando período a toda la página:', { startDate, endDate, popupSource });
    
    // If popup source is 'timeline', use the callback to update Filter
    if (popupSource === 'timeline' && onApplyToAll) {
      onApplyToAll({
        type: 'dateRange',
        dateRange: {
          from: startDate,
          to: endDate
        }
      });
    }
    // If popup source is 'filter', dates are already updated in Filter
    
    setPopupAnimation('applying');
    setTimeout(() => {
      setShowApplyPopup(false);
    }, 200);
  };

  // Get available assets from portfolio data
  const availableAssets = portfolioData?.portfolio_data ? 
    portfolioData.portfolio_data
      .filter(asset => (asset.current_value || 0) > 0)
      .map(asset => asset.asset) : [];

  // Helper function to update active filters count
  const updateActiveFiltersCount = (hiddenAssets, dateRng, timePreset, minAlloc, balThreshold, excludedOps) => {
    let count = 0;
    if (hiddenAssets.size > 0) count++;
    // Count date filter as active if either start or end date is modified from default
    if (isStartDateModified() || isEndDateModified()) count++;
    if (timePreset) count++;
    if (parseFloat(minAlloc) > 0) count++;
    if (parseFloat(balThreshold) > 0) count++;
    if (excludedOps && excludedOps.size > 0) count++;
    setActiveFilters(count);
  };

  // Helper function to set time preset dates
  const setTimePresetDates = (preset) => {
    const now = new Date();
    let endDate = now.toISOString().split('T')[0];
    let startDate;
    
    switch(preset) {
      case '1W':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '1M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
        break;
      case '3M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().split('T')[0];
        break;
      case '6M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString().split('T')[0];
        break;
      case '1Y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
        break;
      case 'All':
        startDate = '';
        endDate = '';
        break;
      default:
        return;
    }
    
    const newRange = preset === 'All' ? { from: '', to: '' } : { from: startDate, to: endDate };
    setDateRange(newRange);
    setSelectedTimePreset(preset);
    updateActiveFiltersCount(hiddenAssets, newRange, preset, minAllocation, balanceThreshold, excludedOperations);
  };

  const sections = [
    { id: 'filters', label: 'FILTERS' },
    { id: 'analytics', label: 'ANALYTICS' },
    { id: 'config', label: 'CONFIG' }
  ];

  // Hide pulse after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTabPulse(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!isOpen) {
          setIsOpen(true);
          setShowTabPulse(false);
          if (onSidebarToggle) {
            onSidebarToggle(true);
          }
        }
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        if (onSidebarToggle) {
          onSidebarToggle(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onSidebarToggle]);

  // Add CSS animations and hide scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes tabPulse {
        0%, 100% { box-shadow: 0.25rem 0 1rem rgba(0, 255, 136, 0.2); }
        50% { box-shadow: 0.5rem 0 1.5rem rgba(0, 255, 136, 0.4); }
      }
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleAssetToggle = (asset) => {
    const newHidden = new Set(hiddenAssets);
    if (newHidden.has(asset)) {
      newHidden.delete(asset);
    } else {
      newHidden.add(asset);
    }
    setHiddenAssets(newHidden);
    updateActiveFiltersCount(newHidden, dateRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
  };

  const handleOperationToggle = (operation) => {
    const newExcluded = new Set(excludedOperations);
    if (newExcluded.has(operation)) {
      newExcluded.delete(operation);
    } else {
      newExcluded.add(operation);
    }
    setExcludedOperations(newExcluded);
    updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, minAllocation, balanceThreshold, newExcluded);
  };

  const handleTabClick = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    setShowTabPulse(false);
    setIsTabHoverDisabled(true);
    
    // Disable hover during the sidebar animation (300ms)
    setTimeout(() => setIsTabHoverDisabled(false), 300);
    
    // Notify Dashboard about sidebar state change
    if (onSidebarToggle) {
      onSidebarToggle(newState);
    }
  };

  const handleQuickFilter = (filterType) => {
    // Implement quick filter logic here
    console.log('Quick filter:', filterType);
    if (onFiltersChange) {
      onFiltersChange({ type: 'quick', filter: filterType });
    }
  };

  // Create the sidebar content
  const sidebarContent = (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '360px', // 320px panel + 50px tab
      height: '100vh',
      display: 'flex',
      flexDirection: 'row',
      transform: isOpen ? 'translateX(0)' : 'translateX(315px)',
      transition: 'transform 0.3s linear',
      zIndex: 999999,
      pointerEvents: 'none'
    }}>
      {/* Tab Button */}
      <button
          ref={tabButtonRef}
          className="filter-tab-button"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={(e) => {
            e.preventDefault();
            handleTabClick();
          }}
          style={{
            background: theme.bgElevated,
            border: `1px solid ${theme.borderColor}`,
            borderRight: 'none',
            borderRadius: '12px 0 0 12px',
            padding: '0px 10px',
            color: theme.textSecondary,
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, transform 0.3s ease',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100px',
            width: '50px',
            position: 'relative',
            top: '245px',
            animation: showTabPulse ? 'tabPulse 2s ease-in-out infinite' : 'none',
            fontFamily: "'Inter', sans-serif",
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent',
            outline: 'none',
            pointerEvents: 'auto',
            flexShrink: 0,
            zIndex: 1
          }}
          onMouseEnter={(e) => {
            if (!isTabHoverDisabled) {
              e.target.style.background = theme.bgContainer;
              e.target.style.borderColor = '#00ff99';
              e.target.style.color = theme.textPrimary;
              e.target.style.transform = 'translateX(-6px)';
              // Brillo como los KPIs pero sin el borde derecho (interior)
              e.target.style.boxShadow = '0 -0.5rem 0.5rem rgba(0, 255, 136, 0.15), 0 0.5rem 0.5rem rgba(0, 255, 136, 0.15), -0.25rem 0 0.5rem rgba(0, 255, 136, 0.15)';
            }
            setShowTabPulse(false);
          }}
          onMouseLeave={(e) => {
            e.target.style.background = theme.bgElevated;
            e.target.style.borderColor = theme.borderColor;
            e.target.style.color = theme.textSecondary;
            e.target.style.transform = 'translateX(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {/* FILTERS text written horizontally but rotated */}
          <div style={{
            fontSize: '10px',
            fontWeight: '600',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            lineHeight: '1',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitTouchCallout: 'none',
            pointerEvents: 'none',
            transform: 'rotate(-90deg)',
            whiteSpace: 'nowrap',
            marginLeft: '-10px'
          }}>FILTERS</div>
          
          {/* Active filters badge */}
          {activeFilters > 0 && (
            <div style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: '#00ff99',
              color: theme.bg,
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '600',
              fontFamily: "'Inter', sans-serif"
            }}>
              {activeFilters}
            </div>
          )}
        </button>

        {/* Main Sidebar Panel */}
        <div style={{
          width: '320px',
          height: '100vh',
          background: theme.bgElevated,
          border: `1px solid ${theme.borderColor}`,
          borderRight: 'none',
          borderLeft: 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
          pointerEvents: 'auto',
          marginLeft: '-5px',
          zIndex: 2
        }}>

          {/* Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: `1px solid ${theme.borderColor}`,
            background: theme.bgContainer
          }}>
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  flex: 1,
                  padding: '20px 16px',
                  background: activeSection === section.id ? theme.bgElevated : 'transparent',
                  border: 'none',
                  color: activeSection === section.id ? theme.textPrimary : theme.textSecondary,
                  fontSize: '14px',
                  fontWeight: activeSection === section.id ? '600' : '500',
                  cursor: 'pointer',
                  borderBottom: activeSection === section.id ? `3px solid #00ff99` : `3px solid transparent`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== section.id) {
                    e.target.style.color = theme.textPrimary;
                    e.target.style.background = theme.bgContainer;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== section.id) {
                    e.target.style.color = theme.textSecondary;
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            padding: '12px',
            overflowY: 'auto'
          }}>
            {activeSection === 'filters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                {/* Time Controls Section */}
                <div style={{
                  background: theme.bgContainer,
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1px solid ${theme.borderColor}`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  
                  {/* Date Range */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '12px',
                      color: theme.textSecondary,
                      fontSize: '13px',
                      fontWeight: '600',
                      fontFamily: "'Inter', sans-serif",
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>Date Range</label>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Start Date */}
                      <div style={{ position: 'relative' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '6px',
                          color: theme.textSecondary,
                          fontSize: '11px',
                          fontWeight: '500',
                          fontFamily: "'Inter', sans-serif",
                          letterSpacing: '0.025em',
                          textTransform: 'uppercase'
                        }}>Start Date</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                          <input
                            type="text"
                            value={dateRange.from}
                            placeholder="YYYY-MM-DD"
                            readOnly
                            tabIndex="-1"
                            style={{
                              flex: '1',
                              padding: '8px 12px',
                              border: `1px solid ${isStartDateModified() ? '#00ff99' : theme.borderColor}`,
                              borderRadius: '4px',
                              background: theme.bgElevated,
                              color: theme.textPrimary,
                              fontSize: '13px',
                              fontFamily: "'Inter', sans-serif",
                              fontWeight: '400',
                              outline: 'none',
                              transition: 'all 0.2s ease',
                              cursor: 'default',
                              pointerEvents: 'none'
                            }}
                          />
                          <div style={{ position: 'relative', width: '36px', height: '36px' }} >
                            <div 
                              style={{
                                width: '36px',
                                height: '36px',
                                border: `1px solid ${theme.borderColor}`,
                                borderRadius: '4px',
                                background: theme.bgElevated,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => {
                                setCalendarType('start');
                                if (dateRange.from) {
                                  setCalendarDate(new Date(dateRange.from));
                                }
                                setShowCustomCalendar(true);
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.borderColor = '#00ff99';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.borderColor = theme.borderColor;
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                        {isStartDateModified() && (
                          <div style={{
                            position: 'absolute',
                            right: '50px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            marginTop: '10px',
                            width: '6px',
                            height: '6px',
                            background: '#00ff99',
                            borderRadius: '50%',
                            boxShadow: '0 0 4px rgba(0, 255, 153, 0.6)'
                          }}></div>
                        )}
                      </div>
                      
                      {/* End Date */}
                      <div style={{ position: 'relative' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '6px',
                          color: theme.textSecondary,
                          fontSize: '11px',
                          fontWeight: '500',
                          fontFamily: "'Inter', sans-serif",
                          letterSpacing: '0.025em',
                          textTransform: 'uppercase'
                        }}>End Date</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                          <input
                            type="text"
                            value={dateRange.to}
                            placeholder="YYYY-MM-DD"
                            readOnly
                            tabIndex="-1"
                            style={{
                              flex: '1',
                              padding: '8px 12px',
                              border: `1px solid ${isEndDateModified() ? '#00ff99' : theme.borderColor}`,
                              borderRadius: '4px',
                              background: theme.bgElevated,
                              color: theme.textPrimary,
                              fontSize: '13px',
                              fontFamily: "'Inter', sans-serif",
                              fontWeight: '400',
                              outline: 'none',
                              transition: 'all 0.2s ease',
                              cursor: 'default',
                              pointerEvents: 'none'
                            }}
                          />
                          <div style={{ position: 'relative', width: '36px', height: '36px' }} >
                            <div 
                              style={{
                                width: '36px',
                                height: '36px',
                                border: `1px solid ${theme.borderColor}`,
                                borderRadius: '4px',
                                background: theme.bgElevated,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => {
                                setCalendarType('end');
                                if (dateRange.to) {
                                  setCalendarDate(new Date(dateRange.to));
                                }
                                setShowCustomCalendar(true);
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.borderColor = '#00ff99';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.borderColor = theme.borderColor;
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                        {isEndDateModified() && (
                          <div style={{
                            position: 'absolute',
                            right: '50px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            marginTop: '10px',
                            width: '6px',
                            height: '6px',
                            background: '#00ff99',
                            borderRadius: '50%',
                            boxShadow: '0 0 4px rgba(0, 255, 153, 0.6)'
                          }}></div>
                        )}
                      </div>
                      
                      {/* Date Range Status */}
                      {dateRange.from && dateRange.to && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          background: 'rgba(0, 255, 153, 0.1)',
                          border: '1px solid rgba(0, 255, 153, 0.3)',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#00ff99',
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: '500',
                          marginTop: '8px'
                        }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            background: '#00ff99',
                            borderRadius: '50%'
                          }}></div>
                          {Math.ceil((new Date(dateRange.to) - new Date(dateRange.from)) / (1000 * 60 * 60 * 24) + 1)} days selected
                        </div>
                      )}

                      {/* Clear Button */}
                      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-start' }}>
                        <button
                          onClick={() => {
                            const newRange = getDefaultDateRange();
                            setDateRange(newRange);
                            setSelectedTimePreset(''); // Clear any preset selection
                            updateActiveFiltersCount(hiddenAssets, newRange, '', minAllocation, balanceThreshold, excludedOperations);
                            // Communicate date change to parent/timeline
                            if (onFiltersChange) {
                              onFiltersChange({ 
                                type: 'dateRange', 
                                dateRange: { ...newRange }
                              });
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            border: `1px solid ${theme.borderColor}`,
                            borderRadius: '6px',
                            background: theme.bgElevated,
                            color: '#ff6b6b',
                            fontSize: '11px',
                            fontWeight: '600',
                            fontFamily: "'Inter', sans-serif",
                            cursor: 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            textTransform: 'none',
                            letterSpacing: '0.025em',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: `0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
                            backdropFilter: 'blur(10px)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#ff6b6b';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = theme.bgElevated;
                            e.target.style.color = '#ff6b6b';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                          }}
                          onMouseDown={(e) => {
                            e.target.style.transform = 'translateY(0) scale(0.98)';
                          }}
                          onMouseUp={(e) => {
                            e.target.style.transform = 'translateY(-2px) scale(1)';
                          }}
                        >
                          ✕ Clear
                        </button>
                      </div>

                    </div>
                  </div>
                  
                  {/* Quick Periods */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: theme.textSecondary,
                      fontSize: '12px',
                      fontWeight: '600',
                      fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>Quick Periods</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {['1W', '1M', '3M', '6M', '1Y', 'All'].map(preset => (
                        <button
                          key={preset}
                          onClick={() => setTimePresetDates(preset)}
                          style={{
                            padding: '8px 6px',
                            background: selectedTimePreset === preset ? '#00ff99' : theme.bgElevated,
                            border: `1px solid ${selectedTimePreset === preset ? '#00ff99' : theme.borderColor}`,
                            borderRadius: '4px',
                            color: selectedTimePreset === preset ? theme.bg : theme.textPrimary,
                            fontSize: '11px',
                            fontWeight: selectedTimePreset === preset ? '700' : '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace"
                          }}
                          onMouseEnter={(e) => {
                            if (selectedTimePreset !== preset) {
                              e.target.style.borderColor = '#00ff99';
                              e.target.style.backgroundColor = theme.bgContainer;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedTimePreset !== preset) {
                              e.target.style.borderColor = theme.borderColor;
                              e.target.style.backgroundColor = theme.bgElevated;
                            }
                          }}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assets Section */}
                <div style={{
                  background: theme.bgContainer,
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.borderColor}`,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: theme.textSecondary,
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>Assets</label>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px', 
                    maxHeight: '160px', 
                    overflowY: 'auto',
                    border: `1px solid ${theme.borderColor}`,
                    borderRadius: '6px',
                    padding: '8px'
                  }}>
                    {availableAssets.map(asset => (
                      <label key={asset} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '4px',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = theme.bgContainer;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                      }}
                      >
                        <input
                          type="checkbox"
                          checked={!hiddenAssets.has(asset)}
                          onChange={() => handleAssetToggle(asset)}
                          style={{
                            accentColor: '#00ff99'
                          }}
                        />
                        <span style={{
                          color: theme.textPrimary,
                          fontSize: '12px',
                          fontWeight: '600',
                          fontFamily: "'Inter', sans-serif"
                        }}>{asset}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Portfolio Filters */}
                <div style={{
                  background: theme.bgContainer,
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.borderColor}`,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: theme.textSecondary,
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>Portfolio Filters</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Min Allocation % */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '6px',
                        color: theme.textSecondary,
                        fontSize: '11px',
                        fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                        fontWeight: '600',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>Min Allocation %</label>
                      <input
                        type="number"
                        value={minAllocation}
                        onChange={(e) => {
                          setMinAllocation(e.target.value);
                          updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, e.target.value, balanceThreshold, excludedOperations);
                        }}
                        placeholder="0"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: `1px solid ${theme.borderColor}`,
                          borderRadius: '6px',
                          background: theme.bgElevated,
                          color: theme.textPrimary,
                          fontSize: '12px',
                          fontFamily: "'Inter', sans-serif"
                        }}
                      />
                    </div>

                    {/* Balance Threshold */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '6px',
                        color: theme.textSecondary,
                        fontSize: '11px',
                        fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                        fontWeight: '600',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>Balance Threshold</label>
                      <input
                        type="number"
                        value={balanceThreshold}
                        onChange={(e) => {
                          setBalanceThreshold(e.target.value);
                          updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, minAllocation, e.target.value, excludedOperations);
                        }}
                        placeholder="0"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: `1px solid ${theme.borderColor}`,
                          borderRadius: '6px',
                          background: theme.bgElevated,
                          color: theme.textPrimary,
                          fontSize: '12px',
                          fontFamily: "'Inter', sans-serif"
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Operations */}
                <div style={{
                  background: theme.bgContainer,
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.borderColor}`,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: theme.textSecondary,
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>Operations</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {['Buy', 'Sell', 'Market Orders', 'Limit Orders'].map(operation => (
                      <label key={operation} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = theme.bgElevated;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                      }}
                      >
                        <input
                          type="checkbox"
                          checked={!excludedOperations.has(operation)}
                          onChange={() => handleOperationToggle(operation)}
                          style={{
                            accentColor: '#00ff99'
                          }}
                        />
                        <span style={{
                          color: excludedOperations.has(operation) ? theme.textSecondary : theme.textPrimary,
                          fontWeight: excludedOperations.has(operation) ? '400' : '600',
                          fontSize: '12px',
                          fontFamily: "'Inter', sans-serif"
                        }}>{operation}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear All Button */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  marginTop: 'auto',
                  paddingTop: '12px',
                  marginBottom: '8px',
                  borderTop: `1px solid ${theme.borderColor}`
                }}>
                  <button
                    onClick={() => {
                      const defaultRange = getDefaultDateRange();
                      setHiddenAssets(new Set());
                      setDateRange(defaultRange);
                      setSelectedTimePreset('');
                      setMinAllocation('0');
                      setBalanceThreshold('0');
                      setExcludedOperations(new Set());
                      setActiveFilters(0);
                      console.log('All filters cleared');
                      if (onFiltersChange) {
                        onFiltersChange({
                          type: 'dateRange',
                          dateRange: defaultRange
                        });
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      background: theme.bgContainer,
                      border: `2px solid ${theme.textSecondary}`,
                      borderRadius: '6px',
                      color: theme.textPrimary,
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#ff6b6b';
                      e.target.style.color = '#ff6b6b';
                      e.target.style.background = theme.bgElevated;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = theme.textSecondary;
                      e.target.style.color = theme.textPrimary;
                      e.target.style.background = theme.bgContainer;
                    }}
                  >
                    CLEAR ALL
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'analytics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  padding: '16px',
                  background: theme.bgContainer,
                  borderRadius: '8px',
                  border: `1px solid ${theme.borderColor}`
                }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    color: theme.textPrimary,
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif"
                  }}>Portfolio Metrics</h4>
                  <div style={{ 
                    fontSize: '12px', 
                    color: theme.textSecondary,
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    Advanced analytics coming soon...
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'config' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Base Currency */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: theme.textSecondary,
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: "'Inter', sans-serif"
                  }}>Base Currency</label>
                  <select
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: `1px solid ${theme.borderColor}`,
                      borderRadius: '6px',
                      background: theme.bgContainer,
                      color: theme.textPrimary,
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif"
                    }}
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="BTC">BTC (₿)</option>
                  </select>
                </div>

                {/* Export Options */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: theme.textSecondary,
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: "'Inter', sans-serif"
                  }}>Export Data</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {['Export as CSV', 'Export as JSON', 'Export Report'].map(option => (
                      <button
                        key={option}
                        style={{
                          padding: '8px 12px',
                          background: theme.bgContainer,
                          border: `1px solid ${theme.borderColor}`,
                          borderRadius: '6px',
                          color: theme.textPrimary,
                          fontSize: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s ease',
                          fontFamily: "'Inter', sans-serif"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = '#00ff99';
                          e.target.style.backgroundColor = theme.bgElevated;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = theme.borderColor;
                          e.target.style.backgroundColor = theme.bgContainer;
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );

  // Create a dedicated portal container if it doesn't exist
  useEffect(() => {
    let portalRoot = document.getElementById('sidebar-portal-root');
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'sidebar-portal-root';
      portalRoot.className = 'sidebar-portal';
      // Ensure it's at the very top of the DOM
      document.body.appendChild(portalRoot);
    }
    return () => {
      // Clean up on component unmount if needed
      const existingPortal = document.getElementById('sidebar-portal-root');
      if (existingPortal && !existingPortal.hasChildNodes()) {
        document.body.removeChild(existingPortal);
      }
    };
  }, []);

  // Get or create portal target
  const getPortalTarget = () => {
    let portalRoot = document.getElementById('sidebar-portal-root');
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'sidebar-portal-root';
      portalRoot.className = 'sidebar-portal';
      document.body.appendChild(portalRoot);
    }
    return portalRoot;
  };

  // Render sidebar as portal to avoid any parent container interference
  return (
    <>
      {createPortal(sidebarContent, getPortalTarget())}
      
      {/* Apply Filter Popup */}
      {shouldShowPopup && (() => {
        // Crear un contenedor específico para el popup que no tenga restricciones
        let popupRoot = document.getElementById('popup-portal-root');
        if (!popupRoot) {
          popupRoot = document.createElement('div');
          popupRoot.id = 'popup-portal-root';
          popupRoot.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 999999;
          `;
          document.body.appendChild(popupRoot);
        }
        
        // Función para obtener el transform según la animación
        const getTransform = () => {
          switch(popupAnimation) {
            case 'entering':
              return 'translateY(30px) scale(0.95)';
            case 'visible':
              return 'translateY(0) scale(1)';
            case 'applying':
              return 'translateY(-5px) scale(0.98)';
            case 'exitingRight':
              return 'translateY(0) translateX(200px) scale(0.9)';
            default:
              return 'translateY(0) scale(1)';
          }
        };
        
        return createPortal(
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid #00ff88',
              borderRadius: '6px',
              padding: '8px',
              fontFamily: 'Inter, sans-serif',
              pointerEvents: 'auto',
              boxShadow: popupAnimation === 'applying' ? '0 0 40px rgba(0, 255, 136, 0.8)' : '0 0 20px rgba(0, 255, 136, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              transition: popupAnimation === 'entering' ? 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'all 0.3s ease-out',
              transform: getTransform(),
              opacity: popupAnimation === 'exitingRight' ? 0 : 1,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Contenedor de botones */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
            <button
              onClick={handleApplyFilter}
              style={{
                background: '#00ff88',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                letterSpacing: '0.1px',
                pointerEvents: 'auto',
                transition: 'all 0.2s ease',
                transform: 'scale(1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#00ff99';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#00ff88';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Apply Filter to Page
            </button>
            
            <button
              onClick={handleClosePopup}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '16px',
                cursor: 'pointer',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                pointerEvents: 'auto',
                transform: 'scale(1) rotate(0deg)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = '#ff6666';
                e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
              }}
            >
              ×
            </button>
            </div>
          </div>,
          popupRoot
        );
      })()}

      {/* Custom Calendar */}
      {showCustomCalendar && (() => {
        let calendarRoot = document.getElementById('calendar-portal-root');
        if (!calendarRoot) {
          calendarRoot = document.createElement('div');
          calendarRoot.id = 'calendar-portal-root';
          calendarRoot.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 999999;
          `;
          document.body.appendChild(calendarRoot);
        }

        return createPortal(
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#0a0a0a',
              border: '1px solid #333333',
              borderRadius: '4px',
              padding: '12px',
              fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
              pointerEvents: 'auto',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
              width: '260px',
              fontSize: '12px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with date type and close */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '8px',
              position: 'relative',
              height: '24px'
            }}>
              <div style={{
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.8px'
              }}>
                {calendarType === 'start' ? 'START DATE' : 'END DATE'}
              </div>
              <button
                onClick={() => setShowCustomCalendar(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ff6666',
                  fontSize: '22px',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1',
                  width: '28px',
                  height: '28px',
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
                  e.target.style.background = 'rgba(255, 102, 102, 0.2)';
                  e.target.style.color = '#ff6666';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#ff6666';
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
                  fontSize: '24px',
                  cursor: isMonthNavigationDisabled(-1) ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  transition: 'all 0.2s ease',
                  minWidth: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => !isMonthNavigationDisabled(-1) && (e.target.style.color = '#ffffff')}
                onMouseLeave={(e) => !isMonthNavigationDisabled(-1) && (e.target.style.color = '#ffffff')}
              >
                ‹
              </button>
              
              <div 
                onClick={() => setShowMonthYearSelector(!showMonthYearSelector)}
                style={{ 
                  fontWeight: '600',
                  color: '#ffffff',
                  fontSize: '12px',
                  textAlign: 'center',
                  background: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  minWidth: '120px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#2a2a2a';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#1a1a1a';
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
                  fontSize: '24px',
                  cursor: isMonthNavigationDisabled(1) ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  transition: 'all 0.2s ease',
                  minWidth: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => !isMonthNavigationDisabled(1) && (e.target.style.color = '#ffffff')}
                onMouseLeave={(e) => !isMonthNavigationDisabled(1) && (e.target.style.color = '#ffffff')}
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
                  background: '#0a0a0a',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '12px',
                  zIndex: 1000,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  minWidth: '240px'
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
                                e.target.style.background = '#2a2a2a';
                                e.target.style.color = '#ffffff';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isAvailable && calendarDate.getMonth() !== index) {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#cccccc';
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
                              e.target.style.background = '#2a2a2a';
                              e.target.style.color = '#ffffff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (calendarDate.getFullYear() !== year) {
                              e.target.style.background = 'transparent';
                              e.target.style.color = '#cccccc';
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
              gap: '1px',
              marginBottom: '6px'
            }}>
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, index) => {
                const isWeekend = index === 0 || index === 6; // Sunday = 0, Saturday = 6
                return (
                  <div key={index} style={{
                    textAlign: 'center',
                    padding: '6px 0',
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
              gap: '1px'
            }}>
              {generateCalendar(calendarDate.getFullYear(), calendarDate.getMonth()).map((day, index) => {
                const dayState = getDayState(day, calendarDate.getFullYear(), calendarDate.getMonth());
                const isWeekend = index % 7 === 0 || index % 7 === 6; // Sunday = 0, Saturday = 6
                
                let backgroundColor = 'transparent';
                let color = '#cccccc';
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
                  } else if (isWeekend) {
                    // Weekend days in red if not selected
                    color = '#ff6666';
                  }
                }

                const isSelected = dayState === 'selected-start' || dayState === 'selected-end';

                return (
                  <div
                    key={index}
                    onClick={() => day && dayState !== 'disabled' && handleDayClick(day)}
                    style={{
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: day ? cursor : 'default',
                      backgroundColor,
                      color,
                      fontSize: '14px',
                      fontWeight: isSelected ? '700' : dayState === 'in-range' ? '500' : '400',
                      userSelect: 'none',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (day && dayState !== 'disabled' && !isSelected) {
                        if (dayState === 'in-range') {
                          e.target.style.backgroundColor = '#263d2a';
                          e.target.style.color = '#ffffff';
                        } else {
                          e.target.style.backgroundColor = '#2a2a2a';
                          e.target.style.color = '#ffffff';
                        }
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (day && dayState !== 'disabled' && !isSelected) {
                        if (dayState === 'in-range') {
                          e.target.style.backgroundColor = '#1a2d1f';
                          e.target.style.color = '#ffffff';
                        } else {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#cccccc';
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
              marginTop: '12px',
              display: 'flex',
              justifyContent: 'flex-start'
            }}>
              <button
                onClick={() => {
                  let newRange;
                  if (calendarType === 'start') {
                    // Solo limpiar start date, mantener end date
                    const defaultRange = getDefaultDateRange();
                    newRange = { from: defaultRange.from, to: dateRange.to || defaultRange.to };
                  } else {
                    // Solo limpiar end date, mantener start date
                    const defaultRange = getDefaultDateRange();
                    newRange = { from: dateRange.from || defaultRange.from, to: defaultRange.to };
                  }
                  setDateRange(newRange);
                  setSelectedTimePreset('');
                  updateActiveFiltersCount(hiddenAssets, newRange, '', minAllocation, balanceThreshold, excludedOperations);
                  if (onFiltersChange) {
                    onFiltersChange({ 
                      type: 'dateRange', 
                      dateRange: { ...newRange }
                    });
                  }
                  setShowCustomCalendar(false);
                }}
                style={{
                  padding: '6px 14px',
                  border: '1px solid #444444',
                  borderRadius: '4px',
                  background: 'transparent',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#2a2a2a';
                  e.target.style.borderColor = '#666666';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = '#444444';
                }}
              >
                CLEAR
              </button>
            </div>
          </div>,
          calendarRoot
        );
      })()}
    </>
  );
};

export default Filters;