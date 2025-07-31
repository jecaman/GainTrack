import { useState } from 'react';
import OverviewSection from './Sections/Overview/OverviewSection';
import AnalyticsSection from './Sections/Analytics/AnalyticsSection';
import PortfolioSection from './Sections/Portfolio/PortfolioSection';
import SectionTabs from './Navigation/SectionTabs';
import Filters from '../Filters';


// Simple zigzag logo for dashboard header
const ZigzagLogo = ({ size = 32, color = "#00ff88" }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M2 16L8 6L14 12L20 4L26 10L30 2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

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
      
      {/* Dashboard Header */}
      <div style={{
        padding: '3rem 2rem 2rem 2rem',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Back to Form Button - Top Left */}
        <button
          onClick={onBackToForm || (() => console.log('Back to form clicked'))}
          style={{
            position: 'absolute',
            top: '3rem',
            left: '2rem',
            background: 'transparent',
            border: `1px solid ${theme.borderColor}`,
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: theme.textSecondary,
            fontFamily: "'Inter', sans-serif",
            zIndex: 9999,
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = theme.accentPrimary;
            e.target.style.color = theme.textPrimary;
            e.target.style.background = `${theme.accentPrimary}10`;
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = theme.borderColor;
            e.target.style.color = theme.textSecondary;
            e.target.style.background = 'transparent';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          <span style={{ fontSize: '16px' }}>←</span>
          Back to Form
        </button>

        {/* Theme Toggle Button - Top Right */}
        <div style={{
          position: 'absolute',
          top: '3rem',
          right: '2rem',
          zIndex: 9999
        }}>
          <button
            onClick={onToggleTheme || (() => console.log('Theme toggle clicked'))}
            style={{
              width: '65px',
              height: '36px',
              background: theme.bg === '#000000' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              border: `2px solid ${theme.bg === '#000000' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              backdropFilter: 'blur(8px)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = theme.bg === '#000000' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = theme.bg === '#000000' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            {/* Toggle circle */}
            <div style={{
              width: '29px',
              height: '29px',
              background: theme.bg === '#000000' ? '#6b7280' : '#4b5563',
              borderRadius: '50%',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: theme.bg === '#000000' ? 'translateX(0)' : 'translateX(29px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
            }}>
              {theme.bg === '#000000' ? '🌙' : '☀️'}
            </div>
          </button>
        </div>

        {/* Logo and Title with same spacing as form */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0px',
          marginBottom: '8px'
        }}>
          <ZigzagLogo size={68} color={theme.accentPrimary} />
          <h1 style={{
            margin: 0,
            marginTop: '-15px',
            fontSize: '32px',
            fontWeight: '700',
            color: theme.textPrimary,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '-0.02em',
            lineHeight: '1'
          }}>
            GainTrack Dashboard
          </h1>
        </div>
        
        {/* Subtitle */}
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: theme.textSecondary,
          fontFamily: "'Inter', sans-serif",
          opacity: 0.8
        }}>
          Powered by Kraken API • Real-time portfolio analytics
        </p>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '0 2rem' }}>
        <SectionTabs
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          theme={theme}
        />
        {renderCurrentSection()}
      </div>
    </div>
  );
};

export default Dashboard;