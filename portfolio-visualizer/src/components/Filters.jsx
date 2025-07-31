import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Filters.css';

const Filters = ({ theme, onFiltersChange, portfolioData, onSidebarToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTabPulse, setShowTabPulse] = useState(true);
  const [isTabHoverDisabled, setIsTabHoverDisabled] = useState(false);
  const [activeSection, setActiveSection] = useState('filters');
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [baseCurrency, setBaseCurrency] = useState('EUR');
  const [activeFilters, setActiveFilters] = useState(0);
  const tabButtonRef = useRef(null);

  // Get available assets from portfolio data
  const availableAssets = portfolioData?.portfolio_data ? 
    portfolioData.portfolio_data
      .filter(asset => (asset.current_value || 0) > 0)
      .map(asset => asset.asset) : [];

  const sections = [
    { id: 'filters', label: 'Filters', icon: '🎛️' },
    { id: 'analysis', label: 'Analysis', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
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

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes tabPulse {
        0%, 100% { box-shadow: 0.25rem 0 1rem rgba(0, 255, 136, 0.2); }
        50% { box-shadow: 0.5rem 0 1.5rem rgba(0, 255, 136, 0.4); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleAssetToggle = (asset) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(asset)) {
      newSelected.delete(asset);
    } else {
      newSelected.add(asset);
    }
    setSelectedAssets(newSelected);
    
    // Update active filters count
    setActiveFilters(newSelected.size + (dateRange.from ? 1 : 0) + (dateRange.to ? 1 : 0));
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
    <>
      {/* Tab Button - Always visible, independent of panel */}
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
            width: '68px',
            position: 'fixed',
            top: '125px',
            right: '-30px',
            animation: showTabPulse ? 'tabPulse 2s ease-in-out infinite' : 'none',
            fontFamily: "'Inter', sans-serif",
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent',
            outline: 'none',
            zIndex: 1000000,
            pointerEvents: 'auto',
          }}
          onMouseEnter={(e) => {
            if (!isTabHoverDisabled) {
              e.target.style.background = theme.bgContainer;
              e.target.style.borderColor = theme.accentPrimary;
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
            marginLeft: '-30px'
          }}>FILTERS</div>
          
          {/* Active filters badge */}
          {activeFilters > 0 && (
            <div style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: theme.accentPrimary,
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

        {/* Main Sidebar Panel - Independent positioning */}
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '350px',
          height: '100vh',
          background: theme.bgElevated,
          border: `1px solid ${theme.borderColor}`,
          borderRight: 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
          zIndex: 999999,
          transform: isOpen ? 'translateX(0)' : 'translateX(350px)',
          transition: 'transform 0.3s linear',
          pointerEvents: 'auto'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px',
            borderBottom: `1px solid ${theme.borderColor}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{
              margin: 0,
              color: theme.textPrimary,
              fontSize: '18px',
              fontWeight: '600',
              fontFamily: "'Inter', sans-serif"
            }}>Portfolio Controls</h3>
            <button
              onClick={() => {
                setIsOpen(false);
                if (onSidebarToggle) {
                  onSidebarToggle(false);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: theme.textSecondary,
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>

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
                  padding: '12px 8px',
                  background: activeSection === section.id ? theme.bgElevated : 'transparent',
                  border: 'none',
                  color: activeSection === section.id ? theme.textPrimary : theme.textSecondary,
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  borderBottom: activeSection === section.id ? `2px solid ${theme.accentPrimary}` : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: activeSection === section.id ? 'translateY(-1px)' : 'translateY(0)',
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                <div>{section.icon}</div>
                <div style={{ marginTop: '4px' }}>{section.label}</div>
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto'
          }}>
            {activeSection === 'filters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Date Range */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: theme.textSecondary,
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: "'Inter', sans-serif"
                  }}>Date Range</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => {
                        const newRange = {...dateRange, from: e.target.value};
                        setDateRange(newRange);
                        setActiveFilters(selectedAssets.size + (newRange.from ? 1 : 0) + (newRange.to ? 1 : 0));
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: `1px solid ${theme.borderColor}`,
                        borderRadius: '6px',
                        background: theme.bgContainer,
                        color: theme.textPrimary,
                        fontSize: '12px',
                        fontFamily: "'Inter', sans-serif"
                      }}
                    />
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => {
                        const newRange = {...dateRange, to: e.target.value};
                        setDateRange(newRange);
                        setActiveFilters(selectedAssets.size + (newRange.from ? 1 : 0) + (newRange.to ? 1 : 0));
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: `1px solid ${theme.borderColor}`,
                        borderRadius: '6px',
                        background: theme.bgContainer,
                        color: theme.textPrimary,
                        fontSize: '12px',
                        fontFamily: "'Inter', sans-serif"
                      }}
                    />
                  </div>
                </div>

                {/* Asset Selection */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: theme.textSecondary,
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: "'Inter', sans-serif"
                  }}>Assets</label>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px', 
                    maxHeight: '200px', 
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
                          checked={selectedAssets.has(asset)}
                          onChange={() => handleAssetToggle(asset)}
                          style={{
                            accentColor: theme.accentPrimary
                          }}
                        />
                        <span style={{
                          color: theme.textPrimary,
                          fontSize: '14px',
                          fontFamily: "'Inter', sans-serif"
                        }}>{asset}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Quick Filters */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: theme.textSecondary,
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: "'Inter', sans-serif"
                  }}>Quick Filters</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['All Assets', 'Crypto Only', 'Fiat Only', 'Profitable Only', 'Losing Only'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => handleQuickFilter(filter)}
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
                          e.target.style.borderColor = theme.accentPrimary;
                          e.target.style.backgroundColor = theme.bgElevated;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = theme.borderColor;
                          e.target.style.backgroundColor = theme.bgContainer;
                        }}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'analysis' && (
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

            {activeSection === 'settings' && (
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                          e.target.style.borderColor = theme.accentPrimary;
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
    </>
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
  return createPortal(sidebarContent, getPortalTarget());
};

export default Filters;