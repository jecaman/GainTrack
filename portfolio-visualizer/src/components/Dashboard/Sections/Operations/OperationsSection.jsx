import OperationsTable from './components/OperationsTable';

const OperationsSection = ({ 
  portfolioData, 
  isLoading, 
  theme, 
  filters = {}, 
  hiddenAssets = new Set(), 
  excludedOperations = new Set(), 
  showApplyPopup, 
  setShowApplyPopup, 
  startDate, 
  endDate, 
  buttonStartDate, 
  buttonEndDate, 
  setStartDate, 
  setEndDate, 
  onTimelineApplyToAll, 
  showTimelinePopup, 
  showTimelineClickPopup, 
  isInPointClickMode, 
  setIsInPointClickMode, 
  sidebarOpen = false, 
  timelineUnfreezeTooltipRef, 
  filterSelectedPreset, 
  onFilterReset, 
  isApplyingFromTimeline 
}) => {

  if (isLoading) {
    return (
      <section style={{
        minHeight: '60vh',
        background: theme.bg,
        color: theme.textPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          fontFamily: "'Inter', sans-serif"
        }}>
          Loading Operations Data...
        </div>
      </section>
    );
  }

  return (
    <section style={{
      minHeight: 'auto',
      background: theme.bg,
      color: theme.textPrimary,
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      marginTop: '0',
      paddingTop: '50px', // Space for potential header elements
      paddingBottom: '0',
      overflow: 'visible',
      width: '100%',
      marginBottom: '0'
    }}>
      
      {/* Operations Table */}
      <div style={{
        width: '100%',
        marginTop: '2rem'
      }}>
        <OperationsTable 
          portfolioData={portfolioData} 
          theme={theme} 
          filters={filters}
          hiddenAssets={hiddenAssets}
          excludedOperations={excludedOperations}
          showApplyPopup={showApplyPopup}
          setShowApplyPopup={setShowApplyPopup}
          startDate={startDate}
          endDate={endDate}
          buttonStartDate={buttonStartDate}
          buttonEndDate={buttonEndDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          onTimelineApplyToAll={onTimelineApplyToAll}
          showTimelinePopup={showTimelinePopup}
          showTimelineClickPopup={showTimelineClickPopup}
          isInPointClickMode={isInPointClickMode}
          setIsInPointClickMode={setIsInPointClickMode}
          sidebarOpen={sidebarOpen}
          timelineUnfreezeTooltipRef={timelineUnfreezeTooltipRef}
          filterSelectedPreset={filterSelectedPreset}
          onFilterReset={onFilterReset}
          isApplyingFromTimeline={isApplyingFromTimeline}
        />
      </div>
    </section>
  );
};

export default OperationsSection;