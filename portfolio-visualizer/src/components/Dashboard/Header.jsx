import { useState } from 'react';
import SectionTabs from './Navigation/SectionTabs';

const Header = ({
  theme,
  activeSection,
  onSectionChange,
  onBackToForm,
  sidebarOpen,
  onRefreshPrices,
  priceTimestamp,
  disabledOpsCount = 0
}) => {
  const [refreshState, setRefreshState] = useState('idle');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'warning'

  const handleRefresh = async () => {
    if (refreshState === 'loading' || !onRefreshPrices) return;
    setRefreshState('loading');
    const result = await onRefreshPrices();
    const isError = result?.error || result == null;
    const fromCache = result?.fromCache;
    const cacheAge = result?.cacheAge || 0;

    let state, msg;
    if (isError) {
      state = 'limited';
      msg = 'Error — backend unreachable';
    } else if (fromCache && cacheAge < 15) {
      state = 'success';
      msg = `Prices up to date (${cacheAge}s ago)`;
    } else if (fromCache) {
      state = 'limited';
      const ttlLeft = Math.max(0, 300 - cacheAge);
      msg = `Cached — next refresh in ~${ttlLeft}s`;
    } else {
      state = 'success';
      msg = 'Prices updated';
    }

    setRefreshState(state);
    setToastMessage(msg);
    setToastType(state === 'success' ? 'success' : 'warning');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
    setTimeout(() => setRefreshState('idle'), 1800);
  };

  const priceTime = priceTimestamp
    ? new Date(priceTimestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : null;

  const refreshColor = { idle: '#ffffff', loading: '#00ff88', success: '#00ff88', limited: '#f59e0b' }[refreshState];
  const refreshAnim  = { idle: 'none', loading: 'spin-refresh 0.7s linear infinite', success: 'spin-once 0.6s ease-out forwards', limited: 'shake-icon 0.5s ease-out forwards' }[refreshState];

  return (
    <>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '130px',
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${theme.borderColor}`,
        /* El menú se posiciona con paddingTop para tener margen arriba.
           Los botones se anclan al fondo con position:absolute bottom */
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '68px',   /* margen visible encima del menú */
        paddingRight: sidebarOpen ? '350px' : '0',
        transition: 'padding-right 0.45s cubic-bezier(0.4,0,0.2,1)',
        boxSizing: 'border-box',
      }}>

        {/* ← Back — anclado al fondo del header */}
        <button
          onClick={onBackToForm}
          style={{
            position: 'absolute',
            left: '2.5rem',
            bottom: '16px',
            background: 'none',
            border: 'none',
            borderBottom: '2px solid transparent',
            padding: '4px 0 3px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '20px',
            fontFamily: 'monospace',
            fontWeight: '600',
            color: '#ffffff',
            letterSpacing: '0.4px',
            transition: 'border-color 0.18s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.7)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderBottomColor = 'transparent'; }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Tabs — centro, se posicionan con paddingTop del padre */}
        <SectionTabs
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          theme={theme}
          disabledOpsCount={disabledOpsCount}
        />

        {/* Derecha — anclado al fondo del header */}
        <div style={{
          position: 'absolute',
          right: sidebarOpen ? '370px' : '2.5rem',
          bottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '22px',
          transition: 'right 0.45s cubic-bezier(0.4,0,0.2,1)',
        }}>

          {/* ↺ HH:MM */}
          <button
            onClick={handleRefresh}
            title={refreshState === 'limited' ? 'Límite — espera un momento' : 'Actualizar precios desde Kraken'}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 0',
              cursor: refreshState === 'loading' ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: refreshColor,
              transition: 'color 0.2s ease',
            }}
          >
            <svg
              width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke={refreshColor}
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: refreshAnim, flexShrink: 0, transition: 'stroke 0.2s ease' }}
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: '600', letterSpacing: '0.5px', color: 'inherit' }}>
              {refreshState === 'loading' ? '···' : (priceTime || '--:--')}
            </span>
          </button>

        </div>
      </div>

      {/* Toast "Prices updated" — fixed bottom-right */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'rgba(0, 0, 0, 0.92)',
          border: `1px solid ${toastType === 'warning' ? '#f59e0b' : '#00ff88'}`,
          borderRadius: '8px',
          padding: '10px 18px',
          fontSize: '13px',
          fontFamily: 'monospace',
          fontWeight: '600',
          color: toastType === 'warning' ? '#f59e0b' : '#00ff88',
          whiteSpace: 'nowrap',
          animation: 'toast-slide 2.2s ease-out forwards',
          pointerEvents: 'none',
          backdropFilter: 'blur(12px)',
          boxShadow: `0 0 20px ${toastMessage.includes('limited') ? 'rgba(245,158,11,0.3)' : 'rgba(0,255,136,0.3)'}`,
          zIndex: 99999,
        }}>
          {toastMessage}
        </div>
      )}

      <style>{`
        @keyframes spin-refresh { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes spin-once    { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes shake-icon {
          0%   { transform: translateX(0) rotate(0deg); }
          20%  { transform: translateX(-5px) rotate(-15deg); }
          40%  { transform: translateX(5px) rotate(15deg); }
          60%  { transform: translateX(-4px) rotate(-10deg); }
          80%  { transform: translateX(4px) rotate(10deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
        @keyframes toast-slide {
          0%   { opacity: 0; transform: translateY(-6px); }
          15%  { opacity: 1; transform: translateY(0); }
          75%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(4px); }
        }
      `}</style>
    </>
  );
};

export default Header;
