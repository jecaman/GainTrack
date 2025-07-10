import { useState } from 'react';

const ApiFormModern = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState({
    apiKey: '',
    secretKey: ''
  });
  const [activeTab, setActiveTab] = useState('api'); // 'api' or 'csv'
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
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        setCsvConfirmation({ show: true, progress: 100 });
        
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
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        position: 'relative'
      }}>
        {/* Header minimalista */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '48px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: '600',
            color: 'white',
            boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
          }}>
            ₿
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ffffff',
            margin: '0 0 8px',
            letterSpacing: '-0.025em'
          }}>
            Portfolio Visualizer
          </h1>
          <p style={{
            color: '#94a3b8',
            fontSize: '16px',
            margin: '0',
            fontWeight: '400'
          }}>
            Connect your Kraken account to analyze your portfolio
          </p>
        </div>

        {/* Formulario principal */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '32px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '32px'
          }}>
            <button
              onClick={() => setActiveTab('api')}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'api' ? '#667eea' : 'transparent',
                color: activeTab === 'api' ? 'white' : '#94a3b8',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              API Keys
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'csv' ? '#667eea' : 'transparent',
                color: activeTab === 'csv' ? 'white' : '#94a3b8',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              CSV Upload
            </button>
          </div>

          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#e2e8f0',
                  marginBottom: '8px'
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
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#e2e8f0',
                  marginBottom: '8px'
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
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: isLoading ? '#4a5568' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  transform: 'scale(1)',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                  }
                }}
              >
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Connecting...
                  </div>
                ) : (
                  'Connect Portfolio'
                )}
              </button>
            </form>
          )}

          {/* CSV Upload Tab */}
          {activeTab === 'csv' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                border: '2px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '48px 24px',
                marginBottom: '24px',
                transition: 'all 0.2s ease'
              }}>
                <input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '12px',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  📁
                </div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'white',
                  margin: '0 0 8px'
                }}>
                  Upload CSV File
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#94a3b8',
                  margin: '0 0 24px'
                }}>
                  Drop your Kraken trades CSV here or click to browse
                </p>
                <button
                  onClick={() => document.getElementById('csvFile').click()}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(102, 126, 234, 0.1)',
                    color: '#667eea',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(102, 126, 234, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(102, 126, 234, 0.1)';
                  }}
                >
                  Choose File
                </button>
              </div>
            </div>
          )}

          {/* Security note */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px',
            background: 'rgba(34, 197, 94, 0.05)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '12px',
            marginTop: '24px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              background: '#22c55e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'white',
              fontWeight: 'bold'
            }}>
              ✓
            </div>
            <span style={{
              fontSize: '13px',
              color: '#94a3b8',
              fontWeight: '400'
            }}>
              Your data is processed locally and never stored on our servers
            </span>
          </div>

          {/* Error display */}
          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Subtle help text */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px'
        }}>
          <p style={{
            fontSize: '13px',
            color: '#64748b',
            margin: '0'
          }}>
            Need help? Check the{' '}
            <a href="#" style={{ color: '#667eea', textDecoration: 'none' }}>
              API setup guide
            </a>
          </p>
        </div>

        {/* CSV Confirmation */}
        {csvConfirmation.show && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            minWidth: '280px',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                background: '#22c55e',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: 'white'
              }}>
                ✓
              </div>
              <span style={{
                fontSize: '14px',
                color: 'white',
                fontWeight: '500'
              }}>
                CSV uploaded successfully
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${csvConfirmation.progress}%`,
                height: '100%',
                background: '#22c55e',
                transition: 'width 0.05s linear'
              }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiFormModern;