import { useState } from 'react';
import OverviewSection from './Sections/Overview/OverviewSection';
import AnalyticsSection from './Sections/Analytics/AnalyticsSection';
import PortfolioSection from './Sections/Portfolio/PortfolioSection';
import Filters from '../Filters';
import Header from './Header';



const Dashboard = ({ portfolioData, isLoading, theme, onShowGainTrack, onBackToForm, onToggleTheme, isVisible = true }) => {
  const [filters, setFilters] = useState({
    dateRange: 'all',
    assetType: 'all',
    minValue: '',
    profitOnly: false
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [showApplyPopup, setShowApplyPopup] = useState(false);
  const [popupSource, setPopupSource] = useState('filter'); // 'filter' or 'timeline'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    console.log('Dashboard filters changed:', newFilters);
    
    // Filter changes always affect Timeline dates
    if (newFilters.type === 'dateRange' && newFilters.dateRange) {
      if (newFilters.dateRange.from) {
        setStartDate(newFilters.dateRange.from);
      }
      if (newFilters.dateRange.to) {
        setEndDate(newFilters.dateRange.to);
      }
    }
  };

  // Timeline can only update Filter dates when "Apply to All" is used
  const handleTimelineApplyToAll = (timelineData) => {
    // Use stored timeline dates if available
    const datesToUse = window.timelineDates || timelineData.dateRange;
    
    if (datesToUse) {
      console.log('Timeline Apply to All - updating Filter dates:', datesToUse);
      // Update both Filter state and Dashboard dates
      setStartDate(datesToUse.from || datesToUse.startDate);
      setEndDate(datesToUse.to || datesToUse.endDate);
      
      // Notify Filter component
      handleFiltersChange({
        type: 'dateRange',
        dateRange: {
          from: datesToUse.from || datesToUse.startDate,
          to: datesToUse.to || datesToUse.endDate
        }
      });
      
      // Clean up temporary storage
      window.timelineDates = null;
    }
  };

  // Function to show popup from Timeline changes
  const showTimelinePopup = (timelineDates) => {
    setPopupSource('timeline');
    // Store timeline dates temporarily for the popup (both use YYYY-MM-DD now)
    if (timelineDates) {
      window.timelineDates = {
        startDate: timelineDates.startDate,
        endDate: timelineDates.endDate
      };
    }
    setShowApplyPopup(true);
  };

  // Function to show popup from Filter changes
  const showFilterPopup = () => {
    setPopupSource('filter');
    setShowApplyPopup(true);
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
            showApplyPopup={showApplyPopup}
            setShowApplyPopup={setShowApplyPopup}
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            onTimelineApplyToAll={handleTimelineApplyToAll}
            showTimelinePopup={showTimelinePopup}
          />
        );
      case 'analytics':
        return (
          <AnalyticsSection
            portfolioData={portfolioData}
            theme={theme}
            filters={filters}
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
      minHeight: '100vh',
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
          portfolioData={portfolioData}
          onSidebarToggle={setSidebarOpen}
          showApplyPopup={showApplyPopup}
          setShowApplyPopup={setShowApplyPopup}
          startDate={startDate}
          endDate={endDate}
          onApplyToAll={handleTimelineApplyToAll}
          popupSource={popupSource}
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
        minHeight: 'calc(100vh - 100px)', // Altura mínima, no máxima
        overflow: 'visible' // Permitir que el ticker salga por arriba
      }}>
        {renderCurrentSection()}
      </div>
    </div>
  );
};

export default Dashboard;