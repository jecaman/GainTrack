import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './Filters.css';

// Asset Logo Component with multiple fallbacks
const AssetLogo = ({ asset, size = 16 }) => {
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');

  // Asset name mapping for logo URLs (some assets have different names in APIs)
  const assetLogoMapping = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum', 
    'XRP': 'xrp',
    'SOL': 'solana',
    'LINK': 'chainlink',
    'HBAR': 'hedera-hashgraph',
    'TRUMP': 'trump' // Might not exist, will fallback
  };

  // Multiple logo sources with fallbacks
  const logoSources = [
    // CoinCap (usually most reliable)
    `https://assets.coincap.io/assets/icons/${(assetLogoMapping[asset] || asset).toLowerCase()}@2x.png`,
    // CoinGecko alternative
    `https://coin-images.coingecko.com/coins/images/${(assetLogoMapping[asset] || asset).toLowerCase()}/small/${(assetLogoMapping[asset] || asset).toLowerCase()}.png`,
    // Direct asset name fallback
    `https://assets.coincap.io/assets/icons/${asset.toLowerCase()}@2x.png`
  ];

  useEffect(() => {
    setCurrentSrc(logoSources[0]);
    setImageError(false);
  }, [asset]);

  const handleImageError = () => {
    const currentIndex = logoSources.indexOf(currentSrc);
    if (currentIndex < logoSources.length - 1) {
      // Try next source
      setCurrentSrc(logoSources[currentIndex + 1]);
    } else {
      // All sources failed, show fallback
      setImageError(true);
    }
  };

  if (imageError) {
    // Fallback: Show a generic crypto icon or first letter
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #00ff99, #00cc7a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${size * 0.6}px`,
        fontWeight: '700',
        color: '#000',
        fontFamily: "'SF Mono', monospace"
      }}>
        {asset[0]}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={asset}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover'
      }}
      onError={handleImageError}
    />
  );
};

const Filters = ({ theme, onFiltersChange, onFilterReset, portfolioData, onSidebarToggle, showApplyPopup, setShowApplyPopup, startDate, endDate, onApplyToAll, popupSource, timelineQuickFilter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTabPulse, setShowTabPulse] = useState(false);
  const [isTabHoverDisabled, setIsTabHoverDisabled] = useState(false);
  const [activeSection, setActiveSection] = useState('filters');
  const [hiddenAssets, setHiddenAssets] = useState(new Set());
  const [disabledAssets, setDisabledAssets] = useState(new Set()); // Track threshold-filtered assets (disabled, not hidden)
  const [manuallyHiddenAssets, setManuallyHiddenAssets] = useState(new Set()); // Track assets manually hidden by user
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedTimePreset, setSelectedTimePreset] = useState('All');
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
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  
  // Refs para botones de calendario
  const startCalendarButtonRef = useRef(null);
  const endCalendarButtonRef = useRef(null);
  
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

  // Helper function to check if date range matches default (sets preset to 'All')
  const checkAndSetPresetIfDefault = (newRange) => {
    if (isFullDateRange(newRange)) {
      setSelectedTimePreset('All');
    }
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
      checkAndSetPresetIfDefault(newRange);
      updateActiveFiltersCount(hiddenAssets, newRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
      
      if (onFiltersChange) {
        // Check if dates are equal (point click scenario) - don't update timeline in this case
        const isPointClick = newRange.from === newRange.to;
        onFiltersChange({
          type: 'dateRange',
          dateRange: { ...newRange }
        }, isPointClick); // Pass isPointClick as skipTimelineUpdate
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
      checkAndSetPresetIfDefault(newRange);
      updateActiveFiltersCount(hiddenAssets, newRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
      
      if (onFiltersChange) {
        // Check if dates are equal (point click scenario) - don't update timeline in this case
        const isPointClick = newRange.from === newRange.to;
        onFiltersChange({
          type: 'dateRange',
          dateRange: { ...newRange }
        }, isPointClick); // Pass isPointClick as skipTimelineUpdate
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
      // Set 'All' preset for default range
      setSelectedTimePreset('All');
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
      const newRange = { from: startDate, to: endDate };
      setDateRange(newRange);
      // Check if this range matches default and clear preset if so
      checkAndSetPresetIfDefault(newRange);
      // Update the active filters count to reflect the change
      updateActiveFiltersCount(hiddenAssets, newRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
    }
  }, [startDate, endDate, hiddenAssets, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations]);
  
  // Sync with timeline quick filter when Apply to All is used
  useEffect(() => {
    if (timelineQuickFilter) {
      // Map timeline quick filter to tab preset format
      const presetMap = {
        '1w': '1W',
        '1m': '1M', 
        '3m': '3M',
        '6m': '6M',
        '1y': '1Y',
        'all': 'All'
      };
      
      const mappedPreset = presetMap[timelineQuickFilter];
      if (mappedPreset && mappedPreset !== selectedTimePreset) {
        setSelectedTimePreset(mappedPreset);
      }
    }
  }, [timelineQuickFilter]);
  
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

  // Auto-disable assets that don't meet threshold criteria
  useEffect(() => {
    if (!portfolioData?.portfolio_data) return;
    
    // Calculate which assets should be disabled based on thresholds
    const assetsToDisable = portfolioData.portfolio_data
      .filter(asset => {
        if ((asset.current_value || 0) <= 0) return false;
        
        // Calculate total portfolio value for allocation percentage
        const totalPortfolioValue = portfolioData.portfolio_data.reduce((sum, a) => sum + (a.current_value || 0), 0);
        
        // Calculate allocation percentage for this asset
        const allocationPercent = totalPortfolioValue > 0 ? (asset.current_value / totalPortfolioValue) * 100 : 0;
        
        // Apply minAllocation filter
        const minAllocThreshold = parseFloat(minAllocation || 0);
        const meetsAllocation = allocationPercent >= minAllocThreshold;
        
        // Apply balanceThreshold filter
        const balanceThresholdValue = parseFloat(balanceThreshold || 0);
        const meetsBalance = asset.current_value >= balanceThresholdValue;
        
        // Return true if asset should be disabled (doesn't meet criteria)
        return !(meetsAllocation && meetsBalance);
      })
      .map(asset => asset.asset);
    
    const newDisabledAssets = new Set(assetsToDisable);
    
    // Only update if there's a change
    if (newDisabledAssets.size !== disabledAssets.size || 
        [...newDisabledAssets].some(asset => !disabledAssets.has(asset)) ||
        [...disabledAssets].some(asset => !newDisabledAssets.has(asset))) {
      setDisabledAssets(newDisabledAssets);
      
      // For visual feedback only - disabled assets remain visible but grayed out
      // We still hide them from the chart/data processing by including them in hiddenAssets
      // BUT preserve manually hidden assets - only remove previously threshold-disabled assets that are now enabled
      const currentlyDisabled = new Set(disabledAssets);
      const newlyDisabled = new Set(assetsToDisable);
      
      // Remove assets that were disabled by threshold but are now enabled (if they weren't manually hidden)
      const assetsToUnhide = [...currentlyDisabled].filter(asset => !newlyDisabled.has(asset));
      
      // Start with manually hidden assets (always preserved) plus newly disabled assets
      const newHiddenAssets = new Set([...manuallyHiddenAssets, ...assetsToDisable]);
      
      setHiddenAssets(newHiddenAssets);
      updateActiveFiltersCount(newHiddenAssets, dateRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
      
      // Notify parent component about asset filter changes
      onFiltersChange({
        type: 'assetFilter',
        hiddenAssets: newHiddenAssets
      });
    }
  }, [minAllocation, balanceThreshold, portfolioData]);

  // Get available assets from portfolio data (show all assets, disabled ones will be styled differently)
  const availableAssets = portfolioData?.portfolio_data ?
    portfolioData.portfolio_data
      .filter(asset => (asset.current_value || 0) > 0)
      .map(asset => asset.asset) : [];

  // When a date range is active, restrict asset and operation lists to only what
  // exists in the selected period, so the user doesn't see irrelevant options.
  const periodFilteredLists = useMemo(() => {
    const firstTimelineDate = portfolioData?.timeline?.[0]?.date?.split('T')[0] || '';
    const lastTimelineDate  = portfolioData?.timeline?.[portfolioData?.timeline?.length - 1]?.date?.split('T')[0] || '';
    const isDateFiltered = startDate && endDate &&
      (startDate > firstTimelineDate || endDate < lastTimelineDate);

    if (!isDateFiltered || !portfolioData?.timeline) {
      return { assets: null, operationTypes: null };
    }

    // Reverse mapping: Kraken name → display name (e.g. 'XXBT' → 'BTC')
    const reverseMapping = portfolioData?.asset_mapping
      ? Object.fromEntries(Object.entries(portfolioData.asset_mapping).map(([k, v]) => [v, k]))
      : {};

    const assetSet   = new Set();
    const opTypeSet  = new Set();

    portfolioData.timeline.forEach(entry => {
      const entryDate = entry.date.split('T')[0];
      if (entryDate >= startDate && entryDate <= endDate) {
        (entry.operations || []).forEach(op => {
          if (op.asset) assetSet.add(reverseMapping[op.asset] || op.asset);
          if (op.operation_key) opTypeSet.add(op.operation_key);
        });
      }
    });

    return {
      assets: Array.from(assetSet).filter(a => availableAssets.includes(a)),
      operationTypes: Array.from(opTypeSet)
    };
  }, [startDate, endDate, portfolioData?.timeline, portfolioData?.asset_mapping, availableAssets]);

  // Use period-restricted lists when a date filter is active
  const displayAssets         = periodFilteredLists.assets         ?? availableAssets;
  const displayOperationTypes = periodFilteredLists.operationTypes ?? ['Buy Limit', 'Buy Market', 'Sell Limit'];

  // Helper function to get max portfolio value from timeline
  const getMaxTimelineValue = () => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) {
      return 100; // Fallback
    }
    
    const values = portfolioData.timeline.map(item => {
      return item.portfolio_value || item.total_value || item.value || 0;
    });
    
    const maxValue = Math.max(...values);
    return Math.max(100, Math.ceil(maxValue));
  };

  // Helper function to update active filters count — max 1 per section (4 sections total)
  const updateActiveFiltersCount = (hiddenAssets, dateRng, timePreset, minAlloc, balThreshold, excludedOps) => {
    let count = 0;

    // Date Range section: date modified OR non-All preset counts as one filter
    let dateRangeActive = false;
    if (portfolioData?.timeline && portfolioData.timeline.length > 0) {
      const defaultStartDate = new Date(portfolioData.timeline[0].date).toISOString().split('T')[0];
      const defaultEndDate = new Date(portfolioData.timeline[portfolioData.timeline.length - 1].date).toISOString().split('T')[0];
      dateRangeActive = dateRng.from !== defaultStartDate || dateRng.to !== defaultEndDate;
    }
    if (dateRangeActive || (timePreset && timePreset !== 'All')) count++;

    // Assets section
    if (hiddenAssets.size > 0) count++;

    // Threshold Filters section: min alloc OR balance threshold count as one filter
    if ((minAlloc && parseFloat(minAlloc) > 0) || (balThreshold && parseFloat(balThreshold) > 0)) count++;

    // Operations section
    if (excludedOps && excludedOps.size > 0) count++;

    setActiveFilters(count);
  };

  // Per-section active state for green indicator dots
  const sectionActive = useMemo(() => {
    let dateRangeActive = false;
    if (portfolioData?.timeline?.length > 0) {
      const defaultStart = new Date(portfolioData.timeline[0].date).toISOString().split('T')[0];
      const defaultEnd = new Date(portfolioData.timeline[portfolioData.timeline.length - 1].date).toISOString().split('T')[0];
      dateRangeActive = dateRange.from !== defaultStart || dateRange.to !== defaultEnd;
    }
    return {
      dateRange: dateRangeActive || (selectedTimePreset && selectedTimePreset !== 'All'),
      assets: hiddenAssets.size > 0,
      thresholds: (parseFloat(minAllocation) > 0) || (parseFloat(balanceThreshold) > 0),
      operations: excludedOperations.size > 0,
    };
  }, [dateRange, selectedTimePreset, hiddenAssets, minAllocation, balanceThreshold, excludedOperations, portfolioData?.timeline]);

  // Helper function to set time preset dates
  const setTimePresetDates = (preset) => {
    let newRange;

    // Local-time date formatter — matches TimelineChart's formatDate to avoid timezone mismatches
    const fmtLocal = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (preset === 'All') {
      // Para 'All', usar el rango completo disponible
      newRange = getDefaultDateRange();
    } else {
      const now = new Date();
      const endDate = fmtLocal(now);
      let startDate;

      switch(preset) {
        case '1W': {
          const d = new Date(now); d.setDate(d.getDate() - 7);
          startDate = fmtLocal(d);
          break;
        }
        case '1M': {
          const d = new Date(now); d.setMonth(d.getMonth() - 1);
          startDate = fmtLocal(d);
          break;
        }
        case '3M': {
          const d = new Date(now); d.setMonth(d.getMonth() - 3);
          startDate = fmtLocal(d);
          break;
        }
        case '6M': {
          const d = new Date(now); d.setMonth(d.getMonth() - 6);
          startDate = fmtLocal(d);
          break;
        }
        case '1Y': {
          const d = new Date(now); d.setFullYear(d.getFullYear() - 1);
          startDate = fmtLocal(d);
          break;
        }
        default:
          return;
      }

      newRange = { from: startDate, to: endDate };
    }
    
    setDateRange(newRange);
    setSelectedTimePreset(preset);
    updateActiveFiltersCount(hiddenAssets, newRange, preset, minAllocation, balanceThreshold, excludedOperations);
    
    // Aplicar el filtro automáticamente
    if (onFiltersChange) {
      onFiltersChange({
        type: 'dateRange',
        dateRange: { ...newRange },
        selectedPreset: preset
      });
    }
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

  // Add CSS animations, hide scrollbar styles, and custom scrollbars
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
      /* Global custom scrollbars */
      body ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      body ::-webkit-scrollbar-track {
        background: transparent;
      }
      body ::-webkit-scrollbar-thumb {
        background: rgba(180, 180, 180, 0.4);
        border-radius: 2px;
      }
      body ::-webkit-scrollbar-thumb:hover {
        background: rgba(180, 180, 180, 0.65);
      }
      /* Filter sidebar scrollbars */
      .filter-sidebar ::-webkit-scrollbar {
        width: 4px;
      }
      .filter-sidebar ::-webkit-scrollbar-track {
        background: transparent;
      }
      .filter-sidebar ::-webkit-scrollbar-thumb {
        background: rgba(180, 180, 180, 0.4);
        border-radius: 2px;
      }
      .filter-sidebar ::-webkit-scrollbar-thumb:hover {
        background: rgba(180, 180, 180, 0.65);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleAssetToggle = (asset) => {
    // Prevent toggling disabled assets
    if (disabledAssets.has(asset)) {
      return;
    }
    
    const newHidden = new Set(hiddenAssets);
    const newManuallyHidden = new Set(manuallyHiddenAssets);
    
    if (newHidden.has(asset)) {
      // Unhiding asset - remove from both hidden and manually hidden
      newHidden.delete(asset);
      newManuallyHidden.delete(asset);
    } else {
      // Hiding asset - add to both hidden and manually hidden
      newHidden.add(asset);
      newManuallyHidden.add(asset);
    }
    
    setHiddenAssets(newHidden);
    setManuallyHiddenAssets(newManuallyHidden);
    updateActiveFiltersCount(newHidden, dateRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
    
    // Send asset filter change to Timeline
    if (onFiltersChange) {
      onFiltersChange({
        type: 'assetFilter',
        hiddenAssets: newHidden
      });
    }
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
    
    // Notify parent component about operation filter changes
    if (onFiltersChange) {
      onFiltersChange({
        type: 'excludedOperations',
        excludedOperations: newExcluded
      });
    }
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
            color: '#ffffff',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, transform 0.3s ease',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '120px',
            width: '60px',
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
              e.currentTarget.style.background = theme.bgContainer;
              e.currentTarget.style.borderColor = '#00ff99';
              e.currentTarget.style.color = theme.textPrimary;
              e.currentTarget.style.transform = 'translateX(-6px)';
              // Brillo como los KPIs pero sin el borde derecho (interior)
              e.currentTarget.style.boxShadow = '0 -0.5rem 0.5rem rgba(0, 255, 136, 0.15), 0 0.5rem 0.5rem rgba(0, 255, 136, 0.15), -0.25rem 0 0.5rem rgba(0, 255, 136, 0.15)';
            }
            setShowTabPulse(false);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.bgElevated;
            e.currentTarget.style.borderColor = theme.borderColor;
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* FILTERS text written horizontally but rotated */}
          <div style={{
            fontSize: '12px',
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
            marginLeft: '-10px',
            color: '#ffffff',
            textShadow: '0 0 8px rgba(255,255,255,0.45)'
          }}>FILTERS</div>

          {/* Active filters badge */}
          {activeFilters > 0 && (
            <div style={{
              position: 'absolute',
              top: '-6px',
              left: '-6px',
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
        <div className="filter-sidebar" style={{
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
                    e.currentTarget.style.color = theme.textPrimary;
                    e.currentTarget.style.background = theme.bgContainer;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== section.id) {
                    e.currentTarget.style.color = theme.textSecondary;
                    e.currentTarget.style.background = 'transparent';
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
                  <div style={{ marginBottom: '16px', marginTop: '20px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>Date Range{sectionActive.dateRange && <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#00ff99', boxShadow: '0 0 7px rgba(0,255,153,0.9)', flexShrink: 0 }} />}</label>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Start Date */}
                      <div style={{ position: 'relative' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '6px',
                          color: theme.textSecondary,
                          fontSize: '12px',
                          fontWeight: '600',
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
                              background: theme.bgContainer,
                              color: theme.textPrimary,
                              fontSize: '13px',
                              fontFamily: "'Inter', sans-serif",
                              fontWeight: '600',
                              outline: 'none',
                              transition: 'all 0.2s ease',
                              cursor: 'default',
                              pointerEvents: 'none'
                            }}
                          />
                          <div style={{ position: 'relative', width: '36px', height: '36px' }} >
                            <div 
                              ref={startCalendarButtonRef}
                              style={{
                                width: '36px',
                                height: '36px',
                                border: `1px solid ${theme.borderColor}`,
                                borderRadius: '4px',
                                background: theme.bgContainer,
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
                                // Calcular posición del botón
                                if (startCalendarButtonRef.current) {
                                  const rect = startCalendarButtonRef.current.getBoundingClientRect();
                                  setCalendarPosition({
                                    top: rect.bottom + 75,
                                    left: rect.left - 220
                                  });
                                }
                                setShowCustomCalendar(true);
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#00ff99';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = theme.borderColor;
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
                          fontSize: '12px',
                          fontWeight: '600',
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
                              background: theme.bgContainer,
                              color: theme.textPrimary,
                              fontSize: '13px',
                              fontFamily: "'Inter', sans-serif",
                              fontWeight: '600',
                              outline: 'none',
                              transition: 'all 0.2s ease',
                              cursor: 'default',
                              pointerEvents: 'none'
                            }}
                          />
                          <div style={{ position: 'relative', width: '36px', height: '36px' }} >
                            <div 
                              ref={endCalendarButtonRef}
                              style={{
                                width: '36px',
                                height: '36px',
                                border: `1px solid ${theme.borderColor}`,
                                borderRadius: '4px',
                                background: theme.bgContainer,
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
                                // Calcular posición del botón  
                                if (startCalendarButtonRef.current) {
                                  const rect = startCalendarButtonRef.current.getBoundingClientRect();
                                  setCalendarPosition({
                                    top: rect.bottom + 75,
                                    left: rect.left - 220
                                  });
                                }
                                setShowCustomCalendar(true);
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#00ff99';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = theme.borderColor;
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
                          fontSize: '12px',
                          color: '#00ff99',
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: '700',
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

                      {/* Clear Button - Solo visible si las fechas han sido modificadas */}
                      {(isStartDateModified() || isEndDateModified()) && (
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-start' }}>
                          <button
                            onClick={() => {
                              const newRange = getDefaultDateRange();
                              setDateRange(newRange);
                              setSelectedTimePreset('All'); // Set to 'All' for default range
                              updateActiveFiltersCount(hiddenAssets, newRange, 'All', minAllocation, balanceThreshold, excludedOperations);
                              // Use onFilterReset for date resets to ensure timeline dates are also updated
                              if (onFilterReset) {
                                onFilterReset({ 
                                  type: 'dateRange', 
                                  dateRange: { ...newRange }
                                });
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              border: `1px solid ${theme.borderColor}`,
                              borderRadius: '6px',
                              background: theme.bgContainer,
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
                              e.currentTarget.style.background = '#ff6b6b';
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = theme.bgElevated;
                              e.currentTarget.style.color = '#ff6b6b';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                            }}
                            onMouseDown={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
                            }}
                            onMouseUp={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
                            }}
                          >
                            ✕ Clear
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                  
                  {/* Quick Periods */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#ffffff',
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
                              e.currentTarget.style.borderColor = '#00ff99';
                              e.currentTarget.style.backgroundColor = theme.bgContainer;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedTimePreset !== preset) {
                              e.currentTarget.style.borderColor = theme.borderColor;
                              e.currentTarget.style.backgroundColor = theme.bgElevated;
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>ASSETS{sectionActive.assets && <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#00ff99', boxShadow: '0 0 7px rgba(0,255,153,0.9)', flexShrink: 0 }} />}</label>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px', 
                    maxHeight: '240px', 
                    overflowY: 'auto',
                    border: `1px solid ${theme.borderColor}`,
                    borderRadius: '6px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    {displayAssets.map(asset => {
                      const isDisabled = disabledAssets.has(asset);
                      return (
                      <label key={asset} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        padding: '10px',
                        borderRadius: '4px',
                        transition: 'background 0.2s ease, opacity 0.2s ease',
                        opacity: isDisabled ? 0.4 : 1,
                        filter: isDisabled ? 'grayscale(0.8)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.background = theme.bgContainer;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                      >
                        <input
                          type="checkbox"
                          checked={!hiddenAssets.has(asset)}
                          onChange={() => handleAssetToggle(asset)}
                          disabled={isDisabled}
                          style={{
                            accentColor: isDisabled ? 'rgba(0, 255, 153, 0.3)' : '#00ff99',
                            cursor: isDisabled ? 'not-allowed' : 'pointer'
                          }}
                        />
                        {/* Asset Logo */}
                        <div style={{ opacity: isDisabled ? 0.5 : 1 }}>
                          <AssetLogo asset={asset} size={20} />
                        </div>
                        <span style={{
                          color: isDisabled ? 'rgba(245, 245, 245, 0.4)' : theme.textPrimary,
                          fontSize: '14px',
                          fontWeight: '600',
                          fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace"
                        }}>{asset}</span>
                        {isDisabled && (
                          <span style={{
                            marginLeft: 'auto',
                            fontSize: '11px',
                            color: 'rgba(245, 245, 245, 0.5)',
                            fontStyle: 'italic'
                          }}>
                            Filtered
                          </span>
                        )}
                      </label>
                    )})}
                    
                  </div>
                  
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '4px'
                  }}>
                    <span style={{
                      color: theme.textPrimary,
                      fontSize: '13px',
                      fontWeight: '600',
                      fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                      letterSpacing: '0.1px',
                      textTransform: 'uppercase'
                    }}>SELECT ALL</span>
                    <input
                      type="checkbox"
                      checked={displayAssets.filter(asset => !disabledAssets.has(asset) && !hiddenAssets.has(asset)).length === displayAssets.filter(asset => !disabledAssets.has(asset)).length && displayAssets.filter(asset => !disabledAssets.has(asset)).length > 0}
                      onChange={() => {
                        const enabledAssets = displayAssets.filter(asset => !disabledAssets.has(asset));
                        const selectedEnabledAssets = enabledAssets.filter(asset => !hiddenAssets.has(asset));
                        
                        if (selectedEnabledAssets.length === enabledAssets.length) {
                          // If all enabled are selected, deselect all enabled
                          const newHidden = new Set([...hiddenAssets, ...enabledAssets]);
                          const newManuallyHidden = new Set([...manuallyHiddenAssets, ...enabledAssets]);
                          setHiddenAssets(newHidden);
                          setManuallyHiddenAssets(newManuallyHidden);
                          updateActiveFiltersCount(newHidden, dateRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
                          if (onFiltersChange) {
                            onFiltersChange({
                              type: 'assetFilter',
                              hiddenAssets: newHidden
                            });
                          }
                        } else {
                          // Select all enabled assets (keep disabled assets hidden)
                          const newHidden = new Set([...hiddenAssets]);
                          const newManuallyHidden = new Set(manuallyHiddenAssets);
                          enabledAssets.forEach(asset => {
                            newHidden.delete(asset);
                            newManuallyHidden.delete(asset);
                          });
                          
                          setHiddenAssets(newHidden);
                          setManuallyHiddenAssets(newManuallyHidden);
                          updateActiveFiltersCount(newHidden, dateRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
                          if (onFiltersChange) {
                            onFiltersChange({
                              type: 'assetFilter',
                              hiddenAssets: newHidden
                            });
                          }
                        }
                      }}
                      style={{
                        accentColor: '#00ff99',
                        cursor: 'pointer'
                      }}
                    />
                  </label>
                </div>

                {/* Threshold Filters */}
                <div style={{
                  background: theme.bgContainer,
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.borderColor}`,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>THRESHOLD FILTERS{sectionActive.thresholds && <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#00ff99', boxShadow: '0 0 7px rgba(0,255,153,0.9)', flexShrink: 0 }} />}</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Min Allocation % - Compact Design */}
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '6px'
                      }}>
                        <label style={{
                          color: '#ffffff',
                          fontSize: '11px',
                          fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                          fontWeight: '600',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}>Min Allocation</label>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={minAllocation}
                              onChange={(e) => {
                                const value = e.target.value;
                                
                                if (value === '') {
                                  setMinAllocation('');
                                  updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, '', balanceThreshold, excludedOperations);
                                  onFiltersChange({
                                    type: 'minAllocation',
                                    minAllocation: ''
                                  });
                                  return;
                                }
                                
                                const regex = /^(\d{1,2}(\.\d?)?|100(\.0?)?)$/;
                                
                                if (regex.test(value)) {
                                  const numValue = parseFloat(value);
                                  if (numValue >= 0 && numValue <= 100) {
                                    setMinAllocation(value);
                                    updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, value, balanceThreshold, excludedOperations);
                                    onFiltersChange({
                                      type: 'minAllocation',
                                      minAllocation: value
                                    });
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                if (value.endsWith('.')) {
                                  const newValue = value.slice(0, -1);
                                  setMinAllocation(newValue);
                                  updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, newValue, balanceThreshold, excludedOperations);
                                  onFiltersChange({
                                    type: 'minAllocation',
                                    minAllocation: newValue
                                  });
                                }
                              }}
                              placeholder="0%"
                              style={{
                                width: '55px',
                                padding: '4px 18px 4px 6px',
                                border: `1px solid ${theme.borderColor}`,
                                borderRadius: '4px 0 0 4px',
                                background: theme.bgContainer,
                                color: theme.textPrimary,
                                fontSize: '12px',
                                fontWeight: '600',
                                fontFamily: "'Inter', sans-serif",
                                textAlign: 'left'
                              }}
                            />
                            <span style={{
                              position: 'absolute',
                              right: '24px',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: '600',
                              pointerEvents: 'none'
                            }}>%</span>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              border: `1px solid ${theme.borderColor}`,
                              borderLeft: 'none',
                              borderRadius: '0 4px 4px 0',
                              background: theme.bgElevated
                            }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentValue = parseFloat(minAllocation) || 0;
                                  const newValue = Math.min(100, currentValue + 0.1);
                                  const formattedValue = newValue % 1 === 0 ? newValue.toString() : newValue.toFixed(1);
                                  setMinAllocation(formattedValue);
                                  updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, formattedValue, balanceThreshold, excludedOperations);
                                  onFiltersChange({
                                    type: 'minAllocation',
                                    minAllocation: formattedValue
                                  });
                                }}
                                style={{
                                  width: '16px',
                                  height: '12px',
                                  border: 'none',
                                  background: 'transparent',
                                  color: theme.textSecondary,
                                  cursor: 'pointer',
                                  fontSize: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  lineHeight: '1'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#00ff99';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = theme.textSecondary;
                                }}
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentValue = parseFloat(minAllocation) || 0;
                                  const newValue = Math.max(0, currentValue - 0.1);
                                  const formattedValue = newValue % 1 === 0 ? newValue.toString() : newValue.toFixed(1);
                                  setMinAllocation(formattedValue);
                                  updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, formattedValue, balanceThreshold, excludedOperations);
                                  onFiltersChange({
                                    type: 'minAllocation',
                                    minAllocation: formattedValue
                                  });
                                }}
                                style={{
                                  width: '16px',
                                  height: '12px',
                                  border: 'none',
                                  background: 'transparent',
                                  color: theme.textSecondary,
                                  cursor: 'pointer',
                                  fontSize: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  lineHeight: '1'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#00ff99';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = theme.textSecondary;
                                }}
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={parseFloat(minAllocation) || 0}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          const formattedValue = value % 1 === 0 ? value.toString() : value.toFixed(1);
                          setMinAllocation(formattedValue);
                          updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, formattedValue, balanceThreshold, excludedOperations);
                          onFiltersChange({
                            type: 'minAllocation',
                            minAllocation: formattedValue
                          });
                        }}
                        style={{
                          width: '100%',
                          height: '4px',
                          background: `linear-gradient(to right, #00ff99 0%, #00ff99 ${(parseFloat(minAllocation) || 0)}%, ${theme.borderColor} ${(parseFloat(minAllocation) || 0)}%, ${theme.borderColor} 100%)`,
                          borderRadius: '2px',
                          outline: 'none',
                          appearance: 'none',
                          cursor: 'pointer'
                        }}
                        onInput={(e) => {
                          const value = parseFloat(e.target.value);
                          e.currentTarget.style.background = `linear-gradient(to right, #00ff99 0%, #00ff99 ${value}%, ${theme.borderColor} ${value}%, ${theme.borderColor} 100%)`;
                        }}
                      />
                    </div>

                    {/* Balance Threshold - Compact Design */}
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '6px'
                      }}>
                        <label style={{
                          color: '#ffffff',
                          fontSize: '11px',
                          fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                          fontWeight: '600',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}>Min Balance</label>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={balanceThreshold}
                              onChange={(e) => {
                                const value = e.target.value;
                                
                                if (value === '') {
                                  setBalanceThreshold('');
                                  updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, minAllocation, '', excludedOperations);
                                  onFiltersChange({
                                    type: 'balanceThreshold',
                                    balanceThreshold: ''
                                  });
                                  return;
                                }
                                
                                const regex = /^\d{1,2}(\.\d?)?$/;
                                
                                if (regex.test(value)) {
                                  const numValue = parseFloat(value);
                                  if (numValue >= 0) {
                                    setBalanceThreshold(value);
                                    updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, minAllocation, value, excludedOperations);
                                    onFiltersChange({
                                      type: 'balanceThreshold',
                                      balanceThreshold: value
                                    });
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                if (value.endsWith('.')) {
                                  const newValue = value.slice(0, -1);
                                  setBalanceThreshold(newValue);
                                  updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, minAllocation, newValue, excludedOperations);
                                  onFiltersChange({
                                    type: 'balanceThreshold',
                                    balanceThreshold: newValue
                                  });
                                }
                              }}
                              placeholder="0€"
                              style={{
                                width: '55px',
                                padding: '4px 18px 4px 6px',
                                border: `1px solid ${theme.borderColor}`,
                                borderRadius: '4px 0 0 4px',
                                background: theme.bgContainer,
                                color: theme.textPrimary,
                                fontSize: '12px',
                                fontWeight: '600',
                                fontFamily: "'Inter', sans-serif",
                                textAlign: 'left'
                              }}
                            />
                            <span style={{
                              position: 'absolute',
                              right: '24px',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: '600',
                              pointerEvents: 'none'
                            }}>€</span>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              border: `1px solid ${theme.borderColor}`,
                              borderLeft: 'none',
                              borderRadius: '0 4px 4px 0',
                              background: theme.bgElevated
                            }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentValue = parseFloat(balanceThreshold) || 0;
                                  const maxValue = getMaxTimelineValue();
                                  const newValue = Math.min(maxValue, currentValue + 1);
                                  setBalanceThreshold(newValue.toString());
                                  updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, minAllocation, newValue.toString(), excludedOperations);
                                  onFiltersChange({
                                    type: 'balanceThreshold',
                                    balanceThreshold: newValue.toString()
                                  });
                                }}
                                style={{
                                  width: '16px',
                                  height: '12px',
                                  border: 'none',
                                  background: 'transparent',
                                  color: theme.textSecondary,
                                  cursor: 'pointer',
                                  fontSize: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  lineHeight: '1'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#00ff99';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = theme.textSecondary;
                                }}
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentValue = parseFloat(balanceThreshold) || 0;
                                  const newValue = Math.max(0, currentValue - 1);
                                  setBalanceThreshold(newValue.toString());
                                  updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, minAllocation, newValue.toString(), excludedOperations);
                                  onFiltersChange({
                                    type: 'balanceThreshold',
                                    balanceThreshold: newValue.toString()
                                  });
                                }}
                                style={{
                                  width: '16px',
                                  height: '12px',
                                  border: 'none',
                                  background: 'transparent',
                                  color: theme.textSecondary,
                                  cursor: 'pointer',
                                  fontSize: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  lineHeight: '1'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#00ff99';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = theme.textSecondary;
                                }}
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <input
                        type="range"
                        min="0"
                        max={getMaxTimelineValue()}
                        step="1"
                        value={parseFloat(balanceThreshold) || 0}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setBalanceThreshold(value.toString());
                          updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, minAllocation, value.toString(), excludedOperations);
                          onFiltersChange({
                            type: 'balanceThreshold',
                            balanceThreshold: value.toString()
                          });
                        }}
                        style={{
                          width: '100%',
                          height: '4px',
                          background: `linear-gradient(to right, #00ff99 0%, #00ff99 ${((parseFloat(balanceThreshold) || 0) / getMaxTimelineValue()) * 100}%, ${theme.borderColor} ${((parseFloat(balanceThreshold) || 0) / getMaxTimelineValue()) * 100}%, ${theme.borderColor} 100%)`,
                          borderRadius: '2px',
                          outline: 'none',
                          appearance: 'none',
                          cursor: 'pointer'
                        }}
                        onInput={(e) => {
                          const value = parseFloat(e.target.value);
                          const maxValue = getMaxTimelineValue();
                          const percentage = (value / maxValue) * 100;
                          e.currentTarget.style.background = `linear-gradient(to right, #00ff99 0%, #00ff99 ${percentage}%, ${theme.borderColor} ${percentage}%, ${theme.borderColor} 100%)`;
                        }}
                      />
                    </div>
                  </div>
                  
                  <style jsx>{`
                    input[type="range"]::-webkit-slider-thumb {
                      appearance: none;
                      width: 14px;
                      height: 14px;
                      border-radius: 50%;
                      background: #ffffff;
                      border: 2px solid #00ff99;
                      cursor: pointer;
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    }
                    input[type="range"]::-webkit-slider-thumb:hover {
                      background: #00ff99;
                      border-color: #ffffff;
                    }
                    input[type="range"]::-moz-range-thumb {
                      width: 14px;
                      height: 14px;
                      border-radius: 50%;
                      background: #ffffff;
                      border: 2px solid #00ff99;
                      cursor: pointer;
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    }
                    input[type="range"]::-moz-range-thumb:hover {
                      background: #00ff99;
                      border-color: #ffffff;
                    }
                  `}</style>
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>Operations{sectionActive.operations && <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#00ff99', boxShadow: '0 0 7px rgba(0,255,153,0.9)', flexShrink: 0 }} />}</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {displayOperationTypes.map(operation => (
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
                        e.currentTarget.style.background = theme.bgElevated;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
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
                          backgroundColor: operation.toLowerCase().startsWith('buy') ? 'rgba(0, 255, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: operation.toLowerCase().startsWith('buy') ? '#00FF99' : '#ef4444',
                          padding: '3px 9px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          fontFamily: 'monospace',
                          letterSpacing: '0.5px',
                          whiteSpace: 'nowrap',
                          opacity: excludedOperations.has(operation) ? 0.35 : 1,
                          transition: 'opacity 0.2s ease',
                        }}>{operation}</span>
                      </label>
                    ))}
                    
                    {/* Select All Operations */}
                    <div style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '6px',
                      borderRadius: '4px',
                      marginTop: '6px'
                    }}>
                      <span style={{
                        color: theme.textPrimary,
                        fontSize: '13px',
                        fontWeight: '600',
                        fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                        letterSpacing: '0.1px',
                        textTransform: 'uppercase'
                      }}>SELECT ALL</span>
                      <input
                        type="checkbox"
                        checked={excludedOperations.size === 0}
                        onChange={() => {
                          const selectedOperations = displayOperationTypes.filter(op => !excludedOperations.has(op));

                          if (selectedOperations.length === displayOperationTypes.length) {
                            // If all are selected, deselect all
                            const newExcluded = new Set(displayOperationTypes);
                            setExcludedOperations(newExcluded);
                            updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, minAllocation, balanceThreshold, newExcluded);
                            if (onFiltersChange) {
                              onFiltersChange({
                                type: 'excludedOperations',
                                excludedOperations: newExcluded
                              });
                            }
                          } else {
                            // Select all operations
                            const newExcluded = new Set();
                            setExcludedOperations(newExcluded);
                            updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, minAllocation, balanceThreshold, newExcluded);
                            if (onFiltersChange) {
                              onFiltersChange({
                                type: 'excludedOperations',
                                excludedOperations: newExcluded
                              });
                            }
                          }
                        }}
                        style={{
                          accentColor: '#00ff99',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
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
                      setDisabledAssets(new Set()); // Clear disabled assets
                      setManuallyHiddenAssets(new Set()); // Clear manually hidden assets
                      setDateRange(defaultRange);
                      setSelectedTimePreset('All');
                      setMinAllocation('');
                      setBalanceThreshold('');
                      setExcludedOperations(new Set());
                      setActiveFilters(0);
                      // Use onFilterReset for clear all to ensure timeline dates are also updated
                      if (onFilterReset) {
                        onFilterReset({
                          type: 'dateRange',
                          dateRange: defaultRange
                        });
                      }
                      // Send asset filter reset to Timeline
                      if (onFiltersChange) {
                        onFiltersChange({
                          type: 'assetFilter',
                          hiddenAssets: new Set()
                        });
                        // Send threshold filter resets
                        onFiltersChange({
                          type: 'minAllocation',
                          minAllocation: ''
                        });
                        onFiltersChange({
                          type: 'balanceThreshold',
                          balanceThreshold: ''
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
                      e.currentTarget.style.borderColor = '#ff6b6b';
                      e.currentTarget.style.color = '#ff6b6b';
                      e.currentTarget.style.background = theme.bgElevated;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.textSecondary;
                      e.currentTarget.style.color = theme.textPrimary;
                      e.currentTarget.style.background = theme.bgContainer;
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
                          e.currentTarget.style.borderColor = '#00ff99';
                          e.currentTarget.style.backgroundColor = theme.bgElevated;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = theme.borderColor;
                          e.currentTarget.style.backgroundColor = theme.bgContainer;
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
              padding: '12px',
              fontFamily: 'Inter, sans-serif',
              pointerEvents: 'auto',
              boxShadow: popupAnimation === 'applying' ? '0 0 40px rgba(0, 255, 136, 0.8)' : '0 0 20px rgba(0, 255, 136, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
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
              gap: '8px',
            }}>
            <button
              onClick={handleApplyFilter}
              style={{
                background: '#00ff88',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 14px',
                fontSize: '12px',
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
              Apply to All Sections
            </button>
            
            <button
              onClick={handleClosePopup}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '16px',
                cursor: 'pointer',
                width: '30px',
                height: '30px',
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
              position: 'fixed',
              top: `${calendarPosition.top}px`,
              left: `${calendarPosition.left}px`,
              background: '#1a1a1a',
              border: '1px solid #4a4a4a',
              borderRadius: '10px',
              padding: '16px',
              fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
              pointerEvents: 'auto',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 6px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              width: '260px',
              fontSize: '12px',
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
              height: '18px'
            }}>
              <div style={{
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {calendarType === 'start' ? 'START DATE' : 'END DATE'}
              </div>
              <button
                onClick={() => setShowCustomCalendar(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ff6666',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1',
                  width: '20px',
                  height: '20px',
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
                  padding: '6px 10px',
                  minWidth: '120px',
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
                  minWidth: '240px',
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
                    fontSize: '10px',
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
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: day ? cursor : 'default',
                      backgroundColor,
                      color,
                      border,
                      fontSize: '14px',
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
                  // Check if this results in the full range
                  const presetToSet = isFullDateRange(newRange) ? 'All' : '';
                  setSelectedTimePreset(presetToSet);
                  updateActiveFiltersCount(hiddenAssets, newRange, presetToSet, minAllocation, balanceThreshold, excludedOperations);
                  if (onFiltersChange) {
                    onFiltersChange({ 
                      type: 'dateRange', 
                      dateRange: { ...newRange }
                    });
                  }
                  setShowCustomCalendar(false);
                }}
                style={{
                  padding: '4px 10px',
                  border: '1px solid #444444',
                  borderRadius: '3px',
                  background: 'transparent',
                  color: '#ffffff',
                  fontSize: '10px',
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
          </div>,
          calendarRoot
        );
      })()}
    </>
  );
};

export default Filters;