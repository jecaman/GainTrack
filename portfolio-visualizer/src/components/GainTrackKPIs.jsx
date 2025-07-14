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
const KPICard = ({ label, value, change, changePercent, isPositive, theme, showChange = false }) => (
  <div style={{
    background: theme.bgElevated,
    border: `1px solid ${theme.border}`,
    borderRadius: '10px',
    padding: '16px',
    textAlign: 'center',
    minWidth: '140px',
    flex: '1',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ...(theme.bg === '#000000' ? {} : {
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)'
    }),
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
    e.currentTarget.style.borderColor = theme.greenPrimary;
    e.currentTarget.style.boxShadow = isDarkMode 
      ? '0 10px 30px rgba(0, 255, 136, 0.2), 0 0 25px rgba(0, 255, 136, 0.15), inset 0 0 15px rgba(0, 255, 136, 0.05)' 
      : '0 10px 30px rgba(16, 185, 129, 0.2), 0 0 25px rgba(16, 185, 129, 0.15), inset 0 0 15px rgba(16, 185, 129, 0.05)';
    e.currentTarget.style.background = isDarkMode ? '#1a1a1a' : '#ffffff';
    
    // Make label white and bold
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
    
    // Reset label styling
    const label = e.currentTarget.querySelector('[data-kpi-label]');
    if (label) {
      label.style.color = theme.textSecondary;
      label.style.fontWeight = '600';
      label.style.textShadow = 'none';
    }
  }}
  >
    {/* Label */}
    <div 
      data-kpi-label
      style={{
        color: theme.textSecondary,
        fontSize: '12px',
        fontWeight: '600',
        marginBottom: '8px',
        fontFamily: "'Inter', sans-serif",
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {label}
    </div>

    {/* Value */}
    <div style={{
      color: showChange ? 
        (parseFloat(changePercent) === 0 ? theme.textMuted : (isPositive ? theme.greenPrimary : '#ef4444')) 
        : theme.textPrimary,
      fontSize: '20px',
      fontWeight: '700',
      fontFamily: "'Space Grotesk', sans-serif",
      letterSpacing: '-0.01em',
      lineHeight: '1.2',
      marginBottom: showChange ? '4px' : '0'
    }}>
      {value}
    </div>

    {/* Change */}
    {showChange && changePercent && (
      <div style={{
        color: parseFloat(changePercent) === 0 ? theme.textMuted : (isPositive ? theme.greenPrimary : '#ef4444'),
        fontSize: '11px',
        fontWeight: '600',
        fontFamily: "'Inter', sans-serif"
      }}>
        {parseFloat(changePercent) === 0 ? '0%' : changePercent}
      </div>
    )}
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
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: isOpen ? 'slideInRight 0.3s ease-out' : 'none'
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
                fontSize: '12px',
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
                  fontSize: '14px',
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
                      fontSize: '12px'
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
                      fontSize: '12px'
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
                  fontSize: '14px',
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
                        fontSize: '12px',
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
                <div style={{ fontSize: '12px', color: theme.textSecondary }}>
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
                  fontSize: '14px',
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
                        fontSize: '12px',
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
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

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
      liquidity: `${kpis.liquidity.toFixed(2)}€`,
      fees: `${kpis.fees.toFixed(2)}€`
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
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} />
      <BackgroundPattern isDark={isDarkMode} />
      
      {/* Lateral Tab Trigger */}
      <div 
        style={{
          position: 'fixed',
          left: sidebarOpen ? '350px' : '0',
          top: '120px',
          transform: 'translateY(-50%)',
          zIndex: 997,
          display: 'flex',
          alignItems: 'center',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <button
          onClick={() => {
            setSidebarOpen(!sidebarOpen);
            setShowTabPulse(false);
          }}
          style={{
            background: theme.bgElevated,
            border: `1px solid ${theme.border}`,
            borderLeft: 'none',
            borderRadius: '0 12px 12px 0',
            padding: '16px 12px',
            color: theme.textSecondary,
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: showTabPulse ? '4px 0 16px rgba(0, 255, 136, 0.2)' : '2px 0 8px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80px',
            minWidth: '36px',
            position: 'relative',
            animation: showTabPulse ? 'tabPulse 2s ease-in-out' : 'none'
          }}
          onMouseEnter={(e) => {
            if (!sidebarOpen) {
              e.target.style.background = theme.bgContainer;
              e.target.style.borderColor = theme.greenPrimary;
              e.target.style.color = theme.textPrimary;
              e.target.style.transform = 'translateX(6px)';
              e.target.style.boxShadow = '6px 0 20px rgba(0, 255, 136, 0.25)';
            }
            setShowTabPulse(false);
          }}
          onMouseLeave={(e) => {
            if (!sidebarOpen) {
              e.target.style.background = theme.bgElevated;
              e.target.style.borderColor = theme.border;
              e.target.style.color = theme.textSecondary;
              e.target.style.transform = 'translateX(0)';
              e.target.style.boxShadow = '2px 0 8px rgba(0, 0, 0, 0.1)';
            }
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
              fontSize: '11px',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              letterSpacing: '2px',
              fontWeight: '700',
              textTransform: 'uppercase'
            }}>OPTIONS</div>
            <div style={{
              fontSize: '14px',
              lineHeight: '1',
              transform: sidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}>▶</div>
            {/* Active filters badge */}
            {activeFilters > 0 && (
              <div style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: theme.greenPrimary,
                color: theme.bg,
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
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
        paddingTop: '40px',
        paddingLeft: sidebarOpen ? '80px' : '0',
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
            gap: '-6px',
            marginBottom: '20px',
          }}>
            <ZigzagLogo size={52} color={theme.greenPrimary} sloganGlow={false} isDarkMode={isDarkMode} />
            <h1 style={{
              fontSize: 'clamp(26px, 6.5vw, 32px)',
              fontWeight: '700',
              color: theme.textPrimary,
              margin: '0',
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
            fontSize: 'clamp(12px, 2.9vw, 13px)',
            margin: '0',
            fontWeight: '500',
            lineHeight: '1.5',
            transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.01em'
          }}>
            Real-time portfolio analytics
            <br />
            <span style={{ 
              color: theme.greenPrimary, 
              fontWeight: '600',
              display: 'inline-block',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              Clear insights. Smart decisions.
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
            <p style={{ margin: '0' }}>⚠️ {error}</p>
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
              fontSize: '14px',
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

        {/* KPI Row */}
        <div className="fade-in-up" style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '40px',
          flexWrap: 'wrap',
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