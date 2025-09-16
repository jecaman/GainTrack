import React, { useState, useEffect, useRef } from 'react';
import './GainTrackForm.css';
import GainTrackBrand from './GainTrackBrand';



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
const BackgroundPattern = React.memo(({ isDark = true }) => {
  // Function to get different gray tones
  const getGrayColor = (tone, isDark) => {
    const grayShades = isDark 
      ? ['#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'] // Dark mode grays
      : ['#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280']; // Light mode grays
    return grayShades[tone] || grayShades[2];
  };
  
  // Generate static lines - no random values to prevent re-renders
  const verticalLines = React.useMemo(() => 
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      position: (i / 17) * 90,
      duration: 8,
      delay: i * 0.4,
      opacity: 0.3,
      grayTone: 2,
      appearing: i % 3 !== 0 // Show 2 out of every 3 lines
    })), []
  );
  
  const horizontalLines = React.useMemo(() => 
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      position: (i / 13) * 90,
      duration: 8,
      delay: i * 0.3,
      opacity: 0.25,
      grayTone: 2,
      appearing: i % 2 !== 0 // Show every other line
    })), []
  );

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
      opacity: 0.4,
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
            background: `linear-gradient(180deg, transparent, ${getGrayColor(line.grayTone, isDark)}, transparent)`,
            display: line.appearing ? 'block' : 'none',
            opacity: line.opacity,
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
            top: `${line.position}%`,
            left: 0,
            width: '100%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${getGrayColor(line.grayTone, isDark)}, transparent)`,
            display: line.appearing ? 'block' : 'none',
            opacity: line.opacity,
            animation: `gridFlow ${line.duration}s ease-in-out infinite`,
            animationDelay: `${line.delay}s`,
            transition: 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      ))}
    </div>
    
  </div>
  );
});

const GainTrackForm = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState({
    apiKey: '',
    secretKey: ''
  });
  const [activeMethod, setActiveMethod] = useState('api');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sloganGlow, setSloganGlow] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploadSuccess, setCsvUploadSuccess] = useState(false);
  const [csvProgress, setCsvProgress] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');
    
    if (activeMethod === 'api') {
      if (!formData.apiKey.trim() || !formData.secretKey.trim()) {
        setValidationError('⚠️ Please complete both fields to continue');
        return;
      }
      onSubmit(formData);
    } else {
      if (!csvFile) {
        setValidationError('📊 Please select a CSV file to continue');
        return;
      }
      // Procesar CSV
      processCsvFile(csvFile);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const processCsvFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append('csv_file', file);
      
      const response = await fetch('http://localhost:8001/api/portfolio/csv', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.error) {
        setValidationError(data.error);
        return;
      }
      
      // Llamar a onSubmit con los datos procesados del CSV
      onSubmit({ csvData: data });
    } catch (error) {
      setValidationError('Error processing CSV file. Please try again.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'))) {
      setCsvFile(file);
      setValidationError('');
      setCsvUploadSuccess(true);
      setCsvProgress(0);
      
      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setCsvProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
              setCsvUploadSuccess(false);
              setCsvProgress(0);
            }, 1000);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    } else {
      setValidationError('❌ Invalid file format. Please select a CSV');
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Limpiar errores cuando se cambia de método (pero mantener CSV)
  useEffect(() => {
    setValidationError('');
    setCsvUploadSuccess(false);
    setCsvProgress(0);
  }, [activeMethod]);

  // Auto-hide error messages after 4 seconds
  useEffect(() => {
    if (validationError) {
      const timer = setTimeout(() => {
        setValidationError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [validationError]);

  // Auto-hide backend errors after 6 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        // Clear error from parent component by calling a callback if available
        if (typeof onClearError === 'function') {
          onClearError();
        }
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
      height: '100vh',
      background: theme.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      zoom: '1.0',
      overflow: 'hidden'
    }}>
      <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} />
      <div style={{
        width: '100%',
        maxWidth: 'clamp(18.7rem, 75vw, 20.9rem)',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 'clamp(1.25rem, 3vw, 1.5rem)',
        }}>
          {/* Logo */}
          <div style={{
            marginBottom: 'clamp(0.5rem, 1.5vw, 0.625rem)',
          }}>
            <GainTrackBrand 
              logoSize={50}
              titleSize="clamp(24px, 6vw, 31px)"
              color={theme.greenPrimary}
              titleColor={theme.textPrimary}
              sloganGlow={sloganGlow}
              isDarkMode={isDarkMode}
              layout="horizontal"
              logoRotation={8}
              spacing="2px"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '-0.02em',
                transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                lineHeight: '1'
              }}
            />
          </div>
          
          {/* Subtitle */}
          <p style={{
            color: theme.textSecondary,
            fontSize: 'clamp(0.77rem, 2.75vw, 0.85rem)',
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
          padding: 'clamp(14px, 3.5vw, 20px)',
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
            marginBottom: 'clamp(14px, 3.5vw, 20px)',
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
            minHeight: 'clamp(110px, 14vw, 120px)',
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
                      fontSize: 'clamp(11px, 2.8vw, 13px)',
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
                      fontSize: 'clamp(11px, 2.8vw, 13px)',
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
              
              {csvFile ? (
                <div 
                  onClick={() => document.getElementById('csvFile').click()}
                  style={{
                    border: `2px solid ${isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.2)'}`,
                    borderRadius: '12px',
                    padding: 'clamp(16px, 4vw, 23px) clamp(13px, 3.2vw, 16px)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: isDarkMode ? 'rgba(34, 197, 94, 0.05)' : 'rgba(22, 163, 74, 0.02)',
                    height: 'clamp(122px, 16.2vw, 130px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = isDarkMode ? 'rgba(34, 197, 94, 0.5)' : 'rgba(22, 163, 74, 0.4)';
                    e.target.style.background = isDarkMode ? 'rgba(34, 197, 94, 0.08)' : 'rgba(22, 163, 74, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.2)';
                    e.target.style.background = isDarkMode ? 'rgba(34, 197, 94, 0.05)' : 'rgba(22, 163, 74, 0.02)';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(22, 163, 74, 0.1)',
                    borderRadius: '10px',
                    margin: '0 auto 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    📄
                  </div>
                  <h3 style={{
                    fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)',
                    fontWeight: '600',
                    color: isDarkMode ? '#4ade80' : '#16a34a',
                    margin: '0 0 6px',
                    fontFamily: "'Space Grotesk', sans-serif"
                  }}>
                    {csvFile.name}
                  </h3>
                  <p style={{
                    fontSize: 'clamp(11px, 2.5vw, 13px)',
                    color: theme.textSecondary,
                    margin: '0',
                    lineHeight: '1.4'
                  }}>
                    <span style={{ color: isDarkMode ? '#4ade80' : '#16a34a' }}>Click to change file</span>
                  </p>
                </div>
              ) : (
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
                    fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)',
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
              )}
            </div>
          </div>

          {/* Submit Button - Always at bottom */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: 'clamp(14px, 3.5vw, 16px)',
              background: 'transparent',
              color: isLoading ? theme.textMuted : theme.greenPrimary,
              border: isLoading ? `2px solid ${theme.border}` : `2px solid ${theme.greenPrimary}`,
              borderRadius: '10px',
              fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Inter', sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: 'clamp(35px, 7vw, 45px)',
              marginBottom: 'clamp(10px, 2.5vw, 14px)'
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


        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: 'clamp(14px, 3.5vw, 20px)'
        }}>
          <p style={{
            fontSize: 'clamp(8.8px, 2.3vw, 11px)',
            color: theme.textPrimary,
            margin: '0 0 8px 0',
            fontWeight: '500',
            textAlign: 'center',
            background: isDarkMode ? 'rgba(113, 113, 122, 0.15)' : 'rgba(156, 163, 175, 0.15)',
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${isDarkMode ? 'rgba(113, 113, 122, 0.25)' : 'rgba(156, 163, 175, 0.25)'}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            🔒 Your data is processed locally and never stored on our servers
          </p>
          <p style={{
            fontSize: 'clamp(8.8px, 2.3vw, 11px)',
            color: theme.textPrimary,
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
          bottom: 'clamp(10px, 2.5vw, 16px)',
          right: 'clamp(10px, 2.5vw, 16px)',
          zIndex: 100
        }}>
          <button
            onClick={() => window.open('mailto:contact@gaintrack.app', '_blank')}
            style={{
              padding: 'clamp(6px, 1.5vw, 9px) clamp(9px, 2.2vw, 12px)',
              background: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
              color: theme.textSecondary,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              fontSize: 'clamp(9px, 2vw, 11px)',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Inter', sans-serif",
              backdropFilter: 'blur(8px)'
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
      
      {/* Floating notifications - bottom right */}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'flex-end'
      }}>
        {/* CSV Upload Success Message */}
        {csvUploadSuccess && (
          <div style={{
            padding: '10px 14px',
            background: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(22, 163, 74, 0.1)',
            border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(22, 163, 74, 0.25)',
            borderRadius: '8px',
            color: isDarkMode ? '#4ade80' : '#16a34a',
            fontSize: '13px',
            fontWeight: '500',
            backdropFilter: 'blur(8px)',
            maxWidth: '280px',
            animation: 'slideInRight 0.3s ease-out'
          }}>
            <div style={{ marginBottom: '6px' }}>
              CSV loaded: {csvFile?.name}
            </div>
            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: '2px',
              background: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(22, 163, 74, 0.15)',
              borderRadius: '1px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: isDarkMode ? '#22c55e' : '#15803d',
                width: `${csvProgress}%`,
                transition: 'width 0.1s ease-out'
              }}></div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {(error || validationError) && (
          <div style={{
            padding: '10px 14px',
            background: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)',
            border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(220, 38, 38, 0.25)',
            borderRadius: '8px',
            color: isDarkMode ? '#fca5a5' : '#dc2626',
            fontSize: '13px',
            fontWeight: '500',
            backdropFilter: 'blur(8px)',
            maxWidth: '280px',
            animation: 'slideInRight 0.3s ease-out'
          }}>
            <div style={{ marginBottom: '6px' }}>
              {error || validationError}
            </div>
            {/* Error progress bar */}
            <div style={{
              width: '100%',
              height: '2px',
              background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.15)',
              borderRadius: '1px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: isDarkMode ? '#ef4444' : '#dc2626',
                width: '100%',
                animation: 'errorProgress 4s linear'
              }}></div>
            </div>
          </div>
        )}
      </div>
      </div>

    </div>
  );
};

export default GainTrackForm;