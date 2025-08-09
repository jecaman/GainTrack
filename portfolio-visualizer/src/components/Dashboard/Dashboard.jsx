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

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    console.log('Dashboard filters changed:', newFilters);
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