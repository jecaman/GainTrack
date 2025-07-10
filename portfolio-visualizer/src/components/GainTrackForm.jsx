import { useState, useEffect, useRef } from 'react';

// Zigzag Logo Component with Moving Bright Point
// Puedes controlar la frecuencia (cada cuánto aparece el punto) con "intervaloFrecuenciaMs"
// y la velocidad (cuánto tarda en recorrer el zigzag) con "duracionAnimacionMs"
const ZigzagLogo = ({
  size = 32,
  color = "#00ff88",
  sloganGlow = false,
  isDarkMode = true
}) => {
  const [visible, setVisible] = useState(false);
  const [fade, setFade] = useState(false); // Nuevo estado para controlar el fade
  const timeoutRef = useRef(null);
  const fadeTimeoutRef = useRef(null);

  // Sincronizar con el estado del slogan
  useEffect(() => {
    if (sloganGlow) {
      setVisible(true);
      setFade(false);
      // Logo debe completar su recorrido en 2 segundos y luego fade por 0.4 segundos
      const timer = setTimeout(() => {
        setFade(true);
        setTimeout(() => setVisible(false), 400); // Fade out de 0.4 segundos
      }, 2000); // 2 segundos para completar el recorrido completo

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      setFade(false);
    }
  }, [sloganGlow]);

  // El path del zigzag para la animación (coincide con el SVG)
  const path = [
    { x: 2, y: 16 },
    { x: 8, y: 6 },
    { x: 14, y: 12 },
    { x: 20, y: 4 },
    { x: 26, y: 10 },
    { x: 30, y: 2 }
  ];

  // Calcula la posición del punto a lo largo del path según el progreso de la animación
  const getPointPosition = (progress) => {
    // progress: 0 (inicio) a 1 (fin)
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
    // Si por alguna razón no se encuentra, retorna el último punto
    return path[path.length - 1];
  };

  // Estado para animar el punto a lo largo del path
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
      let p = Math.min(elapsed / 2000, 1); // 2 segundos para recorrer el path completo
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

  // Calcula la posición del punto
  const punto = getPointPosition(progress);

  // Ajuste: el punto estaba ligeramente más abajo de lo que debería.
  // Para corregirlo, restamos un pequeño valor al cálculo de la posición top.
  // Por ejemplo, restamos 1.5px para subirlo un poco.
  const ajusteVerticalPx = 1.5;

  return (
    <div style={{ 
      position: 'relative', 
      display: 'inline-block',
      transform: sloganGlow && !isDarkMode ? 'scale(1.2)' : 'scale(1)',
      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <svg width={size} height={size * 0.6} viewBox="0 0 32 20" fill="none">
        {/* Base logo */}
        <path
          d="M2 16L8 6L14 12L20 4L26 10L30 2"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Moving bright point - only in dark mode */}
      {visible && isDarkMode && (
        <div
          style={{
            position: 'absolute',
            left: `calc(${(punto.x / 32) * 100}% - 4px)`,
            // Ajuste vertical: restamos 1.5px para subir el punto
            top: `calc(${(punto.y / 20) * 100}% - 4px - ${ajusteVerticalPx}px)`,
            width: '8px',
            height: '8px',
            background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 30%, rgba(0,255,136,0.7) 60%, rgba(0,255,136,0.3) 80%, transparent 100%)',
            borderRadius: '50%',
            filter: 'blur(3px) drop-shadow(0 0 20px #00ff88) drop-shadow(0 0 40px rgba(0,255,136,1)) drop-shadow(0 0 60px rgba(255,255,255,0.8)) drop-shadow(0 0 80px rgba(0,255,136,0.6))',
            opacity: fade ? 0 : 1,
            transition: fade
              ? 'opacity 0.4s cubic-bezier(0.4,0,0.2,1)'
              : 'opacity 0.15s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 10,
            boxShadow: '0 0 15px rgba(0,255,136,0.8), inset 0 0 10px rgba(255,255,255,0.5)',
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
};


// Theme Toggle Button Component  
const ThemeToggle = ({ isDark, onToggle }) => (
  <div style={{
    position: 'fixed',
    top: 'clamp(14px, 3.6vw, 18px)',
    right: 'clamp(14px, 3.6vw, 18px)',
    zIndex: 100
  }}>
    <button
      onClick={onToggle}
      style={{
        width: 'clamp(58px, 13.5vw, 65px)',
        height: 'clamp(32px, 7.2vw, 36px)',
        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
        borderRadius: 'clamp(18px, 4.5vw, 20px)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        backdropFilter: 'blur(8px)'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
        e.target.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        e.target.style.transform = 'scale(1)';
      }}
    >
      {/* Toggle circle */}
      <div style={{
        width: 'clamp(25px, 5.4vw, 29px)',
        height: 'clamp(25px, 5.4vw, 29px)',
        background: isDark ? '#6b7280' : '#4b5563',
        borderRadius: '50%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isDark ? 'translateX(0)' : 'translateX(29px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'clamp(11px, 2.7vw, 13px)',
        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
      }}>
        {isDark ? '🌙' : '☀️'}
      </div>
    </button>
  </div>
);

// Background Grid Component with Dynamic Effects
const BackgroundPattern = ({ isDark = true }) => {
  // Generate consistent random values that don't change on re-renders
  const verticalLines = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    duration: 4 + (Math.sin(i * 0.1) + 1) * 1, // Consistent pseudo-random based on index
    delay: (Math.sin(i * 0.3) + 1) * 1.5 // Consistent pseudo-random based on index
  }));
  
  const horizontalLines = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    duration: 4 + (Math.cos(i * 0.15) + 1) * 1,
    delay: (Math.cos(i * 0.25) + 1) * 1.5
  }));

  return (
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
    {/* Enhanced Grid Layer */}
    <div style={{ 
      opacity: 0.08,
      transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Vertical Lines */}
      {verticalLines.map((line) => (
        <div
          key={`vertical-${line.id}`}
          style={{
            position: 'absolute',
            left: `${line.id * 4}%`,
            top: 0,
            width: '1px',
            height: '100%',
            background: `linear-gradient(180deg, transparent, ${isDark ? '#00ff88' : '#2d3748'}, transparent)`,
            animation: `gridFlow ${line.duration}s ease-in-out infinite`,
            animationDelay: `${line.delay}s`,
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
            top: `${line.id * 5}%`,
            left: 0,
            width: '100%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${isDark ? '#00ff88' : '#2d3748'}, transparent)`,
            animation: `gridFlow ${line.duration}s ease-in-out infinite`,
            animationDelay: `${line.delay}s`,
            transition: 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      ))}
    </div>
    
  </div>
  );
};

const GainTrackForm = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState({
    apiKey: '',
    secretKey: ''
  });
  const [activeMethod, setActiveMethod] = useState('api');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sloganGlow, setSloganGlow] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'))) {
      console.log('CSV file selected:', file.name);
      // CSV processing logic would go here
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Efecto glow del slogan sincronizado con el logo
  useEffect(() => {
    // Sincronizar ambos efectos perfectamente
    const interval = setInterval(() => {
      setSloganGlow(true);
      // Duración total para que todas las letras terminen: 2.7 segundos
      setTimeout(() => setSloganGlow(false), 2700);
    }, 12900); // Cada 12.9 segundos (2.9 + 10 segundos)

    return () => clearInterval(interval);
  }, []);

  // Colores de tema basados en el sistema de marca
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
    textMuted: '#71717a',
    gridColor: '#00ff88',
    gridOpacity: 0.08
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
    textMuted: '#737373',
    gridColor: '#2d3748',
    gridOpacity: 0.08
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      zoom: '1'
    }}>
      <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} />
      <BackgroundPattern isDark={isDarkMode} />
      <div style={{
        width: '100%',
        maxWidth: '308px',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
            gap: '6px',
            marginBottom: '20px',
          }}>
            <ZigzagLogo size={52} color={theme.greenPrimary} sloganGlow={sloganGlow} isDarkMode={isDarkMode} />
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
            Track your portfolio performance
            <br />
            <span style={{ 
              color: theme.greenPrimary, 
              fontWeight: '600',
              display: 'inline-block',
              transform: sloganGlow && !isDarkMode
                ? 'translateY(-1px) scale(1.05)'
                : 'translateY(0) scale(1)',
              textShadow: sloganGlow && !isDarkMode
                ? '0 0 0 1px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(0, 0, 0, 0.4)'
                : 'none',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              {sloganGlow && isDarkMode ? (
                <>
                  {'Simple. Secure. Precise.'.split('').map((char, index) => (
                    <span
                      key={index}
                      style={{
                        display: 'inline-block',
                        animation: `letterGlow 1.6s ease-out`,
                        animationDelay: `${index * 0.05}s`,
                        animationFillMode: 'both'
                      }}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  ))}
                </>
              ) : (
                'Simple. Secure. Precise.'
              )}
            </span>
          </p>
        </div>

        {/* Main Card */}
        <div style={{
          background: theme.bgElevated,
          border: `1px solid ${theme.border}`,
          borderRadius: '13px',
          padding: 'clamp(16px, 4vw, 23px)',
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          ...(isDarkMode ? {} : {
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)'
          })
        }}>
          {/* Method Selection */}
          <div style={{
            display: 'flex',
            background: theme.bgContainer,
            borderRadius: '12px',
            padding: '4px',
            marginBottom: 'clamp(16px, 4vw, 23px)',
            border: `1px solid ${theme.borderLight}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <button
              onClick={() => setActiveMethod('api')}
              style={{
                flex: 1,
                padding: 'clamp(8px, 2.1vw, 10px) clamp(10px, 2.4vw, 13px)',
                borderRadius: '8px',
                border: 'none',
                background: activeMethod === 'api' ? theme.greenPrimary : 'transparent',
                color: activeMethod === 'api' ? (isDarkMode ? '#000000' : '#ffffff') : theme.textSecondary,
                fontSize: 'clamp(10px, 2.4vw, 12px)',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Inter', sans-serif"
              }}
              onMouseEnter={(e) => {
                if (activeMethod !== 'api') {
                  e.target.style.color = theme.textPrimary;
                  e.target.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeMethod !== 'api') {
                  e.target.style.color = theme.textSecondary;
                  e.target.style.background = 'transparent';
                }
              }}
            >
              API Connection
            </button>
            <button
              onClick={() => setActiveMethod('csv')}
              style={{
                flex: 1,
                padding: 'clamp(8px, 2.1vw, 10px) clamp(10px, 2.4vw, 13px)',
                borderRadius: '8px',
                border: 'none',
                background: activeMethod === 'csv' ? theme.greenPrimary : 'transparent',
                color: activeMethod === 'csv' ? (isDarkMode ? '#000000' : '#ffffff') : theme.textSecondary,
                fontSize: 'clamp(10px, 2.4vw, 12px)',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Inter', sans-serif"
              }}
              onMouseEnter={(e) => {
                if (activeMethod !== 'csv') {
                  e.target.style.color = theme.textPrimary;
                  e.target.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeMethod !== 'csv') {
                  e.target.style.color = theme.textSecondary;
                  e.target.style.background = 'transparent';
                }
              }}
            >
              CSV Upload
            </button>
          </div>

          {/* Input Section with Content Transition */}
          <div style={{
            minHeight: 'clamp(122px, 16.2vw, 130px)',
            position: 'relative'
          }}>
            {/* API Method - Only Inputs */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              opacity: activeMethod === 'api' ? 1 : 0,
              transform: activeMethod === 'api' ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              pointerEvents: activeMethod === 'api' ? 'auto' : 'none'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'center' }}>
                {/* API Key Field */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'clamp(10px, 2.4vw, 12px)',
                    fontWeight: '600',
                    color: theme.textPrimary,
                    marginBottom: '6px',
                    fontFamily: "'Inter', sans-serif",
                    textShadow: isDarkMode ? '0 0 4px rgba(255, 255, 255, 0.1)' : 'none',
                    transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    API Key
                  </label>
                  <input
                    type="text"
                    name="apiKey"
                    value={formData.apiKey}
                    onChange={handleChange}
                    placeholder="Enter your Kraken API key"
                    style={{
                      width: '100%',
                      padding: 'clamp(9px, 2.3vw, 11px) clamp(11px, 2.7vw, 13px)',
                      background: theme.bgContainer,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '10px',
                      color: theme.textPrimary,
                      fontSize: 'clamp(13px, 3.2vw, 15px)',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = theme.greenPrimary;
                      e.target.style.boxShadow = `0 0 0 2px ${isDarkMode ? 'rgba(0, 255, 136, 0.1)' : 'rgba(22, 163, 74, 0.1)'}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = theme.border;
                      e.target.style.boxShadow = 'none';
                    }}
                    required
                  />
                </div>

                {/* API Secret Field */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'clamp(10px, 2.4vw, 12px)',
                    fontWeight: '600',
                    color: theme.textPrimary,
                    marginBottom: '6px',
                    fontFamily: "'Inter', sans-serif",
                    textShadow: isDarkMode ? '0 0 4px rgba(255, 255, 255, 0.1)' : 'none',
                    transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    API Secret
                  </label>
                  <input
                    type="password"
                    name="secretKey"
                    value={formData.secretKey}
                    onChange={handleChange}
                    placeholder="Enter your Kraken API secret"
                    style={{
                      width: '100%',
                      padding: 'clamp(9px, 2.3vw, 11px) clamp(11px, 2.7vw, 13px)',
                      background: theme.bgContainer,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '10px',
                      color: theme.textPrimary,
                      fontSize: 'clamp(13px, 3.2vw, 15px)',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = theme.greenPrimary;
                      e.target.style.boxShadow = `0 0 0 2px ${isDarkMode ? 'rgba(0, 255, 136, 0.1)' : 'rgba(22, 163, 74, 0.1)'}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = theme.border;
                      e.target.style.boxShadow = 'none';
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* CSV Method - Only Upload Area */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              opacity: activeMethod === 'csv' ? 1 : 0,
              transform: activeMethod === 'csv' ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              pointerEvents: activeMethod === 'csv' ? 'auto' : 'none'
            }}>
              <input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              
              <div 
                onClick={() => document.getElementById('csvFile').click()}
                style={{
                  border: `2px dashed ${isDarkMode ? 'rgba(0, 255, 136, 0.3)' : 'rgba(16, 185, 129, 0.25)'}`,
                  borderRadius: '12px',
                  padding: 'clamp(16px, 4vw, 23px) clamp(13px, 3.2vw, 16px)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isDarkMode ? 'rgba(0, 255, 136, 0.02)' : 'rgba(16, 185, 129, 0.015)',
                  height: 'clamp(122px, 16.2vw, 130px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = isDarkMode ? 'rgba(0, 255, 136, 0.5)' : 'rgba(16, 185, 129, 0.4)';
                  e.target.style.background = isDarkMode ? 'rgba(0, 255, 136, 0.05)' : 'rgba(16, 185, 129, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = isDarkMode ? 'rgba(0, 255, 136, 0.3)' : 'rgba(16, 185, 129, 0.25)';
                  e.target.style.background = isDarkMode ? 'rgba(0, 255, 136, 0.02)' : 'rgba(16, 185, 129, 0.015)';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: isDarkMode ? 'rgba(0, 255, 136, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                  borderRadius: '10px',
                  margin: '0 auto 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  📊
                </div>
                <h3 style={{
                  fontSize: 'clamp(12px, 2.9vw, 13px)',
                  fontWeight: '600',
                  color: theme.textPrimary,
                  margin: '0 0 6px',
                  fontFamily: "'Space Grotesk', sans-serif"
                }}>
                  Upload Trading Data
                </h3>
                <p style={{
                  fontSize: 'clamp(11px, 2.5vw, 13px)',
                  color: theme.textSecondary,
                  margin: '0',
                  lineHeight: '1.4'
                }}>
                  Drop your Kraken CSV export here
                  <br />
                  <span style={{ color: theme.greenPrimary }}>or click to browse</span>
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button - Always at bottom */}
          <button
            onClick={activeMethod === 'api' ? handleSubmit : () => document.getElementById('csvFile').click()}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: 'clamp(14px, 3.5vw, 16px)',
              background: 'transparent',
              color: isLoading ? theme.textMuted : theme.greenPrimary,
              border: isLoading ? `2px solid ${theme.border}` : `2px solid ${theme.greenPrimary}`,
              borderRadius: '10px',
              fontSize: 'clamp(12px, 2.9vw, 13px)',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Inter', sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: 'clamp(45px, 9vw, 54px)',
              marginBottom: 'clamp(13px, 3.2vw, 16px)'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.background = theme.greenPrimary;
                e.target.style.color = isDarkMode ? '#000000' : '#ffffff';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.background = 'transparent';
                e.target.style.color = theme.greenPrimary;
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(161, 161, 170, 0.3)',
                  borderTop: '2px solid #a1a1aa',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Connecting...
              </>
            ) : (
              'Start Analysis'
            )}
          </button>


          {/* Error Display */}
          {error && (
            <div style={{
              marginTop: '16px',
              padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
              background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.05)',
              border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(220, 38, 38, 0.2)',
              borderRadius: '8px',
              color: isDarkMode ? '#fca5a5' : '#dc2626',
              fontSize: 'clamp(12px, 3vw, 14px)'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: 'clamp(16px, 4vw, 23px)'
        }}>
          <p style={{
            fontSize: 'clamp(8px, 2.1vw, 10px)',
            color: theme.textMuted,
            margin: '0 0 8px 0',
            fontWeight: '500',
            textAlign: 'center',
            background: isDarkMode ? 'rgba(113, 113, 122, 0.08)' : 'rgba(156, 163, 175, 0.08)',
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${isDarkMode ? 'rgba(113, 113, 122, 0.15)' : 'rgba(156, 163, 175, 0.15)'}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            🔒 Your data is processed locally and never stored on our servers
          </p>
          <p style={{
            fontSize: 'clamp(8px, 2.1vw, 10px)',
            color: theme.textMuted,
            margin: '0',
            transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            Need help?{' '}
            <a href="#" style={{ 
              color: theme.greenPrimary, 
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              Check our setup guide
            </a>
          </p>
        </div>
        
        {/* Contact Us Button */}
        <div style={{
          position: 'fixed',
          bottom: 'clamp(14px, 3.6vw, 22px)',
          right: 'clamp(14px, 3.6vw, 22px)',
          zIndex: 100
        }}>
          <button
            onClick={() => window.open('mailto:contact@gaintrack.app', '_blank')}
            style={{
              padding: 'clamp(7px, 1.8vw, 11px) clamp(11px, 2.7vw, 14px)',
              background: 'transparent',
              color: theme.textSecondary,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              fontSize: 'clamp(10px, 2.3vw, 12px)',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Inter', sans-serif",
              backdropFilter: 'blur(8px)',
              background: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = theme.textPrimary;
              e.target.style.borderColor = theme.greenPrimary;
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = theme.textSecondary;
              e.target.style.borderColor = theme.border;
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Contact Us
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes gridFlow {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.02);
          }
        }
        
        /* Responsive breakpoints */
        @media (max-width: 480px) {
          .container {
            padding: 12px;
            max-width: 100%;
          }
          .header {
            margin-bottom: 20px;
          }
          .logo-container {
            gap: 8px;
            margin-bottom: 16px;
          }
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 14px;
          }
          .header {
            margin-bottom: 24px;
          }
        }
        
        @media (min-width: 1200px) {
          .container {
            max-width: 420px;
          }
        }
        
        @keyframes letterGlow {
          0% {
            color: inherit;
            text-shadow: none;
            filter: none;
          }
          15% {
            color: rgba(0, 255, 136, 1);
            text-shadow: 0 0 8px rgba(0, 255, 136, 0.6), 0 0 16px rgba(0, 255, 136, 0.4);
            filter: drop-shadow(0 0 6px rgba(0, 255, 136, 0.5));
          }
          35% {
            color: rgba(0, 255, 136, 1);
            text-shadow: 0 0 8px rgba(0, 255, 136, 0.6), 0 0 16px rgba(0, 255, 136, 0.4);
            filter: drop-shadow(0 0 6px rgba(0, 255, 136, 0.5));
          }
          60% {
            color: rgba(0, 255, 136, 0.8);
            text-shadow: 0 0 6px rgba(0, 255, 136, 0.4), 0 0 12px rgba(0, 255, 136, 0.3);
            filter: drop-shadow(0 0 4px rgba(0, 255, 136, 0.4));
          }
          75% {
            color: rgba(0, 255, 136, 0.6);
            text-shadow: 0 0 4px rgba(0, 255, 136, 0.3), 0 0 8px rgba(0, 255, 136, 0.2);
            filter: drop-shadow(0 0 3px rgba(0, 255, 136, 0.3));
          }
          85% {
            color: rgba(0, 255, 136, 0.4);
            text-shadow: 0 0 3px rgba(0, 255, 136, 0.2), 0 0 6px rgba(0, 255, 136, 0.1);
            filter: drop-shadow(0 0 2px rgba(0, 255, 136, 0.2));
          }
          92% {
            color: rgba(0, 255, 136, 0.2);
            text-shadow: 0 0 2px rgba(0, 255, 136, 0.1);
            filter: drop-shadow(0 0 1px rgba(0, 255, 136, 0.1));
          }
          97% {
            color: rgba(0, 255, 136, 0.1);
            text-shadow: 0 0 1px rgba(0, 255, 136, 0.05);
            filter: none;
          }
          100% {
            color: inherit;
            text-shadow: none;
            filter: none;
          }
        }
      `}</style>
    </div>
  );
};

export default GainTrackForm;