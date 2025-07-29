import { useState, useEffect, useRef } from 'react';

// Zigzag Logo Component (reutilizado del original)
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

// Background Pattern Component - Estático con difuminado amplio
const BackgroundPattern = ({ isDark }) => {
  // Generate consistent lines like in form but static - más líneas para cuadriculas más pequeñas
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
          {/* Vertical Lines */}
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
          {/* Horizontal Lines */}
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
      
      {/* Difuminado radial más amplio hacia el centro */}
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
    </>
  );
};

// KPI Card Component
const KPICard = ({ label, value, change, changePercent, isPositive, theme, showChange = false, tooltip = null }) => {
  return (
    <div 
      style={{
        background: theme.bgElevated,
        border: `1px solid ${theme.border}`,
        borderRadius: '10px',
        padding: '1.25rem',
        textAlign: 'center',
        width: '180px',
        height: '140px',
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
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
        
        // Make label white and bold
        const label = e.currentTarget.querySelector('[data-kpi-label]');
        if (label) {
          label.style.color = '#ffffff';
          label.style.fontWeight = '700';
          label.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.3)';
        }
        
        // Show tooltip if present
        if (tooltip) {
          const tooltipEl = e.currentTarget.querySelector('.kpi-tooltip');
          if (tooltipEl) {
            tooltipEl.style.opacity = '1';
          }
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.borderColor = theme.border;
        e.currentTarget.style.boxShadow = theme.bg === '#000000' ? 'none' : '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)';
        e.currentTarget.style.background = theme.bgElevated;
        
        // Reset label styling
        const label = e.currentTarget.querySelector('[data-kpi-label]');
        if (label) {
          label.style.color = '#ffffff';
          label.style.fontWeight = '700';
          label.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.3)';
        }
        
        // Hide tooltip if present
        if (tooltip) {
          const tooltipEl = e.currentTarget.querySelector('.kpi-tooltip');
          if (tooltipEl) {
            tooltipEl.style.opacity = '0';
          }
        }
      }}
    >
      {/* Label */}
      <div 
        data-kpi-label
        style={{
          color: '#ff0000',
          fontSize: '0.875rem',
          fontWeight: '700',
          marginBottom: '0.5rem',
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
          width: '100%'
        }}
      >
        {label}
      </div>

      {/* Value */}
      <div style={{
        color: showChange ? 
          (parseFloat(changePercent) === 0 ? theme.textMuted : (isPositive ? theme.greenPrimary : '#ef4444')) 
          : theme.textPrimary,
        fontSize: '1.5rem',
        fontWeight: '700',
        fontFamily: "'Space Grotesk', sans-serif",
        letterSpacing: '-0.01em',
        lineHeight: '1.2',
        marginBottom: showChange ? '6px' : '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
        minHeight: '2rem'
      }}>
        {value}
      </div>

      {/* Change */}
      {showChange && changePercent && (
        <div style={{
          color: parseFloat(changePercent) === 0 ? theme.textMuted : (isPositive ? theme.greenPrimary : '#ef4444'),
          fontSize: '0.875rem',
          fontWeight: '600',
          fontFamily: "'Inter', sans-serif",
          marginBottom: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%'
        }}>
          {parseFloat(changePercent) === 0 ? '0%' : changePercent}
        </div>
      )}

      {/* Tooltip for Net Profit */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: theme.bgContainer,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '0.8rem',
          color: theme.textPrimary,
          fontFamily: "'Inter', sans-serif",
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          opacity: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease',
          marginTop: '8px'
        }}
        className="kpi-tooltip"
      >
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Profit Breakdown:</div>
        <div>Realized: {tooltip.realizedGains} ({tooltip.realizedPercent})</div>
        <div>Unrealized: {tooltip.unrealizedGains} ({tooltip.unrealizedPercent})</div>
      </div>
      )}
    </div>
  );
};

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
    { id: 'filters', label: 'Filters', icon: '' },
    { id: 'analysis', label: 'Analysis', icon: '' },
    { id: 'settings', label: 'Settings', icon: '' }
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

// Main Component
const GainTrackKPIs = ({ portfolioData, isLoading = false, error = null, onBack = null }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sloganGlow, setSloganGlow] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTabPulse, setShowTabPulse] = useState(true);
  const [activeFilters, setActiveFilters] = useState(0);
  const tabButtonRef = useRef(null);
  const [isTabHoverDisabled, setIsTabHoverDisabled] = useState(false);

  // Hide pulse after 8 seconds (more subtle)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTabPulse(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setSidebarOpen(true);
        setShowTabPulse(false);
      }
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Colores de tema
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

  // Reset tab button styles when sidebar state changes (but not if user is hovering)
  useEffect(() => {
    if (tabButtonRef.current) {
      const button = tabButtonRef.current;
      // Only reset if not currently being hovered and hover is not disabled
      if (!button.matches(':hover') || isTabHoverDisabled) {
        button.style.background = theme.bgElevated;
        button.style.borderColor = theme.border;
        button.style.color = theme.textSecondary;
        button.style.transform = 'translateX(0)';
        button.style.boxShadow = '2px 0 8px rgba(0, 0, 0, 0.1)';
        
        // Remove any extension and blocker elements
        const extension = button.querySelector('.tab-extension');
        if (extension) {
          extension.remove();
        }
        const blocker = button.querySelector('.glow-blocker');
        if (blocker) {
          blocker.remove();
        }
      }
    }
  }, [sidebarOpen, theme, isTabHoverDisabled]);

  // Efecto glow del slogan sincronizado con el logo - DESHABILITADO
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setSloganGlow(true);
  //     setTimeout(() => setSloganGlow(false), 2700);
  //   }, 12900);
  //   return () => clearInterval(interval);
  // }, []);

  // Estilos CSS para animaciones
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes letterGlow {
        0% {
          text-shadow: 0 0 0px #00ff88;
          transform: scale(1) translateY(0);
        }
        30% {
          text-shadow: 0 0 5px #00ff88, 0 0 10px #00ff88, 0 0 15px #00ff88;
          transform: scale(1.05) translateY(-1px);
        }
        100% {
          text-shadow: 0 0 0px #00ff88;
          transform: scale(1) translateY(0);
        }
      }
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .fade-in-up {
        animation: fadeInUp 0.6s ease-out;
      }
      @keyframes pulse {
        0% { opacity: 0.4; }
        50% { opacity: 0.8; }
        100% { opacity: 0.4; }
      }
      .pulse {
        animation: pulse 2s infinite;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes tabPulse {
        0% { 
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1); 
          border-color: ${theme.border};
        }
        50% { 
          box-shadow: 3px 0 12px rgba(0, 255, 136, 0.15); 
          border-color: rgba(0, 255, 136, 0.3);
        }
        100% { 
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1); 
          border-color: ${theme.border};
        }
      }
      @keyframes slideInRight {
        from {
          transform: translateX(-100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutLeft {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(-100%);
          opacity: 0;
        }
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes zoomIn {
        from {
          transform: scale(1);
          opacity: 0;
        }
        to {
          transform: scale(1.4);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Procesar datos de KPIs
  const getKPIData = () => {
    if (!portfolioData?.kpis) {
      return {
        totalInvested: '0.00€',
        currentValue: '0.00€',
        profit: '0.00€',
        profitPercent: '0.00%',
        isPositive: false,
        liquidity: '0.00€',
        fees: '0.00€',
        realizedGains: '0.00€',
        realizedIsPositive: false,
        unrealizedGains: '0.00€',
        unrealizedPercent: '0.00%',
        unrealizedIsPositive: false,
        tooltip: null
      };
    }

    const kpis = portfolioData.kpis;
    const isPositive = kpis.profit >= 0;
    
    // Nuevos KPIs mejorados
    const realizedGains = kpis.realized_gains || 0;
    const unrealizedGains = kpis.unrealized_gains || 0;
    const unrealizedPercentage = kpis.unrealized_percentage || 0;
    const totalProfit = Math.abs(kpis.profit) || 0;
    
    const realizedIsPositive = realizedGains >= 0;
    const unrealizedIsPositive = unrealizedGains >= 0;

    // Calcular porcentajes para el tooltip
    const realizedPercentage = kpis.total_invested > 0 ? (realizedGains / kpis.total_invested) * 100 : 0;
    const realizedPercentText = `${realizedIsPositive ? '+' : ''}${realizedPercentage.toFixed(2)}%`;
    const unrealizedPercentText = `${unrealizedIsPositive ? '+' : ''}${unrealizedPercentage.toFixed(2)}%`;

    // Preparar tooltip para Net Profit
    const tooltip = {
      realizedGains: `${realizedIsPositive ? '+' : ''}${realizedGains.toFixed(2)}€`,
      realizedPercent: realizedPercentText,
      unrealizedGains: `${unrealizedIsPositive ? '+' : ''}${unrealizedGains.toFixed(2)}€`,
      unrealizedPercent: unrealizedPercentText
    };

    return {
      totalInvested: `${kpis.total_invested.toFixed(2)}€`,
      currentValue: `${kpis.current_value.toFixed(2)}€`,
      profit: `${isPositive ? '+' : ''}${kpis.profit.toFixed(2)}€`,
      profitPercent: `${isPositive ? '+' : ''}${kpis.profit_percentage.toFixed(2)}%`,
      isPositive,
      liquidity: kpis.liquidity > 0 ? `${kpis.liquidity.toFixed(2)}€` : 'N/A',
      fees: `${kpis.fees.toFixed(2)}€`,
      // Nuevos KPIs
      realizedGains: `${realizedIsPositive ? '+' : ''}${realizedGains.toFixed(2)}€`,
      realizedIsPositive,
      unrealizedGains: `${unrealizedIsPositive ? '+' : ''}${unrealizedGains.toFixed(2)}€`,
      unrealizedPercent: `${unrealizedIsPositive ? '+' : ''}${unrealizedPercentage.toFixed(2)}%`,
      unrealizedIsPositive,
      tooltip
    };
  };

  const kpiData = getKPIData();

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
        <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} />
        <BackgroundPattern isDark={isDarkMode} />
        <div style={{
          textAlign: 'center',
          color: theme.textSecondary
        }}>
          <div className="pulse" style={{
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
      padding: 'clamp(13.2px, 3.3vw, 19.8px)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} />
      <BackgroundPattern isDark={isDarkMode} />
      
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
            
            // Remove extension and blocker
            const extension = e.target.querySelector('.tab-extension');
            if (extension) {
              extension.remove();
            }
            const blocker = e.target.querySelector('.glow-blocker');
            if (blocker) {
              blocker.remove();
            }
            
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
            // Only apply hover styles if not temporarily disabled
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
            // Always reset styles on mouse leave, regardless of sidebar state
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
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        theme={theme} 
        portfolioData={portfolioData}
      />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        paddingTop: 'clamp(1.1rem, 3.3vw, 2.2rem)',
        paddingLeft: sidebarOpen ? 'clamp(2.2rem, 6.6vw, 4.4rem)' : '0',
        paddingRight: 'clamp(0.825rem, 2.75vw, 1.375rem)',
        transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '26px',
        }}>
          {/* Logo */}
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
              GainTrack
            </h1>
          </div>
          
          {/* Subtitle */}
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
            Track your portfolio performance
            <br />
            <span style={{ 
              color: theme.greenPrimary, 
              fontWeight: '600',
              display: 'inline-block',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              Simple. Secure. Precise.
            </span>
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="fade-in-up" style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '40px',
            color: '#ef4444'
          }}>
            <p style={{ margin: '0' }}>{error}</p>
          </div>
        )}


        {/* Controls Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Back Button */}
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

          {/* Spacer for layout */}
          <div></div>
        </div>

        {/* KPI Row Principal */}
        <div className="fade-in-up" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '1.5rem',
          justifyContent: 'center',
          alignItems: 'stretch'
        }}>
          <KPICard
            label="Portfolio Value TEST"
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
            tooltip={kpiData.tooltip}
          />
          
          <KPICard
            label="Total Fees"
            value={kpiData.fees}
            theme={theme}
          />
          
          <KPICard
            label="Liquidity"
            value={kpiData.liquidity}
            theme={theme}
          />
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

export default GainTrackKPIs;