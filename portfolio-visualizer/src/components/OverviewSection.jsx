import { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { centerTextPlugin, assetLabelMap } from '../utils/chartUtils';
import { getAssetColorsArray, getThemeAssetColor } from '../utils/assetColors';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title);

// ZigzagLogo Component
const ZigzagLogo = ({
  size = 32,
  color = "#00ff88",
  sloganGlow = false,
  isDarkMode = true
}) => {
  const [visible, setVisible] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (sloganGlow) {
      setVisible(true);
      setFade(false);
      const timer = setTimeout(() => {
        setFade(true);
        setTimeout(() => setVisible(false), 400);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      setFade(false);
    }
  }, [sloganGlow]);

  const path = [
    { x: 2, y: 16 },
    { x: 8, y: 6 },
    { x: 14, y: 12 },
    { x: 20, y: 4 },
    { x: 26, y: 10 },
    { x: 30, y: 2 }
  ];

  const getPointPosition = (progress) => {
    let totalDist = 0;
    const segDists = [];
    for (let i = 0; i < path.length - 1; i++) {
      const dx = path[i + 1].x - path[i].x;
      const dy = path[i + 1].y - path[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      segDists.push(dist);
      totalDist += dist;
    }
    let targetDist = progress * totalDist;
    for (let i = 0; i < segDists.length; i++) {
      if (targetDist > segDists[i]) {
        targetDist -= segDists[i];
      } else {
        const ratio = targetDist / segDists[i];
        const x = path[i].x + (path[i + 1].x - path[i].x) * ratio;
        const y = path[i].y + (path[i + 1].y - path[i].y) * ratio;
        return { x, y };
      }
    }
    return path[path.length - 1];
  };

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      return;
    }
    let start = null;
    let rafId = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      let p = Math.min(elapsed / 2000, 1);
      setProgress(p);
      if (p < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };
    rafId = requestAnimationFrame(animate);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [visible]);

  const punto = getPointPosition(progress);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        style={{ display: 'block' }}
      >
        <path
          d="M2 16 L8 6 L14 12 L20 4 L26 10 L30 2"
          stroke={color}
          strokeWidth={2.2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {visible && (
          <circle
            cx={punto.x}
            cy={punto.y}
            r={2.8}
            fill="#ffffff"
            style={{
              filter: 'drop-shadow(0 0 4px #ffffff)',
              opacity: fade ? 0 : 1,
              transition: fade ? 'opacity 0.4s ease-out' : 'none'
            }}
          />
        )}
      </svg>
    </div>
  );
};

// Theme Toggle Component
const ThemeToggle = ({ isDark, onToggle }) => (
  <div style={{
    position: 'fixed',
    top: '18px',
    right: '18px',
    zIndex: 100
  }}>
    <button
      onClick={onToggle}
      style={{
        width: '65px',
        height: '36px',
        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div style={{
        width: '29px',
        height: '29px',
        background: isDark ? '#6b7280' : '#4b5563',
        borderRadius: '50%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isDark ? 'translateX(0)' : 'translateX(29px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
      }}>
        {isDark ? '🌙' : '☀️'}
      </div>
    </button>
  </div>
);

// Background Pattern Component
const BackgroundPattern = ({ isDark }) => {
  const verticalLines = Array.from({ length: 35 }, (_, i) => ({
    id: i,
    position: (i / 34) * 95
  }));
  
  const horizontalLines = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    position: (i / 29) * 95
  }));

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0
      }}>
        <div style={{ 
          opacity: isDark ? 0.6 : 0.5,
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {verticalLines.map((line) => (
            <div
              key={`vertical-${line.id}`}
              style={{
                position: 'absolute',
                left: `${line.position}%`,
                top: 0,
                width: '1px',
                height: '100%',
                background: `linear-gradient(180deg, transparent, ${isDark ? '#4b5563' : '#d1d5db'}, transparent)`,
                transition: 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          ))}
          {horizontalLines.map((line) => (
            <div
              key={`horizontal-${line.id}`}
              style={{
                position: 'absolute',
                top: `${line.position}%`,
                left: 0,
                width: '100%',
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${isDark ? '#4b5563' : '#d1d5db'}, transparent)`,
                transition: 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          ))}
        </div>
      </div>
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(ellipse at center, ${isDark ? '#000000' : '#f6f7f8'} 25%, transparent 75%)`,
        pointerEvents: 'none',
        transition: 'background 0.5s ease'
      }}
      />
      
      {/* Blur effect for middle section with charts */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: '80%',
        height: '60%',
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(ellipse at center, ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(246,247,248,0.3)'} 0%, transparent 70%)`,
        filter: 'blur(120px)',
        pointerEvents: 'none',
        transition: 'background 0.5s ease',
        zIndex: 0
      }}
      />
    </>
  );
};

// KPI Card Component
const KPICard = ({ label, value, changePercent, isPositive, theme, showChange = false }) => {
  return (
    <div 
      style={{
        background: theme.bgElevated,
        border: `1px solid ${theme.border}`,
        borderRadius: '10px',
        padding: 'clamp(0.6875rem, 2.2vw, 0.9625rem)',
        textAlign: 'center',
        minWidth: 'clamp(7.15rem, 19.8vw, 8.25rem)',
        flex: '1',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(theme.bg === '#000000' ? {} : {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)'
        }),
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-0.1875rem) scale(1.08)';
        e.currentTarget.style.borderColor = theme.greenPrimary;
        e.currentTarget.style.boxShadow = '0 -0.75rem 0.75rem rgba(0, 255, 136, 0.2), 0 0.75rem 0.75rem rgba(0, 255, 136, 0.2), 0.375rem 0 0.75rem rgba(0, 255, 136, 0.2)';
        e.currentTarget.style.background = theme.bgContainer;
        
        const label = e.currentTarget.querySelector('[data-kpi-label]');
        if (label) {
          label.style.color = '#ffffff';
          label.style.fontWeight = '700';
          label.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.borderColor = theme.border;
        e.currentTarget.style.boxShadow = theme.bg === '#000000' ? 'none' : '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)';
        e.currentTarget.style.background = theme.bgElevated;
        
        const label = e.currentTarget.querySelector('[data-kpi-label]');
        if (label) {
          label.style.color = '#ffffff';
          label.style.fontWeight = '700';
          label.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.3)';
        }
      }}
    >
      <div 
        data-kpi-label
        style={{
          color: '#ffffff',
          fontSize: 'clamp(0.825rem, 2.75vw, 0.9625rem)',
          fontWeight: '700',
          marginBottom: '0.5rem',
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
        }}
      >
        {label}
      </div>

      <div style={{
        color: showChange ? 
          (parseFloat(changePercent) === 0 ? theme.textMuted : (isPositive ? theme.greenPrimary : '#ef4444')) 
          : theme.textPrimary,
        fontSize: 'clamp(1.1rem, 3.85vw, 1.375rem)',
        fontWeight: '700',
        fontFamily: "'Space Grotesk', sans-serif",
        letterSpacing: '-0.01em',
        lineHeight: '1.2',
        marginBottom: showChange ? '4px' : '0'
      }}>
        {value}
      </div>

      {showChange && changePercent && (
        <div style={{
          color: parseFloat(changePercent) === 0 ? theme.textMuted : (isPositive ? theme.greenPrimary : '#ef4444'),
          fontSize: 'clamp(0.6875rem, 2.2vw, 0.75625rem)',
          fontWeight: '600',
          fontFamily: "'Inter', sans-serif"
        }}>
          {parseFloat(changePercent) === 0 ? '0%' : changePercent}
        </div>
      )}
    </div>
  );
};

// Chart Container Component
const ChartContainer = ({ title, children, theme, height = "225px" }) => (
  <div style={{
    background: theme.bgElevated,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    padding: '20px',
    height: height,
    display: 'flex',
    flexDirection: 'column',
    ...(theme.bg === '#000000' ? {} : {
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)'
    })
  }}>
    <h3 style={{
      color: theme.textPrimary,
      fontSize: '16px',
      fontWeight: '600',
      margin: '0 0 16px 0',
      textAlign: 'center'
    }}>
      {title}
    </h3>
    <div style={{ flex: 1, minHeight: 0 }}>
      {children}
    </div>
  </div>
);

// Sidebar Component
const Sidebar = ({ isOpen, onClose, theme, portfolioData }) => {
  const [activeSection, setActiveSection] = useState('filters');
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [baseCurrency, setBaseCurrency] = useState('EUR');

  // Get available assets from portfolio data
  const availableAssets = portfolioData?.asset_breakdown ? 
    Object.keys(portfolioData.asset_breakdown).filter(asset => 
      portfolioData.asset_breakdown[asset].balance > 0
    ) : [];

  const sections = [
    { id: 'filters', label: 'Filters', icon: '🎛️' },
    { id: 'analysis', label: 'Analysis', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const handleAssetToggle = (asset) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(asset)) {
      newSelected.delete(asset);
    } else {
      newSelected.add(asset);
    }
    setSelectedAssets(newSelected);
  };

  return (
    <>
      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '350px',
        background: theme.bgElevated,
        border: `1px solid ${theme.border}`,
        borderLeft: 'none',
        zIndex: 999,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            margin: 0,
            color: theme.textPrimary,
            fontSize: '18px',
            fontWeight: '600'
          }}>Portfolio Controls</h3>
          <button
            onClick={onClose}
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
          borderBottom: `1px solid ${theme.border}`,
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
                fontSize: 'clamp(0.75625rem, 2.42vw, 0.825rem)',
                fontWeight: '500',
                cursor: 'pointer',
                borderBottom: activeSection === section.id ? `2px solid ${theme.greenPrimary}` : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: activeSection === section.id ? 'translateY(-1px)' : 'translateY(0)'
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
                  fontSize: 'clamp(0.825rem, 2.75vw, 0.9625rem)',
                  fontWeight: '500'
                }}>Date Range</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '6px',
                      background: theme.bgContainer,
                      color: theme.textPrimary,
                      fontSize: 'clamp(0.75625rem, 2.42vw, 0.825rem)'
                    }}
                  />
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '6px',
                      background: theme.bgContainer,
                      color: theme.textPrimary,
                      fontSize: 'clamp(0.75625rem, 2.42vw, 0.825rem)'
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
                  fontSize: 'clamp(0.825rem, 2.75vw, 0.9625rem)',
                  fontWeight: '500'
                }}>Assets</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {availableAssets.map(asset => (
                    <label key={asset} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '4px',
                      ':hover': { background: theme.bgContainer }
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedAssets.has(asset)}
                        onChange={() => handleAssetToggle(asset)}
                        style={{
                          accentColor: theme.greenPrimary
                        }}
                      />
                      <span style={{
                        color: theme.textPrimary,
                        fontSize: '14px'
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
                  fontSize: 'clamp(0.825rem, 2.75vw, 0.9625rem)',
                  fontWeight: '500'
                }}>Quick Filters</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['All Assets', 'Crypto Only', 'Fiat Only', 'Profitable Only', 'Losing Only'].map(filter => (
                    <button
                      key={filter}
                      style={{
                        padding: '8px 12px',
                        background: theme.bgContainer,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        color: theme.textPrimary,
                        fontSize: 'clamp(0.75625rem, 2.42vw, 0.825rem)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = theme.greenPrimary;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = theme.border;
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
                border: `1px solid ${theme.border}`
              }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  color: theme.textPrimary,
                  fontSize: '14px'
                }}>Portfolio Metrics</h4>
                <div style={{ fontSize: 'clamp(0.75625rem, 2.42vw, 0.825rem)', color: theme.textSecondary }}>
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
                  fontSize: 'clamp(0.825rem, 2.75vw, 0.9625rem)',
                  fontWeight: '500'
                }}>Base Currency</label>
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    background: theme.bgContainer,
                    color: theme.textPrimary,
                    fontSize: '14px'
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
                  fontSize: 'clamp(0.825rem, 2.75vw, 0.9625rem)',
                  fontWeight: '500'
                }}>Export Data</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['Export as CSV', 'Export as JSON', 'Export Report'].map(option => (
                    <button
                      key={option}
                      style={{
                        padding: '8px 12px',
                        background: theme.bgContainer,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        color: theme.textPrimary,
                        fontSize: 'clamp(0.75625rem, 2.42vw, 0.825rem)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = theme.greenPrimary;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = theme.border;
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
};


// Main Overview Component
const OverviewSection = ({ portfolioData, isLoading = false, error = null, onBack = null }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTabPulse, setShowTabPulse] = useState(true);
  const [activeFilters, setActiveFilters] = useState(0);
  const tabButtonRef = useRef(null);
  const [isTabHoverDisabled, setIsTabHoverDisabled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTabPulse(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!sidebarOpen) {
          setSidebarOpen(true);
          setShowTabPulse(false);
        }
      }
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [sidebarOpen]);

  const handleTabClick = () => {
    setSidebarOpen(!sidebarOpen);
    setShowTabPulse(false);
    setIsTabHoverDisabled(true);
    setTimeout(() => setIsTabHoverDisabled(false), 300);
  };

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes tabPulse {
        0% { 
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1); 
          border-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'};
        }
        50% { 
          box-shadow: 3px 0 12px rgba(0, 255, 136, 0.15); 
          border-color: rgba(0, 255, 136, 0.3);
        }
        100% { 
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1); 
          border-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'};
        }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, [isDarkMode]);

  // Theme configuration
  const theme = isDarkMode ? {
    bg: '#000000',
    bgElevated: '#111111',
    bgContainer: '#1a1a1a',
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.05)',
    greenPrimary: '#00ff88',
    greenSecondary: '#22c55e',
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a'
  } : {
    bg: '#f6f7f8',
    bgElevated: '#ffffff',
    bgContainer: '#f1f3f4',
    border: 'rgba(0, 0, 0, 0.06)',
    borderLight: 'rgba(0, 0, 0, 0.03)',
    greenPrimary: '#10b981',
    greenSecondary: '#ecfdf5',
    textPrimary: '#1a1a1a',
    textSecondary: '#4a4a4a',
    textMuted: '#737373'
  };

  // Process KPI data
  const getKPIData = () => {
    if (!portfolioData?.kpis) {
      return {
        totalInvested: '0.00€',
        currentValue: '0.00€',
        profit: '0.00€',
        profitPercent: '0.00%',
        isPositive: false,
        liquidity: '0.00€',
        fees: '0.00€'
      };
    }

    const kpis = portfolioData.kpis;
    const isPositive = kpis.profit >= 0;

    return {
      totalInvested: `${kpis.total_invested.toFixed(2)}€`,
      currentValue: `${kpis.current_value.toFixed(2)}€`,
      profit: `${isPositive ? '+' : ''}${kpis.profit.toFixed(2)}€`,
      profitPercent: `${isPositive ? '+' : ''}${kpis.profit_percentage.toFixed(2)}%`,
      isPositive,
      liquidity: kpis.liquidity > 0 ? `${kpis.liquidity.toFixed(2)}€` : 'N/A',
      fees: `${kpis.fees.toFixed(2)}€`
    };
  };

  // Create Asset Allocation Chart Data
  const createAssetAllocationData = () => {
    if (!portfolioData?.portfolio_data) return null;

    const labels = [];
    const values = [];
    const assets = [];

    portfolioData.portfolio_data.forEach(asset => {
      if (asset.current_value > 1) { // Solo mostrar assets con valor > 1€
        // DEBUG: Ver qué asset está llegando
        console.log('Asset original:', asset.asset);
        
        // Forzar limpieza si no hay mapeo
        const cleanName = assetLabelMap[asset.asset] || (() => {
          let name = asset.asset
            .replace(/ZEUR$/, '')       // Quitar ZEUR del final PRIMERO
            .replace(/EUR$/, '')        // Quitar EUR del final
            .replace(/USD$/, '')        // Quitar USD del final
            .replace(/\/$/, '');        // Quitar / del final
          
          console.log('Después de limpiar sufijos:', name);
          
          // Casos específicos para assets problemáticos
          if (name === 'XXRP') {
            console.log('XXRP -> XRP');
            return 'XRP';
          }
          if (name === 'XXBT') {
            console.log('XXBT -> BTC');
            return 'BTC';
          }
          if (name === 'XETH') {
            console.log('XETH -> ETH');
            return 'ETH';
          }
          
          // Para otros assets que empiezan con XX, quitar solo una X
          if (name.startsWith('XX') && name.length > 2) {
            const result = name.substring(1);
            console.log(`${name} -> ${result} (quitando una X)`);
            return result;
          }
          
          // Para assets que empiezan con X, quitar la X
          if (name.startsWith('X') && name.length > 1) {
            const result = name.substring(1);
            console.log(`${name} -> ${result} (quitando X)`);
            return result;
          }
          
          // Para assets que empiezan con Z (fiat), quitar la Z
          if (name.startsWith('Z') && name.length > 1) {
            const result = name.substring(1);
            console.log(`${name} -> ${result} (quitando Z)`);
            return result;
          }
          
          console.log('Sin cambios:', name);
          return name;
        })();
        labels.push(cleanName);
        values.push(asset.current_value);
        assets.push(asset.asset);
      }
    });

    // Get theme-appropriate colors for assets
    const colors = assets.map(asset => getThemeAssetColor(asset, isDarkMode));

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 0, // Remove border for cleaner look
        hoverBorderWidth: 3,
        hoverBorderColor: theme.greenPrimary,
        hoverBackgroundColor: colors.map(color => color + 'CC') // Add transparency on hover
      }]
    };
  };

  // Asset Heatmap Component
const AssetHeatmap = ({ portfolioData, theme }) => {
  const MAX_ASSETS_HEATMAP = 20;

  // Process and prepare heatmap data
  const processHeatmapData = () => {
    if (!portfolioData?.portfolio_data) return [];

    // Filter assets with significant value and calculate profit percentage
    const assetsWithProfit = portfolioData.portfolio_data
      .filter(asset => asset.current_value > 0.5) // Filter very small assets
      .map(asset => {
        // Use the correct fields for profit calculation
        let profitPercent = 0;
        
        if (asset.pnl_percent !== undefined) {
          // Use the already calculated pnl_percent from backend
          profitPercent = asset.pnl_percent;
        } else if (asset.total_invested && asset.total_invested > 0) {
          // Fallback calculation if pnl_percent not available
          const totalCost = asset.total_invested + (asset.fees_paid || 0);
          profitPercent = ((asset.current_value - totalCost) / totalCost) * 100;
        }
        
        return {
          ...asset,
          profit_percentage: profitPercent,
          portfolio_percentage: (asset.current_value / portfolioData.kpis.current_value) * 100
        };
      })
      .sort((a, b) => b.current_value - a.current_value);

    // If more than MAX_ASSETS_HEATMAP, group smaller ones
    if (assetsWithProfit.length > MAX_ASSETS_HEATMAP) {
      const topAssets = assetsWithProfit.slice(0, MAX_ASSETS_HEATMAP - 1);
      const remainingAssets = assetsWithProfit.slice(MAX_ASSETS_HEATMAP - 1);
      
      const othersValue = remainingAssets.reduce((sum, asset) => sum + asset.current_value, 0);
      const othersCost = remainingAssets.reduce((sum, asset) => sum + asset.cost, 0);
      const othersProfit = othersCost > 0 ? ((othersValue - othersCost) / othersCost) * 100 : 0;
      
      const othersGroup = {
        asset: 'OTHERS',
        current_value: othersValue,
        cost: othersCost,
        profit_percentage: othersProfit,
        portfolio_percentage: (othersValue / portfolioData.kpis.current_value) * 100,
        count: remainingAssets.length,
        isGroup: true
      };
      
      return [...topAssets, othersGroup];
    }

    return assetsWithProfit;
  };

  // Scientific color scale for performance visualization
  const getHeatmapColor = (profitPercent) => {
    // 1. Range clamping: Cap extremes to prevent outlier distortion
    const clampedPercent = Math.max(-30, Math.min(30, profitPercent));
    
    // 2. Non-linear scaling: More sensitivity around 0%, less at extremes
    const scaledPercent = Math.sign(clampedPercent) * Math.pow(Math.abs(clampedPercent) / 30, 0.7) * 30;
    
    // 3. Color interpolation function
    const interpolateColor = (percent) => {
      if (percent >= 0) {
        // Green progression: neutral to positive (toned down)
        const intensity = percent / 30; // 0 to 1
        const red = Math.floor(110 - (40 * intensity));     // 110 to 70
        const green = Math.floor(130 + (50 * intensity));   // 130 to 180
        const blue = Math.floor(110 - (50 * intensity));    // 110 to 60
        return `rgb(${red}, ${green}, ${blue})`;
      } else {
        // Red progression: neutral to negative
        const intensity = Math.abs(percent) / 30; // 0 to 1
        const red = Math.floor(140 + (80 * intensity));     // 140 to 220
        const green = Math.floor(120 - (80 * intensity));   // 120 to 40
        const blue = Math.floor(120 - (60 * intensity));    // 120 to 60
        return `rgb(${red}, ${green}, ${blue})`;
      }
    };
    
    // 4. Dead zone for near-zero values
    if (Math.abs(profitPercent) < 0.5) {
      return '#78828a'; // Neutral gray for flat performance
    }
    
    return interpolateColor(scaledPercent);
  };

  // Calculate cell size based on portfolio percentage - TRUE proportional area
  const calculateCellSize = (portfolioPercent, totalCells, containerArea = 100000) => {
    // Each asset's area should be exactly its portfolio percentage of total area
    const cellArea = (containerArea * portfolioPercent) / 100;
    const cellSize = Math.sqrt(cellArea);
    
    // Set reasonable bounds but prioritize proportionality (reducido 25%)
    const minSize = 30;
    const maxSize = 225;
    return Math.max(minSize, Math.min(maxSize, cellSize));
  };

  // Clean asset name for display
  const getDisplayName = (asset) => {
    if (asset.isGroup) return `Others (+${asset.count})`;
    
    // Use existing assetLabelMap logic
    const cleanName = assetLabelMap[asset.asset] || (() => {
      let name = asset.asset
        .replace(/ZEUR$/, '')
        .replace(/EUR$/, '')
        .replace(/USD$/, '')
        .replace(/\/$/, '');
      
      if (name === 'XXRP') return 'XRP';
      if (name === 'XXBT') return 'BTC';
      if (name === 'XETH') return 'ETH';
      
      if (name.startsWith('XX') && name.length > 2) return name.substring(1);
      if (name.startsWith('X') && name.length > 1) return name.substring(1);
      if (name.startsWith('Z') && name.length > 1) return name.substring(1);
      
      return name;
    })();
    
    return cleanName;
  };

  const heatmapData = processHeatmapData();

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      padding: '16px',
      justifyContent: 'center',
      alignItems: 'flex-start',
      height: '100%',
      alignContent: 'flex-start'
    }}>
      {heatmapData.map((asset, index) => {
        const cellSize = calculateCellSize(asset.portfolio_percentage, heatmapData.length);
        const displayName = getDisplayName(asset);
        const color = getHeatmapColor(asset.profit_percentage);
        const profitText = `${asset.profit_percentage >= 0 ? '+' : ''}${asset.profit_percentage.toFixed(1)}%`;
        const isSmallCell = cellSize < 60;
        
        return (
          <div
            key={asset.asset + index}
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              backgroundColor: color,
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: `2px solid transparent`,
              position: 'relative',
              overflow: 'hidden',
              padding: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.greenPrimary;
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.zIndex = '10';
              e.currentTarget.style.boxShadow = `0 4px 20px ${color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.zIndex = '1';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title={isSmallCell ? profitText : undefined}
          >
            {!isSmallCell && (
              <>
                <span style={{
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: cellSize > 150 ? '29px' : cellSize > 110 ? '24px' : cellSize > 75 ? '20px' : cellSize > 60 ? '15px' : '12px',
                  fontFamily: "'Inter', sans-serif",
                  textAlign: 'center',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 1px 1px rgba(0, 0, 0, 0.8)',
                  letterSpacing: cellSize > 110 ? '1px' : cellSize > 75 ? '0.5px' : '0px',
                  lineHeight: '0.9',
                  maxWidth: '95%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: cellSize > 110 ? '5px' : '3px'
                }}>
                  {displayName}
                </span>
                
                <span style={{
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: cellSize > 150 ? '18px' : cellSize > 110 ? '15px' : cellSize > 75 ? '12px' : cellSize > 60 ? '11px' : '9px',
                  fontFamily: "'Inter', sans-serif",
                  textAlign: 'center',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 1px rgba(0, 0, 0, 0.9)',
                  opacity: 0.95,
                  letterSpacing: '0.5px'
                }}>
                  {profitText}
                </span>
              </>
            )}
            
            {isSmallCell && (
              <span style={{
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '16px',
                fontFamily: "'Inter', sans-serif",
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 1px rgba(0, 0, 0, 0.9)',
                letterSpacing: '0.5px'
              }}>
                {displayName}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Create Timeline Chart Data with conditional coloring
  const createTimelineData = () => {
    console.log('DEBUG - portfolioData.timeline:', portfolioData?.timeline);
    
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) {
      console.log('DEBUG - No timeline data available');
      return null;
    }

    const timelineData = portfolioData.timeline;
    const labels = timelineData.map(entry => {
      const date = new Date(entry.date);
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit',
        year: '2-digit'
      });
    });

    const investedValues = timelineData.map(entry => entry.cost || 0);
    const portfolioValues = timelineData.map(entry => entry.value || 0);

    // Create point colors based on profit/loss at each point
    const pointColors = portfolioValues.map((value, index) => {
      const invested = investedValues[index] || 0;
      return value >= invested ? '#22c55e' : '#ef4444'; // Green if profit, red if loss
    });

    return {
      labels,
      datasets: [
        {
          label: 'Total Invertido',
          data: investedValues,
          borderColor: theme.textSecondary,
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.3,
          pointRadius: 1.5,
          pointHoverRadius: 4,
          pointBackgroundColor: theme.textSecondary,
          pointBorderColor: theme.bg,
          pointBorderWidth: 2,
          borderDash: [5, 5],
          borderWidth: 2
        },
        {
          label: 'Valor del Portfolio',
          data: portfolioValues,
          borderColor: function(context) {
            // Dynamic border color based on overall trend
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return '#22c55e';
            
            // Check if most recent value is profit or loss
            const lastValue = portfolioValues[portfolioValues.length - 1];
            const lastInvested = investedValues[investedValues.length - 1] || 0;
            return lastValue >= lastInvested ? '#22c55e' : '#ef4444';
          },
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: pointColors,
          pointBorderColor: theme.bg,
          pointBorderWidth: 2,
          borderWidth: 3,
          segment: {
            borderColor: function(ctx) {
              // Color each segment based on the starting point's profit/loss
              const startIndex = ctx.p0DataIndex;
              const startValue = portfolioValues[startIndex];
              const startInvested = investedValues[startIndex] || 0;
              return startValue >= startInvested ? '#22c55e' : '#ef4444';
            }
          }
        }
      ]
    };
  };

  // Timeline Chart options
  const timelineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.textSecondary,
          font: {
            size: 13,
            family: "'Inter', sans-serif"
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: theme.bgContainer,
        titleColor: theme.textPrimary,
        bodyColor: theme.textSecondary,
        borderColor: theme.border,
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: {
          size: 14,
          family: "'Inter', sans-serif"
        },
        bodyFont: {
          size: 13,
          family: "'Inter', sans-serif"
        },
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: €${Math.round(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: theme.textSecondary,
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          maxTicksLimit: 8 // Limitar número de labels para evitar solapamiento
        },
        grid: {
          display: false
        }
      },
      y: {
        ticks: {
          color: theme.textSecondary,
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          callback: function(value) {
            return '€' + Math.round(value);
          }
        },
        grid: {
          color: theme.border + '40',
          lineWidth: 1
        }
      }
    },
    elements: {
      line: {
        borderWidth: 3
      },
      point: {
        hoverBorderWidth: 3
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.textSecondary,
          padding: 20,
          font: {
            size: 14,
            family: "'Inter', sans-serif"
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: theme.bgContainer,
        titleColor: theme.textPrimary,
        bodyColor: theme.textSecondary,
        borderColor: theme.border,
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: {
          size: 14,
          family: "'Inter', sans-serif",
          weight: 'bold'
        },
        bodyFont: {
          size: 13,
          family: "'Inter', sans-serif",
          weight: 'bold'
        },
        displayColors: false, // Remove legend colors
        callbacks: {
          title: function(context) {
            return context[0].label; // Show asset name as title
          },
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `€${Math.round(context.parsed)} (${percentage}%)`;
          }
        }
      },
      centerText: {
        symbol: '€'
      }
    },
    cutout: '60%', // Increased cutout to give more space for center text
    elements: {
      arc: {
        borderWidth: 0
      }
    }
  };

  const kpiData = getKPIData();
  const assetAllocationData = createAssetAllocationData();
  const timelineData = createTimelineData();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <ThemeToggle isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
        <BackgroundPattern isDark={isDarkMode} />
        <div style={{
          textAlign: 'center',
          color: theme.textSecondary
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${theme.greenPrimary}`,
            borderRadius: '50%',
            borderTopColor: 'transparent',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }} />
          <p>Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      padding: sidebarOpen ? 'clamp(13.2px, 3.3vw, 19.8px) clamp(13.2px, 3.3vw, 19.8px) clamp(13.2px, 3.3vw, 19.8px) 420px' : 'clamp(13.2px, 3.3vw, 19.8px)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <ThemeToggle isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
      <BackgroundPattern isDark={isDarkMode} />
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        theme={theme}
        portfolioData={portfolioData}
      />

      {/* Lateral Tab Trigger */}
      <div 
        style={{
          position: 'fixed',
          left: sidebarOpen ? '21.875rem' : '0',
          top: 'clamp(5.5rem, 13.2vw, 8.25rem)',
          transform: 'translateY(-50%)',
          zIndex: 997,
          display: 'flex',
          alignItems: 'center',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <button
          ref={tabButtonRef}
          onClick={(e) => {
            setSidebarOpen(!sidebarOpen);
            setShowTabPulse(false);
            
            // Force reset styles immediately when clicking
            e.target.style.background = theme.bgElevated;
            e.target.style.borderColor = theme.border;
            e.target.style.color = theme.textSecondary;
            e.target.style.transform = 'translateX(0)';
            e.target.style.boxShadow = '0.125rem 0 0.5rem rgba(0, 0, 0, 0.1)';
            
            // Temporarily disable hover to prevent glow persistence
            setIsTabHoverDisabled(true);
            setTimeout(() => {
              setIsTabHoverDisabled(false);
            }, 100);
          }}
          style={{
            background: theme.bgElevated,
            border: `1px solid ${theme.border}`,
            borderLeft: 'none',
            borderRadius: '0 0.75rem 0.75rem 0',
            padding: '1rem 0.75rem',
            color: theme.textSecondary,
            fontSize: 'clamp(0.825rem, 2.75vw, 0.9625rem)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: showTabPulse ? '0.25rem 0 1rem rgba(0, 255, 136, 0.2)' : '0.125rem 0 0.5rem rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'clamp(4.4rem, 11vw, 5.5rem)',
            minWidth: 'clamp(2.2rem, 5.5vw, 2.8875rem)',
            position: 'relative',
            animation: showTabPulse ? 'tabPulse 2s ease-in-out' : 'none',
            left: '-0.375rem'
          }}
          onMouseEnter={(e) => {
            if (!isTabHoverDisabled) {
              e.target.style.background = theme.bgContainer;
              e.target.style.borderColor = theme.greenPrimary;
              e.target.style.color = theme.textPrimary;
              e.target.style.transform = 'translateX(0.375rem)';
              e.target.style.boxShadow = '0 -0.75rem 0.75rem rgba(0, 255, 136, 0.2), 0 0.75rem 0.75rem rgba(0, 255, 136, 0.2), 0.375rem 0 0.75rem rgba(0, 255, 136, 0.2)';
            }
            setShowTabPulse(false);
          }}
          onMouseLeave={(e) => {
            e.target.style.background = theme.bgElevated;
            e.target.style.borderColor = theme.border;
            e.target.style.color = theme.textSecondary;
            e.target.style.transform = 'translateX(0)';
            e.target.style.boxShadow = '0.125rem 0 0.5rem rgba(0, 0, 0, 0.1)';
          }}
          title="Open Filters & Analytics Panel (Press 'F')"
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            position: 'relative'
          }}>
            <div style={{
              fontSize: 'clamp(0.6875rem, 2.2vw, 0.75625rem)',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              letterSpacing: '0.125rem',
              fontWeight: '700',
              textTransform: 'uppercase'
            }}>OPTIONS</div>
            <div style={{
              fontSize: 'clamp(0.825rem, 2.75vw, 0.9625rem)',
              lineHeight: '1',
              transform: sidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}>▶</div>
            {/* Active filters badge */}
            {activeFilters > 0 && (
              <div style={{
                position: 'absolute',
                top: '-0.375rem',
                right: '-0.375rem',
                background: theme.greenPrimary,
                color: theme.bg,
                borderRadius: '50%',
                width: '1.125rem',
                height: '1.125rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(0.6875rem, 2.2vw, 0.75625rem)',
                fontWeight: '700'
              }}>
                {activeFilters}
              </div>
            )}
          </div>
        </button>
      </div>
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        paddingTop: 'clamp(1.1rem, 3.3vw, 2.2rem)'
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '26px',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0px',
            marginBottom: '10px',
          }}>
            <ZigzagLogo size={62} color={theme.greenPrimary} sloganGlow={false} isDarkMode={isDarkMode} />
            <h1 style={{
              fontSize: 'clamp(24.2px, 6.05vw, 30.8px)',
              fontWeight: '700',
              color: theme.textPrimary,
              margin: '0',
              marginTop: '-20px',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '-0.02em',
              transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              lineHeight: '1'
            }}>
              Portfolio Overview
            </h1>
          </div>
          
          <p style={{
            color: theme.textSecondary,
            fontSize: 'clamp(12.1px, 2.75vw, 13.2px)',
            margin: '0',
            fontWeight: '500',
            lineHeight: '1.5',
            transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.01em'
          }}>
            Complete overview of your portfolio performance
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '40px',
            color: '#ef4444'
          }}>
            <p style={{ margin: '0' }}>⚠️ {error}</p>
          </div>
        )}

        {/* Back Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          marginBottom: '24px'
        }}>
          <button
            onClick={onBack || (() => window.location.reload())}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              padding: '8px 12px',
              color: theme.textSecondary,
              fontSize: 'clamp(0.825rem, 2.75vw, 0.9625rem)',
              fontWeight: '500',
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = theme.greenPrimary;
              e.target.style.color = theme.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = theme.border;
              e.target.style.color = theme.textSecondary;
            }}
          >
            ← Back to Form
          </button>
        </div>

        {/* KPI Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'clamp(0.825rem, 2.75vw, 1.375rem)',
          marginBottom: 'clamp(1.375rem, 4.4vw, 2.2rem)',
          justifyContent: 'center'
        }}>
          <KPICard
            label="Portfolio Value"
            value={kpiData.currentValue}
            theme={theme}
          />
          
          <KPICard
            label="Total Invested"
            value={kpiData.totalInvested}
            theme={theme}
          />
          
          <KPICard
            label="Net Profit"
            value={kpiData.profit}
            changePercent={kpiData.profitPercent}
            isPositive={kpiData.isPositive}
            theme={theme}
            showChange={true}
          />
          
          <KPICard
            label="Liquidity"
            value={kpiData.liquidity}
            theme={theme}
          />
          
          <KPICard
            label="Total Fees"
            value={kpiData.fees}
            theme={theme}
          />
        </div>

        {/* Charts Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2px',
          marginBottom: 'clamp(1.375rem, 4.4vw, 2.2rem)'
        }}>
          {/* Asset Allocation Chart */}
          {assetAllocationData && (
            <div style={{
              height: "300px",
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}>
              <h3 style={{
                color: theme.textPrimary,
                fontSize: 'clamp(22px, 5.5vw, 28px)',
                fontWeight: '700',
                margin: '0 0 16px 0',
                textAlign: 'center',
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '-0.01em'
              }}>
                Asset Allocation
              </h3>
              <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <Doughnut 
                  data={assetAllocationData} 
                  options={doughnutOptions}
                  plugins={[centerTextPlugin]}
                />
              </div>
            </div>
          )}

          {/* Asset Performance Heatmap */}
          <div style={{
            height: "400px",
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            <h3 style={{
              color: theme.textPrimary,
              fontSize: 'clamp(22px, 5.5vw, 28px)',
              fontWeight: '700',
              margin: '0 0 16px 0',
              textAlign: 'center',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '-0.01em'
            }}>
              Performance Heatmap
            </h3>
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <AssetHeatmap portfolioData={portfolioData} theme={theme} />
            </div>
          </div>
        </div>

        {/* Portfolio Timeline Chart - Full width below */}
        <div style={{
          height: "400px",
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          marginBottom: 'clamp(1.375rem, 4.4vw, 2.2rem)',
          border: '1px solid red' // DEBUG: Para ver si el contenedor existe
        }}>
          <h3 style={{
            color: theme.textPrimary,
            fontSize: 'clamp(22px, 5.5vw, 28px)',
            fontWeight: '700',
            margin: '0 0 16px 0',
            textAlign: 'center',
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '-0.01em'
          }}>
            Evolución del Portfolio
          </h3>
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {timelineData ? (
              <Line data={timelineData} options={timelineOptions} />
            ) : (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                color: theme.textSecondary,
                fontSize: '16px'
              }}>
                No timeline data available (portfolioData.timeline: {portfolioData?.timeline ? `exists with ${portfolioData.timeline.length} entries` : 'missing'})
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '60px',
          paddingTop: '40px',
          borderTop: `1px solid ${theme.border}`,
          color: theme.textMuted,
          fontSize: '14px'
        }}>
          <p style={{ margin: '0' }}>
            Data updated in real-time • Powered by Kraken API
          </p>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;