import { useState, useEffect, useRef } from 'react';

// Zigzag Logo Component with Moving Bright Point
// Puedes controlar la frecuencia (cada cuánto aparece el punto) con "intervaloFrecuenciaMs"
// y la velocidad (cuánto tarda en recorrer el zigzag) con "duracionAnimacionMs"
const ZigzagLogo = ({
  size = 32,
  color = "#00ff88",
  intervaloFrecuenciaMs = 8000, // Frecuencia: cada cuántos ms aparece el punto
  duracionAnimacionMs = 800    // Velocidad: ms que tarda en recorrer el zigzag
}) => {
  const [visible, setVisible] = useState(false);
  const [fade, setFade] = useState(false); // Nuevo estado para controlar el fade
  const timeoutRef = useRef(null);
  const fadeTimeoutRef = useRef(null);

  useEffect(() => {
    let activo = true;

    const ciclo = () => {
      if (!activo) return;
      setVisible(true);
      setFade(false); // Asegura que el punto aparece opaco
      // El punto se muestra y se anima durante la duración de la animación
      timeoutRef.current = setTimeout(() => {
        setFade(true); // Inicia el fade out
        // Espera a que termine el fade antes de ocultar el punto realmente
        fadeTimeoutRef.current = setTimeout(() => {
          setVisible(false);
          // Espera el resto del intervalo antes de volver a mostrar el punto
          timeoutRef.current = setTimeout(ciclo, intervaloFrecuenciaMs - duracionAnimacionMs);
        }, 1200); // Duración del fade-out mucho más suave (1.2s)
      }, duracionAnimacionMs);
    };

    ciclo();

    return () => {
      activo = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [intervaloFrecuenciaMs, duracionAnimacionMs]);

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
      let p = Math.min(elapsed / duracionAnimacionMs, 1);
      setProgress(p);
      if (p < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };
    rafId = requestAnimationFrame(animate);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [visible, duracionAnimacionMs]);

  // Calcula la posición del punto
  const punto = getPointPosition(progress);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
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
      {/* Moving bright point */}
      {visible && (
        <div
          style={{
            position: 'absolute',
            left: `calc(${(punto.x / 32) * 100}% - 4px)`,
            top: `calc(${(punto.y / 20) * 100}% - 4px)`,
            width: '8px',
            height: '8px',
            background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 30%, rgba(0,255,136,0.7) 60%, rgba(0,255,136,0.3) 80%, transparent 100%)',
            borderRadius: '50%',
            filter: 'blur(3px) drop-shadow(0 0 20px #00ff88) drop-shadow(0 0 40px rgba(0,255,136,1)) drop-shadow(0 0 60px rgba(255,255,255,0.8)) drop-shadow(0 0 80px rgba(0,255,136,0.6))',
            opacity: fade ? 0 : 1,
            transition: fade
              ? 'opacity 1.2s cubic-bezier(0.4,0,0.2,1)'
              : 'opacity 0.2s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 10,
            boxShadow: '0 0 15px rgba(0,255,136,0.8), inset 0 0 10px rgba(255,255,255,0.5)',
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
};


// Background Grid Component with Dynamic Effects
const BackgroundPattern = () => (
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
    <div style={{ opacity: 0.08 }}>
      {/* Vertical Lines */}
      {[...Array(25)].map((_, i) => (
        <div
          key={`vertical-${i}`}
          style={{
            position: 'absolute',
            left: `${i * 4}%`,
            top: 0,
            width: '1px',
            height: '100%',
            background: `linear-gradient(180deg, transparent, #00ff88, transparent)`,
            animation: `gridFlow ${4 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`
          }}
        />
      ))}
      {/* Horizontal Lines */}
      {[...Array(20)].map((_, i) => (
        <div
          key={`horizontal-${i}`}
          style={{
            position: 'absolute',
            top: `${i * 5}%`,
            left: 0,
            width: '100%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, #00ff88, transparent)`,
            animation: `gridFlow ${4 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`
          }}
        />
      ))}
    </div>
    
  </div>
);

const GainTrackForm = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState({
    apiKey: '',
    secretKey: ''
  });
  const [activeMethod, setActiveMethod] = useState('api');

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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative'
    }}>
      <BackgroundPattern />
      <div style={{
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '48px'
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <ZigzagLogo size={80} />
            <h1 style={{
              fontSize: '48px',
              fontWeight: '700',
              color: '#ffffff',
              margin: '0',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '-0.02em'
            }}>
              GainTrack
            </h1>
          </div>
          
          {/* Subtitle */}
          <p style={{
            color: '#a1a1aa',
            fontSize: '16px',
            margin: '0',
            fontWeight: '400',
            lineHeight: '1.5'
          }}>
            Track your portfolio performance
            <br />
            <span style={{ 
              color: '#00ff88', 
              fontWeight: '600',
              textShadow: '0 0 8px rgba(0, 255, 136, 0.4), 0 0 16px rgba(0, 255, 136, 0.2)',
              filter: 'drop-shadow(0 0 4px rgba(0, 255, 136, 0.3))'
            }}>Simple. Secure. Precise.</span>
          </p>
        </div>

        {/* Main Card */}
        <div style={{
          background: '#111111',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '32px',
          position: 'relative'
        }}>
          {/* Method Selection */}
          <div style={{
            display: 'flex',
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '32px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <button
              onClick={() => setActiveMethod('api')}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeMethod === 'api' ? '#00ff88' : 'transparent',
                color: activeMethod === 'api' ? '#000000' : '#a1a1aa',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Inter', sans-serif"
              }}
              onMouseEnter={(e) => {
                if (activeMethod !== 'api') {
                  e.target.style.color = '#ffffff';
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeMethod !== 'api') {
                  e.target.style.color = '#a1a1aa';
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
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeMethod === 'csv' ? '#00ff88' : 'transparent',
                color: activeMethod === 'csv' ? '#000000' : '#a1a1aa',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Inter', sans-serif"
              }}
              onMouseEnter={(e) => {
                if (activeMethod !== 'csv') {
                  e.target.style.color = '#ffffff';
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeMethod !== 'csv') {
                  e.target.style.color = '#a1a1aa';
                  e.target.style.background = 'transparent';
                }
              }}
            >
              CSV Upload
            </button>
          </div>

          {/* Input Section with Content Transition */}
          <div style={{
            minHeight: '180px',
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* API Key Field */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '8px',
                    fontFamily: "'Inter', sans-serif",
                    textShadow: '0 0 4px rgba(255, 255, 255, 0.1)'
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
                      padding: '14px 16px',
                      background: '#1a1a1a',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#00ff88';
                      e.target.style.boxShadow = '0 0 0 2px rgba(0, 255, 136, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.boxShadow = 'none';
                    }}
                    required
                  />
                </div>

                {/* API Secret Field */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '8px',
                    fontFamily: "'Inter', sans-serif",
                    textShadow: '0 0 4px rgba(255, 255, 255, 0.1)'
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
                      padding: '14px 16px',
                      background: '#1a1a1a',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#00ff88';
                      e.target.style.boxShadow = '0 0 0 2px rgba(0, 255, 136, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
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
                  border: '2px dashed rgba(0, 255, 136, 0.3)',
                  borderRadius: '12px',
                  padding: '32px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: 'rgba(0, 255, 136, 0.02)',
                  height: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = 'rgba(0, 255, 136, 0.5)';
                  e.target.style.background = 'rgba(0, 255, 136, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'rgba(0, 255, 136, 0.3)';
                  e.target.style.background = 'rgba(0, 255, 136, 0.02)';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'rgba(0, 255, 136, 0.1)',
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
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: '0 0 6px',
                  fontFamily: "'Space Grotesk', sans-serif"
                }}>
                  Upload Trading Data
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: '#a1a1aa',
                  margin: '0',
                  lineHeight: '1.4'
                }}>
                  Drop your Kraken CSV export here
                  <br />
                  <span style={{ color: '#00ff88' }}>or click to browse</span>
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
              padding: '16px',
              background: 'transparent',
              color: isLoading ? '#a1a1aa' : '#00ff88',
              border: isLoading ? '2px solid #1a1a1a' : '2px solid #00ff88',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Inter', sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '40px',
              marginBottom: '24px'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.background = '#00ff88';
                e.target.style.color = '#000000';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.background = 'transparent';
                e.target.style.color = '#00ff88';
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
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#71717a',
            margin: '0 0 8px 0',
            fontWeight: '500',
            textAlign: 'center',
            background: 'rgba(113, 113, 122, 0.08)',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(113, 113, 122, 0.15)'
          }}>
            🔒 Your data is processed locally and never stored on our servers
          </p>
          <p style={{
            fontSize: '12px',
            color: '#71717a',
            margin: '0'
          }}>
            Need help?{' '}
            <a href="#" style={{ 
              color: '#00ff88', 
              textDecoration: 'none',
              fontWeight: '500'
            }}>
              Check our setup guide
            </a>
          </p>
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
        
        @keyframes movingPoint {
          0% {
            opacity: 0;
            left: 6%;
            top: 65%;
          }
          5% {
            opacity: 1;
            left: 6%;
            top: 65%;
          }
          20% {
            opacity: 1;
            left: 18%;
            top: 40%;
          }
          35% {
            opacity: 1;
            left: 32%;
            top: 60%;
          }
          50% {
            opacity: 1;
            left: 48%;
            top: 30%;
          }
          65% {
            opacity: 1;
            left: 65%;
            top: 50%;
          }
          80% {
            opacity: 1;
            left: 82%;
            top: 20%;
          }
          90% {
            opacity: 1;
            left: 94%;
            top: 10%;
          }
          95% {
            opacity: 0.5;
            left: 94%;
            top: 10%;
          }
          100% {
            opacity: 0;
            left: 94%;
            top: 10%;
          }
        }
      `}</style>
    </div>
  );
};

export default GainTrackForm;