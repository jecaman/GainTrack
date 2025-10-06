import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Filters.css';

const Filters = ({ theme, onFiltersChange, portfolioData, onSidebarToggle, showApplyPopup, setShowApplyPopup, startDate, endDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTabPulse, setShowTabPulse] = useState(false);
  const [isTabHoverDisabled, setIsTabHoverDisabled] = useState(false);
  const [activeSection, setActiveSection] = useState('filters');
  const [hiddenAssets, setHiddenAssets] = useState(new Set());
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedTimePreset, setSelectedTimePreset] = useState('');
  const [minAllocation, setMinAllocation] = useState('0');
  const [balanceThreshold, setBalanceThreshold] = useState('0');
  const [excludedOperations, setExcludedOperations] = useState(new Set());
  const [baseCurrency, setBaseCurrency] = useState('EUR');
  const [activeFilters, setActiveFilters] = useState(0);
  const tabButtonRef = useRef(null);
  
  // Set default dates on component mount
  useEffect(() => {
    if (!dateRange.from && !dateRange.to) {
      const now = new Date();
      const endDate = now.toISOString().split('T')[0];
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
      setDateRange({ from: startDate, to: endDate });
    }
  }, []);
  
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
    console.log('Aplicando período a toda la página:', { startDate, endDate });
    setPopupAnimation('applying');
    setTimeout(() => {
      setShowApplyPopup(false);
    }, 200);
  };

  // Get available assets from portfolio data
  const availableAssets = portfolioData?.portfolio_data ? 
    portfolioData.portfolio_data
      .filter(asset => (asset.current_value || 0) > 0)
      .map(asset => asset.asset) : [];

  // Helper function to update active filters count
  const updateActiveFiltersCount = (hiddenAssets, dateRng, timePreset, minAlloc, balThreshold, excludedOps) => {
    let count = 0;
    if (hiddenAssets.size > 0) count++;
    if (dateRng.from || dateRng.to) count++;
    if (timePreset) count++;
    if (parseFloat(minAlloc) > 0) count++;
    if (parseFloat(balThreshold) > 0) count++;
    if (excludedOps && excludedOps.size > 0) count++;
    setActiveFilters(count);
  };

  // Helper function to set time preset dates
  const setTimePresetDates = (preset) => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate;
    
    switch(preset) {
      case '1W':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '1M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
        break;
      case '3M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().split('T')[0];
        break;
      case '6M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString().split('T')[0];
        break;
      case '1Y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
        break;
      case 'All':
        startDate = '';
        endDate = '';
        break;
      default:
        return;
    }
    
    const newRange = preset === 'All' ? { from: '', to: '' } : { from: startDate, to: endDate };
    setDateRange(newRange);
    setSelectedTimePreset(preset);
    updateActiveFiltersCount(hiddenAssets, newRange, preset, minAllocation, balanceThreshold, excludedOperations);
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
    const newHidden = new Set(hiddenAssets);
    if (newHidden.has(asset)) {
      newHidden.delete(asset);
    } else {
      newHidden.add(asset);
    }
    setHiddenAssets(newHidden);
    updateActiveFiltersCount(newHidden, dateRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
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
              e.target.style.borderColor = '#00ff99';
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
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '12px',
                      color: theme.textSecondary,
                      fontSize: '13px',
                      fontWeight: '600',
                      fontFamily: "'Inter', sans-serif",
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>Date Range</label>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Start Date */}
                      <div style={{ position: 'relative' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '6px',
                          color: theme.textSecondary,
                          fontSize: '11px',
                          fontWeight: '500',
                          fontFamily: "'Inter', sans-serif",
                          letterSpacing: '0.025em',
                          textTransform: 'uppercase'
                        }}>Start Date</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                          <input
                            type="text"
                            value={dateRange.from}
                            placeholder="YYYY-MM-DD"
                            onChange={(e) => {
                              const newRange = {...dateRange, from: e.target.value};
                              setDateRange(newRange);
                              updateActiveFiltersCount(hiddenAssets, newRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
                            }}
                            style={{
                              flex: '1',
                              padding: '8px 12px',
                              border: `1px solid ${dateRange.from ? '#00ff99' : theme.borderColor}`,
                              borderRadius: '4px',
                              background: theme.bgElevated,
                              color: theme.textPrimary,
                              fontSize: '13px',
                              fontFamily: "'Inter', sans-serif",
                              fontWeight: '400',
                              outline: 'none',
                              transition: 'all 0.2s ease'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#00ff99';
                              e.target.style.boxShadow = '0 0 0 2px rgba(0, 255, 153, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = dateRange.from ? '#00ff99' : theme.borderColor;
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                          <div style={{ position: 'relative', width: '36px', height: '36px' }}>
                            <div 
                              style={{
                                width: '36px',
                                height: '36px',
                                border: `1px solid ${theme.borderColor}`,
                                borderRadius: '4px',
                                background: theme.bgElevated,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => {
                                const input = document.getElementById('start-date-picker');
                                input.showPicker();
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.borderColor = '#00ff99';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.borderColor = theme.borderColor;
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                            </div>
                            <input
                              id="start-date-picker"
                              type="date"
                              value={dateRange.from}
                              min="2020-01-01"
                              max={new Date().toISOString().split('T')[0]}
                              onChange={(e) => {
                                const newRange = {...dateRange, from: e.target.value};
                                setDateRange(newRange);
                                updateActiveFiltersCount(hiddenAssets, newRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
                              }}
                              style={{
                                position: 'absolute',
                                right: '0px',
                                top: '40px',
                                opacity: 0,
                                pointerEvents: 'none',
                                width: '1px',
                                height: '1px'
                              }}
                            />
                          </div>
                        </div>
                        {dateRange.from && (
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
                          fontSize: '11px',
                          fontWeight: '500',
                          fontFamily: "'Inter', sans-serif",
                          letterSpacing: '0.025em',
                          textTransform: 'uppercase'
                        }}>End Date</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                          <input
                            type="text"
                            value={dateRange.to}
                            placeholder="YYYY-MM-DD"
                            onChange={(e) => {
                              const newRange = {...dateRange, to: e.target.value};
                              setDateRange(newRange);
                              updateActiveFiltersCount(hiddenAssets, newRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
                            }}
                            style={{
                              flex: '1',
                              padding: '8px 12px',
                              border: `1px solid ${dateRange.to ? '#00ff99' : theme.borderColor}`,
                              borderRadius: '4px',
                              background: theme.bgElevated,
                              color: theme.textPrimary,
                              fontSize: '13px',
                              fontFamily: "'Inter', sans-serif",
                              fontWeight: '400',
                              outline: 'none',
                              transition: 'all 0.2s ease'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#00ff99';
                              e.target.style.boxShadow = '0 0 0 2px rgba(0, 255, 153, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = dateRange.to ? '#00ff99' : theme.borderColor;
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                          <div style={{ position: 'relative', width: '36px', height: '36px' }}>
                            <div 
                              style={{
                                width: '36px',
                                height: '36px',
                                border: `1px solid ${theme.borderColor}`,
                                borderRadius: '4px',
                                background: theme.bgElevated,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => {
                                const input = document.getElementById('end-date-picker');
                                input.showPicker();
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.borderColor = '#00ff99';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.borderColor = theme.borderColor;
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                            </div>
                            <input
                              id="end-date-picker"
                              type="date"
                              value={dateRange.to}
                              min={dateRange.from || "2020-01-01"}
                              max={new Date().toISOString().split('T')[0]}
                              onChange={(e) => {
                                const newRange = {...dateRange, to: e.target.value};
                                setDateRange(newRange);
                                updateActiveFiltersCount(hiddenAssets, newRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
                              }}
                              style={{
                                position: 'absolute',
                                right: '0px',
                                top: '40px',
                                opacity: 0,
                                pointerEvents: 'none',
                                width: '1px',
                                height: '1px'
                              }}
                            />
                          </div>
                        </div>
                        {dateRange.to && (
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
                      
                      {/* Clear Button */}
                      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-start' }}>
                        <button
                          onClick={() => {
                            const newRange = { from: '', to: '' };
                            setDateRange(newRange);
                            updateActiveFiltersCount(hiddenAssets, newRange, selectedTimePreset, minAllocation, balanceThreshold, excludedOperations);
                          }}
                          style={{
                            padding: '6px 12px',
                            border: `1px solid ${theme.borderColor}`,
                            borderRadius: '6px',
                            background: theme.bgElevated,
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
                            e.target.style.background = '#ff6b6b';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = theme.bgElevated;
                            e.target.style.color = '#ff6b6b';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                          }}
                          onMouseDown={(e) => {
                            e.target.style.transform = 'translateY(0) scale(0.98)';
                          }}
                          onMouseUp={(e) => {
                            e.target.style.transform = 'translateY(-2px) scale(1)';
                          }}
                        >
                          ✕ Clear
                        </button>
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
                          fontSize: '11px',
                          color: '#00ff99',
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: '500'
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
                    </div>
                  </div>
                  
                  {/* Quick Periods */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: theme.textSecondary,
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
                              e.target.style.borderColor = '#00ff99';
                              e.target.style.backgroundColor = theme.bgContainer;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedTimePreset !== preset) {
                              e.target.style.borderColor = theme.borderColor;
                              e.target.style.backgroundColor = theme.bgElevated;
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
                    display: 'block',
                    marginBottom: '8px',
                    color: theme.textSecondary,
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>Assets</label>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px', 
                    maxHeight: '160px', 
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
                          checked={!hiddenAssets.has(asset)}
                          onChange={() => handleAssetToggle(asset)}
                          style={{
                            accentColor: '#00ff99'
                          }}
                        />
                        <span style={{
                          color: theme.textPrimary,
                          fontSize: '12px',
                          fontWeight: '600',
                          fontFamily: "'Inter', sans-serif"
                        }}>{asset}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Portfolio Filters */}
                <div style={{
                  background: theme.bgContainer,
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.borderColor}`,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: theme.textSecondary,
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>Portfolio Filters</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Min Allocation % */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '6px',
                        color: theme.textSecondary,
                        fontSize: '11px',
                        fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                        fontWeight: '600',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>Min Allocation %</label>
                      <input
                        type="number"
                        value={minAllocation}
                        onChange={(e) => {
                          setMinAllocation(e.target.value);
                          updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, e.target.value, balanceThreshold, excludedOperations);
                        }}
                        placeholder="0"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: `1px solid ${theme.borderColor}`,
                          borderRadius: '6px',
                          background: theme.bgElevated,
                          color: theme.textPrimary,
                          fontSize: '12px',
                          fontFamily: "'Inter', sans-serif"
                        }}
                      />
                    </div>

                    {/* Balance Threshold */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '6px',
                        color: theme.textSecondary,
                        fontSize: '11px',
                        fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                        fontWeight: '600',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>Balance Threshold</label>
                      <input
                        type="number"
                        value={balanceThreshold}
                        onChange={(e) => {
                          setBalanceThreshold(e.target.value);
                          updateActiveFiltersCount(hiddenAssets, dateRange, selectedTimePreset, minAllocation, e.target.value, excludedOperations);
                        }}
                        placeholder="0"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: `1px solid ${theme.borderColor}`,
                          borderRadius: '6px',
                          background: theme.bgElevated,
                          color: theme.textPrimary,
                          fontSize: '12px',
                          fontFamily: "'Inter', sans-serif"
                        }}
                      />
                    </div>
                  </div>
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
                    display: 'block',
                    marginBottom: '8px',
                    color: theme.textSecondary,
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>Operations</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {['Buy', 'Sell', 'Market Orders', 'Limit Orders'].map(operation => (
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
                        e.target.style.background = theme.bgElevated;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
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
                          color: excludedOperations.has(operation) ? theme.textSecondary : theme.textPrimary,
                          fontWeight: excludedOperations.has(operation) ? '400' : '600',
                          fontSize: '12px',
                          fontFamily: "'Inter', sans-serif"
                        }}>{operation}</span>
                      </label>
                    ))}
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
                      setHiddenAssets(new Set());
                      setDateRange({ from: '', to: '' });
                      setSelectedTimePreset('');
                      setMinAllocation('0');
                      setBalanceThreshold('0');
                      setExcludedOperations(new Set());
                      setActiveFilters(0);
                      console.log('All filters cleared');
                      if (onFiltersChange) {
                        onFiltersChange({
                          hiddenAssets: [],
                          dateRange: { from: '', to: '' },
                          selectedTimePreset: '',
                          minAllocation: 0,
                          balanceThreshold: 0,
                          excludedOperations: []
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
                      e.target.style.borderColor = '#ff6b6b';
                      e.target.style.color = '#ff6b6b';
                      e.target.style.background = theme.bgElevated;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = theme.textSecondary;
                      e.target.style.color = theme.textPrimary;
                      e.target.style.background = theme.bgContainer;
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
                          e.target.style.borderColor = '#00ff99';
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
              padding: '8px',
              fontFamily: 'Inter, sans-serif',
              pointerEvents: 'auto',
              boxShadow: popupAnimation === 'applying' ? '0 0 40px rgba(0, 255, 136, 0.8)' : '0 0 20px rgba(0, 255, 136, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
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
              gap: '6px',
            }}>
            <button
              onClick={handleApplyFilter}
              style={{
                background: '#00ff88',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 10px',
                fontSize: '11px',
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
                width: '26px',
                height: '26px',
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
    </>
  );
};

export default Filters;