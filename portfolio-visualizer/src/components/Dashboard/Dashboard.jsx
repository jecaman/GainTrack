import React, { useState, useEffect, useRef } from 'react';
import OverviewSection from './Sections/Overview/OverviewSection';
import OperationsSection from './Sections/Operations/OperationsSection';
import PortfolioSection from './Sections/Portfolio/PortfolioSection';
import Filters from '../Filters';
import Header from './Header';
import { assetLabelMap } from '../../utils/chartUtils';



const Dashboard = ({ portfolioData, isLoading, theme, onShowGainTrack, onBackToForm, onToggleTheme, onReprocessCsv, onRefreshPrices, priceTimestamp, isVisible = true }) => {
  const [filters, setFilters] = useState({
    dateRange: 'all',
    assetType: 'all',
    minValue: '',
    profitOnly: false
  });
  const [hiddenAssets, setHiddenAssets] = useState(new Set());
  const [excludedOperations, setExcludedOperations] = useState(new Set());
  const [disabledOps, setDisabledOps] = useState(new Set()); // IDs únicos de operaciones individuales desactivadas

  const handleToggleAsset = (displaySymbol) => {
    setHiddenAssets(prev => {
      const arr = Array.from(prev);
      if (arr.includes(displaySymbol)) {
        return new Set(arr.filter(s => s !== displaySymbol));
      }
      return new Set([...arr, displaySymbol]);
    });
  };

  const handleToggleAllAssets = (allSymbols, showAll) => {
    setHiddenAssets(showAll ? new Set() : new Set(allSymbols));
  };

  const handleToggleOperation = (opId) => {
    setDisabledOps(prev => {
      const next = new Set(prev);
      if (next.has(opId)) next.delete(opId);
      else next.add(opId);
      return next;
    });
  };

  const handleToggleAllOperations = (opIds, includeAll) => {
    setDisabledOps(includeAll ? new Set() : new Set(opIds));
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  
  const [showApplyPopup, setShowApplyPopup] = useState(false);
  const [popupSource, setPopupSource] = useState('filter'); // 'filter' or 'timeline'
  // Dates for filters (can be point click dates)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Dates for timeline display (should not change on point clicks)
  const [timelineStartDate, setTimelineStartDate] = useState('');
  const [timelineEndDate, setTimelineEndDate] = useState('');
  
  // Timeline's quick filter selection to sync with Filters tab
  const [timelineQuickFilter, setTimelineQuickFilter] = useState(null);
  
  // Filter's selected preset to sync with Timeline quick filters
  const [filterSelectedPreset, setFilterSelectedPreset] = useState(null);
  
  // Persistent timeline UI state (survive section navigation)
  const [timelineViewMode, setTimelineViewMode] = useState('both');
  const [timelineShowCostBasis, setTimelineShowCostBasis] = useState(false);
  const [timelinePeriodMode, setTimelinePeriodMode] = useState('day');

  // Track if we're in point click mode
  const [isInPointClickMode, setIsInPointClickMode] = useState(false);
  const [isApplyingFromTimeline, setIsApplyingFromTimeline] = useState(false);
  
  // Wrapper functions for timeline date changes that handle point click mode
  const handleTimelineStartDateChange = (newStartDate) => {
    if (isInPointClickMode) {
      // In point click mode, don't update timeline dates at all
      // Exception: if it's a reset to default dates, then exit point click mode
      const { defaultStartDate } = getDefaultDates();
      if (newStartDate === defaultStartDate) {
        setIsInPointClickMode(false);
        setStartDate(newStartDate);
        setTimelineStartDate(newStartDate);
      } else {
        // Do nothing - preserve timeline dates
      }
    } else {
      // Normal mode: just update timeline dates
      setTimelineStartDate(newStartDate);
    }
  };
  
  const handleTimelineEndDateChange = (newEndDate) => {
    if (isInPointClickMode) {
      // In point click mode, don't update timeline dates at all
      // Exception: if it's a reset to default dates, then exit point click mode
      const { defaultEndDate } = getDefaultDates();
      if (newEndDate === defaultEndDate) {
        setIsInPointClickMode(false);
        setEndDate(newEndDate);
        setTimelineEndDate(newEndDate);
      } else {
        // Do nothing - preserve timeline dates
      }
    } else {
      // Normal mode: just update timeline dates
      setTimelineEndDate(newEndDate);
    }
  };
  
  const getDefaultDates = () => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) {
      return { defaultStartDate: null, defaultEndDate: null };
    }
    
    const defaultStartDate = new Date(portfolioData.timeline[0].date).toISOString().split('T')[0];
    const defaultEndDate = new Date(portfolioData.timeline[portfolioData.timeline.length - 1].date).toISOString().split('T')[0];
    
    return { defaultStartDate, defaultEndDate };
  };

  // Initialize timeline dates when component mounts
  useEffect(() => {
    // Only sync on initial mount, not during resets or other operations
    if (startDate && endDate && (!timelineStartDate || !timelineEndDate) && !showApplyPopup) {
      setTimelineStartDate(startDate);
      setTimelineEndDate(endDate);
    }
  }, [startDate, endDate, timelineStartDate, timelineEndDate, showApplyPopup]);

  const handleFiltersChange = (newFilters, skipTimelineUpdate = false) => {
    setFilters(newFilters);
    
    // Handle asset filter changes
    if (newFilters.type === 'assetFilter' && newFilters.hiddenAssets !== undefined) {
      setHiddenAssets(newFilters.hiddenAssets);
      return;
    }
    
    // Handle operations filter changes
    if (newFilters.type === 'excludedOperations' && newFilters.excludedOperations !== undefined) {
      setExcludedOperations(newFilters.excludedOperations);
      return;
    }
    
    // Capture selected preset from filters
    if (newFilters.selectedPreset) {
      setFilterSelectedPreset(newFilters.selectedPreset);
    }
    
    // Handle special case of point clicks
    if (skipTimelineUpdate === 'pointClick') {
      // For point clicks: update only filter dates, not timeline dates
      if (newFilters.dateRange.from) {
        setStartDate(newFilters.dateRange.from);
      }
      if (newFilters.dateRange.to) {
        setEndDate(newFilters.dateRange.to);
      }
      return;
    }
    
    // Filter changes affect Timeline dates only if not skipped
    if (newFilters.type === 'dateRange' && newFilters.dateRange && !skipTimelineUpdate) {
      // Check if both dates are equal (indicating a point click)
      const isPointClick = newFilters.dateRange.from === newFilters.dateRange.to;

      // Always update filter dates
      if (newFilters.dateRange.from) {
        setStartDate(newFilters.dateRange.from);
      }
      if (newFilters.dateRange.to) {
        setEndDate(newFilters.dateRange.to);
      }

      // Only update timeline dates if NOT a point click
      if (!isPointClick) {
        if (newFilters.dateRange.from) {
          setTimelineStartDate(newFilters.dateRange.from);
        }
        if (newFilters.dateRange.to) {
          setTimelineEndDate(newFilters.dateRange.to);
        }
        // Filters tab is now driving the date — hide any pending "Apply to All" popup
        // because filter dates and timeline dates are now in sync.
        setShowApplyPopup(false);
        lastShownPopup.current = '';
        // Tell showTimelinePopup to suppress the next call (avoids popup flash during sync)
        isFilterChangingDates.current = true;
        // Auto-reset after a short delay so it doesn't block the next legitimate popup
        // (e.g. the flag from initial Filters mount was blocking the first user zoom)
        setTimeout(() => { isFilterChangingDates.current = false; }, 500);
      }
    }
  };

  // Function to handle filter resets - always updates timeline dates
  const handleFilterReset = (resetData) => {
    if (resetData.type === 'dateRange' && resetData.dateRange) {
      // For resets, always update both filter and timeline dates
      setStartDate(resetData.dateRange.from);
      setEndDate(resetData.dateRange.to);
      setTimelineStartDate(resetData.dateRange.from);
      setTimelineEndDate(resetData.dateRange.to);
      
      // Reset hidden assets as well
      setHiddenAssets(new Set());
      
      // Exit point click mode on reset
      setIsInPointClickMode(false);

      // Clear any lingering popup-suppression flag so the next zoom shows the popup
      isFilterChangingDates.current = false;
      lastShownPopup.current = '';

      // Also update filters state
      setFilters(resetData);
      
      // Unfreeze timeline tooltip if frozen
      if (timelineUnfreezeTooltipRef.current) {
        timelineUnfreezeTooltipRef.current();
      }
    }
  };

  // Ref to store timeline's unfreezeTooltip function
  const timelineUnfreezeTooltipRef = useRef(null);

  // Timeline can only update Filter dates when "Apply to All" is used
  const handleTimelineApplyToAll = (timelineData) => {
    // Prevent multiple simultaneous applications
    if (isApplyingFromTimeline) {
      return;
    }
    
    setIsApplyingFromTimeline(true);
    
    // Use stored timeline dates if available
    const datesToUse = window.timelineDates || timelineData.dateRange;
    
    if (datesToUse) {
      // Check if this is a special point-click case
      const isPointClick = datesToUse.isPointClick;
      
      if (isPointClick) {
        // For point clicks: Update only filter dates, leave timeline dates unchanged
        const clickedDate = datesToUse.startDate;
        
        setShowApplyPopup(false);
        
        // Let handleFiltersChange update the filter dates, but skip timeline update
        handleFiltersChange({
          type: 'dateRange',
          dateRange: {
            from: clickedDate,
            to: clickedDate // Both dates should be the same for point clicks
          }
        }, 'pointClick'); // Special flag for point clicks
        
        if (onReprocessCsv) {
          onReprocessCsv(clickedDate, clickedDate, Array.from(excludedOperations));
        }
        
        // Enable point click mode
        setIsInPointClickMode(true);
        
        // Clear timeline quick filter for point clicks
        setTimelineQuickFilter(null);
        // Also clear the filter's selected preset
        setFilterSelectedPreset(null);
      } else {
        // For zoom/range changes: Update both Filter and Timeline dates.
        // Do NOT call onReprocessCsv — the full timeline is already in memory and
        // KPIGrid computes period gains from it directly. Backend reprocessing
        // would truncate the FIFO to startDate and produce wrong values.
        const newStartDate = datesToUse.from || datesToUse.startDate;
        const newEndDate = datesToUse.to || datesToUse.endDate;

        // Update all state immediately
        setStartDate(newStartDate);
        setEndDate(newEndDate);
        setTimelineStartDate(newStartDate);
        setTimelineEndDate(newEndDate);
        setIsInPointClickMode(false);

        // Set the timeline quick filter if available
        if (datesToUse.quickFilter) {
          setTimelineQuickFilter(datesToUse.quickFilter);
        }

        // Call handleFiltersChange
        handleFiltersChange({
          type: 'dateRange',
          dateRange: {
            from: newStartDate,
            to: newEndDate
          }
        });

        // handleFiltersChange sets isFilterChangingDates=true to suppress the popup flash
        // during a Filters-tab-initiated sync. But here the change comes from the Timeline
        // itself, so we must reset the flag — otherwise it survives and blocks the next
        // legitimate popup (e.g. user zooms again after a reset).
        isFilterChangingDates.current = false;

        // Clear the applying flag immediately
        setIsApplyingFromTimeline(false);

        // Reset popup tracking when applying
        lastShownPopup.current = '';
      }
      
      // Clean up temporary storage
      window.timelineDates = null;
    } else {
      // If no datesToUse, just clear the applying flag
      setIsApplyingFromTimeline(false);
    }
  };

  // Track the last popup we showed to prevent duplicates
  const lastShownPopup = useRef('');

  // Suppresses popup flash when the Filters tab is the one changing dates
  const isFilterChangingDates = useRef(false);

  // Function to show popup from Timeline changes
  const showTimelinePopup = (timelineDates) => {
    // Don't show popup if dates just changed because of a Filters tab preset/range action
    if (isFilterChangingDates.current) {
      isFilterChangingDates.current = false;
      return;
    }

    // Don't show popup if we're currently in point click mode (startDate === endDate)
    if (startDate === endDate) {
      return;
    }
    
    // Don't show popup if we're currently applying
    if (isApplyingFromTimeline) {
      return;
    }
    
    // Only show popup if timeline dates are different from filter dates
    if (timelineDates && 
        (timelineDates.startDate !== startDate || timelineDates.endDate !== endDate)) {
      
      // Create a unique key for this popup request
      const popupKey = `${timelineDates.startDate}-${timelineDates.endDate}`;
      
      if (lastShownPopup.current === popupKey) {
        return;
      }

      lastShownPopup.current = popupKey;
      
      // CLEAR any old timeline dates first to prevent mixing old with new
      window.timelineDates = null;
      
      setPopupSource('timeline');
      // Store timeline dates temporarily for the popup (both use YYYY-MM-DD now)
      window.timelineDates = {
        startDate: timelineDates.startDate,
        endDate: timelineDates.endDate,
        quickFilter: timelineDates.quickFilter
      };
      
      setShowApplyPopup(true);
    }
  };

  // Function to show popup from Filter changes
  const showFilterPopup = () => {
    setPopupSource('filter');
    setShowApplyPopup(true);
  };

  // Function to show popup from Timeline click (without storing dates)
  const showTimelineClickPopup = () => {
    // Only show popup if the clicked dates are different from filter dates
    if (typeof window !== 'undefined' && window.timelineDates) {
      const clickedStartDate = window.timelineDates.startDate;
      const clickedEndDate = window.timelineDates.endDate;
      
      // Check if clicked dates are different from current filter dates
      if (clickedStartDate !== startDate || clickedEndDate !== endDate) {
        setPopupSource('timeline');
        setShowApplyPopup(true);
      }
    }
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
  };

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection
            portfolioData={portfolioData}
            isLoading={isLoading}
            theme={theme}
            onShowGainTrack={onShowGainTrack}
            filters={filters}
            hiddenAssets={hiddenAssets}
            excludedOperations={excludedOperations}
            disabledOps={disabledOps}
            showApplyPopup={showApplyPopup}
            setShowApplyPopup={setShowApplyPopup}
            startDate={startDate}
            endDate={endDate}
            buttonStartDate={timelineStartDate || startDate}
            buttonEndDate={timelineEndDate || endDate}
            setStartDate={handleTimelineStartDateChange}
            setEndDate={handleTimelineEndDateChange}
            onTimelineApplyToAll={handleTimelineApplyToAll}
            showTimelinePopup={showTimelinePopup}
            showTimelineClickPopup={showTimelineClickPopup}
            isInPointClickMode={isInPointClickMode}
            setIsInPointClickMode={setIsInPointClickMode}
            sidebarOpen={sidebarOpen}
            timelineUnfreezeTooltipRef={timelineUnfreezeTooltipRef}
            filterSelectedPreset={filterSelectedPreset}
            onFilterReset={handleFilterReset}
            isApplyingFromTimeline={isApplyingFromTimeline}
            timelineViewMode={timelineViewMode}
            setTimelineViewMode={setTimelineViewMode}
            timelineShowCostBasis={timelineShowCostBasis}
            setTimelineShowCostBasis={setTimelineShowCostBasis}
            timelinePeriodMode={timelinePeriodMode}
            setTimelinePeriodMode={setTimelinePeriodMode}
            priceTimestamp={priceTimestamp}
          />
        );
      case 'operations':
        return (
          <OperationsSection
            portfolioData={portfolioData}
            isLoading={isLoading}
            theme={theme}
            filters={filters}
            hiddenAssets={hiddenAssets}
            excludedOperations={excludedOperations}
            disabledOps={disabledOps}
            showApplyPopup={showApplyPopup}
            setShowApplyPopup={setShowApplyPopup}
            startDate={startDate}
            endDate={endDate}
            buttonStartDate={timelineStartDate || startDate}
            buttonEndDate={timelineEndDate || endDate}
            setStartDate={handleTimelineStartDateChange}
            setEndDate={handleTimelineEndDateChange}
            onTimelineApplyToAll={handleTimelineApplyToAll}
            showTimelinePopup={showTimelinePopup}
            showTimelineClickPopup={showTimelineClickPopup}
            isInPointClickMode={isInPointClickMode}
            setIsInPointClickMode={setIsInPointClickMode}
            sidebarOpen={sidebarOpen}
            timelineUnfreezeTooltipRef={timelineUnfreezeTooltipRef}
            filterSelectedPreset={filterSelectedPreset}
            onFilterReset={handleFilterReset}
            isApplyingFromTimeline={isApplyingFromTimeline}
            onToggleAsset={handleToggleAsset}
            onToggleAllAssets={handleToggleAllAssets}
            onToggleOperation={handleToggleOperation}
            onToggleAllOperations={handleToggleAllOperations}
          />
        );
      case 'portfolio':
        return (
          <PortfolioSection
            portfolioData={portfolioData}
            theme={theme}
            filters={filters}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{
      background: theme.bg,
      color: theme.textPrimary,
      fontFamily: "'Inter', sans-serif",
      position: 'relative'
    }}>
      {/* Global Filters Component - Only render when dashboard is visible */}
      {isVisible && (
        <Filters
          theme={theme}
          onFiltersChange={handleFiltersChange}
          onFilterReset={handleFilterReset}
          portfolioData={portfolioData}
          onSidebarToggle={setSidebarOpen}
          showApplyPopup={showApplyPopup}
          setShowApplyPopup={setShowApplyPopup}
          startDate={startDate}
          endDate={endDate}
          onApplyToAll={handleTimelineApplyToAll}
          popupSource={popupSource}
          timelineQuickFilter={timelineQuickFilter}
        />
      )}

      {/* Header — siempre a ancho completo, fuera del contenedor que hace paddingRight */}
      <Header
        theme={theme}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onBackToForm={onShowGainTrack || onBackToForm}
        onToggleTheme={onToggleTheme}
        sidebarOpen={sidebarOpen}
        onRefreshPrices={onRefreshPrices}
        priceTimestamp={priceTimestamp}
        disabledOpsCount={disabledOps.size}
      />

      {/* Main Content Area — se desplaza cuando abre el sidebar */}
      <div style={{
        paddingTop: '0',
        paddingBottom: '0',
        paddingLeft: '4rem',
        paddingRight: sidebarOpen ? 'calc(350px + 4rem)' : '4rem',
        transition: 'padding-right 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'visible'
      }}>
        {renderCurrentSection()}
      </div>
    </div>
  );
};

export default Dashboard;