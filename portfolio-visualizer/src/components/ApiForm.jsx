import { useState } from 'react';

const ApiForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    apiKey: '',
    secretKey: ''
  });
  const [showGuide, setShowGuide] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [csvConfirmation, setCsvConfirmation] = useState({ show: false, progress: 100 });

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
    if (file) {
      // Comprobar que es un archivo CSV
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        console.log('CSV file selected:', file.name);
        
        // Mostrar confirmación
        setCsvConfirmation({ show: true, progress: 100 });
        
        // Animar la barra de progreso
        const interval = setInterval(() => {
          setCsvConfirmation(prev => {
            if (prev.progress <= 0) {
              clearInterval(interval);
              setTimeout(() => setCsvConfirmation({ show: false, progress: 100 }), 100);
              return prev;
            }
            return { ...prev, progress: prev.progress - 2 };
          });
        }, 50);
        
        // Aquí iría la lógica para procesar el CSV
      }
    }
  };

  const toggleGuide = () => {
    if (showGuide) {
      // Iniciar animación de salida
      setIsClosing(true);
      // Esperar a que termine la animación antes de ocultar
      setTimeout(() => {
        setShowGuide(false);
        setIsClosing(false);
      }, 400); // Tiempo total de la animación de salida
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <div style={{ 
        width: '100%', 
        maxWidth: '675px', 
        margin: '0 auto',
        position: 'relative',
        '@media (max-width: 768px)': {
          maxWidth: '360px',
          width: '90%'
        }
      }}>
        {/* Bloque principal del formulario */}
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '24px',
          padding: '36px 65px 54px 65px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          '@media (max-width: 768px)': {
            padding: '28px 40px 42px 40px'
          }
        }}>
          {/* Botón de ayuda */}
          <button
            onClick={toggleGuide}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              border: '2px solid white',
              color: '#fff',
              fontSize: '24px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              zIndex: 10,
              textShadow: '0 0 5px rgba(255, 255, 255, 0.5)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(170, 0, 254, 0.2)';
              e.target.style.borderColor = '#aa00fe';
              e.target.style.color = '#aa00fe';
              e.target.style.transform = 'scale(1.15)';
              e.target.style.boxShadow = '0 0 20px rgba(170, 0, 254, 0.6)';
              e.target.style.textShadow = '0 0 12px rgba(170, 0, 254, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = 'white';
              e.target.style.color = '#fff';
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = 'none';
              e.target.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.5)';
            }}
          >
            ?
          </button>

          {/* Título del formulario */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ 
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '54px',
              fontFamily: 'JetBrains Mono, monospace',
              whiteSpace: 'nowrap',
              '@media (max-width: 768px)': {
                fontSize: '28px',
                marginBottom: '40px'
              }
            }}>
              Connect Your Portfolio
            </h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '45px' }}>
            {/* Campo API Key */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '14px', width: '100%' }}>
              <label htmlFor="apiKey" style={{
                fontSize: '22px',
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'JetBrains Mono, monospace',
                '@media (max-width: 768px)': {
                  fontSize: '20px'
                }
              }}>
                🔑 API Key
              </label>

              <input
                id="apiKey"
                type="text"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleChange}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  height: '66px',
                  padding: '0 26px',
                  backgroundColor: '#2d2d2d',
                  border: '2px solid #4b5563',
                  borderRadius: '17px',
                  color: 'white',
                  fontSize: '19px',
                  fontWeight: '500',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontFamily: 'JetBrains Mono, monospace',
                  textAlign: 'left',
                  boxSizing: 'border-box',
                  '@media (max-width: 768px)': {
                    height: '56px',
                    fontSize: '16px',
                    padding: '0 20px'
                  }
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#aa00fe';
                  e.target.style.boxShadow = '0 0 0 3px rgba(170, 0, 254, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#4b5563';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Your Kraken API Key"
                required
              />
            </div>

            {/* Campo API Secret */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '14px', width: '100%' }}>
              <label htmlFor="secretKey" style={{
                fontSize: '22px',
                fontWeight: '600',
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'JetBrains Mono, monospace',
                '@media (max-width: 768px)': {
                  fontSize: '18px'
                }
              }}>
                🔒 API Secret
              </label>

              <input
                id="secretKey"
                type="password"
                name="secretKey"
                value={formData.secretKey}
                onChange={handleChange}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  height: '66px',
                  padding: '0 26px',
                  backgroundColor: '#2d2d2d',
                  border: '2px solid #4b5563',
                  borderRadius: '17px',
                  color: 'white',
                  fontSize: '19px',
                  fontWeight: '500',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontFamily: 'JetBrains Mono, monospace',
                  textAlign: 'left',
                  boxSizing: 'border-box',
                  '@media (max-width: 768px)': {
                    height: '56px',
                    fontSize: '16px',
                    padding: '0 20px'
                  }
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#aa00fe';
                  e.target.style.boxShadow = '0 0 0 3px rgba(170, 0, 254, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#4b5563';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Your Kraken API Secret"
                required
              />
            </div>

            {/* Línea divisoria con OR */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              margin: '18px 0'
            }}>
              <div style={{
                flex: 1,
                height: '1px',
                backgroundColor: '#4b5563'
              }}></div>
              <span style={{
                color: 'white',
                fontSize: '19px',
                fontWeight: '600',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '0 18px',
                '@media (max-width: 768px)': {
                  fontSize: '16px',
                  padding: '0 14px'
                }
              }}>
                OR
              </span>
              <div style={{
                flex: 1,
                height: '1px',
                backgroundColor: '#4b5563'
              }}></div>
            </div>

            {/* Botón Upload CSV */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
              <input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              
              <button
                type="button"
                onClick={() => document.getElementById('csvFile').click()}
                style={{
                  width: '60%',
                  height: '80px',
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '22px',
                  borderRadius: '17px',
                  border: '2px solid #4b5563',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'JetBrains Mono, monospace',
                  textTransform: 'uppercase',
                  transform: 'scale(1)',
                  '@media (max-width: 768px)': {
                    width: '70%',
                    height: '70px',
                    fontSize: '18px'
                  }
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2a2a2a';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#1a1a1a';
                  e.target.style.transform = 'scale(1)';
                }}
                onMouseDown={(e) => {
                  e.target.style.transform = 'scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.target.style.transform = 'scale(1.02)';
                }}
              >
                📁 UPLOAD CSV FILE
              </button>
            </div>

            {/* Botón Fetch Portfolio o loader */}
            <div style={{ paddingTop: '22px', width: '100%' }}>
              {isLoading ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  width: '100%'
                }}>
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Brillo por fuera */}
                    <div style={{
                      position: 'absolute',
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(170, 0, 254, 0.3) 0%, transparent 70%)',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}></div>
                    {/* Bitcoin girando */}
                    <img 
                      src="/bitcoin.svg" 
                      alt="Loading" 
                      style={{
                        width: '48px',
                        height: '48px',
                        animation: 'spin 1s linear infinite',
                        filter: 'drop-shadow(0 0 8px rgba(170, 0, 254, 0.6))'
                      }}
                    />
                  </div>
                  <span style={{
                    color: 'white',
                    fontSize: '18px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: '500'
                  }}>
                    Connecting to Kraken...
                  </span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    height: '82px',
                    backgroundColor: '#aa00fe',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '26px',
                    borderRadius: '22px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    transform: 'scale(1)',
                    fontFamily: 'JetBrains Mono, monospace',
                    '@media (max-width: 768px)': {
                      height: '72px',
                      fontSize: '22px'
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.target.style.backgroundColor = '#8a00d4';
                      e.target.style.transform = 'scale(1.02)';
                      e.target.style.boxShadow = '0 0 10px rgba(170, 0, 254, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.target.style.backgroundColor = '#aa00fe';
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                  onMouseDown={(e) => {
                    if (!isLoading) {
                      e.target.style.transform = 'scale(0.98)';
                    }
                  }}
                  onMouseUp={(e) => {
                    if (!isLoading) {
                      e.target.style.transform = 'scale(1.02)';
                    }
                  }}
                >
                  Fetch Portfolio
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Nota de seguridad fuera del formulario */}
        <div style={{
          marginTop: '22px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          <p style={{ 
            color: 'white', 
            fontSize: '19px',
            fontFamily: 'JetBrains Mono, monospace',
            margin: '0',
            '@media (max-width: 768px)': {
              fontSize: '16px'
            }
          }}>
            🔒 Your data is stored locally and never sent to our servers
          </p>
        </div>

        {/* Guía paso a paso - Rediseñada con dos columnas */}
        {(showGuide || isClosing) && (
          <div className="step-guide-container" style={{
            position: 'absolute',
            top: '0',
            left: '100%',
            marginLeft: '20px',
            width: '750px',
            padding: '0',
            zIndex: 1000,
            animation: isClosing ? 'fadeOut 0.4s ease-in-out' : 'fadeIn 0.2s ease-in-out'
          }}>
            {/* Contenedor de dos columnas */}
            <div className="step-guide-columns" style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'flex-start',
              alignItems: 'stretch'
            }}>
              {/* Opción 1: Kraken API Keys */}
              <div style={{
                flex: 1,
                minWidth: 570,
                borderRadius: '14px',
                padding: '24px',
                animation: isClosing ? 'fadeOut 0.4s ease-in-out 0.05s both' : 'fadeIn 0.25s ease-in-out 0.05s both'
              }}>
                {/* Header de la opción */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '32px',
                  gap: '16px'
                }}>
                  <div style={{ minWidth: '0', flex: '1' }}>
                    <h4 style={{
                      fontSize: '26px',
                      fontWeight: 'bold',
                      color: 'white',
                      margin: '0 0 5px -20px',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}>
                      🔑 Option 1: Kraken API Keys
                    </h4>
                  </div>
                </div>

                {/* Pasos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative', marginLeft: '24px' }}>
                  {/* Línea vertical conectando los pasos */}
                  <div style={{
                    position: 'absolute',
                    left: '21px',
                    top: '32px',
                    bottom: '35px',
                    width: '1px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    zIndex: 1
                  }}></div>

                  {/* Línea horizontal conectando el header con el primer paso */}
                  <div style={{
                    position: 'absolute',
                    left: '21px',
                    top: '32px',
                    width: '18px',
                    height: '1px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    zIndex: 1
                  }}></div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', position: 'relative', zIndex: 2, animation: isClosing ? 'fadeOut 0.4s ease-in-out 0.15s both' : 'fadeIn 0.3s ease-in-out 0.1s both' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      backgroundColor: 'white',
                      color: 'black',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      marginTop: '3px'
                    }}>
                      1
                    </div>
                    <div style={{ color: 'white', fontSize: '22px', lineHeight: '1.6', minWidth: '0', flex: '1', textAlign: 'left' }}>
                      Go to <a href="https://pro.kraken.com/app/settings/api" target="_blank" rel="noopener noreferrer" style={{ color: '#aa00fe', textDecoration: 'underline' }}>pro.kraken.com › Settings › API</a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', position: 'relative', zIndex: 2, animation: isClosing ? 'fadeOut 0.4s ease-in-out 0.1s both' : 'fadeIn 0.3s ease-in-out 0.2s both' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      backgroundColor: 'white',
                      color: 'black',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      marginTop: '3px'
                    }}>
                      2
                    </div>
                    <div style={{ color: '#d1d5db', fontSize: '22px', lineHeight: '1.6', minWidth: '0', flex: '1', textAlign: 'left' }}>
                      Click <strong style={{ color: 'white' }}>"Create API Key"</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', position: 'relative', zIndex: 2, animation: isClosing ? 'fadeOut 0.4s ease-in-out 0.05s both' : 'fadeIn 0.3s ease-in-out 0.3s both' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      backgroundColor: 'white',
                      color: 'black',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      marginTop: '3px'
                    }}>
                      3
                    </div>
                    <div style={{ color: '#d1d5db', fontSize: '22px', lineHeight: '1.6', minWidth: '0', flex: '1', textAlign: 'left' }}>
                      Enable <strong style={{ color: 'white' }}>only</strong> these permissions:
                      <div style={{ marginTop: '16px', marginLeft: '24px' }}>
                        <div style={{ color: '#d1d5db', fontSize: '20px', marginBottom: '8px' }}>
                          • Funds permissions › <strong style={{ color: 'white' }}>Query</strong>
                        </div>
                        <div style={{ color: '#d1d5db', fontSize: '20px' }}>
                          • Orders and trades › <strong style={{ color: 'white' }}>Query open orders & trades</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', position: 'relative', zIndex: 2, animation: isClosing ? 'fadeOut 0.4s ease-in-out both' : 'fadeIn 0.3s ease-in-out 0.4s both' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      backgroundColor: 'white',
                      color: 'black',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      marginTop: '3px'
                    }}>
                      4
                    </div>
                    <div style={{ color: '#d1d5db', fontSize: '22px', lineHeight: '1.6', minWidth: '0', flex: '1', textAlign: 'left' }}>
                      Paste your <strong style={{ color: 'white' }}>API Key</strong> and <strong style={{ color: 'white' }}>API Secret</strong> into the form
                    </div>
                  </div>
                </div>

                {/* Línea divisoria vertical con degradado elegante */}
                <div style={{
                    width: '1px',
                    height: '650px',
                    position: 'absolute',
                    right: '-23px',
                    top: '0',
                    zIndex: 1,
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.05))'
                }}></div>
              </div>

              {/* Opción 2: Upload a CSV */}
              <div style={{
                flex: 1,
                minWidth: 550,
                borderRadius: '14px',
                marginLeft: '30px',
                padding: '24px',
                animation: isClosing ? 'fadeOut 0.4s ease-in-out 0.05s both' : 'fadeIn 0.25s ease-in-out 0.05s both'
              }}>
                {/* Header de la opción */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '32px',
                  gap: '16px'
                }}>
                  <div style={{ minWidth: '0', flex: '1' }}>
                    <h4 style={{
                      fontSize: '26px',
                      fontWeight: 'bold',
                      color: 'white',
                      margin: '0 0 5px 0px',
                      marginLeft: '-60px',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}>
                      📄 Option 2: Upload a CSV
                    </h4>
                  </div>
                </div>

                {/* Pasos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative', marginLeft: '24px' }}>
                  {/* Línea vertical conectando los pasos */}
                  <div style={{
                    position: 'absolute',
                    left: '21px',
                    top: '32px',
                    bottom: '35px',
                    width: '1px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    zIndex: 1
                  }}></div>

                  {/* Línea horizontal conectando el header con el primer paso */}
                  <div style={{
                    position: 'absolute',
                    left: '21px',
                    top: '32px',
                    width: '18px',
                    height: '1px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    zIndex: 1
                  }}></div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', position: 'relative', zIndex: 2, animation: isClosing ? 'fadeOut 0.4s ease-in-out 0.15s both' : 'fadeIn 0.3s ease-in-out 0.1s both' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      backgroundColor: 'white',
                      color: 'black',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      marginTop: '3px'
                    }}>
                      1
                    </div>
                    <div style={{ color: 'white', fontSize: '22px', lineHeight: '1.6', minWidth: '0', flex: '1', textAlign: 'left' }}>
                      Go to <a href="https://pro.kraken.com/app/settings/documents" target="_blank" rel="noopener noreferrer" style={{ color: '#aa00fe', textDecoration: 'underline' }}>kraken.com/u/history/export</a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', position: 'relative', zIndex: 2, animation: isClosing ? 'fadeOut 0.4s ease-in-out 0.1s both' : 'fadeIn 0.3s ease-in-out 0.2s both' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      backgroundColor: 'white',
                      color: 'black',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      marginTop: '3px'
                    }}>
                      2
                    </div>
                    <div style={{ color: '#d1d5db', fontSize: '22px', lineHeight: '1.6', minWidth: '0', flex: '1', textAlign: 'left' }}>
                      Click <strong style={{ color: 'white' }}>"Create Export"</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', position: 'relative', zIndex: 2, animation: isClosing ? 'fadeOut 0.4s ease-in-out 0.05s both' : 'fadeIn 0.3s ease-in-out 0.3s both' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      backgroundColor: 'white',
                      color: 'black',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      marginTop: '3px'
                    }}>
                      3
                    </div>
                    <div style={{ color: '#d1d5db', fontSize: '22px', lineHeight: '1.6', minWidth: '0', flex: '1', textAlign: 'left' }}>
                      Select <strong style={{ color: 'white' }}>"Trades"</strong> as type
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', position: 'relative', zIndex: 2, animation: isClosing ? 'fadeOut 0.4s ease-in-out both' : 'fadeIn 0.3s ease-in-out 0.4s both' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      backgroundColor: 'white',
                      color: 'black',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      marginTop: '3px'
                    }}>
                      4
                    </div>
                    <div style={{ color: '#d1d5db', fontSize: '22px', lineHeight: '1.6', minWidth: '0', flex: '1', textAlign: 'left' }}>
                      Download and <strong style={{ color: 'white' }}>upload</strong> it here
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmación CSV - Esquina inferior derecha */}
      {csvConfirmation.show && (
        <div style={{
          position: 'fixed',
          bottom: '40px',
          right: '40px',
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          minWidth: '380px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              backgroundColor: '#22c55e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              ✓
            </div>
            <span style={{
              color: 'white',
              fontSize: '20px',
              fontWeight: '600',
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              CSV cargado correctamente
            </span>
          </div>
          
          {/* Barra de progreso */}
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${csvConfirmation.progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #22c55e, #16a34a)',
              borderRadius: '3px',
              transition: 'width 0.05s linear'
            }}></div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApiForm; 