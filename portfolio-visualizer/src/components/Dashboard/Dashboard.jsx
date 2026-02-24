import React, { useState, useEffect, useRef } from 'react';
import OverviewSection from './Sections/Overview/OverviewSection';
import OperationsSection from './Sections/Operations/OperationsSection';
import PortfolioSection from './Sections/Portfolio/PortfolioSection';
import Filters from '../Filters';
import Header from './Header';



const Dashboard = ({ portfolioData, isLoading, theme, onShowGainTrack, onBackToForm, onToggleTheme, onReprocessCsv, isVisible = true }) => {
  const [filters, setFilters] = useState({
    dateRange: 'all',
    assetType: 'all',
    minValue: '',
    profitOnly: false
  });
  const [hiddenAssets, setHiddenAssets] = useState(new Set());
  const [excludedOperations, setExcludedOperations] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  
  // Debug: Log operation types when portfolio data changes
  useEffect(() => {
    if (portfolioData && portfolioData.operation_types) {
    }
  }, [portfolioData]);
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

  // Track when we exit point click mode and show popup if needed
  const prevIsInPointClickMode = useRef(isInPointClickMode);
  const popupTimeoutRef = useRef(null);
  
  useEffect(() => {
    // If we just exited point click mode (was true, now false)
    if (prevIsInPointClickMode.current && !isInPointClickMode) {
      
      // Clear any existing timeout to avoid multiple popups
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
      
      // Add a small delay to let all state changes settle
      popupTimeoutRef.current = setTimeout(() => {
        // Check if timeline and filter dates differ and show popup
        if (timelineStartDate && timelineEndDate && 
            (timelineStartDate !== startDate || timelineEndDate !== endDate)) {
          // Show popup directly
          console.log('Timeline dates differ from filter dates - showing popup');
          console.log('Timeline:', timelineStartDate, timelineEndDate);
          console.log('Filter:', startDate, endDate);
          
          // Set a flag to prevent Timeline useEffect from immediately hiding this popup
          window.justShowedPopupFromPointClickExit = true;
          setTimeout(() => {
            window.justShowedPopupFromPointClickExit = false;
          }, 1000); // Give 1 second for the popup to be stable
          
          setPopupSource('timeline');
          window.timelineDates = {
            startDate: timelineStartDate,
            endDate: timelineEndDate
          };
          setShowApplyPopup(true);
        } else {
          console.log('Timeline dates same as filter dates - no popup needed');
        }
        popupTimeoutRef.current = null;
      }, 200); // Small delay to let states settle
    }
    
    prevIsInPointClickMode.current = isInPointClickMode;
  }, [isInPointClickMode, timelineStartDate, timelineEndDate, startDate, endDate]);


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
    
    console.log('🎯 APPLY TIMELINE TO ALL - DATES TO USE:', datesToUse);
    console.log('🎯 WINDOW.TIMELINE DATES:', window.timelineDates);
    console.log('🔍 [DEBUG] onReprocessCsv function available:', typeof onReprocessCsv);
    
    if (datesToUse) {
      // Check if this is a special point-click case
      const isPointClick = datesToUse.isPointClick;
      
      if (isPointClick) {
        // For point clicks: Update only filter dates, leave timeline dates unchanged
        const clickedDate = datesToUse.startDate;
        
        // Close popup immediately for point clicks
        console.log('Dashboard: Closing popup for point click');
        setShowApplyPopup(false);
        
        // Let handleFiltersChange update the filter dates, but skip timeline update
        handleFiltersChange({
          type: 'dateRange',
          dateRange: {
            from: clickedDate,
            to: clickedDate // Both dates should be the same for point clicks
          }
        }, 'pointClick'); // Special flag for point clicks
        
        // Re-process CSV with new date filter if available
        if (onReprocessCsv) {
          console.log('🎯 [DASHBOARD] Point click - calling reprocessCsv with:', clickedDate, clickedDate);
          onReprocessCsv(clickedDate, clickedDate, Array.from(excludedOperations));
        } else {
          console.log('❌ [DASHBOARD] No onReprocessCsv function available');
        }
        
        // Enable point click mode
        setIsInPointClickMode(true);
        
        // Clear timeline quick filter for point clicks
        setTimelineQuickFilter(null);
        // Also clear the filter's selected preset
        setFilterSelectedPreset(null);
      } else {
        // For zoom/range changes: Update both Filter and Timeline dates
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
        
        // Re-process CSV with new date filter if available
        if (onReprocessCsv) {
          onReprocessCsv(newStartDate, newEndDate, Array.from(excludedOperations));
        }
        
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
  
  // Function to show popup from Timeline changes
  const showTimelinePopup = (timelineDates) => {
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
      
      // Don't show if we already showed this exact popup
      if (lastShownPopup.current === popupKey) {
        console.log('🚫 DUPLICATE POPUP BLOCKED:', popupKey);
        return;
      }
      
      console.log('✅ SHOWING NEW POPUP:', popupKey);
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
      
      console.log('📦 STORED TIMELINE DATES:', window.timelineDates);
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
      paddingRight: sidebarOpen ? '350px' : '0',
      transition: 'padding-right 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
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
      
      {/* Header */}
      <Header 
        theme={theme}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onBackToForm={onBackToForm}
        onToggleTheme={onToggleTheme}
        sidebarOpen={sidebarOpen}
      />

      {/* Main Content Area - Las secciones ocupan todo el espacio tras el header */}
      <div style={{ 
        padding: '0 4rem 0 4rem', // Sin margen arriba
        marginTop: '-200px', // Compensar el espacio que deja la línea fixed
        paddingTop: '2px', // Justo debajo de la línea divisora
        overflow: 'visible' // Permitir que el ticker salga por arriba
      }}>
        {renderCurrentSection()}
      </div>
    </div>
  );
};

export default Dashboard;