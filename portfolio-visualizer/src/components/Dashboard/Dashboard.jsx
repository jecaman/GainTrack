import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import OverviewSection from './Sections/Overview/OverviewSection';
import AnalyticsSection from './Sections/Analytics/AnalyticsSection';
import PortfolioSection from './Sections/Portfolio/PortfolioSection';
import SectionTabs from './Navigation/SectionTabs';
import Filters from '../Filters';
import AppHeader from '../AppHeader';
import GainTrackBrand from '../GainTrackBrand';



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
      
      {/* Header simple y moderno */}
      <div style={{
        padding: '6rem 2rem 0.5rem 2rem',
        background: `linear-gradient(180deg, ${theme.bg}00 0%, ${theme.bg}05 100%)`
      }}>
        {/* Navegación centrada */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center'
        }}>
          <SectionTabs
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            theme={theme}
            onBackToForm={onBackToForm}
            onToggleTheme={onToggleTheme}
            sidebarOpen={sidebarOpen}
          />
        </div>

        {/* Línea inferior: Logo + Subtítulo + Status */}
        <div style={{
          transform: 'translateY(-130px)',
          position: 'relative',
          height: '220px'
        }}>
          {/* Logo con subtítulo a la izquierda */}
          <div style={{ 
            position: 'absolute',
            left: '0',
            bottom: '40%',
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: '1.5rem'
          }}>
            <GainTrackBrand
              logoSize={42}
              titleSize="26px"
              color="#00FF99"
              titleColor={theme.textPrimary}
              sloganGlow={true}
              isDarkMode={theme.bg === '#000000'}
              layout="horizontal"
              logoRotation={4}
              spacing="6px"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '-0.005em'
              }}
            />
            
            {/* Subtítulo a la derecha del branding */}
            <div style={{
              fontSize: '14px',
              color: theme.textSecondary,
              opacity: 0.8,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.3px',
              paddingLeft: '1rem',
              borderLeft: `1px solid ${theme.borderColor}`
            }}>
              <div style={{ 
                fontSize: '11px', 
                opacity: 0.6, 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                marginBottom: '2px'
              }}>
                Portfolio Dashboard
              </div>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: '500', 
                color: theme.textPrimary 
              }}>
                Real-time Analytics
              </div>
            </div>
          </div>

          {/* Status line a la derecha */}
          <div style={{
            position: 'absolute',
            right: '0px',
            bottom: '40%',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.5rem',
            fontSize: '12px',
            color: theme.textSecondary
          }}>
            {/* Connection Type */}
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '500', 
              color: theme.textPrimary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              API Connection
            </span>

            {/* Separador */}
            <div style={{
              width: '1px',
              height: '16px',
              background: theme.borderColor,
              opacity: 1
            }} />

            {/* Last Sync */}
            <span style={{ 
              fontSize: '12px', 
              color: theme.textSecondary 
            }}>
              LAST SYNC: {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
            </span>

            {/* Separador */}
            <div style={{
              width: '1px',
              height: '16px',
              background: theme.borderColor,
              opacity: 1
            }} />

            {/* Kraken Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#00FF99',
                boxShadow: '0 0 6px rgba(0,255,153,0.6)'
              }} />
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '500', 
                color: '#00FF99',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                KRAKEN
              </span>
            </div>

            {/* Separador */}
            <div style={{
              width: '1px',
              height: '16px',
              background: theme.borderColor,
              opacity: 1
            }} />

            {/* Refresh Button Circular */}
            <button
              onClick={() => console.log('Refresh clicked')}
              style={{
                background: 'transparent',
                border: `1px solid ${theme.borderColor}60`,
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                color: theme.textSecondary,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                transform: 'translateY(4px)',
                padding: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00FF99';
                e.currentTarget.style.color = '#00FF99';
                e.currentTarget.style.background = 'rgba(0,255,153,0.05)';
                e.currentTarget.style.transform = 'translateY(4px) rotate(-90deg)';
                e.currentTarget.querySelector('svg').style.color = '#00FF99';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.borderColor + '60';
                e.currentTarget.style.color = theme.textSecondary;
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(4px) rotate(0deg)';
                e.currentTarget.querySelector('svg').style.color = 'white';
              }}
            >
              <div style={{ 
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <RotateCcw size={12} color="white" />
              </div>
            </button>
          </div>
        </div>

        {/* Línea divisora */}
        <div style={{
          borderBottom: `2px solid ${theme.borderColor}60`,
          transform: 'translateY(-210px)'
        }} />
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>

      {/* Main Content Area */}
      <div style={{ padding: '0 2rem' }}>
        {renderCurrentSection()}
      </div>
    </div>
  );
};

export default Dashboard;