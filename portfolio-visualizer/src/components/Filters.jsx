import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Filters.css';

const Filters = ({ theme, onFiltersChange, portfolioData, onSidebarToggle, showApplyPopup, setShowApplyPopup, startDate, endDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTabPulse, setShowTabPulse] = useState(false);
  const [isTabHoverDisabled, setIsTabHoverDisabled] = useState(false);
  const [activeSection, setActiveSection] = useState('filters');
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [baseCurrency, setBaseCurrency] = useState('EUR');
  const [activeFilters, setActiveFilters] = useState(0);
  const tabButtonRef = useRef(null);
  
  // Estados para animaciones del popup
  const [popupAnimation, setPopupAnimation] = useState('entering');
  const [isApplying, setIsApplying] = useState(false);
  
  // Estados para el timer automático
  const [timeRemaining, setTimeRemaining] = useState(9); // 9 segundos
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  
  // Efecto para animación de entrada del popup y timer automático
  useEffect(() => {
    if (showApplyPopup) {
      setPopupAnimation('entering');
      setTimeRemaining(9);
      setIsTimerPaused(false);
      
      const timer = setTimeout(() => {
        setPopupAnimation('visible');
        
        // Iniciar timer automático después de que aparezca
        startAutoCloseTimer();
      }, 20);
      
      return () => {
        clearTimeout(timer);
        clearAutoCloseTimer();
      };
    }
  }, [showApplyPopup]);
  
  // Función para iniciar el timer automático
  const startAutoCloseTimer = () => {
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Tiempo agotado - cerrar popup
          handleAutoClose();
          return 0;
        }
        return prev - 0.1; // Decrementar cada 100ms para suavidad
      });
    }, 100);
  };
  
  // Función para limpiar timers
  const clearAutoCloseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  // Función para cierre automático
  const handleAutoClose = () => {
    clearAutoCloseTimer();
    setPopupAnimation('exitingRight');
    setTimeout(() => {
      setShowApplyPopup(false);
      setPopupAnimation('entering');
    }, 400);
  };
  
  // Pausar/reanudar timer en hover
  const handlePopupMouseEnter = () => {
    setIsTimerPaused(true);
    clearAutoCloseTimer();
  };
  
  const handlePopupMouseLeave = () => {
    setIsTimerPaused(false);
    if (timeRemaining > 0) {
      startAutoCloseTimer();
    }
  };
  
  // Funciones para manejar las salidas animadas
  const handleClosePopup = () => {
    clearAutoCloseTimer();
    setPopupAnimation('exitingRight');
    setTimeout(() => {
      setShowApplyPopup(false);
      setPopupAnimation('entering');
    }, 400);
  };
  
  const handleApplyFilter = () => {
    clearAutoCloseTimer();
    console.log('Aplicando período a toda la página:', { startDate, endDate });
    setPopupAnimation('applying');
    setTimeout(() => {
      setPopupAnimation('exitingRight');
      setTimeout(() => {
        setShowApplyPopup(false);
        setPopupAnimation('entering');
      }, 400);
    }, 250);
  };

  // Get available assets from portfolio data
  const availableAssets = portfolioData?.portfolio_data ? 
    portfolioData.portfolio_data
      .filter(asset => (asset.current_value || 0) > 0)
      .map(asset => asset.asset) : [];

  const sections = [
    { id: 'filters', label: 'Filters' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'settings', label: 'Settings' }
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
            marginLeft: '-10px'
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
                  padding: '16px 12px',
                  background: activeSection === section.id ? theme.bgElevated : 'transparent',
                  border: 'none',
                  color: activeSection === section.id ? theme.textPrimary : theme.textSecondary,
                  fontSize: '13px',
                  fontWeight: activeSection === section.id ? '600' : '500',
                  cursor: 'pointer',
                  borderBottom: activeSection === section.id ? `2px solid ${theme.accentPrimary}` : `2px solid transparent`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '0.3px',
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
      {showApplyPopup && (() => {
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
              return 'translateY(100px) translateX(0)';
            case 'visible':
              return 'translateY(0) translateX(0)';
            case 'applying':
              return 'translateY(-10px) translateX(0) scale(0.9)';
            case 'exitingRight':
              return 'translateY(0) translateX(300px)';
            default:
              return 'translateY(0) translateX(0)';
          }
        };
        
        return createPortal(
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
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
              transition: popupAnimation === 'entering' ? 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'all 0.4s ease-out',
              transform: getTransform(),
              opacity: popupAnimation === 'exitingRight' ? 0 : 1,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={handlePopupMouseEnter}
            onMouseLeave={handlePopupMouseLeave}
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
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                letterSpacing: '0.2px',
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
                width: '28px',
                height: '28px',
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
            
            {/* Barra de progreso del timer */}
            <div style={{
              width: '100%',
              height: '3px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginTop: '6px',
            }}>
              <div
                style={{
                  height: '100%',
                  background: isTimerPaused ? 
                    'linear-gradient(90deg, #ffaa00, #ff6600)' : 
                    'linear-gradient(90deg, #00ff88, #00cc66)',
                  borderRadius: '2px',
                  transition: isTimerPaused ? 'none' : 'width 0.1s linear',
                  width: `${(timeRemaining / 9) * 100}%`,
                  boxShadow: isTimerPaused ? 
                    '0 0 6px rgba(255, 170, 0, 0.6)' : 
                    '0 0 6px rgba(0, 255, 136, 0.6)',
                }}
              />
            </div>
          </div>,
          popupRoot
        );
      })()}
    </>
  );
};

export default Filters;