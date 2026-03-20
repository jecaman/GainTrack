import React, { useState, useEffect } from 'react';
import './GainTrackForm.css';
import GainTrackBrand from './GainTrackBrand';

const fetchWithTimeout = (url, options = {}, timeoutMs = 30000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};



// Background — Grid pattern with radial fade
const BackgroundPattern = React.memo(({ isDark = true }) => {
  const lineColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(${lineColor} 1px, transparent 1px),
          linear-gradient(90deg, ${lineColor} 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        backgroundPosition: 'calc(50%) calc(50%)',
        mask: 'radial-gradient(ellipse at center, white 20%, rgba(255,255,255,0.4) 50%, transparent 75%)',
        WebkitMask: 'radial-gradient(ellipse at center, white 20%, rgba(255,255,255,0.4) 50%, transparent 75%)',
      }} />
    </div>
  );
});

const GainTrackForm = ({ onSubmit, isLoading, error, isVisible, onOpenDocs }) => {
  const [formData, setFormData] = useState({
    apiKey: '',
    secretKey: ''
  });
  const [activeMethod, setActiveMethod] = useState('api');
  const [sloganGlow, setSloganGlow] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [buttonHover, setButtonHover] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingElapsed, setLoadingElapsed] = useState(0);

  // Track elapsed time during loading to show cold-start message
  useEffect(() => {
    if (!isLoading && !isProcessing) {
      setLoadingElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoading, isProcessing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (activeMethod === 'api') {
      if (!formData.apiKey.trim() || !formData.secretKey.trim()) {
        setValidationError('Please complete both fields to continue');
        return;
      }
      onSubmit(formData);
    } else {
      if (!csvFile) {
        setValidationError('Please select a CSV file to continue');
        return;
      }
      processCsvFile(csvFile);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const processCsvFile = async (file, startDate = null, endDate = null) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('csv_file', file);

      if (startDate) formData.append('start_date', startDate);
      if (endDate) formData.append('end_date', endDate);

      const response = await fetchWithTimeout(`${import.meta.env.VITE_API_URL}/api/portfolio/csv`, {
        method: 'POST',
        body: formData
      }, 60000);

      const data = await response.json();

      if (data.error) {
        setValidationError(data.error);
        return;
      }

      onSubmit({ csvData: data, csvFile: file });
    } catch (error) {
      setValidationError(error.name === 'AbortError' ? 'Request timed out.' : 'Error processing CSV file. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'))) {
      setCsvFile(file);
      setValidationError('');
    } else {
      setValidationError('Invalid file format. Please select a CSV');
    }
  };

  // Limpiar errores cuando se cambia de método
  useEffect(() => {
    setValidationError('');
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
        if (typeof onClearError === 'function') {
          onClearError();
        }
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Reset isProcessing cuando el form vuelve a ser visible (usuario regresa)
  useEffect(() => {
    if (isVisible) setIsProcessing(false);
  }, [isVisible]);

  // Efecto glow del slogan sincronizado con el logo
  useEffect(() => {
    const interval = setInterval(() => {
      setSloganGlow(true);
      setTimeout(() => setSloganGlow(false), 2700);
    }, 12900);

    return () => clearInterval(interval);
  }, []);


  // Colores de tema (solo dark mode)
  const theme = {
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
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden'
    }}>
      <BackgroundPattern />

      {/* ── Loading overlay ── */}
      {(isLoading || isProcessing) && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: theme.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
          zIndex: 50,
          animation: 'fadeIn 0.3s ease',
        }}>
          <BackgroundPattern />

          {/* Logo */}
          <div style={{ opacity: 0.9 }}>
            <GainTrackBrand
              logoSize={72}
              titleSize='36px'
              color={theme.greenPrimary}
              titleColor={theme.textPrimary}
              isDarkMode={true}
              layout='vertical'
              logoRotation={8}
              spacing='8px'
            />
          </div>

          {/* Spinner + texto */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}>
            {/* Spinner */}
            <div style={{
              width: '36px',
              height: '36px',
              border: '2px solid rgba(255,255,255,0.08)',
              borderTop: `2px solid ${theme.greenPrimary}`,
              borderRadius: '50%',
              animation: 'spin 0.9s linear infinite',
            }} />

            <p style={{
              color: theme.textSecondary,
              fontSize: '13px',
              fontWeight: '400',
              letterSpacing: '0.06em',
              margin: 0,
              fontFamily: "'Inter', sans-serif",
            }}>
              Analyzing your portfolio...
            </p>

            {/* Cold-start message after 5s */}
            {loadingElapsed >= 5 && (
              <p style={{
                color: 'rgba(255,255,255,0.35)',
                fontSize: '12px',
                fontWeight: '400',
                margin: 0,
                fontFamily: "'Inter', sans-serif",
                textAlign: 'center',
                maxWidth: '280px',
                lineHeight: '1.5',
                animation: 'fadeIn 0.5s ease',
              }}>
                {loadingElapsed < 15
                  ? 'The server is waking up — this usually takes a few seconds on the first request.'
                  : 'Still working — the server may need up to 30s to start from a cold state.'}
              </p>
            )}
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Centered vertical layout */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* ── Branding ── */}
        <div style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          <GainTrackBrand
            logoSize={80}
            titleSize={'clamp(32px, 7vw, 42px)'}
            color={theme.greenPrimary}
            titleColor={theme.textPrimary}
            sloganGlow={sloganGlow}
            isDarkMode={true}
            layout='vertical'
            logoRotation={8}
            spacing='6px'
            style={{ transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}>
            <p style={{
              color: theme.textSecondary,
              fontSize: '14px',
              margin: 0,
              fontWeight: '300',
              letterSpacing: '0.04em',
              lineHeight: '1.6',
              opacity: 0.8,
              transition: 'color 0.3s ease',
            }}>
              Track your Kraken portfolio performance.
            </p>
            <span style={{
              color: theme.greenPrimary,
              fontWeight: '500',
              fontSize: '14px',
              letterSpacing: '0.04em',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              {sloganGlow ? (
                'Simple. Secure. Precise.'.split('').map((char, i) => (
                  <span key={i} style={{
                    display: 'inline-block',
                    animation: 'letterGlow 1.6s ease-out',
                    animationDelay: `${i * 0.05}s`,
                    animationFillMode: 'both'
                  }}>
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))
              ) : 'Simple. Secure. Precise.'}
            </span>
          </div>
        </div>

        {/* ── Descriptor ── */}
        <p style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)',
          margin: '4px 0 0 0',
          textAlign: 'center',
        }}>
          FIFO engine &middot; daily time-series &middot; real-time prices
        </p>

        {/* ── Form Card ── */}
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <form onSubmit={handleSubmit} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '13px',
            padding: '28px',
            position: 'relative',
            backdropFilter: 'blur(20px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Method Selection — underline tabs */}
            <div style={{
              display: 'flex',
              borderBottom: `1px solid ${theme.border}`,
              marginBottom: '20px',
            }}>
              {['api', 'csv'].map(method => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setActiveMethod(method)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: 'none',
                    borderBottom: activeMethod === method ? `2px solid ${theme.greenPrimary}` : '2px solid transparent',
                    background: 'transparent',
                    color: activeMethod === method ? theme.greenPrimary : theme.textSecondary,
                    fontSize: '13px',
                    fontWeight: activeMethod === method ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: '-1px',
                  }}
                  onMouseEnter={(e) => {
                    if (activeMethod !== method) e.currentTarget.style.color = theme.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    if (activeMethod !== method) e.currentTarget.style.color = theme.textSecondary;
                  }}
                >
                  {method === 'api' ? 'API Connection' : 'CSV Upload'}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div style={{ minHeight: '128px', position: 'relative' }}>

              {/* API inputs */}
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%',
                opacity: activeMethod === 'api' ? 1 : 0,
                transform: activeMethod === 'api' ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                pointerEvents: activeMethod === 'api' ? 'auto' : 'none'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  {[
                    { name: 'apiKey',    label: 'API Key',    type: 'text',     placeholder: 'Enter your Kraken API key',    id: 'kraken-api-key', autoComplete: 'username' },
                    { name: 'secretKey', label: 'API Secret', type: 'password', placeholder: 'Enter your Kraken API secret', id: 'kraken-secret',  autoComplete: 'current-password' },
                  ].map(({ name, label, type, placeholder, id, autoComplete }) => (
                    <div key={name} style={{ position: 'relative' }}>
                      <label style={{
                        display: 'block', fontSize: '10px', fontWeight: '600',
                        color: focusedField === name ? theme.greenPrimary : theme.textSecondary,
                        marginBottom: '8px',
                        fontFamily: "'Inter', sans-serif",
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        transition: 'color 0.2s ease',
                      }}>
                        {label}
                      </label>
                      <input
                        id={id} type={type} name={name}
                        autoComplete={autoComplete}
                        value={formData[name]} onChange={handleChange}
                        placeholder={placeholder}
                        style={{
                          width: '100%', padding: '8px 0',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: `1px solid ${theme.border}`,
                          borderRadius: '0',
                          color: theme.textPrimary, fontSize: '12px',
                          outline: 'none', transition: 'border-color 0.2s ease', boxSizing: 'border-box',
                          fontFamily: "'JetBrains Mono', monospace"
                        }}
                        onFocus={() => setFocusedField(name)}
                        onBlur={() => setFocusedField(null)}
                      />
                      {/* Animated green underline */}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0,
                        height: '1px',
                        width: focusedField === name ? '100%' : '0%',
                        background: theme.greenPrimary,
                        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* CSV upload */}
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%',
                opacity: activeMethod === 'csv' ? 1 : 0,
                transform: activeMethod === 'csv' ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                pointerEvents: activeMethod === 'csv' ? 'auto' : 'none'
              }}>
                <input id="csvFile" type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                <div
                  onClick={() => document.getElementById('csvFile').click()}
                  style={{
                    border: csvFile
                      ? '2px solid rgba(34,197,94,0.3)'
                      : '2px dashed rgba(0,255,136,0.3)',
                    borderRadius: '12px',
                    height: '128px',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    background: csvFile ? 'rgba(34,197,94,0.05)' : 'rgba(0,255,136,0.02)',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,255,136,0.5)';
                    e.currentTarget.style.background = 'rgba(0,255,136,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = csvFile ? 'rgba(34,197,94,0.3)' : 'rgba(0,255,136,0.3)';
                    e.currentTarget.style.background = csvFile ? 'rgba(34,197,94,0.05)' : 'rgba(0,255,136,0.02)';
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                    {csvFile
                      ? <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></>
                      : <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>
                    }
                  </svg>
                  <span style={{
                    fontSize: '12px', fontWeight: '600',
                    color: csvFile ? '#4ade80' : theme.textPrimary,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {csvFile ? csvFile.name : 'Upload Trading Data'}
                  </span>
                  <span style={{ fontSize: '11px', color: csvFile ? '#4ade80' : theme.greenPrimary }}>
                    {csvFile ? 'Click to change file' : 'Drop your Kraken CSV or click to browse'}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '16px',
                background: buttonHover && !isLoading ? theme.greenPrimary : 'transparent',
                color: isLoading ? theme.textMuted : (buttonHover && !isLoading ? '#000' : theme.greenPrimary),
                border: isLoading ? `2px solid ${theme.border}` : `2px solid ${theme.greenPrimary}`,
                borderRadius: '12px', fontSize: '14px', fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease', fontFamily: "'Inter', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginTop: '24px',
                position: 'relative',
                overflow: 'hidden',
                transform: buttonHover && !isLoading ? 'translateY(-1px)' : 'translateY(0)',
              }}
              onMouseEnter={() => { if (!isLoading) setButtonHover(true); }}
              onMouseLeave={() => setButtonHover(false)}
            >
              {/* Shimmer sweep on hover */}
              {buttonHover && !isLoading && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  animation: 'shimmer-sweep 0.55s ease-out forwards',
                  pointerEvents: 'none',
                }} />
              )}
              {isLoading ? (
                <>
                  <div style={{
                    width: '14px', height: '14px',
                    border: '2px solid rgba(161,161,170,0.3)',
                    borderTop: '2px solid #a1a1aa',
                    borderRadius: '50%', animation: 'spin 1s linear infinite'
                  }} />
                  Connecting...
                </>
              ) : 'Start Analysis'}
            </button>
          </form>
        </div>

        {/* ── Footer links ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'nowrap',
          justifyContent: 'center',
        }}>
          {[
            {
              key: 'demo',
              label: 'Try with sample data',
              icon: <polygon points="5 3 19 12 5 21 5 3"/>,
              onClick: async () => {
                try {
                  setIsProcessing(true);
                  const response = await fetch('/demo_portfolio.json');
                  if (!response.ok) throw new Error('Failed to load demo');
                  const data = await response.json();
                  // Extend demo timeline to today by duplicating the last entry
                  if (data.timeline && data.timeline.length > 0) {
                    const lastEntry = data.timeline[data.timeline.length - 1];
                    const lastDate = new Date(lastEntry.date + 'T12:00:00');
                    const today = new Date();
                    today.setHours(12, 0, 0, 0);
                    const oneDay = 24 * 60 * 60 * 1000;
                    let d = new Date(lastDate.getTime() + oneDay);
                    while (d <= today) {
                      const dateStr = d.toISOString().split('T')[0];
                      data.timeline.push({ ...lastEntry, date: dateStr });
                      d = new Date(d.getTime() + oneDay);
                    }
                  }
                  onSubmit({ csvData: data });
                } catch (err) {
                  setValidationError('Could not load demo data. Please try again.');
                  setIsProcessing(false);
                }
              },
            },
            {
              key: 'docs',
              label: 'How it works',
              icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
              onClick: () => {
                if (onOpenDocs) onOpenDocs();
              },
            },
            {
              key: 'getting-started',
              label: 'Getting started',
              icon: <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></>,
              onClick: () => {
                if (onOpenDocs) onOpenDocs('getting-started');
              },
            },
          ].map(({ key, label, icon, onClick }) => {
            const isGettingStarted = key === 'getting-started';
            return (
              <button
                key={key}
                onClick={onClick}
                style={{
                  background: isGettingStarted
                    ? (hoveredLink === key ? 'rgba(0,255,136,0.1)' : 'transparent')
                    : 'transparent',
                  border: isGettingStarted
                    ? `1px solid ${hoveredLink === key ? 'rgba(0,255,136,0.5)' : 'rgba(255,255,255,0.12)'}`
                    : 'none',
                  borderRadius: isGettingStarted ? '8px' : '0',
                  color: hoveredLink === key ? theme.greenPrimary : theme.textSecondary,
                  fontSize: '14px',
                  fontWeight: isGettingStarted ? '600' : '500',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  padding: isGettingStarted ? '6px 14px' : '6px 0',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={() => setHoveredLink(key)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                  {icon}
                </svg>
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Privacy footer ── */}
        <p style={{
          fontSize: '12px',
          color: theme.textSecondary,
          textAlign: 'center',
          margin: 0,
          lineHeight: '1.5',
        }}>
          Your data is processed in memory and never stored.
        </p>
      </div>

      {/* ── Contact links (bottom right) ── */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        zIndex: 10,
      }}>
        {[
          {
            key: 'github',
            href: 'https://github.com/jecaman',
            icon: <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />,
            fill: true,
          },
          {
            key: 'email',
            href: 'mailto:jesuscamposmanjon@gmail.com',
            icon: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4l-10 8L2 4"/></>,
            fill: false,
          },
        ].map(({ key, href, icon, fill }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: theme.textMuted,
              transition: 'color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = theme.greenPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = theme.textMuted; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"
              fill={fill ? 'currentColor' : 'none'}
              stroke={fill ? 'none' : 'currentColor'}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              {icon}
            </svg>
          </a>
        ))}
      </div>

      {/* Error toast */}
      {(error || validationError) && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '20px', zIndex: 999,
          padding: '10px 14px',
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px', color: '#fca5a5',
          fontSize: '13px', fontWeight: '500',
          backdropFilter: 'blur(8px)', maxWidth: '280px',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          {error || validationError}
        </div>
      )}
    </div>
  );
};

export default GainTrackForm;
